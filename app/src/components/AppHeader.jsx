"use client";
import { useRouter as useNavigate } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AppHeader({ title, subtitle, rightElement, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { notifications } = useAppContext();
  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate.back();
  };

  const defaultRightElement = (
    <div 
      className="interactive-press" 
      onClick={() => navigate.push('/notifications')}
      style={{ position: 'relative', cursor: 'pointer', padding: '4px' }}
    >
      <Bell size={22} color="white" />
      {unreadCount > 0 && (
        <div style={{
          position: 'absolute', top: '0px', right: '0px',
          background: 'var(--rose-500)', color: 'white',
          fontSize: '0.6rem', fontWeight: 700,
          width: '16px', height: '16px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--slate-900)',
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
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
              background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <img 
            src={`/images/logo.webp`} 
            alt="more." 
            style={{ height: '24px', cursor: 'pointer' }} 
            onClick={() => navigate.back()} 
          />
        )}
        {title && (
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'white' }}>{title}</h1>
            {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 500 }}>{subtitle}</div>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {rightElement !== undefined ? rightElement : defaultRightElement}
      </div>
    </div>
  );
}
