"use client";
import { useRouter as useNavigate } from 'next/navigation';
import NotificationsFeed from '../../src/components/NotificationsFeed';
import AppHeader from '../../src/components/AppHeader';

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div
      className="view-notifications"
      style={{
        minHeight: '100dvh',
        background: 'var(--surface-canvas)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '96px',
      }}
    >
      <AppHeader title="Notifications" showBack={true} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '20px 16px 32px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            borderRadius: '18px',
            overflow: 'hidden',
          }}
        >
          <NotificationsFeed onClose={() => navigate.back()} isModal={false} />
        </div>
      </div>
    </div>
  );
}
