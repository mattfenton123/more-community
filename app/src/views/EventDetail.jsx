"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalIcon, MapPin, Search, X, CheckCircle2, CreditCard, Check, Ticket, Users, QrCode, Image as ImageIcon, Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SkeletonList, SkeletonEvent } from '../components/SkeletonCard';
import { useToast } from '../components/Toast';
import DigitalTicket from '../components/DigitalTicket';
import ShareModal from '../components/ShareModal';
import { Share2 } from 'lucide-react';

// Haversine distance in miles
function getDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Sort events chronologically (soonest first), with past events at end
function sortByDate(events) {
  const now = new Date();
  return [...events].sort((a, b) => {
    const da = new Date(a.date + 'T00:00:00');
    const db = new Date(b.date + 'T00:00:00');
    const aFuture = da >= now;
    const bFuture = db >= now;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return da - db;
  });
}

export default function EventsHub() {
  const [activeTab, setActiveTab] = useState('My Schedule');
  const { events, communities, user, users, eventRsvps, rsvpToEvent, isLoading, sponsors, sponsorshipAssignments } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  
  const [checkoutState, setCheckoutState] = useState('idle');
  const [showTicket, setShowTicket] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasUploadedMemory, setHasUploadedMemory] = useState(false);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'requesting' | 'granted' | 'denied'
  const RADIUS_MILES = 18;

  // Request geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
        // Default to Tunbridge Wells
        setUserLocation({ lat: 51.1322, lng: 0.2637 });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // Filter events by distance if location is available
  const filterByDistance = (eventList) => {
    if (!userLocation) return eventList;
    return eventList.filter(e => {
      const community = communities.find(c => c.id === e.communityId);
      if (!community?.lat || !community?.lng) return true; // Include if no geo data
      return getDistanceMiles(userLocation.lat, userLocation.lng, community.lat, community.lng) <= RADIUS_MILES;
    });
  };

  // Filter events by search query
  const filterBySearch = (eventList) => {
    if (!searchQuery.trim()) return eventList;
    const q = searchQuery.toLowerCase();
    return eventList.filter(e => {
      const community = communities.find(c => c.id === e.communityId);
      return (
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        community?.name?.toLowerCase().includes(q)
      );
    });
  };

  const myRsvpEventIds = Object.keys(eventRsvps).filter(eventId => 
    eventRsvps[eventId]?.some(r => r.userId === user.id)
  );
  const userEvents = sortByDate(filterBySearch(events.filter(e => myRsvpEventIds.includes(e.id) || user.joinedCommunities.includes(e.communityId))));
  const exploreEvents = sortByDate(filterBySearch(filterByDistance(events.filter(e => !user.joinedCommunities.includes(e.communityId)))));

  const recommendedEvents = sortByDate(filterBySearch(filterByDistance(exploreEvents.filter(e => {
    if (!user || !user.interests) return false;
    const community = communities.find(c => c.id === e.communityId);
    if (!community || !community.tags) return false;
    return community.tags.some(tag => user.interests.includes(tag));
  }))));

  const [selectedEvent, setSelectedEvent] = useState(null);

  const getEventPrice = (event) => {
    let price = event.ticketPrice || 0;
    const isMember = user.joinedCommunities.includes(event.communityId);
    if (!isMember && event.description?.includes('<!--META:')) {
      try {
        const match = event.description.match(/<!--META:(.*?)-->/);
        if (match && match[1]) {
          const meta = JSON.parse(match[1]);
          if (meta.nonMemberPrice) price = meta.nonMemberPrice;
        }
      } catch(e) {}
    }
    return price;
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
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, margin: '0 0 16px 0' }}>Events</h1>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search events, locations, communities..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 40px 12px 42px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', color: 'var(--white)',
              fontSize: '0.9rem', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--slate-300)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Location status badge */}
        {locationStatus === 'granted' && userLocation && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '99px', fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, marginBottom: '12px' }}>
            <Navigation size={12} /> Showing events within {RADIUS_MILES} miles
          </div>
        )}
      </div>

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
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>UPCOMING • SOONEST FIRST</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : userEvents.length > 0 ? userEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>{searchQuery ? 'No events match your search.' : 'You have no upcoming events. Join some communities to fill your schedule!'}</p>
            )}
          </>
        ) : activeTab === 'Recommended' ? (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>MATCHING YOUR INTERESTS • SOONEST FIRST</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : recommendedEvents.length > 0 ? recommendedEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>{searchQuery ? 'No events match your search.' : 'No recommended events right now based on your interests.'}</p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>DISCOVER EVENTS NEAR YOU • SOONEST FIRST</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : exploreEvents.length > 0 ? exploreEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>{searchQuery ? 'No events match your search.' : 'No other public events right now.'}</p>
            )}
          </>
        )}
      </div>

      {/* Digital Ticket Modal */}
      {showTicket && (
        <DigitalTicket event={showTicket} user={user} onClose={() => setShowTicket(null)} />
      )}

      {/* Share Modal */}
      {selectedEvent && (
        <ShareModal 
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`Join me at ${selectedEvent.title}`}
          text={`I'm going to ${selectedEvent.title} with ${selectedEvent.communityName}. You should come along!`}
          url={`${window.location.origin}/events/${selectedEvent.id}`}
        />
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
                
                {(() => {
                  const assignment = sponsorshipAssignments.find(a => a.target_id === selectedEvent.communityId && a.target_type === 'community');
                  if (assignment) {
                    const sponsor = sponsors.find(s => s.id === assignment.sponsor_id);
                    if (sponsor) {
                      return (
                        <div onClick={() => router.push(`/sponsors/${sponsor.id}`)} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', marginBottom: '20px', cursor: 'pointer' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'white', overflow: 'hidden', flexShrink: 0, padding: '2px' }}>
                            <img src={sponsor.logo} alt={sponsor.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Event Partner</div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--white)', fontWeight: 600 }}>{sponsor.name}</div>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

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
                  
                  {eventRsvps[selectedEvent.id] && eventRsvps[selectedEvent.id].length > 0 && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 600, marginBottom: '12px' }}>
                      {(() => {
                        const firstUser = users.find(u => u.id === eventRsvps[selectedEvent.id][0].userId);
                        const count = eventRsvps[selectedEvent.id].length;
                        return count === 1 ? `${firstUser?.name || 'Someone'} is going.` : `${firstUser?.name || 'Someone'} and ${count - 1} others are going.`;
                      })()}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(eventRsvps[selectedEvent.id] || []).map((rsvp, idx) => {
                      const u = users.find(usr => usr.id === rsvp.userId);
                      if (!u) return null;
                      return <img onClick={() => navigate.push(`/profile/${u.id}`)} key={idx} src={u.avatar} alt={u.name} title={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--slate-800)', cursor: 'pointer' }} />;
                    })}
                    {(!eventRsvps[selectedEvent.id] || eventRsvps[selectedEvent.id].length === 0) && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Be the first to RSVP!</span>
                    )}
                  </div>
                </div>

                {(() => {
                  let isPastEvent = false;
                  try {
                    isPastEvent = new Date(selectedEvent.date) < new Date(new Date().setHours(0,0,0,0));
                  } catch (e) {}

                  if (isPastEvent) {
                    return (
                      <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                        <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ImageIcon size={18} color="var(--teal-400)" /> Memory Drop
                        </h4>
                        {!hasUploadedMemory ? (
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                            <div style={{ filter: 'blur(8px)', opacity: 0.5, marginBottom: '-60px', display: 'flex', gap: '8px', overflow: 'hidden' }}>
                              <div style={{ width: '100px', height: '100px', background: '#ccc', borderRadius: '8px' }}></div>
                              <div style={{ width: '100px', height: '100px', background: '#aaa', borderRadius: '8px' }}></div>
                            </div>
                            <div style={{ position: 'relative', zIndex: 10 }}>
                              <p style={{ color: 'var(--white)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Time to Be Real!</p>
                              <p style={{ color: 'var(--slate-300)', fontSize: '0.85rem', marginBottom: '20px' }}>Upload a photo from the event to unlock everyone else's memories.</p>
                              <button onClick={() => setHasUploadedMemory(true)} className="btn btn-primary interactive-press" style={{ borderRadius: '12px', padding: '12px 24px' }}>
                                <ImageIcon size={16} style={{ marginRight: '8px', display: 'inline-block' }} />
                                Upload Photo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <img src="/images/communities/parkrun.webp" alt="Memory 1" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                            <img src="/images/communities/gallery-running-1.webp" alt="Memory 2" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                            <div className="interactive-press" style={{ width: '100%', height: '140px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)', cursor: 'pointer', border: '1px dashed rgba(20,184,166,0.3)' }}>
                              <ImageIcon size={24} style={{ marginBottom: '8px' }} />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>+ Upload More</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return checkoutState === 'idle' && (
                    <>
                    {!eventRsvps[selectedEvent.id]?.some(r => r.userId === user.id) ? (
                      <button onClick={() => getEventPrice(selectedEvent) > 0 ? setCheckoutState('payment_select') : handleRSVP(false)} className="btn btn-primary interactive-press" style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '1.05rem', marginBottom: '12px' }}>
                        {getEventPrice(selectedEvent) > 0 ? `Get Tickets — £${getEventPrice(selectedEvent)}` : 'Free RSVP'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button onClick={() => { setShowTicket(selectedEvent); closeEventModal(); }} className="btn btn-primary interactive-press" style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', borderRadius: '12px' }}>
                          <QrCode size={18} /> View Ticket
                        </button>
                        <button onClick={handleCancelRSVP} className="btn btn-outline interactive-press" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    <button onClick={() => setShowShareModal(true)} className="interactive-press" style={{ width: '100%', padding: '14px', background: 'rgba(20,184,166,0.1)', color: 'var(--teal-400)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600 }}>
                      <Share2 size={18} /> Bring a Friend (+1)
                    </button>
                  </>
                );
                })()}
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
                    
                    {/* Upsell Logic */}
                    {(() => {
                      const isMember = user.joinedCommunities.includes(selectedEvent.communityId);
                      let nonMemberPrice = null;
                      if (!isMember && selectedEvent.description?.includes('<!--META:')) {
                        try {
                          const match = selectedEvent.description.match(/<!--META:(.*?)-->/);
                          if (match && match[1]) {
                            const meta = JSON.parse(match[1]);
                            if (meta.nonMemberPrice) nonMemberPrice = meta.nonMemberPrice;
                          }
                        } catch(e) {}
                      }

                      if (nonMemberPrice && nonMemberPrice > selectedEvent.ticketPrice) {
                        return (
                          <div style={{ background: 'rgba(20,184,166,0.05)', border: '1px dashed var(--teal-500)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ color: 'var(--teal-400)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Ticket size={16}/> Unlock Member Pricing!</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--slate-300)', marginBottom: '12px', lineHeight: 1.5 }}>
                              You're paying £{nonMemberPrice}. Join <strong>{selectedEvent.communityName}</strong> today and get this ticket for just <strong>£{selectedEvent.ticketPrice}</strong>!
                            </div>
                            <button onClick={() => router.push(`/community/${selectedEvent.communityId}`)} className="btn btn-outline interactive-press" style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', borderColor: 'var(--teal-500)', color: 'var(--teal-400)' }}>
                              View Community
                            </button>
                          </div>
                        )
                      }
                      return null;
                    })()}

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

      {showShareModal && (
        <ShareModal 
          event={selectedEvent} 
          onClose={() => setShowShareModal(false)} 
        />
      )}

    </div>
  );
}
