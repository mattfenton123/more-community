"use client";

import '../src/index.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppProvider, useAppContext } from '../src/context/AppContext';
import { useChat, ChatProvider } from '../src/context/ChatContext';
import { FeedProvider } from '../src/context/FeedContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/components/Toast';
import BottomNav from '../src/components/BottomNav';


function MainLayout({ children }) {
  const currentPath = usePathname();
  const router = useRouter();
  const { user, isLoading: appLoading } = useAppContext();
  const { authUser, isLoading: authLoading } = useAuth();
  const isDashboard = currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/council-dashboard') || currentPath?.startsWith('/admin');
  const isChatRoom = currentPath?.match(/^\/chat\/.+/);
  const hideTabBar = currentPath === '/login' || currentPath === '/onboarding' || isChatRoom;
  const isDesktopFriendly = isDashboard || currentPath?.startsWith('/community/');

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading || appLoading) return;

    if (!authUser && currentPath !== '/login') {
      router.push('/login');
      return;
    }

    if (user && user.onboarded === false && currentPath !== '/onboarding' && currentPath !== '/login') {
      router.push('/onboarding');
    }
  }, [authUser, user, authLoading, appLoading, currentPath, router]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed', err));
    }
  }, []);

  // Don't render content until auth checks are done
  if (authLoading || (authUser && !user)) return (
    <div style={{ minHeight: '100dvh', background: 'var(--slate-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(20,184,166,0.2)', borderTopColor: 'var(--teal-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>Loading...</span>
    </div>
  );

  return (
    <div className={`app-container ${isDesktopFriendly ? 'desktop-mode' : ''}`}>
      <ChatProvider user={user}>
      <FeedProvider user={user}>

      <div className="app-content" style={hideTabBar ? { paddingBottom: 0 } : {}}>

        {children}
            </div>
      {!hideTabBar && <BottomNav />}
          </FeedProvider>
    </ChatProvider>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>more | The Power of Real-Life Connection</title>
        <meta name="description" content="more is a movement celebrating the power of connecting in person. Find local groups, join real-life meetups, and experience the joy of shared passions. Free for community leaders. Starting in Tunbridge Wells." />
        <meta property="og:title" content="more | The Power of Real-Life Connection" />
        <meta property="og:description" content="Find local groups, join real-life meetups, and experience the joy of shared passions." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80" />
        <meta name="theme-color" content="#020617" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <MainLayout>{children}</MainLayout>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
