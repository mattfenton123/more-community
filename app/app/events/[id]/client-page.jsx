"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Share, MapPin, Calendar, Clock, Users, CheckCircle2, Info, List, Activity, Check, Map, Ticket, DollarSign, Copy, ExternalLink, Navigation, Video, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../../../src/context/AppContext';
import { useToast } from '../../../src/components/Toast';
import DigitalTicket from '../../../src/components/DigitalTicket';

// Well-known Tunbridge Wells locations for instant lookup
const KNOWN_LOCATIONS = {
  'dunorlan park': { lat: 51.1345, lng: 0.2710 },
  'calverley grounds': { lat: 51.1355, lng: 0.2605 },
  'the pantiles': { lat: 51.1280, lng: 0.2620 },
  'tunbridge wells': { lat: 51.1322, lng: 0.2637 },
  'camden road': { lat: 51.1330, lng: 0.2630 },
  'the forum': { lat: 51.1310, lng: 0.2650 },
  'trinity arts centre': { lat: 51.1315, lng: 0.2640 },
  'the assembly hall': { lat: 51.1340, lng: 0.2625 },
  'grosvenor park': { lat: 51.1280, lng: 0.2680 },
  'hawkenbury recreation ground': { lat: 51.1400, lng: 0.2770 },
  'st johns park': { lat: 51.1370, lng: 0.2560 },
};

function EventLocationMap({ location }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [geocodeError, setGeocodeError] = useState(false);

  useEffect(() => {
    if (!location) return;

    // Try known locations first
    const locLower = location.toLowerCase().trim();
    for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
      if (locLower.includes(key)) {
        setCoords(value);
        return;
      }
    }

    // Fallback: geocode via Nominatim
    const controller = new AbortController();
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', Tunbridge Wells, UK')}&limit=1`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          // Default to Tunbridge Wells center
          setCoords({ lat: 51.1322, lng: 0.2637 });
        }
      })
      .catch(() => {
        setCoords({ lat: 51.1322, lng: 0.2637 });
      });

    return () => controller.abort();
  }, [location]);

  useEffect(() => {
    if (!coords || !mapRef.current) return;

    // Dynamic import of Leaflet (client-side only)
    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom teal marker
      const markerIcon = L.divIcon({
        html: `<div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(20,184,166,0.9);
          border: 3px solid rgba(20,184,166,0.3);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(20,184,166,0.4), 0 0 0 8px rgba(20,184,166,0.1);
          animation: pulseMarker 2s ease-in-out infinite;
        "><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        className: '',
      });

      L.marker([coords.lat, coords.lng], { icon: markerIcon }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords]);

  const googleMapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  const appleMapsUrl = coords
    ? `https://maps.apple.com/?q=${coords.lat},${coords.lng}`
    : `https://maps.apple.com/?q=${encodeURIComponent(location)}`;

  return (
    <div style={{ marginBottom: '32px' }}>
      <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin size={20} color="var(--teal-400)" /> Location
      </h3>

      {/* Map container */}
      <div style={{
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--slate-900)',
        marginBottom: '12px',
      }}>
        <div ref={mapRef} style={{ width: '100%', height: '200px' }} />
      </div>

      {/* Location name + directions buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '12px 16px',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem' }}>{location}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '2px' }}>Tap to get directions</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-press"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px',
              background: 'rgba(20,184,166,0.1)',
              border: '1px solid rgba(20,184,166,0.25)',
              color: 'var(--teal-400)', fontSize: '0.8rem', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <Navigation size={14} /> Directions
          </a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseMarker {
          0%, 100% { box-shadow: 0 4px 16px rgba(20,184,166,0.4), 0 0 0 8px rgba(20,184,166,0.1); }
          50% { box-shadow: 0 4px 20px rgba(20,184,166,0.6), 0 0 0 16px rgba(20,184,166,0.05); }
        }
      `}} />
    </div>
  );
}

export default function EventClient({ id }) {
  const router = useRouter();
  const { events, communities, user, eventRsvps, rsvpToEvent, joinCommunity } = useAppContext();
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
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--slate-400)' }}>Loading event...</div>;
  }

  const rsvps = eventRsvps[event.id] || [];
  const myRsvp = rsvps.find(r => r.userId === user?.id);
  const isGoing = myRsvp?.status === 'going';
  const spotsLeft = event.maxCapacity ? Math.max(0, event.maxCapacity - rsvps.filter(r => r.status === 'going').length) : null;
  const isMember = user?.joinedCommunities?.includes(event.communityId);

  const handleJoinAndRSVP = async () => {
    if (!isMember) {
      await joinCommunity(event.communityId);
      toast.success('Joined Community!', `You are now a member of ${community.name}`);
    }
    handleRSVP();
  };

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
    <div className="view-events" style={{ paddingBottom: '100px', minHeight: '100dvh', background: 'var(--slate-950)' }}>
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
          <div 
            onClick={() => router.push(`/community/${community.id}`)}
            className="interactive-press"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}
          >
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

        {/* Video Embed */}
        {event.videoUrl && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} color="var(--teal-400)" /> Watch
            </h3>
            <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {event.videoUrl.includes('youtube') || event.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={event.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  title="Event video"
                />
              ) : event.videoUrl.includes('vimeo') ? (
                <iframe
                  src={event.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  title="Event video"
                />
              ) : (
                <video src={event.videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
          </div>
        )}

        {/* Who Is This For */}
        {event.suitableFor && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--teal-400)" /> Who is this for?
            </h3>
            <div style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '14px', padding: '16px' }}>
              <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>{event.suitableFor}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {event.instructions && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={20} color="var(--amber-400)" /> Instructions
            </h3>
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '14px', padding: '16px' }}>
              <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{event.instructions}</p>
            </div>
          </div>
        )}

        {/* Gallery Images */}
        {event.galleryImages && event.galleryImages.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="var(--teal-400)" /> Gallery
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {event.galleryImages.map((img, idx) => (
                <img key={idx} src={img} alt={`Event gallery ${idx + 1}`} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Capacity Info */}
        {(event.maxCapacity || event.minCapacity) && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {event.maxCapacity && (
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--white)' }}>{event.maxCapacity}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '4px' }}>Max capacity</div>
                {spotsLeft !== null && <div style={{ fontSize: '0.85rem', color: spotsLeft < 5 ? 'var(--rose-400)' : 'var(--teal-400)', fontWeight: 600, marginTop: '6px' }}>{spotsLeft === 0 ? 'Sold out' : `${spotsLeft} spots left`}</div>}
              </div>
            )}
            {event.minCapacity && (
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--white)' }}>{event.minCapacity}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '4px' }}>Min to go ahead</div>
                {(() => {
                  const goingCount = rsvps.filter(r => r.status === 'going').length;
                  const needed = event.minCapacity - goingCount;
                  return needed > 0
                    ? <div style={{ fontSize: '0.85rem', color: 'var(--amber-400)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><AlertTriangle size={14} /> {needed} more needed</div>
                    : <div style={{ fontSize: '0.85rem', color: 'var(--teal-400)', fontWeight: 600, marginTop: '6px' }}>✓ Confirmed!</div>;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Location Map */}
        {event.location && (
          <EventLocationMap location={event.location} />
        )}

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
            onClick={!isMember && !isGoing ? handleJoinAndRSVP : handleRSVP}
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
             !isMember ? 'Join Community to ' + (event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP') :
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
