"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Plus, ArrowRight, Shield, CheckCircle2, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function TownChaptersBlueprint({ community }) {
  const router = useRouter();
  const { communities = [] } = useAppContext();

  if (!community) return null;

  // Extract base franchise prefix
  const commName = community.name || '';
  const lowerName = commName.toLowerCase();

  let brandPrefix = '';
  if (lowerName.includes('mankind')) {
    brandPrefix = 'mankind';
  } else if (lowerName.includes('walk') || lowerName.includes('rambler')) {
    brandPrefix = 'walk';
  } else if (lowerName.includes('run')) {
    brandPrefix = 'run';
  } else if (lowerName.includes('tech')) {
    brandPrefix = 'tech';
  } else if (lowerName.includes('creative')) {
    brandPrefix = 'creative';
  }

  // Find sister chapters
  const sisterChapters = communities.filter(c => {
    if (c.id === community.id) return false;
    if (community.parent_community_id && c.id === community.parent_community_id) return true;
    if (c.parent_community_id && (c.parent_community_id === community.id || c.parent_community_id === community.parent_community_id)) return true;
    if (brandPrefix && c.name?.toLowerCase().includes(brandPrefix)) return true;
    return false;
  });

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
      border: '1px solid rgba(45, 212, 191, 0.25)',
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
              background: 'rgba(20,184,166,0.15)',
              border: '1px solid rgba(20,184,166,0.3)',
              color: 'var(--teal-300)',
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px'
            }}>
              {sisterChapters.length + 1} Chapters Active
            </span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            Town Chapters of {community.name}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/create-community?chapterOf=${community.id}`)}
          className="interactive-press"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
            border: 'none',
            color: '#090d16',
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

      <div style={{ fontSize: '0.84rem', color: 'var(--slate-300)', lineHeight: 1.5, marginBottom: '16px' }}>
        Want to bring {community.name} to your local village or town? Start an official chapter with verified safety packs, shared branding, and leader onboarding guidance.
      </div>

      {/* Chapters list */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Current Chapter */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(20, 184, 166, 0.2)',
          border: '1.5px solid var(--teal-400)',
          borderRadius: '12px',
          padding: '8px 14px',
          color: '#fff',
          fontSize: '0.84rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={16} color="var(--teal-400)" />
          <span>{community.location_name || 'Tunbridge Wells'} (Current Chapter)</span>
        </div>

        {/* Sister Chapters */}
        {sisterChapters.map(sc => (
          <div
            key={sc.id}
            onClick={() => router.push(`/community/${sc.id}`)}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
