"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, Component } from 'react';
import { AppProvider, useAppContext } from '../src/context/AppContext';
import { ChatProvider } from '../src/context/ChatContext';
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
        <div style={{ background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '40px 20px', minHeight: '100vh' }}>
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
        </div>
      );
    }
    return this.props.children;
  }
}

class SafeBottomNav extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('BottomNav crashed:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return <BottomNav />;
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

export default function ClientLayout({ children }) {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <MainLayout>{children}</MainLayout>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
