"use client";
import { useState } from 'react';
import { TrendingUp, TrendingDown, UserCheck, AlertTriangle, Send, Search, Megaphone, Star, Zap, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/Toast';

function getEngagementScore(member, events, eventRsvps, messages, communityId) {
  let score = 0;
  
  // Check RSVP activity
  const communityEvents = events.filter(e => e.communityId === communityId);
  communityEvents.forEach(event => {
    const rsvps = eventRsvps[event.id] || [];
    if (rsvps.some(r => r.userId === member.userId)) score += 20;
  });
  
  // Check message activity
  const memberMessages = messages.filter(m => m.authorId === member.userId && m.communityId === communityId);
  score += Math.min(memberMessages.length * 5, 40);
  
  // Base participation bonus
  score += 10;
  
  return Math.min(score, 100);
}

function getEngagementStatus(score) {
  if (score >= 60) return { label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: TrendingUp };
  if (score >= 30) return { label: 'Engaged', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: UserCheck };
  if (score >= 10) return { label: 'Slipping', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: TrendingDown };
  return { label: 'Inactive', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle };
}

export default function MemberCRM({ communityId }) {
  const { users, communityMemberships, events, eventRsvps, broadcastNotification } = useAppContext();
    const { messages } = useChat();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState('all');

  const members = (communityMemberships[communityId] || []).map(mem => {
    const u = users.find(usr => usr.id === mem.userId);
    const score = getEngagementScore(mem, events, eventRsvps, messages, communityId);
    const status = getEngagementStatus(score);
    return {
      ...mem,
      user: u,
      score,
      status
    };
  }).filter(m => m.user);

  // Sort by score descending
  const sortedMembers = [...members].sort((a, b) => b.score - a.score);

  const filteredMembers = sortedMembers.filter(m => {
    if (searchTerm && !m.user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filter === 'active') return m.status.label === 'Active';
    if (filter === 'slipping') return m.status.label === 'Slipping' || m.status.label === 'Inactive';
    return true;
  });

  const stats = {
    active: members.filter(m => m.status.label === 'Active').length,
    engaged: members.filter(m => m.status.label === 'Engaged').length,
    slipping: members.filter(m => m.status.label === 'Slipping' || m.status.label === 'Inactive').length,
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsSending(true);
    try {
      await broadcastNotification(communityId, 'Community Update', broadcastText);
      toast.success('Broadcast sent!', `Notified ${members.length} members`);
      setBroadcastText('');
    } catch (err) {
      toast.error('Failed to send', err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>{stats.active}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Active</div>
        </div>
        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6' }}>{stats.engaged}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Engaged</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{stats.slipping}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Slipping</div>
        </div>
      </div>

      {/* Broadcast Section */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--teal-400)' }}>
          <Megaphone size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Broadcast to All Members</span>
        </div>
        <textarea
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value)}
          placeholder="Write a message to all your members..."
          style={{
            width: '100%', minHeight: '80px', resize: 'vertical',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', padding: '12px', color: 'var(--white)', fontSize: '0.9rem',
            fontFamily: 'inherit', lineHeight: 1.5
          }}
        />
        <button
          onClick={handleBroadcast}
          disabled={!broadcastText.trim() || isSending}
          className="btn btn-primary interactive-press"
          style={{ marginTop: '8px', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Send size={14} /> {isSending ? 'Sending...' : `Send to ${members.length} members`}
        </button>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['all', 'active', 'slipping'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="interactive-press"
            style={{
              padding: '8px 16px', borderRadius: '99px', border: 'none',
              background: filter === f ? 'white' : 'rgba(255,255,255,0.05)',
              color: filter === f ? 'black' : 'var(--slate-300)',
              fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--slate-500)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            padding: '12px 12px 12px 40px', color: 'var(--white)', fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Member List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredMembers.map(member => {
          const StatusIcon = member.status.icon;
          return (
            <div key={member.userId} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={member.user.avatar} alt={member.user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>{member.user.name}</span>
                  {member.role === 'Leader' && (
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Zap size={10} /> Score: {member.score}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: member.status.bg, color: member.status.color,
                padding: '4px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700
              }}>
                <StatusIcon size={12} />
                {member.status.label}
              </div>
            </div>
          );
        })}
        {filteredMembers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-500)' }}>No members match your filter.</div>
        )}
      </div>
    </div>
  );
}
