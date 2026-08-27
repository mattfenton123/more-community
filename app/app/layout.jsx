"use client";

import '../src/index.css';
import { Compass, Users, Calendar, MessageCircle, BarChart2, User, Bell, Shield, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppProvider, useAppContext } from '../src/context/AppContext';
import { useChat } from '../src/context/ChatContext';
import { FeedProvider } from '../src/context/FeedContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/components/Toast';

function TabBar() {
  const currentPath = usePathname();
  const { user, notifications, communities, channels } = useAppContext();
    const { messages, directMessages, chatReadReceipts } = useChat();
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;
  
  let unreadChatCount = 0;
  // simplified unread chat count for migration...
  if (user && user.id) {
    const dmUsers = new Set();
    directMessages.forEach(dm => {
      if (dm.senderId === user.id) dmUsers.add(dm.receiverId);
      if (dm.receiverId === user.id) dmUsers.add(dm.senderId);
    });
    dmUsers.forEach(otherId => {
      const latestDm = directMessages.filter(m => (m.senderId === otherId && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === otherId)).pop();
      if (latestDm && latestDm.senderId !== user.id) {
        const receipt = chatReadReceipts.find(r => !r.community_id && r.channel_id === otherId);
        if (!receipt || new Date(receipt.last_read_at) < new Date(latestDm.created_at || new Date().toISOString())) {
          unreadChatCount++;
        }
      }
    });
  }

  return (
    <div className="tab-bar">
      <Link href="/" className={`tab-item ${currentPath === '/' ? 'active' : ''}`}>
        <Home size={22} />
        <span className="tab-label">Home</span>
      </Link>
      <Link href="/discover" className={`tab-item ${currentPath === '/discover' ? 'active' : ''}`}>
        <Compass size={22} />
        <span className="tab-label">Discover</span>
      </Link>
      <Link href="/events" className={`tab-item ${currentPath === '/events' ? 'active' : ''}`}>
        <Calendar size={22} />
        <span className="tab-label">Events</span>
      </Link>
      <Link href="/chat" className={`tab-item ${currentPath?.startsWith('/chat') ? 'active' : ''}`} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <MessageCircle size={22} />
          {unreadChatCount > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-6px',
              background: 'var(--teal-500)', color: 'white',
              fontSize: '0.6rem', fontWeight: 700,
              width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--slate-950)',
            }}>
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </div>
          )}
        </div>
        <span className="tab-label">Chat</span>
      </Link>
      <Link href="/notifications" className={`tab-item ${currentPath === '/notifications' ? 'active' : ''}`} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <Bell size={22} />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-6px',
              background: 'var(--rose-500)', color: 'white',
              fontSize: '0.6rem', fontWeight: 700,
              width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--slate-950)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        <span className="tab-label">Alerts</span>
      </Link>
      {user?.isAdmin && (
        <Link href="/admin" className={`tab-item ${currentPath === '/admin' ? 'active' : ''}`}>
          <Shield size={22} />
          <span className="tab-label">Admin</span>
        </Link>
      )}
      {user?.leaderOf && (
        <Link href="/dashboard" className={`tab-item ${currentPath === '/dashboard' ? 'active' : ''}`}>
          <BarChart2 size={22} />
          <span className="tab-label">Lead</span>
        </Link>
      )}
      {!user?.leaderOf && (
        <Link href="/profile" className={`tab-item ${currentPath?.startsWith('/profile') ? 'active' : ''}`}>
          <User size={22} />
          <span className="tab-label">Profile</span>
        </Link>
      )}
    </div>
  );
}

function MainLayout({ children }) {
  const currentPath = usePathname();
  const router = useRouter();
  const { user, isLoading: appLoading } = useAppContext();
  const { authUser, isLoading: authLoading } = useAuth();
  const isDashboard = currentPath?.startsWith('/dashboard') || currentPath?.startsWith('/council-dashboard') || currentPath?.startsWith('/admin');
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

  // Don't render content until auth checks are done
  if (authLoading || (authUser && !user)) return null;

  return (
    <div className={`app-container ${isDesktopFriendly ? 'desktop-mode' : ''}`}>
      <ChatProvider user={user}>
      <FeedProvider user={user}>

      <div className="app-content">

        {children}
            </div>
      {!isDashboard && <TabBar />}
          </FeedProvider>
    </ChatProvider>
    </div>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>more | The Power of Real-Life Connection</title>
        <meta name="description" content="more is a movement celebrating the power of connecting in person. Find local groups, join real-life meetups, and experience the joy of shared passions. Free for community leaders. Starting in Tunbridge Wells." />
        <meta property="og:title" content="more | The Power of Real-Life Connection" />
        <meta property="og:description" content="Find local groups, join real-life meetups, and experience the joy of shared passions." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80" />
        <meta name="theme-color" content="#020617" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="icon" href="https://fav.farm/✨" />
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
