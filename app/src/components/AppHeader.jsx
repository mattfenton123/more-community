"use client";
import { useRouter as useNavigate } from 'next/navigation';
import { ChevronLeft, Bell, Sun, Moon, Monitor } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AppHeader({ title, subtitle, rightElement, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { user, notifications, theme, setTheme } = useAppContext();
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate.back();
  };

  const defaultRightElement = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div 
        className="interactive-press"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-300)' }}
      >
        {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
      </div>
      <div 
        className="interactive-press" 
        onClick={() => navigate.push('/notifications')}
        style={{ position: 'relative', cursor: 'pointer', padding: '4px' }}
      >
        <Bell size={22} color="var(--slate-300)" />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '0px', right: '0px',
            background: 'var(--rose-500)', color: 'var(--white)',
            fontSize: '0.6rem', fontWeight: 700,
            width: '16px', height: '16px', borderRadius: '50%',
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
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=14b8a6&color=fff`} alt={user.name || 'User'} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--slate-800)', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="app-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--slate-900)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack ? (
          <button 
            onClick={handleBack}
            className="interactive-press"
            style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}
        
        <img 
          src="/logo.png" className="theme-invert" 
          alt="more." 
          style={{ height: '24px', cursor: 'pointer' }} 
          onClick={() => navigate.push('/')} 
        />
        
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
            <span style={{ color: 'var(--slate-500)', fontSize: '1.2rem' }}>/</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>{title}</h1>
              {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 500 }}>{subtitle}</div>}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {rightElement !== undefined ? rightElement : defaultRightElement}
      </div>
    </div>
  );
}
