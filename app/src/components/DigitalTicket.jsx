import { useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Clock, Ticket } from 'lucide-react';
import QRCode from 'qrcode';

export default function DigitalTicket({ event, user, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && event && user) {
      const ticketData = JSON.stringify({
        type: 'more_ticket',
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        eventTitle: event.title,
        ts: Date.now()
      });
      
      QRCode.toCanvas(canvasRef.current, ticketData, {
        width: 180,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#00000000'
        }
      });
    }
  }, [event, user]);

  if (!event || !user) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
      <div style={{ 
        width: '100%', maxWidth: '360px',
        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Ticket Header */}
        <div style={{ padding: '24px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-400)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              <Ticket size={14} /> Event Ticket
            </div>
            <img src="/logo.png" alt="more." style={{ height: '16px' }} />
          </div>
          <button onClick={onClose} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Event Info */}
        <div style={{ padding: '0 24px 20px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'white', margin: '0 0 16px 0', lineHeight: 1.2 }}>{event.title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-300)', fontSize: '0.9rem' }}>
              <Calendar size={16} color="var(--teal-400)" />
              <span>{event.date} • {event.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-300)', fontSize: '0.9rem' }}>
              <MapPin size={16} color="var(--teal-400)" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div style={{ position: 'relative', height: '24px' }}>
          <div style={{ position: 'absolute', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--slate-950)' }}></div>
          <div style={{ position: 'absolute', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--slate-950)' }}></div>
          <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', position: 'absolute', left: '20px', right: '20px', top: '50%' }}></div>
        </div>

        {/* QR Code Section */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '16px', 
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '16px'
          }}>
            <canvas ref={canvasRef}></canvas>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{user.name}</div>
            <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>Show this to the event organiser</div>
          </div>
        </div>
      </div>
    </div>
  );
}
