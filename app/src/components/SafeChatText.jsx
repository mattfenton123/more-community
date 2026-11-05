'use client';
import React, { useMemo } from 'react';
import { extractUrls, analyzeLink, scanMessageForScam } from '../lib/chatSecurity';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, Globe } from 'lucide-react';

export default function SafeChatText({ text = '', onLinkClick, isOwn = false }) {
  if (!text) return null;

  const urls = useMemo(() => extractUrls(text), [text]);
  const scamScan = useMemo(() => scanMessageForScam(text), [text]);

  const analyzedLinks = useMemo(() => {
    return urls.map(url => analyzeLink(url));
  }, [urls]);

  // Render text with clickable links that trigger the safety modal
  const renderTextWithLinks = () => {
    if (urls.length === 0) {
      return <span>{text}</span>;
    }

    // Split text by URLs
    const parts = [];
    let remaining = text;

    urls.forEach((url, idx) => {
      // Find the URL occurrence
      const foundIdx = remaining.indexOf(url);
      if (foundIdx !== -1) {
        if (foundIdx > 0) {
          parts.push(<span key={`text-${idx}`}>{remaining.slice(0, foundIdx)}</span>);
        }
        const analysis = analyzedLinks[idx];
        parts.push(
          <button
            key={`link-${idx}`}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onLinkClick) onLinkClick(analysis);
              else window.open(url, '_blank', 'noopener,noreferrer,nofollow');
            }}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              padding: '2px 6px',
              borderRadius: '6px',
              color: isOwn ? '#fff' : 'var(--teal-300)',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
            title={`Check link soundness: ${analysis?.hostname}`}
          >
            <span>{url}</span>
            <ExternalLink size={12} style={{ opacity: 0.8 }} />
          </button>
        );
        remaining = remaining.slice(foundIdx + url.length);
      }
    });

    if (remaining) {
      parts.push(<span key="tail">{remaining}</span>);
    }

    return parts;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Message Text with Safe Link Buttons */}
      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
        {renderTextWithLinks()}
      </div>

      {/* Inline Link Soundness Cards */}
      {analyzedLinks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {analyzedLinks.map((link, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (onLinkClick) onLinkClick(link);
                else window.open(link.url, '_blank', 'noopener,noreferrer,nofollow');
              }}
              className="interactive-press"
              style={{
                background: link.status === 'high_risk'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : link.status === 'caution'
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${link.status === 'high_risk' ? 'rgba(239, 68, 68, 0.4)' : link.status === 'caution' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {link.status === 'high_risk' ? (
                  <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                ) : link.status === 'caution' ? (
                  <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                ) : link.status === 'verified' ? (
                  <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
                ) : (
                  <Globe size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {link.hostname}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: link.color, fontWeight: 600 }}>
                    {link.badge}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, fontWeight: 600 }}>
                Inspect ↗
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pro Shield Guard Anti-Scam Notice */}
      {scamScan.isSuspicious && !isOwn && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '0.72rem',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
          marginTop: '2px',
          lineHeight: 1.4
        }}>
          <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{scamScan.cautionMessage}</span>
        </div>
      )}
    </div>
  );
}
