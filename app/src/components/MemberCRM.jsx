"use client";
import { useState } from 'react';
import { TrendingUp, TrendingDown, UserCheck, AlertTriangle, Send, Search, Megaphone, Star, Zap, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/Toast';
import ProfileImageModal from './ProfileImageModal';
import { resolveUserAvatar } from '../lib/avatar';

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

export default function MemberCRM({ communityId, onOpenBroadcast }) {
  const { users, communityMemberships, events, eventRsvps, promoteMember } = useAppContext();
  const { messages } = useChat();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMemberImage, setSelectedMemberImage] = useState(null);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#16a34a' }}>{stats.active}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>Active</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2563eb' }}>{stats.engaged}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>Engaged</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d97706' }}>{stats.slipping}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>Slipping</div>
        </div>
      </div>

      {/* Single Broadcast Entrypoint */}
      {onOpenBroadcast && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Megaphone size={17} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Send announcements to all members, specific event attendees, or selected people in <strong style={{ color: 'var(--ink-primary)' }}>Broadcast</strong>.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenBroadcast}
            className="btn btn-primary interactive-press"
            style={{ padding: '7px 14px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}
          >
            Open Broadcast →
          </button>
        </div>
      )}

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['all', 'active', 'slipping'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="interactive-press"
            style={{
              padding: '8px 16px', borderRadius: '99px',
              border: filter === f ? '1px solid var(--brand-accent)' : '1px solid var(--hairline-border-strong)',
              background: filter === f ? 'var(--brand-accent)' : 'var(--surface-card)',
              color: filter === f ? '#FFFFFF' : 'var(--ink-secondary)',
              fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize', cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%', background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border-strong)', borderRadius: '10px',
            padding: '11px 12px 11px 40px', color: 'var(--ink-primary)', fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Member List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredMembers.map(member => {
          const StatusIcon = member.status.icon;
          const isCoLeader = member.role === 'Co-Leader' || member.role === 'Moderator';
          return (
            <div key={member.userId} style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={resolveUserAvatar(member.user)} 
                alt={member.user.name} 
                title="Click to view full photo"
                onClick={() => setSelectedMemberImage({
                  imageUrl: resolveUserAvatar(member.user),
                  name: member.user.name,
                  subtitle: `${member.role || 'Member'} • Engagement Score: ${member.score}`
                })}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} 
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>{member.user.name}</span>
                  {member.role === 'Leader' && (
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  )}
                  {isCoLeader && (
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(139,92,246,0.18)', color: '#8b5cf6', padding: '2px 6px', borderRadius: '4px' }}>Co-Leader</span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Zap size={10} /> Engagement: {member.score}%
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {member.role !== 'Leader' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newRole = isCoLeader ? 'Member' : 'Co-Leader';
                      try {
                        await promoteMember(communityId, member.userId, newRole);
                        toast.success(newRole === 'Co-Leader' ? 'Promoted!' : 'Demoted', `${member.user.name} is now a ${newRole}.`);
                      } catch (err) { toast.error('Failed', 'Could not update role.'); }
                    }}
                    className="interactive-press"
                    style={{ padding: '5px 9px', background: isCoLeader ? 'rgba(220,38,38,0.08)' : 'rgba(139,92,246,0.1)', border: `1px solid ${isCoLeader ? 'rgba(220,38,38,0.25)' : 'rgba(139,92,246,0.28)'}`, borderRadius: '7px', color: isCoLeader ? '#dc2626' : '#7c3aed', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >{isCoLeader ? 'Demote' : 'Make Co-Leader'}</button>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: member.status.bg, color: member.status.color,
                  padding: '4px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700
                }}>
                  <StatusIcon size={12} />
                  {member.status.label}
                </div>
              </div>
            </div>
          );
        })}
        {filteredMembers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-500)' }}>No members match your filter.</div>
        )}
      </div>

      {/* Full Profile Image Modal */}
      {selectedMemberImage && (
        <ProfileImageModal
          isOpen={Boolean(selectedMemberImage)}
          imageUrl={selectedMemberImage.imageUrl}
          name={selectedMemberImage.name}
          subtitle={selectedMemberImage.subtitle}
          onClose={() => setSelectedMemberImage(null)}
        />
      )}
    </div>
  );
}
