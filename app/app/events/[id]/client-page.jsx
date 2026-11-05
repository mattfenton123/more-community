"use client";
import { supabase } from '../../../src/lib/supabaseClient';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Share, MapPin, Calendar, Clock, Users, CheckCircle2, Info, List, Activity, Check, Map, Ticket, DollarSign, Copy, ExternalLink, Navigation, Video, AlertTriangle, Image as ImageIcon, ScanLine, Archive, Repeat, MessageCircle, Banknote, CreditCard } from 'lucide-react';
import { useAppContext } from '../../../src/context/AppContext';
import { useToast } from '../../../src/components/Toast';
import DigitalTicket from '../../../src/components/DigitalTicket';
import QRScanner from '../../../src/components/QRScanner';
import { isEventPast, isEventUpcoming, downloadIcs, getGoogleCalendarEventUrl, getWhatsAppShareUrl } from '../../../src/lib/calendar';
import { formatEventDate } from '../../../src/lib/recurrence';
import {
  findKnownLocation,
  parseLocationCoords,
  cleanLocationName,
  geocodeLocation,
  DEFAULT_TW_CENTER
} from '../../../src/lib/location';
import { findEventByParam, getEventPath, getEventUrl } from '../../../src/lib/eventLinks';
import ShareModal from '../../../src/components/ShareModal';
import EventRecapShareCard from '../../../src/components/EventRecapShareCard';

function EventLocationMap({ location, event }) {
  const [mapType, setMapType] = useState('m'); // 'm' = Roadmap, 'k' = Satellite
  const [coords, setCoords] = useState(() => {
    const parsed = parseLocationCoords(location) || (event?.lat && event?.lng ? { lat: Number(event.lat), lng: Number(event.lng) } : null);
    if (parsed) return parsed;
    const known = findKnownLocation(location) || (event?.title ? findKnownLocation(event.title) : null);
    if (known) return { lat: known.lat, lng: known.lng };
    return null;
  });
  const [areaInfo, setAreaInfo] = useState(() => {
    const known = findKnownLocation(location) || (event?.title ? findKnownLocation(event.title) : null);
    return known?.area || '';
  });

  useEffect(() => {
    if (!location) return;

    // Check embedded or known first
    const parsed = parseLocationCoords(location) || (event?.lat && event?.lng ? { lat: Number(event.lat), lng: Number(event.lng) } : null);
    if (parsed) {
      setCoords(parsed);
      return;
    }

    const known = findKnownLocation(location) || (event?.title ? findKnownLocation(event.title) : null);
    if (known) {
      setCoords({ lat: known.lat, lng: known.lng });
      setAreaInfo(known.area || '');
      return;
    }

    // Geocode via smart fallback
    const controller = new AbortController();
    geocodeLocation(location, { signal: controller.signal })
      .then(res => {
        if (res && res.lat && res.lng) {
          setCoords({ lat: res.lat, lng: res.lng });
          if (res.area) setAreaInfo(res.area);
        } else {
          setCoords({ lat: DEFAULT_TW_CENTER[0], lng: DEFAULT_TW_CENTER[1] });
        }
      })
      .catch(() => {
        setCoords({ lat: DEFAULT_TW_CENTER[0], lng: DEFAULT_TW_CENTER[1] });
      });

    return () => controller.abort();
  }, [location, event]);

  const cleanName = cleanLocationName(location);

  // Construct Google Maps Search Query
  const searchQuery = coords
    ? `${coords.lat},${coords.lng}`
    : `${cleanName}${areaInfo ? `, ${areaInfo}` : ''}, UK`;

  const googleEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=${mapType}&z=16&hl=en&output=embed`;

  const googleMapsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + (areaInfo ? `, ${areaInfo}` : ''))}`;

  const appleMapsUrl = coords
    ? `https://maps.apple.com/?daddr=${coords.lat},${coords.lng}`
    : `https://maps.apple.com/?q=${encodeURIComponent(cleanName + (areaInfo ? `, ${areaInfo}` : ''))}`;

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="var(--teal-400)" /> Event Start Location
        </h3>

        {/* Google Maps Layer Toggle: Map vs Satellite */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setMapType('m')}
            style={{
              background: mapType === 'm' ? '#2dd4bf' : 'transparent',
              color: mapType === 'm' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Google Map
          </button>
          <button
            type="button"
            onClick={() => setMapType('k')}
            style={{
              background: mapType === 'k' ? '#2dd4bf' : 'transparent',
              color: mapType === 'k' ? '#0f172a' : 'var(--slate-300)',
              border: 'none',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Google Maps Embed Container */}
      <div style={{
        borderRadius: '16px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'var(--slate-900)',
        marginBottom: '12px',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        height: '240px'
      }}>
        <iframe
          title="Google Map Event Location"
          width="100%"
          height="240"
          style={{ border: 0, width: '100%', height: '240px', display: 'block' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={googleEmbedUrl}
        />
        {coords && (
          <div style={{
            position: 'absolute', bottom: '10px', left: '10px', zIndex: 10,
            background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)',
            padding: '4px 10px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)',
            fontSize: '0.72rem', color: '#2dd4bf', fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span>📍 Google Maps</span>
            <span style={{ color: 'var(--slate-400)' }}>•</span>
            <span>{coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°</span>
          </div>
        )}
      </div>

      {/* Location name + directions buttons */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '14px 16px',
      }}>
        <div style={{ minWidth: '180px' }}>
          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.98rem' }}>
            {cleanName}
          </div>
          {areaInfo && (
            <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', marginTop: '2px', fontWeight: 500 }}>
              {areaInfo}
            </div>
          )}
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px' }}>
            Tap below for directions to the start point
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-press"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '10px',
              background: 'rgba(20,184,166,0.12)',
              border: '1px solid rgba(20,184,166,0.3)',
              color: 'var(--teal-400)', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <Navigation size={14} /> Open in Google Maps
          </a>
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-press"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <ExternalLink size={14} /> Apple Maps
          </a>
        </div>
      </div>
    </div>
  );
}

export default function EventClient({ id }) {
  const router = useRouter();
  const { events, communities, user, users, eventRsvps, rsvpToEvent, joinCommunity, checkInMember } = useAppContext();
  const { toast } = useToast();
  const [event, setEvent] = useState(null);
  const [community, setCommunity] = useState(null);
  const searchParams = useSearchParams();
  
  const [checkoutState, setCheckoutState] = useState('idle');
  const [showTicket, setShowTicket] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
  const [showRsvpSuccessModal, setShowRsvpSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const isLeader = user?.ledCommunities?.includes(event?.communityId) || user?.isAdmin;

  const handleScan = async (payload) => {
    let scannedUserId = payload;
    if (typeof payload === 'object' && payload.userId) {
      scannedUserId = payload.userId;
    }
    try {
      if (typeof checkInMember === 'function') {
        await checkInMember(event.id, scannedUserId);
      }
      const member = (users || []).find(u => u.id === scannedUserId);
      const name = member?.name || 'Member';
      toast.success('Ticket Verified! ✓', `${name} has been checked in.`);
    } catch(e) {
      toast.error('Scan Failed', 'Could not verify ticket.');
    }
  };

  useEffect(() => {
    if (events && communities) {
      const e = findEventByParam(events, id);
      if (e) {
        setEvent(e);
        const c = communities.find(c => c.id === e.communityId);
        setCommunity(c);

        // Address bar normalization: if accessed via UUID, update URL to clean slug
        try {
          const cleanPath = getEventPath(e, events);
          if (typeof window !== 'undefined' && window.location.pathname !== cleanPath) {
            window.history.replaceState(null, '', cleanPath + window.location.search);
          }
        } catch (err) {}

        // Cache event and community locally for offline zero-signal access on trails
        try {
          localStorage.setItem(`more_cached_event_${id}`, JSON.stringify({ event: e, community: c, ts: Date.now() }));
        } catch (err) {}
        return;
      }
    }

    // Zero-signal offline recovery: load cached event from localStorage if offline
    try {
      const cached = localStorage.getItem(`more_cached_event_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.event && parsed.community) {
          setEvent(parsed.event);
          setCommunity(parsed.community);
        }
      }
    } catch (err) {}
  }, [events, communities, id]);

  const partnerCommunities = useMemo(() => {
    if (!event?.collabCommunityIds || !communities) return [];
    return communities.filter(c => event.collabCommunityIds.includes(c.id));
  }, [event, communities]);

  const seriesEvents = useMemo(() => {
    if (!event || !events) return [];
    return events
      .filter(e => e.communityId === event.communityId && e.title?.trim().toLowerCase() === event.title?.trim().toLowerCase())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [event, events]);
  const currentSeriesIndex = event ? seriesEvents.findIndex(e => e.id === event.id) : -1;

  useEffect(() => {
    if (searchParams?.get('checkout') === 'success' && event?.id && user?.id) {
      setShowRsvpSuccessModal(true);
      toast.success('Ticket Confirmed!', 'Your payment was processed and your ticket is saved.');
    }
  }, [searchParams, event?.id, user?.id]);

  if (!event || !community) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--slate-400)' }}>Loading event...</div>;
  }

  const rsvps = eventRsvps[event.id] || [];
  const myRsvp = rsvps.find(r => r.userId === user?.id);
  const isGoing = myRsvp?.status === 'going';
  const isCashAttendee = myRsvp?.ticketType === 'cash_on_arrival';
  const spotsLeft = event.maxCapacity ? Math.max(0, event.maxCapacity - rsvps.filter(r => r.status === 'going').length) : null;
  const isMember = user?.joinedCommunities?.includes(event.communityId);

  const handleJoinAndRSVP = async () => {
    if (!user?.id) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    if (!isMember) {
      await joinCommunity(event.communityId);
      toast.success('Joined Community!', `You are now a member of ${community.name}`);
    }
    handleRSVP();
  };

  const executeStripeCheckout = async () => {
    setCheckoutState('processing');
    const referredBy = searchParams?.get('ref') || null;
    try {
      let authHeader = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authHeader = { 'Authorization': `Bearer ${session.access_token}` };
      } catch (e) {}

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          type: 'event',
          eventId: event.id,
          userId: user.id,
          price: event.ticketPrice,
          title: event.title,
          communityId: event.communityId,
          referredBy
        })
      });
      const data = await res.json();
      if (res.ok && data?.url && !data?.simulated) {
        window.location.href = data.url;
        return;
      }
      toast.error('Ticket Checkout Failed', data?.error || 'Unable to open checkout session.');
    } catch (err) {
      console.error('Stripe checkout error:', err);
      toast.error('Checkout Error', 'Unable to connect to payment server. Please try again.');
    } finally {
      setCheckoutState('idle');
    }
  };

  const executeCashRsvp = async () => {
    setCheckoutState('processing');
    try {
      const referredBy = searchParams?.get('ref') || null;
      await rsvpToEvent(event.id, 'going', 'cash_on_arrival', referredBy);
      setShowPaymentChoiceModal(false);
      setShowRsvpSuccessModal(true);
      toast.success('Spot Reserved!', `Please bring £${event.ticketPrice.toFixed(2)} cash on arrival.`);
    } catch (err) {
      console.error('Cash RSVP error:', err);
      toast.error('Reservation Error', 'Unable to reserve spot. Please try again.');
    } finally {
      setCheckoutState('idle');
    }
  };

  const handleRSVP = async () => {
    if (!user?.id) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    if (event.ticketPrice > 0 && !isGoing) {
      if (event.allowCash || event.allow_cash) {
        setShowPaymentChoiceModal(true);
        return;
      }
      executeStripeCheckout();
    } else {
      const newStatus = isGoing ? 'not_going' : 'going';
      await rsvpToEvent(event.id, newStatus);
      if (newStatus === 'going') {
        setShowRsvpSuccessModal(true);
      } else {
        toast.success('RSVP Cancelled', 'Removed from your schedule');
      }
    }
  };

  const parseList = (text) => {
    if (!text) return [];
    return text.split('\n').filter(i => i.trim().length > 0);
  };

  const copyReferralLink = () => {
    if (!user) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    if (typeof window !== 'undefined') {
      const url = getEventUrl(event, { allEvents: events, origin: window.location.origin, ref: user.id });
      navigator.clipboard.writeText(url);
      toast.success('Link Copied!', `Share this link to earn £${event.profitShareAmount} per ticket.`);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const hasHistory = window.history.length > 1;
      const isFromSameHost = document.referrer && document.referrer.includes(window.location.host);

      if (!hasHistory || !isFromSameHost) {
        if (event?.communityId) {
          router.push(`/community/${event.communityId}`);
        } else {
          router.push('/events');
        }
        return;
      }
      router.back();
    }
  };

  const itineraryItems = parseList(event.itinerary);
  const whatToBringItems = event.whatToBring ? event.whatToBring.split(',').map(i => i.trim()).filter(i => i) : [];

  return (
    <div className="view-events" style={{ paddingBottom: '100px', minHeight: '100dvh', background: 'var(--slate-950)' }}>
      {/* Header / Hero Image */}
      <div style={{ position: 'relative', width: '100%', height: '300px', background: 'var(--slate-900)' }}>
        <img 
          src={event.image || community?.cover_image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'} 
          alt={event.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
          <button onClick={handleBack} aria-label="Go Back" className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => setShowShareModal(true)} 
            aria-label="Share Event"
            className="interactive-press" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
          >
            <Share size={20} />
          </button>
        </div>
        {/* Status Badges */}
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isEventPast(event) && (
            <div style={{ background: 'rgba(71,85,105,0.95)', color: 'white', padding: '6px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <Archive size={14} /> PAST EVENT • ARCHIVED
            </div>
          )}
          {seriesEvents.length > 1 && (
            <div style={{ background: 'rgba(20,184,166,0.9)', color: 'white', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <Repeat size={13} /> {currentSeriesIndex >= 0 ? `SESSION ${currentSeriesIndex + 1} OF ${seriesEvents.length}` : `${seriesEvents.length} SESSIONS`}
            </div>
          )}
          {isGoing && (
            <div style={{ background: 'var(--teal-500)', color: 'white', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <CheckCircle2 size={14} /> {isEventPast(event) ? 'YOU ATTENDED' : "YOU'RE GOING"}
            </div>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div style={{ padding: '24px 20px', maxWidth: '800px', margin: '0 auto' }}>
        
        <EventRecapShareCard event={event} community={community} attendeeCount={rsvps.filter(r => r.status === 'going').length || event?.attendees || 0} />
        {isEventPast(event) && (
          <div style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Archive size={22} color="var(--slate-400)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '0.95rem' }}>This event has taken place</div>
              <div style={{ color: 'var(--slate-400)', fontSize: '0.82rem', marginTop: '2px' }}>
                Event date: {event.date} at {event.time}. It is now archived for community memory.
              </div>
            </div>
          </div>
        )}
        
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div 
              onClick={() => router.push(`/community/${community.id}`)}
              className="interactive-press"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <img src={community.image} alt={community.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--slate-300)', fontWeight: 500 }}>Hosted by <span style={{ color: 'var(--teal-400)' }}>{community.name}</span></span>
            </div>

            {partnerCommunities.length > 0 && (
              <>
                <span style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>•</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '99px', fontSize: '0.78rem', color: '#7dd3fc', fontWeight: 600 }}>
                  <span>🤝 Co-hosted with</span>
                  {partnerCommunities.map((pc, idx) => (
                    <span 
                      key={pc.id}
                      onClick={(ev) => { ev.stopPropagation(); router.push(`/community/${pc.id}`); }}
                      className="interactive-press"
                      style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--white)' }}
                    >
                      {pc.name}{idx < partnerCommunities.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </>
            )}

            {(community?.is_insured || community?.insurance_tier === 'pro') && (
              <>
                <span style={{ color: 'var(--slate-600)', fontSize: '0.85rem' }}>•</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '99px', fontSize: '0.75rem', color: '#2dd4bf', fontWeight: 600 }}>
                  <Shield size={12} color="#2dd4bf" /> Verified Leader • Council Safety & Organiser Insured
                </div>
              </>
            )}
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
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '1rem' }}>{cleanLocationName(event.location)}</div>
                {event.meetingPoint && <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Meet: {event.meetingPoint}</div>}
              </div>
            </div>
          </div>

          {/* Other dates in recurring series */}
          {seriesEvents.length > 1 && (
            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--teal-300)' }}>
                  <Repeat size={14} /> Other Dates in this Series ({seriesEvents.length} sessions)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {seriesEvents.map((se, sIdx) => {
                  const isCurrent = se.id === event.id;
                  const isPast = isEventPast(se);
                  return (
                    <button
                      key={se.id}
                      onClick={() => { if (!isCurrent) router.push(getEventPath(se, events)); }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isCurrent ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                        background: isCurrent ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.03)',
                        color: isCurrent ? 'var(--white)' : isPast ? 'var(--slate-500)' : 'var(--slate-300)',
                        cursor: isCurrent ? 'default' : 'pointer',
                        textAlign: 'left',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        opacity: isPast && !isCurrent ? 0.6 : 1
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isCurrent ? 'var(--teal-400)' : 'var(--slate-400)' }}>
                        #{sIdx + 1} {isCurrent ? '• CURRENT' : isPast ? '• PAST' : ''}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatEventDate(se.date)}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>{se.time || '10:00'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
          <EventLocationMap location={event.location} event={event} />
        )}

        {/* Joint Co-Hosting & Partner Community Discovery */}
        {partnerCommunities.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(20,184,166,0.08) 100%)',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🤝</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Joint Community Collaboration
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--slate-200)', lineHeight: 1.5, marginBottom: '14px' }}>
              This event is proudly co-hosted by <strong>{community.name}</strong> alongside {partnerCommunities.map(p => p.name).join(' & ')}. Members from across partner communities in Tunbridge Wells are invited to connect!
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {partnerCommunities.map(pc => (
                <div 
                  key={pc.id}
                  onClick={() => router.push(`/community/${pc.id}`)}
                  className="interactive-press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer'
                  }}
                >
                  {pc.image && <img src={pc.image} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' }}>{pc.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700 }}>Explore →</span>
                </div>
              ))}
            </div>
          </div>
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

            {/* What to Expect / Activity Level */}
            {(() => {
              const level = event.activityLevel || 'All Levels';
              const isPeerSupport = event.title?.toLowerCase().includes('peer') || 
                                    event.title?.toLowerCase().includes('mankind') || 
                                    community?.name?.toLowerCase().includes('mankind') ||
                                    event.title?.toLowerCase().includes('support') ||
                                    event.title?.toLowerCase().includes('breathe') ||
                                    event.title?.toLowerCase().includes('talk');
              
              const isWalkOrHike = event.title?.toLowerCase().includes('walk') || 
                                   event.title?.toLowerCase().includes('hike') || 
                                   community?.category?.toLowerCase().includes('walking');

              let levelDescription = "Welcoming, beginner-friendly, and accessible. No prior experience or special equipment needed - come along and participate at your own pace.";
              if (isPeerSupport) {
                levelDescription = "A safe, informal, and relaxed environment. Sit with fellow local men over tea and coffee. There is zero pressure to share or speak - you are very welcome to just listen and take it in.";
              } else if (isWalkOrHike) {
                levelDescription = "Gentle, conversational group pace along established paths. Suitable for all fitness levels with regular pauses to chat. Nobody gets left behind.";
              } else if (level === 'Beginner') {
                levelDescription = "Gentle introduction with full guidance from the leader. Ideal for first-timers and anyone returning to the activity.";
              } else if (level === 'Intermediate') {
                levelDescription = "Moderate pace and active movement. A reasonable baseline fitness or comfort with the activity is recommended.";
              } else if (level === 'Challenging' || level === 'Advanced') {
                levelDescription = "Brisk pace or sustained physical activity. Good stamina and appropriate gear recommended.";
              }

              return (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '22px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--white)', margin: 0, fontSize: '1.1rem' }}>
                      <Activity size={18} color="#ec4899" /> What to Expect
                    </h4>
                    <span style={{ padding: '4px 12px', background: 'rgba(236,72,153,0.12)', color: '#f9a8d4', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(236,72,153,0.25)' }}>
                      {level}
                    </span>
                  </div>

                  <p style={{ color: 'var(--slate-200)', fontSize: '0.92rem', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                    {event.whatToExpect || levelDescription}
                  </p>

                  {/* Structured Expectation Highlights */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                      <CheckCircle2 size={15} color="#2dd4bf" />
                      <span><strong>Atmosphere:</strong> {isPeerSupport ? 'Confidential & casual' : 'Friendly & social'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                      <CheckCircle2 size={15} color="#2dd4bf" />
                      <span><strong>Pressure:</strong> Zero pressure • Go at your pace</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                      <CheckCircle2 size={15} color="#2dd4bf" />
                      <span><strong>First-Timers:</strong> Very welcome & supported</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* Sticky RSVP Footer */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        padding: '16px 20px', background: 'rgba(2, 6, 23, 0.65)', 
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.1)', 
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {isEventPast(event) ? (
              <>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-400)' }}>
                  Event Ended
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                  Archived • {event.date}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)' }}>
                  {event.ticketPrice > 0 ? `£${event.ticketPrice.toFixed(2)}` : 'Free'}
                </div>
                {event.ticketPrice > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                    No extra booking fees • Secure Stripe card checkout
                  </div>
                )}
                {spotsLeft !== null && (
                  <div style={{ fontSize: '0.8rem', color: spotsLeft < 5 ? 'var(--rose-400)' : 'var(--slate-400)', fontWeight: 600 }}>
                    {spotsLeft === 0 ? 'Sold Out' : `${spotsLeft} spots left`}
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isLeader && (
              <button 
                onClick={() => setShowScanner(true)}
                className="interactive-press"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  color: 'var(--white)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '12px 16px', borderRadius: '99px', fontSize: '1rem', fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <ScanLine size={18} /> Scan
              </button>
            )}
            {isEventPast(event) ? (
              isGoing ? (
                <button
                  onClick={() => setShowTicket(event)}
                  className="interactive-press"
                  style={{
                    background: 'rgba(20,184,166,0.15)',
                    color: 'var(--teal-300)',
                    border: '1px solid rgba(20,184,166,0.3)',
                    padding: '12px 24px', borderRadius: '99px', fontSize: '0.95rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={16} /> View Ticket
                </button>
              ) : (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--slate-400)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '12px 24px', borderRadius: '99px', fontSize: '0.95rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Archive size={16} /> Archived
                </div>
              )
            ) : (
              <>
                {isGoing && (
                  <button
                    onClick={() => setShowTicket({ ...event, isCashOnArrival: isCashAttendee, ticketType: isCashAttendee ? 'cash_on_arrival' : 'paid' })}
                    className="interactive-press"
                    style={{
                      background: 'rgba(20,184,166,0.18)',
                      color: 'var(--teal-300)',
                      border: '1px solid rgba(20,184,166,0.35)',
                      padding: '12px 18px', borderRadius: '99px', fontSize: '0.95rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                  >
                    <Ticket size={16} /> View Pass
                  </button>
                )}
                <button  
                  onClick={!user?.id ? () => router.push(`/login?redirect=/events/${id}`) : (!isMember && !isGoing ? handleJoinAndRSVP : handleRSVP)}
                disabled={checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && Boolean(user?.id))}
                className="interactive-press"
                style={{ 
                  background: isGoing ? 'rgba(255,255,255,0.1)' : 'var(--teal-500)', 
                  color: isGoing ? 'var(--white)' : '#0f172a', 
                  border: isGoing ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  padding: '12px 32px', borderRadius: '99px', fontSize: '1rem', fontWeight: 700, 
                  cursor: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && Boolean(user?.id))) ? 'not-allowed' : 'pointer',
                  opacity: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && Boolean(user?.id))) ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  minWidth: '140px', justifyContent: 'center'
                }}
              >
                {!user?.id ? (event.ticketPrice > 0 ? 'Sign In to Buy Ticket' : 'Sign In to RSVP') :
                 checkoutState === 'processing' ? 'Processing...' : 
                 isGoing ? 'Cancel RSVP' : 
                 spotsLeft === 0 ? 'Sold Out' :
                 !isMember ? 'Join Community to ' + (event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP') :
                 event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP'}
              </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Choice Modal (Card vs Cash at Door) */}
      {showPaymentChoiceModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px',
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            border: '1px solid rgba(45, 212, 191, 0.35)',
            borderRadius: '24px', padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 40px rgba(20, 184, 166, 0.15)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPaymentChoiceModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', color: 'var(--slate-400)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: 'var(--teal-400)'
              }}>
                <Ticket size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>
                Select Payment Option
              </h3>
              <p style={{ color: 'var(--slate-300)', fontSize: '0.88rem', margin: 0 }}>
                Ticket price: <strong style={{ color: 'var(--white)' }}>£{event.ticketPrice.toFixed(2)}</strong> for {event.title}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Option 1: Online Card */}
              <button
                type="button"
                onClick={() => {
                  setShowPaymentChoiceModal(false);
                  executeStripeCheckout();
                }}
                disabled={checkoutState === 'processing'}
                className="interactive-press"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(20, 184, 166, 0.08)',
                  border: '1.5px solid rgba(45, 212, 191, 0.4)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(20, 184, 166, 0.2)', color: 'var(--teal-300)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <CreditCard size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.98rem' }}>Pay Online via Card</span>
                    <span style={{ fontWeight: 800, color: 'var(--teal-300)', fontSize: '0.95rem' }}>£{event.ticketPrice.toFixed(2)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.35 }}>
                    Instant confirmation pass. Fast check-in and digital receipt.
                  </p>
                </div>
              </button>

              {/* Option 2: Cash at Venue */}
              <button
                type="button"
                onClick={executeCashRsvp}
                disabled={checkoutState === 'processing'}
                className="interactive-press"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1.5px solid rgba(245, 158, 11, 0.35)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Banknote size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.98rem' }}>Pay in Cash at Venue</span>
                    <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '0.95rem' }}>£{event.ticketPrice.toFixed(2)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.35 }}>
                    Reserve your spot right now. Please bring exact cash to the organiser upon arrival.
                  </p>
                </div>
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--slate-400)' }}>
              Spot is reserved under your name upon selection.
            </div>
          </div>
        </div>
      )}

      {/* RSVP Success & WhatsApp Welcome Bridge Modal */}
      {showRsvpSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            border: '1px solid rgba(45, 212, 191, 0.35)',
            borderRadius: '24px', padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 40px rgba(20, 184, 166, 0.18)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Ambient teal glow */}
            <div style={{
              position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px',
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)', pointerEvents: 'none'
            }} />

            {/* Success Badge */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', color: '#090d16',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
              }}>
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)' }}>
                You're Going!
              </h3>
              <p style={{ color: 'var(--slate-300)', fontSize: '0.92rem', margin: 0, lineHeight: 1.4 }}>
                Your spot is confirmed for <strong style={{ color: 'var(--white)' }}>{event.title}</strong>
              </p>
            </div>

            {/* Event Summary */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '14px 16px', marginBottom: '20px',
              display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-200)', fontSize: '0.88rem' }}>
                <Calendar size={16} color="var(--teal-400)" style={{ flexShrink: 0 }} />
                <span><strong>{event.date}</strong> at {event.time || '10:00'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-200)', fontSize: '0.88rem' }}>
                <MapPin size={16} color="#ec4899" style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cleanLocationName(event.location)}</span>
              </div>
              {event.meetingPoint && (
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', paddingLeft: '26px' }}>
                  Meeting point: {event.meetingPoint}
                </div>
              )}
            </div>

            {/* Payment Summary Banner */}
            {event.ticketPrice > 0 && (
              <div style={{
                background: isCashAttendee ? 'rgba(245,158,11,0.1)' : 'rgba(20,184,166,0.1)',
                border: isCashAttendee ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(20,184,166,0.35)',
                borderRadius: '14px', padding: '12px 14px', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                {isCashAttendee ? (
                  <>
                    <Banknote size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                        Cash Due at Door: £{event.ticketPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                        Please bring exact cash to the organiser upon arrival. Your spot is reserved.
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} color="#2dd4bf" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2dd4bf' }}>
                        Ticket Paid Online: £{event.ticketPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                        Your digital pass is ready. Show the QR code at check-in.
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* WhatsApp Community Bridge */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--teal-300)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                WhatsApp Community Bridge
              </div>

              {community?.whatsapp_group && (
                <a
                  href={community.whatsapp_group.startsWith('http') ? community.whatsapp_group : `https://${community.whatsapp_group}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-press"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#ffffff', fontWeight: 700, fontSize: '0.92rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    textDecoration: 'none', marginBottom: '8px',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.25)'
                  }}
                >
                  <MessageCircle size={18} /> Join WhatsApp Group & Say Hi
                </a>
              )}

              <a
                href={getWhatsAppShareUrl(event, community?.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: '14px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#4ade80', fontWeight: 600, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  textDecoration: 'none'
                }}
              >
                <Share size={16} /> Share RSVP / Intro to WhatsApp
              </a>
            </div>

            {/* Calendar Sync Options */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
                Add to Your Calendar
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => downloadIcs(event, community?.name)}
                  className="interactive-press"
                  style={{
                    padding: '10px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <Calendar size={15} color="var(--teal-400)" /> Apple / Outlook
                </button>
                <a
                  href={getGoogleCalendarEventUrl(event, community?.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-press"
                  style={{
                    padding: '10px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={15} color="#3b82f6" /> Google Cal
                </a>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowRsvpSuccessModal(false);
                  setShowTicket({ ...event, isCashOnArrival: isCashAttendee, ticketType: isCashAttendee ? 'cash_on_arrival' : 'paid' });
                }}
                className="interactive-press"
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)',
                  color: 'var(--teal-300)', fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Ticket size={16} /> View Pass
              </button>
              <button
                onClick={() => setShowRsvpSuccessModal(false)}
                className="interactive-press"
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--white)', fontSize: '0.9rem', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicket && (
        <DigitalTicket 
          event={showTicket} 
          community={communities.find(c => c.id === showTicket.communityId)}
          user={user}
          userName={user?.name || 'Community Member'} 
          onClose={() => setShowTicket(null)} 
        />
      )}

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner 
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal 
          isOpen={showShareModal} 
          onClose={() => setShowShareModal(false)} 
          title={event?.title || 'Community Event'} 
          text={`Join us for ${event?.title || 'this event'} with ${community?.name || 'More Community'}!`} 
          url={event ? getEventUrl(event, { allEvents: events, origin: typeof window !== 'undefined' ? window.location.origin : undefined }) : ''} 
        />
      )}
    </div>
  );
}
