import { useMemo } from 'react';
import { Trophy, Flame, Star, Zap, Target, Crown, Heart, Users, Calendar, MessageCircle, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';

// ─── Badge Definitions ──────────────────────────────────────
const BADGES = [
  { id: 'first_join', name: 'Pioneer', description: 'Joined your first community', icon: Star, color: '#f59e0b', check: (s) => s.communitiesJoined >= 1 },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Joined 3+ communities', icon: Users, color: '#ec4899', check: (s) => s.communitiesJoined >= 3 },
  { id: 'networker', name: 'Networker', description: 'Joined 5+ communities', icon: Crown, color: '#a78bfa', check: (s) => s.communitiesJoined >= 5 },
  { id: 'first_event', name: 'First Steps', description: 'RSVP\'d to your first event', icon: Calendar, color: '#14b8a6', check: (s) => s.eventsAttended >= 1 },
  { id: 'regular', name: 'Regular', description: 'Attended 5+ events', icon: Target, color: '#3b82f6', check: (s) => s.eventsAttended >= 5 },
  { id: 'super_fan', name: 'Super Fan', description: 'Attended 10+ events', icon: Trophy, color: '#f59e0b', check: (s) => s.eventsAttended >= 10 },
  { id: 'chatterbox', name: 'Chatterbox', description: 'Sent 10+ messages', icon: MessageCircle, color: '#22c55e', check: (s) => s.messagesSent >= 10 },
  { id: 'storyteller', name: 'Storyteller', description: 'Sent 50+ messages', icon: MessageCircle, color: '#f97316', check: (s) => s.messagesSent >= 50 },
  { id: 'streak_3', name: 'On Fire', description: '3-week activity streak', icon: Flame, color: '#ef4444', check: (s) => s.weeklyStreak >= 3 },
  { id: 'streak_8', name: 'Unstoppable', description: '8-week activity streak', icon: Zap, color: '#eab308', check: (s) => s.weeklyStreak >= 8 },
  { id: 'kind_heart', name: 'Kind Heart', description: 'Joined a volunteering community', icon: Heart, color: '#f43f5e', check: (s) => s.hasVolunteering },
  { id: 'leader', name: 'Leader', description: 'Lead a community', icon: Crown, color: '#f59e0b', check: (s) => s.isLeader },
];

// ─── Pure Calculation Function ────────────────────────────────
export function calculateUserGamification(targetId, { communityMemberships, events, eventRsvps, communities, messages }) {
  if (!targetId) return { badges: [], earnedBadges: [], lockedBadges: [], xp: 0, level: 1, xpInLevel: 0, xpForNext: 500, streak: 0, stats: {} };

  let communitiesJoined = 0;
  let hasVolunteering = false;
  Object.entries(communityMemberships).forEach(([cId, mems]) => {
    if (mems.some(m => m.userId === targetId)) {
      communitiesJoined++;
      const comm = communities.find(c => c.id === cId);
      if (comm?.category?.includes('Volunteer') || comm?.tags?.some(t => t.toLowerCase().includes('volunteer'))) {
        hasVolunteering = true;
      }
    }
  });

  let eventsAttended = 0;
  Object.values(eventRsvps).forEach(rsvps => {
    if (rsvps.some(r => r.userId === targetId && r.status === 'going')) eventsAttended++;
  });

  const messagesSent = messages.filter(m => m.authorId === targetId).length;
  const weeklyStreak = Math.min(Math.floor((messagesSent + eventsAttended) / 3), 12);

  let isLeader = false;
  Object.values(communityMemberships).forEach(mems => {
    if (mems.some(m => m.userId === targetId && m.role === 'Leader')) isLeader = true;
  });

  const stats = { communitiesJoined, eventsAttended, messagesSent, weeklyStreak, hasVolunteering, isLeader };
  const earnedBadges = BADGES.filter(b => b.check(stats));
  const lockedBadges = BADGES.filter(b => !b.check(stats));

  const xp = communitiesJoined * 50 + eventsAttended * 100 + messagesSent * 10 + weeklyStreak * 75 + earnedBadges.length * 200;
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
    return calculateUserGamification(userId || user?.id, { communityMemberships, events, eventRsvps, communities, messages });
  }, [userId, user, communityMemberships, events, eventRsvps, messages, communities]);
}

// ─── Compact Badge Row (for profile cards) ──────────────────
export function BadgeRow({ userId, maxShow = 5 }) {
  const { earnedBadges } = useGamification(userId);
  if (earnedBadges.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {earnedBadges.slice(0, maxShow).map(badge => (
        <div key={badge.id} title={badge.name} style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: `${badge.color}15`, border: `1px solid ${badge.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <badge.icon size={14} color={badge.color} />
        </div>
      ))}
      {earnedBadges.length > maxShow && (
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--slate-400)', fontWeight: 600 }}>
          +{earnedBadges.length - maxShow}
        </div>
      )}
    </div>
  );
}

// ─── Full Gamification Panel (for profile page) ─────────────
export default function GamificationPanel({ userId }) {
  const { earnedBadges, lockedBadges, xp, level, xpInLevel, xpForNext, streak, stats } = useGamification(userId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Level & XP Bar */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--white)' }}>{level}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.95rem' }}>Level {level}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{xp} XP total</div>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Flame size={14} color="#ef4444" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>{streak}</span>
            </div>
          )}
        </div>
        {/* XP Progress Bar */}
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(xpInLevel / xpForNext) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--slate-600)', marginTop: '4px' }}>
          <span>{xpInLevel} / {xpForNext} XP</span>
          <span>Level {level + 1}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Groups', value: stats.communitiesJoined, color: '#3b82f6' },
          { label: 'Events', value: stats.eventsAttended, color: '#14b8a6' },
          { label: 'Messages', value: stats.messagesSent, color: '#22c55e' },
          { label: 'Streak', value: `${streak}w`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Earned Badges */}
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Badges Earned ({earnedBadges.length}/{BADGES.length})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {earnedBadges.map(badge => (
            <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: `${badge.color}08`, border: `1px solid ${badge.color}20`, borderRadius: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${badge.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <badge.icon size={16} color={badge.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--white)' }}>{badge.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{badge.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Locked ({lockedBadges.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {lockedBadges.map(badge => (
              <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', opacity: 0.4 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <badge.icon size={16} color="var(--slate-600)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-500)' }}>{badge.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-600)' }}>{badge.description}</div>
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
    const mems = communityMemberships[communityId] || [];
    const contextData = { communityMemberships, events, eventRsvps, communities, messages };

    const membersWithScores = mems.map(m => {
      const user = users.find(u => u.id === m.userId);
      const gamification = calculateUserGamification(m.userId, contextData);
      return {
        user,
        role: m.role,
        xp: gamification.xp,
        level: gamification.level,
        badges: gamification.earnedBadges
      };
    });

    return membersWithScores.sort((a, b) => b.xp - a.xp).slice(0, 10); // Top 10
  }, [communityId, communityMemberships, users, events, eventRsvps, communities, messages]);

  if (leaderboard.length === 0) return null;

  return (
    <div style={{ background: 'var(--slate-800)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--slate-700)', marginBottom: '24px' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--slate-700)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
        <Trophy size={20} color="var(--teal-400)" />
        <h3 style={{ margin: 0, color: 'var(--white)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Top Members</h3>
      </div>
      <div>
        {leaderboard.map((m, i) => (
          <div key={m.user?.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: i < 3 ? 'rgba(20,184,166,0.03)' : 'transparent' }}>
            <div style={{ width: '28px', fontWeight: 700, color: i === 0 ? '#f59e0b' : i === 1 ? '#a1a1aa' : i === 2 ? '#b45309' : 'var(--slate-500)', fontSize: i < 3 ? '1.1rem' : '0.9rem', textAlign: 'center' }}>
              #{i + 1}
            </div>
            <img src={m.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.name || 'U')}&background=14b8a6&color=fff`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: i < 3 ? '2px solid var(--teal-500)' : 'none' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--white)' }}>{m.user?.name || 'Unknown User'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--teal-300)' }}>Level {m.level} • {m.xp} XP</div>
            </div>
            {m.badges.length > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                {m.badges.slice(0, 3).map(b => (
                  <div key={b.id} title={b.name} style={{ width: '24px', height: '24px', borderRadius: '6px', background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
