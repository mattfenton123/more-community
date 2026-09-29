"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../src/lib/supabaseClient';
import { useToast } from '../../src/components/Toast';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setIsSuccess(true);
        toast.success('Password updated!', 'Your new password is set.');
        setTimeout(() => {
          router.push('/app');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--slate-950)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(20,184,166,0.1)',
          border: '1px solid rgba(20,184,166,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--teal-400)',
        }}>
          {isSuccess ? <CheckCircle2 size={28} color="#22c55e" /> : <Lock size={28} />}
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.6rem',
          color: 'var(--white)',
          margin: '0 0 8px 0',
          fontWeight: 700,
        }}>
          {isSuccess ? 'Password Updated!' : 'Set New Password'}
        </h1>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          {isSuccess ? 'Redirecting you to the app...' : 'Enter your new password below.'}
        </p>

        {!isSuccess && (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <input
                type="password"
                placeholder="New password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--red-400)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim() || !confirmPassword.trim()}
              className="btn btn-primary interactive-press"
              style={{
                width: '100%',
                borderRadius: '14px',
                padding: '16px',
                fontSize: '1rem',
                fontWeight: 600,
                marginTop: '8px',
                opacity: (!password.trim() || !confirmPassword.trim() || isLoading) ? 0.5 : 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              {isLoading ? 'Updating...' : 'Save Password'} <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
