import { Suspense } from 'react';
import { searchVideos } from '@/data/videos';
import { channels } from '@/data/channels';
import VideoCard from '@/components/VideoCard/VideoCard';
import Link from 'next/link';
import { CheckCircle2, Filter } from 'lucide-react';
import styles from './page.module.css';

interface ResultsPageProps {
  searchParams: Promise<{ search_query?: string }>;
}

const FILTERS = ['All', 'Video', 'Channel', 'Today', 'This week', 'This month', '4K', 'Live'];

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const query = params.search_query || '';
  const results = searchVideos(query);
  const matchedChannels = channels.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.filterBar}>
        <Filter size={18} className={styles.filterIcon} />
        {FILTERS.map((f) => (
          <button key={f} className={`${styles.filterChip} ${f === 'All' ? styles.active : ''}`}>
            {f}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {query && (
          <p className={styles.resultCount}>
            About {results.length + matchedChannels.length} results for &ldquo;<strong>{query}</strong>&rdquo;
          </p>
        )}

        {/* Channel results */}
        {matchedChannels.length > 0 && (
          <div className={styles.channelResults}>
            {matchedChannels.map((ch) => (
              <Link key={ch.id} href={`/channel/${ch.id}`} className={styles.channelCard}>
                <img src={ch.avatar} alt={ch.name} className={styles.chAvatar} width={80} height={80} />
                <div className={styles.chInfo}>
                  <div className={styles.chNameRow}>
                    <h3 className={styles.chName}>{ch.name}</h3>
                    {ch.verified && <CheckCircle2 size={16} className={styles.verified} />}
                  </div>
                  <p className={styles.chHandle}>{ch.handle} • {ch.subscribers} subscribers • {ch.videoCount} videos</p>
                  <p className={styles.chDesc}>{ch.description}</p>
                  <button className={styles.subBtn}>Subscribe</button>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Video results */}
        <div className={styles.videoList}>
          {results.length === 0 && matchedChannels.length === 0 ? (
            <div className={styles.empty}>
              <h2>No results found for &ldquo;{query}&rdquo;</h2>
              <p>Try different keywords or check your spelling.</p>
            </div>
          ) : (
            results.map((video) => (
              <VideoCard key={video.id} video={video} horizontal />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
