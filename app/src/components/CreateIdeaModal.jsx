"use client";
import React, { useState } from 'react';
import { X, MapPin, Lightbulb, Users } from 'lucide-react';
import { useFeed } from '../context/FeedContext';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

export default function CreateIdeaModal({ isOpen, onClose, communityId: initialCommunityId }) {
  const { createFeedPost } = useFeed();
  const { user, communities, broadcastNotification } = useAppContext();
  const { toast } = useToast();

  const joinedCommunities = (communities || []).filter(c => 
    user?.joinedCommunities?.includes(c.id) || user?.ledCommunities?.includes(c.id)
  );

  const [selectedCommId, setSelectedCommId] = useState(initialCommunityId || joinedCommunities[0]?.id || communities?.[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetCommunityId = initialCommunityId || selectedCommId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Missing details', 'Please provide a title and short description for your idea.');
      return;
    }

    if (!targetCommunityId) {
      toast.error('No community selected', 'Please choose a community to submit this idea to.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const ideaData = {
        type: 'idea',
        title: title.trim(),
        location: location.trim()
      };
      
      await createFeedPost(targetCommunityId, description.trim(), JSON.stringify(ideaData));
      
      if (broadcastNotification) {
        broadcastNotification(
          targetCommunityId, 
          `💡 New Idea: ${title.trim()}`, 
          `${user?.name || 'A member'} suggested a new idea! Check it out and vote.`
        );
      }
      
      toast.success('Idea Suggested! 💡', 'Members can now view and upvote your idea.');
      setTitle('');
      setDescription('');
      setLocation('');
      onClose();
    } catch (err) {
      console.error('Failed to submit idea:', err);
      toast.error('Could not post idea', err.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} onClick={onClose} />
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '520px', background: 'var(--slate-900)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 24px 80px 24px', maxHeight: '90dvh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button onClick={onClose} className="interactive-press" style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--white)', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lightbulb size={24} color="var(--amber-400)" /> Pitch an Idea or Meetup
        </h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.4 }}>
          Suggest a hike, workshop, coffee social, or project. Community members can upvote and discuss it, and leaders can turn popular ideas into official events!
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Community Selector if not preset */}
          {!initialCommunityId && (
            <div>
              <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Post to Community</label>
              <div style={{ position: 'relative' }}>
                <Users size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select
                  value={targetCommunityId}
                  onChange={e => setSelectedCommId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'var(--white)',
                    fontSize: '0.95rem',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {(joinedCommunities.length > 0 ? joinedCommunities : (communities || [])).map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#0f172a', color: 'white' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Idea Title</label>
            <input 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sunset Walk & Pizza at Dunorlan Park"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Location or Meeting Spot (Optional)</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Dunorlan Park Cafe"
                style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '0.95rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>What's the plan?</label>
            <textarea 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell other members what you have in mind, suggested days/times, and why it'd be fun..."
              style={{ width: '100%', minHeight: '110px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', fontSize: '0.95rem', resize: 'none' }}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary interactive-press" style={{ padding: '16px', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, marginTop: '8px' }}>
            {isSubmitting ? 'Posting Idea...' : 'Pitch Idea to Community 💡'}
          </button>
        </form>
      </div>
    </div>
  );
}
