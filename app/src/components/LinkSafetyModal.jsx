'use client';
import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ExternalLink, X, AlertTriangle, Lock, Unlock, ArrowRight } from 'lucide-react';

export default function LinkSafetyModal({ isOpen, onClose, linkAnalysis }) {
  if (!isOpen || !linkAnalysis) return null;

  const { url, hostname, status, badge, color, isHttps, isShortener, reasons = [] } = linkAnalysis;

  const isVerified = status === 'verified';
  const isCaution = status === 'caution';
  const isHighRisk = status === 'high_risk';

  const handleProceed = () => {
    window.open(url, '_blank', 'noopener,noreferrer,nofollow');
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(2, 6, 23, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="modal-content"
        style={{
          background: '#0f172a',
          border: `1px solid ${isHighRisk ? '#ef4444' : isCaution ? 'rgba(245,158,11,0.4)' : isVerified ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: '24px',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: isHighRisk 
            ? '0 25px 50px -12px rgba(239,68,68,0.25)' 
            : isCaution 
              ? '0 25px 50px -12px rgba(245,158,11,0.2)' 
              : '0 25px 50px -12px rgba(0,0,0,0.7)'
        }}
      >
        {/* Header Strip */}
        <div style={{
          padding: '16px 20px',
          background: isHighRisk ? 'rgba(239,68,68,0.15)' : isCaution ? 'rgba(245,158,11,0.1)' : isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isHighRisk ? (
              <ShieldAlert size={20} color="#ef4444" />
            ) : isCaution ? (
              <AlertTriangle size={20} color="#f59e0b" />
            ) : isVerified ? (
              <ShieldCheck size={20} color="#10b981" />
            ) : (
              <Shield size={20} color="#38bdf8" />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {badge}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="interactive-press"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Destination Host
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '4px 0 0', wordBreak: 'break-all', fontFamily: 'Outfit, sans-serif' }}>
              {hostname}
            </div>
          </div>

          {/* Full URL Box */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Full Target Link
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.4 }}>
              {url}
            </div>
          </div>

          {/* Verification / Security Signals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: isHttps ? '#34d399' : '#f87171' }}>
              {isHttps ? <Lock size={15} /> : <Unlock size={15} />}
              <span>{isHttps ? 'Encrypted Connection (HTTPS)' : 'Unencrypted Connection (HTTP) - Insecure'}</span>
            </div>
            {isVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#34d399' }}>
                <ShieldCheck size={15} />
                <span>Recognized verified platform on More Community whitelist</span>
              </div>
            )}
            {isShortener && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#fbbf24' }}>
                <AlertTriangle size={15} />
                <span>Masked destination - this link redirects through a URL shortener</span>
              </div>
            )}
          </div>

          {/* Reasons / Guidance */}
          {reasons.length > 0 && (
            <div style={{
              background: isHighRisk ? 'rgba(239,68,68,0.1)' : isCaution ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isHighRisk ? 'rgba(239,68,68,0.2)' : isCaution ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '12px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: color, marginBottom: '6px' }}>
                Safety Checklist
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Reminder */}
          <div style={{
            fontSize: '0.78rem',
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '10px',
            padding: '10px 12px',
            lineHeight: 1.45
          }}>
            🛡️ <strong>Safety Rule:</strong> Never enter your password, send wire transfers, or purchase tickets outside More Community. Official community events are always booked on-platform.
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <button 
            onClick={onClose}
            className="btn btn-outline interactive-press"
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            Stay Safe (Cancel)
          </button>
          <button 
            onClick={handleProceed}
            className="btn interactive-press"
            style={{
              flex: 1.2,
              padding: '12px',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: isHighRisk ? '#ef4444' : isCaution ? '#f59e0b' : 'var(--teal-500)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Proceed to Site</span>
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
