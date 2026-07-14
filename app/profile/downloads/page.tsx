'use client';
import { useUser } from '@/context/UserContext';
import { Download, Crown, Calendar, Clock, Trash2, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DownloadsPage() {
  const { downloads, plan, todayDownloadCount, setShowPremiumModal } = useUser();
  const router = useRouter();

  const remaining = plan === 'gold' ? '∞' : Math.max(0, 1 - todayDownloadCount);

  const PLAN_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
    free: { emoji: '🆓', label: 'Free Plan', color: '' },
    bronze: { emoji: '🥉', label: 'Bronze', color: '#cd7f32' },
    silver: { emoji: '🥈', label: 'Silver', color: '#a8a9ad' },
    gold: { emoji: '🥇', label: 'Gold', color: '#ffd700' },
  };
  const planConfig = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.pageIcon}>
            <Download size={28} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Downloads</h1>
            <p className={styles.pageSubtitle}>
              {downloads.length} video{downloads.length !== 1 ? 's' : ''} downloaded
            </p>
          </div>
        </div>

        {/* Plan badge */}
        <div
          className={`${styles.planBadge} ${plan !== 'free' ? styles.premium : styles.free}`}
          style={planConfig.color ? { borderColor: planConfig.color + '44', color: planConfig.color } : {}}
        >
          {plan !== 'free' ? (
            <>
              <Crown size={15} />
              {planConfig.label}
            </>
          ) : (
            <>
              <Download size={15} />
              Free Plan
            </>
          )}
        </div>
      </div>

      {/* Quota bar */}
      <div className={styles.quotaCard}>
        <div className={styles.quotaInfo}>
          <div className={styles.quotaLabel}>
            <Calendar size={16} />
            <span>Today&apos;s downloads</span>
          </div>
          {plan === 'free' ? (
            <div className={styles.quotaNumbers}>
              <span className={styles.quotaUsed}>{todayDownloadCount}</span>
              <span className={styles.quotaSlash}>/</span>
              <span className={styles.quotaTotal}>1 free</span>
            </div>
          ) : plan === 'gold' ? (
            <div className={styles.quotaNumbers}>
              <span className={styles.quotaUsed} style={{ color: '#ffd700' }}>∞</span>
              <span className={styles.quotaSlash}>unlimited</span>
            </div>
          ) : (
            <div className={styles.quotaNumbers}>
              <span className={styles.quotaUsed}>{todayDownloadCount}</span>
              <span className={styles.quotaSlash}>/</span>
              <span className={styles.quotaTotal}>1 per day</span>
            </div>
          )}
        </div>

        {plan !== 'gold' && (
          <>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, todayDownloadCount * 100)}%` }}
              />
            </div>
            <div className={styles.quotaFooter}>
              <span className={styles.remainingText}>
                {remaining === 0
                  ? 'Daily limit reached'
                  : `${remaining} download remaining today`}
              </span>
              <button
                className={styles.upgradeBtn}
                onClick={() => setShowPremiumModal(true)}
                id="upgrade-from-downloads-btn"
              >
                <Crown size={14} />
                {plan === 'free' ? 'Get Premium' : 'Upgrade Plan'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {downloads.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Download size={48} />
          </div>
          <h2>No downloads yet</h2>
          <p>
            Videos you download will appear here.
            {plan === 'free' && ' Free users can download 1 video per day.'}
          </p>
          <button className={styles.browseBtn} onClick={() => router.push('/')} id="browse-videos-btn">
            Browse Videos
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {downloads.map((video) => (
            <div key={video.id} className={styles.card}>
              <div
                className={styles.thumbnailWrapper}
                onClick={() => router.push(`/watch?v=${video.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/watch?v=${video.id}`)}
              >
                <img src={video.thumbnail} alt={video.title} className={styles.thumbnail} />
                <span className={styles.duration}>{video.duration}</span>
                <div className={styles.playOverlay}>
                  <Play size={28} fill="white" />
                </div>
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle} title={video.title}>
                  {video.title}
                </h3>
                <p className={styles.cardChannel}>{video.channelName}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}>
                    <Clock size={12} />
                    {formatDate(video.downloadedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
