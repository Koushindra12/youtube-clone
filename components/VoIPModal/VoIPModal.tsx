'use client';
import { useEffect, useRef } from 'react';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  CircleDot, PhoneOff, Phone, PhoneIncoming, UserCircle2,
} from 'lucide-react';
import { useVoIP } from '@/context/VoIPContext';
import styles from './VoIPModal.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Video tile component ─────────────────────────────────────────────────────

function VideoTile({
  stream,
  label,
  isMuted,
  isCameraOff,
  isLocal,
  isActiveSpeaker,
}: {
  stream: MediaStream | null;
  label: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isLocal?: boolean;
  isActiveSpeaker?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.play().catch(() => {/* autoplay policy — ignore */});
  }, [stream]);

  return (
    <div className={`${styles.videoTile} ${isActiveSpeaker ? styles.activeSpeaker : ''}`}>
      {stream && !isCameraOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
        />
      ) : (
        <div className={styles.videoPlaceholder}>
          <UserCircle2 size={56} color="rgba(255,255,255,0.25)" />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {isCameraOff ? 'Camera off' : 'Connecting…'}
          </span>
        </div>
      )}
      <div className={styles.tileLabel}>
        {isMuted && (
          <span className={styles.mutedIcon}>
            <MicOff size={12} />
          </span>
        )}
        {label}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function VoIPModal() {
  const {
    callStatus,
    localStream, remoteStream,
    isMuted, isCameraOff, isSharingScreen, isRecording, recordingSeconds,
    callerFriend,
    acceptCall, declineCall, endCall,
    toggleMute, toggleCamera, toggleScreenShare, toggleRecording,
  } = useVoIP();

  if (callStatus === 'idle') return null;

  // ── Ringing (callee sees this) ──
  if (callStatus === 'ringing') {
    return (
      <div className={styles.voipOverlay}>
        <div className={styles.ringCard}>
          <p className={styles.ringStatus}>
            <PhoneIncoming size={12} style={{ display: 'inline', marginRight: 6 }} />
            Incoming Call
          </p>

          <div className={styles.ringPulseWrapper}>
            <div className={styles.ringPulse} />
            <div className={styles.ringPulse} />
            <div className={styles.ringPulse} />
            <div
              className={styles.avatar}
              style={{ background: callerFriend?.avatarColor ?? '#6366f1' }}
            >
              {callerFriend?.avatar ?? '?'}
            </div>
          </div>

          <p className={styles.ringName}>{callerFriend?.name ?? 'Unknown'}</p>

          <div className={styles.ringActions}>
            <button
              className={`${styles.ringBtn} ${styles.ringBtnDecline}`}
              onClick={declineCall}
              aria-label="Decline call"
              id="voip-decline-btn"
            >
              <span className={styles.ringBtnIcon}>
                <PhoneOff size={24} />
              </span>
              Decline
            </button>

            <button
              className={`${styles.ringBtn} ${styles.ringBtnAccept}`}
              onClick={acceptCall}
              aria-label="Accept call"
              id="voip-accept-btn"
            >
              <span className={styles.ringBtnIcon}>
                <Phone size={24} />
              </span>
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Calling (caller waits) ──
  if (callStatus === 'calling') {
    return (
      <div className={styles.voipOverlay}>
        <div className={styles.ringCard}>
          <p className={styles.ringStatus}>Calling…</p>
          <div className={styles.ringPulseWrapper}>
            <div className={styles.ringPulse} />
            <div className={styles.ringPulse} />
            <div
              className={styles.avatar}
              style={{ background: callerFriend?.avatarColor ?? '#6366f1' }}
            >
              {callerFriend?.avatar ?? '?'}
            </div>
          </div>
          <p className={styles.ringName}>{callerFriend?.name ?? 'Unknown'}</p>
          <div className={styles.callingDots}>
            <span /><span /><span />
          </div>
          <div style={{ marginTop: 32 }}>
            <button
              className={`${styles.ringBtn} ${styles.ringBtnDecline}`}
              onClick={endCall}
              aria-label="Cancel call"
              id="voip-cancel-btn"
            >
              <span className={styles.ringBtnIcon}>
                <PhoneOff size={24} />
              </span>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── In-call ──
  return (
    <div className={styles.voipOverlay}>
      <div className={styles.callContainer}>

        {/* Recording badge */}
        {isRecording && (
          <div className={styles.recordingBadge} id="voip-recording-badge">
            <span className={styles.recDot} />
            REC {fmtTime(recordingSeconds)}
          </div>
        )}

        {/* Video grid */}
        <div className={styles.videoGrid}>
          <VideoTile
            stream={localStream}
            label="You"
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isLocal={true}
          />
          <VideoTile
            stream={remoteStream}
            label={callerFriend?.name ?? 'Remote'}
            isActiveSpeaker={true}
          />
        </div>

        {/* Control bar */}
        <div className={styles.controlBar}>

          {/* Mute */}
          <button
            className={`${styles.ctrlBtn} ${isMuted ? styles.ctrlDanger : styles.ctrlDefault}`}
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            id="voip-mute-btn"
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <span className={styles.ctrlTooltip}>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera */}
          <button
            className={`${styles.ctrlBtn} ${isCameraOff ? styles.ctrlDanger : styles.ctrlDefault}`}
            onClick={toggleCamera}
            aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            id="voip-camera-btn"
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            <span className={styles.ctrlTooltip}>{isCameraOff ? 'Camera On' : 'Camera Off'}</span>
          </button>

          {/* Screen share */}
          <button
            className={`${styles.ctrlBtn} ${isSharingScreen ? styles.ctrlActive : styles.ctrlDefault}`}
            onClick={toggleScreenShare}
            aria-label={isSharingScreen ? 'Stop sharing' : 'Share screen'}
            id="voip-screenshare-btn"
          >
            {isSharingScreen ? <MonitorOff size={20} /> : <Monitor size={20} />}
            <span className={styles.ctrlTooltip}>
              {isSharingScreen ? 'Stop Share' : 'Share Screen'}
            </span>
          </button>

          {/* Record */}
          <button
            className={`${styles.ctrlBtn} ${isRecording ? styles.ctrlRecording : styles.ctrlDefault}`}
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            id="voip-record-btn"
          >
            <CircleDot size={20} />
            <span className={styles.ctrlTooltip}>
              {isRecording ? 'Stop Rec' : 'Record'}
            </span>
          </button>

          {/* End call */}
          <button
            className={styles.endCallBtn}
            onClick={endCall}
            aria-label="End call"
            id="voip-end-btn"
          >
            <PhoneOff size={24} />
            <span className={styles.ctrlTooltip}>End Call</span>
          </button>

        </div>
      </div>
    </div>
  );
}
