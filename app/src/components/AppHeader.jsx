"use client";
import { useRouter as useNavigate } from 'next/navigation';
import { ChevronLeft, Bell, Sun, Moon, Monitor } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AppHeader({ title, subtitle, rightElement, showBack = false, onBack, avatar, onAvatarClick }) {
  const navigate = useNavigate();
  const { user, notifications, theme, setTheme } = useAppContext();
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate.back();
  };

  const defaultRightElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      <button
        onClick={() => navigate.push('/create-community')}
        className="interactive-press"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: 'rgba(20, 184, 166, 0.15)',
          border: '1px solid rgba(20, 184, 166, 0.4)',
          color: 'var(--teal-300)',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
        title="Start a Community"
      >
        <span style={{ fontSize: '1rem', lineHeight: 1, fontWeight: 800 }}>+</span>
        <span className="header-start-text">Start</span>
      </button>
      <div 
        className="interactive-press"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-300)', padding: '4px', flexShrink: 0 }}
        title="Toggle Theme"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </div>
      <div 
        className="interactive-press" 
        onClick={() => navigate.push('/notifications')}
        style={{ position: 'relative', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
        title="Notifications"
      >
        <Bell size={20} color="var(--slate-300)" />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '1px', right: '1px',
            background: 'var(--rose-500)', color: 'var(--white)',
            fontSize: '0.55rem', fontWeight: 700,
            width: '15px', height: '15px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--slate-900)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
      {user && (
        <div 
          className="interactive-press" 
          onClick={() => navigate.push('/profile')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Profile"
        >
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=14b8a6&color=fff`} alt={user.name || 'User'} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--slate-800)', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
        {showBack ? (
          <button 
            onClick={handleBack}
            className="interactive-press"
            style={{ 
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
            title="Go Back"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}
        
        <img 
          src="/logo.png" className="theme-invert" 
          alt="more." 
          style={{ height: '22px', cursor: 'pointer', flexShrink: 0 }} 
          onClick={() => navigate.push('/app')} 
        />
        
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
            <span style={{ color: 'var(--slate-500)', fontSize: '1rem', flexShrink: 0 }}>/</span>
            {avatar && (
              <img 
                src={avatar} 
                alt={title} 
                onClick={onAvatarClick}
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', cursor: onAvatarClick ? 'pointer' : 'default', flexShrink: 0 }} 
              />
            )}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h1 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', cursor: onAvatarClick ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={onAvatarClick}>{title}</h1>
              {subtitle && <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {rightElement !== undefined ? rightElement : defaultRightElement}
      </div>
    </div>
  );
}
