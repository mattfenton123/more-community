"use client";
import { useMemo } from 'react';
import { Trophy, Flame, Crown, Medal, Star, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { useGamification, BadgeRow } from '../../src/components/Gamification';

function UserLeaderboardRow({ userId, rank }) {
  const { users } = useAppContext();
  const navigate = useNavigate();
  const { xp, level, streak, earnedBadges } = useGamification(userId);
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  const rankConfig = {
    1: { bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.03))', border: 'rgba(245,158,11,0.3)', icon: Crown, color: '#f59e0b' },
    2: { bg: 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(148,163,184,0.03))', border: 'rgba(148,163,184,0.3)', icon: Medal, color: '#94a3b8' },
    3: { bg: 'linear-gradient(135deg, rgba(180,83,9,0.15), rgba(180,83,9,0.03))', border: 'rgba(180,83,9,0.3)', icon: Medal, color: '#b45309' },
  };
  const rc = rankConfig[rank];

  return (
    <div 
      onClick={() => navigate.push('/')}
      className="interactive-press"
      style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px',
        background: rc ? rc.bg : 'rgba(255,255,255,0.02)',
        border: `1px solid ${rc ? rc.border : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '14px', cursor: 'pointer', marginBottom: '8px'
      }}
    >
      {/* Rank */}
      <div style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: rc ? `${rc.color}20` : 'rgba(255,255,255,0.05)',
        flexShrink: 0
      }}>
        {rc ? <rc.icon size={16} color={rc.color} /> : <span style={{ fontWeight: 700, color: 'var(--slate-400)', fontSize: '0.85rem' }}>{rank}</span>}
      </div>

      {/* Avatar + Level Badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8B93&color=fff`} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderRadius: '6px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--slate-950)' }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--white)' }}>{level}</span>
        </div>
      </div>

      {/* Name + Badges */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', marginBottom: '3px' }}>{user.name}</div>
        <BadgeRow userId={userId} maxShow={4} />
      </div>

      {/* XP + Streak */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: rank <= 3 ? (rc?.color || 'white') : 'var(--teal-400)', fontSize: '0.9rem' }}>{xp} XP</div>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', marginTop: '2px' }}>
            <Flame size={11} color="#ef4444" />
            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600 }}>{streak}w</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { users, communityMemberships, events, eventRsvps } = useAppContext();
    const { messages } = useChat();
  const navigate = useNavigate();

  // Calculate XP for all users and rank them
  const rankedUsers = useMemo(() => {
    return users.map(u => {
      let communitiesJoined = 0;
      Object.values(communityMemberships).forEach(mems => {
        if (mems.some(m => m.userId === u.id)) communitiesJoined++;
      });
      let eventsAttended = 0;
      Object.values(eventRsvps).forEach(rsvps => {
        if (rsvps.some(r => r.userId === u.id && r.status === 'going')) eventsAttended++;
      });
      const messagesSent = messages.filter(m => m.authorId === u.id).length;
      const weeklyStreak = Math.min(Math.floor((messagesSent + eventsAttended) / 3), 12);
      let isLeader = false;
      Object.values(communityMemberships).forEach(mems => {
        if (mems.some(m => m.userId === u.id && m.role === 'Leader')) isLeader = true;
      });
      
      const badgeCount = [
        communitiesJoined >= 1, communitiesJoined >= 3, communitiesJoined >= 5,
        eventsAttended >= 1, eventsAttended >= 5, eventsAttended >= 10,
        messagesSent >= 10, messagesSent >= 50,
        weeklyStreak >= 3, weeklyStreak >= 8,
        false, isLeader
      ].filter(Boolean).length;

      const xp = communitiesJoined * 50 + eventsAttended * 100 + messagesSent * 10 + weeklyStreak * 75 + badgeCount * 200;
      return { userId: u.id, xp };
    }).sort((a, b) => b.xp - a.xp);
  }, [users, communityMemberships, eventRsvps, messages]);

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: 'var(--slate-950)' }}>
      {/* Header */}
      <div style={{ padding: '28px 20px 20px', background: 'linear-gradient(180deg, rgba(245,158,11,0.1) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button onClick={() => navigate.push('/')} className="interactive-press" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)', margin: 0, fontFamily: 'var(--font-heading)' }}>Leaderboard</h1>
            <p style={{ color: 'var(--slate-500)', margin: 0, fontSize: '0.8rem' }}>Top members by XP</p>
          </div>
          <Trophy size={22} color="#f59e0b" style={{ marginLeft: 'auto' }} />
        </div>
      </div>

      {/* Top 3 Podium */}
      {rankedUsers.length >= 3 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', padding: '10px 20px 24px' }}>
          {[1, 0, 2].map(idx => {
            const ru = rankedUsers[idx];
            const u = users.find(us => us.id === ru?.userId);
            if (!u) return null;
            const rank = idx + 1;
            const isFirst = idx === 0;
            const heights = { 0: '80px', 1: '60px', 2: '50px' };
            const colors = { 0: '#f59e0b', 1: '#94a3b8', 2: '#b45309' };
            return (
              <div key={idx} onClick={() => navigate.push('/')} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1, maxWidth: '110px' }}>
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} alt="" style={{ width: isFirst ? '56px' : '44px', height: isFirst ? '56px' : '44px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${colors[idx]}`, marginBottom: '6px' }} />
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.75rem', textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{u.name}</div>
                <div style={{ fontSize: '0.65rem', color: colors[idx], fontWeight: 700, marginBottom: '6px' }}>{ru.xp} XP</div>
                <div style={{ width: '100%', height: heights[idx], background: `linear-gradient(180deg, ${colors[idx]}30 0%, ${colors[idx]}08 100%)`, borderRadius: '8px 8px 0 0', border: `1px solid ${colors[idx]}30`, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: colors[idx] }}>{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          All Members ({rankedUsers.length})
        </div>
        {rankedUsers.map((ru, i) => (
          <UserLeaderboardRow key={ru.userId} userId={ru.userId} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
