"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, UserCheck, AlertTriangle, Search, Megaphone, Star, Shield, MessageCircle, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/Toast';
import ProfileImageModal from './ProfileImageModal';
import { resolveUserAvatar } from '../lib/avatar';

function getMemberStats(member, events, eventRsvps, messages, communityId) {
  let score = 10;
  let meetupsAttended = 0;

  const communityEvents = (events || []).filter(e => e.communityId === communityId && e.status !== 'cancelled' && e.status !== 'proposed');
  communityEvents.forEach(event => {
    const rsvps = eventRsvps?.[event.id] || [];
    const match = rsvps.find(
      r => (r.userId || r.user_id) === member.userId && (r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in)
    );
    if (match) {
      meetupsAttended += 1;
      score += 20;
    }
  });

  const memberMessages = (messages || []).filter(m => m.authorId === member.userId && m.communityId === communityId);
  score += Math.min(memberMessages.length * 5, 40);

  return { score: Math.min(score, 100), meetupsAttended };
}

function getEngagementStatus(score, meetupsAttended) {
  if (meetupsAttended >= 3 || score >= 60) return { label: 'Regular', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', icon: TrendingUp };
  if (meetupsAttended >= 1 || score >= 30) return { label: 'Verified', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)', icon: UserCheck };
  if (score >= 10) return { label: 'New / Quiet', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', icon: TrendingDown };
  return { label: 'Inactive', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', icon: AlertTriangle };
}

export default function MemberCRM({ communityId, onOpenBroadcast }) {
  const router = useRouter();
  const { user: currentUser, users, communityMemberships, events, eventRsvps, promoteMember } = useAppContext();
  const { messages } = useChat();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedMemberImage, setSelectedMemberImage] = useState(null);

  const members = (communityMemberships?.[communityId] || []).map(mem => {
    const u = (users || []).find(usr => usr.id === mem.userId);
    const { score, meetupsAttended } = getMemberStats(mem, events, eventRsvps, messages, communityId);
    const status = getEngagementStatus(score, meetupsAttended);
    return {
      ...mem,
      user: u,
      score,
      meetupsAttended,
      status
    };
  }).filter(m => m.user);

  const sortedMembers = [...members].sort((a, b) => b.meetupsAttended - a.meetupsAttended || b.score - a.score);

  const filteredMembers = sortedMembers.filter(m => {
    if (searchTerm && !m.user.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filter === 'active') return m.meetupsAttended >= 1 || m.status.label === 'Regular' || m.status.label === 'Verified';
    if (filter === 'slipping') return m.meetupsAttended === 0;
    return true;
  });

  const stats = {
    regulars: members.filter(m => m.status.label === 'Regular').length,
    verified: members.filter(m => m.meetupsAttended >= 1).length,
    quiet: members.filter(m => m.meetupsAttended === 0).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-heading)' }}>{stats.regulars}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>Regulars (3+)</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-heading)' }}>{stats.verified}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>Verified Locals</div>
        </div>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-heading)' }}>{stats.quiet}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>Not Attended Yet</div>
        </div>
      </div>

      {/* Single Broadcast Entrypoint */}
      {onOpenBroadcast && (
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 220px' }}>
            <Megaphone size={17} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
              Send targeted announcements to all members, specific event attendees, or selected people in <strong style={{ color: 'var(--ink-primary)' }}>Broadcast</strong>.
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
        {[
          { id: 'all', label: `All (${members.length})` },
          { id: 'active', label: `Verified / Active (${stats.verified})` },
          { id: 'slipping', label: `New / Quiet (${stats.quiet})` },
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className="interactive-press"
            style={{
              padding: '7px 14px', borderRadius: '99px',
              border: filter === f.id ? '1px solid var(--brand-accent)' : '1px solid var(--hairline-border-strong)',
              background: filter === f.id ? 'var(--brand-accent)' : 'var(--surface-card)',
              color: filter === f.id ? '#FFFFFF' : 'var(--ink-secondary)',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search members by name..."
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
          const isSelf = member.userId === currentUser?.id;

          return (
            <div key={member.userId} style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px', minWidth: 0 }}>
                <img
                  src={resolveUserAvatar(member.user)}
                  alt={member.user.name}
                  title="Click to view full photo"
                  onClick={() => setSelectedMemberImage({
                    imageUrl: resolveUserAvatar(member.user),
                    name: member.user.name,
                    subtitle: `${member.role || 'Member'} · ${member.meetupsAttended} meetup${member.meetupsAttended === 1 ? '' : 's'} attended`
                  })}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      onClick={() => router.push(`/profile/${member.userId}`)}
                      style={{ color: 'var(--ink-primary)', fontWeight: 700, fontSize: '0.94rem', cursor: 'pointer' }}
                    >
                      {member.user.name}
                    </span>
                    {member.role === 'Leader' && (
                      <Star size={12} color="#d97706" fill="#d97706" />
                    )}
                    {isCoLeader && (
                      <span style={{ fontSize: '0.64rem', fontWeight: 700, background: 'rgba(124, 58, 237, 0.14)', color: '#7c3aed', padding: '2px 7px', borderRadius: '6px' }}>Co-Leader</span>
                    )}
                    {member.meetupsAttended >= 1 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.64rem', fontWeight: 700, background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', padding: '2px 7px', borderRadius: '999px' }}>
                        <Shield size={10} /> Verified Local
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                    <Calendar size={11} /> {member.meetupsAttended} {member.meetupsAttended === 1 ? 'meetup' : 'meetups'} attended
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => router.push(`/chat/dm/${member.userId}`)}
                    className="interactive-press"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '8px',
                      color: 'var(--ink-primary)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <MessageCircle size={12} /> Message
                  </button>
                )}
                {member.role !== 'Leader' && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const newRole = isCoLeader ? 'Member' : 'Co-Leader';
                      try {
                        await promoteMember(communityId, member.userId, newRole);
                        toast.success(newRole === 'Co-Leader' ? 'Promoted!' : 'Demoted', `${member.user.name} is now a ${newRole}.`);
                      } catch {
                        toast.error('Failed', 'Could not update role.');
                      }
                    }}
                    className="interactive-press"
                    style={{ padding: '6px 10px', background: isCoLeader ? 'rgba(220,38,38,0.08)' : 'rgba(124,58,237,0.1)', border: `1px solid ${isCoLeader ? 'rgba(220,38,38,0.25)' : 'rgba(124,58,237,0.28)'}`, borderRadius: '8px', color: isCoLeader ? '#dc2626' : '#7c3aed', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {isCoLeader ? 'Demote' : 'Make Co-Leader'}
                  </button>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: member.status.bg, color: member.status.color,
                  padding: '5px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700
                }}>
                  <StatusIcon size={12} />
                  {member.status.label}
                </div>
              </div>
            </div>
          );
        })}
        {filteredMembers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-muted)', background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px' }}>
            No members match your filter.
          </div>
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
