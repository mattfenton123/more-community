"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  Bell, Check, CheckCheck, Calendar, Users, Megaphone, MessageCircle, 
  Ticket, Star, UserPlus, Trash2, Zap, Map, Sparkles, Lightbulb, Car, 
  ChevronRight, X, ArrowLeft 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useRouter as useNavigate } from 'next/navigation';

const TYPE_CONFIG = {
  alert: { icon: Zap, color: '#f59e0b', label: 'Alert' },
  broadcast: { icon: Megaphone, color: '#f59e0b', label: 'Announcement' },
  event: { icon: Calendar, color: '#14b8a6', label: 'Event' },
  community: { icon: Users, color: '#3b82f6', label: 'Community' },
  message: { icon: MessageCircle, color: '#22c55e', label: 'Message' },
  rsvp: { icon: Ticket, color: '#8b5cf6', label: 'RSVP' },
  badge: { icon: Star, color: '#f59e0b', label: 'Badge' },
  member: { icon: UserPlus, color: '#ec4899', label: 'Member' },
  chapter: { icon: Map, color: '#0284c7', label: 'Chapter' },
  pitch: { icon: Sparkles, color: '#10b981', label: 'Pitch' },
  idea: { icon: Lightbulb, color: '#f59e0b', label: 'Idea' },
  carpool: { icon: Car, color: '#0d9488', label: 'Carpool' },
  default: { icon: Bell, color: '#14b8a6', label: 'Notification' }
};

function getNotificationType(n) {
  const t = (n.type || '').toLowerCase();
  if (TYPE_CONFIG[t]) return t;
  const title = (n.title || '').toLowerCase();
  const msg = (n.message || '').toLowerCase();
  if (t === 'alert' || title.includes('alert') || title.includes('urgent') || title.includes('warning')) return 'alert';
  if (t === 'broadcast' || title.includes('broadcast') || title.includes('📢') || title.includes('announcement')) return 'broadcast';
  if (t === 'chapter' || title.includes('chapter')) return 'chapter';
  if (t === 'pitch' || title.includes('pitch')) return 'pitch';
  if (t === 'idea' || title.includes('idea') || title.includes('suggestion')) return 'idea';
  if (t === 'carpool' || title.includes('carpool') || title.includes('ride') || title.includes('lift')) return 'carpool';
  if (t === 'rsvp' || title.includes('rsvp') || title.includes('ticket') || msg.includes('rsvp')) return 'rsvp';
  if (t === 'event' || title.includes('event') || msg.includes('event') || title.includes('walk')) return 'event';
  if (t === 'message' || title.includes('message') || msg.includes('message')) return 'message';
  if (t === 'badge' || title.includes('badge') || msg.includes('badge')) return 'badge';
  if (t === 'member' || title.includes('join') || msg.includes('joined') || msg.includes('member')) return 'member';
  if (title.includes('community')) return 'community';
  return 'default';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function SwipeableNotificationItem({ n, type, config, isAlertItem, isLight, onClick, onMarkRead }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontal = useRef(null);

  const Icon = config.icon;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartX.current - currentX; // positive when swiped left
    const deltaY = touchStartY.current - currentY;

    if (isHorizontal.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontal.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontal.current) {
      if (deltaX > 0) {
        setDragOffset(Math.min(deltaX, 110));
        setIsSwiping(true);
      } else {
        setDragOffset(0);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset >= 55) {
      onMarkRead(n.id);
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        try { window.navigator.vibrate(35); } catch (err) {}
      }
      setDragOffset(0);
    } else {
      setDragOffset(0);
    }
    setIsSwiping(false);
    isHorizontal.current = null;
  };

  const handleClick = (e) => {
    if (dragOffset > 10) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick(n);
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.04)',
        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)'
      }}
    >
      {/* Background action revealed on swipe */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '100px',
          background: n.is_read ? (isLight ? '#cbd5e1' : '#334155') : '#0d9488',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '3px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.72rem',
          zIndex: 1
        }}
      >
        <Check size={18} strokeWidth={2.5} color="#ffffff" />
        <span>{n.is_read ? 'Read' : 'Mark Read'}</span>
      </div>

      {/* Foreground item */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          position: 'relative',
          zIndex: 2,
          transform: `translateX(-${dragOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: '13px 15px',
          background: isLight 
            ? (n.is_read ? '#ffffff' : (isAlertItem ? '#fffbeb' : '#f0fdfa'))
            : (n.is_read ? 'transparent' : (isAlertItem ? 'rgba(245,158,11,0.08)' : `${config.color}08`)),
          borderLeft: !n.is_read 
            ? (isAlertItem ? '4px solid #f59e0b' : `4px solid ${config.color}`)
            : '4px solid transparent',
          cursor: 'pointer',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}
      >
        {/* Type Icon */}
        <div style={{ 
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: `${config.color}18`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={config.color} />
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ 
              fontSize: '0.62rem', 
              fontWeight: 800, 
              padding: '1px 6px', 
              borderRadius: '4px', 
              background: `${config.color}22`, 
              color: isLight ? (isAlertItem ? '#b45309' : config.color) : config.color, 
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}>
              {config.label}
            </span>
            <div style={{ 
              fontWeight: n.is_read ? 600 : 700, 
              color: isLight ? (n.is_read ? '#334155' : '#0f172a') : (n.is_read ? 'var(--slate-300)' : '#ffffff'), 
              fontSize: '0.86rem', 
              flex: 1, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {n.title}
            </div>
            {!n.is_read && (
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: config.color, flexShrink: 0 }} />
            )}
          </div>

          <div style={{ 
            color: isLight ? '#475569' : 'var(--slate-400)', 
            fontSize: '0.79rem', 
            lineHeight: 1.42, 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden' 
          }}>
            {n.message}
          </div>

          <div style={{ 
            color: isLight ? '#64748b' : 'var(--slate-500)', 
            fontSize: '0.69rem', 
            marginTop: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{timeAgo(n.created_at)}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.65, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              swipe 👈
            </span>
          </div>
        </div>

        {/* 1-Click Desktop action button */}
        {!n.is_read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(n.id);
            }}
            title="Mark as read"
            className="interactive-press"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)',
              color: isLight ? '#0d9488' : '#2dd4bf',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              alignSelf: 'center',
              marginLeft: '4px'
            }}
          >
            <Check size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationsFeed({ onClose, isModal = false }) {
  const { notifications, markNotificationRead, theme } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'alerts' | 'history'
  const [selectedNotification, setSelectedNotification] = useState(null);

  const isLight = theme === 'light';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const inboxList = notifications.filter(n => !n.is_read || (Date.now() - new Date(n.created_at).getTime()) < THIRTY_DAYS);
  const alertsList = notifications.filter(n => {
    const t = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    return t === 'alert' || t === 'broadcast' || t === 'chapter' || t === 'pitch' || t === 'idea' ||
           title.includes('alert') || title.includes('📢') || title.includes('urgent') || title.includes('approved') || title.includes('chapter');
  });
  const historyList = notifications.filter(n => n.is_read && (Date.now() - new Date(n.created_at).getTime()) >= THIRTY_DAYS);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadAlertsCount = alertsList.filter(n => !n.is_read).length;
  
  let currentList = inboxList;
  if (activeTab === 'alerts') currentList = alertsList;
  if (activeTab === 'history') currentList = historyList;

  const sorted = [...currentList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    setSelectedNotification(n);
  };

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.is_read).forEach(n => markNotificationRead(n.id));
  };

  if (selectedNotification) {
    const type = getNotificationType(selectedNotification);
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
    const Icon = config.icon;

    return (
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: '440px', 
          minHeight: '340px', 
          padding: 0, 
          overflow: 'hidden', 
          border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)', 
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        {/* Header */}
        <div style={{ 
          padding: '14px 16px', 
          borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setSelectedNotification(null)} 
              className="interactive-press" 
              style={{ background: 'transparent', border: 'none', color: isLight ? '#475569' : 'var(--slate-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              title="Back to list"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ margin: 0, color: isLight ? '#0f172a' : 'var(--white)', fontSize: '0.98rem', fontFamily: 'var(--font-heading)' }}>Notification Details</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="interactive-press"
              style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : 'var(--slate-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: `${config.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={config.color} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: `${config.color}20`, color: config.color, textTransform: 'uppercase' }}>
                  {config.label}
                </span>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#64748b' : 'var(--slate-500)' }}>{timeAgo(selectedNotification.created_at)}</span>
              </div>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.02rem', color: isLight ? '#0f172a' : 'var(--white)', fontWeight: 700 }}>{selectedNotification.title}</h2>
            </div>
          </div>
          
          <div style={{ 
            color: isLight ? '#1e293b' : 'var(--slate-300)', 
            fontSize: '0.9rem', 
            lineHeight: 1.6, 
            padding: '16px', 
            background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)', 
            borderRadius: '12px', 
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)', 
            whiteSpace: 'pre-wrap' 
          }}>
            {selectedNotification.message}
          </div>
        </div>

        {selectedNotification.link && (
          <div style={{ padding: '14px 16px', borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)', background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.02)' }}>
            <button 
              onClick={() => { navigate.push(selectedNotification.link); if (onClose) onClose(); }}
              className="btn btn-primary interactive-press" 
              style={{ width: '100%', padding: '11px', borderRadius: '8px', background: '#0d9488', border: 'none', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              Open Details <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="glass-panel" 
      style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: 0, 
        overflow: 'hidden', 
        border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.95)',
        boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.08)' : '0 20px 40px rgba(0,0,0,0.4)'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '14px 16px', 
        borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, color: isLight ? '#0f172a' : 'var(--white)', fontSize: '0.98rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color={isLight ? '#0d9488' : 'var(--teal-400)'} /> Notifications
          </h3>
          {unreadCount > 0 && (
            <span 
              className="notification-badge"
              style={{ 
                fontSize: '0.64rem', 
                fontWeight: 800, 
                padding: '2px 7px', 
                borderRadius: '99px', 
                background: '#ef4444', 
                color: '#ffffff',
                lineHeight: 1
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead} 
              className="interactive-press"
              style={{ 
                background: isLight ? 'rgba(13,148,136,0.1)' : 'rgba(20,184,166,0.1)', 
                border: isLight ? '1px solid rgba(13,148,136,0.25)' : '1px solid rgba(20,184,166,0.2)', 
                borderRadius: '8px', 
                padding: '5px 9px', 
                color: isLight ? '#0d9488' : 'var(--teal-400)', 
                fontSize: '0.69rem', 
                fontWeight: 700, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}
            >
              <CheckCheck size={12} /> Mark all read
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="interactive-press"
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: isLight ? '#64748b' : 'var(--slate-400)', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                padding: '4px' 
              }}
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 3 Tabs: Inbox, Alerts, History */}
      <div style={{ 
        display: 'flex', 
        borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)', 
        background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)' 
      }}>
        <button 
          onClick={() => setActiveTab('inbox')}
          style={{
            flex: 1, padding: '10px 8px', background: 'transparent', border: 'none',
            borderBottom: activeTab === 'inbox' ? (isLight ? '2px solid #0d9488' : '2px solid var(--teal-400)') : '2px solid transparent',
            color: activeTab === 'inbox' ? (isLight ? '#0d9488' : 'var(--teal-400)') : (isLight ? '#64748b' : 'var(--slate-400)'),
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          Inbox {unreadCount > 0 && (
            <span style={{ 
              fontSize: '0.62rem', 
              padding: '1px 5px', 
              borderRadius: '99px', 
              background: isLight ? '#0d9488' : 'rgba(20,184,166,0.25)', 
              color: '#ffffff',
              fontWeight: 800
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          style={{
            flex: 1, padding: '10px 8px', background: 'transparent', border: 'none',
            borderBottom: activeTab === 'alerts' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'alerts' ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#64748b' : 'var(--slate-400)'),
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
          }}
        >
          <Zap size={13} color={activeTab === 'alerts' ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#64748b' : 'var(--slate-400)')} /> Alerts
          {unreadAlertsCount > 0 && (
            <span style={{ 
              fontSize: '0.62rem', 
              padding: '1px 5px', 
              borderRadius: '99px', 
              background: isLight ? '#d97706' : 'rgba(245,158,11,0.25)', 
              color: '#ffffff', 
              fontWeight: 800 
            }}>
              {unreadAlertsCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1, padding: '10px 8px', background: 'transparent', border: 'none',
            borderBottom: activeTab === 'history' ? (isLight ? '2px solid #0d9488' : '2px solid var(--teal-400)') : '2px solid transparent',
            color: activeTab === 'history' ? (isLight ? '#0d9488' : 'var(--teal-400)') : (isLight ? '#64748b' : 'var(--slate-400)'),
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
          }}
        >
          History
        </button>
      </div>
      
      {/* List */}
      <div style={{ maxHeight: isModal ? '430px' : '480px', overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '38px 16px', textAlign: 'center', color: isLight ? '#64748b' : 'var(--slate-400)' }}>
            {activeTab === 'alerts' ? (
              <>
                <Zap size={34} color="#f59e0b" style={{ opacity: 0.35, marginBottom: '10px' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#0f172a' : 'var(--slate-300)' }}>No active alerts</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#64748b' : 'var(--slate-500)' }}>Announcements, urgent notices, and leadership alerts appear here.</p>
              </>
            ) : activeTab === 'inbox' ? (
              <>
                <Bell size={34} style={{ opacity: 0.25, marginBottom: '10px', color: isLight ? '#0d9488' : 'inherit' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#0f172a' : 'var(--slate-300)' }}>You're all caught up!</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#64748b' : 'var(--slate-500)' }}>New event RSVPs, reminders, and community updates appear here.</p>
              </>
            ) : (
              <>
                <Bell size={34} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#0f172a' : 'var(--slate-300)' }}>No history available</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#64748b' : 'var(--slate-500)' }}>Read notifications older than 30 days appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sorted.map(n => {
              const type = getNotificationType(n);
              const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
              const isAlertItem = type === 'alert' || type === 'broadcast';

              return (
                <SwipeableNotificationItem 
                  key={n.id}
                  n={n}
                  type={type}
                  config={config}
                  isAlertItem={isAlertItem}
                  isLight={isLight}
                  onClick={handleNotificationClick}
                  onMarkRead={markNotificationRead}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
