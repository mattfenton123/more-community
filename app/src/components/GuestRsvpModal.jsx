"use client";
import { useState } from 'react';
import { Check, X, Calendar, MapPin, Users, Mail, User, Share2, ExternalLink, Ticket, ArrowRight, MessageCircle } from 'lucide-react';
import { getGoogleCalendarUrl, generateIcsDataUri } from '../lib/calendarInvite';
import { useAppContext } from '../context/AppContext';

export default function GuestRsvpModal({ event, isOpen, onClose, onSuccess }) {
  const { theme, refreshData } = useAppContext();
  const isLight = theme === 'light';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmedData, setConfirmedData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !event) return null;

  const rsvpQuestion = event.rsvpQuestion || (event.description?.match(/\[RSVP Question: ([^\]]+)\]/)?.[1] || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/events/guest-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          name: name.trim(),
          email: email.trim(),
          guestName: hasPlusOne ? guestName.trim() : null,
          guestEmail: hasPlusOne ? guestEmail.trim() : null,
          answer: answer.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit RSVP.');
      }

      setConfirmedData(data);
      if (refreshData) refreshData();
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://morecommunity.app/events/${event.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const eventLink = typeof window !== 'undefined' ? window.location.href : `https://morecommunity.app/events/${event.id}`;
  const shareText = encodeURIComponent(`I'm going to ${event.title} on ${event.date}! Come along with me: ${eventLink}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const googleCalUrl = getGoogleCalendarUrl(event);
  const icsDataUri = generateIcsDataUri(event);

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          animation: 'slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          padding: 0
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
          background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(13, 148, 136, 0.15)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ticket size={16} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
              {confirmedData ? 'Ticket Confirmed' : 'Reserve Spot & Meeting Point'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="interactive-press"
            style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {confirmedData ? (
            /* STEP 2: CONFIRMATION & FLYWHEEL */
            <div>
              <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Check size={32} strokeWidth={3} />
                </div>
                <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: isLight ? '#0f172a' : '#ffffff' }}>
                  You're going!
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: isLight ? '#64748b' : 'var(--slate-400)' }}>
                  A confirmation ticket has been sent to <strong>{confirmedData.attendeeEmail}</strong>.
                </p>
                <div style={{ display: 'inline-block', marginTop: '8px', padding: '3px 10px', borderRadius: '6px', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', fontSize: '0.75rem', fontWeight: 700, color: '#0d9488' }}>
                  {confirmedData.ticketNumber}
                </div>
              </div>

              {/* Meeting Point Box */}
              <div style={{
                background: isLight ? '#f0fdfa' : 'rgba(13, 148, 136, 0.1)',
                border: isLight ? '1px solid #99f6e4' : '1px solid rgba(13, 148, 136, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Meeting Point
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '6px' }}>
                  {event.location}
                </div>
                <div style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : 'var(--slate-300)' }}>
                  {event.date} at {event.time}
                </div>
              </div>

              {/* Add to Calendar Section */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-press"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                >
                  <Calendar size={15} /> Add to Google Cal
                </a>
                <a
                  href={icsDataUri}
                  download={`${event.title || 'event'}.ics`}
                  className="interactive-press"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)',
                    color: isLight ? '#0f172a' : '#ffffff',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                >
                  <Calendar size={15} /> Apple / Outlook
                </a>
              </div>

              {/* Viral Growth Box: WhatsApp Referral */}
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '14px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a', marginBottom: '4px' }}>
                  🤝 Events are better with company!
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: isLight ? '#475569' : 'var(--slate-400)' }}>
                  Invite a friend or share with your group in 1 tap:
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="interactive-press"
                    style={{
                      background: '#22c55e',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="interactive-press"
                    style={{
                      background: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Share2 size={13} /> {copiedLink ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline interactive-press"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem' }}
              >
                Done
              </button>
            </div>
          ) : (
            /* STEP 1: GUEST RSVP INPUT FORM */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: isLight ? '#0f172a' : '#ffffff' }}>
                  {event.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#64748b' : 'var(--slate-400)' }}>
                  Enter your details to receive your digital ticket and exact meeting point.
                </p>
              </div>

              {error && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.78rem' }}>
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#334155' : 'var(--slate-300)', marginBottom: '4px' }}>
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                    background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#334155' : 'var(--slate-300)', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                    background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : 'var(--slate-500)', marginTop: '2px', display: 'block' }}>
                  We'll email your pass & meeting point. No password required.
                </span>
              </div>

              {/* +1 Guest Pass */}
              <div style={{
                background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.03)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#0d9488" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff' }}>
                      Bring a friend (+1 Guest Pass)?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasPlusOne}
                    onChange={e => setHasPlusOne(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#0d9488', cursor: 'pointer' }}
                  />
                </label>

                {hasPlusOne && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Friend's Name"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                        background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.82rem'
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Friend's Email (to send them their meeting point)"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                        background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
                        color: isLight ? '#0f172a' : '#ffffff',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Host's Custom Micro-Question */}
              {rsvpQuestion && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#334155' : 'var(--slate-300)', marginBottom: '4px' }}>
                    Host Question: &ldquo;{rsvpQuestion}&rdquo;
                  </label>
                  <input
                    type="text"
                    placeholder="Your answer (optional)"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                      background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.2)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary interactive-press"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 15px rgba(13, 148, 136, 0.4)'
                }}
              >
                {isLoading ? 'Reserving...' : 'Confirm Spot & Get Meeting Point →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
