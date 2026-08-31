"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Share, MapPin, Calendar, Clock, Users, CheckCircle2, Info, List, Activity, Check, Map, Ticket, DollarSign, Copy } from 'lucide-react';
import { useAppContext } from '../../../src/context/AppContext';
import { useToast } from '../../../src/components/Toast';
import DigitalTicket from '../../../src/components/DigitalTicket';

export default function EventClient({ id }) {
  const router = useRouter();
  const { events, communities, user, eventRsvps, rsvpToEvent } = useAppContext();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [community, setCommunity] = useState(null);
  const searchParams = useSearchParams();
  
  const [checkoutState, setCheckoutState] = useState('idle');
  const [showTicket, setShowTicket] = useState(null);

  useEffect(() => {
    if (events && communities) {
      const e = events.find(ev => ev.id === id);
      if (e) {
        setEvent(e);
        const c = communities.find(c => c.id === e.communityId);
        setCommunity(c);
      }
    }
  }, [events, communities, id]);

  if (!event || !community) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--slate-400)' }}>Loading event...</div>;
  }

  const rsvps = eventRsvps[event.id] || [];
  const myRsvp = rsvps.find(r => r.userId === user?.id);
  const isGoing = myRsvp?.status === 'going';
  const spotsLeft = event.maxCapacity ? Math.max(0, event.maxCapacity - rsvps.filter(r => r.status === 'going').length) : null;

  const handleRSVP = async () => {
    if (event.ticketPrice > 0 && !isGoing) {
      // Simulate checkout
      setCheckoutState('processing');
      setTimeout(async () => {
        setCheckoutState('success');
        const referredBy = searchParams?.get('ref') || null;
        await rsvpToEvent(event.id, 'going', 'paid', referredBy);
        toast.success('Ticket Purchased!', 'Your ticket is confirmed.');
        setTimeout(() => {
          setCheckoutState('idle');
          setShowTicket(event);
        }, 1500);
      }, 1500);
    } else {
      const newStatus = isGoing ? 'not_going' : 'going';
      await rsvpToEvent(event.id, newStatus);
      toast.success(newStatus === 'going' ? 'You\'re going!' : 'RSVP Cancelled', newStatus === 'going' ? 'Added to your schedule' : 'Removed from your schedule');
    }
  };

  const parseList = (text) => {
    if (!text) return [];
    return text.split('\n').filter(i => i.trim().length > 0);
  };

  const copyReferralLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/events/${event.id}?ref=${user?.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Link Copied!', `Share this link to earn £${event.profitShareAmount} per ticket.`);
    }
  };

  const itineraryItems = parseList(event.itinerary);
  const whatToBringItems = event.whatToBring ? event.whatToBring.split(',').map(i => i.trim()).filter(i => i) : [];

  return (
    <div className="view-events" style={{ paddingBottom: '100px', minHeight: '100vh', background: 'var(--slate-950)' }}>
      {/* Header / Hero Image */}
      <div style={{ position: 'relative', width: '100%', height: '300px', background: 'var(--slate-900)' }}>
        <img 
          src={event.image || community.cover_image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'} 
          alt={event.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
          <button onClick={() => router.back()} className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <button className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <Share size={20} />
          </button>
        </div>
        {/* Status Badge */}
        {isGoing && (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'var(--teal-500)', color: 'white', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <CheckCircle2 size={14} /> YOU'RE GOING
          </div>
        )}
      </div>

      {/* Content Body */}
      <div style={{ padding: '24px 20px', maxWidth: '800px', margin: '0 auto' }}>
        
        {event.profitShareEnabled && event.ticketPrice > 0 && user?.id && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--teal-400)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16}/> Share & Earn</div>
              <div style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>Earn £{event.profitShareAmount} for every person who buys a ticket using your link!</div>
            </div>
            <button onClick={copyReferralLink} className="btn btn-outline interactive-press" style={{ borderColor: 'var(--teal-500)', color: 'var(--teal-400)', padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Copy size={14}/> Copy Link
            </button>
          </div>
        )}
        
        {/* Title & Host */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <img src={community.image} alt={community.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--slate-300)', fontWeight: 500 }}>Hosted by <span style={{ color: 'var(--teal-400)' }}>{community.name}</span></span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--white)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
            {event.title}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '1rem' }}>{event.date}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>{event.time}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', flexShrink: 0 }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '1rem' }}>{event.location}</div>
                {event.meetingPoint && <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Meet: {event.meetingPoint}</div>}
              </div>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '24px 0' }} />

        {/* Description */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>About this event</h3>
          <p style={{ color: 'var(--slate-300)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-wrap' }}>
            {event.description}
          </p>
        </div>

        {/* Deep Dive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          
          {/* Itinerary */}
          {itineraryItems.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', margin: '0 0 16px 0', fontSize: '1.1rem' }}>
                <List size={18} color="var(--teal-400)" /> Itinerary
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
                {itineraryItems.map((item, idx) => {
                  const match = item.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-:]\s*(.*)$/);
                  const time = match ? match[1] : null;
                  const desc = match ? match[2] : item;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--slate-950)', border: '2px solid var(--teal-400)', flexShrink: 0, marginTop: '2px' }}></div>
                      <div>
                        {time && <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 600, marginBottom: '2px' }}>{time}</div>}
                        <div style={{ fontSize: '0.95rem', color: 'var(--slate-200)', lineHeight: 1.4 }}>{desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* What to Bring */}
            {whatToBringItems.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', margin: '0 0 16px 0', fontSize: '1.1rem' }}>
                  <Check size={18} color="var(--amber-400)" /> What to Bring
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {whatToBringItems.map((item, idx) => (
                    <span key={idx} style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', color: '#fcd34d', borderRadius: '8px', fontSize: '0.85rem' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vibe / Activity Level */}
            {event.activityLevel && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', margin: '0 0 12px 0', fontSize: '1.1rem' }}>
                  <Activity size={18} color="#ec4899" /> Vibe & Level
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '6px 16px', background: 'rgba(236,72,153,0.1)', color: '#f9a8d4', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600 }}>
                    {event.activityLevel}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky RSVP Footer */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        padding: '16px 20px', background: 'rgba(2, 6, 23, 0.85)', 
        backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.1)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)' }}>
              {event.ticketPrice > 0 ? `£${event.ticketPrice.toFixed(2)}` : 'Free'}
            </div>
            {spotsLeft !== null && (
              <div style={{ fontSize: '0.8rem', color: spotsLeft < 5 ? 'var(--rose-400)' : 'var(--slate-400)', fontWeight: 600 }}>
                {spotsLeft === 0 ? 'Sold Out' : `${spotsLeft} spots left`}
              </div>
            )}
          </div>
          <button 
            onClick={handleRSVP}
            disabled={checkoutState === 'processing' || (spotsLeft === 0 && !isGoing)}
            className="interactive-press"
            style={{ 
              background: isGoing ? 'rgba(255,255,255,0.1)' : 'var(--teal-500)', 
              color: isGoing ? 'var(--white)' : '#0f172a', 
              border: isGoing ? '1px solid rgba(255,255,255,0.2)' : 'none',
              padding: '12px 32px', borderRadius: '99px', fontSize: '1rem', fontWeight: 700, 
              cursor: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing)) ? 'not-allowed' : 'pointer',
              opacity: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing)) ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '8px',
              minWidth: '140px', justifyContent: 'center'
            }}
          >
            {checkoutState === 'processing' ? 'Processing...' : 
             isGoing ? 'Cancel RSVP' : 
             spotsLeft === 0 ? 'Sold Out' :
             event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP'}
          </button>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicket && (
        <DigitalTicket 
          event={showTicket} 
          community={communities.find(c => c.id === showTicket.communityId)}
          userName={user.name} 
          onClose={() => setShowTicket(null)} 
        />
      )}
    </div>
  );
}
