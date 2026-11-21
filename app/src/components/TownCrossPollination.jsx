"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Compass, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getCommunitySlug } from '../lib/communityLinks';
import { cleanLocationName } from '../lib/location';
import { isCommunityPubliclyListed } from '../lib/communityVisibility';

export default function TownCrossPollination({ currentCommunity, currentCommunityId, location }) {
  const router = useRouter();
  const { communities = [], communityMemberships = {} } = useAppContext();

  const activeId = currentCommunity?.id || currentCommunityId;
  if (activeId === 'more-leaders-network') return null;

  const displayLocation = cleanLocationName(currentCommunity?.location_name || location) || 'Tunbridge Wells';

  // Pick up to 3 other public active communities (never show private or leaders-only internal groups)
  const otherCommunities = communities
    .filter(c =>
      c.id !== activeId &&
      c.id !== 'more-leaders-network' &&
      !c.is_private &&
      c.visibility !== 'private' &&
      isCommunityPubliclyListed(c)
    )
    .slice(0, 3);

  if (otherCommunities.length === 0) return null;

  return (
    <div style={{
      marginTop: '28px',
      marginBottom: '20px',
      padding: '20px',
      background: 'var(--surface-card)',
      borderRadius: '18px',
      border: '1px solid var(--hairline-border)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={16} color="var(--brand-accent)" /> More in {displayLocation}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '2px' }}>
            Discover other local groups and gatherings nearby
          </div>
        </div>
        <button
          onClick={() => router.push('/discover')}
          style={{ background: 'none', border: 'none', color: 'var(--teal-300)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Explore All <ArrowRight size={12} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {otherCommunities.map(c => {
          const memList = communityMemberships?.[c.id] || [];
          const realCount = Math.max(memList.length, Number(c.members) || 0, c.leader_id ? 1 : 0);
          const slug = getCommunitySlug(c, communities);
          const img = c.image || c.cover_image;

          return (
            <div
              key={c.id}
              onClick={() => router.push(`/community/${slug}`)}
              className="interactive-press"
              style={{
                background: 'var(--surface-canvas)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '14px',
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              {img ? (
                <img
                  src={img}
                  alt={c.name}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--hairline-border)' }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--brand-accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal-300)',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0
                }}>
                  {c.name ? c.name[0] : 'C'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={11} color="var(--brand-accent)" /> {realCount} {realCount === 1 ? 'member' : 'members'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
