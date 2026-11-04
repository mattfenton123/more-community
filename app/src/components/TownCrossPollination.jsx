"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Compass, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function TownCrossPollination({ currentCommunityId, location = 'Tunbridge Wells' }) {
  const router = useRouter();
  const { communities = [] } = useAppContext();

  // Pick 2-3 other active communities in the same town
  const otherCommunities = communities
    .filter(c => c.id !== currentCommunityId)
    .slice(0, 3);

  if (otherCommunities.length === 0) return null;

  return (
    <div style={{
      marginTop: '28px',
      marginBottom: '20px',
      padding: '20px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '18px',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={16} color="#2dd4bf" /> More in {location}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '2px' }}>
            Local cross-pollination: members here also participate in these communities
          </div>
        </div>
        <button
          onClick={() => router.push('/discover')}
          style={{ background: 'none', border: 'none', color: '#2dd4bf', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Explore All <ArrowRight size={12} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {otherCommunities.map(c => (
          <div
            key={c.id}
            onClick={() => router.push(`/community/${c.id}`)}
            className="interactive-press"
            style={{
              background: 'rgba(2,6,23,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px',
              padding: '12px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(20,184,166,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2dd4bf',
              fontWeight: 800,
              fontSize: '1rem',
              flexShrink: 0
            }}>
              {c.name ? c.name[0] : 'C'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={11} color="#2dd4bf" /> {c.membersCount || c.members_count || 45} members
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
