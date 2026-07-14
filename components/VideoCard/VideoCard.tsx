'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Video } from '@/types';
import styles from './VideoCard.module.css';

interface VideoCardProps {
  video: Video;
  horizontal?: boolean;
  compact?: boolean;
}

export default function VideoCard({ video, horizontal = false, compact = false }: VideoCardProps) {
  const router = useRouter();

  return (
    <div
      className={`${styles.card} ${horizontal ? styles.horizontal : ''} ${compact ? styles.compact : ''}`}
      onClick={() => router.push(`/watch?v=${video.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/watch?v=${video.id}`)}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnailWrapper}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className={styles.thumbnail}
          loading="lazy"
        />
        <span className={styles.duration}>{video.duration}</span>
        <div className={styles.thumbnailOverlay}>
          <div className={styles.playBtn}>
            <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        {!horizontal && !compact && (
          <Link
            href={`/channel/${video.channelId}`}
            className={styles.channelAvatar}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={video.channelAvatar} alt={video.channelName} width={36} height={36} />
          </Link>
        )}
        <div className={styles.meta}>
          <h3 className={styles.title} title={video.title}>{video.title}</h3>
          <Link
            href={`/channel/${video.channelId}`}
            className={styles.channelName}
            onClick={(e) => e.stopPropagation()}
          >
            {video.channelName}
          </Link>
          <div className={styles.stats}>
            <span>{video.views}</span>
            <span className={styles.dot}>•</span>
            <span>{video.uploadedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
