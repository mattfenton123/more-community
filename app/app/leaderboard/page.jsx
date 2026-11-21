"use client";
import { useMemo } from 'react';
import { Trophy, Flame, Crown, Medal, Shield, Calendar } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { useGamification, calculateUserGamification, BadgeRow } from '../../src/components/Gamification';
import { resolveUserAvatar } from '../../src/lib/avatar';
import AppHeader from '../../src/components/AppHeader';

function UserLeaderboardRow({ userId, rank }) {
  const { users } = useAppContext();
  const navigate = useNavigate();
  const { standing, stats, streak } = useGamification(userId);
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const rankConfig = {
    1: { bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.32)', icon: Crown, color: '#D97706' },
    2: { bg: 'var(--surface-card)', border: 'var(--hairline-border-strong)', icon: Medal, color: 'var(--ink-secondary)' },
    3: { bg: 'rgba(180, 83, 9, 0.08)', border: 'rgba(180, 83, 9, 0.28)', icon: Medal, color: '#B45309' },
  };
  const rc = rankConfig[rank];

  return (
    <div
      onClick={() => navigate.push(`/profile/${user.id}`)}
      className="interactive-press"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px',
        background: rc ? rc.bg : 'var(--surface-card)',
        border: `1px solid ${rc ? rc.border : 'var(--hairline-border)'}`,
        borderRadius: '14px',
        cursor: 'pointer',
        marginBottom: '8px',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: rc ? `${rc.color}18` : 'var(--surface-elevated)',
          flexShrink: 0,
        }}
      >
        {rc ? (
          <rc.icon size={16} color={rc.color} />
        ) : (
          <span style={{ fontWeight: 700, color: 'var(--ink-muted)', fontSize: '0.85rem' }}>{rank}</span>
        )}
      </div>

      {/* Avatar + Standing Emoji */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={resolveUserAvatar(user)}
          alt=""
          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div
          title={standing.name}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: '22px',
            height: '22px',
            borderRadius: '7px',
            background: 'var(--surface-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1.5px solid ${standing.borderSoft}`,
            fontSize: '0.72rem',
          }}
        >
          {standing.emoji}
        </div>
      </div>

      {/* Name + Standing + Milestones */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
          <span style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.92rem' }}>{user.name}</span>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: '999px',
              background: standing.bgSoft,
              color: standing.color,
              border: `1px solid ${standing.borderSoft}`,
            }}
          >
            {standing.name}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <BadgeRow userId={userId} maxShow={4} />
        </div>
      </div>

      {/* Meetups Attended + Rhythm */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, color: 'var(--ink-primary)', fontSize: '0.9rem' }}>
          {stats.eventsAttended} {stats.eventsAttended === 1 ? 'meetup' : 'meetups'}
        </div>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '2px' }}>
            <Flame size={11} color="#DC2626" />
            <span style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 700 }}>{streak}w rhythm</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { users, communityMemberships, events, eventRsvps, communities } = useAppContext();
  const { messages } = useChat();
  const navigate = useNavigate();

  const rankedUsers = useMemo(() => {
    const contextData = { communityMemberships, events, eventRsvps, communities, messages };
    return (users || [])
      .map((u) => {
        const g = calculateUserGamification(u.id, contextData);
        return {
          userId: u.id,
          meetups: g.stats.eventsAttended,
          standing: g.standing,
          xp: g.xp,
        };
      })
      .sort((a, b) => b.meetups - a.meetups || b.xp - a.xp);
  }, [users, communityMemberships, events, eventRsvps, communities, messages]);

  return (
    <div style={{ paddingBottom: '96px', minHeight: '100dvh', background: 'var(--surface-canvas)' }}>
      <AppHeader title="Community Standing" showBack={true} />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 20px' }}>
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '16px',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--brand-secondary-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={20} color="var(--brand-secondary)" />
          </div>
          <div>
            <h2
              style={{
                margin: '0 0 2px',
                fontSize: '1.05rem',
                fontFamily: 'var(--font-heading)',
                color: 'var(--ink-primary)',
              }}
            >
              Real-World Community Standing
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
              Members earn trust by showing up in person — progressing from <strong>Newcomer 🌱</strong> to{' '}
              <strong>Verified Local 🛡️</strong> (1st meetup), <strong>Community Regular 🔥</strong> (5+ meetups), and{' '}
              <strong>Community Pillar 🧭</strong>.
            </p>
          </div>
        </div>

        {/* Top 3 Podium */}
        {rankedUsers.length >= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', padding: '6px 0 24px' }}>
            {[1, 0, 2].map((idx) => {
              const ru = rankedUsers[idx];
              const u = users.find((us) => us.id === ru?.userId);
              if (!u) return null;
              const rank = idx + 1;
              const isFirst = idx === 0;
              const heights = { 0: '84px', 1: '64px', 2: '52px' };
              const colors = { 0: '#D97706', 1: '#6E655A', 2: '#B45309' };
              return (
                <div
                  key={idx}
                  onClick={() => navigate.push(`/profile/${u.id}`)}
                  className="interactive-press"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flex: 1,
                    maxWidth: '130px',
                  }}
                >
                  <img
                    src={resolveUserAvatar(u)}
                    alt=""
                    style={{
                      width: isFirst ? '58px' : '46px',
                      height: isFirst ? '58px' : '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `3px solid ${colors[idx]}`,
                      marginBottom: '6px',
                    }}
                  />
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                      fontSize: '0.78rem',
                      textAlign: 'center',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {u.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: colors[idx], fontWeight: 700, marginBottom: '6px' }}>
                    {ru.standing.emoji} {ru.meetups} {ru.meetups === 1 ? 'meetup' : 'meetups'}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: heights[idx],
                      background: 'var(--surface-card)',
                      borderRadius: '10px 10px 0 0',
                      border: `1.5px solid ${colors[idx]}55`,
                      borderBottom: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: colors[idx] }}>#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full List */}
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--ink-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '10px',
            }}
          >
            All Members ({rankedUsers.length})
          </div>
          {rankedUsers.map((ru, i) => (
            <UserLeaderboardRow key={ru.userId} userId={ru.userId} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
