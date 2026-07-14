'use client';
import { useState, useRef } from 'react';
import styles from './CategoryBar.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryBarProps {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
}

export default function CategoryBar({ categories, active, onSelect }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  return (
    <div className={styles.container}>
      {showLeft && (
        <button className={`${styles.arrow} ${styles.left}`} onClick={() => scroll('left')} aria-label="Scroll left">
          <ChevronLeft size={20} />
        </button>
      )}
      <div className={styles.bar} ref={scrollRef} onScroll={onScroll}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.chip} ${active === cat ? styles.active : ''}`}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      {showRight && (
        <button className={`${styles.arrow} ${styles.right}`} onClick={() => scroll('right')} aria-label="Scroll right">
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
