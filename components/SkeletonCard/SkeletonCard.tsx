import styles from './SkeletonCard.module.css';

export default function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} />
      <div className={styles.info}>
        <div className={styles.avatar} />
        <div className={styles.meta}>
          <div className={`${styles.line} ${styles.title}`} />
          <div className={`${styles.line} ${styles.title} ${styles.short}`} />
          <div className={`${styles.line} ${styles.sub}`} />
          <div className={`${styles.line} ${styles.sub} ${styles.shorter}`} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
