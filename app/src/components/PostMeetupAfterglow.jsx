"use client";
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  Camera,
  MessageCircle,
  Calendar,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { resolveUserAvatar } from '../lib/avatar';
import { getProfilePath } from '../lib/profileLinks';
import { getEventPath } from '../lib/eventLinks';
import { isEventUpcoming } from '../lib/calendar';
import { isCheckedInRsvp } from '../lib/inPersonGraph';

export default function PostMeetupAfterglow({
  event,
  community,
  events = [],
  users = [],
  eventRsvps = {},
  currentUser,
  onUploadPhoto,
}) {
  const router = useRouter();

  const attendees = useMemo(() => {
    if (!event?.id) return [];
    const rsvps = (eventRsvps?.[event.id] || []).filter(
      (r) => r.status === 'going' || isCheckedInRsvp(r)
    );
    const seen = new Set();
    return rsvps
      .map((r) => {
        const uid = r.userId || r.user_id;
        if (!uid || seen.has(uid)) return null;
        seen.add(uid);
        const u = (users || []).find((x) => x.id === uid);
        return {
          id: uid,
          name: u?.name || r.guestName || 'Community Member',
          avatar: resolveUserAvatar(u || { name: r.guestName || 'Community Member' }),
          userObj: u || { id: uid, name: r.guestName || 'Community Member' },
          checkedIn: isCheckedInRsvp(r),
          isMe: Boolean(currentUser?.id && uid === currentUser.id),
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(b.checkedIn) - Number(a.checkedIn));
  }, [event?.id, eventRsvps, users, currentUser?.id]);

  const nextCommunityEvent = useMemo(() => {
    if (!event?.communityId) return null;
    return (events || [])
      .filter(
        (e) =>
          e?.id !== event.id &&
          e.communityId === event.communityId &&
          e.status !== 'cancelled' &&
          e.status !== 'proposed' &&
          isEventUpcoming(e)
      )
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))[0] || null;
  }, [events, event?.id, event?.communityId]);

  if (!event?.id || attendees.length === 0) return null;

  const peopleToMeet = attendees.filter((a) => !a.isMe);

  return (
    <section
      id="afterglow"
      style={{
        background: 'var(--surface-card)',
        border: '1.5px solid rgba(235, 87, 56, 0.30)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--brand-accent)',
              marginBottom: '4px',
            }}
          >
            <Sparkles size={12} /> Post-Meetup Afterglow
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
            }}
          >
            Who You Met ({attendees.length})
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary)',
            }}
          >
            Stay in touch with people from {event.title} or drop your photos into the album.
          </p>
        </div>

        {onUploadPhoto && (
          <button
            type="button"
            onClick={onUploadPhoto}
            className="btn btn-primary interactive-press"
            style={{
              padding: '9px 14px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <Camera size={14} /> Drop Meetup Photos
          </button>
        )}
      </div>

      {/* Attendee Face Grid */}
      {peopleToMeet.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '10px',
          }}
        >
          {peopleToMeet.slice(0, 12).map((person) => (
            <div
              key={person.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '14px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
              }}
            >
              <img
                src={person.avatar}
                alt={person.name}
                onClick={() => router.push(getProfilePath(person.userObj, users))}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  onClick={() => router.push(getProfilePath(person.userObj, users))}
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                  }}
                >
                  {person.name}
                </div>
                {person.checkedIn && (
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#15803D',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <CheckCircle2 size={10} /> Checked In
                  </div>
                )}
              </div>
              {currentUser?.id && (
                <button
                  type="button"
                  onClick={() => router.push(`/chat/dm/${person.id}`)}
                  title={`Message ${person.name}`}
                  aria-label={`Message ${person.name}`}
                  className="interactive-press"
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--brand-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <MessageCircle size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Upcoming Event Momentum CTA */}
      {nextCommunityEvent && (
        <div
          onClick={() => router.push(getEventPath(nextCommunityEvent, events))}
          className="interactive-press"
          style={{
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--brand-accent-soft)',
            border: '1px solid rgba(235, 87, 56, 0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--brand-accent)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calendar size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--brand-accent)',
                }}
              >
                Keep the momentum going · Next {community?.name || 'Community'} Meetup
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  color: 'var(--ink-primary)',
                }}
              >
                {nextCommunityEvent.title} ({nextCommunityEvent.date}
                {nextCommunityEvent.time ? ` · ${nextCommunityEvent.time}` : ''})
              </div>
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '7px 14px',
              borderRadius: '999px',
              background: 'var(--brand-accent)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            RSVP Next <ChevronRight size={14} />
          </span>
        </div>
      )}
    </section>
  );
}
