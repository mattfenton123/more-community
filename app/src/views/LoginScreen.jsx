"use client";
import { useState } from 'react';
import { Mail, ArrowRight, Users, Calendar, MessageCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FALLBACK_IMAGES, LAUNCH_CITY } from '../lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

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
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        setError(resetError.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
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
            Find your people in {LAUNCH_CITY}
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

        {/* Login / Reset form */}
        <div style={{ width: '100%' }}>
          {isForgotPassword ? (
            <div style={{ marginBottom: '20px' }}>
              {resetEmailSent ? (
                <div style={{
                  background: 'rgba(20,184,166,0.1)',
                  border: '1px solid rgba(20,184,166,0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '16px',
                }}>
                  <CheckCircle2 size={32} color="#22c55e" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ color: 'var(--white)', fontSize: '1.1rem', margin: '0 0 6px 0', fontWeight: 700 }}>Reset link sent!</h3>
                  <p style={{ color: 'var(--slate-300)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                    Check your inbox at <strong>{email}</strong> for instructions to reset your password.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                    <p style={{ color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: 1.4 }}>
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
                      <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--white)', fontSize: '1rem', outline: 'none' }} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email.trim()}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      borderRadius: '14px',
                      padding: '16px',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      opacity: (!email.trim() || isLoading) ? 0.4 : 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'} <ArrowRight size={20} />
                  </button>
                </form>
              )}

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuth} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
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

              {!isSignUp && (
                <div style={{ textAlign: 'right', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--slate-400)', fontSize: '0.82rem', cursor: 'pointer', padding: '2px 4px' }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

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
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={20} />
              </button>
            </form>
          )}

          {!isForgotPassword && (
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
          )}

          {error && (
            <p style={{ color: 'var(--red-400)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 0' }}>
            <div style={{ display: 'flex' }}>
              {[
                { initials: 'TW', bg: 'linear-gradient(135deg, #14b8a6, #0d9488)' },
                { initials: 'SJ', bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
                { initials: 'AC', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
                { initials: 'MF', bg: 'linear-gradient(135deg, #ec4899, #be185d)' }
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid var(--slate-950)',
                    marginLeft: i > 0 ? '-8px' : 0,
                    background: item.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {item.initials}
                </div>
              ))}
            </div>
            <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Join 120+ members in {LAUNCH_CITY}</span>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--slate-600)', fontSize: '0.7rem', marginTop: '12px', lineHeight: 1.5 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
