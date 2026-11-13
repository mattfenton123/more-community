import React from 'react';
import { X, Share2 } from 'lucide-react';
import ShareOptions from './ShareOptions';

export default function ShareModal({ isOpen, onClose, title, text, url, whatsappText }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 0, zIndex: 2000 }} onClick={onClose}>
      <div className="modal-content slide-up" onClick={e => e.stopPropagation()} style={{
        background: 'var(--slate-900)',
        borderRadius: '24px 24px 0 0',
        padding: '24px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="var(--teal-400)" /> Share
          </h2>
          <button onClick={onClose} aria-label="Close Share" className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '24px', whiteSpace: 'pre-line' }}>
          {text}
        </p>

        <ShareOptions
          layout="modal"
          title={title}
          text={text}
          url={url}
          whatsappText={whatsappText}
        />
      </div>
    </div>
  );
}
