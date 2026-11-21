"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Plus, ArrowRight, Shield, CheckCircle2, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getCommunitySlug } from '../lib/communityLinks';
import { cleanLocationName } from '../lib/location';

export default function TownChaptersBlueprint({ community }) {
  const router = useRouter();
  const { communities = [] } = useAppContext();

  if (!community) return null;
  if (community.chapter_status === 'pending_approval' || community.chapter_status === 'declined') return null;
  if (community.allow_chapters === false || community.allowChapters === false) return null;

  const rootCommunityId = community.parent_community_id || community.id;
  const rootCommunity = communities.find(c => c.id === rootCommunityId) || community;

  // Find approved sister chapters strictly by true network lineage (never fuzzy word matching)
  const sisterChapters = communities.filter(c => {
    if (c.id === community.id) return false;
    if (c.chapter_status === 'pending_approval' || c.chapter_status === 'declined' || c.is_banned) return false;
    if (c.id === rootCommunityId) return true;
    if (c.parent_community_id && c.parent_community_id === rootCommunityId) return true;
    return false;
  });

  return (
    <div className="town-chapters-blueprint-card" style={{
      background: 'var(--surface-card)',
      border: '1px solid rgba(242, 114, 87, 0.25)',
      borderRadius: '20px',
      padding: '22px 24px',
      marginBottom: '32px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--teal-300)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Multi-Town Chapter Network
            </span>
            <span style={{
              background: 'rgba(235, 87, 56,0.15)',
              border: '1px solid rgba(235, 87, 56,0.3)',
              color: 'var(--teal-300)',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px'
            }}>
              {sisterChapters.length + 1} Chapters Active
            </span>
          </div>
          <div className="card-heading" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--white)', marginTop: '4px' }}>
            Town Chapters of {rootCommunity.name}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/create-community?chapterOf=${rootCommunityId}`)}
          className="interactive-press"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--brand-accent)',
            border: 'none',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.86rem',
            padding: '10px 18px',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)'
          }}
        >
          <Plus size={16} strokeWidth={3} /> Launch a Chapter in Your Town
        </button>
      </div>

      <div className="card-description" style={{ fontSize: '0.84rem', color: 'var(--slate-300)', lineHeight: 1.5, marginBottom: '16px' }}>
        Want to bring {community.name} to your local village or town? Start an official chapter with verified safety packs, shared branding, and leader onboarding guidance. Chapters keep 90% of local ticket revenue, with applications reviewed by the founding leader before going live.
      </div>

      {/* Chapters list */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Current Chapter */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(235, 87, 56, 0.2)',
          border: '1.5px solid var(--teal-400)',
          borderRadius: '12px',
          padding: '8px 14px',
          color: 'var(--ink-primary)',
          fontSize: '0.84rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={16} color="var(--teal-400)" />
          <span className="current-chapter-text">{cleanLocationName(community.location_name || community.location) || 'Tunbridge Wells'} (Current Chapter)</span>
        </div>

        {/* Sister Chapters */}
        {sisterChapters.map(sc => (
          <div
            key={sc.id}
            onClick={() => router.push(`/community/${getCommunitySlug(sc, communities)}`)}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '12px',
              padding: '8px 14px',
              color: 'var(--slate-200)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <MapPin size={14} color="#7dd3fc" />
            <span>{sc.name}</span>
            <ArrowRight size={12} color="var(--slate-400)" />
          </div>
        ))}
      </div>
    </div>
  );
}
