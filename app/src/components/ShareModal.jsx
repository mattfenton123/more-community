import React from 'react';
import { X, Copy, Mail, Share2, MessageCircle, Twitter, Facebook } from 'lucide-react';
import { useToast } from './Toast';

export default function ShareModal({ isOpen, onClose, title, text, url }) {
  const { toast } = useToast();
  
  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Copied!', 'Link copied to clipboard.');
    } catch (err) {
      toast.error('Failed', 'Could not copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${text}\n\n${url}`);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} color="white" />,
      color: '#25D366',
      action: () => window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    },
    {
      name: 'Email',
      icon: <Mail size={24} color="white" />,
      color: '#EA4335',
      action: () => window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`, '_blank')
    },
    {
      name: 'X (Twitter)',
      icon: <Twitter size={24} color="white" />,
      color: '#000000',
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank')
    },
    {
      name: 'Facebook',
      icon: <Facebook size={24} color="white" />,
      color: '#1877F2',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
    },
    {
      name: 'Copy Link',
      icon: <Copy size={24} color="white" />,
      color: 'var(--slate-700)',
      action: handleCopyLink
    }
  ];

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
          <button onClick={onClose} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '24px' }}>
          {text}
        </p>

        {navigator.share && (
          <button 
            onClick={handleNativeShare}
            className="btn btn-primary interactive-press"
            style={{ width: '100%', marginBottom: '24px', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Share2 size={18} /> Share via Device
          </button>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
          {shareOptions.map((opt, i) => (
            <div key={i} className="interactive-press" onClick={opt.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '64px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {opt.icon}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--slate-300)', textAlign: 'center', fontWeight: 500 }}>{opt.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
