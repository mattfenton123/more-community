"use client";
import { supabase } from '../../../src/lib/supabaseClient';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Share, MapPin, Calendar, Clock, Users, CheckCircle2, Info, List, Activity, Check, Map, Ticket, DollarSign, Copy, ExternalLink, Navigation, Video, AlertTriangle, Image as ImageIcon, ScanLine, Archive, Repeat, MessageCircle, Banknote, CreditCard, Lock, ChevronRight, X, UserCheck, Shield, ChevronDown, Camera, HelpCircle, MessageSquare, Compass, Trees, WifiOff } from 'lucide-react';
import { useAppContext } from '../../../src/context/AppContext';
import { useToast } from '../../../src/components/Toast';
import DigitalTicket from '../../../src/components/DigitalTicket';
import CarpoolHub from '../../../src/components/CarpoolHub';
import QRScanner from '../../../src/components/QRScanner';
import { isEventPast, isEventUpcoming, isEventToday, downloadIcs, getGoogleCalendarEventUrl, getWhatsAppShareUrl } from '../../../src/lib/calendar';
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

function EventLocationMap({ location, event, isLocationShielded = false }) {
  const [copiedSms, setCopiedSms] = useState(false);
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

  if (isLocationShielded) {
    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="#fbbf24" /> Event Start Location
        </h3>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px dashed rgba(245, 158, 11, 0.4)',
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto',
            color: '#fbbf24'
          }}>
            <Lock size={26} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>
            🔒 Secret Meeting Point & Route Pin
          </div>
          <p style={{ color: 'var(--slate-300)', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
            This event requires host approval. The exact meeting point, live GPS pin, and route directions are kept private to protect the group and will be revealed immediately upon host approval.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', fontSize: '0.82rem', color: 'var(--slate-300)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <MapPin size={14} color="#ec4899" /> General Area: <strong>{areaInfo || 'Tunbridge Wells, Kent'}</strong>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              const coordsStr = coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : (event?.lat && event?.lng ? `${event.lat}, ${event.lng}` : cleanName);
              const text = `${event?.title || 'Community Walk'}\n📍 Start: ${cleanName}${event?.meetingPoint ? ' (Meeting point: ' + event.meetingPoint + ')' : ''}\n🧭 GPS: ${coordsStr}\n/// what3words: ///more.community.trail\n📅 ${event?.date || ''} at ${event?.time || ''}`;
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(text);
                setCopiedSms(true);
                setTimeout(() => setCopiedSms(false), 2500);
              }
            }}
            className="interactive-press"
            title="Copy GPS coordinates and meeting landmark for SMS sharing when there is zero mobile reception"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '10px',
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(56,189,248,0.3)',
              color: '#7dd3fc', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {copiedSms ? (
              <>
                <CheckCircle2 size={14} color="#34d399" />
                <span style={{ color: '#6ee7b7' }}>GPS Copied!</span>
              </>
            ) : (
              <>
                <Compass size={14} /> Copy GPS (SMS Safe)
              </>
            )}
          </button>
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
  const { events, communities, user, users, eventRsvps, rsvpToEvent, updateAttendeeStatus, addEventPhoto, joinCommunity, checkInMember } = useAppContext();
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
  const [hasCheckedInLocally, setHasCheckedInLocally] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [showRsvpPromptModal, setShowRsvpPromptModal] = useState(false);
  const [rsvpGuestName, setRsvpGuestName] = useState('');
  const [rsvpHasGuest, setRsvpHasGuest] = useState(false);
  const [rsvpAnswer, setRsvpAnswer] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const photoInputRef = useRef(null);

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

  // ALL HOOKS MUST RUN UNCONDITIONALLY AT THE TOP LEVEL BEFORE ANY EARLY RETURNS
  const rsvps = event?.id ? (eventRsvps[event.id] || []) : [];
  const confirmedAttendees = useMemo(() => (rsvps || []).filter(r => r.status === 'going'), [rsvps]);

  // Familiar Faces Social Proof (people user has walked with on past events)
  const myPastAttendedEventIds = useMemo(() => {
    if (!user?.id) return new Set();
    const ids = new Set();
    Object.entries(eventRsvps || {}).forEach(([evId, rList]) => {
      if (rList?.some(r => r.userId === user.id && r.status === 'going')) {
        const ev = (events || []).find(e => e.id === evId);
        if (ev && isEventPast(ev)) ids.add(evId);
      }
    });
    return ids;
  }, [user?.id, eventRsvps, events]);

  const familiarCohorts = useMemo(() => {
    const cohorts = new Set();
    myPastAttendedEventIds.forEach(evId => {
      const rList = (eventRsvps || {})[evId] || [];
      rList.forEach(r => {
        if (r.userId !== user?.id && r.status === 'going') {
          cohorts.add(r.userId);
        }
      });
    });
    return cohorts;
  }, [myPastAttendedEventIds, eventRsvps, user?.id]);

  const familiarFaces = useMemo(() => {
    if (!familiarCohorts.size) return [];
    return confirmedAttendees.filter(att => familiarCohorts.has(att.userId));
  }, [confirmedAttendees, familiarCohorts]);

  if (!event || !community) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--slate-400)' }}>Loading event...</div>;
  }

  const myRsvp = rsvps.find(r => r.userId === user?.id);
  const isGoing = myRsvp?.status === 'going';
  const isPendingApproval = myRsvp?.status === 'pending_approval';
  const isWaitlisted = myRsvp?.status === 'waitlist';
  const waitlist = rsvps.filter(r => r.status === 'waitlist');
  const myWaitlistPos = isWaitlisted ? waitlist.findIndex(r => r.userId === user?.id) + 1 : 0;
  const isCashAttendee = myRsvp?.ticketType === 'cash_on_arrival';
  const spotsLeft = event.maxCapacity ? Math.max(0, event.maxCapacity - rsvps.filter(r => r.status === 'going').length) : null;
  const isSoldOut = spotsLeft !== null && spotsLeft <= 0;
  const isMember = user?.joinedCommunities?.includes(event.communityId);

  const requiresHostApproval = Boolean(
    event?.requireApproval || 
    event?.require_approval || 
    (event?.description && event?.description.includes('[Host Approval Required]'))
  );
  const cleanDescription = (event?.description || '').replace(/\[Host Approval Required\]/g, '').trim();
  const canSeeSecretLocation = !requiresHostApproval || isGoing || isLeader;
  const pendingAttendees = (rsvps || []).filter(r => r.status === 'pending_approval');


  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      await addEventPhoto(event.id, file);
      toast.success('Photo Shared! 📸', 'Added to communal event memories.');
    } catch (err) {
      console.error(err);
      toast.error('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

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

  const handleRSVP = async (rsvpOptions = {}) => {
    if (!user?.id) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    if (!isMember && !isGoing && !isPendingApproval) {
      await joinCommunity(event.communityId);
    }
    if (isWaitlisted) {
      await rsvpToEvent(event.id, 'not_going');
      toast.info('Left Waitlist', 'You have been removed from the waitlist.');
      return;
    }
    if (isPendingApproval) {
      await rsvpToEvent(event.id, 'not_going');
      toast.info('Request Withdrawn', 'Your request to join has been cancelled.');
      return;
    }
    if (isSoldOut && !isGoing) {
      await rsvpToEvent(event.id, 'waitlist', 'free', null, rsvpOptions);
      toast.success('Joined Waitlist!', `You are #${waitlist.length + 1} in line. If a spot opens up, we will notify you.`);
      return;
    }
    if (event.ticketPrice > 0 && !isGoing) {
      if (event.allowCash || event.allow_cash) {
        setShowPaymentChoiceModal(true);
        return;
      }
      executeStripeCheckout();
    } else {
      if (requiresHostApproval && !isGoing) {
        await rsvpToEvent(event.id, 'pending_approval', 'free', null, rsvpOptions);
        setShowRsvpPromptModal(false);
        toast.success('Request Sent! ⏳', 'The host will review your request. Exact meeting location will be revealed once approved.');
      } else {
        const newStatus = isGoing ? 'not_going' : 'going';
        await rsvpToEvent(event.id, newStatus, 'free', null, rsvpOptions);
        setShowRsvpPromptModal(false);
        if (newStatus === 'going') {
          setShowRsvpSuccessModal(true);
        } else {
          toast.success('RSVP Cancelled', 'Removed from your schedule');
        }
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


  const isLive = Boolean(event && (isEventToday(event) || searchParams?.get('live') === 'true'));
  const isUserCheckedIn = Boolean(
    hasCheckedInLocally || 
    (event && user?.id && (rsvps || []).some(r => r.userId === user.id && (r.checkedIn || r.checked_in)))
  );

  const handleLiveCheckIn = async () => {
    if (!user?.id) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    try {
      setHasCheckedInLocally(true);
      await checkInMember(event.id, user.id);
      toast.success("You're Checked In!", "Welcome! Look out for the leader and fellow members.");
    } catch (err) {
      console.error('Check-in error:', err);
      toast.error('Check-in Failed', 'Could not record your arrival. Please try again.');
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
      {/* Zero-Signal Trail Mode Banner */}
      {isOffline && (
        <div style={{
          background: 'linear-gradient(90deg, #064e3b 0%, #065f46 100%)',
          color: '#a7f3d0',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          fontWeight: 600,
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trees size={16} color="#34d399" />
            <span>Zero-Signal Trail Mode Active • Event pass & offline GPS ready</span>
          </div>
          <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '99px', color: '#6ee7b7' }}>
            Offline Ready
          </span>
        </div>
      )}

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
      <div className="desktop-event-layout">
        <div className="desktop-event-main">
          {/* Live Meetup Day Radar */}
          {isLive && !isEventPast(event) && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1.5px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '20px',
              padding: '20px 22px',
              marginBottom: '28px',
              boxShadow: '0 10px 30px rgba(34, 197, 94, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="live-radar-dot" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4ade80', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Live Meetup Radar • Happening Today
                  </span>
                  {searchParams?.get('live') === 'true' && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.1)', color: 'var(--slate-300)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      Preview Mode
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#86efac', fontWeight: 700 }}>
                  ⏰ Gathering at {event.time || '10:00 AM'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span>
                  <span>{event.meetingPoint ? `Meeting Point: ${event.meetingPoint}` : `Gathering Point: ${cleanLocationName(event.location)}`}</span>
                </div>
                {event.instructions && (
                  <div style={{ color: 'var(--slate-200)', fontSize: '0.88rem', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '10px' }}>
                    {event.instructions}
                  </div>
                )}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '10px', padding: '10px 14px', color: '#bbf7d0', fontSize: '0.84rem'
                }}>
                  <span>🤝</span>
                  <span><strong>First-timer friendly:</strong> Warmly greeted upon arrival by the leader. Zero pressure, participate at your own pace!</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {isUserCheckedIn ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e',
                    color: '#86efac', fontWeight: 700, fontSize: '0.9rem',
                    padding: '11px 20px', borderRadius: '12px'
                  }}>
                    <CheckCircle2 size={18} color="#22c55e" /> You are Checked In! Welcome to the meetup.
                  </div>
                ) : (
                  <button
                    onClick={handleLiveCheckIn}
                    className="interactive-press"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      border: 'none', color: '#052e16', fontWeight: 800, fontSize: '0.92rem',
                      padding: '11px 22px', borderRadius: '12px', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <span>👋</span> I am Here! (Check In)
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanLocationName(event.location) + ', UK')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-press"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
                    color: 'var(--white)', fontWeight: 600, fontSize: '0.88rem',
                    padding: '11px 18px', borderRadius: '12px', textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Navigation size={16} color="var(--teal-400)" /> 1-Tap Google Directions
                </a>
              </div>
            </div>
          )}
        
        <EventRecapShareCard event={event} community={community} attendeeCount={confirmedAttendees.length} />
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
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '1rem' }}>{canSeeSecretLocation ? cleanLocationName(event.location) : 'Tunbridge Wells, Kent (Exact pin secret)'}</div>
                {canSeeSecretLocation ? (
                  event.meetingPoint ? <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Meet: {event.meetingPoint}</div> : null
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Lock size={12} /> Exact meeting pin revealed upon host approval
                  </div>
                )}
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

        {/* Lu.ma Style: Who's Going Attendee Facepile */}
        {confirmedAttendees.length > 0 && (
          <div 
            onClick={() => setShowAttendeesModal(true)}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '8px 16px',
              borderRadius: '99px',
              cursor: 'pointer',
              marginTop: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {confirmedAttendees.slice(0, 5).map((att, idx) => {
                const u = users.find(x => x.id === att.userId);
                const avatar = u?.avatar || u?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'Member')}`;
                return (
                  <img
                    key={att.userId || idx}
                    src={avatar}
                    alt={u?.name || 'Attendee'}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      border: '2px solid #0f172a',
                      marginLeft: idx === 0 ? 0 : '-10px',
                      objectFit: 'cover',
                      background: '#1e293b'
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--slate-200)' }}>
              <span style={{ color: 'var(--teal-400)', fontWeight: 700 }}>{confirmedAttendees.length}</span> going
              {confirmedAttendees.length > 5 && <span style={{ color: 'var(--slate-400)', fontWeight: 400, marginLeft: '4px' }}>+{confirmedAttendees.length - 5} more</span>}
            </div>
            <ChevronRight size={16} color="var(--slate-400)" />
          </div>
        )}

        {/* Familiar Faces Social Proof Nudge */}
        {familiarFaces.length > 0 && !isGoing && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
            border: '1px solid rgba(45, 212, 191, 0.3)',
            borderRadius: '14px',
            padding: '10px 14px',
            marginTop: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {familiarFaces.slice(0, 3).map((f, i) => {
                const u = users.find(x => x.id === f.userId);
                const av = u?.avatar || u?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'Member')}`;
                return (
                  <img
                    key={f.userId}
                    src={av}
                    alt={u?.name}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: '2px solid #0f172a', marginLeft: i === 0 ? 0 : '-8px',
                      objectFit: 'cover'
                    }}
                  />
                );
              })}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--slate-200)', lineHeight: 1.3 }}>
              <strong style={{ color: 'var(--teal-300)' }}>
                {familiarFaces.length === 1
                  ? `${users.find(x => x.id === familiarFaces[0].userId)?.name || 'Someone'} you walked with before is going!`
                  : `${familiarFaces.length} people you've walked with before are going!`}
              </strong>
            </div>
          </div>
        )}

        {/* Host Approval Queue (Only visible to Leaders/Hosts) */}
        {isLeader && pendingAttendees.length > 0 && (
          <div style={{
            marginTop: '20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>
                <Clock size={18} />
                <span>Host Approval Queue ({pendingAttendees.length})</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Location shielded until approved</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingAttendees.map(att => {
                const u = users.find(x => x.id === att.userId);
                const avatar = u?.avatar || u?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'Member')}`;
                const isProcessing = approvingUserId === att.userId;
                return (
                  <div key={att.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={avatar} alt={u?.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>{u?.name || 'Community Member'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Requested to join</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        disabled={isProcessing}
                        onClick={async () => {
                          setApprovingUserId(att.userId);
                          try {
                            await updateAttendeeStatus(event.id, att.userId, 'going');
                            toast.success('Approved!', `${u?.name || 'Member'} is now approved.`);
                          } catch (err) {
                            toast.error('Error', 'Could not approve request.');
                          } finally {
                            setApprovingUserId(null);
                          }
                        }}
                        style={{ padding: '6px 14px', borderRadius: '99px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: isProcessing ? 0.6 : 1 }}
                      >
                        Approve
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={async () => {
                          setApprovingUserId(att.userId);
                          try {
                            await updateAttendeeStatus(event.id, att.userId, 'declined');
                            toast.info('Declined', 'Request declined.');
                          } catch (err) {
                            toast.error('Error', 'Could not decline request.');
                          } finally {
                            setApprovingUserId(null);
                          }
                        }}
                        style={{ padding: '6px 12px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', opacity: isProcessing ? 0.6 : 1 }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '24px 0' }} />

        {/* Description */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>About this event</h3>
          <p style={{ color: 'var(--slate-300)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-wrap' }}>
            {cleanDescription}
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

        {/* Communal Photo Dump & Memories (Lu.ma style) */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--white)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={20} color="var(--teal-400)" /> Event Memories & Photos
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                Shared communal camera roll for attendees and leaders
              </div>
            </div>
            
            <div>
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => {
                  if (!user?.id) router.push(`/login?redirect=/events/${id}`);
                  else photoInputRef.current?.click();
                }}
                disabled={isUploadingPhoto}
                className="interactive-press"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '99px',
                  background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)',
                  color: 'var(--teal-300)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: isUploadingPhoto ? 'wait' : 'pointer'
                }}
              >
                <Camera size={14} /> {isUploadingPhoto ? 'Uploading...' : '+ Add Photo'}
              </button>
            </div>
          </div>

          {(event.galleryImages && event.galleryImages.length > 0) ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {event.galleryImages.map((imgUrl, pIdx) => (
                <div
                  key={pIdx}
                  onClick={() => setActivePhotoModal(imgUrl)}
                  className="interactive-press"
                  style={{
                    position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1',
                    border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', background: '#0f172a'
                  }}
                >
                  <img src={imgUrl} alt={`Event photo ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '24px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '10px' }}>
                No photos shared yet. Snap moments during the walk and drop them here for the group!
              </div>
              <button
                onClick={() => {
                  if (!user?.id) router.push(`/login?redirect=/events/${id}`);
                  else photoInputRef.current?.click();
                }}
                className="interactive-press"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '99px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--slate-200)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Camera size={14} /> Upload First Photo
              </button>
            </div>
          )}
        </div>


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
          <EventLocationMap location={event.location} event={event} isLocationShielded={!canSeeSecretLocation} />
        )}

        {/* Trail Carpool Hub (Flexible & Privacy-Safe Rides) */}
        <CarpoolHub event={event} user={user} isAttendee={isGoing} community={community} />

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

      {/* Desktop Sticky Booking & Calendar Sidebar */}
      <aside className="desktop-event-sidebar">
        <div style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 29, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Price Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ticket Price
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>
                {event.ticketPrice > 0 ? `£${event.ticketPrice.toFixed(2)}` : 'Free'}
              </div>
            </div>
            {spotsLeft !== null && (
              <div style={{
                padding: '6px 12px', borderRadius: '99px',
                background: spotsLeft === 0 ? 'rgba(239, 68, 68, 0.15)' : spotsLeft < 5 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                border: spotsLeft === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : spotsLeft < 5 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(20, 184, 166, 0.3)',
                color: spotsLeft === 0 ? '#f87171' : spotsLeft < 5 ? '#fb7185' : 'var(--teal-300)',
                fontSize: '0.8rem', fontWeight: 700
              }}>
                {spotsLeft === 0 ? 'Sold Out' : `${spotsLeft} spots remaining`}
              </div>
            )}
          </div>

          {/* Booking Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {isEventPast(event) ? (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '14px', borderRadius: '14px', textAlign: 'center',
                color: 'var(--slate-400)', fontWeight: 600, fontSize: '0.9rem'
              }}>
                <Archive size={16} style={{ display: 'inline', marginRight: '6px' }} /> This event has ended
              </div>
            ) : (
              <>
                <button
                  onClick={!user?.id ? () => router.push(`/login?redirect=/events/${id}`) : (isGoing || isPendingApproval ? handleRSVP : () => setShowRsvpPromptModal(true))}
                  disabled={checkoutState === 'processing'}
                  className="interactive-press"
                  style={{
                    width: '100%',
                    background: isGoing ? 'rgba(255,255,255,0.1)' : isPendingApproval ? 'rgba(245,158,11,0.18)' : 'var(--teal-500)',
                    color: isGoing ? 'var(--white)' : isPendingApproval ? '#fbbf24' : '#0f172a',
                    border: isGoing ? '1px solid rgba(255,255,255,0.2)' : isPendingApproval ? '1px solid rgba(245,158,11,0.35)' : 'none',
                    padding: '14px 20px', borderRadius: '14px', fontSize: '1rem', fontWeight: 800,
                    cursor: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && !isPendingApproval && Boolean(user?.id))) ? 'not-allowed' : 'pointer',
                    opacity: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && !isPendingApproval && Boolean(user?.id))) ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: isGoing ? 'none' : isPendingApproval ? 'none' : '0 4px 20px rgba(20, 184, 166, 0.35)'
                  }}
                >
                  {!user?.id ? (event.ticketPrice > 0 ? 'Sign In to Buy Ticket' : requiresHostApproval ? 'Sign In to Request to Join' : 'Sign In to RSVP') :
                   checkoutState === 'processing' ? 'Processing...' :
                   isGoing ? 'Cancel RSVP' :
                   isPendingApproval ? '⏳ Request Pending (Cancel)' :
                   isWaitlisted ? `On Waitlist #${myWaitlistPos} (Leave)` :
                   isSoldOut ? (waitlist.length > 0 ? `Join Waitlist (${waitlist.length} in line)` : 'Join Waitlist (Full)') :
                   !isMember ? (requiresHostApproval ? 'Join Community & Request' : 'Join Community & ' + (event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP')) :
                   requiresHostApproval ? 'Request to Join (Host Approval)' :
                   event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP Spot'}
                </button>

                {isGoing && (
                  <button
                    onClick={() => setShowTicket({ ...event, isCashOnArrival: isCashAttendee, ticketType: isCashAttendee ? 'cash_on_arrival' : 'paid' })}
                    className="interactive-press"
                    style={{
                      width: '100%',
                      background: 'rgba(20,184,166,0.15)',
                      color: 'var(--teal-300)',
                      border: '1px solid rgba(20,184,166,0.35)',
                      padding: '12px 16px', borderRadius: '14px', fontSize: '0.92rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}
                  >
                    <Ticket size={16} /> View Digital Pass & QR
                  </button>
                )}
              </>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '16px 0' }} />

          {/* Calendar Sync Actions */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Add to Calendar
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => downloadIcs(event, community?.name)}
                className="interactive-press"
                style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                }}
              >
                <Calendar size={14} color="var(--teal-400)" /> Apple / Outlook
              </button>
              <a
                href={getGoogleCalendarEventUrl(event, community?.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={{
                  padding: '10px 12px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={14} color="#3b82f6" /> Google Cal
              </a>
            </div>
          </div>

          {/* WhatsApp Share */}
          <div style={{ marginBottom: '18px' }}>
            <a
              href={getWhatsAppShareUrl(event, community?.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="interactive-press"
              style={{
                width: '100%', padding: '11px 16px', borderRadius: '12px',
                background: 'rgba(37, 211, 102, 0.12)', border: '1px solid rgba(37, 211, 102, 0.3)',
                color: '#4ade80', fontWeight: 700, fontSize: '0.88rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                textDecoration: 'none'
              }}
            >
              <MessageCircle size={16} /> Share via WhatsApp
            </a>
          </div>

          {/* Host Info */}
          {community && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px', padding: '14px',
              display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
            }} onClick={() => router.push(`/community/${community.id}`)}>
              <img
                src={community.image || community.cover_image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80'}
                alt={community.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Host Community</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {community.name}
                </div>
              </div>
              <ChevronLeft size={16} style={{ transform: 'rotate(180deg)', color: 'var(--slate-400)' }} />
            </div>
          )}
        </div>
      </aside>
    </div>

      {/* Sticky RSVP Footer (Mobile only, hidden on desktop >= 1024px) */}
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
                  onClick={!user?.id ? () => router.push(`/login?redirect=/events/${id}`) : (isGoing || isPendingApproval ? handleRSVP : () => setShowRsvpPromptModal(true))}
                  disabled={checkoutState === 'processing'}
                  className="interactive-press"
                  style={{ 
                    background: isGoing ? 'rgba(255,255,255,0.1)' : isPendingApproval ? 'rgba(245,158,11,0.18)' : 'var(--teal-500)', 
                    color: isGoing ? 'var(--white)' : isPendingApproval ? '#fbbf24' : '#0f172a', 
                    border: isGoing ? '1px solid rgba(255,255,255,0.2)' : isPendingApproval ? '1px solid rgba(245,158,11,0.35)' : 'none',
                    padding: '12px 32px', borderRadius: '99px', fontSize: '1rem', fontWeight: 700, 
                    cursor: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && !isPendingApproval && Boolean(user?.id))) ? 'not-allowed' : 'pointer',
                    opacity: (checkoutState === 'processing' || (spotsLeft === 0 && !isGoing && !isPendingApproval && Boolean(user?.id))) ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    minWidth: '140px', justifyContent: 'center'
                  }}
                >
                  {!user?.id ? (event.ticketPrice > 0 ? 'Sign In to Buy Ticket' : requiresHostApproval ? 'Sign In to Request to Join' : 'Sign In to RSVP') :
                   checkoutState === 'processing' ? 'Processing...' : 
                   isGoing ? 'Cancel RSVP' : 
                   isPendingApproval ? '⏳ Request Pending (Cancel)' :
                   spotsLeft === 0 ? 'Sold Out' :
                   !isMember ? (requiresHostApproval ? 'Join & Request' : 'Join Community to ' + (event.ticketPrice > 0 ? 'Buy Ticket' : 'RSVP')) :
                   requiresHostApproval ? 'Request to Join' :
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
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{canSeeSecretLocation ? cleanLocationName(event.location) : 'Tunbridge Wells (Exact pin secret)'}</span>
              </div>
              {canSeeSecretLocation ? (
                event.meetingPoint && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', paddingLeft: '26px' }}>
                    Meeting point: {event.meetingPoint}
                  </div>
                )
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', paddingLeft: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={11} /> Secret meeting point revealed upon approval
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

            {/* Auto-Invite WhatsApp Carpool & Trail Coordination */}
            {(() => {
              const resolvedWa = event?.whatsappGroup || (event?.description?.match(/\[WhatsApp: ([^\]]+)\]/)?.[1] || '') || community?.whatsapp_group || null;
              const waUrl = resolvedWa ? (resolvedWa.startsWith('http') ? resolvedWa : `https://${resolvedWa}`) : null;
              const carpoolOfferMsg = `🚗 Carpool Offer for ${event.title}!\n\nHey everyone, I just booked my ticket for ${event.title} (${event.date} at ${event.time}).\n\nI am driving and have spare seats in my car. If anyone needs a ride, let me know!`;
              const carpoolReqMsg = `🙋 Need a Lift for ${event.title}?\n\nHey everyone, I just got my ticket for ${event.title} (${event.date} at ${event.time}).\n\nIs anyone driving with a spare seat? Happy to chip in for fuel!`;

              return (
                <div style={{ marginBottom: '18px', background: 'rgba(37, 211, 102, 0.06)', border: '1px solid rgba(37, 211, 102, 0.25)', borderRadius: '16px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageCircle size={14} /> Private WhatsApp & Carpool
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(37, 211, 102, 0.2)', color: '#86efac', fontWeight: 700 }}>
                      UNLOCKED
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
                    Coordinate lifts, meet walking buddies, and get live trail updates before setting off.
                  </p>

                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="interactive-press"
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: '#ffffff', fontWeight: 700, fontSize: '0.92rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        textDecoration: 'none', marginBottom: '10px',
                        boxShadow: '0 4px 16px rgba(37, 211, 102, 0.25)'
                      }}
                    >
                      <MessageCircle size={18} /> Join WhatsApp Carpool & Chat
                    </a>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(carpoolOfferMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="interactive-press"
                      style={{
                        padding: '9px 10px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)', fontSize: '0.78rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        textDecoration: 'none'
                      }}
                    >
                      🚗 Offer a Ride
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(carpoolReqMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="interactive-press"
                      style={{
                        padding: '9px 10px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--slate-200)', fontSize: '0.78rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                        textDecoration: 'none'
                      }}
                    >
                      🙋 Need a Ride
                    </a>
                  </div>
                </div>
              );
            })()}

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

      {/* Who's Going Attendee Modal (Lu.ma style) */}
      {showAttendeesModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', maxHeight: '80vh',
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '24px', padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
                  Who&apos;s Going
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                  {confirmedAttendees.length} {confirmedAttendees.length === 1 ? 'attendee' : 'attendees'} confirmed
                </div>
              </div>
              <button
                onClick={() => setShowAttendeesModal(false)}
                className="interactive-press"
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {confirmedAttendees.map(att => {
                const u = users.find(x => x.id === att.userId);
                const isHost = u?.id === event.host_id || u?.id === event.hostId;
                const avatar = u?.avatar || u?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'Member')}`;
                return (
                  <div key={att.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={avatar} alt={u?.name || 'Member'} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: '#1e293b' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u?.name || 'Community Member'}
                          {isHost && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', fontWeight: 700 }}>HOST</span>}
                          {att.guestName && (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(56,189,248,0.2)', color: '#7dd3fc', fontWeight: 600 }}>
                              +1 {att.guestName}
                            </span>
                          )}
                        </div>
                        {att.answer && (
                          <div style={{ fontSize: '0.76rem', color: '#fbbf24', marginTop: '2px' }}>
                            &ldquo;{att.answer}&rdquo;
                          </div>
                        )}
                        {u?.bio && !att.answer && <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.bio}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* RSVP Options Modal (Guest Pass + Micro-Question) */}
      {showRsvpPromptModal && (
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
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--white)', margin: 0 }}>
                  {requiresHostApproval ? 'Request to Join' : 'Confirm Your Spot'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                  {event.title}
                </div>
              </div>
              <button
                onClick={() => setShowRsvpPromptModal(false)}
                className="interactive-press"
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Host Micro-Question */}
            {event.rsvpQuestion && (
              <div style={{ marginBottom: '18px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal-300)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <HelpCircle size={14} /> Host Question
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 600, marginBottom: '8px' }}>
                  {event.rsvpQuestion}
                </div>
                <input
                  type="text"
                  placeholder="Your answer (e.g. Vegetarian, bringing puppy, beginner)..."
                  value={rsvpAnswer}
                  onChange={e => setRsvpAnswer(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--white)', fontSize: '0.88rem', outline: 'none'
                  }}
                />
              </div>
            )}

            {/* +1 Guest Pass (Lu.ma viral loop) */}
            <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="var(--teal-400)" /> Bring a +1 / Guest Pass
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                    Reserve a spot for a friend without requiring them to sign up
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={rsvpHasGuest}
                  onChange={e => setRsvpHasGuest(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--teal-500)', cursor: 'pointer' }}
                />
              </label>

              {rsvpHasGuest && (
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Friend's first name (e.g. Sarah)..."
                    value={rsvpGuestName}
                    onChange={e => setRsvpGuestName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(45,212,191,0.3)',
                      color: 'var(--white)', fontSize: '0.88rem', outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => handleRSVP({
                guestName: rsvpHasGuest ? rsvpGuestName.trim() : null,
                answer: rsvpAnswer.trim()
              })}
              className="interactive-press"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--teal-500), #3b82f6)',
                color: '#0f172a', fontWeight: 700, fontSize: '0.98rem', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <CheckCircle2 size={18} /> {requiresHostApproval ? 'Send Join Request ⏳' : 'Confirm RSVP ✓'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Photo Modal */}
      {activePhotoModal && (
        <div
          onClick={() => setActivePhotoModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100001,
            background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={activePhotoModal} alt="Event memory" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '16px' }} />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <a
                href={activePhotoModal}
                download="event-memory.jpg"
                target="_blank"
                rel="noreferrer"
                className="interactive-press"
                style={{ padding: '8px 16px', borderRadius: '99px', background: 'var(--teal-500)', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
              >
                Download Photo
              </a>
              <button
                onClick={() => setActivePhotoModal(null)}
                style={{ padding: '8px 16px', borderRadius: '99px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
