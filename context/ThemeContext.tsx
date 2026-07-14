'use client';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

export type AppTheme = 'dark' | 'light';

const SOUTH_INDIA_STATES = [
  'tamil nadu',
  'kerala',
  'karnataka',
  'andhra pradesh',
  'telangana',
];

/** Returns current hour in IST (UTC+5:30) */
function getISTHour(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const istMs = utcMs + 5.5 * 60 * 60_000; // +5:30
  return new Date(istMs).getHours();
}

/** Returns true if current IST time is between 10:00 and 12:00 */
function isInLightTimeWindow(): boolean {
  const h = getISTHour();
  return h >= 10 && h < 12;
}

async function detectStateFromCoords(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return '';
    const data = await res.json();
    const state: string =
      data?.address?.state ?? data?.address?.region ?? '';
    return state.toLowerCase().trim();
  } catch {
    return '';
  }
}

// ── Context shape ──────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: AppTheme;
  userState: string; // detected state name, empty if unknown
  isDetecting: boolean;
  isSouthIndia: boolean;
  isLightTimeWindow: boolean;
  forceTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [userState, setUserState] = useState('');
  const [isDetecting, setIsDetecting] = useState(true);
  const [isSouthIndia, setIsSouthIndia] = useState(false);
  const [isLightTime] = useState(isInLightTimeWindow);

  const applyTheme = useCallback((t: AppTheme) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const forceTheme = useCallback(
    (t: AppTheme) => {
      applyTheme(t);
    },
    [applyTheme],
  );

  useEffect(() => {
    // Always start dark
    applyTheme('dark');

    if (!navigator.geolocation) {
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const state = await detectStateFromCoords(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        setUserState(state);

        const southIndia = SOUTH_INDIA_STATES.some((s) =>
          state.includes(s),
        );
        setIsSouthIndia(southIndia);

        if (southIndia && isLightTime) {
          applyTheme('light');
        } else {
          applyTheme('dark');
        }
        setIsDetecting(false);
      },
      () => {
        // Location denied → dark theme
        setIsDetecting(false);
        applyTheme('dark');
      },
      { timeout: 8000 },
    );
  }, [applyTheme, isLightTime]);

  return (
    <ThemeContext.Provider
      value={{ theme, userState, isDetecting, isSouthIndia, isLightTimeWindow: isLightTime, forceTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
