"use client";
import { useRouter as useNavigate, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Activity, Compass, Calendar, Sparkles, MessageCircle, Shield, Crown, ChevronLeft, Bell, Sun, Moon, Monitor, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import NotificationsFeed from './NotificationsFeed';
import { useAppContext } from '../context/AppContext';
import { resolveUserAvatar } from '../lib/avatar';

export default function AppHeader({ title, subtitle, rightElement, showBack = false, onBack, avatar, onAvatarClick }) {
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkWidth = () => {
      setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const handleBellClick = () => {
    if (isDesktop) {
      setShowNotificationsModal(prev => !prev);
    } else {
      navigate.push('/notifications');
    }
  };
  const navigate = useNavigate();
  const currentPath = usePathname();
  const { user, notifications, theme, setTheme } = useAppContext();
  const chatCtx = useChat() || {};
  const directMessages = Array.isArray(chatCtx.directMessages) ? chatCtx.directMessages : [];
  const chatReadReceipts = Array.isArray(chatCtx.chatReadReceipts) ? chatCtx.chatReadReceipts : [];
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  let unreadChatCount = 0;
  if (user?.id && directMessages.length > 0) {
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

  const isLeader = Array.isArray(user?.ledCommunities) && user.ledCommunities.length > 0;
  const desktopNavItems = [
    { id: 'home', label: 'Home', icon: Activity, href: '/app', active: currentPath === '/app' || currentPath === '/' },
    { id: 'discover', label: 'Discover', icon: Compass, href: '/discover', active: Boolean(currentPath?.startsWith('/discover')) },
    { id: 'events', label: 'Events', icon: Calendar, href: '/events', active: Boolean(currentPath?.startsWith('/events')) },
    { id: 'chat', label: 'Chat', icon: MessageCircle, href: '/chat', badge: unreadChatCount, active: Boolean(currentPath?.startsWith('/chat')) },
    ...(isLeader ? [{ id: 'leader', label: 'Leader', icon: Crown, href: '/dashboard', active: Boolean(currentPath?.startsWith('/dashboard')) }] : []),
    ...((user?.isAdmin || currentPath?.startsWith('/admin')) ? [{ id: 'admin', label: 'Admin', icon: Shield, href: '/admin', active: Boolean(currentPath?.startsWith('/admin')) }] : []),
  ];

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
        onClick={handleBellClick}
        style={{ position: 'relative', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={20} color={theme === 'light' ? '#334155' : 'var(--slate-300)'} />
        {unreadCount > 0 && (
          <div 
            className="notification-badge"
            style={{
              position: 'absolute', top: '1px', right: '1px',
              background: '#ef4444', color: '#ffffff',
              fontSize: '0.55rem', fontWeight: 800,
              minWidth: '15px', height: '15px', borderRadius: '999px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px',
              border: theme === 'light' ? '2px solid #ffffff' : '2px solid var(--slate-900)',
              lineHeight: 1
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
      {user?.id ? (
        <div 
          className="interactive-press" 
          onClick={() => navigate.push(`/profile/${user.id}`)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Profile"
        >
          <img src={resolveUserAvatar(user)} alt={user.name || 'User'} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--slate-800)', objectFit: 'cover' }} />
        </div>
      ) : (
        <button
          onClick={() => navigate.push('/login')}
          className="interactive-press"
          style={{
            padding: '5px 10px',
            borderRadius: '999px',
            background: 'var(--slate-800)', border: '1px solid var(--slate-700)', color: 'var(--white)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          Sign In
        </button>
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
              background: 'var(--slate-800)', border: '1px solid var(--slate-700)', color: 'var(--white)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
            }}
            title="Go Back"
          >
            <ChevronLeft size={18} />
          </button>
        ) : null}
        
        <button
          type="button"
          onClick={() => navigate.push('/app')}
          aria-label="Go to More Home"
          className="interactive-press"
          style={{
            background: "none",
            border: "none",
            padding: "6px 8px",
            margin: "-6px -4px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            borderRadius: "8px"
          }}
        >
          <img 
            src="/logo.png" className="theme-invert" 
            alt="more." 
            style={{ height: "22px", display: "block", pointerEvents: "none" }} 
          />
        </button>
        
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
      <nav className="desktop-nav-bar" aria-label="Primary navigation">
        {desktopNavItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`desktop-nav-item ${item.active ? 'active' : ''}`}
            >
              <Icon size={15} strokeWidth={item.active ? 2.4 : 2} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="desktop-nav-badge">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {rightElement !== undefined ? rightElement : defaultRightElement}
      </div>

      {isMounted && showNotificationsModal && createPortal(
        <div 
          className="modal-overlay notifications-desktop-overlay"
          onClick={() => setShowNotificationsModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: '68px 24px 24px',
            overflowY: 'auto'
          }}
        >
          <div 
            className="notifications-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: 'calc(100dvh - 92px)',
              borderRadius: '16px',
              overflow: 'hidden',
              background: theme === 'light' ? '#ffffff' : '#0f172a',
              border: theme === 'light' ? '1px solid rgba(15, 23, 42, 0.12)' : '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: theme === 'light'
                ? '0 25px 60px -15px rgba(15, 23, 42, 0.25)'
                : '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              animation: 'slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <NotificationsFeed onClose={() => setShowNotificationsModal(false)} isModal={true} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
