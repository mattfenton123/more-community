"use client";
import React, { useState } from 'react';
import { Bell, Calendar, Clock, MapPin, X } from 'lucide-react';

export default function EventReminderModal({
  event,
  eventRsvps = {},
  onClose,
  sendEventReminder,
  toast
}) {
  const [customMessage, setCustomMessage] = useState(() => {
    if (!event) return '';
    const dateFormatted = event.date 
      ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) 
      : 'soon';
    return `Looking forward to seeing you at ${event.title} on ${dateFormatted}${event.time ? ' at ' + event.time : ''}! Please reach out in the group if you have any questions.`;
  });
  const [isSending, setIsSending] = useState(false);

  if (!event) return null;

  const confirmedAttendees = (eventRsvps[event.id] || []).filter(r => r.status === 'going' || !r.status);

  const handleSend = async () => {
    try {
      setIsSending(true);
      const res = await sendEventReminder(event.id, customMessage);
      if (toast) {
        toast({
          title: 'Reminder Broadcasted! ⏰',
          description: res.count > 0 
            ? `Notification successfully delivered to ${res.count} attendee${res.count > 1 ? 's' : ''}.`
            : 'No registered attendees to notify yet.',
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to send reminder:', err);
      if (toast) {
        toast({
          title: 'Failed to Send Reminder',
          description: err.message || 'Please try again later.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', border: '1px solid rgba(56,189,248,0.25)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(56,189,248,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>Send Event Reminder</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Broadcast to registered attendees</div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="interactive-press" 
            style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Event card pill */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem', marginBottom: '6px' }}>
              {event.title}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="var(--teal-400)" /> {event.date}
              </span>
              {event.time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {event.time}
                </span>
              )}
              {event.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {event.location}
                </span>
              )}
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>Recipients:</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                {confirmedAttendees.length} confirmed attendee(s)
              </span>
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '8px' }}>
              Reminder Message
            </label>
            <textarea 
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder="Enter a custom reminder message for attendees..."
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: 'var(--white)', padding: '12px', fontSize: '0.88rem', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              <span>Sent via in-app notification & device push alert</span>
              <span>{customMessage.length} chars</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '6px' }}>
              Quick Presets
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                onClick={() => {
                  const d = event.date || 'soon';
                  setCustomMessage(`Looking forward to seeing you at ${event.title} on ${d}! Please check details & arrive a few minutes early.`);
                }}
                className="btn btn-outline interactive-press"
                style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '8px' }}
              >
                ⏰ Standard 24h
              </button>
              <button 
                type="button"
                onClick={() => {
                  setCustomMessage(`Quick update for ${event.title}: Meeting point is at ${event.location || 'the venue'}. Look out for the more. sign!`);
                }}
                className="btn btn-outline interactive-press"
                style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '8px' }}
              >
                📍 Meeting Point
              </button>
              <button 
                type="button"
                onClick={() => {
                  setCustomMessage(`Can't make it to ${event.title}? Please update your RSVP in the app so waitlisted members can take your spot. Thank you!`);
                }}
                className="btn btn-outline interactive-press"
                style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '8px' }}
              >
                🔄 RSVP Update
              </button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
          <button 
            onClick={onClose}
            className="btn btn-outline interactive-press"
            style={{ padding: '10px 18px', fontSize: '0.85rem', borderRadius: '12px' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending || !customMessage.trim()}
            className="btn btn-primary interactive-press"
            style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderColor: '#0284c7' }}
          >
            <Bell size={15} />
            {isSending ? 'Sending Broadcast...' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
}
