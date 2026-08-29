"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';
import { createFeedPostAction, toggleFeedPostLikeAction, createFeedPostCommentAction, deleteFeedPostAction, deleteCommentAction, getUserLikesAction } from '../lib/actions';

const FeedContext = createContext({});

export function FeedProvider({ children }) {
  const { authUser } = useAuth();
  const { user } = useAppContext();
  const [feedPosts, setFeedPosts] = useState([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  useEffect(() => {
    if (!authUser || !user) return;
    
    const fetchFeedData = async () => {
      setIsFeedLoading(true);
      try {
        const { data, error } = await supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(100);

        let userLikes = [];
        if (user?.id && data?.length) {
          const postIds = data.map(p => p.id);
          try {
            const { session } = await supabase.auth.getSession();
            const likesData = await getUserLikesAction(postIds, user.id, session?.access_token);
            if (likesData) userLikes = likesData.map(l => l.post_id);
          } catch (e) {
            console.error("Failed to load likes", e);
          }
        }

        if (data) {
          setFeedPosts(data.map(post => ({
            id: post.id,
            communityId: post.community_id,
            authorId: post.author_id,
            text: post.text,
            media: post.media,
            likes: post.likes || 0,
            comments: post.comments || 0,
            liked: userLikes.includes(post.id),
            createdAt: post.created_at,
          })));
        }
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        setIsFeedLoading(false);
      }
    };

    fetchFeedData();

    // Realtime Subscriptions
    const subFeed = supabase.channel('feed:posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, payload => {
        setFeedPosts(prev => {
          if (prev.find(p => p.id === payload.new.id)) return prev;
          return [{
            id: payload.new.id,
            communityId: payload.new.community_id,
            authorId: payload.new.author_id,
            text: payload.new.text,
            media: payload.new.media,
            likes: payload.new.likes || 0,
            createdAt: payload.new.created_at,
          }, ...prev];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feed_posts' }, payload => {
        setFeedPosts(prev => prev.map(p => p.id === payload.new.id ? {
          ...p,
          likes: payload.new.likes || 0
        } : p));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subFeed);
    };
  }, [authUser, user]);

  const createFeedPost = async (communityId, text, media = null) => {
    if (!user.id) return;
    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      let mediaUrl = media;
      
      const data = await createFeedPostAction(communityId, user.id, text, mediaUrl, token);
      
      const newPost = {
        id: data.id,
        communityId: data.community_id,
        authorId: data.author_id,
        text: data.content,
        media: data.media_url,
        likes: data.likes,
        createdAt: data.created_at,
      };
      
      setFeedPosts(prev => [newPost, ...prev]);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const likeFeedPost = async (postId) => {
    if (!user.id) return;
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isLiked = post.liked;
    const increment = isLiked ? -1 : 1;
    
    // Optimistic update
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) + increment), liked: !isLiked } : p));
    
    try {
      const { session } = await supabase.auth.getSession();
      await toggleFeedPostLikeAction(postId, user.id, session?.access_token);
    } catch (err) {
      console.error(err);
      // Revert on failure
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - increment), liked: isLiked } : p));
    }
  };

  const createFeedComment = async (postId, text, communityId, mediaUrl = null) => {
    if (!user.id || (!text.trim() && !mediaUrl)) return;
    try {
      const { session } = await supabase.auth.getSession();
      await createFeedPostCommentAction(postId, communityId, user.id, text, mediaUrl, session?.access_token);
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteFeedPost = async (postId) => {
    if (!user.id) return;
    try {
      const { session } = await supabase.auth.getSession();
      await deleteFeedPostAction(postId, session?.access_token);
      setFeedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteComment = async (commentId, postId) => {
    if (!user.id) return;
    try {
      const { session } = await supabase.auth.getSession();
      await deleteCommentAction(commentId, postId, session?.access_token);
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: Math.max(0, (p.comments || 0) - 1) } : p));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <FeedContext.Provider value={{
      feedPosts, isFeedLoading,
      createFeedPost, likeFeedPost, createFeedComment, deleteFeedPost, deleteComment
    }}>
      {children}
    </FeedContext.Provider>
  );
}

export const useFeed = () => useContext(FeedContext);
