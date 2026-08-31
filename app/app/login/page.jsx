"use client";
import { useState } from 'react';
import { Mail, ArrowRight, Users, Calendar, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { FALLBACK_IMAGES } from '../../src/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithEmail, signUpWithEmail, signInWithDemo } = useAuth();
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isSignUp && !name.trim())) return;
    setIsLoading(true);
    setError('');
    
    let authError;
    if (isSignUp) {
      const { error } = await signUpWithEmail(email, password, name);
      authError = error;
    } else {
      const { error } = await signInWithEmail(email, password);
      authError = error;
    }
    
    if (authError) {
      setError(authError.message);
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  const handleDemo = async () => {
    setIsLoading(true);
    const { error: authError } = await signInWithDemo();
    if (authError) {
      setError(authError.message);
    } else {
      router.push('/');
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--slate-950)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full-bleed hero background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '55%',
        background: `url(${FALLBACK_IMAGES.general})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.6) 50%, rgba(2,6,23,1) 100%)',
        }} />
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1,
        maxWidth: '420px',
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Logo & tagline area */}
        <div style={{ marginBottom: '32px', textAlign: 'center', width: '100%' }}>
          <img src={`/images/logo.webp`} alt="more." style={{ height: '32px', marginBottom: '16px', opacity: 0.9 }} />
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.4rem',
            fontWeight: 700,
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, var(--white) 0%, var(--slate-300) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            Find your people in Tunbridge Wells
          </h1>
          
          {/* Value proposition labels */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '16px', marginBottom: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--slate-400)', letterSpacing: '0.02em' }}>
              <Calendar size={14} style={{ color: 'var(--teal-400)', opacity: 0.7 }} /> Discover Events
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--slate-400)', letterSpacing: '0.02em' }}>
              <MessageCircle size={14} style={{ color: 'var(--teal-400)', opacity: 0.7 }} /> Chat Locally
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--slate-400)', letterSpacing: '0.02em' }}>
              <Users size={14} style={{ color: 'var(--teal-400)', opacity: 0.7 }} /> Meet IRL
            </span>
          </div>
        </div>

        {/* Login form */}
        <div style={{ width: '100%' }}>
          <form onSubmit={handleAuth} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {isSignUp && (
                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
                  <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '1rem', outline: 'none' }} />
                </div>
              )}
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '1rem', outline: 'none' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
                <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '1rem', outline: 'none' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim() || (isSignUp && !name.trim())}
              className="btn btn-primary"
              style={{
                width: '100%',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '1.05rem',
                fontWeight: 600,
                opacity: (!email.trim() || !password.trim() || isLoading) ? 0.4 : 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontWeight: 600, fontSize: '0.9rem', marginLeft: '8px', cursor: 'pointer' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          {error && (
            <p style={{ color: 'var(--red-400)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'var(--slate-500)', fontSize: '0.8rem', fontWeight: 500 }}>Quick Demo</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Developer Demo Login */}
          <button
            onClick={handleDemo}
            disabled={isLoading}
            className="btn btn-outline interactive-press"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '0.95rem',
              opacity: isLoading ? 0.5 : 1,
              marginBottom: '16px',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
            1-Click Demo Login
          </button>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 0' }}>
            <div style={{ display: 'flex' }}>
              {['https://i.pravatar.cc/40?img=1', 'https://i.pravatar.cc/40?img=2', 'https://i.pravatar.cc/40?img=3', 'https://i.pravatar.cc/40?img=4'].map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--slate-950)', marginLeft: i > 0 ? '-8px' : 0, objectFit: 'cover' }} />
              ))}
            </div>
            <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Join 120+ members in Tunbridge Wells</span>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--slate-600)', fontSize: '0.7rem', marginTop: '12px', lineHeight: 1.5 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
