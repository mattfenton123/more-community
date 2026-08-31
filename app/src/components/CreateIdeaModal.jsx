import React, { useState } from 'react';
import { X, MapPin, Lightbulb } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useAppContext } from '../context/AppContext';

export default function CreateIdeaModal({ isOpen, onClose, communityId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createFeedPost } = useFeed();
  const { user } = useAppContext();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    setIsSubmitting(true);
    try {
      const postText = `💡 **SUGGESTION:**\n**${title.trim()}**\n\n${description.trim()}${location ? `\n\n📍 Location: ${location.trim()}` : ''}`;
      
      await createFeedPost(communityId, postText);
      setTitle('');
      setDescription('');
      setLocation('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to suggest idea.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} onClick={onClose} />
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--slate-900)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 24px 100px 24px', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--white)', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={24} color="var(--amber-400)" /> Suggest an Idea
        </h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Suggest an event, experience, or place to visit for the community.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Idea Title</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Let's do a 5k parkrun this weekend!"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Location (Optional)</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Dunorlan Park"
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Details</label>
            <textarea 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Why should we do this? What's the plan?"
              style={{ width: '100%', minHeight: '120px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '1rem', resize: 'none' }}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary interactive-press" style={{ padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 700, marginTop: '8px' }}>
            {isSubmitting ? 'Posting...' : 'Post Idea'}
          </button>
        </form>
      </div>
    </div>
  );
}
