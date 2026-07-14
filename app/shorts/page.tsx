'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Music2, ChevronUp, ChevronDown } from 'lucide-react';
import { getShorts } from '@/data/videos';
import styles from './page.module.css';

export default function ShortsPage() {
  const shorts = getShorts();
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const router = useRouter();

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const current = shorts[activeIndex];

  const navigate = (dir: 'up' | 'down') => {
    if (dir === 'up' && activeIndex > 0) setActiveIndex((i) => i - 1);
    if (dir === 'down' && activeIndex < shorts.length - 1) setActiveIndex((i) => i + 1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Nav Arrows */}
        <div className={styles.navArrows}>
          <button
            className={styles.navBtn}
            onClick={() => navigate('up')}
            disabled={activeIndex === 0}
            aria-label="Previous short"
          >
            <ChevronUp size={24} />
          </button>
          <button
            className={styles.navBtn}
            onClick={() => navigate('down')}
            disabled={activeIndex === shorts.length - 1}
            aria-label="Next short"
          >
            <ChevronDown size={24} />
          </button>
        </div>

        {/* Short Player */}
        <div className={styles.shortCard} key={current.id}>
          {/*
            FIX: replaced outer <Link> with <div role="button"> to avoid
            <a> nested inside <a> (HTML spec violation → hydration error).
            Navigation is handled via router.push() instead.
          */}
          <div
            className={styles.videoArea}
            role="button"
            tabIndex={0}
            aria-label={`Watch ${current.title}`}
            onClick={() => router.push(`/watch?v=${current.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(`/watch?v=${current.id}`)}
          >
            <img src={current.thumbnail} alt={current.title} className={styles.thumbnail} />
            <div className={styles.overlay}>
              <div className={styles.videoInfo}>
                {/* Channel row — the only real <a> on this page */}
                <Link
                  href={`/channel/${current.channelId}`}
                  className={styles.channelRow}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={current.channelAvatar}
                    alt={current.channelName}
                    className={styles.chAvatar}
                    width={32}
                    height={32}
                  />
                  <span className={styles.chName}>{current.channelName}</span>
                  <button
                    className={styles.followBtn}
                    onClick={(e) => e.preventDefault()}
                  >
                    Follow
                  </button>
                </Link>
                <p className={styles.shortTitle}>{current.title}</p>
                <div className={styles.musicRow}>
                  <Music2 size={14} />
                  <span>Original audio • {current.channelName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${liked.has(current.id) ? styles.liked : ''}`}
              onClick={() => toggleLike(current.id)}
              aria-label="Like"
            >
              <Heart size={28} fill={liked.has(current.id) ? '#ff0000' : 'none'} />
              <span>{(current.likeCount + (liked.has(current.id) ? 1 : 0)).toLocaleString()}</span>
            </button>
            <button className={styles.actionBtn} aria-label="Comment">
              <MessageCircle size={28} />
              <span>Comment</span>
            </button>
            <button className={styles.actionBtn} aria-label="Share">
              <Share2 size={28} />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Progress Dots */}
        <div className={styles.dots}>
          {shorts.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Short ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
