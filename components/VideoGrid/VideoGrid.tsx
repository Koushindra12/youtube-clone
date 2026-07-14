import VideoCard from '@/components/VideoCard/VideoCard';
import { Video } from '@/types';
import styles from './VideoGrid.module.css';

interface VideoGridProps {
  videos: Video[];
  title?: string;
}

export default function VideoGrid({ videos, title }: VideoGridProps) {
  return (
    <section className={styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.grid}>
        {videos.map((video, i) => (
          <div key={video.id} style={{ animationDelay: `${i * 40}ms` }}>
            <VideoCard video={video} />
          </div>
        ))}
      </div>
    </section>
  );
}
