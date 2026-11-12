"use client";
import { useState, useMemo, useEffect } from 'react';
import { UserCheck, Check, Search, X, Users, CheckCircle2, RotateCcw, Clock, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

export default function RollCallModal({ event, onClose }) {
  const { users, eventRsvps, checkInMember, theme } = useAppContext();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const isLight = theme === 'light';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const rawAttendees = (eventRsvps?.[event.id] || []).filter(r => r.status !== 'declined');

  // Enrich with user object
  const attendees = useMemo(() => {
    return rawAttendees.map(rsvp => {
      const u = users.find(x => x.id === rsvp.userId);
      return {
        ...rsvp,
        name: u?.name || 'Community Member',
        avatar: u?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'Member')}`
      };
    }).sort((a, b) => {
      // Pending first, then checked-in
      if (a.checkedIn === b.checkedIn) {
        return a.name.localeCompare(b.name);
      }
      return a.checkedIn ? 1 : -1;
    });
  }, [rawAttendees, users]);

  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const q = searchQuery.toLowerCase();
    return attendees.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.guestName && a.guestName.toLowerCase().includes(q))
    );
  }, [attendees, searchQuery]);

  const totalCount = attendees.length;
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const percentCheckedIn = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const handleToggleCheckIn = async (userId, currentStatus, name) => {
    try {
      await checkInMember(event.id, userId);
      toast.success(currentStatus ? 'Status updated' : 'Checked In!', `${name} marked ${currentStatus ? 'pending' : 'present'}.`);
    } catch (err) {
      toast.error('Check-in error', err.message || 'Could not update status');
    }
  };

  const handleCheckInAll = async () => {
    const pending = attendees.filter(a => !a.checkedIn);
    if (pending.length === 0) return;
    for (const p of pending) {
      await checkInMember(event.id, p.userId);
    }
    toast.success('All checked in!', `Marked ${pending.length} attendee(s) present.`);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: 0
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
          background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <UserCheck size={12} /> Trailhead Roll Call
              </span>
              <span style={{ fontSize: '0.75rem', color: isLight ? '#64748b' : 'var(--slate-400)' }}>
                {event.date} • {event.time}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: isLight ? '#0f172a' : '#ffffff' }}>
              {event.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="interactive-press"
            style={{
              background: 'transparent',
              border: 'none',
              color: isLight ? '#64748b' : 'var(--slate-400)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress & Quick Actions Bar */}
        <div style={{
          padding: '16px 20px',
          background: isLight ? '#ffffff' : 'rgba(15,23,42,0.6)',
          borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff' }}>
              Checked In: <span style={{ color: '#10b981' }}>{checkedInCount}</span> / {totalCount} ({percentCheckedIn}%)
            </div>
            {checkedInCount < totalCount && totalCount > 0 && (
              <button
                type="button"
                onClick={handleCheckInAll}
                className="btn btn-outline interactive-press"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10b981',
                  borderColor: 'rgba(16,185,129,0.3)',
                  cursor: 'pointer'
                }}
              >
                ✓ Check In All ({totalCount - checkedInCount})
              </button>
            )}
          </div>

          {/* Progress track */}
          <div style={{
            height: '6px',
            background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)',
            borderRadius: '99px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${percentCheckedIn}%`,
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
              borderRadius: '99px',
              transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }} />
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginTop: '12px' }}>
            <Search size={15} color={isLight ? '#64748b' : 'var(--slate-400)'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search attendee by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '10px',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Attendee Roll-Call List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredAttendees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: isLight ? '#64748b' : 'var(--slate-400)' }}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No attendees found</p>
            </div>
          ) : (
            filteredAttendees.map(att => (
              <div 
                key={att.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isLight 
                    ? (att.checkedIn ? '#f0fdf4' : '#ffffff') 
                    : (att.checkedIn ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)'),
                  border: isLight 
                    ? (att.checkedIn ? '1px solid #bbf7d0' : '1px solid #e2e8f0') 
                    : (att.checkedIn ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)'),
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <img 
                    src={att.avatar} 
                    alt={att.name} 
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.name}
                      </span>
                      {att.guestName && (
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', color: '#0284c7', fontWeight: 700 }}>
                          +1 {att.guestName}
                        </span>
                      )}
                    </div>
                    {att.answer && (
                      <div style={{ fontSize: '0.74rem', color: isLight ? '#b45309' : '#fbbf24', marginTop: '2px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        &ldquo;{att.answer}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Big 1-tap Check-in button */}
                <button
                  type="button"
                  onClick={() => handleToggleCheckIn(att.userId, att.checkedIn, att.name)}
                  className="interactive-press"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                    border: 'none',
                    ...(att.checkedIn 
                      ? {
                          background: '#10b981',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                        } 
                      : {
                          background: isLight ? '#f0fdfa' : 'rgba(20,184,166,0.15)',
                          color: isLight ? '#0d9488' : 'var(--teal-300)',
                          border: isLight ? '1px solid #99f6e4' : '1px solid rgba(20,184,166,0.4)'
                        }
                    )
                  }}
                >
                  {att.checkedIn ? (
                    <>
                      <Check size={16} strokeWidth={3} /> Present
                    </>
                  ) : (
                    <>
                      <UserCheck size={15} /> Check In
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)',
          background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-primary interactive-press"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
