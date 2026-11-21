"use client";
import React, { useState, useMemo } from 'react';
import { Shield, CheckCircle2, Ban, Globe, Calendar, Eye, Check, X, Sparkles } from 'lucide-react';
import { useToast } from '../Toast';
import { isCommunityPendingChapter } from '../../lib/communityVisibility';
import { resolveUserAvatar } from '../../lib/avatar';

export default function ModerationQueue({
  users = [],
  communities = [],
  events = [],
  updateUser,
  approveChapter,
  declineChapter,
  navigate,
}) {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all'); // 'all' | 'chapters' | 'suspended' | 'proposals'
  const [busyId, setBusyId] = useState(null);

  const pendingChapters = useMemo(
    () => (communities || []).filter(c => isCommunityPendingChapter(c)),
    [communities]
  );

  const suspendedUsers = useMemo(
    () => (users || []).filter(u => Boolean(u.is_suspended)),
    [users]
  );

  const proposedEvents = useMemo(
    () => (events || []).filter(e => e.status === 'proposed'),
    [events]
  );

  const totalOpenCount = pendingChapters.length + suspendedUsers.length + proposedEvents.length;

  const filterOptions = [
    { id: 'all', label: `All Open (${totalOpenCount})` },
    { id: 'chapters', label: `Pending Chapters (${pendingChapters.length})` },
    { id: 'suspended', label: `Suspended Users (${suspendedUsers.length})` },
    { id: 'proposals', label: `Event Proposals (${proposedEvents.length})` },
  ];

  const handleChapterDecision = async (chapter, approve) => {
    setBusyId(chapter.id);
    try {
      if (approve && approveChapter) {
        await approveChapter(chapter.id);
        toast.success('Chapter Approved', `${chapter.name} is now live in public discovery.`);
      } else if (!approve && declineChapter) {
        await declineChapter(chapter.id);
        toast.info('Chapter Declined', `${chapter.name} has been declined.`);
      }
    } catch (err) {
      toast.error('Action Failed', err?.message || 'Could not update chapter status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnsuspend = async (u) => {
    setBusyId(u.id);
    try {
      await updateUser?.(u.id, { is_suspended: false });
      toast.success('Account Reinstated', `${u.name || 'User'} can now use More Community again.`);
    } catch (err) {
      toast.error('Failed', err?.message || 'Could not reinstate user.');
    } finally {
      setBusyId(null);
    }
  };

  const showChapters = (filter === 'all' || filter === 'chapters') && pendingChapters.length > 0;
  const showSuspended = (filter === 'all' || filter === 'suspended') && suspendedUsers.length > 0;
  const showProposals = (filter === 'all' || filter === 'proposals') && proposedEvents.length > 0;
  const hasVisibleItems = showChapters || showSuspended || showProposals;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--ink-primary)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
            Trust &amp; Safety Queue
          </h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Live pending chapter approvals, suspended accounts, and member event proposals across the platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterOptions.map(opt => {
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className="interactive-press"
                style={{
                  padding: '7px 13px',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? 'var(--ink-primary)' : 'var(--surface-card)',
                  color: active ? 'var(--surface-canvas)' : 'var(--ink-secondary)',
                  border: active ? '1px solid var(--ink-primary)' : '1px solid var(--hairline-border-strong)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {!hasVisibleItems ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
          borderRadius: '18px',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'rgba(22, 163, 74, 0.12)', border: '1px solid rgba(22, 163, 74, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', color: '#16a34a'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.08rem', color: 'var(--ink-primary)', fontFamily: 'var(--font-heading)' }}>
            All Clear — Zero Open Flags
          </h3>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
            There are no pending items in this view right now. Live chapter requests and account actions appear here automatically.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pending Chapters */}
          {showChapters && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Chapter Applications ({pendingChapters.length})
              </div>
              {pendingChapters.map(ch => (
                <div
                  key={ch.id}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border)',
                    borderLeft: '4px solid #D97706',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 240px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Globe size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.94rem' }}>{ch.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                        {ch.location_name || ch.location || 'Local Chapter'} · Hidden from public until approved
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={busyId === ch.id}
                      onClick={() => handleChapterDecision(ch, true)}
                      className="btn btn-primary interactive-press"
                      style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === ch.id}
                      onClick={() => handleChapterDecision(ch, false)}
                      className="interactive-press"
                      style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.28)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Suspended Accounts */}
          {showSuspended && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Suspended User Accounts ({suspendedUsers.length})
              </div>
              {suspendedUsers.map(u => (
                <div
                  key={u.id}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border)',
                    borderLeft: '4px solid #DC2626',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 240px' }}>
                    <img src={resolveUserAvatar(u)} alt={u.name || 'User'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.94rem' }}>{u.name || 'Unnamed User'}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', background: 'rgba(220, 38, 38, 0.14)', color: '#DC2626' }}>
                          SUSPENDED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                        {u.email || 'Account restricted from posting, chat & RSVPs'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {navigate && (
                      <button
                        type="button"
                        onClick={() => navigate.push(`/profile/${u.id}`)}
                        className="interactive-press"
                        style={{ padding: '7px 12px', borderRadius: '9px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--surface-elevated)', color: 'var(--ink-primary)', border: '1px solid var(--hairline-border-strong)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Eye size={13} /> Profile
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => handleUnsuspend(u)}
                      className="interactive-press"
                      style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Shield size={13} /> Reinstate Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Member Event Proposals */}
          {showProposals && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Member Event Proposals Awaiting Leader Review ({proposedEvents.length})
              </div>
              {proposedEvents.map(ev => {
                const comm = (communities || []).find(c => c.id === ev.communityId);
                return (
                  <div
                    key={ev.id}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border)',
                      borderLeft: '4px solid var(--brand-accent)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 240px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.94rem' }}>
                          {(ev.title || '').replace(/^\[Proposal\]\s*/i, '').trim()}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                          {comm?.name || 'Community'} · {ev.date || 'Date TBC'}
                        </div>
                      </div>
                    </div>
                    {navigate && ev.communityId && (
                      <button
                        type="button"
                        onClick={() => navigate.push(`/dashboard?tab=events&community=${ev.communityId}`)}
                        className="interactive-press"
                        style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.78rem', fontWeight: 700, background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)', border: '1px solid rgba(235, 87, 56, 0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Sparkles size={13} /> Open in Leader Events →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
