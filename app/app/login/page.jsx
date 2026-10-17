"use client";
import { useState } from 'react';
import { Mail, ArrowRight, Users, Calendar, MessageCircle, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { FALLBACK_IMAGES, LAUNCH_CITY } from '../../src/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signInWithEmail, signUpWithEmail, resetPassword, resendConfirmationEmail } = useAuth();
  const router = useRouter();

  const formatAuthError = (err) => {
    if (!err) return null;
    const msg = typeof err === 'string' ? err : err.message || '';
    const lower = msg.toLowerCase();
    if (lower.includes('error sending confirmation email')) {
      return {
        title: 'Email Confirmation Unavailable',
        message: 'Supabase could not dispatch the confirmation email (built-in email rate limit reached). To log in immediately, ask an administrator to disable "Confirm email" in the Supabase Dashboard (Auth > Providers > Email), or configure a custom SMTP provider.',
        isEmailRateLimit: true,
      };
    }
    if (lower.includes('error sending recovery email')) {
      return {
        title: 'Recovery Email Failed',
        message: 'Could not send the password reset email due to provider rate limits. Please try again shortly or contact support.',
        isEmailRateLimit: true,
      };
    }
    if (lower.includes('email not confirmed')) {
      return {
        title: 'Email Not Confirmed',
        message: 'Your email address has not been verified yet. Please check your inbox or spam folder for your confirmation link.',
        isUnconfirmed: true,
      };
    }
    if (lower.includes('invalid login credentials')) {
      return {
        title: 'Sign In Failed',
        message: 'Invalid email or password. Please verify your credentials and try again.',
      };
    }
    return {
      title: 'Authentication Error',
      message: msg,
    };
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isSignUp && !name.trim())) return;
    setIsLoading(true);
    setError(null);
    setResendNotice('');
    
    if (isSignUp) {
      const { data, error: authErr } = await signUpWithEmail(email, password, name);
      if (authErr) {
        setError(formatAuthError(authErr));
        setIsLoading(false);
        return;
      }
      if (data?.session) {
        router.push('/app');
      } else {
        // Confirmation email required
        setSignUpEmailSent(true);
      }
    } else {
      const { data, error: authErr } = await signInWithEmail(email, password);
      if (authErr) {
        setError(formatAuthError(authErr));
        setIsLoading(false);
        return;
      }
      router.push('/app');
    }
    setIsLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    setResendNotice('');
    try {
      const { error: resendErr } = await resendConfirmationEmail(email.trim());
      if (resendErr) {
        setError(formatAuthError(resendErr));
      } else {
        setResendNotice('Confirmation email re-sent! Please check your inbox.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError({ title: 'Missing Email', message: 'Please enter your email address.' });
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        setError(formatAuthError(resetError));
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      setError(formatAuthError(err));
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
          ) : signUpEmailSent ? (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(20,184,166,0.1)',
                border: '1px solid rgba(20,184,166,0.3)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                <CheckCircle2 size={36} color="var(--teal-400)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ color: 'var(--white)', fontSize: '1.2rem', margin: '0 0 8px 0', fontWeight: 700 }}>Check your email</h3>
                <p style={{ color: 'var(--slate-300)', fontSize: '0.9rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  We've sent an activation link to <strong>{email}</strong>. Please check your inbox and click the link to confirm your account.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--slate-200)',
                      padding: '10px',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isLoading ? 'Sending...' : 'Resend confirmation link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSignUpEmailSent(false); setIsSignUp(false); setError(null); }}
                    className="btn btn-primary"
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Proceed to Sign In
                  </button>
                </div>
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
                    onClick={() => { setIsForgotPassword(true); setError(null); }}
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

          {!isForgotPassword && !signUpEmailSent && (
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setResendNotice(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontWeight: 600, fontSize: '0.9rem', marginLeft: '8px', cursor: 'pointer' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          )}

          {resendNotice && (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#4ade80',
              fontSize: '0.85rem',
            }}>
              <CheckCircle2 size={16} />
              <span>{resendNotice}</span>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <AlertCircle size={16} />
                {typeof error === 'object' ? error.title : 'Authentication Notice'}
              </div>
              <p style={{ color: 'var(--slate-300)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                {typeof error === 'object' ? error.message : error}
              </p>
              {typeof error === 'object' && error.isUnconfirmed && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isLoading}
                  style={{
                    marginTop: '10px',
                    background: 'rgba(20,184,166,0.15)',
                    border: '1px solid rgba(20,184,166,0.3)',
                    color: 'var(--teal-300)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Resend Confirmation Link
                </button>
              )}
            </div>
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
            By signing in, you agree to our <span onClick={() => router.push('/legal/terms')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>, <span onClick={() => router.push('/legal/privacy')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span> and <span onClick={() => router.push('/legal/cookies')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>Cookies Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
