import { useEffect, useRef, useState } from 'react';
import { X, Calendar, MapPin, Clock, Ticket, WifiOff, CheckCircle2, Navigation, Download, Copy, Share2, Sparkles, Users, Banknote, Compass, ShieldCheck, QrCode, MessageCircle } from 'lucide-react';
import QRCode from 'qrcode';
import InfoExplainer from './InfoExplainer';
import { cleanLocationName, formatShareLocation, parseLocationCoords } from '../lib/location';

export default function DigitalTicket({ event, community, user, onClose }) {
  const canvasRef = useRef(null);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [cachedQrUrl, setCachedQrUrl] = useState(null);

  // Monitor online / offline network status
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

  // Generate QR Code & persist offline ticket pass
  useEffect(() => {
    if (!event || !user) return;

    const storageKey = `more_ticket_${event.id}_${user.id}`;
    
    // Check if we already cached this ticket locally
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.qrDataUrl) {
          setCachedQrUrl(parsed.qrDataUrl);
        }
      }
    } catch (err) {}

    if (canvasRef.current) {
      const ticketPayload = JSON.stringify({
        type: 'more_ticket',
        eventId: event.id,
        userId: user.id,
        userName: user.name || 'Member',
        eventTitle: event.title,
        communityId: event.communityId,
        date: event.date,
        time: event.time,
        ts: Date.now()
      });

      QRCode.toCanvas(canvasRef.current, ticketPayload, {
        width: 190,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#00000000'
        }
      }, (err) => {
        if (!err && canvasRef.current) {
          try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            setCachedQrUrl(dataUrl);

            // Save complete ticket record to localStorage for 100% offline trail access
            const ticketRecord = {
              id: `${event.id}_${user.id}`,
              eventId: event.id,
              userId: user.id,
              userName: user.name || 'Member',
              eventTitle: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              meetingPoint: event.meetingPoint || '',
              communityName: community?.name || event.communityName || 'more. community',
              communityImage: community?.image || event.image || '/logo.png',
              collabCommunityIds: event.collabCommunityIds || [],
              qrDataUrl: dataUrl,
              cachedAt: new Date().toISOString()
            };

            localStorage.setItem(storageKey, JSON.stringify(ticketRecord));

            // Also maintain master offline tickets registry
            const registry = JSON.parse(localStorage.getItem('more_offline_tickets_index') || '[]');
            if (!registry.includes(storageKey)) {
              registry.unshift(storageKey);
              localStorage.setItem('more_offline_tickets_index', JSON.stringify(registry.slice(0, 30)));
            }
          } catch (e) {
            console.warn('Could not cache ticket locally:', e);
          }
        }
      });
    }
  }, [event, user, community]);

  if (!event || !user) return null;

  const handleSaveToWallet = () => {
    if (!cachedQrUrl) return;
    try {
      const link = document.createElement('a');
      link.download = `more-pass-${event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
      link.href = cachedQrUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Pass Saved!', { body: `${event.title} digital pass saved for offline access.` });
      }
    } catch (e) {
      console.warn('Wallet save:', e);
    }
  };

  const parsedPin = parseLocationCoords(event.location) || (event.lat && event.lng ? { lat: event.lat, lng: event.lng } : null);
  const cleanTicketLoc = formatShareLocation(event.location, 'See map directions');
  const emergencyCoordsText = `${event.title}\n📍 Location: ${event.meetingPoint ? event.meetingPoint + ' (' + cleanTicketLoc + ')' : cleanTicketLoc}\n🧭 GPS: ${parsedPin ? `${Number(parsedPin.lat).toFixed(5)}, ${Number(parsedPin.lng).toFixed(5)}` : 'Tunbridge Wells'}\n/// what3words: ///more.community.trail\n👤 Attendee: ${user.name || 'Member'}${event.guestName ? ' (+1 ' + event.guestName + ')' : ''}`;

  const handleCopyEmergencyInfo = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(emergencyCoordsText);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    }
  };

  const resolvedWhatsApp = event?.whatsappGroup || (event?.description?.match(/\[WhatsApp: ([^\]]+)\]/)?.[1] || '') || community?.whatsapp_group || null;

  const handleCopyDirections = () => {
    const textToCopy = `${event.title}\n📍 Meeting Point: ${event.meetingPoint || cleanTicketLoc}\n📅 ${event.date} at ${event.time}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2500);
    }
  };

  const handleDownloadTicket = () => {
    if (cachedQrUrl) {
      const a = document.createElement('a');
      a.href = cachedQrUrl;
      a.download = `ticket-${event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${parsedPin ? `${parsedPin.lat},${parsedPin.lng}` : encodeURIComponent(cleanLocationName(event.location) || 'Tunbridge Wells')}`;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 10000 }}>
      <div 
        className="fade-in"
        style={{ 
          width: '100%', maxWidth: '380px',
          background: 'linear-gradient(150deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '26px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          position: 'relative'
        }}
      >
        {/* Zero-Signal Offline Ready Banner */}
        <div style={{
          padding: '8px 16px',
          background: isOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(13, 148, 136, 0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isOffline ? '#fca5a5' : '#5eead4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOffline ? <WifiOff size={13} /> : <CheckCircle2 size={13} />}
            <span>{isOffline ? 'Offline Mode Active' : 'Cached for Offline Access'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Local Pass
            </span>
            <InfoExplainer explainerKey="member_ticket" size={12} />
          </div>
        </div>

        {/* Ticket Header */}
        <div style={{ padding: '20px 24px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              <Ticket size={14} /> Official Event Pass
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {community?.image && (
                <img src={community.image} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <span style={{ color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600 }}>
                {community?.name || 'more. community'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="interactive-press" 
            style={{ 
              background: 'rgba(255,255,255,0.08)', 
              border: 'none', 
              color: 'var(--slate-400)', 
              cursor: 'pointer', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Co-Host Badge if joint event */}
        {event.collabCommunityIds && event.collabCommunityIds.length > 0 && (
          <div style={{ padding: '0 24px 12px' }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', 
              padding: '4px 10px', borderRadius: '99px',
              background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
              fontSize: '0.72rem', color: '#7dd3fc', fontWeight: 600
            }}>
              <Users size={12} /> Joint Community Co-Host Event
            </div>
          </div>
        )}

        {/* Event Info */}
        <div style={{ padding: '0 24px 16px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--white)', margin: '0 0 14px 0', lineHeight: 1.25 }}>
            {event.title}
          </h2>

          {/* Guest Pass indicator */}
          {(event.guestName || user?.guestName) && (
            <div style={{ marginBottom: '10px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 10px', borderRadius: '99px',
                background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                color: '#7dd3fc', fontSize: '0.75rem', fontWeight: 700
              }}>
                <Users size={12} /> Includes +1 Guest: {event.guestName || user?.guestName}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-300)', fontSize: '0.88rem' }}>
              <Calendar size={15} color="var(--teal-400)" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--slate-300)', fontSize: '0.88rem' }}>
              <MapPin size={15} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span>{formatShareLocation(event.location, 'Location TBA')}</span>
                {event.meetingPoint && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--amber-300)', marginTop: '2px', fontWeight: 500 }}>
                    Meeting point: {event.meetingPoint}
                  </div>
                )}
              </div>
            </div>
          </div>

          {event.ticketPrice > 0 && (
            <div style={{ marginTop: '12px' }}>
              {(event.isCashOnArrival || event.ticketType === 'cash_on_arrival') ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '99px',
                  background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
                  color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700
                }}>
                  <Banknote size={14} /> Cash Due at Door: £{event.ticketPrice.toFixed(2)}
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '99px',
                  background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.35)',
                  color: '#2dd4bf', fontSize: '0.78rem', fontWeight: 700
                }}>
                  <CheckCircle2 size={14} /> Paid Online &bull; £{event.ticketPrice.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Perforated Divider */}
        <div style={{ position: 'relative', height: '24px' }}>
          <div style={{ position: 'absolute', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--slate-950)' }}></div>
          <div style={{ position: 'absolute', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--slate-950)' }}></div>
          <div style={{ borderTop: '2px dashed rgba(255,255,255,0.15)', position: 'absolute', left: '20px', right: '20px', top: '50%' }}></div>
        </div>

        {/* QR Code Section */}
        <div style={{ padding: '12px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.06)', 
            borderRadius: '20px', 
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px'
          }}>
            <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '0.95rem' }}>{user.name || 'Member'}</div>
            <div style={{ color: 'var(--slate-400)', fontSize: '0.78rem', marginTop: '2px' }}>
              Present this code to the organiser at check-in
            </div>
          </div>

          {/* Wallet Pass Download Button */}
          <div style={{ width: '100%', marginBottom: '8px' }}>
            <button
              onClick={handleSaveToWallet}
              className="interactive-press"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(20,184,166,0.2) 0%, rgba(56,189,248,0.15) 100%)',
                border: '1px solid rgba(45,212,191,0.35)',
                color: '#2dd4bf', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700
              }}
            >
              <Download size={14} /> Save Pass to Wallet (Offline Ready)
            </button>
          </div>

          {/* Unlocked WhatsApp Carpool & Chat for Ticket Holders */}
          {resolvedWhatsApp && (
            <div style={{ width: '100%', marginBottom: '8px' }}>
              <a
                href={resolvedWhatsApp.startsWith('http') ? resolvedWhatsApp : `https://${resolvedWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.18) 0%, rgba(18,140,126,0.18) 100%)',
                  border: '1px solid rgba(37,211,102,0.35)',
                  color: '#4ade80', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700
                }}
              >
                <MessageCircle size={14} /> Join WhatsApp Carpool & Group Chat
              </a>
            </div>
          )}

          {/* Quick Actions for Outdoor Trails */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
            <a 
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="interactive-press"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px 12px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--slate-200)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600
              }}
            >
              <Navigation size={13} color="var(--teal-400)" /> Directions
            </a>

            <button
              onClick={handleCopyEmergencyInfo}
              className="interactive-press"
              title="Copy GPS coordinates and meeting landmark for SMS sharing when there is zero mobile data"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '9px 12px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--slate-200)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
              }}
            >
              {copiedCoords ? (
                <>
                  <CheckCircle2 size={13} color="#22c55e" />
                  <span style={{ color: '#86efac' }}>Copied SMS!</span>
                </>
              ) : (
                <>
                  <Compass size={13} color="var(--teal-400)" />
                  <span>Copy GPS (SMS)</span>
                </>
              )}
            </button>
          </div>

          {cachedQrUrl && (
            <button
              onClick={handleDownloadTicket}
              className="interactive-press"
              style={{
                marginTop: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--slate-400)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={11} /> Save Pass to Device / Photos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
