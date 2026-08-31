import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Users, Calendar, MessageCircle, BarChart2, User, Bell, Shield, Home } from 'lucide-react';
import React, { Suspense } from 'react';
import AppHeader from './components/AppHeader';
import HomeFeed from './views/HomeFeed';
import PageTransition from './components/PageTransition';
import { useAppContext } from './context/AppContext';
import { useChat } from './context/ChatContext';

// Lazy-loaded routes — only downloaded when navigated to
const Discover = React.lazy(() => import('./views/Discover'));
const CommunityProfile = React.lazy(() => import('./views/CommunityProfile'));
const EventDetail = React.lazy(() => import('./views/EventDetail'));
const Chat = React.lazy(() => import('./views/Chat'));
const LeaderDashboard = React.lazy(() => import('./views/LeaderDashboard'));
const UserProfile = React.lazy(() => import('./views/UserProfile'));
const SettingsScreen = React.lazy(() => import('./views/SettingsScreen'));
const NotificationsFeed = React.lazy(() => import('./views/NotificationsFeed'));
const AdminDashboard = React.lazy(() => import('./views/AdminDashboard'));
const OnboardingFlow = React.lazy(() => import('./views/OnboardingFlow'));
const Leaderboard = React.lazy(() => import('./views/Leaderboard'));
const ExperiencesMarketplace = React.lazy(() => import('./views/ExperiencesMarketplace'));

function RouteFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--slate-950)' }}>
      <div className="skeleton" style={{ width: '120px', height: '4px', borderRadius: '99px' }} />
    </div>
  );
}

function TabBar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, notifications, communities, channels } = useAppContext();
    const { messages, directMessages, chatReadReceipts } = useChat();
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;
  
  let unreadChatCount = 0;
  if (user && user.id) {
    // Check Channels
    const myCommunities = communities.filter(c => user.joinedCommunities.includes(c.id));
    myCommunities.forEach(c => {
      const communityChannels = channels.filter(ch => ch.community_id === c.id);
      const activeChannels = communityChannels.length > 0 ? communityChannels : [{ id: 'general' }];
      activeChannels.forEach(ch => {
        const latestMsg = messages.filter(m => m.communityId === c.id && m.channel === ch.id).pop();
        if (latestMsg && latestMsg.authorId !== user.id) {
          const receipt = chatReadReceipts.find(r => r.community_id === c.id && r.channel_id === ch.id);
          if (!receipt || new Date(receipt.last_read_at) < new Date(latestMsg.createdAt || new Date().toISOString())) {
            unreadChatCount++;
          }
        }
      });
    });

    // Check DMs
    const dmUsers = new Set();
    directMessages.forEach(dm => {
      if (dm.senderId === user.id) dmUsers.add(dm.receiverId);
      if (dm.receiverId === user.id) dmUsers.add(dm.senderId);
    });
    dmUsers.forEach(otherId => {
      const latestDm = directMessages.filter(m => (m.senderId === otherId && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === otherId)).pop();
      if (latestDm && latestDm.senderId !== user.id) {
        const receipt = chatReadReceipts.find(r => !r.community_id && r.channel_id === otherId);
        if (!receipt || new Date(receipt.last_read_at) < new Date(latestDm.createdAt || new Date().toISOString())) {
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
      <Link href="/chat" className={`tab-item ${currentPath.startsWith('/chat') ? 'active' : ''}`} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <MessageCircle size={22} />
          {unreadChatCount > 0 && (
            <div style={{
              position: 'absolute', top: '-4px', right: '-6px',
              background: 'var(--teal-500)', color: 'var(--white)',
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
              background: 'var(--rose-500)', color: 'var(--white)',
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
      {user.isAdmin && (
        <Link href="/admin" className={`tab-item ${currentPath === '/admin' ? 'active' : ''}`}>
          <Shield size={22} />
          <span className="tab-label">Admin</span>
        </Link>
      )}
      {(user.isAdmin || user.ledCommunities?.length > 0) && (
        <Link href="/dashboard" className={`tab-item ${currentPath === '/dashboard' ? 'active' : ''}`}>
          <BarChart2 size={22} />
          <span className="tab-label">Lead</span>
        </Link>
      )}
      {!(user.isAdmin || user.ledCommunities?.length > 0) && (
        <Link href="/profile" className={`tab-item ${currentPath.startsWith('/profile') ? 'active' : ''}`}>
          <User size={22} />
          <span className="tab-label">Profile</span>
        </Link>
      )}
    </div>
  );
}

function NotificationsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppHeader title="Notifications" />
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
        <NotificationsFeed />
      </div>
    </div>
  );
}

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  return (
    <div style={{ padding: '40px', color: 'var(--white)', background: 'var(--slate-950)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ color: 'var(--rose-500)', fontFamily: 'var(--font-heading)', marginBottom: '16px' }}>Something went wrong</h2>
      <p style={{ color: 'var(--slate-400)', marginBottom: '24px', textAlign: 'center' }}>
        We hit an unexpected problem. Our team has been notified. Please try reloading.
      </p>
      {process.env.DEV && (
        <pre style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', overflowX: 'auto', maxWidth: '100%', fontSize: '0.8rem', color: 'var(--slate-300)', marginBottom: '24px' }}>
          {error.message}
        </pre>
      )}
      <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '8px' }}>Reload Page</button>
    </div>
  );
}

function App() {
  const { user } = useAppContext();

  if (user && user.onboarded === false) {
    return <Suspense fallback={<RouteFallback />}><OnboardingFlow onComplete={() => {}} /></Suspense>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter basename={process.env.BASE_URL}>
        <div className="app-container">
          <div className="app-content">
            <Suspense fallback={<RouteFallback />}>
              <PageTransition>
                <Routes>
                  <Route path="/" element={<HomeFeed />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/community/:id" element={<CommunityProfile />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/profile/:id" element={<UserProfile />} />
                  <Route path="/events" element={<EventDetail />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:communityId/:channelId" element={<Chat />} />
                  <Route path="/chat/dm/:targetUserId" element={<Chat />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/dashboard" element={<LeaderDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/settings" element={<SettingsScreen />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/experiences" element={<ExperiencesMarketplace />} />
                </Routes>
              </PageTransition>
            </Suspense>
          </div>
          <TabBar />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
