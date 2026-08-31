"use client";
import { useState, useMemo } from 'react';
import { Compass, Users, MapPin, Search, Calendar, ChevronRight, X, List, Map as MapIcon, Sparkles, BadgeCheck, TrendingUp, Activity, Zap } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { FALLBACK_IMAGES } from '../../src/lib/constants';
import { SkeletonList, SkeletonCard } from '../../src/components/SkeletonCard';
import { useToast } from '../../src/components/Toast';
import dynamic from 'next/dynamic';
const MapView = dynamic(() => import('../../src/components/MapView'), { ssr: false });
import AppHeader from '../../src/components/AppHeader';
import SwipeDiscovery from '../../src/components/SwipeDiscovery';

export default function Discover() {
  const [activePill, setActivePill] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [sortBy, setSortBy] = useState('trending');
  const [showSwipe, setShowSwipe] = useState(false);
  const pills = ['All', 'For You', '🔥 Trending', '🚶 Walking', '🏃 Running', '🧘 Wellness', '⛰️ Adventure', '🤝 Volunteering', '🎨 Creative', '💼 Business'];
  const { communities, user, users, communityMemberships, joinCommunity, isLoading, events } = useAppContext();
    const { messages } = useChat();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Compute activity & trending data for each community
  const enrichedCommunities = useMemo(() => {
    return communities.map(c => {
      const members = (communityMemberships[c.id] || []).length;
      const cEvents = events.filter(e => e.communityId === c.id && e.status !== 'cancelled').length;
      const upcomingEvents = events.filter(e => e.communityId === c.id && e.status !== 'cancelled' && e.date && new Date(e.date + 'T00:00:00') >= new Date()).length;
      const cMessages = messages.filter(m => m.communityId === c.id).length;
      const activityScore = members * 2 + cEvents * 10 + cMessages;
      const activityLevel = activityScore >= 30 ? 'active' : activityScore >= 10 ? 'growing' : 'new';
      return { ...c, memberCount: members, cEvents, upcomingEvents, activityScore, activityLevel };
    });
  }, [communities, communityMemberships, events, messages]);

  // Recommendation Engine
  const getRecommendedCommunities = () => {
    if (!user || !user.interests) return [];
    
    // 1. Find similar users based on shared interests
    const similarUsers = users.filter(u => 
      u.id !== user.id && 
      u.interests?.some(interest => user.interests.includes(interest))
    );

    // 2. Score communities
    const scoredCommunities = communities.map(c => {
      let score = 0;
      
      // Direct interest match (+2 points)
      const matchesInterest = c.tags?.some(tag => user.interests.includes(tag));
      if (matchesInterest) score += 2;

      // Collaborative filtering: similar users joined (+1 point per user)
      const membershipsForCommunity = communityMemberships[c.id] || [];
      const similarUsersJoined = membershipsForCommunity.filter(m => 
        similarUsers.some(su => su.id === m.userId)
      ).length;
      
      score += similarUsersJoined;

      // Bonus text match against user bio (+1 point)
      if (user.bio && c.description?.toLowerCase().includes(user.bio.toLowerCase().split(' ')[0])) {
        score += 1;
      }

      return { ...c, score };
    });

    // Return communities with score > 0, sorted by score descending
    return scoredCommunities.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
  };

  const filteredCommunities = useMemo(() => {
    let list;
    if (activePill === 'For You') {
      list = getRecommendedCommunities();
    } else if (activePill === '🔥 Trending') {
      list = [...enrichedCommunities].sort((a, b) => b.activityScore - a.activityScore);
    } else {
      list = enrichedCommunities.filter(c => {
        if (activePill !== 'All' && c.category !== activePill) return false;
        return true;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.tags?.some(t => t.toLowerCase().includes(q)));
    }
    return list;
  }, [activePill, enrichedCommunities, searchQuery]);

  const getMemberCount = (communityId) => {
    const c = enrichedCommunities.find(ec => ec.id === communityId);
    return c?.memberCount || (communityMemberships[communityId] || []).length || 1;
  };

  const ActivityBadge = ({ level }) => {
    const conf = {
      active: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: '● Active', icon: Zap },
      growing: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: '↑ Growing', icon: TrendingUp },
      new: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: '✦ New', icon: Activity },
    };
    const c = conf[level] || conf.new;
    return <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '3px 8px', borderRadius: '99px', background: c.bg, color: c.color, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>{c.label}</span>;
  };

  const handleJoin = async (communityId, communityName) => {
    await joinCommunity(communityId);
    toast.success('Joined!', `You're now a member of ${communityName}`);
  };

  // Featured community (most members or first one)
  const featuredCommunity = communities.length > 0 ? communities[0] : null;

  return (
    <div className="view-discover" style={{ display: 'flex', flexDirection: 'column', height: viewMode === 'map' ? '100%' : 'auto' }}>
      <AppHeader 
        title="Discover" 
        rightElement={
          <>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewMode('list')}
                className="interactive-press"
                style={{
                  background: viewMode === 'list' ? 'rgba(20,184,166,0.1)' : 'transparent',
                  border: viewMode === 'list' ? '1px solid rgba(20,184,166,0.3)' : '1px solid transparent',
                  borderRadius: '8px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: viewMode === 'list' ? 'var(--teal-400)' : 'var(--slate-400)',
                  transition: 'all 0.2s',
                }}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className="interactive-press"
                style={{
                  background: viewMode === 'map' ? 'rgba(20,184,166,0.1)' : 'transparent',
                  border: viewMode === 'map' ? '1px solid rgba(20,184,166,0.3)' : '1px solid transparent',
                  borderRadius: '8px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: viewMode === 'map' ? 'var(--teal-400)' : 'var(--slate-400)',
                  transition: 'all 0.2s',
                }}
              >
                <MapIcon size={18} />
              </button>
            </div>
            <button onClick={() => navigate.push('/profile')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="Profile" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid var(--slate-700)', objectFit: 'cover' }} />
            </button>
          </>
        }
      />
      
      <div style={{ padding: '20px 20px 10px' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-400)' }}>Local communities in</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px 0' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>Tunbridge Wells, UK</h2>
          <button onClick={() => setShowSwipe(true)} className="interactive-press" style={{ 
            background: 'linear-gradient(135deg, var(--teal-400), var(--teal-600))', 
            border: 'none', color: 'var(--white)', padding: '6px 14px', borderRadius: '99px', 
            fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', 
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,212,191,0.4)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
          }}>
            <Sparkles size={14} /> Find Communities
          </button>
        </div>
        
        <div 
          style={{ 
            background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '999px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', 
            color: 'var(--slate-400)', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)' 
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal-400)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search communities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--white)', outline: 'none', flex: 1, fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div style={{ padding: '10px 20px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollSnapType: 'x mandatory' }} className="hide-scrollbar">
        {pills.map(pill => (
          <button 
            key={pill}
            onClick={() => setActivePill(pill)}
            style={{ 
              whiteSpace: 'nowrap', 
              padding: '8px 16px', 
              borderRadius: '999px',
              border: activePill === pill ? 'none' : '1px solid rgba(255,255,255,0.08)',
              background: activePill === pill ? 'var(--white)' : 'rgba(255,255,255,0.02)',
              color: activePill === pill ? 'var(--slate-900)' : 'var(--slate-300)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              scrollSnapAlign: 'start'
            }}
          >
            {pill}
          </button>
        ))}
      </div>

      {viewMode === 'map' ? (
        /* Map View */
        <div style={{ width: '100%', height: 'calc(100vh - 170px)', position: 'relative' }}>
          <MapView communities={filteredCommunities} />
          <div style={{
            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)',
            padding: '8px 16px', borderRadius: '999px',
            fontSize: '0.8rem', color: 'var(--slate-300)', fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}>
            {filteredCommunities.length} communities near you
          </div>
        </div>
      ) : (
        /* List View */
        <>
          {/* Featured Community Hero */}
          {featuredCommunity && activePill === 'All' && !searchQuery && (
            <div 
              onClick={() => navigate.push('/community/' + featuredCommunity.id)} 
              className="interactive-press stagger-item"
              style={{ margin: '0 20px 20px', borderRadius: '20px', overflow: 'hidden', position: 'relative', height: '220px', cursor: 'pointer' }}
            >
              <img 
                src={featuredCommunity.image || FALLBACK_IMAGES.general} 
                alt={featuredCommunity.name} 
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}></div>
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <span style={{ background: 'var(--teal-500)', color: 'var(--white)', padding: '6px 14px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> Featured Community
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>{featuredCommunity.name}</h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--slate-300)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featuredCommunity.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {getMemberCount(featuredCommunity.id)} members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {featuredCommunity.metrics?.cost || 'Free'}</span>
                </div>
              </div>
            </div>
          )}

          <h2 className="section-title" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, marginTop: '8px' }}>
            {activePill === 'For You' ? 'Recommended for You' : 'Trending near you'}
          </h2>
          
          {activePill === 'For You' && user?.interests?.length > 0 && (
            <div style={{ margin: '0 20px 16px', fontSize: '0.85rem', color: 'var(--teal-400)', background: 'rgba(20,184,166,0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(20,184,166,0.2)' }}>
              Based on your interests and similar users in Tunbridge Wells.
            </div>
          )}
          
          {isLoading ? (
            <SkeletonList count={5} Component={SkeletonCard} />
          ) : (
            <>
              {/* Experiences Marketplace Banner */}
              {activePill === 'All' && (
                <div
                  onClick={() => navigate.push('/experiences')}
                  className="interactive-press"
                  style={{
                    margin: '0 20px 24px', padding: '24px 20px',
                    background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(245, 158, 11, 0.15))',
                    border: '1px solid rgba(45, 212, 191, 0.3)', borderRadius: '24px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem',
                    transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.5)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.3)'; }}
                >
                  <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '150px', height: '150px', background: 'rgba(251,191,36,0.2)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
                  <div style={{ fontSize: '2.2rem', zIndex: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🎯</div>
                  <div style={{ flex: 1, zIndex: 1 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.05rem', fontWeight: 800, color: 'var(--white)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                      Experiences Marketplace
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                      Skydiving, retreats, theatre & more — curated by your community leaders
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, backdropFilter: 'blur(4px)' }}>
                    <ChevronRight size={18} style={{ color: 'var(--white)' }} />
                  </div>
                </div>
              )}
              {filteredCommunities.map((community, index) => {
                const isMember = user.joinedCommunities.includes(community.id);
                const memberCount = getMemberCount(community.id);
                
                return (
                  <div 
                    key={community.id} 
                    className="stagger-item interactive-press" 
                    style={{ margin: '0 20px 16px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s', cursor: 'pointer' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Cover Image */}
                    <div 
                      onClick={() => navigate.push('/community/' + community.id)}
                      style={{ 
                        height: '140px', 
                        background: community.image ? `url(${community.image})` : `linear-gradient(135deg, var(--teal-600), var(--slate-800))`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)' }}></div>
                      {community.category && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--white)' }}>
                          {community.category}
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div onClick={() => navigate.push('/community/' + community.id)} style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--white)' }}>{community.name}</h3>
                            {community.verified && <BadgeCheck size={15} color="#3b82f6" />}
                          </div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--slate-400)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                            {community.description}
                          </p>
                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: 'var(--slate-400)', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={13} color="var(--teal-400)" /> {memberCount}
                            </span>
                            {community.upcomingEvents > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                <Calendar size={13} /> {community.upcomingEvents} upcoming
                              </span>
                            )}
                            <ActivityBadge level={community.activityLevel} />
                          </div>
                        </div>
                        <button 
                          className={`btn ${isMember ? 'btn-outline' : 'btn-primary'} interactive-press`} 
                          onClick={(e) => { e.stopPropagation(); handleJoin(community.id, community.name); }}
                          style={{ padding: '8px 18px', borderRadius: '999px', fontSize: '0.8rem', opacity: isMember ? 0.7 : 1, flexShrink: 0 }}
                          disabled={isMember}
                        >
                          {isMember ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredCommunities.length === 0 && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--slate-400)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--white)', marginBottom: '8px' }}>No communities found</h3>
                  <p style={{ fontSize: '0.9rem' }}>Try a different search or filter.</p>
                </div>
              )}

              {/* Create CTA */}
              <div 
                onClick={() => navigate.push('/dashboard')}
                className="interactive-press"
                style={{ margin: '8px 20px 24px', padding: '20px', border: '1px dashed rgba(20,184,166,0.3)', background: 'rgba(20,184,166,0.03)', borderRadius: '16px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(20,184,166,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(20,184,166,0.03)'}
              >
                <div style={{ fontSize: '0.95rem', color: 'var(--teal-400)', fontWeight: 600, marginBottom: '4px' }}>Don't see your group?</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Start your own community on more.</div>
              </div>
            </>
          )}
        </>
      )}
      {showSwipe && (
        <SwipeDiscovery 
          events={events} 
          communities={communities} 
          onClose={() => setShowSwipe(false)} 
          onSave={(item) => {
            // Already handled in SwipeDiscovery via toast, but could sync to backend here
          }}
        />
      )}
    </div>
  );
}
