"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Download, Printer, Copy, Check, Image as ImageIcon, Type, Palette, Layout, ChevronDown, MapPin, Clock, Calendar } from 'lucide-react';

// ─── 20 Curated Google Fonts ────────────────────────────────────
const FONT_OPTIONS = [
  { name: 'Syne', category: 'Display' },
  { name: 'Instrument Serif', category: 'Serif' },
  { name: 'Plus Jakarta Sans', category: 'Sans' },
  { name: 'Inter', category: 'Sans' },
  { name: 'Outfit', category: 'Sans' },
  { name: 'Space Grotesk', category: 'Sans' },
  { name: 'DM Sans', category: 'Sans' },
  { name: 'Poppins', category: 'Sans' },
  { name: 'Montserrat', category: 'Sans' },
  { name: 'Raleway', category: 'Sans' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Crimson Text', category: 'Serif' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Righteous', category: 'Display' },
  { name: 'Archivo Black', category: 'Display' },
  { name: 'Oswald', category: 'Sans' },
  { name: 'Bitter', category: 'Serif' },
  { name: 'Space Mono', category: 'Mono' },
];

// Load fonts dynamically via Google Fonts API
function loadFont(fontName) {
  const id = `font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);
}

// ─── Colour Presets ─────────────────────────────────────────────
const COLOUR_PRESETS = [
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Coral', value: '#fb7185' },
  { name: 'Slate', value: '#475569' },
  { name: 'White', value: '#ffffff' },
];

// ─── Template Definitions ───────────────────────────────────────
const TEMPLATES = {
  bold: {
    name: 'Bold',
    description: 'Vivid gradient, large title',
    overlay: (accent) => `linear-gradient(160deg, ${accent}dd 0%, ${accent}44 40%, rgba(0,0,0,0.85) 100%)`,
    titleSize: '3.2rem',
    titleWeight: 800,
    bodyOpacity: 0.9,
    infoBg: 'rgba(255,255,255,0.15)',
    infoColor: 'white',
  },
  minimal: {
    name: 'Minimal',
    description: 'Clean, typography-focused',
    overlay: () => 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)',
    titleSize: '2.8rem',
    titleWeight: 700,
    bodyOpacity: 0.7,
    infoBg: 'rgba(255,255,255,0.06)',
    infoColor: 'rgba(255,255,255,0.7)',
  },
  photo: {
    name: 'Photo',
    description: 'Full-bleed image, text overlay',
    overlay: () => 'linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.92) 100%)',
    titleSize: '2.6rem',
    titleWeight: 700,
    bodyOpacity: 0.85,
    infoBg: 'rgba(255,255,255,0.12)',
    infoColor: 'white',
  },
};

// ─── Main Component ─────────────────────────────────────────────
export default function EventFlyerGenerator({ event, community, onClose, uploadImage }) {
  const flyerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Customisation state
  const [template, setTemplate] = useState('bold');
  const [font, setFont] = useState('Syne');
  const [accent, setAccent] = useState('#14b8a6');
  const [customColour, setCustomColour] = useState('#14b8a6');
  const [titleText, setTitleText] = useState(event.title || 'Event Title');
  const [subtitleText, setSubtitleText] = useState(community?.name || 'Community Name');
  const [bodyText, setBodyText] = useState(event.description || '');
  const [bgImage, setBgImage] = useState(event.image || community?.image || community?.cover_image || '');
  const [bgSource, setBgSource] = useState('event');
  const [isUploading, setIsUploading] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [titleSizeMultiplier, setTitleSizeMultiplier] = useState(1);
  const [activePanel, setActivePanel] = useState('template');
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  // Load selected font
  useEffect(() => { loadFont(font); }, [font]);

  // Preload the 3 default fonts
  useEffect(() => { ['Syne', 'Instrument Serif', 'Plus Jakarta Sans'].forEach(loadFont); }, []);

  const tmpl = TEMPLATES[template];
  const longestWord = titleText.split(' ').reduce((max, word) => Math.max(max, word.length), 0);
  const autoScale = Math.min(1, 10 / (longestWord || 1));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Handle custom image upload (persisted via Supabase)
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setBgImage(url);
      setBgSource('custom');
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setIsUploading(false);
  };

  const handleBgSourceChange = (source) => {
    setBgSource(source);
    if (source === 'event') setBgImage(event.image || '');
    else if (source === 'community') setBgImage(community?.image || community?.cover_image || '');
  };

  // ─── Export: PNG via Canvas ───────────────────────────────────
  const exportAsPng = useCallback(async () => {
    setExportStatus('png');
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Draw background
      if (bgImage) {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            // Cover-fit the image
            const scale = Math.max(width / img.width, height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
            resolve();
          };
          img.onerror = () => resolve(); // Proceed without image
          img.src = bgImage;
        });
      }

      // Draw overlay gradient
      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      };
      const accentRgb = hexToRgb(accent);

      if (template === 'bold') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.87)`);
        grad.addColorStop(0.4, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.27)`);
        grad.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = grad;
      } else if (template === 'minimal') {
        ctx.fillStyle = 'rgba(15,23,42,0.96)';
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
        grad.addColorStop(1, 'rgba(0,0,0,0.92)');
        ctx.fillStyle = grad;
      }
      ctx.fillRect(0, 0, width, height);

      // Subtitle (community name)
      ctx.font = `600 30px "${font}", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(subtitleText.toUpperCase(), 108, template === 'photo' ? 750 : 420);

      // Title
      const baseTitleFontSize = template === 'bold' ? 86 : template === 'minimal' ? 76 : 72;
      const titleFontSize = baseTitleFontSize * titleSizeMultiplier * autoScale;
      ctx.font = `${tmpl.titleWeight} ${titleFontSize}px "${font}", sans-serif`;
      ctx.fillStyle = titleColor;
      ctx.textAlign = 'left';
      
      // Word-wrap title
      const maxW = width - 216;
      const words = titleText.split(' ');
      let line = '';
      let titleY = template === 'photo' ? 800 : 480;
      const lineH = titleFontSize * 1.15;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line.trim(), 108, titleY);
          line = word + ' ';
          titleY += lineH;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), 108, titleY);

      // Info pills
      const pillY = titleY + 70;
      ctx.font = `600 28px "${font}", sans-serif`;
      
      // Date pill
      const dateText = formatDate(event.date);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      const dateW = ctx.measureText(dateText).width + 60;
      ctx.beginPath();
      ctx.roundRect(108, pillY - 28, dateW, 48, 12);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(dateText, 138, pillY + 2);

      // Time pill
      const timeX = 108 + dateW + 12;
      const timeW = ctx.measureText(event.time).width + 60;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(timeX, pillY - 28, timeW, 48, 12);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(event.time, timeX + 30, pillY + 2);

      // Location pill
      const locY = pillY + 56;
      const locW = ctx.measureText(event.location).width + 60;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(108, locY - 28, locW, 48, 12);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(event.location, 138, locY + 2);

      // Description
      if (bodyText) {
        ctx.font = `400 26px "${font}", sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${tmpl.bodyOpacity})`;
        const descWords = bodyText.split(' ');
        let descLine = '';
        let descY = locY + 60;
        let lineCount = 0;
        for (const word of descWords) {
          if (lineCount >= 4) break;
          const test = descLine + word + ' ';
          if (ctx.measureText(test).width > maxW && descLine) {
            ctx.fillText(descLine.trim(), 108, descY);
            descLine = word + ' ';
            descY += 38;
            lineCount++;
          } else {
            descLine = test;
          }
        }
        if (lineCount < 4) ctx.fillText(descLine.trim(), 108, descY);
      }

      // Accent line
      ctx.fillStyle = template === 'minimal' ? accent : 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.roundRect(108, 1220, 64, 4, 2);
      ctx.fill();

      // Watermark
      ctx.font = `700 30px "${font}", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'right';
      ctx.fillText('more.', width - 60, height - 50);

      // Export
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${titleText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-flyer.png`;
        a.click();
        URL.revokeObjectURL(url);
        setExportStatus(null);
      }, 'image/png');
    } catch (err) {
      console.error('PNG export failed:', err);
      setExportStatus(null);
    }
  }, [titleText, subtitleText, bodyText, accent, font, bgImage, template, event, tmpl]);

  // ─── Export: PDF ──────────────────────────────────────────────
  const exportAsPdf = useCallback(() => {
    setExportStatus('pdf');
    const style = document.createElement('style');
    style.id = 'flyer-print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #flyer-preview, #flyer-preview * { visibility: visible !important; }
        #flyer-preview {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        @page { size: portrait; margin: 0; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      document.getElementById('flyer-print-style')?.remove();
      setExportStatus(null);
    }, 1000);
  }, []);

  // ─── Export: Copy to Clipboard ────────────────────────────────
  const copyToClipboard = useCallback(async () => {
    setExportStatus('copy');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1080, 1350);

      const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
      grad.addColorStop(0, accent + 'cc');
      grad.addColorStop(1, '#0f172aee');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1350);

      ctx.fillStyle = 'white';
      ctx.font = `800 72px "${font}", sans-serif`;
      ctx.textAlign = 'center';
      
      const words = titleText.split(' ');
      let line = '';
      let y = 500;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > 900 && line) {
          ctx.fillText(line.trim(), 540, y);
          line = word + ' ';
          y += 85;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), 540, y);

      ctx.font = `600 36px "${font}", sans-serif`;
      ctx.fillStyle = accent;
      ctx.fillText(subtitleText, 540, y + 80);

      ctx.font = `400 32px "${font}", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`${formatDate(event.date)} • ${event.time}`, 540, y + 150);
      ctx.fillText(event.location, 540, y + 195);

      ctx.font = `700 28px "${font}", sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'right';
      ctx.fillText('more.', 1040, 1310);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setTimeout(() => setExportStatus(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setExportStatus(null);
    }
  }, [titleText, subtitleText, accent, font, event]);

  // ─── Panel Button ─────────────────────────────────────────────
  const PanelButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActivePanel(activePanel === id ? null : id)}
      className="interactive-press"
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
        background: activePanel === id ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.03)',
        border: activePanel === id ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px', color: activePanel === id ? 'var(--teal-300)' : 'var(--slate-300)',
        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, flex: 1, justifyContent: 'center',
        transition: 'all 0.2s',
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'white' }}>Event Flyer</h2>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-400)' }}>Customise and export your event flyer</p>
        </div>
        <button onClick={onClose} className="interactive-press" style={{
          background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer',
          width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Flyer Preview */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div
            id="flyer-preview"
            ref={flyerRef}
            style={{
              width: '100%', maxWidth: '360px', aspectRatio: '1080 / 1350',
              borderRadius: '16px', overflow: 'hidden', position: 'relative',
              boxShadow: `0 20px 60px ${accent}30, 0 0 0 1px rgba(255,255,255,0.08)`,
              transition: 'box-shadow 0.3s',
            }}
          >
            {/* Background */}
            <div style={{
              position: 'absolute', inset: 0,
              background: bgImage ? `url(${bgImage})` : `linear-gradient(135deg, ${accent}40 0%, #0f172a 100%)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
            
            {/* Overlay */}
            <div style={{ position: 'absolute', inset: 0, background: tmpl.overlay(accent) }} />

            {/* Content */}
            <div style={{
              position: 'relative', zIndex: 1, height: '100%',
              display: 'flex', flexDirection: 'column',
              justifyContent: template === 'photo' ? 'flex-end' : 'center',
              padding: '10%',
            }}>
              {/* Community badge */}
              <div style={{ position: 'absolute', top: '8%', left: '10%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {community?.image && (
                  <img src={community.image || community.cover_image} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                )}
                <span style={{
                  fontFamily: `"${font}", sans-serif`, fontSize: '0.7rem',
                  fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {subtitleText}
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: `"${font}", sans-serif`, fontSize: `calc(${tmpl.titleSize} * ${titleSizeMultiplier * autoScale})`,
                fontWeight: tmpl.titleWeight, color: titleColor, margin: '0 0 16px 0',
                lineHeight: 1.1,
                textShadow: template === 'photo' ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
              }}>
                {titleText}
              </h1>

              {/* Info Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: tmpl.infoBg, backdropFilter: 'blur(8px)',
                  padding: '8px 14px', borderRadius: '10px',
                  fontFamily: `"${font}", sans-serif`, fontSize: '0.75rem', fontWeight: 600, color: tmpl.infoColor,
                }}>
                  <Calendar size={13} style={{ opacity: 0.8 }} /> {formatDate(event.date)}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: tmpl.infoBg, backdropFilter: 'blur(8px)',
                    padding: '8px 14px', borderRadius: '10px',
                    fontFamily: `"${font}", sans-serif`, fontSize: '0.75rem', fontWeight: 600, color: tmpl.infoColor,
                  }}>
                    <Clock size={13} style={{ opacity: 0.8 }} /> {event.time}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: tmpl.infoBg, backdropFilter: 'blur(8px)',
                    padding: '8px 14px', borderRadius: '10px',
                    fontFamily: `"${font}", sans-serif`, fontSize: '0.75rem', fontWeight: 600, color: tmpl.infoColor, flex: 1,
                  }}>
                    <MapPin size={13} style={{ opacity: 0.8 }} /> {event.location}
                  </div>
                </div>
              </div>

              {/* Description */}
              {bodyText && (
                <p style={{
                  fontFamily: `"${font}", sans-serif`, fontSize: '0.8rem',
                  color: `rgba(255,255,255,${tmpl.bodyOpacity})`, lineHeight: 1.6, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {bodyText}
                </p>
              )}

              {/* Accent line */}
              <div style={{
                width: '48px', height: '3px', borderRadius: '99px', marginTop: '20px',
                background: template === 'minimal' ? accent : 'rgba(255,255,255,0.3)',
              }} />

              {/* Watermark */}
              <div style={{
                position: 'absolute', bottom: '6%', right: '8%',
                fontFamily: `"${font}", sans-serif`, fontSize: '0.8rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em',
              }}>
                more.
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: '0 20px 100px' }}>
          {/* Panel Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <PanelButton id="template" icon={Layout} label="Layout" />
            <PanelButton id="font" icon={Type} label="Font" />
            <PanelButton id="colour" icon={Palette} label="Colour" />
            <PanelButton id="image" icon={ImageIcon} label="Image" />
          </div>

          {/* Template Panel */}
          {activePanel === 'template' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {Object.entries(TEMPLATES).map(([key, t]) => (
                <button key={key} onClick={() => setTemplate(key)} className="interactive-press" style={{
                  flex: 1, padding: '14px 10px', borderRadius: '12px',
                  background: template === key ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                  border: template === key ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  color: template === key ? 'var(--teal-300)' : 'var(--slate-400)',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>{t.name}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{t.description}</div>
                </button>
              ))}
            </div>
          )}

          {/* Font Panel */}
          {activePanel === 'font' && (
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <button onClick={() => setShowFontDropdown(!showFontDropdown)} className="interactive-press" style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                fontFamily: `"${font}", sans-serif`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {font}
                <ChevronDown size={16} style={{ transform: showFontDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {showFontDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  marginTop: '4px', maxHeight: '240px', overflowY: 'auto',
                  background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', backdropFilter: 'blur(16px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                  {FONT_OPTIONS.map(f => (
                    <button key={f.name}
                      onMouseEnter={() => loadFont(f.name)}
                      onClick={() => { setFont(f.name); setShowFontDropdown(false); }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        width: '100%', padding: '10px 16px', border: 'none',
                        background: font === f.name ? 'rgba(20,184,166,0.1)' : 'transparent',
                        color: font === f.name ? 'var(--teal-300)' : 'white',
                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                        fontFamily: `"${f.name}", sans-serif`, transition: 'background 0.15s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = font === f.name ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = font === f.name ? 'rgba(20,184,166,0.1)' : 'transparent'}
                    >
                      <span>{f.name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.category}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Title Font Size</span>
                    <span>{Math.round(titleSizeMultiplier * 100)}%</span>
                  </label>
                  <input type="range" min="0.5" max="1.5" step="0.05" value={titleSizeMultiplier}
                    onChange={(e) => setTitleSizeMultiplier(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--teal-400)', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600 }}>Title Colour</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px' }}>
                    <input type="color" value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)', fontFamily: 'monospace' }}>{titleColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Colour Panel */}
          {activePanel === 'colour' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {COLOUR_PRESETS.map(c => (
                  <button key={c.value} onClick={() => { setAccent(c.value); setCustomColour(c.value); }}
                    className="interactive-press" title={c.name}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px', background: c.value,
                      border: accent === c.value ? '2px solid white' : '2px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', transition: 'transform 0.15s, border 0.15s',
                      boxShadow: accent === c.value ? `0 0 12px ${c.value}60` : 'none',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600 }}>Custom:</label>
                <input type="color" value={customColour}
                  onChange={(e) => { setCustomColour(e.target.value); setAccent(e.target.value); }}
                  style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontFamily: 'monospace' }}>{accent}</span>
              </div>
            </div>
          )}

          {/* Image Panel */}
          {activePanel === 'image' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {[
                  { key: 'event', label: 'Event Image', available: !!event.image },
                  { key: 'community', label: 'Community', available: !!(community?.image || community?.cover_image) },
                  { key: 'custom', label: 'Upload', available: true },
                ].map(opt => (
                  <button key={opt.key}
                    onClick={() => opt.key === 'custom' ? fileInputRef.current?.click() : handleBgSourceChange(opt.key)}
                    disabled={!opt.available && opt.key !== 'custom'}
                    className="interactive-press"
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: '10px',
                      background: bgSource === opt.key ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.03)',
                      border: bgSource === opt.key ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      color: bgSource === opt.key ? 'var(--teal-300)' : opt.available ? 'var(--slate-400)' : 'var(--slate-600)',
                      cursor: opt.available || opt.key === 'custom' ? 'pointer' : 'not-allowed',
                      fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
                    }}
                  >
                    {isUploading && opt.key === 'custom' ? 'Uploading...' : opt.label}
                  </button>
                ))}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>
          )}

          {/* Text Editing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Title</label>
              <input value={titleText} onChange={(e) => setTitleText(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.85rem', fontWeight: 600, fontFamily: `"${font}", sans-serif` }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Subtitle</label>
              <input value={subtitleText} onChange={(e) => setSubtitleText(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Description</label>
              <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportAsPng} disabled={!!exportStatus} className="btn btn-primary interactive-press"
              style={{ flex: 1, padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, opacity: exportStatus ? 0.7 : 1 }}>
              {exportStatus === 'png' ? <><div className="skeleton" style={{ width: '16px', height: '16px', borderRadius: '50%' }} /> Exporting...</> : <><Download size={16} /> PNG</>}
            </button>
            <button onClick={exportAsPdf} disabled={!!exportStatus} className="btn btn-outline interactive-press"
              style={{ flex: 1, padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, opacity: exportStatus ? 0.7 : 1 }}>
              <Printer size={16} /> PDF
            </button>
            <button onClick={copyToClipboard} disabled={!!exportStatus} className="btn btn-outline interactive-press"
              style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: exportStatus === 'copy' ? 'var(--teal-400)' : undefined, opacity: exportStatus && exportStatus !== 'copy' ? 0.7 : 1 }}>
              {exportStatus === 'copy' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
