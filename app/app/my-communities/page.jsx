"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { Users, Search, Plus, Crown, ArrowRight } from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { FALLBACK_IMAGES } from '../../src/lib/constants';
import { SkeletonList, SkeletonCommunityCard } from '../../src/components/SkeletonCard';
import CommunityOnboardingFlow from '../../src/views/CommunityOnboardingFlow';
import { getCommunitySlug } from '../../src/lib/communityLinks';

export default function MyCommunities() {
  const { user, communities, communityMemberships, isLoading } = useAppContext();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const joined = (communities || []).filter(c => Boolean(user?.joinedCommunities?.includes(c.id)));

  const getMemberCount = (comm) => {
    const fromMap = (communityMemberships?.[comm.id] || []).length;
    if (fromMap > 0) return fromMap;
    return comm.metrics?.members ?? comm.members ?? comm.memberCount ?? comm.member_count ?? 1;
  };

  return (
    <div className="view-communities" style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', paddingBottom: '96px' }}>
      <AppHeader title="My Communities" />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <SkeletonList count={3} Component={SkeletonCommunityCard} />
          </div>
        ) : !user ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand-accent)' }}>
              <Users size={32} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)', marginBottom: '8px' }}>Sign in to see your communities</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Log in to view the communities you&apos;ve joined, check in to events, and connect with members.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => router.push('/login?redirect=/my-communities')} className="btn btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '99px', color: '#FFFFFF' }}>
                Sign In
              </button>
              <button onClick={() => router.push('/discover')} style={{ background: 'transparent', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)', padding: '12px 24px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                Explore Communities
              </button>
            </div>
          </div>
        ) : joined.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--ink-muted)' }}>
              <Users size={32} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)', marginBottom: '8px' }}>No communities yet</h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Join a local group to see its events, polls, and updates here.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => router.push('/discover')} className="btn btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '99px', color: '#FFFFFF' }}>
                Discover Communities
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: 'transparent', border: '1px solid rgba(235, 87, 56, 0.4)', color: 'var(--brand-accent)', padding: '12px 24px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Start a Community
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {joined.map((comm) => {
              const memberCount = getMemberCount(comm);
              const isCommLeader = Boolean(
                user?.ledCommunities?.includes(comm.id) ||
                comm.leader_id === user?.id ||
                comm.creator_id === user?.id
              );
              const slug = getCommunitySlug(comm, communities);

              return (
                <div 
                  key={comm.id}
                  onClick={() => router.push(`/community/${slug}`)}
                  className="glass-panel interactive-hover stagger-item"
                  style={{ overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '18px' }}
                >
                  <div style={{ height: '132px', background: `url(${comm.image || comm.cover_image || FALLBACK_IMAGES.community})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {isCommLeader && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(18, 18, 18, 0.82)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}>
                        <Crown size={12} color="#F59E0B" /> You Lead This Group
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--ink-primary)' }}>{comm.name}</h3>
                      {comm.category && (
                        <div style={{ fontSize: '0.74rem', background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)', padding: '4px 9px', borderRadius: '8px', fontWeight: 700, flexShrink: 0 }}>
                          {comm.category}
                        </div>
                      )}
                    </div>
                    <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: 'var(--ink-secondary)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {comm.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>
                        <Users size={14} color="var(--ink-muted)" />
                        <span style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>{memberCount}</span> {memberCount === 1 ? 'Member' : 'Members'}
                      </div>
                      {isCommLeader && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard?community=${comm.id}`);
                          }}
                          className="interactive-press"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: 'var(--brand-accent-soft)',
                            border: '1px solid rgba(235, 87, 56, 0.35)',
                            color: 'var(--brand-accent)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Manage in Dashboard <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <button 
                onClick={() => router.push('/discover')}
                className="interactive-press"
                style={{ padding: '20px', border: '1px dashed var(--hairline-border-strong)', background: 'var(--surface-card)', borderRadius: '16px', color: 'var(--ink-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={20} color="var(--brand-accent)" />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink-primary)' }}>Join a community</span>
              </button>

              <button 
                onClick={() => setShowCreateModal(true)}
                className="interactive-press"
                style={{ padding: '20px', border: '1px dashed rgba(235, 87, 56, 0.4)', background: 'var(--brand-accent-soft)', borderRadius: '16px', color: 'var(--brand-accent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(235, 87, 56, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} color="var(--brand-accent)" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Start new group</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CommunityOnboardingFlow onComplete={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
