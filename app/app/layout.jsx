"use client";

import '../src/index.css';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, Component } from 'react';
import { AppProvider, useAppContext } from '../src/context/AppContext';
import { useChat, ChatProvider } from '../src/context/ChatContext';
import { FeedProvider } from '../src/context/FeedContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/components/Toast';
import BottomNav from '../src/components/BottomNav';

// Custom Error Boundary that catches ALL errors including in providers
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('GlobalErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <html lang="en">
          <body style={{ background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '40px 20px', minHeight: '100vh' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h1 style={{ color: '#f43f5e', fontSize: '1.5rem', marginBottom: '12px' }}>⚠️ Something went wrong</h1>
              <p style={{ color: '#94a3b8', marginBottom: '20px' }}>The app encountered an error. Please try refreshing.</p>
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
                <pre style={{ color: '#fb7185', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem', margin: 0 }}>
                  {this.state.error?.message}
                </pre>
                <pre style={{ color: '#64748b', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem', marginTop: '12px' }}>
                  {this.state.error?.stack}
                </pre>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '20px', padding: '12px 24px', background: '#14b8a6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Reload App
              </button>
            </div>
          </body>
        </html>
      );
    }
    return this.props.children;
  }
}

function SafeBottomNav() {
  try {
    return <BottomNav />;
  } catch (e) {
    console.error('BottomNav crashed:', e);
    return null;
  }
}

function GlobalSimulatorBar() {
  const { isSimulating, simulatedPersona, impersonatedUserId, users, exitSimulator } = useAppContext();
  const router = useRouter();

  if (!isSimulating) return null;

  const impersonatedUser = impersonatedUserId ? users?.find(u => u.id === impersonatedUserId) : null;
  const targetLabel = impersonatedUser 
    ? `${impersonatedUser.name} (${impersonatedUser.role || 'Member'})`
    : simulatedPersona === 'leader' ? 'Community Leader'
    : simulatedPersona === 'member' ? 'Regular Member'
    : simulatedPersona === 'sponsor' ? 'Local Business Sponsor'
    : simulatedPersona === 'partner' ? 'Experience Host'
    : simulatedPersona;

  return (
    <div style={{
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.96)',
      border: '1.5px solid #f59e0b',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(245, 158, 11, 0.25)',
      borderRadius: '999px',
      padding: '7px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backdropFilter: 'blur(16px)',
      color: '#fff',
      fontSize: '0.8rem',
      fontWeight: 600,
      maxWidth: '92vw'
    }}>
      <div style={{
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        background: '#f59e0b',
        boxShadow: '0 0 8px #f59e0b',
        flexShrink: 0
      }} />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Simulating entire app as: <strong style={{ color: '#fbbf24' }}>{targetLabel}</strong>
      </span>
      <button
        type="button"
        onClick={() => {
          exitSimulator();
          router.push('/admin');
        }}
        className="interactive-press"
        style={{
          background: '#f59e0b',
          border: 'none',
          color: '#090d16',
          fontWeight: 800,
          fontSize: '0.74rem',
          borderRadius: '999px',
          padding: '4px 12px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
      >
        Exit Simulator
      </button>
    </div>
  );
}


function MainLayout({ children }) {
  const currentPath = usePathname();
  const router = useRouter();
  const { user, isLoading: appLoading } = useAppContext();
  const { authUser, isLoading: authLoading } = useAuth();
  const isDashboard = currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/council-dashboard') || currentPath?.startsWith('/admin');
  const isChatRoom = currentPath?.match(/^\/chat\/.+/);
  const hideTabBar = currentPath === '/login' || currentPath === '/onboarding' || isChatRoom;
  const isDesktopFriendly = true;

  const isPublicRoute = Boolean(
    currentPath === '/' ||
    currentPath === '/login' ||
    currentPath === '/discover' ||
    currentPath === '/events' ||
    currentPath === '/invite' ||
    currentPath === '/update-password' ||
    currentPath?.startsWith('/events/') ||
    currentPath?.startsWith('/community/') ||
    currentPath?.startsWith('/legal/') ||
    currentPath === '/experiences' ||
    currentPath?.startsWith('/sponsors/') ||
    currentPath?.startsWith('/experiences/')
  );

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading || appLoading) return;

    if (!authUser && !isPublicRoute) {
      const redirectUrl = currentPath && currentPath !== '/' ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login';
      router.push(redirectUrl);
      return;
    }

    if (authUser && user && user.onboarded === false && currentPath !== '/onboarding' && currentPath !== '/login' && !isPublicRoute) {
      router.push('/onboarding');
    }
  }, [authUser, user, authLoading, appLoading, currentPath, isPublicRoute, router]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed', err));
    }
  }, []);

  // Don't render content until auth checks are done (exempt public routes so guests can browse immediately)
  if (!isPublicRoute && (authLoading || (authUser && !user))) return (
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
        <GlobalSimulatorBar />
        {children}
      </div>
      {!hideTabBar && <SafeBottomNav />}
          </FeedProvider>
    </ChatProvider>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <GlobalErrorBoundary>
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>More Community | Find Your People, Connect in Real Life</title>
        <meta name="description" content="More Community empowers local leaders and brings people together in the real world. Discover clubs, join in-person meetups, and experience the joy of shared passions. 100% free forever for community champions." />
        <meta property="og:site_name" content="More Community" />
        <meta property="og:title" content="More Community | Find Your People, Connect in Real Life" />
        <meta property="og:description" content="Discover local groups, join in-person meetups, and build genuine community where you live. Free tools for community leaders." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.morecommunity.app/images/og-share.png" />
        <meta property="og:image:secure_url" content="https://www.morecommunity.app/images/og-share.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="More Community Logo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="More Community | Find Your People, Connect in Real Life" />
        <meta name="twitter:description" content="Discover local groups, join in-person meetups, and build genuine community where you live. Free tools for community leaders." />
        <meta name="twitter:image" content="https://www.morecommunity.app/images/og-share.png" />
        <meta name="twitter:image:alt" content="More Community Logo" />
        <meta name="theme-color" content="#020617" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="More" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
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
    </GlobalErrorBoundary>
  );
}
