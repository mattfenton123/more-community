"use client";
import { useState, useEffect } from 'react';
import { Shield, Eye, MessageCircle, Download, Trash2, Check } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../../../src/context/AppContext';
import { useAuth } from '../../../src/context/AuthContext';
import { useToast } from '../../../src/components/Toast';
import AppHeader from '../../../src/components/AppHeader';
import { deleteUserAction } from '../../../src/lib/actions';
import { supabase } from '../../../src/lib/supabaseClient';

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAppContext();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const [visibility, setVisibility] = useState(user?.privacy_visibility || 'public');
  const [dmLimit, setDmLimit] = useState(user?.privacy_dms || 'everyone');
  const [showActivity, setShowActivity] = useState(user?.privacy_activity !== false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setVisibility(user.privacy_visibility || 'public');
    setDmLimit(user.privacy_dms || 'everyone');
    setShowActivity(user.privacy_activity !== false);
  }, [user]);

  const handleSavePrivacy = async (key, value) => {
    if (!user?.id) return;
    try {
      if (key === 'visibility') setVisibility(value);
      if (key === 'dmLimit') setDmLimit(value);
      if (key === 'activity') setShowActivity(value);

      const dbKey =
        key === 'dmLimit'
          ? 'privacy_dms'
          : key === 'activity'
            ? 'privacy_activity'
            : `privacy_${key}`;
      await updateUser(user.id, { [dbKey]: value });
      toast.success('Privacy updated');
    } catch {
      toast.error('Failed to update privacy');
    }
  };

  const handleExportData = () => {
    if (!user?.id) return;
    setIsExporting(true);
    setTimeout(() => {
      const safeName = (user.name || 'member').replace(/\s+/g, '_');
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `more_data_${safeName}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      setIsExporting(false);
      toast.success('Data exported successfully');
    }, 500);
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || isDeleting) return;
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? All your posts, memberships, and profile data will be permanently erased. This cannot be undone.'
    );
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      toast.info('Deleting account...', 'Removing your data');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await deleteUserAction(user.id, token);
      if (res?.error) throw new Error(res.error);
      await signOut();
      toast.success('Account deleted', 'Your account and data have been permanently removed.');
      navigate.push('/login');
    } catch (err) {
      console.error('Account deletion error:', err);
      toast.error(
        'Deletion failed',
        err.message || 'Could not delete account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const ToggleOption = ({ selected, title, description, onClick }) => (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="interactive-press"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '15px 16px',
        background: selected ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
        border: selected
          ? '1px solid var(--brand-accent)'
          : '1px solid var(--hairline-border)',
        borderRadius: '14px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: selected ? '2px solid var(--brand-accent)' : '2px solid var(--hairline-border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '2px',
          background: selected ? 'var(--brand-accent)' : 'var(--surface-elevated)',
          flexShrink: 0,
        }}
      >
        {selected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.92rem', marginBottom: '3px' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
          {description}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="view-settings"
      style={{
        minHeight: '100dvh',
        background: 'var(--surface-canvas)',
        paddingBottom: '100px',
      }}
    >
      <AppHeader title="Privacy & Security" showBack={true} />

      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto',
          padding: '20px 20px 0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
        }}
      >
        {!user?.id ? (
          <div
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '18px',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)', margin: '0 0 8px' }}>
              Sign in required
            </h2>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem', margin: '0 0 18px' }}>
              Sign in to adjust your privacy controls or export your account data.
            </p>
            <button
              onClick={() => navigate.push('/login?redirect=/settings/security')}
              className="btn btn-primary interactive-press"
              style={{ borderRadius: '999px', padding: '10px 22px', color: '#FFFFFF', fontWeight: 700 }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Profile Visibility */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Eye size={18} color="#2563EB" />
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    margin: 0,
                  }}
                >
                  Profile Visibility
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ToggleOption
                  selected={visibility === 'public'}
                  onClick={() => handleSavePrivacy('visibility', 'public')}
                  title="Public"
                  description="Anyone on More Community can view your profile and see your interests."
                />
                <ToggleOption
                  selected={visibility === 'members_only'}
                  onClick={() => handleSavePrivacy('visibility', 'members_only')}
                  title="Members Only"
                  description="Only people in communities you have joined can view your full profile."
                />
                <ToggleOption
                  selected={visibility === 'private'}
                  onClick={() => handleSavePrivacy('visibility', 'private')}
                  title="Private / Hidden"
                  description="Hide your profile from member directories."
                />
              </div>
            </section>

            {/* Direct Messages */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MessageCircle size={18} color="#7C3AED" />
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    margin: 0,
                  }}
                >
                  Direct Messages
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ToggleOption
                  selected={dmLimit === 'everyone'}
                  onClick={() => handleSavePrivacy('dmLimit', 'everyone')}
                  title="Everyone"
                  description="Anyone on the platform can send you a direct message."
                />
                <ToggleOption
                  selected={dmLimit === 'communities'}
                  onClick={() => handleSavePrivacy('dmLimit', 'communities')}
                  title="Shared Communities Only"
                  description="Only people who share a community with you can message you."
                />
                <ToggleOption
                  selected={dmLimit === 'nobody'}
                  onClick={() => handleSavePrivacy('dmLimit', 'nobody')}
                  title="Nobody"
                  description="Disable direct messaging entirely."
                />
              </div>
            </section>

            {/* Online Activity */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Eye size={18} color="#15803D" />
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    margin: 0,
                  }}
                >
                  Online Activity
                </h2>
              </div>
              <div
                style={{
                  background: 'var(--surface-card)',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  border: '1px solid var(--hairline-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 3px 0', fontSize: '0.94rem', color: 'var(--ink-primary)' }}>
                    Show Activity Status
                  </h3>
                  <div style={{ color: 'var(--ink-secondary)', fontSize: '0.82rem' }}>
                    Let fellow members see when you are online.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showActivity}
                  aria-label="Toggle activity status"
                  onClick={() => handleSavePrivacy('activity', !showActivity)}
                  style={{
                    width: '48px',
                    height: '26px',
                    borderRadius: '999px',
                    border: showActivity ? 'none' : '1px solid var(--hairline-border-strong)',
                    cursor: 'pointer',
                    position: 'relative',
                    background: showActivity ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                      position: 'absolute',
                      top: showActivity ? '3px' : '2px',
                      left: showActivity ? '25px' : '2px',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>
            </section>

            {/* Data & Account */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Shield size={18} color="#D97706" />
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    margin: 0,
                  }}
                >
                  Data &amp; Account
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="interactive-press"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: isExporting ? 'wait' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  <Download size={18} color="var(--brand-accent)" />
                  <span>{isExporting ? 'Preparing Data...' : 'Export My Data (JSON)'}</span>
                </button>
                <p style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', margin: '0 0 8px 4px' }}>
                  Download a copy of your personal profile data and preferences.
                </p>

                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="interactive-press"
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid rgba(220, 38, 38, 0.28)',
                    borderRadius: '14px',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: isDeleting ? 'wait' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    opacity: isDeleting ? 0.65 : 1,
                  }}
                >
                  <Trash2 size={18} />
                  <span>{isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}</span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
