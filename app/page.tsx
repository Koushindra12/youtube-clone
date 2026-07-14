'use client';
import { useState, useMemo } from 'react';
import CategoryBar from '@/components/CategoryBar/CategoryBar';
import VideoGrid from '@/components/VideoGrid/VideoGrid';
import { getRegularVideos } from '@/data/videos';
import styles from './page.module.css';

const CATEGORIES = [
  'All', 'Gaming', 'Music', 'Technology', 'Education', 'Travel',
  'Sports', 'Cooking', 'Science', 'News', 'Comedy', 'Film & TV',
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const allVideos = getRegularVideos();

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return allVideos;
    return allVideos.filter((v) => v.category === activeCategory);
  }, [activeCategory, allVideos]);

  return (
    <div className={styles.page}>
      <div className={styles.categoryBar}>
        <CategoryBar categories={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />
      </div>
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No videos in this category yet.</p>
          </div>
        ) : (
          <VideoGrid videos={filtered} />
        )}
      </div>
    </div>
  );
}
