'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { CheckCircle2, Bell, Globe } from 'lucide-react';
import { getChannel } from '@/data/channels';
import { getVideosByChannel } from '@/data/videos';
import VideoGrid from '@/components/VideoGrid/VideoGrid';
import styles from './page.module.css';

const TABS = ['Videos', 'Playlists', 'Community', 'About'];

interface ChannelPageProps {
  params: Promise<{ id: string }>;
}

export default function ChannelPage({ params }: ChannelPageProps) {
  const { id } = use(params);
  const channel = getChannel(id);
  const videos = getVideosByChannel(channel.id);

  const [activeTab, setActiveTab] = useState('Videos');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className={styles.page}>
      {/* Banner */}
      <div className={styles.banner}>
        <img src={channel.banner} alt="Channel banner" className={styles.bannerImg} />
        <div className={styles.bannerOverlay} />
      </div>

      {/* Channel Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <img src={channel.avatar} alt={channel.name} className={styles.avatar} width={80} height={80} />
          <div className={styles.info}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{channel.name}</h1>
              {channel.verified && <CheckCircle2 size={20} className={styles.verified} />}
            </div>
            <div className={styles.meta}>
              <span>{channel.handle}</span>
              <span>•</span>
              <span>{channel.subscribers} subscribers</span>
              <span>•</span>
              <span>{channel.videoCount} videos</span>
            </div>
            <p className={styles.desc}>{channel.description}</p>
          </div>
          <div className={styles.actions}>
            <button
              className={`${styles.subscribeBtn} ${subscribed ? styles.subscribed : ''}`}
              onClick={() => setSubscribed(!subscribed)}
              id="channel-subscribe-btn"
            >
              {subscribed ? (
                <><Bell size={16} /> Subscribed</>
              ) : 'Subscribe'}
            </button>
            {channel.links[0] && (
              <a href={channel.links[0].url} className={styles.linkBtn} target="_blank" rel="noopener noreferrer">
                <Globe size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'Videos' && (
          videos.length > 0
            ? <VideoGrid videos={videos} />
            : <div className={styles.empty}>No videos yet.</div>
        )}
        {activeTab === 'Playlists' && <div className={styles.empty}>No playlists yet.</div>}
        {activeTab === 'Community' && <div className={styles.empty}>No community posts yet.</div>}
        {activeTab === 'About' && (
          <div className={styles.about}>
            <h2>About {channel.name}</h2>
            <p>{channel.description}</p>
            <div className={styles.aboutMeta}>
              <div><strong>Joined:</strong> {channel.joinedDate}</div>
              <div><strong>Total views:</strong> {channel.totalViews}</div>
              <div><strong>Videos:</strong> {channel.videoCount}</div>
              {channel.links.map((link) => (
                <div key={link.title}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>
                    {link.title}: {link.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
