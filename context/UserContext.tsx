'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Video } from '@/types';

export type UserPlan = 'free' | 'bronze' | 'silver' | 'gold';

export const PLAN_WATCH_LIMITS: Record<UserPlan, number> = {
  free: 5,       // 5 minutes
  bronze: 7,     // 7 minutes
  silver: 10,    // 10 minutes
  gold: Infinity, // unlimited
};

export const PLAN_PRICES: Record<Exclude<UserPlan, 'free'>, number> = {
  bronze: 10,
  silver: 50,
  gold: 100,
};

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: 'Free',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
};

export interface DownloadedVideo extends Video {
  downloadedAt: string;
}

interface UserContextValue {
  plan: UserPlan;
  watchLimitMinutes: number;
  downloads: DownloadedVideo[];
  todayDownloadCount: number;
  canDownload: boolean;
  downloadVideo: (video: Video) => boolean;
  upgradeToPlan: (plan: UserPlan, email: string) => void;
  /** @deprecated kept for backward compat — calls upgradeToPlan('gold', '') */
  upgradeToPremium: () => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (v: boolean) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY_PLAN = 'yt_clone_plan';
const STORAGE_KEY_DOWNLOADS = 'yt_clone_downloads';
const STORAGE_KEY_DATE = 'yt_clone_dl_date';
const STORAGE_KEY_COUNT = 'yt_clone_dl_count';
const STORAGE_KEY_EMAIL = 'yt_clone_email';
const FREE_DAILY_LIMIT = 1;

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<UserPlan>('free');
  const [downloads, setDownloads] = useState<DownloadedVideo[]>([]);
  const [todayDownloadCount, setTodayDownloadCount] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(STORAGE_KEY_PLAN) as UserPlan | null;
      const validPlans: UserPlan[] = ['free', 'bronze', 'silver', 'gold'];
      if (storedPlan && validPlans.includes(storedPlan)) setPlan(storedPlan);

      const storedDownloads = localStorage.getItem(STORAGE_KEY_DOWNLOADS);
      if (storedDownloads) setDownloads(JSON.parse(storedDownloads));

      const storedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
      if (storedEmail) setUserEmail(storedEmail);

      const storedDate = localStorage.getItem(STORAGE_KEY_DATE);
      const storedCount = localStorage.getItem(STORAGE_KEY_COUNT);
      if (storedDate === getTodayStr() && storedCount) {
        setTodayDownloadCount(parseInt(storedCount, 10));
      } else {
        localStorage.setItem(STORAGE_KEY_DATE, getTodayStr());
        localStorage.setItem(STORAGE_KEY_COUNT, '0');
        setTodayDownloadCount(0);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const watchLimitMinutes = PLAN_WATCH_LIMITS[plan];
  const canDownload = plan === 'gold' || todayDownloadCount < FREE_DAILY_LIMIT;

  const downloadVideo = useCallback((video: Video): boolean => {
    if (plan === 'free' && todayDownloadCount >= FREE_DAILY_LIMIT) {
      setShowPremiumModal(true);
      return false;
    }

    const already = downloads.find((d) => d.id === video.id);
    const newDownload: DownloadedVideo = {
      ...video,
      downloadedAt: new Date().toISOString(),
    };

    const newDownloads = already
      ? downloads.map((d) => (d.id === video.id ? newDownload : d))
      : [newDownload, ...downloads];

    setDownloads(newDownloads);
    try {
      localStorage.setItem(STORAGE_KEY_DOWNLOADS, JSON.stringify(newDownloads));
    } catch { /* ignore */ }

    if (plan === 'free') {
      const newCount = todayDownloadCount + 1;
      setTodayDownloadCount(newCount);
      try {
        localStorage.setItem(STORAGE_KEY_DATE, getTodayStr());
        localStorage.setItem(STORAGE_KEY_COUNT, String(newCount));
      } catch { /* ignore */ }
    }

    return true;
  }, [plan, todayDownloadCount, downloads]);

  const upgradeToPlan = useCallback((newPlan: UserPlan, email: string) => {
    setPlan(newPlan);
    if (email) setUserEmail(email);
    try {
      localStorage.setItem(STORAGE_KEY_PLAN, newPlan);
      if (email) localStorage.setItem(STORAGE_KEY_EMAIL, email);
    } catch { /* ignore */ }
    setShowPremiumModal(false);
  }, []);

  // Backward compat
  const upgradeToPremium = useCallback(() => {
    upgradeToPlan('gold', userEmail);
  }, [upgradeToPlan, userEmail]);

  return (
    <UserContext.Provider value={{
      plan, watchLimitMinutes, downloads, todayDownloadCount, canDownload,
      downloadVideo, upgradeToPlan, upgradeToPremium,
      showPremiumModal, setShowPremiumModal,
      userEmail, setUserEmail,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
