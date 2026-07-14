'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, PlaySquare, Clock, ThumbsUp, Flame, ShoppingBag,
  Music2, Gamepad2, Newspaper, Trophy, Lightbulb, Shirt, Video, Radio,
  ChevronRight, Settings, Flag, HelpCircle, MessageSquare,
  Clapperboard, Download, Crown
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isOpen: boolean;
  isMini: boolean;
}

const mainLinks = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Compass, label: 'Shorts', href: '/shorts' },
  { icon: PlaySquare, label: 'Subscriptions', href: '/' },
];

const youLinks = [
  { icon: Video, label: 'Your channel', href: '/channel/ch1' },
  { icon: Clock, label: 'History', href: '/' },
  { icon: Download, label: 'Downloads', href: '/profile/downloads' },
  { icon: PlaySquare, label: 'Playlists', href: '/' },
  { icon: ThumbsUp, label: 'Liked videos', href: '/' },
];

const exploreLinks = [
  { icon: Flame, label: 'Trending', href: '/' },
  { icon: ShoppingBag, label: 'Shopping', href: '/' },
  { icon: Music2, label: 'Music', href: '/' },
  { icon: Clapperboard, label: 'Films', href: '/' },
  { icon: Radio, label: 'Live', href: '/' },
  { icon: Gamepad2, label: 'Gaming', href: '/' },
  { icon: Newspaper, label: 'News', href: '/' },
  { icon: Trophy, label: 'Sports', href: '/' },
  { icon: Lightbulb, label: 'Learning', href: '/' },
  { icon: Shirt, label: 'Fashion & Beauty', href: '/' },
];

const subscriptions = [
  { name: 'TechVision Pro', avatar: 'https://picsum.photos/seed/ch1/24/24', href: '/channel/ch1', badge: true },
  { name: 'CodeCraft Studio', avatar: 'https://picsum.photos/seed/ch2/24/24', href: '/channel/ch2' },
  { name: 'GameSphere', avatar: 'https://picsum.photos/seed/ch4/24/24', href: '/channel/ch4', badge: true },
  { name: 'MindFuel', avatar: 'https://picsum.photos/seed/ch5/24/24', href: '/channel/ch5' },
  { name: 'Beat Lab', avatar: 'https://picsum.photos/seed/ch6/24/24', href: '/channel/ch6' },
  { name: 'Pixel & Frame', avatar: 'https://picsum.photos/seed/ch3/24/24', href: '/channel/ch3' },
];

export default function Sidebar({ isOpen, isMini }: SidebarProps) {
  const pathname = usePathname();
  const { plan, setShowPremiumModal } = useUser();

  if (!isOpen && !isMini) return null;

  return (
    <>
      {isOpen && !isMini && (
        <div className={styles.overlay} />
      )}
      <nav className={`${styles.sidebar} ${isMini ? styles.mini : ''} ${isOpen ? styles.open : ''}`}>
        <div className={styles.content}>
          {/* Main Navigation */}
          <section className={styles.section}>
            {mainLinks.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className={`${styles.link} ${pathname === href && label === 'Home' ? styles.active : ''}`}
              >
                <Icon size={20} className={styles.linkIcon} />
                {!isMini && <span className={styles.linkLabel}>{label}</span>}
              </Link>
            ))}
          </section>

          {!isMini && (
            <>
              <div className={styles.divider} />

              {/* You Section */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>You <ChevronRight size={16} /></h3>
                {youLinks.map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} className={styles.link}>
                    <Icon size={20} className={styles.linkIcon} />
                    <span className={styles.linkLabel}>{label}</span>
                  </Link>
                ))}
              </section>

              <div className={styles.divider} />

              {/* Subscriptions */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Subscriptions</h3>
                {subscriptions.map(({ name, avatar, href, badge }) => (
                  <Link key={name} href={href} className={styles.link}>
                    <div className={styles.subAvatar}>
                      <img src={avatar} alt={name} width={24} height={24} />
                      {badge && <span className={styles.subBadge} />}
                    </div>
                    <span className={styles.linkLabel}>{name}</span>
                  </Link>
                ))}
              </section>

              <div className={styles.divider} />

              {/* Explore */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Explore</h3>
                {exploreLinks.map(({ icon: Icon, label, href }) => (
                  <Link key={label} href={href} className={styles.link}>
                    <Icon size={20} className={styles.linkIcon} />
                    <span className={styles.linkLabel}>{label}</span>
                  </Link>
                ))}
              </section>

              <div className={styles.divider} />

              {/* Footer Links */}
              <section className={styles.section}>
                {plan === 'free' && (
                  <button
                    className={`${styles.link} ${styles.premiumLink}`}
                    onClick={() => setShowPremiumModal(true)}
                    id="sidebar-premium-btn"
                  >
                    <Crown size={20} className={styles.premiumIcon} />
                    <span className={styles.linkLabel}>Get Premium</span>
                  </button>
                )}
                {(plan === 'bronze' || plan === 'silver') && (
                  <button
                    className={`${styles.link} ${styles.premiumLink}`}
                    onClick={() => setShowPremiumModal(true)}
                    id="sidebar-upgrade-btn"
                  >
                    <Crown size={20} className={styles.premiumIcon} />
                    <span className={styles.linkLabel}>Upgrade Plan</span>
                  </button>
                )}
                {plan === 'gold' && (
                  <div className={`${styles.link} ${styles.premiumBadge}`}>
                    <Crown size={20} className={styles.premiumIcon} />
                    <span className={styles.linkLabel}>Gold Member 🥇</span>
                  </div>
                )}
                <Link href="/" className={styles.link}>
                  <Settings size={20} className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Settings</span>
                </Link>
                <Link href="/" className={styles.link}>
                  <Flag size={20} className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Report history</span>
                </Link>
                <Link href="/" className={styles.link}>
                  <HelpCircle size={20} className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Help</span>
                </Link>
                <Link href="/" className={styles.link}>
                  <MessageSquare size={20} className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Send feedback</span>
                </Link>
              </section>

              <div className={styles.divider} />

              <footer className={styles.footer}>
                <p>About Press Copyright Contact us Creators Advertise Developers</p>
                <p>Terms Privacy Policy & Safety How YouTube works Test new features</p>
                <p className={styles.copy}>© 2024 Google LLC</p>
              </footer>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
