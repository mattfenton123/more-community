"use client";
import { useState, useMemo } from 'react';
import { Search, Users, Crown, MessageCircle, ChevronRight, Trophy, Flame } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { BadgeRow, useGamification, CommunityLeaderboard } from './Gamification';

function MemberRow({ member, communityId }) {
  const navigate = useNavigate();
  const { users, eventRsvps, events } = useAppContext();
    const { messages } = useChat();
  const user = users.find(u => u.id === member.userId);
  if (!user) return null;

  const messageCount = messages.filter(m => m.authorId === member.userId && m.communityId === communityId).length;
  let eventsAttended = 0;
  events.filter(e => e.communityId === communityId).forEach(e => {
    if ((eventRsvps[e.id] || []).some(r => r.userId === member.userId && r.status === 'going')) eventsAttended++;
  });

  return (
    <div onClick={() => navigate.push(`/profile/${member.userId}`)} className="interactive-press"
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', marginBottom: '6px' }}>
      <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8B93&color=fff`} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.85rem' }}>{user.name}</span>
          {member.role === 'Leader' && <Crown size={13} color="#f59e0b" />}
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
          <span>{messageCount} msgs</span>
          <span>{eventsAttended} events</span>
          {member.role === 'Leader' && <span style={{ color: '#f59e0b', fontWeight: 600 }}>Leader</span>}
        </div>
      </div>
      <ChevronRight size={14} color="var(--slate-600)" />
    </div>
  );
}

export default function MemberDirectory({ communityId, onClose }) {
  const { communityMemberships, users, communities } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('directory'); // 'directory' | 'leaderboard'

  const community = communities.find(c => c.id === communityId);
  const members = communityMemberships[communityId] || [];

  const filteredMembers = useMemo(() => {
    let list = members.filter(m => {
      const u = users.find(u => u.id === m.userId);
      return u && u.privacy_visibility !== 'private';
    });
    if (filter === 'leaders') list = list.filter(m => m.role === 'Leader');
    if (search) {
      list = list.filter(m => {
        const u = users.find(u => u.id === m.userId);
        return u?.name?.toLowerCase().includes(search.toLowerCase()) || u?.email?.toLowerCase().includes(search.toLowerCase());
      });
    }
    // Sort leaders first
    return list.sort((a, b) => (b.role === 'Leader' ? 1 : 0) - (a.role === 'Leader' ? 1 : 0));
  }, [members, filter, search, users]);

  return (
    <div style={{ padding: '16px', background: 'var(--slate-950)', minHeight: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--teal-400)" />
          <h3 style={{ margin: 0, color: 'var(--white)', fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>{view === 'directory' ? `Members (${members.length})` : 'Leaderboard'}</h3>
        </div>
        <button onClick={() => setView(view === 'directory' ? 'leaderboard' : 'directory')} className="interactive-press"
          style={{ background: view === 'leaderboard' ? 'rgba(255,255,255,0.1)' : 'rgba(245,158,11,0.1)', border: view === 'leaderboard' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '5px 10px', color: view === 'leaderboard' ? 'white' : '#f59e0b', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {view === 'directory' ? <><Trophy size={12} /> Leaderboard</> : <><Users size={12} /> Directory</>}
        </button>
      </div>

      {view === 'leaderboard' ? (
        <CommunityLeaderboard communityId={communityId} />
      ) : (
        <>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={14} color="var(--slate-500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 10px 10px 34px', color: 'var(--white)', fontSize: '0.85rem' }} />
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[{ value: 'all', label: 'All' }, { value: 'leaders', label: '👑 Leaders' }].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} className="interactive-press"
            style={{ padding: '5px 12px', borderRadius: '99px', border: 'none', fontSize: '0.7rem', fontWeight: 600,
              background: filter === f.value ? 'white' : 'rgba(255,255,255,0.05)',
              color: filter === f.value ? 'black' : 'var(--slate-400)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Member List */}
      <div>
        {filteredMembers.map(m => (
          <MemberRow key={m.userId} member={m} communityId={communityId} />
        ))}
        {filteredMembers.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No members found.</div>}
      </div>
      </>)}
    </div>
  );
}
