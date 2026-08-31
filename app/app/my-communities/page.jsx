"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { Users, Search, Plus } from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { FALLBACK_IMAGES } from '../../src/lib/constants';
import { SkeletonList, SkeletonCommunityCard } from '../../src/components/SkeletonCard';
import CommunityOnboardingFlow from '../../src/views/CommunityOnboardingFlow';

export default function MyCommunities() {
  const { user, communities, isLoading } = useAppContext();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const joined = communities.filter(c => user.joinedCommunities.includes(c.id));

  return (
    <div className="view-communities" style={{ paddingBottom: '80px' }}>
      <AppHeader title="My Communities" />

      <div style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <SkeletonList count={3} Component={SkeletonCommunityCard} />
          </div>
        ) : joined.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--slate-400)' }}>
              <Users size={32} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--white)', marginBottom: '8px' }}>No communities yet</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '24px' }}>Join a community to see it here.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => router.push('/discover')} className="btn btn-primary" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '99px' }}>
                Discover Communities
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                style={{ background: 'transparent', border: '1px solid rgba(20,184,166,0.3)', color: 'var(--teal-400)', padding: '12px 24px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Create a Community
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {joined.map((comm, i) => (
              <div 
                key={comm.id}
                onClick={() => router.push('/community/' + comm.id)}
                className="glass-panel interactive-hover stagger-item"
                style={{ overflow: 'hidden', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ height: '120px', background: `url(${comm.image || FALLBACK_IMAGES.community})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--white)' }}>{comm.name}</h3>
                    <div style={{ fontSize: '0.75rem', background: 'rgba(20,184,166,0.1)', color: 'var(--teal-400)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {comm.category}
                    </div>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--slate-400)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {comm.description}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="var(--slate-500)" />
                      <span style={{ fontWeight: 600 }}>{comm.metrics.members}</span> Members
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button 
                onClick={() => router.push('/discover')}
                className="interactive-press"
                style={{ padding: '20px', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', borderRadius: '16px', color: 'var(--slate-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={20} color="var(--teal-400)" />
                </div>
                <span style={{ fontWeight: 500 }}>Join community</span>
              </button>

              <button 
                onClick={() => setShowCreateModal(true)}
                className="interactive-press"
                style={{ padding: '20px', border: '1px dashed rgba(20,184,166,0.3)', background: 'rgba(20,184,166,0.05)', borderRadius: '16px', color: 'var(--teal-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(20,184,166,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(20,184,166,0.05)'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} color="var(--teal-400)" />
                </div>
                <span style={{ fontWeight: 500 }}>Create new</span>
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
