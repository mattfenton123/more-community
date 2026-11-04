import React, { useState } from 'react';
import { Briefcase, CreditCard, X, Store, Coffee, Paintbrush, Dumbbell, Stethoscope, Shield, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

const CATEGORIES = [
  { id: 'Freelance', icon: Paintbrush, label: 'Freelance & Creative' },
  { id: 'F&B', icon: Coffee, label: 'Food & Beverage' },
  { id: 'Health', icon: Dumbbell, label: 'Health & Wellness' },
  { id: 'Venue', icon: Store, label: 'Venue or Space' },
  { id: 'Professional', icon: Briefcase, label: 'Professional Services' }
];

export default function CreateServiceModal({ isOpen, onClose, communityId }) {
  const { pitchService, user, notifyCommunityLeaders } = useAppContext();
  const { toast } = useToast();
  
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [perk, setPerk] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !title || !description) {
      toast.error('Missing fields', 'Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate payment / submission delay
    setTimeout(() => {
      pitchService({
        communityId,
        userId: user?.id,
        category,
        title,
        description,
        perk,
        isPremium
      });
      
      if (notifyCommunityLeaders) {
        notifyCommunityLeaders(communityId, '🛍️ New Service Pitch', `${user?.name || 'A member'} has pitched a new service: ${title}`, `/community/${communityId}/admin`);
      }
      
      setIsSubmitting(false);
      toast.success('Pitch Submitted!', 'The community leader will review your service shortly.');
      onClose();
      
      // Reset form
      setCategory('');
      setTitle('');
      setDescription('');
      setPerk('');
      setIsPremium(false);
    }, 1500);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '500px', 
        background: 'var(--slate-900)', 
        borderTopLeftRadius: '24px', 
        borderTopRightRadius: '24px', 
        padding: '24px 24px 100px 24px',
        maxHeight: '90dvh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--white)', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Pitch Your Service</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--white)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
          Are you a local freelancer or business? Offer a service or exclusive perk to this community!
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Category *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className="interactive-press"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '10px 14px', borderRadius: '99px',
                      background: isSelected ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)'}`,
                      color: isSelected ? 'var(--teal-400)' : 'var(--slate-300)',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    <Icon size={14} /> {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Business / Service Name *</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Sarah's Graphic Design"
              value={title} 
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>The Pitch *</label>
            <textarea 
              required
              placeholder="What do you do, and why should the community hire you?"
              value={description} 
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Exclusive Community Perk (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 15% off your first project with me"
              value={perk} 
              onChange={e => setPerk(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ 
            padding: '16px', 
            background: isPremium ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.03)', 
            borderRadius: '16px', 
            border: isPremium ? '1.5px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.2s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isPremium} 
                onChange={e => setIsPremium(e.target.checked)}
                style={{ marginTop: '4px', width: '20px', height: '20px', accentColor: '#f59e0b' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '0.98rem', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <span>Sponsor & Featured Placement</span>
                  <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>£15.00/mo</span>
                </div>
                <div style={{ color: 'var(--slate-300)', fontSize: '0.82rem', lineHeight: 1.4, marginBottom: '8px' }}>
                  Pin your service to the top of the community directory with a gold Featured badge to attract local clients.
                </div>
                
                {/* Transparent Fundraising Split */}
                <div style={{ 
                  background: 'rgba(0,0,0,0.25)', 
                  borderRadius: '10px', 
                  padding: '8px 12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--slate-300)'
                }}>
                  <span><strong style={{ color: '#34d399' }}>£12.00/mo (80%)</strong> to Club Leader Fund</span>
                  <span><strong style={{ color: 'var(--slate-400)' }}>£3.00/mo (20%)</strong> platform</span>
                </div>
              </div>
            </label>
            
            {isPremium && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                <Shield size={14} color="#34d399" />
                <span>Zero hassle: Billing only starts after the community leader accepts your pitch. Cancel anytime.</span>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textAlign: 'center', lineHeight: 1.4 }}>
            Leaders review pitches in their dashboard inbox. Direct marketing DMs are disabled to protect leader focus.
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary interactive-press" style={{ padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, marginTop: '8px', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Processing...' : 'Submit Pitch to Leader'}
          </button>
        </form>
      </div>
    </div>
  );
}
