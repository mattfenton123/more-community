"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Heart, MapPin, Calendar, Sparkles, Info, ArrowRight } from 'lucide-react';
import { cleanLocationName } from '../lib/location';
import { parseEventDateTime } from '../lib/calendar';
import { getEventPath } from '../lib/eventLinks';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef(null);
  const router = useRouter();

  const currentEvent = events[currentIndex];

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || (e.touches && e.touches[0].clientX) || 0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diffX = currentX - startX;
    setOffset(diffX);
  };

  const handleSwipe = (direction) => {
    if (!currentEvent) return;
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 800;
    setOffset(direction === 'right' ? viewportW : -viewportW);

    setTimeout(() => {
      if (direction === 'right' && typeof onSave === 'function') {
        onSave(currentEvent);
      }
      setCurrentIndex((prev) => prev + 1);
      setOffset(0);
    }, 260);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (offset > 100) {
      handleSwipe('right');
    } else if (offset < -100) {
      handleSwipe('left');
    } else {
      setOffset(0);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) handlePointerUp();
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, offset]);

  if (!currentEvent) {
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
        <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
          We&apos;ve shown all upcoming events for now. Check back soon for new meetups.
        </p>
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
                fontSize: '0.94rem',
                lineHeight: 1.55,
                margin: '0 0 24px',
              }}
            >
              You&apos;ve seen every upcoming event in the deck. Check back soon or browse the full list.
            </p>
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
  const remainingCount = events.length - currentIndex;

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
        height: '530px',
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
        height: 'min(640px, calc(100dvh - 48px))',
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
        {/* Top Modal Header (for modal mode) */}
        {!inline && (
          <div
            style={{
              padding: '14px 16px 6px',
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
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  padding: '2px 8px',
                  borderRadius: '99px',
                }}
              >
                {remainingCount} left
              </span>
            </div>
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
          </div>
        )}

        {/* Card Deck Stage */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            overflow: 'hidden',
          }}
        >
          {/* Next Card Preview */}
          {events[currentIndex + 1] && (
            <div
              style={{
                position: 'absolute',
                width: 'calc(100% - 36px)',
                height: 'calc(100% - 24px)',
                background: 'var(--surface-card)',
                borderRadius: '20px',
                transform: 'scale(0.95) translateY(14px)',
                opacity: 0.65,
                zIndex: 1,
                pointerEvents: 'none',
                border: '1px solid var(--hairline-border-strong)',
              }}
            />
          )}

          {/* Current Draggable Card */}
          <div
            ref={cardRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            style={{
              position: 'absolute',
              width: 'calc(100% - 32px)',
              height: 'calc(100% - 20px)',
              background: 'var(--surface-card)',
              borderRadius: '20px',
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.18)',
              zIndex: 10,
              transform: `translateX(${offset}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.28s ease-out',
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
                opacity: offset < -20 ? Math.min(1, Math.abs(offset) / 100) : 0,
                zIndex: 20,
                transform: 'rotate(12deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  border: '3px solid #DC2626',
                  background: 'rgba(255, 255, 255, 0.92)',
                  color: '#DC2626',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  padding: '6px 14px',
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
                opacity: offset > 20 ? Math.min(1, offset / 100) : 0,
                zIndex: 20,
                transform: 'rotate(-12deg)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  border: '3px solid #15803D',
                  background: 'rgba(255, 255, 255, 0.92)',
                  color: '#15803D',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Save
              </div>
            </div>

            {/* Cover Image */}
            <div
              style={{
                height: '48%',
                minHeight: '170px',
                background: `var(--surface-elevated) url(${currentEvent.image || community?.image || '/images/communities/parkrun.webp'}) center/cover no-repeat`,
                position: 'relative',
                pointerEvents: 'none',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(20, 18, 15, 0.8)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#FFFFFF',
                  padding: '5px 11px',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {currentEvent.ticketPrice > 0 ? `£${currentEvent.ticketPrice}` : 'FREE'}
              </div>
            </div>

            {/* Card Body */}
            <div
              style={{
                padding: '16px 18px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                pointerEvents: 'none',
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
                    pointerEvents: 'auto',
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
                style={{
                  fontSize: '1.3rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--ink-primary)',
                  margin: '0 0 10px 0',
                  lineHeight: 1.2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {currentEvent.title}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--ink-secondary)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                  }}
                >
                  <Calendar size={14} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
                  <span>{displayDate}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--ink-secondary)',
                    fontSize: '0.84rem',
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
                  fontSize: '0.84rem',
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

        {/* Bottom Action Buttons */}
        <div
          style={{
            padding: '12px 32px 22px',
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <button
            onClick={() => handleSwipe('left')}
            aria-label="Pass on event"
            className="interactive-press"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--surface-card)',
              border: '1.5px solid var(--hairline-border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
            }}
          >
            <X size={26} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => handleSwipe('right')}
            aria-label="Save event"
            className="interactive-press"
            style={{
              width: '64px',
              height: '64px',
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
            <Heart size={28} fill="#FFFFFF" color="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  );
}
