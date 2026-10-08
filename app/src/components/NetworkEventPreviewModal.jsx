"use client";
import React from 'react';
import { Calendar, Clock, MapPin, Users, Ticket, ExternalLink, X, Plus, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NetworkEventPreviewModal({
  event,
  sourceCommunity,
  onClose,
  onCoHost,
  isCoHosting
}) {
  const router = useRouter();

  if (!event) return null;

  const dateFormatted = event.date 
    ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }) 
    : 'Upcoming Event';

  const priceBadge = (event.ticketPrice || event.ticket_price) > 0 
    ? `£${event.ticketPrice || event.ticket_price}` 
    : 'Free Event';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          borderRadius: '24px',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(20, 184, 166, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'rgba(20, 184, 166, 0.15)',
              color: 'var(--teal-400)',
              padding: '4px 10px',
              borderRadius: '99px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Network Event Details
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="interactive-press" 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cover Image if available */}
          {event.image && (
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              background: 'rgba(0,0,0,0.4)'
            }}>
              <img 
                src={event.image} 
                alt={event.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)'
              }} />
            </div>
          )}

          {/* Title */}
          <div>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '1.3rem',
              color: 'var(--white)',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.3
            }}>
              {event.title}
            </h2>

            {/* Source Community Pill */}
            {sourceCommunity && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                fontSize: '0.8rem',
                color: 'var(--slate-300)'
              }}>
                <span style={{ color: 'var(--slate-500)' }}>Organised by:</span>
                <span style={{ fontWeight: 600, color: 'var(--teal-300)' }}>{sourceCommunity.name}</span>
                <button
                  type="button"
                  onClick={() => router.push(`/community/${sourceCommunity.id}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teal-400)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    marginLeft: '2px'
                  }}
                  title="View host community page"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Calendar size={18} color="var(--teal-400)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' }}>{dateFormatted}</div>
              </div>
            </div>

            {event.time && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Clock size={18} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Time</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' }}>{event.time}</div>
                </div>
              </div>
            )}

            {event.location && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <MapPin size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Location</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' }}>{event.location}</div>
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Ticket size={18} color="#a855f7" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Admission</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' }}>{priceBadge}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--slate-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              Event Description
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              color: 'var(--slate-200)',
              whiteSpace: 'pre-wrap'
            }}>
              {event.description || 'No detailed description provided by the host community.'}
            </div>
          </div>

          {/* Co-hosting Benefit Callout */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(56, 189, 248, 0.05) 100%)',
            border: '1px dashed rgba(20, 184, 166, 0.3)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldCheck size={20} color="var(--teal-400)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
              <strong>How Co-Hosting Works:</strong> Adding this event automatically syncs it to your community calendar so your members can see and attend.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <button
            type="button"
            onClick={() => window.open(`/events/${event.id}`, '_blank')}
            className="btn btn-outline interactive-press"
            style={{
              padding: '9px 14px',
              fontSize: '0.8rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ExternalLink size={14} /> View Public Page
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline interactive-press"
              style={{
                padding: '9px 16px',
                fontSize: '0.82rem',
                borderRadius: '10px'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onCoHost(event)}
              disabled={isCoHosting}
              className="btn btn-primary interactive-press"
              style={{
                padding: '9px 18px',
                fontSize: '0.82rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                borderColor: '#0d9488'
              }}
            >
              <Plus size={15} />
              {isCoHosting ? 'Adding to Calendar...' : 'Promote to My Community'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
