"use client";
import React, { useState, useEffect } from 'react';
import { Copy, Check, Mail, Share2, MessageCircle, Twitter, Facebook } from 'lucide-react';
import { useToast } from './Toast';

export default function ShareOptions({
  title = 'Community Event',
  text = '',
  url = '',
  whatsappText = '',
  layout = 'modal',
  onActionComplete,
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareBodyText = text ? `${text}\n\n${resolvedUrl}` : resolvedUrl;
  const waBodyText = whatsappText || shareBodyText;

  const encodedUrl = encodeURIComponent(resolvedUrl);
  const encodedText = encodeURIComponent(shareBodyText);
  const encodedWaText = encodeURIComponent(waBodyText);

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(resolvedUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = resolvedUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Copied!', 'Event link copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
      if (onActionComplete) onActionComplete('copy');
    } catch (err) {
      toast.error('Failed', 'Could not copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: resolvedUrl });
        if (onActionComplete) onActionComplete('native');
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const shareChannels = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle size={layout === 'inline' ? 18 : 24} color="white" />,
      color: '#25D366',
      href: `https://api.whatsapp.com/send?text=${encodedWaText}`,
    },
    {
      id: 'copy',
      name: copied ? 'Copied!' : 'Copy Link',
      icon: copied
        ? <Check size={layout === 'inline' ? 18 : 24} color="white" />
        : <Copy size={layout === 'inline' ? 18 : 24} color="white" />,
      color: copied ? '#0d9488' : '#334155',
      onClick: handleCopyLink,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook size={layout === 'inline' ? 18 : 24} color="white" />,
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: <Twitter size={layout === 'inline' ? 18 : 24} color="white" />,
      color: '#0f172a',
      border: '1px solid rgba(255,255,255,0.22)',
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail size={layout === 'inline' ? 18 : 24} color="white" />,
      color: '#EA4335',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`,
    },
  ];

  if (layout === 'inline') {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '18px 20px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            margin: 0,
            color: 'var(--white)',
            fontFamily: 'var(--font-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Share2 size={18} color="var(--teal-400)" /> Share This Event
          </h3>
          <span style={{ fontSize: '0.76rem', color: 'var(--slate-400)' }}>
            Invite friends &amp; local walkers
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
          gap: '10px',
        }}>
          {shareChannels.map((opt) => {
            const commonStyle = {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '12px',
              background: opt.color,
              border: opt.border || '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            };
            if (opt.href) {
              return (
                <a
                  key={opt.id}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-press"
                  style={commonStyle}
                  onClick={() => onActionComplete?.(opt.id)}
                >
                  {opt.icon}
                  <span>{opt.name}</span>
                </a>
              );
            }
            return (
              <button
                key={opt.id}
                type="button"
                onClick={opt.onClick}
                className="interactive-press"
                style={commonStyle}
              >
                {opt.icon}
                <span>{opt.name}</span>
              </button>
            );
          })}

          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="interactive-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(20, 184, 166, 0.16)',
                border: '1px solid rgba(45, 212, 191, 0.4)',
                color: '#5eead4',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Share2 size={17} />
              <span>More Apps</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="btn btn-primary interactive-press"
          style={{ width: '100%', marginBottom: '24px', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Share2 size={18} /> Share via Device
        </button>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
        {shareChannels.map((opt) => {
          const iconBubble = (
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: opt.color,
              border: opt.border || 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}>
              {opt.icon}
            </div>
          );
          const itemStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            minWidth: '64px',
            background: 'none',
            border: 'none',
            padding: 0,
            textDecoration: 'none',
          };
          if (opt.href) {
            return (
              <a
                key={opt.id}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={itemStyle}
                onClick={() => onActionComplete?.(opt.id)}
              >
                {iconBubble}
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-300)', textAlign: 'center', fontWeight: 500 }}>{opt.name}</span>
              </a>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={opt.onClick}
              className="interactive-press"
              style={itemStyle}
            >
              {iconBubble}
              <span style={{ fontSize: '0.7rem', color: 'var(--slate-300)', textAlign: 'center', fontWeight: 500 }}>{opt.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
