"use client";
import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, Download, QrCode, Users, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { resolveUserAvatar } from '../lib/avatar';
import { getProfilePath } from '../lib/profileLinks';
import { getCommunityPath } from '../lib/communityLinks';
import { SITE_ORIGIN } from '../lib/eventLinks';

export default function ConnectQRModal({ isOpen, onClose, initialMode = 'profile', initialCommunityId = null }) {
  const { user, users = [], communities = [] } = useAppContext();

  const ledCommunities = useMemo(() => {
    if (!user?.id) return [];
    const ledIds = new Set(user.ledCommunities || []);
    if (user.leaderOf) ledIds.add(user.leaderOf);
    return (communities || []).filter(
      (c) => ledIds.has(c.id) || c.leader_id === user.id || c.leaderId === user.id
    );
  }, [user, communities]);

  const [mode, setMode] = useState(initialMode);
  const [selectedCommId, setSelectedCommId] = useState(
    initialCommunityId || ledCommunities[0]?.id || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode === 'community' && ledCommunities.length > 0 ? 'community' : 'profile');
    if (initialCommunityId) {
      setSelectedCommId(initialCommunityId);
    } else if (!selectedCommId && ledCommunities[0]?.id) {
      setSelectedCommId(ledCommunities[0].id);
    }
  }, [isOpen, initialMode, initialCommunityId, ledCommunities]);

  const activeCommunity = useMemo(
    () => ledCommunities.find((c) => c.id === selectedCommId) || ledCommunities[0] || null,
    [ledCommunities, selectedCommId]
  );

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : SITE_ORIGIN || 'https://www.morecommunity.app';

  const targetUrl = useMemo(() => {
    if (mode === 'community' && activeCommunity) {
      return `${origin}${getCommunityPath(activeCommunity, communities)}`;
    }
    if (user) {
      return `${origin}${getProfilePath(user, users)}`;
    }
    return origin;
  }, [mode, activeCommunity, communities, user, users, origin]);

  const displayUrl = targetUrl.replace(/^https?:\/\/(www\.)?/i, '');

  useEffect(() => {
    if (!isOpen || !targetUrl) return;
    let cancelled = false;
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1C1915',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => console.error('QR generation failed:', err));
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen || !user?.id) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleShare = async () => {
    const title =
      mode === 'community' && activeCommunity
        ? `Join ${activeCommunity.name} on More Community`
        : `Connect with ${user.name || 'me'} on More Community`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: targetUrl });
        return;
      } catch {
        // User cancelled share
      }
    }
    handleCopy();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download =
      mode === 'community' && activeCommunity
        ? `${activeCommunity.id}-join-qr.png`
        : `${(user.name || 'more-connect').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr.png`;
    link.click();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
        background: 'rgba(18, 18, 18, 0.72)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border-strong)',
          borderRadius: '24px',
          padding: '22px',
          color: 'var(--ink-primary)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.42)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'var(--brand-accent-soft)',
                color: 'var(--brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={17} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-primary)' }}>
                Meetup Connect QR
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                Scan with any phone camera to connect instantly
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border)',
              color: 'var(--ink-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Switcher (shown if user leads at least 1 community) */}
        {ledCommunities.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px',
              padding: '4px',
              borderRadius: '12px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('profile')}
              style={{
                padding: '8px 10px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: mode === 'profile' ? 'var(--brand-accent)' : 'transparent',
                color: mode === 'profile' ? '#FFFFFF' : 'var(--ink-secondary)',
              }}
            >
              <User size={13} /> My Connect Card
            </button>
            <button
              type="button"
              onClick={() => setMode('community')}
              style={{
                padding: '8px 10px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: mode === 'community' ? 'var(--brand-accent)' : 'transparent',
                color: mode === 'community' ? '#FFFFFF' : 'var(--ink-secondary)',
              }}
            >
              <Users size={13} /> Join My Club
            </button>
          </div>
        )}

        {/* Community selector if leader leads multiple communities */}
        {mode === 'community' && ledCommunities.length > 1 && (
          <select
            value={activeCommunity?.id || ''}
            onChange={(e) => setSelectedCommId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: 'var(--ink-primary)',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            {ledCommunities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Identity + Scannable White QR Frame */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '18px 16px',
            borderRadius: '18px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mode === 'community' && activeCommunity ? (
              activeCommunity.image || activeCommunity.cover_image ? (
                <img
                  src={activeCommunity.image || activeCommunity.cover_image}
                  alt={activeCommunity.name}
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--brand-accent)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {activeCommunity.name?.charAt(0) || 'C'}
                </div>
              )
            ) : (
              <img
                src={resolveUserAvatar(user)}
                alt={user.name || 'Member'}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-accent)' }}
              />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-primary)' }}>
                {mode === 'community' && activeCommunity ? activeCommunity.name : user.name || 'More Member'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                {mode === 'community' && activeCommunity
                  ? 'Scan to join this community'
                  : user.location || 'More Community Member'}
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid rgba(28, 25, 21, 0.10)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.10)',
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scannable Connect QR Code"
                style={{ width: '210px', height: '210px', display: 'block' }}
              />
            ) : (
              <div style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E655A', fontSize: '0.8rem' }}>
                Generating QR...
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--ink-secondary)',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border)',
              padding: '5px 12px',
              borderRadius: '999px',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {displayUrl}
          </div>
        </div>

        {/* Friendly Plain-English Explanation */}
        <div
          style={{
            padding: '10px 13px',
            borderRadius: '12px',
            background: 'var(--brand-accent-soft)',
            border: '1px solid rgba(235, 87, 56, 0.24)',
            fontSize: '0.76rem',
            color: 'var(--ink-secondary)',
            lineHeight: 1.48,
          }}
        >
          {mode === 'community' && activeCommunity ? (
            <>
              <strong style={{ color: 'var(--ink-primary)' }}>How to use at meetups:</strong>{' '}
              Show this code at your walk, coffee, or pub session — anyone who scans it with their phone camera lands straight on <strong>{activeCommunity.name}</strong> to join in one tap.
            </>
          ) : (
            <>
              <strong style={{ color: 'var(--ink-primary)' }}>How to use at meetups:</strong>{' '}
              Met someone great in person? Let them scan this with their phone camera to open your More profile, see the clubs you&apos;re in, and stay in touch — no spelling out names or phone numbers.
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopy}
            className="interactive-press"
            style={{
              padding: '10px 12px',
              borderRadius: '11px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: copied ? '#16a34a' : 'var(--ink-primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn btn-primary interactive-press"
            style={{
              padding: '10px 12px',
              borderRadius: '11px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Share2 size={14} /> Share
          </button>
          <button
            type="button"
            onClick={handleDownload}
            title="Save QR image"
            aria-label="Save QR image"
            className="interactive-press"
            style={{
              padding: '10px 12px',
              borderRadius: '11px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: 'var(--ink-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
