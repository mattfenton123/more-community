import React, { useState } from 'react';
import { Star, X, Share2, MessageCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { useToast } from './Toast';
import { submitReview } from '../actions/reviews';

export default function ReviewForm({ communityId, onClose }) {
  const { user, addReview } = useAppContext();
  const { createFeedPost } = useFeed();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Missing feedback', 'Please share some thoughts in your review.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = await submitReview(user.id, communityId, 'community', rating, content);
      
      // Update local state so it appears immediately
      addReview({
        ...data,
        user_id: user.id,
        created_at: new Date().toISOString()
      });

      // Virality Mechanic: Auto-post 5-star reviews to the feed
      if (rating === 5) {
        await createFeedPost(communityId, `⭐️⭐️⭐️⭐️⭐️\n\nJust left a 5-star review: "${content}"`);
      }

      toast.success('Review published!', 'Thank you for your feedback.');
      setIsSuccess(true);
    } catch (err) {
      toast.error('Could not submit review', err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: 'var(--slate-900)', width: '100%', maxWidth: '600px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'white', margin: 0 }}>Leave a Review</h3>
          <button onClick={onClose} className="interactive-press" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
              <h4 style={{ fontSize: '1.2rem', color: 'white', margin: '0 0 8px 0' }}>Review Published!</h4>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: 0 }}>
                {rating === 5 
                  ? "Thank you for the 5-star rating! Your review has been posted to the community feed." 
                  : "Thank you for your feedback. We appreciate your honesty."}
              </p>
            </div>

            {rating === 5 && (
              <div style={{ width: '100%', background: 'linear-gradient(135deg, var(--teal-600), var(--slate-900))', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                  <Star size={120} fill="white" />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: '4px', color: 'var(--yellow-400)', marginBottom: '16px' }}>
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0', lineHeight: 1.3 }}>
                    "{content}"
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={user?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                      <strong>{user?.name}</strong> on more.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ width: '100%', display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline interactive-press" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '0.95rem' }}>
                Close
              </button>
              {rating === 5 && (
                <button type="button" onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'My 5-Star Review',
                      text: `I just gave a 5-star review on more.: "${content}"`,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    toast.info('Copied link!', 'Share this with your friends.');
                  }
                }} className="btn btn-primary interactive-press" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Share2 size={16} /> Share Card
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px' }}>Your Rating</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <Star size={36} fill={i <= rating ? "var(--teal-400)" : "none"} color={i <= rating ? "var(--teal-400)" : "var(--slate-600)"} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px' }}>Your Feedback</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you love about this community? What could be better?"
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: 'white', minHeight: '120px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none', outline: 'none' }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-outline interactive-press" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '0.95rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary interactive-press" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '0.95rem', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
