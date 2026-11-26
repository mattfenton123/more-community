"use client";
import { useState, useMemo } from 'react';
import { MapPin, Clock, Star, Users, Search, X, ArrowLeft, Sparkles, Loader2, Calendar, ArrowRight } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { isAffiliateExperience } from '../lib/experiencePricing';
import { getLocationSearchRank } from '../lib/location';

export default function ExperiencesMarketplace() {
  const [activePill, setActivePill] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingViator, setIsSearchingViator] = useState(false);
  const pills = ['All', '🏡 Retreats & Stays', '🏛️ Venues & Halls', '⛰️ Adventure', '🧘 Wellness', '🎭 Culture', '🍷 Food & Drink', '🎨 Creative'];
  const { experiences, setExperiences, communities } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViatorSearch = async (term) => {
    const q = (term || searchQuery).trim();
    if (!q) return;
    setIsSearchingViator(true);
    try {
      const res = await fetch(`/api/experiences/discover?q=${encodeURIComponent(q)}&provider=viator`);
      const result = await res.json();
      if (result.status === 'success' && result.data?.length > 0) {
        if (setExperiences) setExperiences(result.data);
        toast.success(`Found ${result.data.length} experiences`, `Showing live activities for "${q}"`);
      } else {
        toast.info('No direct matches found', `Try searching a town or city name like "London" or "Kent"`);
      }
    } catch (err) {
      toast.error('Search failed', 'Could not load experiences right now. Please try again.');
    } finally {
      setIsSearchingViator(false);
    }
  };

  const filteredExperiences = useMemo(() => {
    let list = experiences || [];
    if (activePill !== 'All') {
      list = list.filter(e => e.category === activePill);
    }
    if (searchQuery.trim() && !isSearchingViator) {
      const q = searchQuery.toLowerCase().trim();
      const ranked = [];
      for (const e of list) {
        const directMatch =
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q);
        if (directMatch) {
          ranked.push({ item: e, rank: 2 });
          continue;
        }
        const rank = getLocationSearchRank(`${e.location || ''} ${e.title || ''}`, q);
        if (rank > 0) {
          ranked.push({ item: e, rank });
        }
      }
      if (ranked.length > 0) {
        ranked.sort((a, b) => b.rank - a.rank);
        return ranked.map((r) => r.item);
      }
    }
    return list;
  }, [experiences, activePill, searchQuery, isSearchingViator]);

  const getCommunityName = (communityId) => {
    const c = communities?.find(c => c.id === communityId);
    return c ? c.name : 'More Community';
  };

  const getTotalPrice = (exp) => {
    if (isAffiliateExperience(exp)) {
      return Math.round(exp.basePrice || 35);
    }
    return Math.round((exp.basePrice || 25) * (1 + (exp.leaderMarkup || 15) / 100));
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--hairline-border)',
        padding: '1rem 1.25rem'
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <button onClick={() => navigate.back()} aria-label="Go back" style={{
              background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border)', color: 'var(--ink-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0
            }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700,
                  color: 'var(--ink-primary)', letterSpacing: '-0.02em', margin: 0
                }}>
                  Experiences
                </h1>
                <span style={{
                  background: 'var(--brand-accent-soft)',
                  border: '1px solid rgba(235, 87, 56, 0.3)',
                  color: 'var(--brand-accent)',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  Live Bookable
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', marginTop: '2px', margin: 0 }}>
                Guided group days out, workshops &amp; retreats with vetted partners
              </p>
            </div>
            <Sparkles size={17} style={{ color: 'var(--brand-accent)', marginLeft: 'auto', flexShrink: 0 }} />
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)',
            borderRadius: '10px', padding: '0.45rem 0.75rem', marginBottom: '0.65rem'
          }}>
            {isSearchingViator ? (
              <Loader2 size={15} className="animate-spin" style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
            ) : (
              <Search size={15} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
            )}
            <input
              type="text" 
              placeholder="Search town, city or activity (Press Enter)..."
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleViatorSearch(searchQuery);
                }
              }}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--ink-primary)', fontSize: '0.84rem', fontFamily: 'var(--font-body)'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} aria-label="Clear search" style={{
                background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer',
                display: 'flex', padding: '2px'
              }}>
                <X size={14} />
              </button>
            )}
            <button 
              onClick={() => handleViatorSearch(searchQuery)}
              disabled={isSearchingViator}
              style={{
                background: 'var(--brand-accent)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '5px 11px',
                borderRadius: '7px',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {pills.map(p => (
              <button key={p} onClick={() => setActivePill(p)} style={{
                fontFamily: 'var(--font-heading)', fontSize: '0.7rem', fontWeight: 700,
                padding: '0.35rem 0.85rem', borderRadius: '100px', whiteSpace: 'nowrap',
                border: '1px solid',
                borderColor: activePill === p ? 'var(--brand-accent)' : 'var(--hairline-border-strong)',
                background: activePill === p ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                color: activePill === p ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em'
              }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Clear distinction banner: Experiences vs Community Events */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '12px 14px',
          borderRadius: '14px',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px', minWidth: 0 }}>
            <Calendar size={17} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--ink-primary)' }}>How this differs from Events:</strong> Experiences are bookable partner outings &amp; retreats you can pitch to your community or book as a group. Looking for regular local club walks &amp; meetups?
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate.push('/events')}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '999px',
              background: 'var(--brand-accent-soft)',
              border: '1px solid rgba(235, 87, 56, 0.3)',
              color: 'var(--brand-accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Browse Club Events <ArrowRight size={13} />
          </button>
        </div>

        {/* Experience Cards */}
        {filteredExperiences.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            color: 'var(--ink-secondary)', fontSize: '0.85rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '16px',
          }}>
            <p style={{ margin: '0 0 12px 0' }}>No experiences found matching this filter.</p>
            <button 
              onClick={() => handleViatorSearch('Tunbridge Wells')}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Reset to Tunbridge Wells &amp; Kent
            </button>
          </div>
        ) : (
          filteredExperiences.map(exp => (
            <div
              key={exp.id}
              onClick={() => navigate.push(`/experiences/${exp.id}`)}
              className="interactive-hover"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '16px', overflow: 'hidden',
                transition: 'all 0.25s', cursor: 'pointer'
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: '168px', overflow: 'hidden' }}>
                <img src={exp.image} alt={exp.title} style={{
                  width: '100%', height: '100%', objectFit: 'cover'
                }} />
                <div style={{
                  position: 'absolute', top: '0.6rem', left: '0.6rem',
                  background: 'rgba(18, 18, 18, 0.82)', backdropFilter: 'blur(8px)',
                  borderRadius: '100px', padding: '0.25rem 0.65rem',
                  fontSize: '0.66rem', fontWeight: 700, color: '#FFFFFF',
                  fontFamily: 'var(--font-heading)', letterSpacing: '0.03em'
                }}>
                  {exp.category}
                </div>
                {exp.provider && (
                  <div style={{
                    position: 'absolute', top: '0.6rem', right: '0.6rem',
                    background: 'rgba(18, 18, 18, 0.82)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '100px', padding: '0.25rem 0.65rem',
                    fontSize: '0.64rem', fontWeight: 700, color: '#E5E7EB',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    {exp.provider}
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '56px',
                  background: 'linear-gradient(transparent, rgba(18, 18, 18, 0.72))'
                }} />
              </div>

              {/* Content */}
              <div style={{ padding: '1rem 1.15rem' }}>
                <h3 style={{
                  fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 700,
                  color: 'var(--ink-primary)', margin: '0 0 0.35rem 0', lineHeight: 1.3
                }}>
                  {exp.title}
                </h3>
                <p style={{
                  fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.5,
                  margin: '0 0 0.75rem 0',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {exp.description}
                </p>

                {/* Meta row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                    <MapPin size={12} /> {exp.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                    <Clock size={12} /> {exp.duration}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#D97706', fontWeight: 600 }}>
                    <Star size={12} fill="currentColor" /> {exp.rating}
                  </div>
                </div>

                {/* Promoted by + Price */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '0.65rem', borderTop: '1px solid var(--hairline-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} style={{ color: 'var(--brand-accent)' }} />
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--ink-muted)',
                      fontFamily: 'var(--font-body)', fontWeight: 600
                    }}>
                      Curated with <span style={{ color: 'var(--brand-accent)' }}>{getCommunityName(exp.promotedBy)}</span>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.08rem',
                      color: 'var(--brand-accent)'
                    }}>
                      {isAffiliateExperience(exp) ? `~£${getTotalPrice(exp)}` : `£${getTotalPrice(exp)}`}
                    </div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--ink-muted)', marginTop: '1px' }}>
                      {isAffiliateExperience(exp) ? 'est. ticket + Host Pass' : 'per person'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Group Getaways Footer Note */}
        <div style={{
          background: 'var(--surface-card)', border: '1px dashed var(--hairline-border-strong)',
          borderRadius: '14px', padding: '1.15rem', textAlign: 'center', marginTop: '0.35rem'
        }}>
          <div style={{
            fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 700,
            color: 'var(--ink-primary)', marginBottom: '0.3rem'
          }}>
            ✦ Want to suggest a group day out or retreat?
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
            Tap any experience above to pitch it as a live poll to your community, or visit the Partner Portal to list a local workshop.
          </p>
        </div>
      </div>
    </div>
  );
}
