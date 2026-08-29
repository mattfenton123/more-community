"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter as useNavigate } from 'next/navigation';
import { MapPin, Clock, Users, ArrowLeft, Share2, Star, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

export default function ExperienceMicrosite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { experiences, communities, user, createEvent } = useAppContext();
  const { toast } = useToast();
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteCommunityId, setPromoteCommunityId] = useState(user?.ledCommunities?.[0] || '');

  const experience = experiences.find(e => e.id === id);

  useEffect(() => {
    if (!promoteCommunityId && user?.ledCommunities?.length > 0) {
      setPromoteCommunityId(user.ledCommunities[0]);
    }
  }, [user, promoteCommunityId]);

  if (!experience) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <h2>Experience not found</h2>
        <button onClick={() => navigate.back()} className="btn btn-outline" style={{ marginTop: '20px' }}>Go Back</button>
      </div>
    );
  }

  const getTotalPrice = (exp) => {
    return Math.round(exp.basePrice * (1 + exp.leaderMarkup / 100));
  };

  const isLeader = user?.ledCommunities?.length > 0;

  const handlePromote = async () => {
    const leaderCommunityId = promoteCommunityId || user?.ledCommunities?.[0];

    if (!leaderCommunityId) {
      toast.error('Permission Denied', 'You must be a community leader to promote experiences.');
      return;
    }
    setIsPromoting(true);
    try {
      const newEvent = {
        title: experience.title,
        description: experience.description + `\n\nProvider: ${experience.provider}`,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        time: '10:00 AM',
        location: experience.location,
        image: experience.image,
        communityId: leaderCommunityId,
        status: 'published',
        maxCapacity: experience.spotsLeft || 20,
        ticketPrice: getTotalPrice(experience)
      };
      await createEvent(leaderCommunityId, newEvent);
      toast.success('Promoted!', `${experience.title} added to your community events.`);
    } catch (err) {
      toast.error('Error', 'Failed to promote experience.');
    } finally {
      setIsPromoting(false);
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--slate-950)', color: 'white', paddingBottom: '100px' }}>
      {/* Hero Section */}
      <div style={{ position: 'relative', height: '350px' }}>
        <img src={experience.image} alt={experience.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: 'linear-gradient(to top, var(--slate-950), transparent)' }}></div>
        
        {/* Top Bar Actions */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => navigate.back()} className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <button onClick={handleShare} className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Share2 size={20} />
          </button>
        </div>

        {/* Category Pill */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(45,212,191,0.2)', border: '1px solid rgba(45,212,191,0.4)', color: 'var(--teal-300)', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
          {experience.category}
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', lineHeight: 1.1, margin: '16px 0 12px', color: 'white' }}>
          {experience.title}
        </h1>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber-400)', fontSize: '0.9rem', fontWeight: 600 }}>
            <Star size={16} fill="currentColor" /> {experience.rating}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
            <MapPin size={16} /> {experience.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
            <Clock size={16} /> {experience.duration}
          </div>
        </div>

        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--slate-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="var(--teal-400)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Provider</div>
              <div style={{ fontSize: '1rem', color: 'white', fontWeight: 500 }}>{experience.provider}</div>
            </div>
          </div>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
          <p style={{ color: 'var(--slate-300)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            {experience.description}
          </p>
        </div>

        {/* LEADER VIEW: Transparent Pricing Breakdown */}
        {isLeader && (
          <div style={{ padding: '24px', background: 'linear-gradient(to right, rgba(45,212,191,0.05), rgba(59,130,246,0.05))', borderRadius: '16px', border: '1px solid rgba(45,212,191,0.2)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} color="var(--teal-400)" />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--teal-300)' }}>Leader Tools & Profit</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--slate-400)' }}>Base Cost (to Provider)</div>
                <div style={{ color: 'white', fontWeight: 600 }}>£{experience.basePrice}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--teal-400)' }}>Your Profit ({experience.leaderMarkup}% markup)</div>
                <div style={{ color: 'var(--teal-300)', fontWeight: 600 }}>+£{Math.round(experience.basePrice * (experience.leaderMarkup / 100))}</div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 600 }}>Total Member Ticket Price</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>£{getTotalPrice(experience)}</div>
              </div>
            </div>

            {user.ledCommunities.length > 1 && (
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '8px' }}>Promote to Community:</label>
                <select 
                  value={promoteCommunityId} 
                  onChange={e => setPromoteCommunityId(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white' }}
                >
                  {user.ledCommunities.map(id => {
                    const c = communities.find(comm => comm.id === id);
                    return <option key={id} value={id}>{c?.name || id}</option>;
                  })}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Booking Bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100
      }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>£{getTotalPrice(experience)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>per person</div>
        </div>
        
        {isLeader ? (
          <button 
            onClick={handlePromote} 
            disabled={isPromoting}
            className="btn btn-primary interactive-press" 
            style={{ padding: '14px 28px', borderRadius: '99px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isPromoting ? 'Promoting...' : <><Sparkles size={16} /> Promote</>}
          </button>
        ) : (
          <button 
            onClick={() => toast.success('Interest registered!', 'The leader will contact you to confirm your ticket.')}
            className="btn btn-primary interactive-press" 
            style={{ padding: '14px 28px', borderRadius: '99px', fontSize: '1rem', fontWeight: 600 }}
          >
            Register Interest
          </button>
        )}
      </div>
    </div>
  );
}
