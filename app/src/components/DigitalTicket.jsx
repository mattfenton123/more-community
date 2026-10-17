import { useEffect, useRef, useState } from 'react';
import { X, Calendar, MapPin, Clock, Ticket, WifiOff, CheckCircle2, Navigation, Download, Copy, Share2, Sparkles, Users } from 'lucide-react';
import QRCode from 'qrcode';

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

  const handleCopyDirections = () => {
    const textToCopy = `${event.title}\n📍 Meeting Point: ${event.meetingPoint || event.location}\n📅 ${event.date} at ${event.time}`;
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

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location || 'Tunbridge Wells')}`;

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
            <span>{isOffline ? 'Offline Mode Active' : 'Cached for Zero-Signal Trails'}</span>
          </div>
          <span style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Local Pass
          </span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-300)', fontSize: '0.88rem' }}>
              <Calendar size={15} color="var(--teal-400)" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--slate-300)', fontSize: '0.88rem' }}>
              <MapPin size={15} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span>{event.location}</span>
                {event.meetingPoint && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--amber-300)', marginTop: '2px', fontWeight: 500 }}>
                    Meeting point: {event.meetingPoint}
                  </div>
                )}
              </div>
            </div>
          </div>
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
              onClick={handleCopyDirections}
              className="interactive-press"
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
                  <span style={{ color: '#86efac' }}>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} color="var(--teal-400)" />
                  <span>Copy Info</span>
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
