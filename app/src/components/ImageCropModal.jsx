"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from 'lucide-react';

/**
 * Zero-dependency interactive Image Crop & Reposition Modal.
 * Supports touch dragging (mobile), mouse dragging (desktop), zoom slider,
 * clamped bounds (no empty edges), and high-res Canvas JPEG export.
 */
export default function ImageCropModal({
  isOpen,
  imageSrc,
  fileName = 'cover.jpg',
  aspectRatio = 16 / 9,
  title = 'Crop & Position Photo',
  subtitle = 'Drag to reposition and use the slider to zoom',
  onCancel,
  onConfirm,
}) {
  const [mounted, setMounted] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 320, height: Math.round(320 / aspectRatio) });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cacheNonce, setCacheNonce] = useState(0);

  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const dragStartRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when a new image opens
  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLoadError('');
    setIsExporting(false);
    setCacheNonce(Date.now());
  }, [isOpen, imageSrc]);

  // Cache-bust remote HTTP URLs so browsers fetch fresh CORS headers instead of a non-CORS cached copy
  const resolvedSrc =
    imageSrc && /^https?:\/\//i.test(imageSrc)
      ? `${imageSrc}${imageSrc.includes('?') ? '&' : '?'}_crop=${cacheNonce || 1}`
      : imageSrc;

  // Measure responsive crop frame
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize({ width: rect.width, height: rect.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen, aspectRatio]);

  // Base cover scale so image fills frame completely at zoom === 1
  const baseScale =
    imgSize.width > 0 && imgSize.height > 0 && frameSize.width > 0 && frameSize.height > 0
      ? Math.max(frameSize.width / imgSize.width, frameSize.height / imgSize.height)
      : 1;

  const totalScale = baseScale * zoom;

  const clampOffset = useCallback(
    (nextX, nextY, targetZoom = zoom) => {
      if (!imgSize.width || !imgSize.height || !frameSize.width || !frameSize.height) {
        return { x: 0, y: 0 };
      }
      const s = baseScale * targetZoom;
      const renderedW = imgSize.width * s;
      const renderedH = imgSize.height * s;
      const maxX = Math.max(0, (renderedW - frameSize.width) / 2);
      const maxY = Math.max(0, (renderedH - frameSize.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    [imgSize.width, imgSize.height, frameSize.width, frameSize.height, baseScale, zoom]
  );

  // Re-clamp offset when zoom or frame size changes
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y, zoom));
  }, [zoom, clampOffset]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (frameRef.current?.setPointerCapture) {
      try {
        frameRef.current.setPointerCapture(e.pointerId);
      } catch {}
    }
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStartRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setOffset(clampOffset(dragStartRef.current.startX + dx, dragStartRef.current.startY + dy));
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    if (frameRef.current?.releasePointerCapture) {
      try {
        frameRef.current.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Number(Math.max(1, Math.min(3, z + delta)).toFixed(2)));
  };

  const handleConfirm = async () => {
    const imgEl = imgRef.current;
    if (!imgEl || !imgSize.width || !imgSize.height || isExporting) return;

    setIsExporting(true);
    try {
      const outputWidth = 1600;
      const outputHeight = Math.round(outputWidth / aspectRatio);
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      // Map visible crop box back into source image pixel coordinates
      const visibleSrcW = frameSize.width / totalScale;
      const visibleSrcH = frameSize.height / totalScale;
      const centerSrcX = imgSize.width / 2 - offset.x / totalScale;
      const centerSrcY = imgSize.height / 2 - offset.y / totalScale;
      const sx = Math.max(0, Math.min(imgSize.width - visibleSrcW, centerSrcX - visibleSrcW / 2));
      const sy = Math.max(0, Math.min(imgSize.height - visibleSrcH, centerSrcY - visibleSrcH / 2));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imgEl, sx, sy, visibleSrcW, visibleSrcH, 0, 0, outputWidth, outputHeight);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Could not export cropped image'))),
          'image/jpeg',
          0.9
        );
      });

      const cleanName = String(fileName || 'cover.jpg').replace(/\.[^/.]+$/, '') + '-cropped.jpg';
      const croppedFile = new File([blob], cleanName, { type: 'image/jpeg' });
      const previewUrl = canvas.toDataURL('image/jpeg', 0.86);
      onConfirm?.(croppedFile, previewUrl);
    } catch (err) {
      console.error('Image crop export error:', err);
      setLoadError('Could not crop this photo (try uploading a fresh image from your device).');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !imageSrc || !mounted) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250000,
        background: 'rgba(12, 12, 14, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border-strong)',
          borderRadius: '22px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.45)',
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink-primary)' }}>
              {title}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel crop"
            className="interactive-press"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid var(--hairline-border)',
              background: 'var(--surface-elevated)',
              color: 'var(--ink-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Interactive Drag & Zoom Crop Frame */}
        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: `${aspectRatio}`,
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#111111',
            border: '2px solid var(--brand-accent)',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <img
            ref={imgRef}
            src={resolvedSrc}
            alt="Crop preview"
            crossOrigin={imageSrc && /^https?:\/\//i.test(imageSrc) ? 'anonymous' : undefined}
            draggable={false}
            onLoad={(e) => {
              const nw = e.currentTarget.naturalWidth || 0;
              const nh = e.currentTarget.naturalHeight || 0;
              setImgSize({ width: nw, height: nh });
              setLoadError('');
            }}
            onError={() => {
              setLoadError('Could not load image for cropping. Please select a photo from your device.');
            }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: imgSize.width ? `${imgSize.width * totalScale}px` : '100%',
              height: imgSize.height ? `${imgSize.height * totalScale}px` : '100%',
              maxWidth: 'none',
              maxHeight: 'none',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              pointerEvents: 'none',
            }}
          />

          {/* Subtle rule-of-thirds framing grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)',
              backgroundSize: '33.333% 33.333%',
              opacity: isDragging ? 0.85 : 0.35,
              transition: 'opacity 0.18s ease',
            }}
          />

          {/* Drag hint pill */}
          {!isDragging && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                background: 'rgba(15, 15, 18, 0.72)',
                backdropFilter: 'blur(6px)',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '5px 11px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              <Move size={12} /> Drag to reposition
            </div>
          )}
        </div>

        {loadError && (
          <div
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            {loadError}
          </div>
        )}

        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => Number(Math.max(1, z - 0.15).toFixed(2)))}
            aria-label="Zoom out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <ZoomOut size={17} />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.02"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            aria-label="Zoom image"
            style={{ flex: 1, accentColor: 'var(--brand-accent)', cursor: 'pointer' }}
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Number(Math.min(3, z + 0.15).toFixed(2)))}
            aria-label="Zoom in"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <ZoomIn size={17} />
          </button>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', minWidth: '34px', textAlign: 'right' }}>
            {zoom.toFixed(1)}x
          </span>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            title="Reset position & zoom"
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '8px',
              color: 'var(--ink-secondary)',
              padding: '5px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline interactive-press"
            style={{ padding: '10px 16px', borderRadius: '11px', fontSize: '0.84rem', fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting || Boolean(loadError) || !imgSize.width}
            onClick={handleConfirm}
            className="btn btn-primary interactive-press"
            style={{
              padding: '10px 20px',
              borderRadius: '11px',
              fontSize: '0.84rem',
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExporting || Boolean(loadError) || !imgSize.width ? 0.55 : 1,
            }}
          >
            <Check size={15} /> {isExporting ? 'Applying...' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
