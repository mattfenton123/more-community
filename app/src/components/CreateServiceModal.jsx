import React, { useState } from 'react';
import { Briefcase, CreditCard, X, Store, Coffee, Paintbrush, Dumbbell, Stethoscope } from 'lucide-react';
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
  const { pitchService, user } = useAppContext();
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '500px', 
        background: 'var(--slate-900)', 
        borderTopLeftRadius: '24px', 
        borderTopRightRadius: '24px', 
        padding: '24px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Pitch Your Service</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
              style={{ width: '100%', padding: '14px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>The Pitch *</label>
            <textarea 
              required
              placeholder="What do you do, and why should the community hire you?"
              value={description} 
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white', fontSize: '1rem', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.9rem', marginBottom: '8px' }}>Exclusive Community Perk (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 15% off your first project with me"
              value={perk} 
              onChange={e => setPerk(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '12px', color: 'white', fontSize: '1rem', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isPremium} 
                onChange={e => setIsPremium(e.target.checked)}
                style={{ marginTop: '4px', width: '20px', height: '20px', accentColor: 'var(--teal-500)' }}
              />
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Premium Placement <span style={{ fontSize: '0.7rem', background: 'var(--amber-500)', color: 'white', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>£15/mo</span>
                </div>
                <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                  Pin your service to the top of the directory with a highlighted gold border to attract more clients. Cancel anytime.
                </div>
              </div>
            </label>
            
            {isPremium && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-300)', fontSize: '0.9rem' }}>
                <CreditCard size={18} color="var(--slate-400)" />
                We will use the payment method on file ending in <strong>4242</strong>.
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary interactive-press" style={{ padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, marginTop: '8px', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Processing...' : 'Submit Pitch to Leader'}
          </button>
        </form>
      </div>
    </div>
  );
}
