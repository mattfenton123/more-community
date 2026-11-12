"use client";
import { useRouter as useNavigate } from 'next/navigation';
import NotificationsFeed from '../../src/components/NotificationsFeed';
import AppHeader from '../../src/components/AppHeader';

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--slate-950)' }}>
      <AppHeader title="Notifications" showBack onBack={() => navigate.back()} />
      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start', 
          padding: '20px 16px 80px',
          width: '100%'
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 45px rgba(0,0,0,0.25)' }}>
          <NotificationsFeed onClose={() => navigate.back()} isModal={false} />
        </div>
      </div>
    </div>
  );
}
