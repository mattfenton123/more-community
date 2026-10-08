"use client";
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Camera, Maximize2, Minimize2, Download } from 'lucide-react';

export default function ProfileImageModal({
  isOpen,
  onClose,
  imageUrl,
  name = 'User',
  subtitle = 'Profile Picture',
  isOwnProfile = false,
  onEditPhoto = null
}) {
  const [isZoomed, setIsZoomed] = useState(false);

  // Close on Escape key & disable background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'profileModalFadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'profileModalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Info Bar */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          padding: '0 4px'
        }}>
          <div>
            <h3 style={{
              margin: '0 0 2px 0',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--white)',
              fontFamily: 'var(--font-heading)'
            }}>
              {name}
            </h3>
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--teal-400)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {subtitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Toggle Zoom button */}
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? "Fit to frame" : "Zoom in"}
              className="interactive-press"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--slate-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isZoomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Open Original in new tab */}
            <button
              type="button"
              onClick={() => window.open(imageUrl, '_blank')}
              title="Open full resolution in new tab"
              className="interactive-press"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--slate-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ExternalLink size={16} />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="interactive-press"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.25)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(20, 184, 166, 0.1)'
        }}>
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: isZoomed ? '100%' : 'auto',
              maxWidth: '100%',
              height: isZoomed ? '100%' : 'auto',
              maxHeight: '70vh',
              objectFit: isZoomed ? 'cover' : 'contain',
              display: 'block',
              borderRadius: '20px',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: isZoomed ? 'zoom-out' : 'zoom-in'
            }}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>

        {/* Bottom Actions */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOwnProfile && onEditPhoto ? 'space-between' : 'center',
          marginTop: '16px',
          gap: '12px'
        }}>
          {isOwnProfile && onEditPhoto && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditPhoto();
              }}
              className="btn btn-primary interactive-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '0.85rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                borderColor: '#14b8a6',
                fontWeight: 600
              }}
            >
              <Camera size={16} /> Change Profile Photo
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline interactive-press"
            style={{
              padding: '9px 20px',
              fontSize: '0.85rem',
              borderRadius: '12px',
              color: 'var(--slate-300)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.04)'
            }}
          >
            Done
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes profileModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes profileModalScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
