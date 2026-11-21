"use client";
import { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  UserPlus,
  Check,
  Search,
  X,
  Users,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { resolveUserAvatar } from '../lib/avatar';

export default function RollCallModal({ event, onClose }) {
  const {
    users,
    eventRsvps,
    communityMemberships,
    checkInMember,
    flushOfflineCheckinQueue,
    theme,
  } = useAppContext();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMode, setActiveMode] = useState('registered'); // 'registered' | 'walkin'
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isLight = theme === 'light';

  const refreshQueueCount = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('more_offline_checkin_queue');
      const queue = raw ? JSON.parse(raw) : [];
      setQueuedCount(Array.isArray(queue) ? queue.length : 0);
    } catch {
      setQueuedCount(0);
    }
  };

  useEffect(() => {
    refreshQueueCount();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    const handleOnline = async () => {
      setIsOffline(false);
      if (typeof flushOfflineCheckinQueue === 'function') {
        const synced = await flushOfflineCheckinQueue();
        refreshQueueCount();
        if (synced > 0) {
          toast.success(
            'Offline Check-Ins Synced! 📶',
            `Synced ${synced} trail check-in(s) to the cloud.`
          );
        }
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onClose, flushOfflineCheckinQueue, toast]);

  if (!event) return null;

  const rawAttendees = (eventRsvps?.[event.id] || []).filter(
    (r) => r.status !== 'declined'
  );
  const registeredUserIds = useMemo(
    () => new Set(rawAttendees.map((r) => r.userId)),
    [rawAttendees]
  );

  // Enrich pre-registered attendees with user object
  const attendees = useMemo(() => {
    return rawAttendees
      .map((rsvp) => {
        const u = (users || []).find((x) => x.id === rsvp.userId);
        return {
          ...rsvp,
          name: u?.name || 'Community Member',
          avatar: resolveUserAvatar(u),
        };
      })
      .sort((a, b) => {
        if (Boolean(a.checkedIn) === Boolean(b.checkedIn)) {
          return a.name.localeCompare(b.name);
        }
        return a.checkedIn ? 1 : -1;
      });
  }, [rawAttendees, users]);

  // Build Walk-In Roster from pre-loaded community members + all platform users (works 100% offline!)
  const walkInCandidates = useMemo(() => {
    const commIds = [
      event.communityId,
      ...(Array.isArray(event.collabCommunityIds)
        ? event.collabCommunityIds
        : []),
    ].filter(Boolean);

    const communityMemberIds = new Set();
    commIds.forEach((cid) => {
      (communityMemberships?.[cid] || []).forEach((m) => {
        const uid = m.userId || m.user_id;
        if (uid) communityMemberIds.add(uid);
      });
    });

    return (users || [])
      .filter((u) => u?.id && !registeredUserIds.has(u.id))
      .map((u) => ({
        userId: u.id,
        name: u.name || 'Community Member',
        avatar: resolveUserAvatar(u),
        isCommunityMember: communityMemberIds.has(u.id),
      }))
      .sort((a, b) => {
        if (a.isCommunityMember !== b.isCommunityMember) {
          return a.isCommunityMember ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [users, communityMemberships, event, registeredUserIds]);

  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;
    const q = searchQuery.toLowerCase();
    return attendees.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.guestName && a.guestName.toLowerCase().includes(q))
    );
  }, [attendees, searchQuery]);

  const filteredWalkIns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // By default show community members first (up to 40)
      const commOnly = walkInCandidates.filter((c) => c.isCommunityMember);
      return commOnly.length > 0 ? commOnly : walkInCandidates.slice(0, 40);
    }
    return walkInCandidates.filter((c) => c.name.toLowerCase().includes(q));
  }, [walkInCandidates, searchQuery]);

  const totalCount = attendees.length;
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const percentCheckedIn =
    totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const handleToggleCheckIn = async (userId, currentStatus, name) => {
    try {
      await checkInMember(event.id, userId, !currentStatus);
      refreshQueueCount();
      toast.success(
        currentStatus ? 'Status updated' : 'Checked In! ✓',
        `${name} marked ${currentStatus ? 'pending' : 'present'}${isOffline ? ' (saved offline — will sync automatically)' : '.'
        }`
      );
    } catch (err) {
      toast.error('Check-in error', err.message || 'Could not update status');
    }
  };

  const handleWalkInCheckIn = async (candidate) => {
    try {
      await checkInMember(event.id, candidate.userId, true);
      refreshQueueCount();
      toast.success(
        'Walk-In Registered & Checked In! 🎉',
        `${candidate.name} was added to the event and marked present${isOffline ? ' (saved offline for pub sync)' : '.'
        }`
      );
    } catch (err) {
      toast.error(
        'Walk-In Check-In Error',
        err?.message || 'Could not register walk-in member.'
      );
    }
  };

  const handleCheckInAll = async () => {
    const pending = attendees.filter((a) => !a.checkedIn);
    if (pending.length === 0) return;
    for (const p of pending) {
      await checkInMember(event.id, p.userId, true);
    }
    refreshQueueCount();
    toast.success(
      'All checked in!',
      `Marked ${pending.length} attendee(s) present.`
    );
  };

  const handleManualSync = async () => {
    if (isSyncing || typeof flushOfflineCheckinQueue !== 'function') return;
    setIsSyncing(true);
    try {
      const synced = await flushOfflineCheckinQueue();
      refreshQueueCount();
      if (synced > 0) {
        toast.success(
          'Synced to Cloud! 📶',
          `Uploaded ${synced} queued check-in(s).`
        );
      } else {
        toast.info(
          'Queue Retained',
          'Still waiting for stronger signal — check-ins remain safely saved on your phone.'
        );
      }
    } finally {
      setIsSyncing(false);
    }
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
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: isLight ? '#ffffff' : '#1B1B1B',
          border: isLight
            ? '1px solid rgba(0,0,0,0.1)'
            : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          animation: 'slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: isLight
              ? '1px solid rgba(0,0,0,0.08)'
              : '1px solid rgba(255,255,255,0.06)',
            background: isLight ? '#F7F3EC' : 'rgba(0,0,0,0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <UserCheck size={12} /> Roll Call &amp; Walk-In Check-In
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isLight ? '#64748b' : 'var(--slate-400)',
                }}
              >
                {event.date} • {event.time}
              </span>
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: '1.18rem',
                fontFamily: 'var(--font-heading)',
                color: isLight ? '#1B1B1B' : '#ffffff',
              }}
            >
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
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Zero-Signal / Offline Queue Banner */}
        {(isOffline || queuedCount > 0) && (
          <div
            style={{
              padding: '10px 18px',
              background: isOffline
                ? 'rgba(245, 158, 11, 0.14)'
                : 'rgba(16, 185, 129, 0.14)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: isOffline ? '#d97706' : '#10b981',
              }}
            >
              <WifiOff size={14} />
              <span>
                {isOffline
                  ? `Offline Trail Mode: Check-ins & walk-ins are saved on your phone (${queuedCount} queued) and auto-sync at the pub.`
                  : `${queuedCount} offline trail check-in(s) ready to sync.`}
              </span>
            </div>
            {!isOffline && queuedCount > 0 && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="interactive-press"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={12} /> {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        )}

        {/* Progress, Mode Tabs & Search Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: isLight ? '#ffffff' : 'rgba(27, 27, 27,0.6)',
            borderBottom: isLight
              ? '1px solid rgba(0,0,0,0.06)'
              : '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isLight ? '#1B1B1B' : '#ffffff',
              }}
            >
              Checked In:{' '}
              <span style={{ color: '#10b981' }}>{checkedInCount}</span> /{' '}
              {totalCount} ({percentCheckedIn}%)
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
                  cursor: 'pointer',
                }}
              >
                ✓ Check In All ({totalCount - checkedInCount})
              </button>
            )}
          </div>

          {/* Progress track */}
          <div
            style={{
              height: '6px',
              background: isLight
                ? 'rgba(28, 25, 21, 0.10)'
                : 'rgba(255,255,255,0.08)',
              borderRadius: '99px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${percentCheckedIn}%`,
                background:
                  'linear-gradient(90deg, var(--brand-secondary), #52A88F)',
                borderRadius: '99px',
                transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          {/* Mode Switcher: Pre-Registered vs Walk-In / No-Ticket Roster */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '10px',
              background: isLight ? '#F7F3EC' : 'rgba(0,0,0,0.28)',
              padding: '4px',
              borderRadius: '11px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveMode('registered')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                background:
                  activeMode === 'registered'
                    ? isLight
                      ? '#ffffff'
                      : '#262626'
                    : 'transparent',
                color:
                  activeMode === 'registered'
                    ? isLight
                      ? '#1B1B1B'
                      : '#ffffff'
                    : isLight
                      ? '#64748b'
                      : 'var(--slate-400)',
                boxShadow:
                  activeMode === 'registered'
                    ? '0 2px 6px rgba(0,0,0,0.08)'
                    : 'none',
              }}
            >
              Pre-Registered ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('walkin')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                background:
                  activeMode === 'walkin'
                    ? 'rgba(235, 87, 56, 0.16)'
                    : 'transparent',
                color:
                  activeMode === 'walkin'
                    ? '#EB5738'
                    : isLight
                      ? '#64748b'
                      : 'var(--slate-400)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <UserPlus size={14} /> + Walk-In / No Ticket
            </button>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              color={isLight ? '#64748b' : 'var(--slate-400)'}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder={
                activeMode === 'walkin'
                  ? 'Search any member to add & check in (works offline)...'
                  : 'Search attendee or type a walk-in member name...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '10px',
                border: isLight
                  ? '1px solid #cbd5e1'
                  : '1px solid rgba(255,255,255,0.1)',
                background: isLight ? '#F7F3EC' : 'rgba(0,0,0,0.2)',
                color: isLight ? '#1B1B1B' : '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Attendee & Walk-In List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {activeMode === 'registered' ? (
            <>
              {filteredAttendees.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    color: isLight ? '#64748b' : 'var(--slate-400)',
                  }}
                >
                  <Users
                    size={28}
                    style={{ opacity: 0.3, marginBottom: '6px' }}
                  />
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                    {searchQuery.trim()
                      ? 'No pre-registered attendees match that name.'
                      : 'No pre-registered attendees yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMode('walkin')}
                    className="interactive-press"
                    style={{
                      marginTop: '10px',
                      padding: '7px 14px',
                      borderRadius: '99px',
                      border: '1px solid rgba(235, 87, 56, 0.35)',
                      background: 'rgba(235, 87, 56, 0.12)',
                      color: '#EB5738',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <UserPlus size={14} /> Check In a Walk-In Member Instead
                  </button>
                </div>
              ) : (
                filteredAttendees.map((att) => (
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
                        ? att.checkedIn
                          ? '#f0fdf4'
                          : '#ffffff'
                        : att.checkedIn
                          ? 'rgba(16,185,129,0.08)'
                          : 'rgba(255,255,255,0.02)',
                      border: isLight
                        ? att.checkedIn
                          ? '1px solid #bbf7d0'
                          : '1px solid #e2e8f0'
                        : att.checkedIn
                          ? '1px solid rgba(16,185,129,0.3)'
                          : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <img
                        src={att.avatar}
                        alt={att.name}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              color: isLight ? '#1B1B1B' : '#ffffff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {att.name}
                          </span>
                          {att.guestName && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(56,189,248,0.2)',
                                color: '#0284c7',
                                fontWeight: 700,
                              }}
                            >
                              +1 {att.guestName}
                            </span>
                          )}
                        </div>
                        {att.answer && (
                          <div
                            style={{
                              fontSize: '0.74rem',
                              color: isLight ? '#b45309' : '#fbbf24',
                              marginTop: '2px',
                              fontStyle: 'italic',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            &ldquo;{att.answer}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleCheckIn(att.userId, att.checkedIn, att.name)
                      }
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
                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                          }
                          : {
                            background: isLight
                              ? '#FBF3EF'
                              : 'rgba(235, 87, 56,0.15)',
                            color: isLight ? '#D94628' : 'var(--teal-300)',
                            border: isLight
                              ? '1px solid #99f6e4'
                              : '1px solid rgba(235, 87, 56,0.4)',
                          }),
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

              {/* If searching on Registered tab and there are matching Walk-In members, show them right below! */}
              {searchQuery.trim() && filteredWalkIns.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      fontSize: '0.73rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#EB5738',
                      marginBottom: '6px',
                    }}
                  >
                    Walk-In Members (Not Pre-Registered)
                  </div>
                  {filteredWalkIns.slice(0, 8).map((cand) => (
                    <div
                      key={cand.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        marginBottom: '6px',
                        background: isLight
                          ? '#F7F3EC'
                          : 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(235, 87, 56, 0.35)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          minWidth: 0,
                        }}
                      >
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: isLight ? '#1B1B1B' : '#ffffff',
                            }}
                          >
                            {cand.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: isLight ? '#64748b' : 'var(--slate-400)',
                            }}
                          >
                            {cand.isCommunityMember
                              ? 'Community Member • Walk-In'
                              : 'More. Member • Walk-In'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleWalkInCheckIn(cand)}
                        className="interactive-press"
                        style={{
                          padding: '7px 13px',
                          borderRadius: '99px',
                          background: '#EB5738',
                          color: '#fff',
                          border: 'none',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          flexShrink: 0,
                        }}
                      >
                        <UserPlus size={13} /> + Add &amp; Check In
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Walk-In Roster Mode */
            <>
              <div
                style={{
                  fontSize: '0.76rem',
                  color: isLight ? '#475569' : 'var(--slate-300)',
                  background: isLight
                    ? '#F7F3EC'
                    : 'rgba(235, 87, 56, 0.08)',
                  border: '1px solid rgba(235, 87, 56, 0.22)',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  marginBottom: '4px',
                }}
              >
                💡 <strong>No ticket or zero trail signal?</strong> Tap{' '}
                <strong>+ Add &amp; Check In</strong> next to anyone who turned
                up today. Even offline, this saves on your phone and registers +
                verifies their attendance when you get signal at the pub.
              </div>
              {filteredWalkIns.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 16px',
                    color: isLight ? '#64748b' : 'var(--slate-400)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                    No matching members found.
                  </p>
                </div>
              ) : (
                filteredWalkIns.map((cand) => (
                  <div
                    key={cand.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      background: isLight
                        ? '#ffffff'
                        : 'rgba(255,255,255,0.025)',
                      border: isLight
                        ? '1px solid #e2e8f0'
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <img
                        src={cand.avatar}
                        alt={cand.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: isLight ? '#1B1B1B' : '#ffffff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cand.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: cand.isCommunityMember
                              ? '#10b981'
                              : isLight
                                ? '#64748b'
                                : 'var(--slate-400)',
                            fontWeight: 600,
                          }}
                        >
                          {cand.isCommunityMember
                            ? '✓ Community Member'
                            : 'More. App Member'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleWalkInCheckIn(cand)}
                      className="interactive-press"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '99px',
                        background: '#EB5738',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                      }}
                    >
                      <UserPlus size={14} /> + Add &amp; Check In
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: isLight
              ? '1px solid rgba(0,0,0,0.06)'
              : '1px solid rgba(255,255,255,0.05)',
            background: isLight ? '#F7F3EC' : 'rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontSize: '0.74rem',
              color: isLight ? '#64748b' : 'var(--slate-400)',
            }}
          >
            Works offline on trails &amp; post-event at the pub
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary interactive-press"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              background: '#D94628',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
