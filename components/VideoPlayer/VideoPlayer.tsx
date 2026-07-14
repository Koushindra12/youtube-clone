'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal,
  Bell, CheckCircle2, ChevronDown, ChevronUp, Crown, Check, Clock, Lock,
  Play, Pause, Volume2, VolumeX, Maximize, SkipForward,
  FastForward, Rewind, MessageSquare, X as XIcon,
} from 'lucide-react';
import { Video, Channel, Comment } from '@/types';
import { useUser, PLAN_WATCH_LIMITS } from '@/context/UserContext';
import VideoCard from '@/components/VideoCard/VideoCard';
import CommentSection from '@/components/CommentSection/CommentSection';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  video: Video;
  channel: Channel;
  comments: Comment[];
  related: Video[];
}

type FeedbackType = 'seek-forward' | 'seek-back' | 'play' | 'pause' | 'next' | 'comments' | 'close' | null;

export default function VideoPlayer({ video, channel, comments, related }: VideoPlayerProps) {
  const router = useRouter();

  // ── existing state ──────────────────────────────────────────
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [downloadToast, setDownloadToast] = useState<'success' | 'already' | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch time enforcement
  const [watchElapsed, setWatchElapsed] = useState(0);
  const [timeLimitHit, setTimeLimitHit] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { downloadVideo, plan, downloads, canDownload, setShowPremiumModal, watchLimitMinutes } = useUser();

  const isDownloaded = downloads.some((d) => d.id === video.id);
  const isUnlimited = watchLimitMinutes === Infinity;
  const limitSeconds = isUnlimited ? Infinity : watchLimitMinutes * 60;

  const timeRemaining = Math.max(0, limitSeconds - watchElapsed);
  const minutesLeft = Math.floor(timeRemaining / 60);
  const secondsLeft = Math.floor(timeRemaining % 60);
  const showTimeBanner = !isUnlimited && !timeLimitHit && watchElapsed > 0;
  const isWarning = !isUnlimited && timeRemaining <= 60 && timeRemaining > 0;

  useEffect(() => {
    setWatchElapsed(0);
    setTimeLimitHit(false);
    setVideoError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [video.id]);

  const handleTimeUpdate = useCallback(() => {
    if (timeLimitHit || isUnlimited) return;
    const vid = videoRef.current;
    if (!vid) return;
    const elapsed = vid.currentTime;
    setWatchElapsed(elapsed);
    if (elapsed >= limitSeconds) {
      vid.pause();
      setTimeLimitHit(true);
      setShowPremiumModal(true);
    }
  }, [timeLimitHit, isUnlimited, limitSeconds, setShowPremiumModal]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // start muted to satisfy autoplay policy
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  // Fix React muted prop bug — React doesn't reflect muted to the DOM attribute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Attempt autoplay — wait for canplay so the source is confirmed valid
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || timeLimitHit) return;

    // Always start muted (browser autoplay policy)
    vid.muted = true;

    let cancelled = false;

    const attemptPlay = () => {
      if (cancelled) return;
      const p = vid.play();
      if (p !== undefined) {
        p.catch(() => {
          if (!cancelled) setIsPlaying(false);
        });
      }
    };

    if (vid.readyState >= 3) {
      attemptPlay();
    } else {
      vid.addEventListener('canplay', attemptPlay, { once: true });
    }

    return () => {
      cancelled = true;
      vid.removeEventListener('canplay', attemptPlay);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  // ── gesture state ───────────────────────────────────────────
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackKey, setFeedbackKey] = useState(0); // force re-animation
  const leftTaps = useRef(0);
  const centerTaps = useRef(0);
  const rightTaps = useRef(0);
  const leftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TAP_WINDOW = 300; // ms

  // ── helpers ─────────────────────────────────────────────────
  const showFeedback = useCallback((type: FeedbackType) => {
    setFeedback(type);
    setFeedbackKey((k) => k + 1);
    setTimeout(() => setFeedback(null), 900);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // ── video events ────────────────────────────────────────────
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleDurationChange = () => {
    if (videoRef.current) setDuration(videoRef.current.duration || 0);
  };
  const handleProgress = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };
  const handleVideoTimeUpdate = useCallback(() => {
    handleTimeUpdate();
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, [handleTimeUpdate]);

  // ── control bar actions ──────────────────────────────────────
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      const p = vid.play();
      if (p !== undefined) p.catch(() => setIsPlaying(false));
      showFeedback('play');
    } else {
      vid.pause();
      showFeedback('pause');
    }
  }, [showFeedback]);

  const seekBy = useCallback((seconds: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.currentTime + seconds, vid.duration || 0));
    showFeedback(seconds > 0 ? 'seek-forward' : 'seek-back');
  }, [showFeedback]);

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  };

  const toggleFullscreen = () => {
    const wrapper = playerWrapperRef.current;
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSeekBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    if (!vid) return;
    const t = Number(e.target.value);
    vid.currentTime = t;
    setCurrentTime(t);
  };

  // ── skip to next video ───────────────────────────────────────
  const skipToNext = useCallback(() => {
    showFeedback('next');
    const next = related[0];
    if (next) {
      setTimeout(() => router.push(`/watch?v=${next.id}`), 600);
    }
  }, [related, router, showFeedback]);

  // ── open comments ─────────────────────────────────────────────
  const openComments = useCallback(() => {
    showFeedback('comments');
    setTimeout(() => {
      const el = document.getElementById('comment-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [showFeedback]);

  // ── close (go back) ──────────────────────────────────────────
  const closeSite = useCallback(() => {
    showFeedback('close');
    setTimeout(() => router.back(), 600);
  }, [router, showFeedback]);

  // ── gesture handlers ─────────────────────────────────────────
  const handleLeftTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    leftTaps.current += 1;
    if (leftTimer.current) clearTimeout(leftTimer.current);
    leftTimer.current = setTimeout(() => {
      const count = leftTaps.current;
      leftTaps.current = 0;
      if (count === 2) seekBy(-10);
      else if (count >= 3) openComments();
    }, TAP_WINDOW);
  }, [seekBy, openComments]);

  const handleCenterTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    centerTaps.current += 1;
    if (centerTimer.current) clearTimeout(centerTimer.current);
    centerTimer.current = setTimeout(() => {
      const count = centerTaps.current;
      centerTaps.current = 0;
      if (count === 1) togglePlay();
      else if (count >= 3) skipToNext();
    }, TAP_WINDOW);
  }, [togglePlay, skipToNext]);

  const handleRightTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    rightTaps.current += 1;
    if (rightTimer.current) clearTimeout(rightTimer.current);
    rightTimer.current = setTimeout(() => {
      const count = rightTaps.current;
      rightTaps.current = 0;
      if (count === 2) seekBy(10);
      else if (count >= 3) closeSite();
    }, TAP_WINDOW);
  }, [seekBy, closeSite]);

  // Show controls when player is hovered / touched
  const handlePlayerMouseMove = useCallback(() => resetControlsTimer(), [resetControlsTimer]);

  // Autoplay and show controls initially
  useEffect(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  // ── like / dislike / download ────────────────────────────────
  const handleLike = () => {
    setLikeAnimating(true);
    setLiked((v) => !v);
    if (disliked) setDisliked(false);
    setTimeout(() => setLikeAnimating(false), 500);
  };

  const handleDislike = () => {
    setDisliked((v) => !v);
    if (liked) setLiked(false);
  };

  const showToast = useCallback((type: 'success' | 'already') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setDownloadToast(type);
    toastTimer.current = setTimeout(() => setDownloadToast(null), 3000);
  }, []);

  const handleDownload = () => {
    if (!canDownload && plan === 'free') {
      setShowPremiumModal(true);
      return;
    }
    const success = downloadVideo(video);
    if (success) showToast(isDownloaded ? 'already' : 'success');
  };

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  // Progress percentage for seek bar
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.container}>
      {/* Download Toast */}
      {downloadToast && (
        <div className={`${styles.toast} ${styles[downloadToast]}`}>
          <Check size={16} />
          {downloadToast === 'success' ? 'Video saved to Downloads!' : 'Already in your Downloads'}
        </div>
      )}

      {/* Main Content */}
      <div className={styles.main}>
        {/* ── Video Player ── */}
        <div
          className={styles.playerWrapper}
          ref={playerWrapperRef}
          onMouseMove={handlePlayerMouseMove}
          onTouchStart={handlePlayerMouseMove}
        >
          {timeLimitHit ? (
            <div className={styles.timeLimitOverlay}>
              <div className={styles.timeLimitContent}>
                <Lock size={40} className={styles.timeLimitLock} />
                <h3>Watch Time Limit Reached</h3>
                <p>
                  Your <strong>{planLabel}</strong> plan allows{' '}
                  {isUnlimited ? 'unlimited' : `${watchLimitMinutes} min`} per video.
                </p>
                <button
                  className={styles.timeLimitUpgradeBtn}
                  onClick={() => setShowPremiumModal(true)}
                  id="time-limit-upgrade-btn"
                >
                  <Crown size={16} />
                  Upgrade for More Watch Time
                </button>
                <button
                  className={styles.timeLimitResumeBtn}
                  onClick={() => {
                    setTimeLimitHit(false);
                    setWatchElapsed(0);
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                    }
                  }}
                  id="time-limit-restart-btn"
                >
                  Restart from Beginning
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Actual video — key forces full remount on video change */}
              <video
                key={video.id}
                ref={videoRef}
                className={styles.player}
                src={video.videoUrl}
                poster={video.thumbnail}
                onTimeUpdate={handleVideoTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                onDurationChange={handleDurationChange}
                onProgress={handleProgress}
                onLoadedMetadata={handleDurationChange}
                onError={() => setVideoError(true)}
                playsInline
                preload="auto"
              />

              {/* Video load error fallback */}
              {videoError && (
                <div className={styles.videoErrorOverlay}>
                  <span className={styles.videoErrorIcon}>⚠️</span>
                  <p>Unable to load video</p>
                  <span>The video source could not be played in your browser.</span>
                  <button
                    className={styles.retryBtn}
                    onClick={() => {
                      setVideoError(false);
                      const vid = videoRef.current;
                      if (vid) { vid.load(); }
                    }}
                  >
                    ↺ Retry
                  </button>
                </div>
              )}

              {/* Muted nudge — shows briefly when video starts muted */}
              {isMuted && isPlaying && (
                <div className={styles.mutedNudge} onClick={toggleMute}>
                  <VolumeX size={16} />
                  <span>Muted — click to unmute</span>
                </div>
              )}

              {/* ── Gesture Zones ── */}
              <div className={styles.gestureLayer}>
                {/* Left Zone */}
                <div
                  className={styles.gestureLeft}
                  onClick={handleLeftTap}
                  onTouchEnd={handleLeftTap}
                  aria-label="Double-tap to seek back 10s, triple-tap to open comments"
                  role="button"
                  tabIndex={0}
                />

                {/* Center Zone */}
                <div
                  className={styles.gestureCenter}
                  onClick={handleCenterTap}
                  onTouchEnd={handleCenterTap}
                  aria-label="Tap to play/pause, triple-tap for next video"
                  role="button"
                  tabIndex={0}
                />

                {/* Right Zone */}
                <div
                  className={styles.gestureRight}
                  onClick={handleRightTap}
                  onTouchEnd={handleRightTap}
                  aria-label="Double-tap to seek forward 10s, triple-tap to go back"
                  role="button"
                  tabIndex={0}
                />
              </div>

              {/* ── Feedback Overlays ── */}
              {feedback === 'seek-back' && (
                <div key={`sb-${feedbackKey}`} className={`${styles.seekFeedback} ${styles.seekFeedbackLeft}`}>
                  <Rewind size={28} />
                  <span>−10s</span>
                </div>
              )}
              {feedback === 'seek-forward' && (
                <div key={`sf-${feedbackKey}`} className={`${styles.seekFeedback} ${styles.seekFeedbackRight}`}>
                  <FastForward size={28} />
                  <span>+10s</span>
                </div>
              )}
              {feedback === 'play' && (
                <div key={`pl-${feedbackKey}`} className={styles.centerFeedback}>
                  <Play size={40} fill="white" />
                </div>
              )}
              {feedback === 'pause' && (
                <div key={`pa-${feedbackKey}`} className={styles.centerFeedback}>
                  <Pause size={40} fill="white" />
                </div>
              )}
              {feedback === 'next' && (
                <div key={`nx-${feedbackKey}`} className={styles.centerFeedback}>
                  <SkipForward size={40} fill="white" />
                  <span className={styles.feedbackLabel}>Next Video</span>
                </div>
              )}
              {feedback === 'comments' && (
                <div key={`cm-${feedbackKey}`} className={`${styles.seekFeedback} ${styles.seekFeedbackLeft}`}>
                  <MessageSquare size={28} />
                  <span>Comments</span>
                </div>
              )}
              {feedback === 'close' && (
                <div key={`cl-${feedbackKey}`} className={`${styles.seekFeedback} ${styles.seekFeedbackRight}`}>
                  <XIcon size={28} />
                  <span>Going back…</span>
                </div>
              )}

              {/* ── Gesture Hint Badges (shown briefly) ── */}
              <div className={`${styles.gestureHints} ${showControls ? styles.hintsVisible : ''}`}>
                <span className={styles.hintBadge}>
                  <MessageSquare size={10} /> ×3
                </span>
                <span className={styles.hintBadge} style={{ opacity: 0 }}>·</span>
                <span className={styles.hintBadge}>
                  ×3 <XIcon size={10} />
                </span>
              </div>

              {/* ── Custom Control Bar ── */}
              <div className={`${styles.controls} ${showControls ? styles.controlsVisible : ''}`}>
                {/* Progress Bar */}
                <div className={styles.progressWrapper}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPct}%` }}
                  />
                  <input
                    type="range"
                    className={styles.seekBar}
                    min={0}
                    max={duration || 100}
                    step={0.5}
                    value={currentTime}
                    onChange={handleSeekBar}
                    aria-label="Seek"
                    id="video-seek-bar"
                  />
                </div>

                {/* Buttons Row */}
                <div className={styles.controlsRow}>
                  <div className={styles.controlsLeft}>
                    <button
                      className={styles.ctrlBtn}
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      id="ctrl-playpause"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                      className={styles.ctrlBtn}
                      onClick={() => seekBy(-10)}
                      aria-label="Seek back 10s"
                      id="ctrl-seek-back"
                    >
                      <Rewind size={18} />
                    </button>
                    <button
                      className={styles.ctrlBtn}
                      onClick={() => seekBy(10)}
                      aria-label="Seek forward 10s"
                      id="ctrl-seek-forward"
                    >
                      <FastForward size={18} />
                    </button>
                    <button
                      className={styles.ctrlBtn}
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      id="ctrl-mute"
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span className={styles.timeDisplay}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className={styles.controlsRight}>
                    <button
                      className={styles.ctrlBtn}
                      onClick={skipToNext}
                      aria-label="Next video"
                      id="ctrl-next"
                    >
                      <SkipForward size={18} />
                    </button>
                    <button
                      className={styles.ctrlBtn}
                      onClick={toggleFullscreen}
                      aria-label="Fullscreen"
                      id="ctrl-fullscreen"
                    >
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Watch time banner */}
        {showTimeBanner && (
          <div className={`${styles.watchBanner} ${isWarning ? styles.watchBannerWarning : ''}`}>
            <Clock size={13} />
            <span>
              {isWarning
                ? `⚠️ ${minutesLeft}m ${secondsLeft.toString().padStart(2, '0')}s remaining on your ${planLabel} plan`
                : `${planLabel} plan: ${minutesLeft}m ${secondsLeft.toString().padStart(2, '0')}s left`}
            </span>
            {isWarning && (
              <button
                className={styles.watchBannerUpgrade}
                onClick={() => setShowPremiumModal(true)}
                id="watch-banner-upgrade-btn"
              >
                <Crown size={12} /> Upgrade
              </button>
            )}
          </div>
        )}

        {/* Plan limit info for free users */}
        {!showTimeBanner && !timeLimitHit && !isUnlimited && watchElapsed === 0 && (
          <div className={styles.watchLimitInfo}>
            <Clock size={13} />
            <span>
              {planLabel} plan: up to <strong>{watchLimitMinutes} minutes</strong> per video
            </span>
            {plan !== 'gold' && (
              <button
                className={styles.watchBannerUpgrade}
                onClick={() => setShowPremiumModal(true)}
                id="watch-info-upgrade-btn"
              >
                <Crown size={12} /> Upgrade
              </button>
            )}
          </div>
        )}

        {/* Video Info */}
        <div className={styles.videoInfo}>
          <div className={styles.categoryTag}>{video.category}</div>
          <h1 className={styles.title}>{video.title}</h1>

          {/* Channel + Actions Row */}
          <div className={styles.actionRow}>
            <Link href={`/channel/${video.channelId}`} className={styles.channelInfo}>
              <img src={channel.avatar} alt={channel.name} className={styles.channelAvatar} width={40} height={40} />
              <div className={styles.channelMeta}>
                <div className={styles.channelNameRow}>
                  <span className={styles.channelName}>{channel.name}</span>
                  {channel.verified && <CheckCircle2 size={14} className={styles.verified} />}
                </div>
                <span className={styles.subCount}>{channel.subscribers} subscribers</span>
              </div>
            </Link>

            <button
              className={`${styles.subscribeBtn} ${subscribed ? styles.subscribed : ''}`}
              onClick={() => setSubscribed((v) => !v)}
              id="subscribe-btn"
            >
              {subscribed ? (<><Bell size={16} />Subscribed</>) : 'Subscribe'}
            </button>

            <div className={styles.actionBtns}>
              <div className={styles.likeGroup}>
                <button
                  className={`${styles.likeBtn} ${liked ? styles.liked : ''} ${likeAnimating ? styles.animating : ''}`}
                  onClick={handleLike}
                  aria-label="Like"
                  id="like-btn"
                >
                  <ThumbsUp size={18} />
                  <span>{liked ? (video.likeCount + 1).toLocaleString() : video.likes}</span>
                </button>
                <div className={styles.separator} />
                <button
                  className={`${styles.dislikeBtn} ${disliked ? styles.disliked : ''}`}
                  onClick={handleDislike}
                  aria-label="Dislike"
                  id="dislike-btn"
                >
                  <ThumbsDown size={18} />
                </button>
              </div>

              <button className={styles.actionBtn} aria-label="Share">
                <Share2 size={18} />
                <span>Share</span>
              </button>

              <button
                className={`${styles.actionBtn} ${isDownloaded ? styles.downloaded : ''} ${!canDownload && plan === 'free' ? styles.locked : ''}`}
                onClick={handleDownload}
                aria-label="Download"
                id="download-btn"
                title={plan === 'gold' ? 'Download video' : canDownload ? 'Download (1 free per day)' : 'Upgrade for unlimited downloads'}
              >
                {!canDownload && plan === 'free' ? <Crown size={18} /> : isDownloaded ? <Check size={18} /> : <Download size={18} />}
                <span>{!canDownload && plan === 'free' ? 'Upgrade' : isDownloaded ? 'Saved' : 'Download'}</span>
              </button>

              <button className={styles.moreBtn} aria-label="More actions">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className={`${styles.description} ${showMore ? styles.expanded : ''}`}>
            <div className={styles.descStats}>
              <span>{video.views}</span>
              <span>•</span>
              <span>{video.uploadedAt}</span>
              {video.tags.map((tag) => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
            <p className={styles.descText}>{video.description}</p>
            <button className={styles.showMoreBtn} onClick={() => setShowMore((v) => !v)}>
              {showMore ? (<><ChevronUp size={14} /> Show less</>) : (<><ChevronDown size={14} /> Show more</>)}
            </button>
          </div>
        </div>

        {/* Gesture Guide */}
        <div className={styles.gestureGuide}>
          <div className={styles.gestureGuideTitle}>✋ Gesture Controls</div>
          <div className={styles.gestureGuideGrid}>
            <div className={styles.gestureItem}>
              <span className={styles.gestureBadge}>×2 Left</span>
              <span>−10s</span>
            </div>
            <div className={styles.gestureItem}>
              <span className={styles.gestureBadge}>×1 Center</span>
              <span>Play / Pause</span>
            </div>
            <div className={styles.gestureItem}>
              <span className={styles.gestureBadge}>×2 Right</span>
              <span>+10s</span>
            </div>
            <div className={styles.gestureItem}>
              <span className={styles.gestureBadge}>×3 Left</span>
              <span>Open Comments</span>
            </div>
            <div className={styles.gestureItem}>
              <span className={styles.gestureBadge}>×3 Center</span>
              <span>Next Video</span>
            </div>
            <div className={styles.gestureItem}>
              <span className={styles.gestureBadge}>×3 Right</span>
              <span>Go Back</span>
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection comments={comments} commentCount="8" />
      </div>

      {/* Sidebar - Related */}
      <aside className={styles.sidebar}>
        <h3 className={styles.relatedTitle}>Up next</h3>
        <div className={styles.relatedList}>
          {related.map((v) => (
            <VideoCard key={v.id} video={v} compact />
          ))}
        </div>
      </aside>
    </div>
  );
}
