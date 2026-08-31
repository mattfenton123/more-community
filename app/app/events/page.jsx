"use client";
import { useState, useEffect } from 'react';
import { Calendar as CalIcon, MapPin, Search, X, CheckCircle2, CreditCard, Check, Ticket, Users, QrCode, Share } from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { SkeletonList, SkeletonEvent } from '../../src/components/SkeletonCard';
import { useToast } from '../../src/components/Toast';
import DigitalTicket from '../../src/components/DigitalTicket';
import AppHeader from '../../src/components/AppHeader';

export default function EventsHub() {
  const [activeTab, setActiveTab] = useState('My Schedule');
  const { events, communities, user, users, eventRsvps, rsvpToEvent, isLoading } = useAppContext();
  const { toast } = useToast();
  
  const [checkoutState, setCheckoutState] = useState('idle');
  const [showTicket, setShowTicket] = useState(null);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const myRsvpEventIds = Object.keys(eventRsvps).filter(eventId => 
    eventRsvps[eventId]?.some(r => r.userId === user.id)
  );
  const userEvents = events.filter(e => myRsvpEventIds.includes(e.id) || user.joinedCommunities.includes(e.communityId));
  const exploreEvents = events.filter(e => !user.joinedCommunities.includes(e.communityId));

  const recommendedEvents = exploreEvents.filter(e => {
    if (!user || !user.interests) return false;
    const community = communities.find(c => c.id === e.communityId);
    if (!community || !community.tags) return false;
    return community.tags.some(tag => user.interests.includes(tag));
  });

  const [selectedEvent, setSelectedEvent] = useState(null);

  const getEventPrice = (event) => {
    if (event.ticketPrice && event.ticketPrice > 0) return event.ticketPrice;
    return 0;
  };

  const handleRSVP = async (isPaid) => {
    if (isPaid) {
      setCheckoutState('processing');
      setTimeout(() => {
        setCheckoutState('success');
        rsvpToEvent(selectedEvent.id, 'going', 'paid');
        toast.success('Ticket Purchased!', 'Check your email for the receipt.');
      }, 2000);
    } else {
      rsvpToEvent(selectedEvent.id, 'going', 'free');
      toast.success('RSVP Confirmed!', 'Added to your schedule');
      setCheckoutState('success');
    }
  };

  const handleCancelRSVP = () => {
    rsvpToEvent(selectedEvent.id, 'not_going');
    toast.info('RSVP Cancelled', 'Removed from your schedule');
    setSelectedEvent(null);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setCheckoutState('idle');
    setCardForm({ number: '', expiry: '', cvc: '', name: '' });
  };

  const handlePromote = () => {
    const shareData = {
      title: `Event: ${selectedEvent.title}`,
      text: `Join us for ${selectedEvent.title} hosted by ${selectedEvent.communityName}!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      toast.success('Link copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatCardNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) return cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    return cleaned;
  };

  const renderEvent = (event, index) => {
    const community = communities.find(c => c.id === event.communityId);
    const eventImage = event.image || community?.image;
    const price = getEventPrice(event);
    const hasRsvp = eventRsvps[event.id]?.some(r => r.userId === user.id);
    return (
      <div 
        key={event.id} 
        onClick={() => setSelectedEvent({ ...event, communityName: community?.name })}
        className="interactive-press stagger-item" 
        style={{ cursor: 'pointer', marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}
        onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
        onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
      >
        {eventImage && (
          <div style={{ height: '120px', background: `url(${eventImage})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }}></div>
            <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.75rem', fontWeight: 700, color: price > 0 ? 'var(--amber-400)' : 'var(--teal-300)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: '99px' }}>
              {price > 0 ? `£${price}` : 'FREE'}
            </div>
            {hasRsvp && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal-300)', background: 'rgba(20,184,166,0.2)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> Going
              </div>
            )}
          </div>
        )}
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>{community?.name}</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>{event.title}</h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalIcon size={14} /> {event.date}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {event.location}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="view-events" style={{ paddingBottom: '80px' }}>
      <AppHeader title="Events" />

      <div style={{ display: 'flex', gap: '12px', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
        {['My Schedule', 'Recommended', 'Explore'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: 'none', border: 'none', padding: '12px 0', fontSize: '0.95rem', cursor: 'pointer', fontWeight: 600,
            color: activeTab === tab ? 'white' : 'var(--slate-500)',
            borderBottom: activeTab === tab ? '2px solid var(--teal-400)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: '10px 20px' }}>
        {activeTab === 'My Schedule' ? (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>UPCOMING THIS WEEK</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : userEvents.length > 0 ? userEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>You have no upcoming events. Join some communities to fill your schedule!</p>
            )}
          </>
        ) : activeTab === 'Recommended' ? (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>MATCHING YOUR INTERESTS</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : recommendedEvents.length > 0 ? recommendedEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>No recommended events right now based on your interests.</p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>DISCOVER EVENTS IN TUNBRIDGE WELLS</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : exploreEvents.length > 0 ? exploreEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>No other public events right now.</p>
            )}
          </>
        )}
      </div>

      {/* Digital Ticket Modal */}
      {showTicket && (
        <DigitalTicket event={showTicket} user={user} onClose={() => setShowTicket(null)} />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div className="modal-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Event Details</h2>
              <button onClick={closeEventModal} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: checkoutState !== 'idle' ? '320px' : '0' }}>
              <div style={{ background: 'var(--slate-800)', borderRadius: '16px', padding: '24px', border: '1px solid var(--slate-700)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', background: 'rgba(20,184,166,0.1)', borderBottomLeftRadius: '16px', color: 'var(--teal-400)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ticket size={18} /> {getEventPrice(selectedEvent) > 0 ? `£${getEventPrice(selectedEvent)}` : 'FREE'}
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>{selectedEvent.communityName}</div>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginBottom: '16px', color: 'var(--white)', paddingRight: '60px' }}>{selectedEvent.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--slate-300)' }}>
                    <CalIcon size={18} color="var(--slate-400)" />
                    <div>
                      <div style={{ fontWeight: 500 }}>{selectedEvent.date}</div>
                      <div style={{ fontSize: '0.85rem' }}>{selectedEvent.time}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--slate-300)' }}>
                    <MapPin size={18} color="var(--slate-400)" />
                    <div>
                      <div style={{ fontWeight: 500 }}>{selectedEvent.location}</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ fontSize: '0.9rem', color: 'var(--slate-400)', lineHeight: 1.5, marginBottom: '24px' }}>
                  {selectedEvent.description || `Join us for an amazing time! This event is hosted by ${selectedEvent.communityName}. Secure your spot now to let the organisers know you'll be there and to receive updates.`}
                </div>

                {/* Who's Going */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Who's going</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(eventRsvps[selectedEvent.id] || []).map((rsvp, idx) => {
                      const u = users.find(u => u.id === rsvp.userId);
                      if (!u) return null;
                      return <img key={idx} src={u.avatar} alt={u.name} title={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--slate-800)' }} />;
                    })}
                    {(!eventRsvps[selectedEvent.id] || eventRsvps[selectedEvent.id].length === 0) && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Be the first to RSVP!</span>
                    )}
                  </div>
                </div>

                {checkoutState === 'idle' && (
                  <>
                    {!eventRsvps[selectedEvent.id]?.some(r => r.userId === user.id) ? (
                      <button onClick={() => getEventPrice(selectedEvent) > 0 ? setCheckoutState('payment_select') : handleRSVP(false)} className="btn btn-primary interactive-press" style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '1.05rem' }}>
                        {getEventPrice(selectedEvent) > 0 ? `Get Tickets — £${getEventPrice(selectedEvent)}` : 'Free RSVP'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setShowTicket(selectedEvent); closeEventModal(); }} className="btn btn-primary interactive-press" style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', borderRadius: '12px' }}>
                          <QrCode size={18} /> View Ticket
                        </button>
                        <button onClick={handleCancelRSVP} className="btn btn-outline interactive-press" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {(user.isAdmin || user.leaderOf) && (
                      <button onClick={handlePromote} className="interactive-press" style={{ marginTop: '12px', width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#a78bfa', fontWeight: 600 }}>
                        <Share size={18} /> Promote to Members
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Slide-up Checkout */}
            {checkoutState !== 'idle' && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--slate-900)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', animation: 'slideInUp 0.3s ease-out' }}>
                
                {checkoutState === 'payment_select' && (
                  <>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--white)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Checkout</span>
                      <span>£{getEventPrice(selectedEvent).toFixed(2)}</span>
                    </h3>

                    {/* Stripe integration coming soon */}
                    <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎫</div>
                      <div style={{ fontWeight: 700, color: 'var(--white)', marginBottom: '8px', fontSize: '1rem' }}>Secure payment coming soon</div>
                      <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                        We're integrating Stripe for safe, seamless payments. In the meantime, please contact the community leader directly to arrange your ticket.
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CreditCard size={14} /> Powered by Stripe — launching soon
                      </div>
                    </div>

                    <button onClick={() => { rsvpToEvent(selectedEvent.id, 'going', 'pending'); toast.success('Interest registered!', 'The leader will contact you to confirm your ticket.'); setCheckoutState('success'); }} className="btn btn-primary interactive-press" style={{ width: '100%', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', marginBottom: '8px' }}>
                      <Check size={18} /> Register Interest (Free)
                    </button>
                    <button onClick={() => setCheckoutState('idle')} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '8px' }}>Cancel</button>
                  </>
                )}

                {checkoutState === 'processing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--slate-300)' }}>
                    <div className="spinner" style={{ borderTopColor: 'var(--teal-400)', marginBottom: '16px' }}></div>
                    Processing Payment...
                  </div>
                )}

                {checkoutState === 'success' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: 'var(--teal-400)' }}>
                    <CheckCircle2 size={48} style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--white)' }}>You're going!</h3>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--slate-400)', textAlign: 'center', fontSize: '0.9rem' }}>We've added this event to your schedule.</p>
                    <button onClick={() => { setShowTicket(selectedEvent); closeEventModal(); }} className="btn btn-outline interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px' }}>
                      <QrCode size={18} /> View Your Ticket
                    </button>
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
