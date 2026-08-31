import React, { useState } from 'react';
import { Star, MessageCircle, MoreVertical } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ReviewsList({ communityId, onAddReview }) {
  const { reviews, users } = useAppContext();
  
  // Filter and sort reviews
  const communityReviews = reviews
    .filter(r => r.target_id === communityId && r.target_type === 'community')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Calculate stats
  const totalReviews = communityReviews.length;
  const averageRating = totalReviews > 0 
    ? (communityReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  communityReviews.forEach(r => ratingCounts[r.rating]++);

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 4px 0' }}>Reviews</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', margin: 0 }}>What members are saying</p>
        </div>
        <button 
          onClick={onAddReview}
          className="btn btn-primary interactive-press" 
          style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '12px' }}
        >
          Leave a Review
        </button>
      </div>

      {/* Stats Breakdown */}
      {totalReviews > 0 ? (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', lineHeight: 1 }}>{averageRating}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', color: 'var(--teal-400)', margin: '8px 0' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={16} fill={i <= Math.round(averageRating) ? "currentColor" : "none"} strokeWidth={i <= Math.round(averageRating) ? 0 : 1} />
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>{totalReviews} Ratings</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[5, 4, 3, 2, 1].map(stars => {
              const count = ratingCounts[stars];
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', width: '45px' }}>{stars} Stars</div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--teal-500)', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', width: '30px', textAlign: 'right' }}>{pct > 0 ? `${Math.round(pct)}%` : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '24px' }}>
          <Star size={32} color="var(--slate-600)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--slate-400)', margin: '0 0 12px 0' }}>No reviews yet. Be the first!</p>
        </div>
      )}

      {/* Review Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {communityReviews.map(review => {
          const author = users.find(u => u.id === review.user_id) || { name: 'Community Member', avatar: 'https://i.pravatar.cc/150' };
          return (
            <div key={review.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={author.avatar} alt={author.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem' }}>{author.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                      {new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2px', color: 'var(--teal-400)' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={14} fill={i <= review.rating ? "currentColor" : "none"} strokeWidth={i <= review.rating ? 0 : 1.5} />
                  ))}
                </div>
              </div>
              <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                {review.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
