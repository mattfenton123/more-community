"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Heart, MapPin, Calendar, Sparkles, Info, ArrowRight, RotateCcw, Users, Repeat } from 'lucide-react';
import { cleanLocationName } from '../lib/location';
import { parseEventDateTime, isEventUpcoming } from '../lib/calendar';
import { getEventPath } from '../lib/eventLinks';
import { useAppContext } from '../context/AppContext';

const SESSION_PASSED_KEY = 'more_swipe_passed_v1';

function formatSwipeDate(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    const dayStr = dt.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return timeStr ? `${dayStr} • ${timeStr}` : dayStr;
  }
  return [dateStr, timeStr].filter(Boolean).join(' • ') || 'Date TBC';
}

export default function SwipeDiscovery({ events = [], communities = [], onClose, onSave, inline = false }) {
  const router = useRouter();
  const appCtx = useAppContext() || {};
  const { user, savedItems = [], saveItem, eventRsvps = {} } = appCtx;

  const [passedIds, setPassedIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(SESSION_PASSED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [localSavedIds, setLocalSavedIds] = useState([]);
  const [history, setHistory] = useState([]); // [{ id, direction }]
  const [replayAll, setReplayAll] = useState(false);

  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const dragStartTimeRef = useRef(0);
  const maxDragDistanceRef = useRef(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_PASSED_KEY, JSON.stringify(passedIds));
    } catch {}
  }, [passedIds]);

  // 1. Sort chronologically & collapse recurring series to their NEXT upcoming instance
  const deduplicatedSeriesDeck = useMemo(() => {
    const upcoming = (events || [])
      .filter((e) => e && e.id && e.status !== 'cancelled' && e.status !== 'proposed' && isEventUpcoming(e))
      .sort((a, b) => {
        const ta = parseEventDateTime(a.date, a.time)?.getTime() || Number.MAX_SAFE_INTEGER;
        const tb = parseEventDateTime(b.date, b.time)?.getTime() || Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });

    const seriesCountMap = new Map();
    upcoming.forEach((e) => {
      const normTitle = String(e.title || '').trim().toLowerCase();
      const key = `${e.communityId || ''}::${e.seriesId || e.series_id || normTitle}`;
      seriesCountMap.set(key, (seriesCountMap.get(key) || 0) + 1);
    });

    const seenSeries = new Set();
    const unique = [];
    upcoming.forEach((e) => {
      const normTitle = String(e.title || '').trim().toLowerCase();
      const key = `${e.communityId || ''}::${e.seriesId || e.series_id || normTitle}`;
      if (seenSeries.has(key)) return;
      seenSeries.add(key);
      unique.push({
        ...e,
        extraSeriesDates: Math.max(0, (seriesCountMap.get(key) || 1) - 1),
      });
    });

    return unique;
  }, [events]);

  // 2. Filter out already-swiped, already-saved, and already-Going events (unless replayAll is active)
  const activeDeck = useMemo(() => {
    const passedSet = new Set(passedIds);
    const localSavedSet = new Set(localSavedIds);
    const globalSavedSet = new Set(savedItems || []);

    return deduplicatedSeriesDeck.filter((e) => {
      if (passedSet.has(e.id) || localSavedSet.has(e.id)) return false;
      if (!replayAll) {
        if (globalSavedSet.has(e.id)) return false;
        if (user?.id) {
          const rsvps = eventRsvps?.[e.id] || [];
          const isGoing = rsvps.some(
            (r) => (r.userId === user.id || r.user_id === user.id) && r.status !== 'declined' && r.status !== 'cancelled'
          );
          if (isGoing) return false;
        }
      }
      return true;
    });
  }, [deduplicatedSeriesDeck, passedIds, localSavedIds, savedItems, replayAll, user?.id, eventRsvps]);

  const currentEvent = activeDeck[0] || null;
  const nextEvent = activeDeck[1] || null;

  const handleSwipe = useCallback(
    (direction) => {
      if (!currentEvent || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      const targetEvent = currentEvent;
      const viewportW = typeof window !== 'undefined' ? window.innerWidth : 800;
      setOffset(direction === 'right' ? viewportW : -viewportW);

      setTimeout(() => {
        setHistory((prev) => [...prev, { id: targetEvent.id, direction }]);
        if (direction === 'right') {
          setLocalSavedIds((prev) => (prev.includes(targetEvent.id) ? prev : [...prev, targetEvent.id]));
          if (typeof onSave === 'function') {
            onSave(targetEvent);
          }
        } else {
          setPassedIds((prev) => (prev.includes(targetEvent.id) ? prev : [...prev, targetEvent.id]));
        }
        setOffset(0);
        isAnimatingRef.current = false;
      }, 240);
    },
    [currentEvent, onSave]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isAnimatingRef.current) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    if (last.direction === 'left') {
      setPassedIds((prev) => prev.filter((id) => id !== last.id));
    } else {
      setLocalSavedIds((prev) => prev.filter((id) => id !== last.id));
      if (typeof saveItem === 'function' && (savedItems || []).includes(last.id)) {
        saveItem(last.id); // toggles off in AppContext
      }
    }
    setOffset(0);
  }, [history, saveItem, savedItems]);

  const handleResetDeck = () => {
    setPassedIds([]);
    setLocalSavedIds([]);
    setHistory([]);
    setReplayAll(true);
    setOffset(0);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_PASSED_KEY);
      } catch {}
    }
  };

  // Keyboard navigation (Left = Pass, Right = Save, Backspace = Undo, Escape = Close)
  useEffect(() => {
    if (inline) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('right');
      } else if (e.key === 'Backspace' || (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inline, handleSwipe, handleUndo, onClose]);

  const handlePointerDown = (e) => {
    if (isAnimatingRef.current) return;
    setIsDragging(true);
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    setStartX(clientX);
    dragStartTimeRef.current = Date.now();
    maxDragDistanceRef.current = 0;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const diffX = currentX - startX;
    maxDragDistanceRef.current = Math.max(maxDragDistanceRef.current, Math.abs(diffX));
    setOffset(diffX);
  };

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offset > 95) {
      handleSwipe('right');
    } else if (offset < -95) {
      handleSwipe('left');
    } else {
      setOffset(0);
    }
  }, [isDragging, offset, handleSwipe]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseUp = () => handlePointerUp();
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handlePointerUp]);

  if (!currentEvent) {
    const savedCount = (savedItems || []).length;
    return inline ? (
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto 24px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border-strong)',
          borderRadius: '20px',
          overflow: 'hidden',
          padding: '32px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--brand-accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <Sparkles size={26} color="var(--brand-accent)" />
        </div>
        <h2
          style={{
            color: 'var(--ink-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.3rem',
            margin: '0 0 8px',
          }}
        >
          You&apos;re all caught up!
        </h2>
        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 18px' }}>
          You&apos;ve reviewed every unique upcoming event in the deck.
        </p>
        {deduplicatedSeriesDeck.length > 0 && (
          <button
            type="button"
            onClick={handleResetDeck}
            className="btn btn-outline interactive-press"
            style={{
              margin: '0 auto',
              padding: '9px 18px',
              borderRadius: '99px',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={14} /> Start Over ({deduplicatedSeriesDeck.length} events)
          </button>
        )}
      </div>
    ) : (
      <div
        className="modal-overlay"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 2000,
          position: 'fixed',
          inset: 0,
          background: 'rgba(18, 18, 18, 0.72)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border-strong)',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="interactive-press"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-primary)',
              cursor: 'pointer',
              zIndex: 100,
            }}
          >
            <X size={18} />
          </button>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '44px 28px 32px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--brand-accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Sparkles size={34} color="var(--brand-accent)" />
            </div>
            <h2
              style={{
                color: 'var(--ink-primary)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1.6rem',
                margin: '0 0 10px',
              }}
            >
              You&apos;re all caught up!
            </h2>
            <p
              style={{
                color: 'var(--ink-secondary)',
                fontSize: '0.92rem',
                lineHeight: 1.55,
                margin: '0 0 22px',
              }}
            >
              You&apos;ve seen all {deduplicatedSeriesDeck.length} unique upcoming events in the deck.
              {savedCount > 0 ? ` You have ${savedCount} saved in your shortlist.` : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button
                onClick={onClose}
                className="btn btn-primary interactive-press"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                Back to Events
              </button>
              {deduplicatedSeriesDeck.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetDeck}
                  className="btn btn-outline interactive-press"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw size={15} /> Replay Deck From Start
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const community = communities.find((c) => c.id === currentEvent.communityId);
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 800;
  const rotation = (offset / viewportW) * 24;
  const eventPath = getEventPath(currentEvent, events);
  const displayLoc = cleanLocationName(currentEvent.location) || 'Local Venue';
  const displayDate = formatSwipeDate(currentEvent.date, currentEvent.time);
  const remainingCount = activeDeck.length;
  const rsvpCount = (eventRsvps?.[currentEvent.id] || []).filter(
    (r) => r.status !== 'declined' && r.status !== 'cancelled'
  ).length;

  const openCurrentEventDetails = () => {
    if (maxDragDistanceRef.current > 8) return;
    if (typeof onClose === 'function') onClose();
    router.push(eventPath);
  };

  const wrapperStyle = inline
    ? {
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto 24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 2000,
        position: 'fixed',
        inset: 0,
        background: 'rgba(18, 18, 18, 0.72)',
        backdropFilter: 'blur(10px)',
      };

  const containerStyle = inline
    ? {
        height: '545px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-elevated)',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--hairline-border-strong)',
      }
    : {
        height: 'min(650px, calc(100dvh - 40px))',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-canvas)',
        border: '1px solid var(--hairline-border-strong)',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.35)',
      };

  return (
    <div className={inline ? '' : 'modal-overlay'} style={wrapperStyle}>
      <div style={containerStyle}>
        {/* Top Header */}
        <div
          style={{
            padding: inline ? '12px 16px 4px' : '14px 16px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--brand-accent)" />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.96rem',
                fontWeight: 700,
                color: 'var(--ink-primary)',
              }}
            >
              Swipe Events
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--ink-muted)',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border)',
                padding: '2px 8px',
                borderRadius: '99px',
              }}
            >
              {remainingCount} left
            </span>
          </div>
          {!inline && (
            <button
              onClick={onClose}
              aria-label="Close swipe events"
              className="interactive-press"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-primary)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Card Deck Stage */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 16px',
            overflow: 'hidden',
          }}
        >
          {/* Next Card Preview */}
          {nextEvent && (
            <div
              style={{
                position: 'absolute',
                width: 'calc(100% - 36px)',
                height: 'calc(100% - 22px)',
                background: 'var(--surface-card)',
                borderRadius: '20px',
                transform: 'scale(0.95) translateY(12px)',
                opacity: 0.65,
                zIndex: 1,
                pointerEvents: 'none',
                border: '1px solid var(--hairline-border-strong)',
              }}
            />
          )}

          {/* Current Draggable Card */}
          <div
            key={currentEvent.id}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            style={{
              position: 'absolute',
              width: 'calc(100% - 32px)',
              height: 'calc(100% - 18px)',
              background: 'var(--surface-card)',
              borderRadius: '20px',
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.18)',
              zIndex: 10,
              transform: `translateX(${offset}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out',
              cursor: isDragging ? 'grabbing' : 'grab',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--hairline-border-strong)',
              userSelect: 'none',
            }}
          >
            {/* Drag Stamps */}
            <div
              style={{
                position: 'absolute',
                top: '28px',
                right: '24px',
                opacity: offset < -20 ? Math.min(1, Math.abs(offset) / 95) : 0,
                zIndex: 20,
                transform: 'rotate(12deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  border: '3px solid #DC2626',
                  background: 'rgba(255, 255, 255, 0.94)',
                  color: '#DC2626',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  padding: '5px 14px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Pass
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                top: '28px',
                left: '24px',
                opacity: offset > 20 ? Math.min(1, offset / 95) : 0,
                zIndex: 20,
                transform: 'rotate(-12deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  border: '3px solid #15803D',
                  background: 'rgba(255, 255, 255, 0.94)',
                  color: '#15803D',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  padding: '5px 14px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Save ♥
              </div>
            </div>

            {/* Cover Image */}
            <div
              onClick={openCurrentEventDetails}
              style={{
                height: '46%',
                minHeight: '165px',
                background: `var(--surface-elevated) url(${currentEvent.image || community?.image || '/images/communities/parkrun.webp'}) center/cover no-repeat`,
                position: 'relative',
                flexShrink: 0,
                cursor: isDragging ? 'grabbing' : 'pointer',
              }}
            >
              {/* Left badge: Recurring Series count */}
              {currentEvent.extraSeriesDates > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(20, 18, 15, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '99px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Repeat size={11} /> +{currentEvent.extraSeriesDates} more dates
                </div>
              )}

              {/* Right badge: Price */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(20, 18, 15, 0.82)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#FFFFFF',
                  padding: '5px 11px',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {(currentEvent.ticketPrice || currentEvent.ticket_price) > 0
                  ? `£${currentEvent.ticketPrice || currentEvent.ticket_price}`
                  : 'FREE'}
              </div>
            </div>

            {/* Card Body */}
            <div
              style={{
                padding: '15px 18px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    color: 'var(--teal-300)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {community?.name || 'Local Community'}
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (typeof onClose === 'function') onClose();
                    router.push(eventPath);
                  }}
                  title="View event details"
                  aria-label="View event details"
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    borderRadius: '99px',
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--ink-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Info size={13} /> Details <ArrowRight size={11} />
                </button>
              </div>

              <h3
                onClick={openCurrentEventDetails}
                style={{
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--ink-primary)',
                  margin: '0 0 10px 0',
                  lineHeight: 1.22,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                {currentEvent.title}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    color: 'var(--ink-secondary)',
                    fontSize: '0.83rem',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                    <Calendar size={14} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
                    <span>{displayDate}</span>
                  </span>
                  {rsvpCount > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--teal-300)',
                        background: 'var(--brand-accent-soft)',
                        padding: '2px 8px',
                        borderRadius: '99px',
                      }}
                    >
                      <Users size={12} /> {rsvpCount} going
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    color: 'var(--ink-secondary)',
                    fontSize: '0.83rem',
                    fontWeight: 500,
                  }}
                >
                  <MapPin size={14} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayLoc}
                  </span>
                </div>
              </div>

              <p
                style={{
                  color: 'var(--ink-muted)',
                  fontSize: '0.83rem',
                  lineHeight: 1.48,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {currentEvent.description ||
                  `Join ${community?.name || 'us'} for an in-person community meetup.`}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons: Pass (✕) · Undo (↺) · Save (♥) */}
        <div
          style={{
            padding: '10px 28px 20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '22px',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <button
            type="button"
            onClick={() => handleSwipe('left')}
            aria-label="Pass on event"
            title="Pass (Left Arrow)"
            className="interactive-press"
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: '1.5px solid var(--hairline-border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.10)',
            }}
          >
            <X size={24} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label="Undo last swipe"
            title="Undo last swipe (Backspace)"
            className="interactive-press"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: history.length > 0 ? 'var(--ink-primary)' : 'var(--ink-muted)',
              opacity: history.length > 0 ? 1 : 0.4,
              cursor: history.length > 0 ? 'pointer' : 'default',
            }}
          >
            <RotateCcw size={17} />
          </button>

          <button
            type="button"
            onClick={() => handleSwipe('right')}
            aria-label="Save event"
            title="Save event (Right Arrow)"
            className="interactive-press"
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: 'var(--brand-accent)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(200, 90, 50, 0.35)',
            }}
          >
            <Heart size={27} fill="#FFFFFF" color="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  );
}
