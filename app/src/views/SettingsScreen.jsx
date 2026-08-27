"use client";
import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Download, User, Shield, Info, ChevronRight, LogOut } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/Toast';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { signOut, authUser } = useAuth();
  const { user } = useAppContext();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    return window.matchMedia('(display-mode: standalone)').matches;
  });

  useEffect(() => {
    const handleInstallStatus = (e) => setIsInstalled(e.matches);
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener('change', handleInstallStatus);
    
    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast.success('App installed!', 'Find more. on your home screen');
      }
      setDeferredPrompt(null);
    } else {
      toast.info('Add to Home Screen', 'Use your browser\'s "Add to Home Screen" option to install more.');
    }
  };

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Not supported', 'Your browser doesn\'t support notifications');
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(false);
      toast.info('Notifications paused', 'You can re-enable them anytime');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notifications enabled!', 'You\'ll be notified about new messages and events');
        // Send a test notification
        new Notification('more. community', {
          body: 'Notifications are now enabled! 🎉',
          icon: '/portal/favicon.svg'
        });
      } else {
        toast.error('Permission denied', 'Please enable notifications in your browser settings');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out', 'See you next time!');
  };

  const menuItems = [
    { icon: <User size={20} />, label: 'View Profile', color: '#3b82f6', onClick: () => navigate.back() },
    { icon: <Shield size={20} />, label: 'Privacy & Security', color: '#a78bfa', onClick: () => toast.info('Coming soon', 'Privacy settings are on the way') },
    { icon: <Info size={20} />, label: 'About more.', color: 'var(--teal-400)', onClick: () => toast.info('more. v1.0.0', 'Built with ❤️ in Tunbridge Wells') },
  ];

  return (
    <div className="view-settings" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <AppHeader title="Settings" showBack={true} />

      {/* Profile Card */}
      <div style={{ padding: '0 20px 24px' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <img
            src={user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
            alt={user.name}
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--slate-700)' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>{user.name}</div>
            <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>{authUser?.email || user.bio || 'Community member'}</div>
          </div>
        </div>
      </div>

      {/* PWA Section */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--slate-400)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>App Experience</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Install App */}
          <button
            onClick={handleInstallApp}
            className="interactive-press"
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
              background: isInstalled ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.02)',
              border: isInstalled ? '1px solid rgba(20,184,166,0.15)' : '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)' }}>
              {isInstalled ? <Smartphone size={20} /> : <Download size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500, display: 'block' }}>{isInstalled ? 'App Installed' : 'Install App'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{isInstalled ? 'Running as a standalone app' : 'Add more. to your home screen'}</span>
            </div>
            {!isInstalled && <ChevronRight size={18} color="var(--slate-500)" />}
          </button>

          {/* Notifications Toggle */}
          <button
            onClick={handleToggleNotifications}
            className="interactive-press"
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: notificationsEnabled ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: notificationsEnabled ? 'var(--teal-400)' : 'var(--slate-500)' }}>
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500, display: 'block' }}>Push Notifications</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{notificationsEnabled ? 'Enabled — you\'ll get alerts' : 'Tap to enable alerts'}</span>
            </div>
            <div style={{
              width: '44px', height: '24px', borderRadius: '99px',
              background: notificationsEnabled ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
              position: 'relative', transition: 'background 0.2s'
            }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                position: 'absolute', top: '2px',
                left: notificationsEnabled ? '22px' : '2px',
                transition: 'left 0.2s'
              }}></div>
            </div>
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '32px' }}>
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            className="interactive-press stagger-item"
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: `${item.color}15`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: item.color,
            }}>
              {item.icon}
            </div>
            <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
            <ChevronRight size={18} color="var(--slate-500)" />
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={handleSignOut}
          className="btn btn-danger interactive-press"
          style={{
            width: '100%', padding: '16px', borderRadius: '12px',
            display: 'flex', justifyContent: 'center', gap: '8px',
            fontSize: '1rem',
          }}
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--slate-600)', fontSize: '0.75rem' }}>
        more. v1.0.0 • Made in Tunbridge Wells
      </div>
    </div>
  );
}
