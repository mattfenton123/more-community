"use client";
import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle, Users } from 'lucide-react';
import { useToast } from './Toast';
import { isEventPast } from '../lib/calendar';

export default function EventRecapShareCard({ event, community, attendeeCount = 0 }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const eventTitle = event?.title || 'Community Meetup';
  const communityName = community?.name || event?.communityName || 'Local Community';
  const location = event?.location || 'Tunbridge Wells';
  const isPast = isEventPast(event);
  const rawCount = typeof attendeeCount === 'number'
    ? attendeeCount
    : (Array.isArray(event?.attendees) ? event.attendees.length : (typeof event?.attendeeCount === 'number' ? event.attendeeCount : 0));
  const count = Math.max(0, rawCount);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/events/${event?.id}`
    : `https://morecommunity.co.uk/events/${event?.id}`;

  const defaultShareText = isPast
    ? `Great meetup at ${eventTitle} with ${communityName} in ${location}! Check out photos and join future events here: ${shareUrl}`
    : `Join us for ${eventTitle} with ${communityName} in ${location}! RSVP and see details here: ${shareUrl}`;

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied! ✓', `${label} copied to clipboard.`);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      toast.error('Copy failed', 'Please copy manually.');
    }
  };

  const openWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultShareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="event-recap-share-card" style={{
      background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(15,23,42,0.7) 100%)',
      border: '1px solid rgba(45,212,191,0.3)',
      borderRadius: '18px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        width: '90px',
        height: '90px',
        background: 'radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(45,212,191,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf'
          }}>
            <Share2 size={16} />
          </div>
          <span className="card-title" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--white)', letterSpacing: '0.02em' }}>
            {isPast ? 'Event Memories & Social Share' : 'Invite & Share with Friends'}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--slate-300)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
        {isPast
          ? 'Celebrate this community gathering. Share photos and the event link directly to WhatsApp groups and social channels.'
          : 'Spread the word for this upcoming event! Share the invite directly to WhatsApp groups and local friends.'}
      </p>

      {/* Mini Event Summary Card */}
      <div className="event-recap-mini-card" style={{
        background: 'rgba(2,6,23,0.7)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="event-title" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {eventTitle}
          </div>
          <div className="event-meta" style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{communityName}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Users size={12} color="#2dd4bf" /> {isPast ? (count > 0 ? `${count} attended` : 'Completed event') : (count > 0 ? `${count} going` : 'Be the first to RSVP')}
            </span>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={openWhatsApp}
          className="btn interactive-press"
          style={{
            flex: 1,
            background: '#25D366',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <MessageCircle size={16} /> Share to WhatsApp
        </button>

        <button
          onClick={() => copyText(defaultShareText, 'Share link')}
          className="btn btn-outline interactive-press"
          style={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.82rem',
            padding: '10px 14px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          {copied ? <Check size={16} color="#2dd4bf" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
