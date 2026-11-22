"use client";
import { useState, useMemo } from 'react';
import {
  MapPin,
  CheckCircle2,
  Navigation,
  Hash,
  Ticket,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { parseLocationCoords, findKnownLocation } from '../lib/location';
import {
  haversineDistanceMeters,
  getEventCheckInCode,
  isWithinProximityCheckInWindow,
  extractVenuePerk,
} from '../lib/inPersonGraph';

const PROXIMITY_RADIUS_METERS = 250;

export default function ProximityCheckInCard({
  event,
  user,
  isCheckedIn,
  arrivalBeacon = null,
  onVerifiedCheckIn,
  onOpenPass,
}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'too_far' | 'gps_error' | 'code_error'
  const [statusMsg, setStatusMsg] = useState('');
  const [verifiedNote, setVerifiedNote] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeValue, setCodeValue] = useState('');

  const eventCoords = useMemo(() => {
    if (!event) return null;
    const parsed =
      parseLocationCoords(event.location) ||
      (event.lat && event.lng ? { lat: Number(event.lat), lng: Number(event.lng) } : null);
    if (parsed) return parsed;
    const known = findKnownLocation(event.location) || (event.title ? findKnownLocation(event.title) : null);
    return known ? { lat: known.lat, lng: known.lng } : null;
  }, [event]);

  const inWindow = useMemo(() => isWithinProximityCheckInWindow(event), [event]);
  const expectedCode = useMemo(() => getEventCheckInCode(event), [event]);
  const venuePerk = useMemo(() => extractVenuePerk(event?.description), [event?.description]);

  if (!event?.id || !user?.id) return null;
  if (!inWindow && !isCheckedIn) return null;

  // Already checked in — crystal clear green state so members know they don't need to re-scan QR
  if (isCheckedIn) {
    return (
      <div
        style={{
          marginBottom: '20px',
          padding: '14px 16px',
          borderRadius: '16px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1.5px solid rgba(16, 185, 129, 0.42)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#16a34a',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={19} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803D' }}>
              You&apos;re Checked In! {verifiedNote ? `· ${verifiedNote}` : ''}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
              No need to scan a QR code — your attendance is verified{venuePerk ? ' & your venue perk is unlocked' : ''}.
            </div>
          </div>
        </div>
        {onOpenPass && (
          <button
            type="button"
            onClick={onOpenPass}
            className="interactive-press"
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#16a34a',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
            }}
          >
            <Ticket size={14} /> View Verified Pass
          </button>
        )}
      </div>
    );
  }

  const handleGpsCheckIn = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('gps_error');
      setStatusMsg('Location is not available in this browser — enter the host’s 4-digit check-in code instead.');
      setShowCodeInput(true);
      return;
    }

    const targets = [
      arrivalBeacon?.coords ? { ...arrivalBeacon.coords, label: "the host's live pin" } : null,
      eventCoords ? { ...eventCoords, label: 'the meeting point' } : null,
    ].filter(Boolean);

    if (targets.length === 0) {
      setStatus('gps_error');
      setStatusMsg('No GPS pin set for this venue — enter the host’s 4-digit check-in code below.');
      setShowCodeInput(true);
      return;
    }

    setStatus('locating');
    setStatusMsg('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let closestDist = Infinity;
        let closestLabel = 'the venue';

        for (const t of targets) {
          const d = haversineDistanceMeters(latitude, longitude, t.lat, t.lng);
          if (d < closestDist) {
            closestDist = d;
            closestLabel = t.label;
          }
        }

        if (closestDist <= PROXIMITY_RADIUS_METERS) {
          setVerifiedNote(`Verified On-Site (${closestDist}m from ${closestLabel})`);
          setStatus('idle');
          if (onVerifiedCheckIn) {
            await onVerifiedCheckIn(`Verified On-Site (${closestDist}m away)`);
          }
        } else {
          const distText =
            closestDist >= 1000 ? `${(closestDist / 1000).toFixed(1)} km` : `${closestDist}m`;
          setStatus('too_far');
          setStatusMsg(
            `You appear to be ${distText} from ${closestLabel}. GPS check-in unlocks within ${PROXIMITY_RADIUS_METERS}m — or enter the host's 4-digit code if GPS is drifting indoors.`
          );
          setShowCodeInput(true);
        }
      },
      () => {
        setStatus('gps_error');
        setStatusMsg('Could not access GPS location — enter the host’s 4-digit table/trail code below.');
        setShowCodeInput(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const entered = codeValue.replace(/\D/g, '').trim();
    if (entered === expectedCode) {
      setStatus('idle');
      setStatusMsg('');
      setVerifiedNote('Verified via Host Code');
      if (onVerifiedCheckIn) {
        await onVerifiedCheckIn('Verified via Host 4-Digit Code');
      }
    } else {
      setStatus('code_error');
      setStatusMsg('That 4-digit code does not match — double-check with the host.');
    }
  };

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '16px',
        borderRadius: '16px',
        background: 'var(--surface-card)',
        border: '1.5px solid rgba(235, 87, 56, 0.36)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--brand-accent-soft)',
              color: 'var(--brand-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Proximity Check-In Active
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
              Arrived at the meetup? Check in instantly
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', marginTop: '1px' }}>
              Verifies you&apos;re within {PROXIMITY_RADIUS_METERS}m of {arrivalBeacon?.coords ? "the host's live pin" : 'the venue'} — no queue needed.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={status === 'locating'}
            onClick={handleGpsCheckIn}
            className="btn btn-primary interactive-press"
            style={{
              padding: '9px 15px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {status === 'locating' ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Checking GPS...
              </>
            ) : (
              <>
                <MapPin size={14} /> I&apos;m Here — Check In
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCodeInput((v) => !v)}
            className="interactive-press"
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: 'var(--ink-secondary)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Hash size={13} /> Host Code
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '7px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: status === 'code_error' ? 'rgba(220, 38, 38, 0.10)' : 'rgba(217, 119, 6, 0.10)',
            border: status === 'code_error' ? '1px solid rgba(220, 38, 38, 0.28)' : '1px solid rgba(217, 119, 6, 0.28)',
            fontSize: '0.78rem',
            color: status === 'code_error' ? '#dc2626' : '#b45309',
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{statusMsg}</span>
        </div>
      )}

      {showCodeInput && (
        <form
          onSubmit={handleCodeSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--hairline-border)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>
            Indoors / weak GPS? Enter the host&apos;s 4-digit code:
          </span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 4829"
            value={codeValue}
            onChange={(e) => setCodeValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
            style={{
              width: '104px',
              padding: '7px 12px',
              borderRadius: '10px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: 'var(--ink-primary)',
              fontSize: '0.92rem',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textAlign: 'center',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={codeValue.length !== 4}
            className="btn btn-primary interactive-press"
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#FFFFFF',
              opacity: codeValue.length === 4 ? 1 : 0.5,
            }}
          >
            Verify Code
          </button>
        </form>
      )}
    </div>
  );
}
