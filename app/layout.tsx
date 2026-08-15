'use client';
import { useState } from 'react';
import Header from '@/components/Header/Header';
import Sidebar from '@/components/Sidebar/Sidebar';
import PremiumModal from '@/components/PremiumModal/PremiumModal';
import AuthModal from '@/components/AuthModal/AuthModal';
import VoIPModal from '@/components/VoIPModal/VoIPModal';
import FriendCallList from '@/components/FriendCallList/FriendCallList';
import { UserProvider } from '@/context/UserContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { VoIPProvider } from '@/context/VoIPContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Start mini=true so the mini sidebar is visible by default on desktop
  const [sidebarMini, setSidebarMini] = useState(true);

  const toggleMenu = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen((v) => !v);
    } else {
      setSidebarMini((v) => !v);
    }
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="YouTube Clone — Watch, discover, and share videos. Built with Next.js and TypeScript." />
        <meta name="theme-color" content="#0f0f0f" />
        <title>YouTube Clone</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <UserProvider>
            <AuthProvider>
              <VoIPProvider>
                <div className="app-layout">
                  <Header onMenuClick={toggleMenu} />
                  <div className="main-layout">
                    <Sidebar isOpen={sidebarOpen} isMini={sidebarMini} />
                    <main
                      className={`page-content ${sidebarMini ? 'sidebar-mini' : ''}`}
                      onClick={() => sidebarOpen && setSidebarOpen(false)}
                    >
                      {children}
                    </main>
                  </div>
                </div>
                <PremiumModal />
                <AuthModal />
                {/* VoIP overlays — rendered at root so they persist across page navigations */}
                <VoIPModal />
                <FriendCallList />
              </VoIPProvider>
            </AuthProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
