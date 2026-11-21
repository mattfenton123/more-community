"use client";
import { useState, useRef, useEffect } from 'react';
import {
  Bell, Check, CheckCheck, Calendar, Users, Megaphone, MessageCircle,
  Ticket, Star, UserPlus, Zap, Map, Sparkles, Lightbulb, Car,
  ChevronRight, X, ArrowLeft, Clock
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useRouter as useNavigate } from 'next/navigation';

const TYPE_CONFIG = {
  alert: { icon: Zap, color: '#f59e0b', label: 'Alert' },
  broadcast: { icon: Megaphone, color: '#f59e0b', label: 'Announcement' },
  reminder: { icon: Clock, color: '#EB5738', label: 'Reminder' },
  event: { icon: Calendar, color: '#EB5738', label: 'Event' },
  event_proposal: { icon: Lightbulb, color: '#f59e0b', label: 'Event Proposal' },
  event_proposal_approved: { icon: Sparkles, color: '#10b981', label: 'Approved' },
  community: { icon: Users, color: '#3b82f6', label: 'Community' },
  message: { icon: MessageCircle, color: '#22c55e', label: 'Message' },
  comment: { icon: MessageCircle, color: '#3A8E76', label: 'Comment' },
  rsvp: { icon: Ticket, color: '#8b5cf6', label: 'RSVP' },
  badge: { icon: Star, color: '#f59e0b', label: 'Badge' },
  member: { icon: UserPlus, color: '#ec4899', label: 'Member' },
  chapter: { icon: Map, color: '#0284c7', label: 'Chapter' },
  pitch: { icon: Sparkles, color: '#10b981', label: 'Pitch' },
  idea: { icon: Lightbulb, color: '#f59e0b', label: 'Idea' },
  carpool: { icon: Car, color: '#C85A32', label: 'Carpool' },
  default: { icon: Bell, color: '#EB5738', label: 'Notification' }
};

export function normalizeNotificationLink(rawLink, notification = null) {
  const link = String(rawLink || '').trim();
  if (!link || link === '/') {
    return '/app';
  }
  // Legacy /community/:id/admin route -> Leader Dashboard Overview for that community
  const legacyAdminMatch = link.match(/^\/community\/([^/?#]+)\/admin/i);
  if (legacyAdminMatch) {
    return `/dashboard?tab=overview&community=${legacyAdminMatch[1]}`;
  }
  // Normalize consolidated Leader Dashboard tab query params
  if (link.startsWith('/dashboard')) {
    let normalized = link
      .replace(/([?&])tab=members\b/gi, '$1tab=people')
      .replace(/([?&])tab=network\b/gi, '$1tab=events')
      .replace(/([?&])tab=experiences\b/gi, '$1tab=events')
      .replace(/([?&])tab=pitches\b/gi, '$1tab=overview')
      .replace(/([?&])tab=chapters\b/gi, '$1tab=settings');
    // If it's a chapter application alert with /dashboard?community=..., route directly to settings tab where Pending Chapter Applications live
    const title = String(notification?.title || '').toLowerCase();
    if (!/[?&]tab=/i.test(normalized) && title.includes('chapter application')) {
      normalized += (normalized.includes('?') ? '&' : '?') + 'tab=settings';
    }
    return normalized;
  }
  return link;
}

function getNotificationType(n) {
  const t = (n.type || '').toLowerCase();
  if (TYPE_CONFIG[t]) return t;
  const title = (n.title || '').toLowerCase();
  const msg = (n.message || '').toLowerCase();
  if (t === 'event_proposal' || title.includes('event proposal')) return 'event_proposal';
  if (t === 'event_proposal_approved' || title.includes('event idea was published')) return 'event_proposal_approved';
  if (t === 'reminder' || title.includes('reminder') || title.includes('⏰')) return 'reminder';
  if (t === 'alert' || title.includes('alert') || title.includes('urgent') || title.includes('warning')) return 'alert';
  if (t === 'broadcast' || title.includes('broadcast') || title.includes('📢') || title.includes('announcement')) return 'broadcast';
  if (t === 'chapter' || title.includes('chapter')) return 'chapter';
  if (t === 'pitch' || title.includes('pitch') || title.includes('sponsor') || title.includes('guest session')) return 'pitch';
  if (t === 'idea' || title.includes('idea') || title.includes('suggestion')) return 'idea';
  if (t === 'carpool' || title.includes('carpool') || title.includes('ride') || title.includes('lift')) return 'carpool';
  if (t === 'rsvp' || title.includes('rsvp') || title.includes('ticket') || title.includes('spot approved') || msg.includes('rsvp')) return 'rsvp';
  if (t === 'comment' || title.includes('comment') || title.includes('q&a') || title.includes('replied')) return 'comment';
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

function SwipeableNotificationItem({ n, config, isAlertItem, isLight, onClick, onOpenLink, onMarkRead }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontal = useRef(null);

  const Icon = config.icon;
  const resolvedLink = n.link ? normalizeNotificationLink(n.link, n) : null;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartX.current - currentX;
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
        borderBottom: isLight ? '1px solid rgba(28, 25, 21, 0.08)' : '1px solid rgba(244, 241, 234, 0.08)',
        background: isLight ? '#FFFFFF' : '#1B1B1B'
      }}
    >
      {/* Background action revealed on swipe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '112px',
          background: n.is_read ? (isLight ? '#6E655A' : '#3A3632') : '#C85A32',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '3px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.7rem',
          textAlign: 'center',
          padding: '0 6px',
          visibility: dragOffset > 2 ? 'visible' : 'hidden',
          zIndex: 1
        }}
      >
        <Check size={18} strokeWidth={2.5} color="#ffffff" />
        <span>{n.is_read ? 'Already read' : 'Mark as read'}</span>
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
            ? (n.is_read ? '#FFFFFF' : (isAlertItem ? '#FFFBEB' : '#FBF3EF'))
            : (n.is_read ? '#1B1B1B' : (isAlertItem ? '#241E14' : '#261C18')),
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
              color: isLight ? (n.is_read ? '#4A443C' : '#1C1915') : (n.is_read ? '#C8C4BC' : '#F4F1EA'),
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
            color: isLight ? '#4A443C' : '#C8C4BC',
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
            color: isLight ? '#6E655A' : '#9E9B95',
            fontSize: '0.69rem',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <span>{timeAgo(n.created_at)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {resolvedLink && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLink(n, resolvedLink);
                  }}
                  className="interactive-press"
                  style={{
                    background: isLight ? 'rgba(200, 90, 50, 0.12)' : 'rgba(235, 87, 56, 0.16)',
                    border: isLight ? '1px solid rgba(200, 90, 50, 0.28)' : '1px solid rgba(235, 87, 56, 0.32)',
                    color: isLight ? '#A33F1B' : '#F27257',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  Open <ChevronRight size={11} />
                </button>
              )}
              {n.is_read ? (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: isLight ? '#6E655A' : '#9E9B95',
                  background: isLight ? '#EFE9DE' : '#252525',
                  padding: '1px 7px',
                  borderRadius: '999px'
                }}>
                  Read
                </span>
              ) : (
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: isLight ? '#C85A32' : '#F27257' }}>
                  Unread
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Mark as Read button */}
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
              border: isLight ? '1px solid rgba(28, 25, 21, 0.12)' : '1px solid rgba(244, 241, 234, 0.12)',
              background: isLight ? 'rgba(28, 25, 21, 0.04)' : 'rgba(244, 241, 234, 0.06)',
              color: isLight ? '#C85A32' : '#F27257',
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
  const { notifications, markNotificationRead, markAllNotificationsRead, theme } = useAppContext();
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
    const type = getNotificationType(n);
    const title = (n.title || '').toLowerCase();
    return (
      type === 'alert' ||
      type === 'broadcast' ||
      type === 'chapter' ||
      type === 'pitch' ||
      type === 'idea' ||
      type === 'event_proposal' ||
      type === 'event_proposal_approved' ||
      type === 'reminder' ||
      title.includes('alert') ||
      title.includes('📢') ||
      title.includes('urgent') ||
      title.includes('approved') ||
      title.includes('chapter')
    );
  });
  const historyList = notifications.filter(n => n.is_read && (Date.now() - new Date(n.created_at).getTime()) >= THIRTY_DAYS);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadAlertsCount = alertsList.filter(n => !n.is_read).length;

  let currentList = inboxList;
  if (activeTab === 'alerts') currentList = alertsList;
  if (activeTab === 'history') currentList = historyList;

  const sorted = [...currentList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleNotificationClick = (n) => {
    if (!n.is_read) markNotificationRead(n.id);
    setSelectedNotification(n);
  };

  const handleOpenLink = (n, targetLink) => {
    if (!n.is_read) markNotificationRead(n.id);
    const resolved = targetLink || normalizeNotificationLink(n.link, n);
    if (!resolved) return;
    if (isModal && onClose) {
      onClose();
    }
    navigate.push(resolved);
  };

  const handleMarkAllRead = () => {
    if (typeof markAllNotificationsRead === 'function') {
      markAllNotificationsRead();
    } else {
      notifications.filter(n => !n.is_read).forEach(n => markNotificationRead(n.id));
    }
  };

  if (selectedNotification) {
    const type = getNotificationType(selectedNotification);
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
    const Icon = config.icon;
    const resolvedDetailLink = selectedNotification.link
      ? normalizeNotificationLink(selectedNotification.link, selectedNotification)
      : null;

    return (
      <div
        style={{
          width: '100%',
          maxWidth: isModal ? '440px' : '520px',
          minHeight: '340px',
          maxHeight: isModal ? 'calc(100dvh - 96px)' : 'none',
          borderRadius: '16px',
          padding: 0,
          overflow: 'hidden',
          border: isLight ? '1px solid rgba(28, 25, 21, 0.12)' : '1px solid rgba(244, 241, 234, 0.14)',
          background: isLight ? '#FFFFFF' : '#1B1B1B',
          boxShadow: isLight ? '0 10px 30px rgba(28, 25, 21, 0.08)' : '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: isLight ? '1px solid rgba(28, 25, 21, 0.10)' : '1px solid #252525',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isLight ? '#F7F3EC' : '#252525'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setSelectedNotification(null)}
              className="interactive-press"
              style={{ background: 'transparent', border: 'none', color: isLight ? '#4A443C' : '#C8C4BC', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              title="Back to list"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 style={{ margin: 0, color: isLight ? '#1C1915' : '#F4F1EA', fontSize: '0.98rem', fontFamily: 'var(--font-heading)' }}>Notification Details</h3>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="interactive-press"
              style={{ background: 'transparent', border: 'none', color: isLight ? '#6E655A' : '#9E9B95', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
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
                <span style={{ fontSize: '0.72rem', color: isLight ? '#6E655A' : '#9E9B95' }}>{timeAgo(selectedNotification.created_at)}</span>
              </div>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.02rem', color: isLight ? '#1C1915' : '#F4F1EA', fontWeight: 700 }}>{selectedNotification.title}</h2>
            </div>
          </div>

          <div style={{
            color: isLight ? '#1C1915' : '#C8C4BC',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            padding: '16px',
            background: isLight ? '#F7F3EC' : '#252525',
            borderRadius: '12px',
            border: isLight ? '1px solid rgba(28, 25, 21, 0.10)' : '1px solid rgba(244, 241, 234, 0.08)',
            whiteSpace: 'pre-wrap'
          }}>
            {selectedNotification.message}
          </div>
        </div>

        {resolvedDetailLink && (
          <div style={{ padding: '14px 16px', borderTop: isLight ? '1px solid rgba(28, 25, 21, 0.08)' : '1px solid rgba(244, 241, 234, 0.08)', background: isLight ? '#F7F3EC' : '#252525' }}>
            <button
              onClick={() => handleOpenLink(selectedNotification, resolvedDetailLink)}
              className="btn btn-primary interactive-press"
              style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'var(--brand-accent)', border: 'none', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
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
      style={{
        width: '100%',
        maxWidth: isModal ? '440px' : '520px',
        borderRadius: '16px',
        padding: 0,
        overflow: 'hidden',
        border: isLight ? '1px solid rgba(28, 25, 21, 0.12)' : '1px solid rgba(244, 241, 234, 0.14)',
        background: isLight ? '#FFFFFF' : '#1B1B1B',
        boxShadow: isLight ? '0 10px 30px rgba(28, 25, 21, 0.08)' : '0 20px 40px rgba(0,0,0,0.6)'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: isLight ? '1px solid rgba(28, 25, 21, 0.10)' : '1px solid #252525',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: isLight ? '#F7F3EC' : '#252525'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, color: isLight ? '#1C1915' : '#F4F1EA', fontSize: '0.98rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color={isLight ? '#C85A32' : '#EB5738'} /> Notifications
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
                background: isLight ? 'rgba(200, 90, 50, 0.10)' : 'rgba(235, 87, 56, 0.14)',
                border: isLight ? '1px solid rgba(200, 90, 50, 0.25)' : '1px solid rgba(235, 87, 56, 0.28)',
                borderRadius: '8px',
                padding: '5px 9px',
                color: isLight ? '#A33F1B' : '#F27257',
                fontSize: '0.69rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCheck size={12} /> Mark all as read
            </button>
          )}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="interactive-press"
              style={{
                background: 'transparent',
                border: 'none',
                color: isLight ? '#6E655A' : '#9E9B95',
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
        borderBottom: isLight ? '1px solid rgba(28, 25, 21, 0.10)' : '1px solid #252525',
        background: isLight ? '#EFE9DE' : '#252525'
      }}>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            flex: 1, padding: '10px 8px', background: 'transparent', border: 'none',
            borderBottom: activeTab === 'inbox' ? (isLight ? '2px solid #C85A32' : '2px solid #EB5738') : '2px solid transparent',
            color: activeTab === 'inbox' ? (isLight ? '#A33F1B' : '#F27257') : (isLight ? '#6E655A' : '#9E9B95'),
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          Inbox {unreadCount > 0 && (
            <span style={{
              fontSize: '0.62rem',
              padding: '1px 5px',
              borderRadius: '99px',
              background: isLight ? '#C85A32' : '#EB5738',
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
            color: activeTab === 'alerts' ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#6E655A' : '#9E9B95'),
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
          }}
        >
          <Zap size={13} color={activeTab === 'alerts' ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#6E655A' : '#9E9B95')} /> Alerts
          {unreadAlertsCount > 0 && (
            <span style={{
              fontSize: '0.62rem',
              padding: '1px 5px',
              borderRadius: '99px',
              background: isLight ? '#d97706' : 'rgba(245,158,11,0.28)',
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
            borderBottom: activeTab === 'history' ? (isLight ? '2px solid #C85A32' : '2px solid #EB5738') : '2px solid transparent',
            color: activeTab === 'history' ? (isLight ? '#A33F1B' : '#F27257') : (isLight ? '#6E655A' : '#9E9B95'),
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
          }}
        >
          History
        </button>
      </div>

      {/* List */}
      <div style={{ maxHeight: isModal ? 'min(430px, calc(100dvh - 230px))' : '560px', overflowY: 'auto', background: isLight ? '#FFFFFF' : '#1B1B1B' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '38px 16px', textAlign: 'center', color: isLight ? '#6E655A' : '#9E9B95' }}>
            {activeTab === 'alerts' ? (
              <>
                <Zap size={34} color="#f59e0b" style={{ opacity: 0.35, marginBottom: '10px' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#1C1915' : '#F4F1EA' }}>No active alerts</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#6E655A' : '#9E9B95' }}>Announcements, event proposals, reminders, and leadership alerts appear here.</p>
              </>
            ) : activeTab === 'inbox' ? (
              <>
                <Bell size={34} style={{ opacity: 0.25, marginBottom: '10px', color: isLight ? '#C85A32' : 'inherit' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#1C1915' : '#F4F1EA' }}>You&apos;re all caught up!</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#6E655A' : '#9E9B95' }}>New event RSVPs, reminders, and community updates appear here.</p>
              </>
            ) : (
              <>
                <Bell size={34} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#1C1915' : '#F4F1EA' }}>No history available</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: isLight ? '#6E655A' : '#9E9B95' }}>Previously read notifications older than 30 days appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sorted.map(n => {
              const type = getNotificationType(n);
              const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
              const isAlertItem = type === 'alert' || type === 'broadcast' || type === 'event_proposal';

              return (
                <SwipeableNotificationItem
                  key={n.id}
                  n={n}
                  type={type}
                  config={config}
                  isAlertItem={isAlertItem}
                  isLight={isLight}
                  onClick={handleNotificationClick}
                  onOpenLink={handleOpenLink}
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
