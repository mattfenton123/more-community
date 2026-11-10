"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car, MapPin, Clock, Users, Shield, Plus, CheckCircle2, MessageCircle, X, ChevronRight, AlertCircle, Sparkles, Navigation, Fuel, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

export default function CarpoolHub({ event, user, isAttendee = false, community }) {
  const { toast } = useToast();
  const router = useRouter();
  const { 
    carpools, 
    setCarpools,
    offerCarpool, 
    reserveCarpoolSeat, 
    cancelCarpoolSeat, 
    deleteCarpoolOffer,
    rsvpToEvent
  } = useAppContext();

  // Local state initialized synchronously from localStorage for instant display
  const [localCarpools, setLocalCarpools] = useState(() => {
    if (typeof window === 'undefined' || !event?.id) return [];
    try {
      const raw = localStorage.getItem(`more_event_carpools_${event.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [origin, setOrigin] = useState('');
  const [departureTime, setDepartureTime] = useState(event?.time ? `${parseInt(event.time.split(':')[0], 10) - 1 || 9}:30 AM` : '09:15 AM');
  const [seatsTotal, setSeatsTotal] = useState(3);
  const [flexibleOnRoute, setFlexibleOnRoute] = useState(true);
  const [notes, setNotes] = useState('');
  const [chipIn, setChipIn] = useState('Free');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Merge context state and local fallback
  const eventCarpools = (carpools && carpools[event?.id] && carpools[event?.id].length > 0)
    ? carpools[event?.id]
    : localCarpools;

  // Hydrate or seed carpools on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !event?.id) return;
    try {
      const raw = localStorage.getItem(`more_event_carpools_${event.id}`);
      let pools = [];
      if (raw) {
        pools = JSON.parse(raw);
      }
      if (!Array.isArray(pools) || pools.length === 0) {
        const defaultPools = [
          {
            id: `sample_carpool_${event.id}_1`,
            eventId: event.id,
            driverId: 'sample_host_1',
            driverName: community?.leader_name || 'Mark D.',
            driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            origin: event?.location?.includes('Heathfield') ? 'Heathfield High St / Co-op area' : 'Tunbridge Wells Station / Nevill area',
            time: event?.time ? `${parseInt(event.time.split(':')[0], 10) - 1 || 9}:20 AM` : '09:15 AM',
            seatsTotal: 3,
            seatsAvailable: 2,
            passengers: [
              { userId: 'sample_rider_1', name: 'Dave B.', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Dave' }
            ],
            flexibleOnRoute: true,
            notes: 'Muddy boots welcome in the boot, medium dog friendly 🐕',
            chipIn: 'Free',
            createdAt: new Date().toISOString()
          }
        ];
        pools = defaultPools;
        localStorage.setItem(`more_event_carpools_${event.id}`, JSON.stringify(defaultPools));
      }
      setLocalCarpools(pools);
      if (typeof setCarpools === 'function') {
        setCarpools(prev => ({ ...prev, [event.id]: pools }));
      }
    } catch (e) {}
  }, [event?.id, community?.leader_name]);

  // Derived state
  const myCarpoolOffer = eventCarpools.find(c => c.driverId === user?.id);
  const myReservedCarpool = eventCarpools.find(c => (c.passengers || []).some(p => p.userId === user?.id));

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.info('Sign in required', 'Please sign in to offer a carpool ride.');
      return;
    }
    if (!origin.trim()) {
      toast.error('Departure area required', 'Please enter your general road, neighborhood, or landmark.');
      return;
    }

    setIsSubmitting(true);
    try {
      let createdOffer = null;
      if (typeof offerCarpool === 'function') {
        createdOffer = await offerCarpool(event.id, {
          origin: origin.trim(),
          time: departureTime,
          seatsTotal,
          flexibleOnRoute,
          notes: notes.trim(),
          chipIn
        });
      }
      
      // Update local state immediately
      if (createdOffer) {
        setLocalCarpools(prev => {
          const list = [createdOffer, ...prev.filter(c => c.driverId !== user.id)];
          try { localStorage.setItem(`more_event_carpools_${event.id}`, JSON.stringify(list)); } catch (e) {}
          return list;
        });
      }

      toast.success('Ride Offered! 🚗', 'Your carpool is live for confirmed walk attendees.');
      setShowOfferModal(false);
      setOrigin('');
      setNotes('');
    } catch (err) {
      toast.error('Error offering ride', err.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReserve = async (carpool) => {
    if (!user?.id) {
      toast.info('Sign in required', 'Please sign in to reserve a carpool seat.');
      router.push(`/login?redirect=/events/${event?.id}#carpool`);
      return;
    }
    
    try {
      // If user has not RSVP'd yet, automatically confirm RSVP
      if (!isAttendee && typeof rsvpToEvent === 'function') {
        await rsvpToEvent(event.id, 'going');
        toast.success('RSVP Confirmed! ✓', 'You are attending this walk.');
      }

      if (typeof reserveCarpoolSeat === 'function') {
        await reserveCarpoolSeat(event.id, carpool.id);
      }

      // Update local state immediately
      setLocalCarpools(prev => {
        const updated = prev.map(c => {
          if (c.id === carpool.id) {
            const hasUser = (c.passengers || []).some(p => p.userId === user.id);
            if (hasUser) return c;
            const newPassengers = [...(c.passengers || []), {
              userId: user.id,
              name: user.name || 'Member',
              avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Rider')}`,
              reservedAt: new Date().toISOString()
            }];
            return {
              ...c,
              passengers: newPassengers,
              seatsAvailable: Math.max(0, c.seatsTotal - newPassengers.length)
            };
          }
          return c;
        });
        try { localStorage.setItem(`more_event_carpools_${event.id}`, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });

      toast.success('Seat Reserved! 🎉', `You are riding with ${carpool.driverName}. Tap "Coordinate Pickup" to connect.`);
    } catch (err) {
      toast.error('Could not reserve seat', err.message);
    }
  };

  const handleCancelSeat = async (carpool) => {
    if (!window.confirm(`Release your seat with ${carpool.driverName}?`)) return;
    try {
      if (typeof cancelCarpoolSeat === 'function') {
        await cancelCarpoolSeat(event.id, carpool.id);
      }
      setLocalCarpools(prev => {
        const updated = prev.map(c => {
          if (c.id === carpool.id) {
            const newPassengers = (c.passengers || []).filter(p => p.userId !== user?.id);
            return {
              ...c,
              passengers: newPassengers,
              seatsAvailable: Math.max(0, c.seatsTotal - newPassengers.length)
            };
          }
          return c;
        });
        try { localStorage.setItem(`more_event_carpools_${event.id}`, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      toast.info('Seat Released', 'Your carpool reservation has been removed.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleDeleteOffer = async (carpoolId) => {
    if (!window.confirm('Are you sure you want to cancel this carpool offer?')) return;
    try {
      if (typeof deleteCarpoolOffer === 'function') {
        await deleteCarpoolOffer(event.id, carpoolId);
      }
      setLocalCarpools(prev => {
        const updated = prev.filter(c => c.id !== carpoolId);
        try { localStorage.setItem(`more_event_carpools_${event.id}`, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      toast.info('Carpool Cancelled', 'Your ride offer was removed.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const getHandshakeMessage = (carpool) => {
    const text = `Hey ${carpool.driverName}! I have booked a seat in your carpool for ${event.title} (leaves ${carpool.time} from ${carpool.origin}). Could we meet near [My Street / Corner]? Looking forward to the walk!`;
    return text;
  };

  return (
    <div className="carpool-hub-card" style={{
      background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
      border: '1px solid rgba(20, 184, 166, 0.25)',
      borderRadius: '20px',
      padding: '22px',
      marginBottom: '32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(12px)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 4px 14px rgba(20, 184, 166, 0.35)'
          }}>
            <Car size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--white)', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Trail Carpool Hub
              </h3>
              <span style={{
                fontSize: '0.68rem', padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(20, 184, 166, 0.2)', border: '1px solid rgba(20, 184, 166, 0.4)',
                color: '#2dd4bf', fontWeight: 700
              }}>
                ATTENDEE RIDES
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--slate-300)' }}>
              Share lifts, travel sustainably, and make friends before arriving at the trail.
            </p>
          </div>
        </div>

        {/* Action Button */}
        {!myCarpoolOffer && (
          <button
            onClick={() => {
              if (!user?.id) {
                toast.info('Please sign in', 'Sign in to offer a carpool ride.');
                return;
              }
              setShowOfferModal(true);
            }}
            className="interactive-press"
            style={{
              padding: '9px 16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
              color: '#0f172a', fontWeight: 700, fontSize: '0.86rem',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={16} /> Offer a Ride
          </button>
        )}
      </div>

      {/* Privacy & Safety Note */}
      <div className="carpool-privacy-note" style={{
        padding: '10px 14px', borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px',
        fontSize: '0.78rem', color: 'var(--slate-300)'
      }}>
        <Shield size={16} color="var(--teal-400)" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--white)' }}>Privacy-First Neighborhood Hubs:</strong> Drivers share their road, village, or general area. Exact door numbers are exchanged in 1-to-1 private chat once confirmed.
        </span>
      </div>

      {/* Carpools List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {eventCarpools.length === 0 ? (
          <div className="carpool-empty-state" style={{
            padding: '28px 20px', textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.1)'
          }}>
            <Car size={32} color="var(--slate-500)" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.95rem', marginBottom: '4px' }}>
              No carpools posted yet
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
              Are you driving to {event.title}? Be the first to offer spare seats in your car!
            </p>
            <button
              onClick={() => setShowOfferModal(true)}
              className="interactive-press"
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.35)',
                color: 'var(--teal-300)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer'
              }}
            >
              + Offer First Ride
            </button>
          </div>
        ) : (
          eventCarpools.map(carpool => {
            const isMyOffer = carpool.driverId === user?.id;
            const hasReserved = (carpool.passengers || []).some(p => p.userId === user?.id);
            const isFull = carpool.seatsAvailable <= 0;

            return (
              <div
                key={carpool.id}
                className={`carpool-card-item ${hasReserved ? "reserved" : ""}`}
                style={{
                  background: hasReserved 
                    ? 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: hasReserved ? '1.5px solid rgba(37, 211, 102, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Top Row: Driver info & Seats */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={carpool.driverAvatar}
                      alt={carpool.driverName}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--teal-500)' }}
                    />
                    <div>
                      <div className="driver-name" style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {carpool.driverName}
                        {isMyOffer && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(20, 184, 166, 0.25)', color: '#2dd4bf', fontWeight: 700 }}>
                            YOU
                          </span>
                        )}
                        {hasReserved && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(37, 211, 102, 0.25)', color: '#86efac', fontWeight: 700 }}>
                            YOUR DRIVER
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="var(--teal-400)" /> Leaves at {carpool.time}
                      </div>
                    </div>
                  </div>

                  {/* Seat availability badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px', borderRadius: '99px',
                    background: isFull ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    border: `1px solid ${isFull ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                    color: isFull ? '#fca5a5' : '#86efac',
                    fontSize: '0.78rem', fontWeight: 700
                  }}>
                    <Users size={13} />
                    {isFull ? 'Car Full' : `${carpool.seatsAvailable} of ${carpool.seatsTotal} seats open`}
                  </div>
                </div>

                {/* Middle: Departure Area & Route Tag */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="origin-text" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', color: 'var(--slate-200)' }}>
                    <MapPin size={15} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: 'var(--white)' }}>Leaving from:</strong> {carpool.origin}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {carpool.flexibleOnRoute && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)',
                        fontSize: '0.72rem', color: '#7dd3fc', fontWeight: 600
                      }}>
                        🛣️ Can pick up along route
                      </span>
                    )}

                    {carpool.chipIn && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)',
                        fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600
                      }}>
                        <Fuel size={11} /> {carpool.chipIn === 'Free' ? 'Free lift' : `${carpool.chipIn} chip-in`}
                      </span>
                    )}

                    {carpool.notes && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate-300)', fontStyle: 'italic' }}>
                        &ldquo;{carpool.notes}&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                {/* Passenger Avatars if any booked */}
                {carpool.passengers && carpool.passengers.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', fontWeight: 600 }}>Riders:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {carpool.passengers.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '99px', fontSize: '0.72rem', color: 'var(--slate-300)' }}>
                          <img src={p.avatar} alt={p.name} style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                          <span>{p.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  {isMyOffer ? (
                    <button
                      onClick={() => handleDeleteOffer(carpool.id)}
                      className="interactive-press"
                      style={{
                        padding: '6px 12px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <Trash2 size={12} /> Cancel Offer
                    </button>
                  ) : hasReserved ? (
                    <>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getHandshakeMessage(carpool))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="interactive-press"
                        style={{
                          padding: '7px 14px', borderRadius: '10px',
                          background: '#25D366', color: '#ffffff',
                          fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          boxShadow: '0 2px 10px rgba(37, 211, 102, 0.3)'
                        }}
                      >
                        <MessageCircle size={14} /> Coordinate Pickup
                      </a>
                      <button
                        onClick={() => handleCancelSeat(carpool)}
                        className="interactive-press"
                        style={{
                          padding: '7px 12px', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                          color: 'var(--slate-300)', fontSize: '0.78rem', cursor: 'pointer'
                        }}
                      >
                        Release Seat
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReserve(carpool)}
                      disabled={isFull}
                      className="interactive-press"
                      style={{
                        padding: '8px 16px', borderRadius: '10px',
                        background: isFull ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                        color: isFull ? 'var(--slate-500)' : '#0f172a',
                        fontWeight: 700, fontSize: '0.84rem',
                        border: 'none', cursor: isFull ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Car size={14} /> {isFull ? 'Car Full' : 'Reserve a Seat'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Offer a Ride Modal */}
      {showOfferModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '460px',
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            border: '1px solid rgba(20, 184, 166, 0.35)',
            borderRadius: '24px', padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--white)' }}>
                  Offer a Carpool Ride 🚗
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                  {event.title}
                </div>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="interactive-press"
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOffer}>
              {/* Departure Area */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '6px' }}>
                  Departure Area / Neighborhood *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nevill / Frant Road area, Heathfield High St, Crowborough..."
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '12px',
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--white)', fontSize: '0.9rem', outline: 'none'
                  }}
                  required
                />
                
                {/* Privacy Tip */}
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={12} color="#2dd4bf" />
                  <span>Privacy tip: Use your road or neighborhood rather than full house door number.</span>
                </div>

                {/* Quick Area Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {['Town Centre', 'Train Station', 'High Street', 'Near Co-op', 'Common / Park'].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setOrigin(prev => prev ? `${prev} (${chip})` : chip)}
                      style={{
                        padding: '3px 8px', borderRadius: '99px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-300)', fontSize: '0.7rem', cursor: 'pointer'
                      }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & Seats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '6px' }}>
                    Departure Time
                  </label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    placeholder="e.g. 09:15 AM"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--white)', fontSize: '0.88rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '6px' }}>
                    Available Seats
                  </label>
                  <select
                    value={seatsTotal}
                    onChange={e => setSeatsTotal(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '10px',
                      background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'var(--white)', fontSize: '0.88rem', outline: 'none'
                    }}
                  >
                    <option value={1} style={{ background: '#0f172a' }}>1 Seat</option>
                    <option value={2} style={{ background: '#0f172a' }}>2 Seats</option>
                    <option value={3} style={{ background: '#0f172a' }}>3 Seats</option>
                    <option value={4} style={{ background: '#0f172a' }}>4 Seats</option>
                  </select>
                </div>
              </div>

              {/* Route Flexibility Toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '16px', cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7dd3fc' }}>
                    🛣️ Can pick up along my route
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--slate-300)' }}>
                    Willing to stop on main road if rider is along the way
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={flexibleOnRoute}
                  onChange={e => setFlexibleOnRoute(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </label>

              {/* Fuel Contribution */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '6px' }}>
                  Fuel Contribution
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {['Free', '£2', '£3', '£5'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setChipIn(val)}
                      style={{
                        padding: '8px', borderRadius: '8px',
                        background: chipIn === val ? 'rgba(20, 184, 166, 0.25)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${chipIn === val ? 'var(--teal-400)' : 'rgba(255,255,255,0.1)'}`,
                        color: chipIn === val ? 'var(--teal-300)' : 'var(--slate-300)',
                        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '6px' }}>
                  Notes (Boot space, dogs, etc.)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Boot space for muddy boots & medium dog friendly..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--white)', fontSize: '0.86rem', outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="interactive-press"
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                  color: '#0f172a', fontWeight: 800, fontSize: '0.98rem', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Car size={18} /> {isSubmitting ? 'Publishing...' : 'Publish Ride Offer 🚗'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
