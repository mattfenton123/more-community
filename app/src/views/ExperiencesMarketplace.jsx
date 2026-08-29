"use client";
import { useState, useMemo } from 'react';
import { MapPin, Clock, Star, Users, ChevronRight, Search, X, ArrowLeft, Sparkles } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

export default function ExperiencesMarketplace() {
  const [activePill, setActivePill] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExp, setSelectedExp] = useState(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const pills = ['All', '⛰️ Adventure', '🧘 Wellness', '🎭 Culture', '🍷 Food & Drink', '🎨 Creative'];
  const { experiences, communities, user, createEvent } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredExperiences = useMemo(() => {
    let list = experiences || [];
    if (activePill !== 'All') {
      list = list.filter(e => e.category === activePill);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [experiences, activePill, searchQuery]);

  const getCommunityName = (communityId) => {
    const c = communities.find(c => c.id === communityId);
    return c ? c.name : 'A community leader';
  };

  const getTotalPrice = (exp) => {
    return Math.round(exp.basePrice * (1 + exp.leaderMarkup / 100));
  };

  const handlePromote = async () => {
    if (!user.leaderOf) {
      toast.error('Permission Denied', 'You must be a community leader to promote experiences.');
      return;
    }
    setIsPromoting(true);
    try {
      const newEvent = {
        title: selectedExp.title,
        description: selectedExp.description + `\n\nProvider: ${selectedExp.provider}`,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        time: '10:00 AM',
        location: selectedExp.location,
        image: selectedExp.image,
        communityId: user.leaderOf,
        status: 'published',
        maxCapacity: selectedExp.spotsLeft || 20,
        ticketPrice: Math.round(selectedExp.basePrice * (1 + selectedExp.leaderMarkup / 100))
      };
      await createEvent(newEvent);
      toast.success('Promoted!', `${selectedExp.title} added to your community events.`);
      setSelectedExp(null);
    } catch (err) {
      toast.error('Error', 'Failed to promote experience.');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '1rem 1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <button onClick={() => navigate.back()} style={{
            background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', padding: '4px'
          }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', fontWeight: 700,
              color: 'var(--white)', letterSpacing: '-0.02em'
            }}>
              Experiences
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: '2px' }}>
              Curated by your community leaders
            </p>
          </div>
          <Sparkles size={16} style={{ color: 'var(--amber-400)', marginLeft: 'auto' }} />
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', padding: '0.55rem 0.85rem', marginBottom: '0.65rem'
        }}>
          <Search size={15} style={{ color: 'var(--slate-500)', flexShrink: 0 }} />
          <input
            type="text" placeholder="Search experiences..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--white)', fontSize: '0.82rem', fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer',
              display: 'flex', padding: '2px'
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {pills.map(p => (
            <button key={p} onClick={() => setActivePill(p)} style={{
              fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700,
              padding: '0.35rem 0.85rem', borderRadius: '100px', whiteSpace: 'nowrap',
              border: '1px solid',
              borderColor: activePill === p ? 'var(--teal-400)' : 'rgba(255,255,255,0.08)',
              background: activePill === p ? 'rgba(45,212,191,0.12)' : 'rgba(255,255,255,0.03)',
              color: activePill === p ? 'var(--teal-300)' : 'var(--slate-400)',
              cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em'
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Experience Cards */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredExperiences.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            color: 'var(--slate-500)', fontSize: '0.85rem'
          }}>
            No experiences found. Try a different filter.
          </div>
        ) : (
          filteredExperiences.map(exp => (
            <div key={exp.id} onClick={() => setSelectedExp(exp)} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', overflow: 'hidden',
              transition: 'all 0.3s', cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(45,212,191,0.04)';
              e.currentTarget.style.borderColor = 'rgba(45,212,191,0.18)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              {/* Image */}
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                <img src={exp.image} alt={exp.title} style={{
                  width: '100%', height: '100%', objectFit: 'cover'
                }} />
                <div style={{
                  position: 'absolute', top: '0.6rem', left: '0.6rem',
                  background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)',
                  borderRadius: '100px', padding: '0.25rem 0.65rem',
                  fontSize: '0.65rem', fontWeight: 700, color: 'var(--teal-300)',
                  fontFamily: "'Syne', sans-serif", letterSpacing: '0.03em'
                }}>
                  {exp.category}
                </div>
                {exp.spotsLeft <= 6 && (
                  <div style={{
                    position: 'absolute', top: '0.6rem', right: '0.6rem',
                    background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)',
                    borderRadius: '100px', padding: '0.25rem 0.65rem',
                    fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                    fontFamily: "'Syne', sans-serif"
                  }}>
                    {exp.spotsLeft} spots left
                  </div>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                  background: 'linear-gradient(transparent, rgba(2,6,23,0.9))'
                }} />
              </div>

              {/* Content */}
              <div style={{ padding: '1rem 1.1rem' }}>
                <h3 style={{
                  fontFamily: "'Syne', sans-serif", fontSize: '0.9rem', fontWeight: 700,
                  color: 'var(--white)', marginBottom: '0.35rem', lineHeight: 1.3
                }}>
                  {exp.title}
                </h3>
                <p style={{
                  fontSize: '0.75rem', color: 'var(--slate-400)', lineHeight: 1.55,
                  marginBottom: '0.75rem',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {exp.description}
                </p>

                {/* Meta row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    <MapPin size={12} /> {exp.location}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    <Clock size={12} /> {exp.duration}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--amber-400)' }}>
                    <Star size={12} fill="currentColor" /> {exp.rating}
                  </div>
                </div>

                {/* Promoted by + Price */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} style={{ color: 'var(--teal-400)' }} />
                    <span style={{
                      fontSize: '0.68rem', color: 'var(--slate-500)',
                      fontFamily: "'Syne', sans-serif", fontWeight: 600
                    }}>
                      Promoted by <span style={{ color: 'var(--teal-300)' }}>{getCommunityName(exp.promotedBy)}</span>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.05rem',
                      background: 'linear-gradient(135deg, var(--teal-400), var(--amber-400))',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      £{getTotalPrice(exp)}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--slate-600)', marginTop: '1px' }}>
                      per person
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Year 2 teaser */}
        <div style={{
          background: 'rgba(251,191,36,0.04)', border: '1px dashed rgba(251,191,36,0.2)',
          borderRadius: '14px', padding: '1.25rem', textAlign: 'center', marginTop: '0.5rem'
        }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontSize: '0.75rem', fontWeight: 700,
            color: 'var(--amber-400)', marginBottom: '0.35rem'
          }}>
            ✦ Multi-Day Packages Coming Soon
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--slate-500)', lineHeight: 1.55 }}>
            Weekend retreats, adventure trips and group getaways — launching 2027.
          </p>
        </div>
      </div>

      {/* Experience Modal */}
      {selectedExp && (
        <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal-content" style={{ borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.2rem' }}>Experience Details</h2>
              <button onClick={() => setSelectedExp(null)} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            
            <img src={selectedExp.image} alt={selectedExp.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }} />
            
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '8px' }}>{selectedExp.title}</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>{selectedExp.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.85rem', color: 'var(--slate-300)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> {selectedExp.location}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> {selectedExp.duration}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Provider: {selectedExp.provider}</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Member Price</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>£{getTotalPrice(selectedExp)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)' }}>Your Commission</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--teal-300)' }}>{selectedExp.leaderMarkup}%</div>
              </div>
            </div>
            
            <button 
              onClick={handlePromote} 
              disabled={isPromoting || !user.leaderOf}
              className="btn btn-primary interactive-press" 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (!user.leaderOf || isPromoting) ? 0.5 : 1 }}
            >
              {isPromoting ? 'Promoting...' : <><Sparkles size={18} /> Promote to Community</>}
            </button>
            {!user.leaderOf && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--rose-400)', marginTop: '12px' }}>
                You must be a community leader to promote experiences.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
