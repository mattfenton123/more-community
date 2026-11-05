'use client';
import React, { useState } from 'react';
import { Shield, AlertTriangle, UserX, X, Check, Flag } from 'lucide-react';
import { useToast } from './Toast';
import { reportMemberAction } from '../lib/actions';
import { supabase } from '../lib/supabaseClient';

export default function ChatTrustModal({ isOpen, onClose, targetUser, communityId, messageId = null, onUserBlocked }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const fullReason = `${reason}: ${details || 'No additional details provided'}`;
      await reportMemberAction(targetUser.id, communityId || 'dm', fullReason, token);

      if (alsoBlock) {
        try {
          const currentBlocked = JSON.parse(localStorage.getItem('more_blocked_users') || '[]');
          if (!currentBlocked.includes(targetUser.id)) {
            currentBlocked.push(targetUser.id);
            localStorage.setItem('more_blocked_users', JSON.stringify(currentBlocked));
          }
        } catch (e) {}

        if (onUserBlocked) onUserBlocked(targetUser.id);
        toast.success('Reported & Blocked', `${targetUser.name} has been reported to Trust & Safety and blocked.`);
      } else {
        toast.success('Report Filed', 'Thank you for keeping More Community safe. Our moderators will review this.');
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Report Failed', 'Could not submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
        backdropFilter: 'blur(8px)',
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
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(239,68,68,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <Flag size={18} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
              Report or Block Member
            </h3>
          </div>
          <button onClick={onClose} className="interactive-press" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px' }}>
              Why are you reporting <strong>{targetUser.name}</strong>?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'spam', label: 'Spam or unsolicited advertising' },
                { id: 'suspicious_link', label: 'Suspicious, malicious, or phishing link' },
                { id: 'financial_scam', label: 'Off-platform payment or financial scam (Crypto, Wire)' },
                { id: 'impersonation', label: 'Impersonating community leader or official host' },
                { id: 'harassment', label: 'Harassment, hate speech, or inappropriate conduct' }
              ].map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: reason === opt.id ? '#fff' : '#94a3b8', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', background: reason === opt.id ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                  <input type="radio" name="report_reason" checked={reason === opt.id} onChange={() => setReason(opt.id)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
              Additional Details (Optional)
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe what happened or paste specific details..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                minHeight: '70px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer', padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
            <input type="checkbox" checked={alsoBlock} onChange={e => setAlsoBlock(e.target.checked)} />
            <span>Block this user (they will no longer be able to message you)</span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline interactive-press" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn interactive-press" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
