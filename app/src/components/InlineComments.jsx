import React, { useState, useEffect } from 'react';
import { Send, Trash2, Flag, Image as ImageIcon, Smile } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { getCommentsAction } from '../lib/actions';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function InlineComments({ post }) {
  const { users, user, communities, createFeedComment, uploadImage } = useAppContext();
  const { deleteComment } = useFeed();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentImage, setNewCommentImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiObject) => {
    setNewComment(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (!post) return;
    setIsLoading(true);
    
    // Fetch initial comments
    const fetchComments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const data = await getCommentsAction(post.id, post.communityId, session?.access_token);
        if (data) setComments(data);
      } catch (e) {
        console.error("Failed to load comments", e);
      }
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
  }, [post]);

  if (!post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!newComment.trim() && !newCommentImage) || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let mediaUrl = null;
      if (newCommentImage) {
        mediaUrl = await uploadImage(newCommentImage, 'comments');
      }
      await createFeedComment(post.id, newComment, post.communityId, mediaUrl);
      setNewComment('');
      setNewCommentImage(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.01)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Comments List */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '12px 0' }}>Loading...</div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem', padding: '12px 0' }}>
            No comments yet. Be the first to reply!
          </div>
        ) : (
          comments.map(comment => {
            const author = users.find(u => u.id === comment.author_id) || { name: 'Unknown User', avatar: 'https://ui-avatars.com/api/?name=U' };
            return (
              <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                <img src={author.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', marginTop: '2px' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{author.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                        {new Date(comment.created_at).toLocaleDateString()} at {comment.timestamp}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(post.communityId && communities.find(c => c.id === post.communityId)?.leaderId === user?.id || comment.author_id === user?.id) && (
                        <button onClick={() => deleteComment(comment.id, post.id)} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--rose-400)', cursor: 'pointer', padding: '2px', opacity: 0.7 }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                      {comment.author_id !== user?.id && (
                        <button className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', padding: '2px', opacity: 0.7 }}>
                          <Flag size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--slate-300)', fontSize: '0.9rem', marginTop: '2px', lineHeight: '1.4' }}>
                    {comment.text}
                  </div>
                  {comment.media_url && (
                    <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden' }}>
                      <img src={comment.media_url} alt="Comment media" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      {newCommentImage && (
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={URL.createObjectURL(newCommentImage)} alt="Preview" style={{ height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
            <button onClick={() => setNewCommentImage(null)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--slate-800)', border: 'none', color: 'white', width: '18px', height: '18px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✕</button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <label style={{
          cursor: 'pointer',
          color: 'var(--slate-400)',
          padding: '6px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewCommentImage(e.target.files[0])} />
          <ImageIcon size={18} />
        </label>
        <div style={{ position: 'relative' }}>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="interactive-press" style={{ background: 'none', border: 'none', color: showEmojiPicker ? 'var(--teal-400)' : 'var(--slate-400)', padding: '6px', cursor: 'pointer', display: 'flex' }}>
            <Smile size={18} />
          </button>
          {showEmojiPicker && (
            <div style={{ position: 'absolute', bottom: '40px', left: '0', zIndex: 100 }}>
              <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
            </div>
          )}
        </div>
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '8px 14px',
            color: 'white',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
        <button 
          type="submit" 
          disabled={(!newComment.trim() && !newCommentImage) || isSubmitting}
          className="interactive-press"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: (newComment.trim() || newCommentImage) ? 'var(--teal-500)' : 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: (newComment.trim() || newCommentImage) ? 'white' : 'var(--slate-500)',
            cursor: (newComment.trim() || newCommentImage) ? 'pointer' : 'default',
            transition: 'all 0.2s'
          }}
        >
          {isSubmitting ? <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Send size={14} style={{ marginLeft: '2px' }} />}
        </button>
      </form>
    </div>
  );
}
