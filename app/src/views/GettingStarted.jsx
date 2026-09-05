"use client";
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { Compass, Users, MapPin, Check, ArrowRight, Sparkles, Activity } from 'lucide-react';
import { FALLBACK_IMAGES } from '../lib/constants';

export default function GettingStarted() {
  const { user, communities, users, communityMemberships, joinCommunity, events } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const [joiningId, setJoiningId] = useState(null);
  const [justJoined, setJustJoined] = useState([]);

  // Recommendation engine (mirrors Discover's logic)
  const recommended = useMemo(() => {
    if (!user || !user.interests || user.interests.length === 0) {
      // If no interests, just return all communities sorted by member count
      return communities
        .filter(c => c.id !== 'more-leaders-network')
        .sort((a, b) => (b.members || 0) - (a.members || 0));
    }

    const similarUsers = users.filter(u =>
      u.id !== user.id &&
      u.interests?.some(interest => user.interests.includes(interest))
    );

    const scored = communities
      .filter(c => c.id !== 'more-leaders-network')
      .map(c => {
        let score = 0;

        // Direct interest match via tags (+3 points)
        const matchingTags = (c.tags || []).filter(tag => {
          return user.interests.some(interest => {
            const cleanInterest = interest.split(' ').slice(1).join(' ').toLowerCase();
            return tag.toLowerCase().includes(cleanInterest) || cleanInterest.includes(tag.toLowerCase());
          });
        });
        score += matchingTags.length * 3;

        // Category match (+2 points)
        if (c.category) {
          const catMatch = user.interests.some(interest => {
            const cleanInterest = interest.split(' ').slice(1).join(' ').toLowerCase();
            return c.category.toLowerCase().includes(cleanInterest);
          });
          if (catMatch) score += 2;
        }

        // Description keyword match (+1 point)
        if (c.description) {
          const descLower = c.description.toLowerCase();
          user.interests.forEach(interest => {
            const cleanInterest = interest.split(' ').slice(1).join(' ').toLowerCase();
            if (descLower.includes(cleanInterest)) score += 1;
          });
        }

        // Collaborative filtering (+1 per similar user)
        const memberships = communityMemberships[c.id] || [];
        const similarJoined = memberships.filter(m =>
          similarUsers.some(su => su.id === m.userId)
        ).length;
        score += similarJoined;

        // Activity bonus
        const communityEvents = events.filter(e => e.communityId === c.id).length;
        if (communityEvents > 0) score += 1;

        return { ...c, score, matchingTags };
      });

    // Sort by score descending, then by member count
    return scored.sort((a, b) => b.score - a.score || (b.members || 0) - (a.members || 0));
  }, [user, communities, users, communityMemberships, events]);

  const handleJoin = async (communityId) => {
    setJoiningId(communityId);
    try {
      await joinCommunity(communityId);
      setJustJoined(prev => [...prev, communityId]);
      const comm = communities.find(c => c.id === communityId);
      toast.success('Joined!', `You're now a member of ${comm?.name}`);
    } catch (err) {
      toast.error('Error', err.message);
    }
    setJoiningId(null);
  };

  const getMemberCount = (communityId) => {
    const c = communities.find(cc => cc.id === communityId);
    return c?.members || (communityMemberships[communityId] || []).length || 1;
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--slate-950)',
      paddingBottom: '100px',
    }}>
      {/* Hero */}
      <div style={{
        padding: '48px 24px 32px',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, rgba(20,184,166,0.08), transparent)',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '1.8rem',
        }}>
          <Sparkles size={28} color="var(--teal-400)" />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--white)',
          margin: '0 0 12px 0',
          lineHeight: 1.15,
        }}>
          Let's find your community
        </h1>
        <p style={{
          color: 'var(--slate-400)',
          fontSize: '1rem',
          margin: '0 auto',
          maxWidth: '320px',
          lineHeight: 1.5,
        }}>
          Based on your interests, here are communities we think you'll love. Tap to join!
        </p>

        {user?.interests?.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px',
            marginTop: '20px',
          }}>
            {user.interests.map(interest => (
              <span key={interest} style={{
                padding: '6px 14px', borderRadius: '999px',
                background: 'rgba(20,184,166,0.1)',
                border: '1px solid rgba(20,184,166,0.2)',
                color: 'var(--teal-300)', fontSize: '0.8rem', fontWeight: 500,
              }}>
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Communities */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.2rem',
            color: 'var(--white)', margin: 0,
          }}>
            Recommended for you
          </h2>
          <span style={{
            fontSize: '0.8rem', color: 'var(--slate-500)',
          }}>
            {recommended.length} communities
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recommended.slice(0, 8).map((comm, index) => {
            const isJoined = justJoined.includes(comm.id);
            const isJoining = joiningId === comm.id;
            const memberCount = getMemberCount(comm.id);

            return (
              <div
                key={comm.id}
                style={{
                  background: isJoined
                    ? 'rgba(20,184,166,0.06)'
                    : 'rgba(255,255,255,0.03)',
                  border: isJoined
                    ? '1px solid rgba(20,184,166,0.25)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.4s ease ${index * 0.06}s both`,
                }}
              >
                {/* Cover image */}
                <div
                  onClick={() => router.push(`/community/${comm.id}`)}
                  style={{
                    height: '140px',
                    background: `url(${comm.image || comm.cover_image || FALLBACK_IMAGES.community})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    position: 'relative', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 30%, rgba(15,23,42,0.95))',
                  }} />
                  {/* Score badge */}
                  {comm.score > 0 && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      background: 'rgba(20,184,166,0.85)', backdropFilter: 'blur(8px)',
                      padding: '4px 10px', borderRadius: '99px',
                      fontSize: '0.7rem', fontWeight: 700, color: 'var(--white)',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Sparkles size={12} /> Great match
                    </div>
                  )}
                  {/* Community name overlay */}
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                    <h3 style={{
                      margin: 0, fontFamily: 'var(--font-heading)',
                      fontSize: '1.3rem', color: 'var(--white)', fontWeight: 700,
                    }}>
                      {comm.name}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '16px' }}>
                  <p style={{
                    margin: '0 0 12px 0', fontSize: '0.88rem',
                    color: 'var(--slate-400)', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {comm.description}
                  </p>

                  {/* Meta */}
                  <div style={{
                    display: 'flex', gap: '16px', marginBottom: '14px',
                    fontSize: '0.8rem', color: 'var(--slate-400)',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} color="var(--slate-500)" /> {memberCount} members
                    </span>
                    {comm.location_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="var(--slate-500)" /> {comm.location_name}
                      </span>
                    )}
                    {comm.activity_level && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity size={14} color="var(--teal-500)" /> {comm.activity_level}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {comm.tags && comm.tags.length > 0 && (
                    <div style={{
                      display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px',
                    }}>
                      {comm.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--slate-400)',
                          padding: '3px 8px', borderRadius: '6px',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Join CTA */}
                  {isJoined ? (
                    <div style={{
                      width: '100%', padding: '12px', borderRadius: '12px',
                      background: 'rgba(20,184,166,0.1)',
                      border: '1px solid rgba(20,184,166,0.2)',
                      color: 'var(--teal-400)', fontWeight: 600, fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}>
                      <Check size={18} /> Joined!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(comm.id)}
                      disabled={isJoining}
                      className="btn btn-primary interactive-press"
                      style={{
                        width: '100%', padding: '12px', borderRadius: '12px',
                        fontSize: '0.9rem', fontWeight: 600,
                        opacity: isJoining ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}
                    >
                      {isJoining ? 'Joining...' : 'Join Community'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Browse all link */}
        <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '20px' }}>
          <button
            onClick={() => router.push('/discover')}
            className="interactive-press"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--slate-300)',
              padding: '14px 32px', borderRadius: '14px',
              fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Compass size={18} color="var(--teal-400)" />
            Browse All Communities
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
