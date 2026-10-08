"use client";
import React, { useState } from 'react';
import { X, Check, Copy, MessageCircle, Calendar, MapPin, ExternalLink, Ticket } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useToast } from './Toast';

export default function EventCreatedShareModal({ event, experience, onClose }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const bookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${event.id}`
    : `https://www.morecommunity.app/events/${event.id}`;

  const shareText = `Tickets & RSVPs are now live for ${event.title} on More Community! 🎟️\nDate: ${event.date} at ${event.time}\nSpots: ${event.maxCapacity || 15} available\n\nRSVP & see details here: ${bookingUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link Copied!', 'Shareable booking link copied to clipboard.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(10px)',
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--slate-900)',
        border: '1px solid rgba(20,184,166,0.3)',
        width: '100%', maxWidth: '480px',
        borderRadius: '24px', padding: '24px',
        color: 'var(--white)', textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Top Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.4)',
          color: 'var(--teal-300)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Ticket size={32} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', margin: '0 0 6px', color: 'var(--white)' }}>
          Trip Booking Link is Live!
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Your community event has been published. Share the direct booking link with your members so they can grab tickets via Stripe.
        </p>

        {/* Event Preview Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '14px', marginBottom: '20px', textAlign: 'left'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--white)', marginBottom: '8px' }}>
            {event.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} color="var(--teal-400)" />
              <span>{event.date} at {event.time}</span>
            </div>
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="var(--teal-400)" />
                <span>{event.location}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--slate-400)' }}>Member Ticket:</span>
              <span style={{ color: 'var(--teal-300)', fontWeight: 700, fontSize: '0.95rem' }}>£{event.ticketPrice}</span>
            </div>
          </div>
        </div>

        {/* Sharing Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: '#25D366', color: '#000', padding: '14px', borderRadius: '12px',
              fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none'
            }}
          >
            <MessageCircle size={18} /> Share to WhatsApp Group
          </a>

          <button
            onClick={handleCopy}
            className="btn btn-outline interactive-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '12px', fontSize: '0.88rem'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Booking Link Copied!' : 'Copy Direct Booking Link'}
          </button>
        </div>

        {/* Secondary Links */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            onClick={() => {
              onClose();
              navigate.push(`/events/${event.id}`);
            }}
            className="btn btn-primary"
            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.85rem' }}
          >
            View Event Page
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '10px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--slate-400)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
