'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu, Search, Mic, Video, Bell, User, X, ArrowLeft, Download, Crown, PhoneCall,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useVoIP } from '@/context/VoIPContext';
import styles from './Header.module.css';

function YoutubeLogo() {
  return (
    <svg viewBox="0 0 90 20" width="90" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.97 3.37A3.37 3.37 0 0 0 25.6 1 79.4 79.4 0 0 0 16 .63a79.4 79.4 0 0 0-9.6.37A3.37 3.37 0 0 0 4.03 3.37 35.3 35.3 0 0 0 3.63 10a35.3 35.3 0 0 0 .4 6.63A3.37 3.37 0 0 0 6.4 19a79.4 79.4 0 0 0 9.6.38A79.4 79.4 0 0 0 25.6 19a3.37 3.37 0 0 0 2.37-2.37 35.3 35.3 0 0 0 .4-6.63 35.3 35.3 0 0 0-.4-6.63Z" fill="#FF0000"/>
      <path d="M13.18 13.4V6.6L20.18 10l-7 3.4Z" fill="white"/>
      <text x="35" y="15" fontFamily="Roboto, sans-serif" fontWeight="700" fontSize="14" fill="white" letterSpacing="-0.3">YouTube</text>
    </svg>
  );
}


interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { plan, setShowPremiumModal, downloads } = useUser();
  const { showFriendList, setShowFriendList, callStatus } = useVoIP();

  const PLAN_BADGE: Record<string, { emoji: string; label: string; color: string }> = {
    free: { emoji: '🆓', label: 'Free Plan', color: '' },
    bronze: { emoji: '🥉', label: 'Bronze', color: '#cd7f32' },
    silver: { emoji: '🥈', label: 'Silver', color: '#a8a9ad' },
    gold: { emoji: '🥇', label: 'Gold', color: '#ffd700' },
  };
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/results?search_query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleMobileSearch = () => {
    setMobileSearch(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (mobileSearch) inputRef.current?.focus();
  }, [mobileSearch]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={styles.header}>
      {/* Left */}
      <div className={`${styles.left} ${mobileSearch ? styles.hidden : ''}`}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Menu">
          <Menu size={20} />
        </button>
        <Link href="/" className={styles.logo} aria-label="YouTube Home">
          <YoutubeLogo />
        </Link>
      </div>

      {/* Center - Search */}
      <div className={`${styles.center} ${mobileSearch ? styles.mobileActive : ''}`}>
        {mobileSearch && (
          <button className={styles.backBtn} onClick={() => setMobileSearch(false)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}
        <form onSubmit={handleSearch} className={`${styles.searchForm} ${searchFocused ? styles.focused : ''}`}>
          <div className={styles.searchInputWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search YouTube"
            />
            {query && (
              <button type="button" className={styles.clearBtn} onClick={() => setQuery('')} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            <Search size={18} />
          </button>
        </form>
        <button className={styles.micBtn} aria-label="Search with voice">
          <Mic size={20} />
        </button>
      </div>

      {/* Right */}
      <div className={`${styles.right} ${mobileSearch ? styles.hidden : ''}`}>
        <button className={styles.iconBtn} onClick={handleMobileSearch} aria-label="Search" id="mobile-search-btn">
          <Search size={20} />
        </button>
        <button className={styles.iconBtn} aria-label="Create a video or post">
          <Video size={20} />
        </button>
        {/* VoIP Call button */}
        <button
          className={styles.iconBtn}
          onClick={() => setShowFriendList(!showFriendList)}
          aria-label="Start a video call"
          id="voip-call-header-btn"
          style={{ position: 'relative' }}
        >
          <PhoneCall size={20} style={callStatus !== 'idle' ? { color: '#10b981' } : {}} />
          {callStatus !== 'idle' && (
            <span style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          )}
        </button>
        <button className={styles.iconBtn} aria-label="Notifications">
          <div className={styles.notifWrapper}>
            <Bell size={20} />
            <span className={styles.notifBadge}>3</span>
          </div>
        </button>
        {/* Avatar with dropdown */}
        <div className={styles.avatarWrapper} ref={userMenuRef}>
          <button
            className={styles.avatarBtn}
            aria-label="Account"
            onClick={() => setShowUserMenu((v) => !v)}
            id="avatar-btn"
          >
            {plan !== 'free' ? <Crown size={16} style={{ color: badge.color || '#f59e0b' }} /> : <User size={18} />}
          </button>
          {showUserMenu && (
            <div className={styles.userMenu}>
              <div className={styles.userMenuHeader}>
                <span
                  className={`${styles.planChip} ${plan !== 'free' ? styles.premiumChip : ''}`}
                  style={badge.color ? { borderColor: badge.color + '44', color: badge.color } as React.CSSProperties : {}}
                >
                  {badge.emoji} {badge.label}
                </span>
              </div>
              <Link
                href="/profile/downloads"
                className={styles.userMenuItem}
                onClick={() => setShowUserMenu(false)}
                id="downloads-menu-link"
              >
                <Download size={16} />
                Downloads
                {downloads.length > 0 && (
                  <span className={styles.menuBadge}>{downloads.length}</span>
                )}
              </Link>
              {plan !== 'gold' && (
                <button
                  className={`${styles.userMenuItem} ${styles.userMenuPremiumBtn}`}
                  onClick={() => { setShowUserMenu(false); setShowPremiumModal(true); }}
                  id="header-premium-btn"
                >
                  <Crown size={16} />
                  {plan === 'free' ? 'Get Premium' : 'Upgrade Plan'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
