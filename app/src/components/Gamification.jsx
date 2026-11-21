"use client";
import { useMemo } from 'react';
import {
  Trophy,
  Flame,
  Star,
  Zap,
  Target,
  Crown,
  Heart,
  Users,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { resolveUserAvatar } from '../lib/avatar';

// ─── Badge Definitions ──────────────────────────────────────
const BADGES = [
  { id: 'first_join', name: 'Pioneer', description: 'Joined your first community', icon: Star, color: '#D97706', check: (s) => s.communitiesJoined >= 1 },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Joined 3+ communities', icon: Users, color: '#DB2777', check: (s) => s.communitiesJoined >= 3 },
  { id: 'networker', name: 'Networker', description: 'Joined 5+ communities', icon: Crown, color: '#7C3AED', check: (s) => s.communitiesJoined >= 5 },
  { id: 'first_event', name: 'First Steps', description: "RSVP'd to your first event", icon: Calendar, color: '#C85A32', check: (s) => s.eventsAttended >= 1 },
  { id: 'regular', name: 'Regular', description: 'Attended 5+ events', icon: Target, color: '#2563EB', check: (s) => s.eventsAttended >= 5 },
  { id: 'super_fan', name: 'Super Fan', description: 'Attended 10+ events', icon: Trophy, color: '#D97706', check: (s) => s.eventsAttended >= 10 },
  { id: 'chatterbox', name: 'Chatterbox', description: 'Sent 10+ messages', icon: MessageCircle, color: '#15803D', check: (s) => s.messagesSent >= 10 },
  { id: 'storyteller', name: 'Storyteller', description: 'Sent 50+ messages', icon: MessageCircle, color: '#EA580C', check: (s) => s.messagesSent >= 50 },
  { id: 'streak_3', name: 'On Fire', description: '3-week activity streak', icon: Flame, color: '#DC2626', check: (s) => s.weeklyStreak >= 3 },
  { id: 'streak_8', name: 'Unstoppable', description: '8-week activity streak', icon: Zap, color: '#CA8A04', check: (s) => s.weeklyStreak >= 8 },
  { id: 'kind_heart', name: 'Kind Heart', description: 'Joined a volunteering community', icon: Heart, color: '#E11D48', check: (s) => s.hasVolunteering },
  { id: 'leader', name: 'Leader', description: 'Lead a community', icon: Crown, color: '#B45309', check: (s) => s.isLeader },
];

// ─── Pure Calculation Function ────────────────────────────────
export function calculateUserGamification(
  targetId,
  { communityMemberships = {}, events = [], eventRsvps = {}, communities = [], messages = [] }
) {
  if (!targetId) {
    return {
      badges: [],
      earnedBadges: [],
      lockedBadges: [],
      xp: 0,
      level: 1,
      xpInLevel: 0,
      xpForNext: 500,
      streak: 0,
      stats: { communitiesJoined: 0, eventsAttended: 0, messagesSent: 0, weeklyStreak: 0, hasVolunteering: false, isLeader: false },
    };
  }

  let communitiesJoined = 0;
  let hasVolunteering = false;
  Object.entries(communityMemberships || {}).forEach(([cId, mems]) => {
    if ((mems || []).some((m) => (m.userId || m.user_id) === targetId)) {
      communitiesJoined++;
      const comm = (communities || []).find((c) => c.id === cId);
      if (
        comm?.category?.toLowerCase().includes('volunteer') ||
        comm?.tags?.some((t) => String(t).toLowerCase().includes('volunteer'))
      ) {
        hasVolunteering = true;
      }
    }
  });

  let eventsAttended = 0;
  Object.values(eventRsvps || {}).forEach((rsvps) => {
    if ((rsvps || []).some((r) => (r.userId || r.user_id) === targetId && r.status === 'going')) {
      eventsAttended++;
    }
  });

  const messagesSent = (messages || []).filter((m) => (m.authorId || m.senderId) === targetId).length;
  const weeklyStreak = Math.min(Math.floor((messagesSent + eventsAttended) / 3), 12);

  let isLeader = false;
  Object.values(communityMemberships || {}).forEach((mems) => {
    if ((mems || []).some((m) => (m.userId || m.user_id) === targetId && m.role === 'Leader')) {
      isLeader = true;
    }
  });

  const stats = { communitiesJoined, eventsAttended, messagesSent, weeklyStreak, hasVolunteering, isLeader };
  const earnedBadges = BADGES.filter((b) => b.check(stats));
  const lockedBadges = BADGES.filter((b) => !b.check(stats));

  const xp =
    communitiesJoined * 50 +
    eventsAttended * 100 +
    messagesSent * 10 +
    weeklyStreak * 75 +
    earnedBadges.length * 200;
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const xpInLevel = xp % 500;
  const xpForNext = 500;

  return { badges: BADGES, earnedBadges, lockedBadges, xp, level, xpInLevel, xpForNext, streak: weeklyStreak, stats };
}

// ─── Calculate user stats for badge checking ────────────────
export function useGamification(userId) {
  const { communityMemberships, events, eventRsvps, communities, user } = useAppContext();
  const { messages } = useChat();

  return useMemo(() => {
    return calculateUserGamification(userId || user?.id, {
      communityMemberships,
      events,
      eventRsvps,
      communities,
      messages,
    });
  }, [userId, user, communityMemberships, events, eventRsvps, messages, communities]);
}

// ─── Compact Badge Row (for profile cards) ──────────────────
export function BadgeRow({ userId, maxShow = 5 }) {
  const { earnedBadges } = useGamification(userId);
  if (earnedBadges.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {earnedBadges.slice(0, maxShow).map((badge) => (
        <div
          key={badge.id}
          title={badge.name}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: `${badge.color}18`,
            border: `1px solid ${badge.color}38`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <badge.icon size={14} color={badge.color} />
        </div>
      ))}
      {earnedBadges.length > maxShow && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.68rem',
            color: 'var(--ink-secondary)',
            fontWeight: 700,
          }}
        >
          +{earnedBadges.length - maxShow}
        </div>
      )}
    </div>
  );
}

// ─── Full Gamification Panel (for profile page) ─────────────
export default function GamificationPanel({ userId, hideStats = false }) {
  const { earnedBadges, lockedBadges, xp, level, xpInLevel, xpForNext, streak, stats } =
    useGamification(userId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Level & XP Bar */}
      <div
        style={{
          padding: '16px',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>{level}</span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  fontSize: '0.98rem',
                }}
              >
                Level {level}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{xp} XP total</div>
            </div>
          </div>

          {streak > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '99px',
                background: 'rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.28)',
              }}
            >
              <Flame size={13} color="#DC2626" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626' }}>
                {streak}w streak
              </span>
            </div>
          )}
        </div>

        {/* XP Progress Bar */}
        <div
          style={{
            height: '8px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '99px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (xpInLevel / xpForNext) * 100)}%`,
              background: 'var(--brand-accent)',
              borderRadius: '99px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--ink-muted)',
            fontWeight: 600,
            marginTop: '6px',
          }}
        >
          <span>
            {xpInLevel} / {xpForNext} XP
          </span>
          <span>Level {level + 1}</span>
        </div>
      </div>

      {/* Optional Stats Row (hidden on Profile where top summary already renders stats) */}
      {!hideStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { label: 'Groups', value: stats.communitiesJoined, color: '#2563EB' },
            { label: 'Events', value: stats.eventsAttended, color: 'var(--brand-accent)' },
            { label: 'Messages', value: stats.messagesSent, color: '#15803D' },
            { label: 'Streak', value: `${streak}w`, color: '#DC2626' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                padding: '10px 6px',
                background: 'var(--surface-card)',
                borderRadius: '12px',
                border: '1px solid var(--hairline-border)',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div
                style={{
                  fontSize: '0.64rem',
                  color: 'var(--ink-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Earned Badges */}
      <div>
        <div
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: 'var(--ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px',
          }}
        >
          Badges Earned ({earnedBadges.length}/{BADGES.length})
        </div>
        {earnedBadges.length === 0 ? (
          <div
            style={{
              padding: '18px',
              borderRadius: '14px',
              background: 'var(--surface-card)',
              border: '1px dashed var(--hairline-border-strong)',
              textAlign: 'center',
              fontSize: '0.84rem',
              color: 'var(--ink-secondary)',
            }}
          >
            Join a community or RSVP to an event to earn your first badge.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--surface-card)',
                  border: `1px solid ${badge.color}38`,
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: `${badge.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <badge.icon size={16} color={badge.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--ink-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            Locked ({lockedBadges.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {lockedBadges.map((badge) => (
              <div
                key={badge.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '12px',
                  opacity: 0.65,
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <badge.icon size={16} color="var(--ink-muted)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink-secondary)' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Community Leaderboard Component ────────────────────────
export function CommunityLeaderboard({ communityId }) {
  const { communityMemberships, users, events, eventRsvps, communities } = useAppContext();
  const { messages } = useChat();

  const leaderboard = useMemo(() => {
    const mems = communityMemberships?.[communityId] || [];
    const contextData = { communityMemberships, events, eventRsvps, communities, messages };

    const membersWithScores = mems.map((m) => {
      const memberId = m.userId || m.user_id;
      const user = (users || []).find((u) => u.id === memberId);
      const gamification = calculateUserGamification(memberId, contextData);
      return {
        user,
        role: m.role,
        xp: gamification.xp,
        level: gamification.level,
        badges: gamification.earnedBadges,
      };
    });

    return membersWithScores.sort((a, b) => b.xp - a.xp).slice(0, 10);
  }, [communityId, communityMemberships, users, events, eventRsvps, communities, messages]);

  if (leaderboard.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--hairline-border)',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--hairline-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--surface-elevated)',
        }}
      >
        <Trophy size={18} color="var(--brand-accent)" />
        <h3
          style={{
            margin: 0,
            color: 'var(--ink-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.05rem',
          }}
        >
          Top Members
        </h3>
      </div>
      <div>
        {leaderboard.map((m, i) => (
          <div
            key={m.user?.id || i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderBottom: i < leaderboard.length - 1 ? '1px solid var(--hairline-border)' : 'none',
            }}
          >
            <div
              style={{
                width: '28px',
                fontWeight: 800,
                color:
                  i === 0
                    ? '#D97706'
                    : i === 1
                      ? 'var(--ink-secondary)'
                      : i === 2
                        ? '#B45309'
                        : 'var(--ink-muted)',
                fontSize: i < 3 ? '1rem' : '0.86rem',
                textAlign: 'center',
              }}
            >
              #{i + 1}
            </div>
            <img
              src={resolveUserAvatar(m.user)}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: i < 3 ? '2px solid var(--brand-accent)' : '1px solid var(--hairline-border)',
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--ink-primary)',
                  fontSize: '0.92rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.user?.name || 'Community Member'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--teal-300)', fontWeight: 600 }}>
                Level {m.level} • {m.xp} XP
              </div>
            </div>
            {m.badges.length > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {m.badges.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    title={b.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: `${b.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <b.icon size={12} color={b.color} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
