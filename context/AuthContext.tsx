'use client';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useTheme } from './ThemeContext';

interface AuthContextValue {
  isAuthenticated: boolean;
  showAuthModal: boolean;
  otpChannel: 'email' | 'mobile';
  isSouthIndia: boolean;
  sendOtp: (contact: string) => Promise<void>;
  verifyOtp: (code: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_AUTH = 'yt_clone_auth';
// Simulated OTP stored in memory (never persisted)
let _pendingOtp: string | null = null;
let _otpContact: string | null = null;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSouthIndia, isDetecting } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored === 'true') setIsAuthenticated(true);
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Once BOTH hydration and location detection finish, decide whether to show modal
  useEffect(() => {
    if (!isDetecting && hydrated && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isDetecting, hydrated, isAuthenticated]);

  const otpChannel: 'email' | 'mobile' = isSouthIndia ? 'email' : 'mobile';

  const sendOtp = useCallback(async (contact: string) => {
    const otp = generateOtp();
    _pendingOtp = otp;
    _otpContact = contact;
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    // In a real app you'd call your backend here
    const channel = isSouthIndia ? 'email' : 'mobile';
    console.info(
      `[Auth] OTP for ${contact} via ${channel}: ${otp}`,
    );
  }, [isSouthIndia]);

  const verifyOtp = useCallback((code: string): boolean => {
    if (!_pendingOtp) return false;
    const valid = code.trim() === _pendingOtp;
    if (valid) {
      _pendingOtp = null;
      _otpContact = null;
      setIsAuthenticated(true);
      setShowAuthModal(false);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, 'true');
      } catch { /* ignore */ }
    }
    return valid;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setShowAuthModal(true);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        showAuthModal,
        otpChannel,
        isSouthIndia,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
