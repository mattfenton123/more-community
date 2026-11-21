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
  Shield,
  Compass,
  Sprout,
  CheckCircle2,
  Lock,
  Car,
  MessageCircle,
  Lightbulb,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { resolveUserAvatar } from '../lib/avatar';

// ─── 4-Tier Real-World Trust & Community Standing ───────────
export const STANDING_TIERS = [
  {
    tier: 0,
    id: 'newcomer',
    name: 'Newcomer',
    shortLabel: 'Newcomer',
    emoji: '🌱',
    icon: Sprout,
    color: '#6E655A',
    bgSoft: 'rgba(110, 101, 90, 0.14)',
    borderSoft: 'rgba(110, 101, 90, 0.30)',
    minMeetups: 0,
    nextTierMeetups: 1,
    tagline: 'Welcome to the neighbourhood! Join your first in-person gathering to verify your profile.',
    activePerks: [
      'RSVP to local meetups & join the Event Q&A discussion',
      'Reserve a passenger seat in a verified driver’s carpool',
      'Message Community Leaders & Co-Leaders directly',
    ],
    nextUnlockTitle: 'Attend 1 In-Person Meetup → Unlock Verified Local 🛡️',
    nextUnlocks: [
      '🚗 Offer Carpool Lifts as a Verified In-Person Driver',
      '💬 1:1 Direct Messaging with fellow community members',
      '💡 Propose Community Events to your leader’s calendar',
      '💵 Cash-on-Arrival reservation trust on paid meetups',
    ],
  },
  {
    tier: 1,
    id: 'verified_local',
    name: 'Verified Local',
    shortLabel: 'Verified Local',
    emoji: '🛡️',
    icon: Shield,
    color: '#265E4F',
    bgSoft: 'rgba(58, 142, 118, 0.14)',
    borderSoft: 'rgba(58, 142, 118, 0.32)',
    minMeetups: 1,
    nextTierMeetups: 5,
    tagline: 'Verified in person at a local meetup — trusted across your communities.',
    activePerks: [
      '🚗 Can offer carpool lifts as a Verified In-Person Driver',
      '💬 1:1 Direct Messaging unlocked with shared community members',
      '💡 Can propose community events & ideas to group leaders',
      '📸 Full access to attendee event photo galleries',
    ],
    nextUnlockTitle: 'Attend 5 Meetups → Unlock Community Regular 🔥',
    nextUnlocks: [
      '⚡ Priority waitlist & +1 guest privileges on capped events',
      '🏷️ Local business sponsor perks & member-only discounts',
      '⭐ Highlighted as eligible for Co-Leader nomination',
    ],
  },
  {
    tier: 2,
    id: 'regular',
    name: 'Community Regular',
    shortLabel: 'Regular',
    emoji: '🔥',
    icon: Flame,
    color: '#C85A32',
    bgSoft: 'rgba(200, 90, 50, 0.14)',
    borderSoft: 'rgba(200, 90, 50, 0.32)',
    minMeetups: 5,
    nextTierMeetups: 15,
    tagline: 'A familiar, trusted face who helps make local gatherings welcoming for everyone.',
    activePerks: [
      '✓ All Verified Local privileges (Carpool Driver, 1:1 DMs, Event Proposals)',
      '⚡ Priority waitlist standing & +1 guest privileges',
      '🏷️ Local partner & sponsor perks unlocked',
      '⭐ Eligible for Co-Leader nomination in your groups',
    ],
    nextUnlockTitle: 'Attend 15 Meetups (or Lead a Group) → Community Pillar 🧭',
    nextUnlocks: [
      '🏛️ Launch a local chapter of an established community brand',
      '🤝 Host cross-community collaborations & partner sessions',
    ],
  },
  {
    tier: 3,
    id: 'pillar',
    name: 'Community Pillar',
    shortLabel: 'Pillar',
    emoji: '🧭',
    icon: Compass,
    color: '#D97706',
    bgSoft: 'rgba(217, 119, 6, 0.14)',
    borderSoft: 'rgba(217, 119, 6, 0.34)',
    minMeetups: 15,
    nextTierMeetups: null,
    tagline: 'Cornerstone leader & connector building real-world community across the region.',
    activePerks: [
      '✓ Full Community Trust & Verified Driver standing',
      '🏛️ Eligible to launch chapters & co-host multi-group events',
      '🤝 Trusted mentor & first-timer welcomer across communities',
    ],
    nextUnlockTitle: null,
    nextUnlocks: [],
  },
];

// ─── Meaningful Real-World Milestone Badges ─────────────────
const BADGES = [
  {
    id: 'verified_in_person',
    name: 'Verified Local',
    description: 'Attended 1+ meetup in person — unlocks Offering Carpools, 1:1 DMs & Event Proposals',
    icon: Shield,
    color: '#265E4F',
    check: (s) => s.eventsAttended >= 1 || s.isLeader,
  },
  {
    id: 'regular',
    name: 'Community Regular',
    description: 'Attended 5+ meetups — unlocks local sponsor perks & Co-Leader eligibility',
    icon: Target,
    color: '#C85A32',
    check: (s) => s.eventsAttended >= 5,
  },
  {
    id: 'super_fan',
    name: 'Community Pillar',
    description: 'Attended 10+ meetups — cornerstone local member & connector',
    icon: Trophy,
    color: '#D97706',
    check: (s) => s.eventsAttended >= 10,
  },
  {
    id: 'leader',
    name: 'Community Host',
    description: 'Leads or co-leads an active local community on More.',
    icon: Crown,
    color: '#B45309',
    check: (s) => s.isLeader,
  },
  {
    id: 'first_join',
    name: 'First Step',
    description: 'Joined your first local community group',
    icon: Star,
    color: '#2563EB',
    check: (s) => s.communitiesJoined >= 1,
  },
  {
    id: 'social_butterfly',
    name: 'Local Explorer',
    description: 'Active member across 3+ local communities',
    icon: Users,
    color: '#7C3AED',
    check: (s) => s.communitiesJoined >= 3,
  },
  {
    id: 'streak_3',
    name: 'Consistent Rhythm',
    description: '3+ weeks of consistent real-world & community engagement',
    icon: Flame,
    color: '#DC2626',
    check: (s) => s.weeklyStreak >= 3,
  },
  {
    id: 'kind_heart',
    name: 'Good Neighbour',
    description: 'Part of a volunteering or peer-support community',
    icon: Heart,
    color: '#E11D48',
    check: (s) => s.hasVolunteering,
  },
];

export function getStandingTier(eventsAttended = 0, isLeader = false) {
  if (isLeader || eventsAttended >= 15) return STANDING_TIERS[3];
  if (eventsAttended >= 5) return STANDING_TIERS[2];
  if (eventsAttended >= 1) return STANDING_TIERS[1];
  return STANDING_TIERS[0];
}

// ─── Pure Calculation Function ────────────────────────────────
export function calculateUserGamification(
  targetId,
  { communityMemberships = {}, events = [], eventRsvps = {}, communities = [], messages = [] }
) {
  const defaultTier = STANDING_TIERS[0];
  if (!targetId) {
    return {
      badges: [],
      earnedBadges: [],
      lockedBadges: [],
      standing: defaultTier,
      hasVerifiedMeetup: false,
      xp: 0,
      level: 1,
      xpInLevel: 0,
      xpForNext: 1,
      streak: 0,
      stats: {
        communitiesJoined: 0,
        eventsAttended: 0,
        verifiedPastMeetups: 0,
        messagesSent: 0,
        weeklyStreak: 0,
        hasVolunteering: false,
        isLeader: false,
      },
    };
  }

  let communitiesJoined = 0;
  let hasVolunteering = false;
  let isLeader = false;

  Object.entries(communityMemberships || {}).forEach(([cId, mems]) => {
    const myMem = (mems || []).find((m) => (m.userId || m.user_id) === targetId);
    if (myMem) {
      communitiesJoined++;
      if (myMem.role === 'Leader' || myMem.role === 'Co-Leader') {
        isLeader = true;
      }
      const comm = (communities || []).find((c) => c.id === cId);
      if (
        comm?.category?.toLowerCase().includes('volunteer') ||
        comm?.tags?.some((t) => String(t).toLowerCase().includes('volunteer') || String(t).toLowerCase().includes('support'))
      ) {
        hasVolunteering = true;
      }
    }
  });

  if (!isLeader) {
    isLeader = (communities || []).some((c) => c.leader_id === targetId || c.creator_id === targetId);
  }

  const todayIso = new Date().toISOString().split('T')[0];
  let eventsAttended = 0;
  let verifiedPastMeetups = 0;

  Object.entries(eventRsvps || {}).forEach(([evId, rsvps]) => {
    const myRsvp = (rsvps || []).find((r) => (r.userId || r.user_id) === targetId);
    if (!myRsvp) return;
    const isCheckedIn = Boolean(myRsvp.checkedIn || myRsvp.checked_in || myRsvp.status === 'checked_in');
    const isGoing = myRsvp.status === 'going' || isCheckedIn;
    if (isGoing) {
      eventsAttended++;
      const ev = (events || []).find((e) => e.id === evId);
      if (isCheckedIn || (ev?.date && ev.date <= todayIso)) {
        verifiedPastMeetups++;
      }
    }
  });

  const messagesSent = (messages || []).filter((m) => (m.authorId || m.senderId) === targetId).length;
  const weeklyStreak = Math.min(Math.floor((messagesSent + eventsAttended * 2) / 3), 12);

  const standing = getStandingTier(eventsAttended, isLeader);
  const hasVerifiedMeetup = Boolean(isLeader || eventsAttended >= 1 || verifiedPastMeetups >= 1);

  const stats = {
    communitiesJoined,
    eventsAttended,
    verifiedPastMeetups,
    messagesSent,
    weeklyStreak,
    hasVolunteering,
    isLeader,
  };
  const earnedBadges = BADGES.filter((b) => b.check(stats));
  const lockedBadges = BADGES.filter((b) => !b.check(stats));

  // Progress towards next real-world meetup tier (replaces arbitrary XP bar)
  const targetForNext = standing.nextTierMeetups || 15;
  const currentMeetups = eventsAttended;
  const xpInLevel = Math.min(currentMeetups, targetForNext);
  const xpForNext = targetForNext;
  const trustScore = eventsAttended * 100 + (isLeader ? 300 : 0) + communitiesJoined * 25 + earnedBadges.length * 50;

  return {
    badges: BADGES,
    earnedBadges,
    lockedBadges,
    standing,
    hasVerifiedMeetup,
    xp: trustScore,
    level: standing.tier + 1,
    xpInLevel,
    xpForNext,
    streak: weeklyStreak,
    stats,
  };
}

// ─── Hook for Member Standing & Unlocks ─────────────────────
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
          title={`${badge.name}: ${badge.description}`}
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

// ─── Full Standing & Real-World Trust Panel (for Profile) ───
export default function GamificationPanel({ userId, hideStats = false }) {
  const { earnedBadges, lockedBadges, standing, hasVerifiedMeetup, streak, stats } =
    useGamification(userId);

  const nextTarget = standing.nextTierMeetups;
  const progressPct = nextTarget
    ? Math.min(100, Math.round((stats.eventsAttended / nextTarget) * 100))
    : 100;
  const remainingMeetups = nextTarget ? Math.max(0, nextTarget - stats.eventsAttended) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Community Standing & Trust Card */}
      <div
        style={{
          padding: '18px',
          background: 'var(--surface-card)',
          border: `1px solid ${standing.borderSoft}`,
          borderRadius: '18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: standing.bgSoft,
                border: `1.5px solid ${standing.borderSoft}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                flexShrink: 0,
              }}
            >
              {standing.emoji}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    fontSize: '1.08rem',
                  }}
                >
                  {standing.name}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: standing.bgSoft,
                    color: standing.color,
                    border: `1px solid ${standing.borderSoft}`,
                  }}
                >
                  {hasVerifiedMeetup ? 'In-Person Verified' : 'Tier 1 Pending'}
                </span>
              </div>
              <div style={{ fontSize: '0.79rem', color: 'var(--ink-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                {standing.tagline}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 11px',
              borderRadius: '99px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
            }}
          >
            <Calendar size={13} color="var(--brand-accent)" />
            {stats.eventsAttended} {stats.eventsAttended === 1 ? 'meetup' : 'meetups'}
          </div>
        </div>

        {/* Active Unlocks for Current Standing */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
            marginBottom: nextTarget ? '14px' : 0,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink-muted)',
              marginBottom: '6px',
            }}
          >
            Unlocked at Your Current Standing
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {standing.activePerks.map((perk) => (
              <div
                key={perk}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--ink-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  lineHeight: 1.35,
                }}
              >
                <CheckCircle2 size={14} color="var(--brand-secondary)" style={{ flexShrink: 0 }} />
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next In-Person Milestone & Unlocks */}
        {nextTarget && (
          <div
            style={{
              padding: '14px',
              borderRadius: '14px',
              background: 'var(--brand-accent-soft)',
              border: '1px solid rgba(200, 90, 50, 0.28)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontSize: '0.83rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
                {standing.nextUnlockTitle}
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--teal-300)' }}>
                {remainingMeetups === 1
                  ? '1 more meetup to unlock'
                  : `${remainingMeetups} more meetups to unlock`}
              </span>
            </div>

            {/* Meetup Milestone Progress Bar */}
            <div
              style={{
                height: '8px',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '99px',
                overflow: 'hidden',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(12, progressPct)}%`,
                  background: 'var(--brand-accent)',
                  borderRadius: '99px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {standing.nextUnlocks.map((u) => (
                <div
                  key={u}
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--ink-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={12} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
                  <span>{u}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Optional Stats Row */}
      {!hideStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { label: 'Groups', value: stats.communitiesJoined, color: '#2563EB' },
            { label: 'Meetups', value: stats.eventsAttended, color: 'var(--brand-accent)' },
            { label: 'Milestones', value: earnedBadges.length, color: '#15803D' },
            { label: 'Rhythm', value: `${streak}w`, color: '#DC2626' },
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

      {/* Earned Milestones */}
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
          Real-World Milestones Earned ({earnedBadges.length}/{BADGES.length})
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
            Join a community and attend your first in-person meetup to earn your Verified Local milestone.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' }}>
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
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${badge.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <badge.icon size={17} color={badge.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--ink-secondary)', lineHeight: 1.35 }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Milestones */}
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
            Next Milestones to Unlock ({lockedBadges.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '10px' }}>
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
                  opacity: 0.72,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
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
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink-primary)' }}>
                    {badge.name}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)', lineHeight: 1.35 }}>
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
        standing: gamification.standing,
        meetups: gamification.stats.eventsAttended,
        badges: gamification.earnedBadges,
      };
    });

    return membersWithScores.sort((a, b) => b.meetups - a.meetups || b.xp - a.xp).slice(0, 10);
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
        <Shield size={18} color="var(--brand-secondary)" />
        <h3
          style={{
            margin: 0,
            color: 'var(--ink-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.05rem',
          }}
        >
          Active Community Locals
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
              <div style={{ fontSize: '0.74rem', color: m.standing.color, fontWeight: 700 }}>
                {m.standing.emoji} {m.standing.name} • {m.meetups} {m.meetups === 1 ? 'meetup' : 'meetups'}
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
