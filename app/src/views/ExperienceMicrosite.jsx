"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter as useNavigate } from 'next/navigation';
import { MapPin, Clock, Users, ArrowLeft, Share2, Star, Sparkles, Calendar, Check, ExternalLink, Loader2, Vote, MessageCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import HostExperienceModal from '../components/HostExperienceModal';
import PitchExperienceModal from '../components/PitchExperienceModal';
import EventCreatedShareModal from '../components/EventCreatedShareModal';

export default function ExperienceMicrosite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { experiences, communities, user, createEvent, events, createPoll } = useAppContext();
  const { toast } = useToast();
  const [showHostModal, setShowHostModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [singleExp, setSingleExp] = useState(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);

  const experience = experiences?.find(e => e.id === id || e.productCode === id) || singleExp;

  useEffect(() => {
    if (!experience && id) {
      setIsLoadingSingle(true);
      fetch(`/api/experiences/discover?code=${id}&provider=viator`)
        .then(r => r.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            setSingleExp(data.data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingSingle(false));
    }
  }, [id, experience]);

  if (isLoadingSingle) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--slate-950)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--teal-400)' }} />
          <div style={{ color: 'var(--slate-400)', fontSize: '0.9rem', fontFamily: "'Syne', sans-serif" }}>Loading experience details...</div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--white)', minHeight: '100dvh', background: 'var(--slate-950)' }}>
        <h2>Experience not found</h2>
        <p style={{ color: 'var(--slate-400)', marginTop: '8px' }}>This experience may no longer be available.</p>
        <button onClick={() => navigate.push('/experiences')} className="btn btn-outline" style={{ marginTop: '20px' }}>
          Browse All Experiences
        </button>
      </div>
    );
  }

  const getTotalPrice = (exp) => {
    return Math.round((exp.basePrice || 25) * (1 + (exp.leaderMarkup || 15) / 100));
  };

  const isLeader = user?.ledCommunities?.length > 0;

  const handlePitchSubmit = async (data) => {
    if (createPoll) {
      await createPoll(data.communityId, data.question, data.options);
    }
  };

  const handleHostSubmit = async (data) => {
    setShowHostModal(false);
    try {
      const metadata = {
        isExperience: true,
        baseExperienceId: experience.id,
        nonMemberPrice: data.nonMemberPrice
      };
      
      const newEvent = {
        title: experience.title,
        description: experience.description + `\n\nProvider: ${experience.provider}\n<!--META:${JSON.stringify(metadata)}-->`,
        date: data.date,
        time: data.time,
        location: experience.location,
        image: experience.image,
        communityId: data.communityId,
        status: data.isPublic ? 'published' : 'private',
        maxCapacity: data.maxCapacity,
        ticketPrice: data.memberPrice,
        nonMemberPrice: data.nonMemberPrice,
        isExperience: true,
        baseExperienceId: experience.id
      };
      const created = await createEvent(data.communityId, newEvent);
      setCreatedEvent({ ...newEvent, id: created?.id || `ev-${Date.now()}` });
      toast.success('Experience Hosted!', `${experience.title} added to your community events.`);
    } catch (err) {
      toast.error('Error', 'Failed to host experience.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: experience.title,
        text: `Check out this experience: ${experience.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link Copied', 'Copied to clipboard');
    }
  };

  const communityEvents = (events || []).filter(ev => {
    if (ev.title === experience.title) return true;
    if (ev.description && ev.description.includes(`"baseExperienceId":"${experience.id}"`)) return true;
    return false;
  });

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--slate-950)', color: 'var(--white)', paddingBottom: '120px' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', height: '350px' }}>
        <img src={experience.image} alt={experience.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: 'linear-gradient(to top, var(--slate-950), transparent)' }} />
        
        {/* Top Bar Actions */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
          <button onClick={() => navigate.back()} className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <button onClick={handleShare} className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Share2 size={20} />
          </button>
        </div>

        {/* Category Pill */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(45,212,191,0.2)', border: '1px solid rgba(45,212,191,0.4)', color: 'var(--teal-300)', padding: '6px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
          {experience.category}
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', lineHeight: 1.2, margin: '16px 0 12px', color: 'var(--white)' }}>
          {experience.title}
        </h1>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber-400)', fontSize: '0.9rem', fontWeight: 600 }}>
            <Star size={16} fill="currentColor" /> {experience.rating} {experience.reviewsCount ? `(${experience.reviewsCount} reviews)` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
            <MapPin size={16} /> {experience.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
            <Clock size={16} /> {experience.duration}
          </div>
        </div>

        {/* Provider Box */}
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--slate-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="var(--teal-400)" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Partner Provider</div>
                <div style={{ fontSize: '1rem', color: 'var(--white)', fontWeight: 600 }}>{experience.provider}</div>
              </div>
            </div>
            {experience.productUrl && (
              <a 
                href={experience.productUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--teal-400)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
              >
                Viator Partner <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />
          <p style={{ color: 'var(--slate-300)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
            {experience.description}
          </p>
        </div>

        {/* Inclusions if present */}
        {experience.inclusions && experience.inclusions.length > 0 && (
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              What&apos;s Included
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {experience.inclusions.map((inc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--slate-300)' }}>
                  <Check size={14} color="var(--teal-400)" style={{ flexShrink: 0 }} />
                  <span>{inc.otherDescription || inc.typeDescription || inc.categoryDescription}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEADER VIEW: Transparent Pricing Breakdown & 2-Step Actions */}
        {isLeader && (
          <div style={{ padding: '24px', background: 'linear-gradient(to right, rgba(45,212,191,0.05), rgba(59,130,246,0.05))', borderRadius: '16px', border: '1px solid rgba(45,212,191,0.2)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} color="var(--teal-400)" />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--teal-300)' }}>Leader Tools & Profit Margin</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--slate-400)' }}>Base Cost (to Provider)</div>
                <div style={{ color: 'var(--white)', fontWeight: 600 }}>£{experience.basePrice}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--teal-400)' }}>Your Profit ({experience.leaderMarkup || 15}% markup)</div>
                <div style={{ color: 'var(--teal-300)', fontWeight: 600 }}>+£{Math.round((experience.basePrice || 25) * ((experience.leaderMarkup || 15) / 100))}</div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.95rem', color: 'var(--white)', fontWeight: 600 }}>Total Member Ticket Price</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--white)' }}>£{getTotalPrice(experience)}</div>
              </div>
            </div>

            {/* Quick 2-Step Leader Actions */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(45,212,191,0.2)', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowPitchModal(true)} 
                className="btn btn-outline interactive-press" 
                style={{ flex: 1, padding: '10px 12px', fontSize: '0.82rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Vote size={14} color="var(--teal-400)" /> 1. Pitch & Poll Dates
              </button>
              <button 
                onClick={() => setShowHostModal(true)} 
                className="btn btn-primary interactive-press" 
                style={{ flex: 1, padding: '10px 12px', fontSize: '0.82rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Sparkles size={14} /> 2. Host & Get Link
              </button>
            </div>
          </div>
        )}

        {/* Upcoming Community Trips Section */}
        {communityEvents.length > 0 && (
          <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--teal-400)" /> Upcoming Community Trips
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {communityEvents.map(ev => {
                const comm = communities?.find(c => c.id === ev.communityId);
                
                let nonMemberPrice = (ev.ticketPrice || 0) + 25;
                if (ev.description?.includes('<!--META:')) {
                  try {
                    const match = ev.description.match(/<!--META:(.*?)-->/);
                    if (match && match[1]) {
                      const meta = JSON.parse(match[1]);
                      if (meta.nonMemberPrice) nonMemberPrice = meta.nonMemberPrice;
                    }
                  } catch(e) {}
                }

                return (
                  <div key={ev.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--slate-900)', borderRadius: '12px', border: '1px solid var(--slate-800)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Hosted By</div>
                        <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1.1rem' }}>{comm?.name || 'A Community'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-300)', marginTop: '4px' }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />{ev.date} at {ev.time}</div>
                      </div>
                      <button onClick={() => navigate.push(`/checkout/experience/${ev.id}`)} className="btn btn-primary interactive-press" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
                        Join Trip
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Non-Member</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--white)', fontWeight: 600 }}>£{nonMemberPrice}</div>
                      </div>
                      <div style={{ flex: 1, padding: '12px', background: 'rgba(20,184,166,0.05)', borderRadius: '8px', border: '1px solid rgba(20,184,166,0.2)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', marginBottom: '4px', fontWeight: 700 }}>Member Price</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--teal-300)', fontWeight: 700 }}>£{ev.ticketPrice}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Booking Bar */}
      <div style={{
        position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', left: 0, right: 0,
        background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 90
      }}>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--white)' }}>£{getTotalPrice(experience)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>per person</div>
        </div>
        
        {isLeader ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowPitchModal(true)} 
              className="btn btn-outline interactive-press" 
              style={{ padding: '10px 16px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Vote size={14} color="var(--teal-400)" /> Pitch & Poll
            </button>
            <button 
              onClick={() => setShowHostModal(true)} 
              className="btn btn-primary interactive-press" 
              style={{ padding: '10px 20px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={15} /> Host Trip
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {experience.productUrl ? (
              <>
                <a 
                  href={experience.productUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary interactive-press" 
                  style={{ padding: '10px 22px', borderRadius: '99px', fontSize: '0.92rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Book on Viator <ExternalLink size={13} />
                </a>
                <button 
                  onClick={() => toast.success('Interest registered!', 'The leader will contact you to coordinate a group trip.')}
                  className="btn btn-outline interactive-press" 
                  style={{ padding: '10px 16px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Group Trip
                </button>
              </>
            ) : (
              <button 
                onClick={() => toast.success('Interest registered!', 'The leader will contact you to confirm your ticket.')}
                className="btn btn-primary interactive-press" 
                style={{ padding: '12px 24px', borderRadius: '99px', fontSize: '0.95rem', fontWeight: 600 }}
              >
                Register Interest
              </button>
            )}
          </div>
        )}
      </div>

      {showHostModal && (
        <HostExperienceModal 
          experience={experience} 
          communities={communities}
          user={user}
          onClose={() => setShowHostModal(false)}
          onHost={handleHostSubmit}
        />
      )}

      {showPitchModal && (
        <PitchExperienceModal
          experience={experience}
          communities={communities}
          user={user}
          onClose={() => setShowPitchModal(false)}
          onPitch={handlePitchSubmit}
        />
      )}

      {createdEvent && (
        <EventCreatedShareModal
          event={createdEvent}
          experience={experience}
          onClose={() => setCreatedEvent(null)}
        />
      )}
    </div>
  );
}
