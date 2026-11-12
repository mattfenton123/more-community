"use client";
import React, { useState, useMemo } from 'react';
import { 
  Users, MapPin, Calendar, Store, Coffee, Paintbrush, Dumbbell, 
  Stethoscope, Briefcase, Heart, Sparkles, Search, ArrowRight, 
  Check, CheckCircle2, Shield, Filter, ChevronRight, X 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { matchCommunityLocation, UK_REGIONAL_CATCHMENTS } from '../lib/location';
import { useToast } from '../components/Toast';
import CommunityPartnerModal from '../components/CommunityPartnerModal';
import Link from 'next/link';
import AppHeader from '../components/AppHeader';

const NICHE_CATEGORIES = [
  { id: 'All', label: 'All Niches', icon: Sparkles },
  { id: 'Dogs', label: '🐕 Dogs & Pets', match: ['Dog Walking', 'Pets'] },
  { id: 'Running', label: '🏃 Running & Athletics', match: ['Running', 'Athletics', 'Fitness'] },
  { id: 'Walking', label: '🚶 Walking & Hiking', match: ['Walking', 'Hiking', 'Adventure'] },
  { id: 'Wellness', label: '🧘 Wellness & Yoga', match: ['Wellness', 'Yoga', 'Mental Health'] },
  { id: 'Creative', label: '🎨 Creative & Arts', match: ['Creative', 'Art', 'Photography', 'Craft'] },
  { id: 'Social', label: '☕ Food & Social', match: ['Food & Drink', 'Social', 'Book Club', 'Coffee'] }
];

export default function PartnerHub() {
  const { communities, user } = useAppContext();
  const { toast } = useToast();

  const [partnerType, setPartnerType] = useState('all'); // 'all' | 'instructor' | 'business'
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [activePartnerCommunity, setActivePartnerCommunity] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('session');

  // Multi-club sponsor selection state
  const [selectedClubIds, setSelectedClubIds] = useState([]);
  const [isMultiSponsorOpen, setIsMultiSponsorOpen] = useState(false);

  // Filter welcoming communities
  const availableCommunities = useMemo(() => {
    return (communities || []).filter(c => c.accepts_pitches !== false);
  }, [communities]);

  // Filter based on niche, broad region catchment, and search terms
  const filteredCommunities = useMemo(() => {
    return availableCommunities.filter(comm => {
      // Niche filter
      if (selectedNiche !== 'All') {
        const nicheDef = NICHE_CATEGORIES.find(n => n.id === selectedNiche);
        if (nicheDef && nicheDef.match) {
          const categoryStr = (comm.category || '') + ' ' + (comm.name || '') + ' ' + (comm.description || '');
          const hasMatch = nicheDef.match.some(m => categoryStr.toLowerCase().includes(m.toLowerCase()));
          if (!hasMatch) return false;
        }
      }

      // Regional Preset filter
      if (selectedRegion !== 'All Regions') {
        const regionQuery = selectedRegion === 'South East (All)' ? 'south east' : selectedRegion;
        if (!matchCommunityLocation(comm, regionQuery)) return false;
      }

      // Broad location and catchment search
      if (locationSearch.trim()) {
        if (!matchCommunityLocation(comm, locationSearch.trim())) return false;
      }

      return true;
    });
  }, [availableCommunities, selectedNiche, selectedRegion, locationSearch]);

  const toggleClubSelection = (clubId) => {
    setSelectedClubIds(prev => 
      prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
    );
  };

  const selectedClubs = useMemo(() => {
    return (communities || []).filter(c => selectedClubIds.includes(c.id));
  }, [communities, selectedClubIds]);

  const combinedAudience = useMemo(() => {
    return selectedClubs.reduce((acc, c) => acc + (c.members ?? c.member_count ?? c.members_count ?? 1), 0);
  }, [selectedClubs]);

  const openPitchModal = (community, tab = 'session') => {
    setActivePartnerCommunity(community);
    setActiveModalTab(tab);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', color: 'var(--white)', paddingBottom: '90px' }}>
      <AppHeader title="Partner & Sponsor Hub" showBack />

      {/* Hero Header */}
      <div style={{
        padding: '24px 20px 20px',
        background: 'linear-gradient(180deg, rgba(20, 184, 166, 0.12) 0%, rgba(15, 23, 42, 0) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', color: 'var(--teal-300)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '10px' }}>
            <Sparkles size={12} /> Local Community Collaborations
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
            Partner with Local Communities
          </h1>
          <p style={{ color: 'var(--slate-300)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0, maxWidth: '620px' }}>
            Connect with active real-world clubs in your town. Pitch a guest session, host an in-person workshop, or sponsor a club with an exclusive member perk.
          </p>

          {/* Quick Stats Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginTop: '20px'
          }}>
            <div className="glass-panel" style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Active Welcoming Groups</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--teal-300)', marginTop: '2px' }}>{availableCommunities.length}</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Club Fundraising Split</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>80% to Leaders</div>
            </div>
            <div className="glass-panel" style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Leader Anti-Spam</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>Single-Tap Review</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 20px 0' }}>
        {/* Search & Catchment Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
            <input
              type="text"
              placeholder="Search by town (e.g. Heathfield, St Leonards) or region (Kent, South East, Sussex)..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px 11px 36px',
                borderRadius: '12px',
                background: "var(--slate-900)", border: "1px solid var(--slate-800)", color: "var(--white)",
                fontSize: '0.88rem'
              }}
            />
          </div>
        </div>

        {/* Regional Quick Filter Catchment Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px', WebkitOverflowScrolling: 'touch' }}>
          {['All Regions', 'South East (All)', 'Kent', 'East Sussex', 'London'].map(reg => {
            const isSelected = selectedRegion === reg;
            const matchCount = reg === 'All Regions' 
              ? availableCommunities.length 
              : availableCommunities.filter(c => matchCommunityLocation(c, reg === 'South East (All)' ? 'south east' : reg)).length;
            return (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '99px',
                  background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#38bdf8' : 'var(--slate-300)',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{reg}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '10px' }}>
                  {matchCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Niche Category Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {NICHE_CATEGORIES.map(niche => {
            const isSelected = selectedNiche === niche.id;
            return (
              <button
                key={niche.id}
                type="button"
                onClick={() => setSelectedNiche(niche.id)}
                className="interactive-press"
                style={{
                  padding: '8px 14px',
                  borderRadius: '99px',
                  border: isSelected ? '1px solid var(--teal-500)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(20, 184, 166, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? 'var(--teal-300)' : 'var(--slate-300)',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {niche.label}
              </button>
            );
          })}
        </div>

        {/* Multi-Club Sponsor Floating Action Bar if clubs are checked */}
        {selectedClubIds.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(20, 184, 166, 0.12) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--white)' }}>
                {selectedClubIds.length} Local Communities Selected
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                Total Audience: <strong>{combinedAudience} active members</strong> • Bundle: £{selectedClubIds.length * 15}/mo (£{selectedClubIds.length * 12}/mo directly to leaders)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--teal-300)', marginTop: '4px' }}>
                💡 Multi-club bundles apply to Monthly Sponsorship. Guest workshops & sessions are pitched 1-on-1 to keep leader inboxes spam-free.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedClubIds([])}
                className="interactive-press"
                style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.08)', border: 'none', color: 'var(--slate-300)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedClubs.length > 0) {
                    openPitchModal(selectedClubs[0], 'sponsor');
                  }
                }}
                className="btn btn-primary interactive-press"
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
              >
                Sponsor All Selected →
              </button>
            </div>
          </div>
        )}

        {/* Catchment Header & Regional Bundle Select */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.84rem', color: 'var(--slate-300)', fontWeight: 600 }}>
            {filteredCommunities.length} {filteredCommunities.length === 1 ? 'Community' : 'Communities'} in Catchment
          </div>
          {filteredCommunities.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const allIds = filteredCommunities.map(c => c.id);
                const allSelected = allIds.every(id => selectedClubIds.includes(id));
                if (allSelected) {
                  setSelectedClubIds(prev => prev.filter(id => !allIds.includes(id)));
                } else {
                  setSelectedClubIds(prev => Array.from(new Set([...prev, ...allIds])));
                }
              }}
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '8px',
                padding: '5px 12px',
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {filteredCommunities.every(c => selectedClubIds.includes(c.id))
                ? 'Deselect All in Catchment'
                : '+ Select All ' + filteredCommunities.length + ' for Regional Sponsorship'}
            </button>
          )}
        </div>

        {/* Community List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredCommunities.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)' }}>No communities found</div>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                Try selecting "All Niches" or clearing your location search.
              </p>
            </div>
          ) : (
            filteredCommunities.map(comm => {
              const isSelected = selectedClubIds.includes(comm.id);
              const memberCount = comm.members ?? comm.member_count ?? comm.members_count ?? 1;

              return (
                <div
                  key={comm.id}
                  style={{
                    background: isSelected ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <img
                        src={comm.image || comm.cover_image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=120&q=80'}
                        alt={comm.name}
                        style={{ width: '56px', height: '56px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
                            {comm.name}
                          </h3>
                          <span style={{ fontSize: '0.68rem', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--teal-300)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                            {comm.category || 'Community'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="var(--teal-400)" />
                            {comm.location_name || comm.city || 'Local Area'}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} />
                            {memberCount} members
                          </span>
                        </div>

                        {comm.description && (
                          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {comm.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Multi-sponsor checkbox */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0, padding: '4px 8px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleClubSelection(comm.id)}
                        style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--slate-300)' }}>Select</span>
                    </label>
                  </div>

                  {/* Actions for this club */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => openPitchModal(comm, 'session')}
                      className="interactive-press"
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(20, 184, 166, 0.1)',
                        border: '1px solid rgba(45, 212, 191, 0.3)',
                        color: 'var(--teal-300)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Calendar size={14} />
                      Host Guest Session
                    </button>

                    <button
                      type="button"
                      onClick={() => openPitchModal(comm, 'sponsor')}
                      className="interactive-press"
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        color: '#fbbf24',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Store size={14} />
                      Sponsor Club (£15/mo)
                    </button>

                    <Link
                      href={'/community/' + comm.id}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--slate-300)',
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      View Club <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Unified Pitch Modal Mounted */}
      {activePartnerCommunity && (
        <CommunityPartnerModal
          isOpen={Boolean(activePartnerCommunity)}
          onClose={() => setActivePartnerCommunity(null)}
          community={activePartnerCommunity}
          initialTab={activeModalTab}
        />
      )}
    </div>
  );
}
