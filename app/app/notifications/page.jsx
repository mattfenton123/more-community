"use client";
import { Bell, Check, CheckCheck, Calendar, Users, Megaphone, MessageCircle, Ticket, Star, UserPlus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { useRouter as useNavigate } from 'next/navigation';

const TYPE_CONFIG = {
  event: { icon: Calendar, color: '#14b8a6' },
  community: { icon: Users, color: '#3b82f6' },
  broadcast: { icon: Megaphone, color: '#f59e0b' },
  message: { icon: MessageCircle, color: '#22c55e' },
  rsvp: { icon: Ticket, color: '#a78bfa' },
  badge: { icon: Star, color: '#f59e0b' },
  member: { icon: UserPlus, color: '#ec4899' },
  default: { icon: Bell, color: 'var(--teal-400)' }
};

function getNotificationType(n) {
  const title = (n.title || '').toLowerCase();
  const msg = (n.message || '').toLowerCase();
  if (title.includes('event') || msg.includes('event')) return 'event';
  if (title.includes('broadcast') || title.includes('📢') || title.includes('announcement')) return 'broadcast';
  if (title.includes('message') || msg.includes('message')) return 'message';
  if (title.includes('rsvp') || msg.includes('rsvp') || msg.includes('ticket')) return 'rsvp';
  if (title.includes('badge') || msg.includes('badge') || msg.includes('achievement')) return 'badge';
  if (title.includes('join') || msg.includes('joined') || msg.includes('member')) return 'member';
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

export default function NotificationsFeed({ onClose }) {
  const { notifications, markNotificationRead } = useAppContext();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const sorted = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleNotificationClick = (n) => {
    markNotificationRead(n.id);
    if (n.link) { navigate.back(); if (onClose) onClose(); }
  };

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.is_read).forEach(n => markNotificationRead(n.id));
  };

  return (
    <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} /> Notifications
          {unreadCount > 0 && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'var(--teal-500)', color: 'white' }}>
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="interactive-press"
            style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '8px', padding: '5px 10px', color: 'var(--teal-400)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>
      
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--slate-400)' }}>
            <Bell size={36} style={{ opacity: 0.15, marginBottom: '12px' }} />
            <p style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-300)' }}>You're all caught up!</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-500)' }}>New notifications will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sorted.map(n => {
              const type = getNotificationType(n);
              const config = TYPE_CONFIG[type] || TYPE_CONFIG.default;
              const Icon = config.icon;

              return (
                <div 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className="interactive-hover"
                  style={{ 
                    padding: '14px 16px', 
                    borderBottom: '1px solid rgba(255,255,255,0.03)', 
                    background: n.is_read ? 'transparent' : `${config.color}06`,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background 0.2s'
                  }}
                >
                  {/* Type Icon */}
                  <div style={{ 
                    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                    background: `${config.color}12`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={16} color={config.color} />
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <div style={{ fontWeight: 600, color: n.is_read ? 'var(--slate-300)' : 'white', fontSize: '0.9rem', flex: 1 }}>{n.title}</div>
                      {!n.is_read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: config.color, flexShrink: 0 }}></div>}
                    </div>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                    <div style={{ color: 'var(--slate-600)', fontSize: '0.7rem', marginTop: '6px' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
