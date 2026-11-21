"use client";
import { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  User,
  Shield,
  Info,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Heart,
  Check,
  Type,
  Contrast,
} from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext';
import { useAppContext } from '../../src/context/AppContext';
import { useToast } from '../../src/components/Toast';
import PushNotificationManager from '../../src/components/PushNotificationManager';
import { resolveUserAvatar } from '../../src/lib/avatar';

const INTEREST_OPTIONS = [
  '🏃 Fitness',
  '🚶 Walking',
  '🐕 Dog Walking',
  '🧘 Wellness',
  '⛰️ Outdoors',
  '🤝 Volunteering',
  '🎨 Creative',
  '💼 Professional',
  '🎵 Music',
  '📚 Book Club',
  '🍳 Cooking',
  '🌱 Gardening',
  '👶 Parenting',
  '🎓 Learning',
  '🎮 Gaming',
  '🎭 Theatre & Arts',
  '🎸 Gigs & Live Music',
  '🍸 Singles & Social',
  '🧩 Quizzing',
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { signOut, authUser } = useAuth();
  const {
    user,
    updateUser,
    theme,
    setTheme,
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
  } = useAppContext();
  const { toast } = useToast();

  const [showInterestsEditor, setShowInterestsEditor] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(() => user?.interests || []);
  const [isSavingInterests, setIsSavingInterests] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  });

  useEffect(() => {
    if (Array.isArray(user?.interests)) {
      setSelectedInterests(user.interests);
    }
  }, [user?.interests]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleInstallStatus = (e) => setIsInstalled(e.matches);
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener?.('change', handleInstallStatus);

    const handler = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      mql.removeEventListener?.('change', handleInstallStatus);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = (typeof window !== 'undefined' && window.deferredPrompt) || deferredPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast.success('App installed!', 'Find More Community on your home screen');
      }
      if (typeof window !== 'undefined') window.deferredPrompt = null;
      setDeferredPrompt(null);
    } else {
      toast.info(
        'Add to Home Screen',
        'Use your browser\'s "Add to Home Screen" option to install More Community.'
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.info('Signed out', 'See you next time!');
      navigate.push('/login');
    } catch {
      toast.error('Sign out failed', 'Please try again.');
    }
  };

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: '46px',
        height: '26px',
        borderRadius: '999px',
        border: checked ? 'none' : '1px solid var(--hairline-border-strong)',
        cursor: 'pointer',
        position: 'relative',
        background: checked ? 'var(--brand-accent)' : 'var(--surface-elevated)',
        transition: 'background 0.2s',
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
          top: checked ? '3px' : '2px',
          left: checked ? '23px' : '2px',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );

  const MenuItem = ({ icon, label, subtext, color, onClick, rightElement }) => (
    <div
      role="button"
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
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline-border)',
        borderRadius: '14px',
        color: 'var(--ink-primary)',
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--hairline-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color || 'var(--brand-accent)',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 600, fontSize: '0.92rem', display: 'block', color: 'var(--ink-primary)' }}>
          {label}
        </span>
        {subtext && (
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', display: 'block', marginTop: '1px' }}>
            {subtext}
          </span>
        )}
      </div>
      {rightElement || <ChevronRight size={17} color="var(--ink-muted)" style={{ flexShrink: 0 }} />}
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
      <AppHeader title="Settings" showBack={true} />

      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          margin: '0 auto',
          padding: '18px 20px 0',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Profile Summary Card */}
        {user?.id ? (
          <div
            onClick={() => navigate.push(`/profile/${user.id}`)}
            className="interactive-press"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 18px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border)',
              borderRadius: '16px',
              cursor: 'pointer',
            }}
          >
            <img
              src={resolveUserAvatar(user)}
              alt={user.name || 'Profile'}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--hairline-border-strong)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '1.08rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--ink-primary)',
                  marginBottom: '2px',
                }}
              >
                {user.name || 'Community Member'}
              </div>
              <div
                style={{
                  color: 'var(--ink-muted)',
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {authUser?.email || user.bio || 'Community member'}
              </div>
            </div>
            <ChevronRight size={18} color="var(--ink-muted)" />
          </div>
        ) : (
          <div
            style={{
              padding: '20px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--ink-primary)' }}>
                Browsing as Guest
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                Sign in to manage your profile, interests, and privacy settings.
              </div>
            </div>
            <button
              onClick={() => navigate.push('/login?redirect=/settings')}
              className="btn btn-primary interactive-press"
              style={{ borderRadius: '999px', padding: '8px 18px', color: '#FFFFFF', fontWeight: 700 }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Account & Profile */}
        {user?.id && (
          <section>
            <h2
              style={{
                color: 'var(--ink-muted)',
                fontSize: '0.73rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                margin: '0 0 10px 4px',
              }}
            >
              Account
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <MenuItem
                icon={<User size={18} />}
                label="Edit Profile"
                subtext="Photo, bio, and display name"
                color="#2563EB"
                onClick={() => navigate.push(`/profile/${user.id}`)}
              />
              <MenuItem
                icon={<Heart size={18} />}
                label="My Interests"
                subtext={`${user?.interests?.length || 0} selected — shapes your recommendations`}
                color="#DC2626"
                onClick={() => {
                  if (!showInterestsEditor) setSelectedInterests(user?.interests || []);
                  setShowInterestsEditor((prev) => !prev);
                }}
              />
              {showInterestsEditor && (
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border-strong)',
                    borderRadius: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--ink-primary)',
                      fontWeight: 700,
                      marginBottom: '12px',
                    }}
                  >
                    Tap to toggle your interests
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {INTEREST_OPTIONS.map((pill) => {
                      const isSelected = selectedInterests.includes(pill);
                      return (
                        <button
                          key={pill}
                          type="button"
                          onClick={() =>
                            setSelectedInterests((prev) =>
                              isSelected ? prev.filter((p) => p !== pill) : [...prev, pill]
                            )
                          }
                          className="interactive-press"
                          style={{
                            padding: '7px 13px',
                            borderRadius: '999px',
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? 700 : 600,
                            background: isSelected ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                            border: isSelected
                              ? '1px solid var(--brand-accent)'
                              : '1px solid var(--hairline-border)',
                            color: isSelected ? 'var(--teal-300)' : 'var(--ink-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          {isSelected && <Check size={13} />}
                          <span>{pill}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={isSavingInterests}
                    onClick={async () => {
                      setIsSavingInterests(true);
                      try {
                        await updateUser(user.id, { interests: selectedInterests });
                        toast.success(
                          'Interests updated!',
                          'Your feed and recommendations will update accordingly.'
                        );
                        setShowInterestsEditor(false);
                      } catch (e) {
                        toast.error('Failed to save', e.message);
                      } finally {
                        setIsSavingInterests(false);
                      }
                    }}
                    className="btn btn-primary interactive-press"
                    style={{
                      marginTop: '14px',
                      width: '100%',
                      padding: '11px',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    {isSavingInterests ? 'Saving...' : 'Save Interests'}
                  </button>
                </div>
              )}
              <MenuItem
                icon={<Shield size={18} />}
                label="Privacy & Security"
                subtext="Profile visibility, DMs, export & account deletion"
                color="#7C3AED"
                onClick={() => navigate.push('/settings/security')}
              />
            </div>
          </section>
        )}

        {/* Preferences & Accessibility */}
        <section>
          <h2
            style={{
              color: 'var(--ink-muted)',
              fontSize: '0.73rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 10px 4px',
            }}
          >
            Appearance &amp; Accessibility
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Theme Switch Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '14px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                  flexShrink: 0,
                }}
              >
                {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                  Theme
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  {theme === 'light' ? 'Day Mode (Warm Paper)' : 'Night Mode (Gallery Dark)'}
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '10px',
                  padding: '3px',
                  gap: '2px',
                }}
              >
                {[
                  { id: 'dark', label: 'Dark' },
                  { id: 'light', label: 'Light' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTheme(opt.id);
                      toast.info('Theme updated', `${opt.label} mode enabled.`);
                    }}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '7px',
                      border: 'none',
                      background: theme === opt.id ? 'var(--brand-accent)' : 'transparent',
                      color: theme === opt.id ? '#FFFFFF' : 'var(--ink-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <MenuItem
              icon={<Contrast size={18} />}
              label="High Contrast"
              subtext="Sharper borders and stronger text contrast"
              color="#15803D"
              onClick={() => setHighContrast((prev) => !prev)}
              rightElement={
                <ToggleSwitch
                  checked={Boolean(highContrast)}
                  onChange={() => setHighContrast((prev) => !prev)}
                  label="Toggle high contrast"
                />
              }
            />

            <MenuItem
              icon={<Type size={18} />}
              label="Large Text"
              subtext="Increase reading size across the app"
              color="#2563EB"
              onClick={() => setLargeText((prev) => !prev)}
              rightElement={
                <ToggleSwitch
                  checked={Boolean(largeText)}
                  onChange={() => setLargeText((prev) => !prev)}
                  label="Toggle large text"
                />
              }
            />
          </div>
        </section>

        {/* App Experience */}
        <section>
          <h2
            style={{
              color: 'var(--ink-muted)',
              fontSize: '0.73rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 10px 4px',
            }}
          >
            App Experience
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <MenuItem
              icon={isInstalled ? <Smartphone size={18} /> : <Download size={18} />}
              label={isInstalled ? 'App Installed' : 'Install App'}
              subtext={isInstalled ? 'Running from your home screen' : 'Add to your home screen'}
              color="var(--brand-accent)"
              onClick={handleInstallApp}
            />

            <PushNotificationManager />
          </div>
        </section>

        {/* Legal & About */}
        <section>
          <h2
            style={{
              color: 'var(--ink-muted)',
              fontSize: '0.73rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 10px 4px',
            }}
          >
            About &amp; Legal
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <MenuItem
              icon={<Info size={18} />}
              label="About More Community"
              color="#4F46E5"
              onClick={() => navigate.push('/legal/about')}
            />
            <MenuItem
              icon={<Shield size={18} />}
              label="Terms of Use"
              color="#7C3AED"
              onClick={() => navigate.push('/legal/terms')}
            />
            <MenuItem
              icon={<Shield size={18} />}
              label="Privacy Policy"
              color="#2563EB"
              onClick={() => navigate.push('/legal/privacy')}
            />
            <MenuItem
              icon={<Shield size={18} />}
              label="Cookies Policy"
              color="#D97706"
              onClick={() => navigate.push('/legal/cookies')}
            />
            <div style={{ padding: '8px 4px', fontSize: '0.76rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
              <strong>Disclaimer:</strong> More Community is a platform for independent local
              communities. Members and leaders are responsible for their own interactions and local
              guidelines.
            </div>
          </div>
        </section>

        {/* Sign Out */}
        {user?.id && (
          <button
            onClick={handleSignOut}
            className="interactive-press"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.28)',
              color: '#DC2626',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.94rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        )}
      </div>
    </div>
  );
}
