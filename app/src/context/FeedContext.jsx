"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';

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

        if (data) {
          setFeedPosts(data.map(post => ({
            id: post.id,
            communityId: post.community_id,
            authorId: post.author_id,
            text: post.content,
            media: post.media_url,
            likes: post.likes || 0,
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
            text: payload.new.content,
            media: payload.new.media_url,
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
      let mediaUrl = media;
      const { data, error } = await supabase.from('feed_posts').insert([{
        community_id: communityId,
        author_id: user.id,
        content: text,
        media_url: mediaUrl,
        likes: 0
      }]).select().single();
      
      if (error) throw error;
      
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
    // Optimistic
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    
    try {
      const post = feedPosts.find(p => p.id === postId);
      const currentLikes = post?.likes || 0;
      await supabase.from('feed_posts').update({ likes: currentLikes + 1 }).eq('id', postId);
    } catch (err) {
      console.error(err);
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 1) - 1) } : p));
    }
  };

  return (
    <FeedContext.Provider value={{
      feedPosts, isFeedLoading,
      createFeedPost, likeFeedPost
    }}>
      {children}
    </FeedContext.Provider>
  );
}

export const useFeed = () => useContext(FeedContext);
