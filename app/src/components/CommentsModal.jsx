import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';

export default function CommentsModal({ isOpen, onClose, post }) {
  const { users, createFeedComment } = useAppContext();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !post) return;
    
    setIsLoading(true);
    
    // Fetch initial comments
    const fetchComments = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('community_id', 'feed_comments_' + post.communityId)
        .eq('channel', post.id)
        .order('created_at', { ascending: true });
        
      if (data) setComments(data);
      setIsLoading(false);
    };
    
    fetchComments();
    
    // Subscribe to new comments
    const sub = supabase.channel('comments:' + post.id)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel=eq.${post.id}`
      }, payload => {
        setComments(prev => [...prev, payload.new]);
      })
      .subscribe();
      
    return () => supabase.removeChannel(sub);
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await createFeedComment(post.id, newComment, post.communityId);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div className="slide-up" style={{
        background: 'var(--slate-900)',
        width: '100%',
        maxWidth: '500px',
        height: '80vh',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Comments</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--slate-400)', marginTop: '20px' }}>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--slate-400)', marginTop: '40px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💭</div>
              No comments yet. Be the first to reply!
            </div>
          ) : (
            comments.map(comment => {
              const author = users.find(u => u.id === comment.author_id) || { name: 'Unknown User', avatar: 'https://ui-avatars.com/api/?name=U' };
              return (
                <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                  <img src={author.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>{author.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        {new Date(comment.created_at).toLocaleDateString()} at {comment.timestamp}
                      </span>
                    </div>
                    <div style={{ color: 'var(--slate-300)', fontSize: '0.95rem', marginTop: '4px', lineHeight: '1.4' }}>
                      {comment.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex',
          gap: '12px'
        }}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              padding: '12px 16px',
              color: 'white',
              outline: 'none',
              fontSize: '0.95rem'
            }}
          />
          <button 
            type="submit" 
            disabled={!newComment.trim() || isSubmitting}
            className="interactive-press"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: newComment.trim() ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: newComment.trim() ? 'white' : 'var(--slate-400)',
              cursor: newComment.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
          >
            <Send size={18} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
