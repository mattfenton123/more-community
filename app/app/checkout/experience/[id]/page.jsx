"use client";
import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../../../src/context/AppContext';
import { 
  ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, Ticket, 
  MapPin, Clock, Calendar, Users, ExternalLink, Sparkles, 
  ChevronRight, Check, AlertCircle, Info 
} from 'lucide-react';
import { useToast } from '../../../../src/components/Toast';
import { isAffiliateExperience, buildAffiliateUrl } from '../../../../src/lib/experiencePricing';

export default function ExperienceCheckout() {
  const { id } = useParams();
  const router = useRouter();
  const { experiences, communities, user } = useAppContext();
  const { toast } = useToast();
  
  const exp = experiences?.find(e => e.id === id || e.productCode === id);
  const community = exp ? communities?.find(c => c.id === exp.communityId || c.id === exp.promotedBy) : null;

  // Booking details state
  const defaultDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [checkoutState, setCheckoutState] = useState('idle'); // idle, processing, success
  const [bookingRef, setBookingRef] = useState('');

  if (!exp) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)', color: 'var(--white)', padding: '20px', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--rose-400)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px' }}>Experience Not Found</h2>
        <p style={{ color: 'var(--slate-400)', maxWidth: '360px', marginBottom: '20px' }}>
          This experience may have been unlisted or the link is expired.
        </p>
        <button onClick={() => router.back()} className="btn btn-primary interactive-press" style={{ padding: '12px 24px', borderRadius: '12px' }}>
          Go Back
        </button>
      </div>
    );
  }

  // Price calculations (Option B for Viator/TourRadar uses More Group Host Pass)
  const isAffiliate = isAffiliateExperience(exp);
  const providerLabel = exp.provider || (String(exp.productUrl || '').includes('tourradar') ? 'TourRadar' : 'Viator');
  const guideEstimate = Math.round(Number(exp.supplierBase || exp.basePrice || 35));
  const singlePrice = isAffiliate
    ? Math.max(0, Number(exp.hostPassPrice ?? exp.suggestedHostPass ?? 15))
    : exp.basePrice + Math.round(exp.basePrice * ((exp.leaderMarkup ?? 15) / 100));
  const totalPrice = singlePrice * guestCount;
  const trackedProviderUrl = isAffiliate && exp.productUrl
    ? buildAffiliateUrl(exp.productUrl, { communityId: community?.id || exp.communityId, leaderId: user?.id, experienceId: exp.id })
    : null;

  // Resolve sensible venue location/address if imported from Google Places or generic
  const venueLocation = useMemo(() => {
    if (exp.location && !exp.location.toLowerCase().includes('south east')) {
      return exp.location;
    }
    if (exp.title.toLowerCase().includes('hotel du vin')) {
      return 'Hotel Du Vin & Bistro, Crescent Road, Tunbridge Wells, TN1 2LY';
    }
    if (exp.title.toLowerCase().includes('axe throwing')) {
      return 'UK Axe Throwing Centre, Eridge Park, Tunbridge Wells, TN3 9JT';
    }
    return exp.location || 'Tunbridge Wells & High Weald Area';
  }, [exp.location, exp.title]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueLocation)}`;

  // Quick preset dates
  const quickDates = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i * 2);
      list.push({
        iso: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        formatted: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      });
    }
    return list;
  }, []);

  const timeSlots = [
    { time: '11:00', label: '11:00 AM (Morning)' },
    { time: '14:00', label: '2:00 PM (Afternoon)' },
    { time: '16:30', label: '4:30 PM (Late Afternoon)' },
    { time: '18:30', label: '6:30 PM (Evening)' }
  ];

  const handleCheckout = () => {
    setCheckoutState('processing');
    const randomCode = 'MORE-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
    setBookingRef(randomCode);

    setTimeout(() => {
      setCheckoutState('success');
      toast.success('Booking Confirmed!', `Reference: ${randomCode}`);
    }, 1200);
  };

  const formattedBookingDate = useMemo(() => {
    if (!selectedDate) return 'Selected Date';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    return selectedDate;
  }, [selectedDate]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--slate-950)', color: 'var(--white)', paddingBottom: '60px' }}>
      
      {/* Top Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 600 }}>
          <ShieldCheck size={16} /> Official Booking Checkout
        </div>
      </div>

      {checkoutState === 'success' ? (
        /* ══════════════════════════════════════════════════════ */
        /* CONFIRMATION SCREEN                                    */
        /* ══════════════════════════════════════════════════════ */
        <div style={{ maxWidth: '560px', margin: '2rem auto', padding: '0 20px', animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '24px', padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.15)', border: '2px solid var(--teal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--teal-400)' }}>
              <CheckCircle2 size={36} />
            </div>

            <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', fontWeight: 700 }}>
              RESERVATION CONFIRMED
            </span>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, margin: '12px 0 6px', color: '#fff' }}>
              {isAffiliate ? 'Group Host Pass Reserved!' : "You're Booked In!"}
            </h2>
            <p style={{ color: 'var(--slate-300)', fontSize: '0.9rem', margin: '0 0 20px', lineHeight: 1.5 }}>
              {isAffiliate
                ? <>Step 1 complete! Your More Group Host Pass is reserved for <strong>{exp.title}</strong> with {community?.name || 'your community host'}. Next, book your own direct ticket (~£{guideEstimate}) on {providerLabel} via our tracked group link.</>
                : <>Your place has been reserved for <strong>{exp.title}</strong> with {community?.name || 'your community host'}. A booking confirmation and calendar pass has been sent to your email.</>}
            </p>

            {/* Ticket Pass Container */}
            <div style={{ background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '18px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed rgba(255,255,255,0.15)', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Booking Code</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--teal-300)', letterSpacing: '0.04em' }}>{bookingRef}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700 }}>Total Paid</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>£{totalPrice}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Calendar size={16} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{formattedBookingDate}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Time: {selectedTime} ({exp.duration || '2.5 hours'})</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{venueLocation}</div>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--teal-400)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                      Get Directions on Google Maps <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                  <div style={{ color: 'var(--slate-300)' }}>
                    <strong>{guestCount} Guest{guestCount > 1 ? 's' : ''}</strong> registered under your name
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isAffiliate && trackedProviderUrl && (
                <a
                  href={trackedProviderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary interactive-press"
                  style={{ width: '100%', padding: '13px', borderRadius: '12px', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  Step 2: Book Own Ticket on {providerLabel} (~£{guideEstimate}) <ExternalLink size={16} />
                </a>
              )}
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline interactive-press"
                style={{ width: '100%', padding: '13px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', textDecoration: 'none' }}
              >
                <MapPin size={16} /> Open Venue Location in Maps
              </a>

              <button 
                onClick={() => router.push(exp.communityId ? `/community/${exp.communityId}` : '/discover')} 
                className="btn btn-primary interactive-press" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                Return to Community
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════ */
        /* MAIN CHECKOUT EXPERIENCE                               */
        /* ══════════════════════════════════════════════════════ */
        <div style={{ maxWidth: '640px', margin: '1.5rem auto', padding: '0 16px' }}>
          
          {/* Experience Hero Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ height: '180px', position: 'relative' }}>
              <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,6,23,0.9) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '99px', background: 'rgba(20, 184, 166, 0.25)', color: 'var(--teal-300)', fontWeight: 700, backdropFilter: 'blur(6px)', border: '1px solid rgba(20, 184, 166, 0.4)' }}>
                  {exp.category || 'Curated Experience'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-300)', background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '8px' }}>
                  {exp.provider || 'Google Places Partner'}
                </span>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px', color: '#fff', lineHeight: 1.3 }}>
                {exp.title}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span>Curated for {community?.name || 'Community'}</span>
                <span>•</span>
                <span style={{ color: 'var(--teal-300)' }}>
                  {isAffiliate ? `£${singlePrice} Host Pass (+ ~£${guideEstimate} ${providerLabel} ticket direct)` : `£${singlePrice} per person`}
                </span>
              </div>
            </div>
          </div>

          {/* ── STEP 1: WHEN (DATE & TIME) ── */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Calendar size={18} color="var(--teal-400)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>
                1. Choose Date & Session Time
              </h3>
            </div>

            {/* Quick Date Chips */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Upcoming Session Dates:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                {quickDates.map(item => {
                  const isSelected = selectedDate === item.iso;
                  return (
                    <button
                      key={item.iso}
                      type="button"
                      onClick={() => setSelectedDate(item.iso)}
                      className="interactive-press"
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        border: `1.5px solid ${isSelected ? 'var(--teal-400)' : 'rgba(255,255,255,0.08)'}`,
                        background: isSelected ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: isSelected ? '#fff' : 'var(--slate-300)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: isSelected ? 'var(--teal-300)' : 'var(--slate-400)', fontWeight: 600 }}>{item.dayName}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, marginTop: '2px' }}>{item.formatted}</div>
                    </button>
                  );
                })}
              </div>

              {/* Or custom date picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>Or pick custom date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--slate-900)',
                    border: '1px solid var(--slate-700)',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Time Slot Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Select Time Slot:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {timeSlots.map(slot => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className="interactive-press"
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        border: `1.5px solid ${isSelected ? 'var(--teal-400)' : 'rgba(255,255,255,0.08)'}`,
                        background: isSelected ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: isSelected ? '#fff' : 'var(--slate-300)',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 700 : 500
                      }}
                    >
                      <Clock size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px', color: isSelected ? 'var(--teal-400)' : 'var(--slate-500)' }} />
                      {slot.time} ({slot.label.split(' ')[1].replace(/[()]/g, '')})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── STEP 2: WHERE (VENUE & LOCATION DETAILS) ── */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MapPin size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>
                2. Venue Location & Directions
              </h3>
            </div>

            <div style={{ background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>
                {venueLocation}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.45 }}>
                {exp.description || 'Exclusive community package including private lounge reservation and host welcome.'}
              </div>

              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  Duration: <strong>{exp.duration || '2.5 hours'}</strong>
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.78rem', color: '#38bdf8', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Open in Google Maps <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Arrival Instruction */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.45 }}>
              <Info size={14} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Please arrive 10 minutes prior to your selected time slot. Show your More booking code at the venue reception desk.
              </span>
            </div>
          </div>

          {/* ── STEP 3: GUEST COUNT ── */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>
                    3. Number of Guests
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Includes full entry and reservation</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)', borderRadius: '12px', padding: '4px 10px' }}>
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="interactive-press"
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 8px' }}
                >
                  -
                </button>
                <span style={{ fontSize: '1rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                  {guestCount}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.min(8, guestCount + 1))}
                  className="interactive-press"
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 8px' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* ── STEP 4: ORDER SUMMARY & PAYMENT ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 14px', color: '#fff' }}>
              Order & Price Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-300)' }}>
                <span>{isAffiliate ? `More Group Host Pass` : exp.title} ({guestCount} guest{guestCount > 1 ? 's' : ''}):</span>
                <span>£{singlePrice} × {guestCount}</span>
              </div>
              {isAffiliate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                  <span>Step 2 Own Ticket on {providerLabel} (paid direct later):</span>
                  <span style={{ color: '#fcd34d' }}>~£{guideEstimate} × {guestCount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                <span>Booking Guarantee & Merchant Fees:</span>
                <span style={{ color: 'var(--teal-400)' }}>Included (£0.00)</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>Total Due Now:</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--teal-400)' }}>
                  £{totalPrice}
                </span>
              </div>
            </div>

            {/* Payment Selector */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '12px', padding: '12px 14px' }}>
                <CreditCard size={22} color="var(--teal-400)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Apple Pay / Google Pay / Card</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Instant 1-tap checkout via Stripe Secure Escrow</div>
                </div>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--teal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} color="#000" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', color: 'var(--slate-400)', fontSize: '0.8rem', marginBottom: '16px' }}>
              <ShieldCheck size={15} color="var(--teal-400)" />
              100% money-back guarantee if canceled up to 24h prior
            </div>

            {/* Pay Button */}
            <button 
              onClick={handleCheckout} 
              disabled={checkoutState === 'processing'}
              className="btn btn-primary interactive-press" 
              style={{ 
                width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 700,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                opacity: checkoutState === 'processing' ? 0.7 : 1
              }}
            >
              {checkoutState === 'processing' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Confirming Booking...
                </span>
              ) : (
                `Pay £${totalPrice} & Reserve Experience`
              )}
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
