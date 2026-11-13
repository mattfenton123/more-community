"use client";
import { useState } from 'react';
import { Mail, Check, BellRing, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function TownAlertCard({ town = 'your area', style = {} }) {
  const { theme } = useAppContext();
  const isLight = theme === 'light';
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'town_alert',
          town: town
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to subscribe');
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Error subscribing');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div 
        className="glass-panel" 
        style={{ 
          padding: '20px', 
          textAlign: 'center', 
          borderRadius: '16px',
          background: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)',
          border: isLight ? '1px solid #bbf7d0' : '1px solid rgba(16, 185, 129, 0.25)',
          ...style 
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#fff', marginBottom: '8px' }}>
          <Check size={20} strokeWidth={3} />
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', marginBottom: '4px' }}>
          You're on the list for {town}!
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: isLight ? '#475569' : 'var(--slate-400)' }}>
          We'll send you an invitation the moment a new meetup, walk, or group launches near {town}.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '20px', 
        borderRadius: '16px',
        background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
        border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.04)' : '0 10px 30px rgba(0,0,0,0.2)',
        ...style 
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <BellRing size={16} color="#0d9488" />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Expansion Alerts
        </span>
      </div>

      <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: isLight ? '#0f172a' : '#ffffff', fontWeight: 800 }}>
        Want to know when groups meet in {town}?
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: isLight ? '#64748b' : 'var(--slate-400)', lineHeight: 1.45 }}>
        Get a quick email alert when new clubs, social walks, or community events are scheduled in {town}.
      </p>

      {error && (
        <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.75rem', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input 
          type="email"
          required
          placeholder="Enter your email address..."
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            flex: '1 1 200px',
            padding: '10px 14px',
            borderRadius: '10px',
            border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)',
            background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.25)',
            color: isLight ? '#0f172a' : '#ffffff',
            fontSize: '0.85rem'
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary interactive-press"
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: '#0d9488',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {isLoading ? 'Saving...' : 'Notify Me'}
        </button>
      </form>
    </div>
  );
}
