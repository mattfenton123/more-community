"use client";
import Link from 'next/link';
import { Compass, Calendar, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px 20px',
      textAlign: 'center',
      color: 'var(--white)'
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '50%',
        background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', color: 'var(--teal-400)'
      }}>
        <Compass size={36} />
      </div>

      <div style={{
        fontSize: '0.8rem', fontWeight: 800, color: 'var(--teal-400)',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px'
      }}>
        404 — Page Not Found
      </div>

      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '2rem',
        fontWeight: 800,
        margin: '0 0 12px 0',
        letterSpacing: '-0.02em'
      }}>
        Off the Beaten Track
      </h1>

      <p style={{
        maxWidth: '420px',
        color: 'var(--slate-400)',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        margin: '0 0 28px 0'
      }}>
        This page or event link seems to have moved or no longer exists. Let's get you back to the communities and events happening near you.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/discover"
          className="btn btn-primary interactive-press"
          style={{
            padding: '12px 24px',
            borderRadius: '99px',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}
        >
          <Compass size={18} /> Discover Communities
        </Link>
        <Link
          href="/events"
          style={{
            padding: '12px 24px',
            borderRadius: '99px',
            fontSize: '0.95rem',
            fontWeight: 600,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--white)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
          }}
          className="interactive-press"
        >
          <Calendar size={18} /> Browse Events
        </Link>
      </div>
    </div>
  );
}
