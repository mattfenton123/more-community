"use client";
import { useState, useEffect } from 'react';
import { Calendar as CalIcon, MapPin, Search, X, CheckCircle2, CreditCard, Check, Ticket, Users, QrCode, Share } from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { SkeletonList, SkeletonEvent } from '../../src/components/SkeletonCard';
import { useToast } from '../../src/components/Toast';
import DigitalTicket from '../../src/components/DigitalTicket';

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

            {checkoutState !== 'idle' && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--slate-900)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', animation: 'slideInUp 0.3s ease-out' }}>
                
                {checkoutState === 'payment_select' && (
                  <>
                    <h3 style={{ margin: '0 0 16px 0', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Checkout</span>
                      <span>£{getEventPrice(selectedEvent).toFixed(2)}</span>
                    </h3>

                    {/* Stripe integration coming soon */}
                    <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎫</div>
                      <div style={{ fontWeight: 700, color: 'white', marginBottom: '8px', fontSize: '1rem' }}>Secure payment coming soon</div>
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
                    <h3 style={{ margin: '0 0 8px 0', color: 'white' }}>You're going!</h3>
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
