"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';
import { useToast } from '../components/Toast';
import { sendMessageAction, sendDirectMessageAction, updateMessageAction } from '../lib/actions';

const ChatContext = createContext({});

export function ChatProvider({ children }) {
  const { authUser } = useAuth();
  const { user } = useAppContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [chatReadReceipts, setChatReadReceipts] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(true);

  useEffect(() => {
    if (!authUser || !user) return;
    
    const fetchChatData = async () => {
      setIsChatLoading(true);
      try {
        const [msgRes, dmRes, readRes] = await Promise.all([
          supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(200),
          supabase.from('direct_messages').select('*')
            .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
            .order('created_at', { ascending: true }),
          supabase.from('chat_read_receipts').select('*').eq('user_id', authUser.id),
        ]);

        if (msgRes.data) {
          setMessages(msgRes.data.reverse().map(msg => ({
            id: msg.id,
            communityId: msg.community_id,
            channel: msg.channel,
            senderId: msg.author_id,
            text: msg.text,
            image: msg.image,
            createdAt: msg.created_at,
          })));
        }

        if (dmRes.data) {
          setDirectMessages(dmRes.data.map(dm => ({
            id: dm.id,
            senderId: dm.sender_id,
            receiverId: dm.receiver_id,
            text: dm.text,
            createdAt: dm.created_at
          })));
        }

        if (readRes.data) {
          setChatReadReceipts(readRes.data);
        }
      } catch (err) {
        console.error("Chat fetch error:", err);
      } finally {
        setIsChatLoading(false);
      }
    };

    fetchChatData();

    // Realtime Subscriptions
    const subMessages = supabase.channel('chat:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, {
            id: payload.new.id,
            communityId: payload.new.community_id,
            channel: payload.new.channel,
            senderId: payload.new.author_id,
            text: payload.new.text,
            image: payload.new.image,
            createdAt: payload.new.created_at,
          }];
        });
      }).subscribe();

    const subDMs = supabase.channel('chat:direct_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        setDirectMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            receiverId: payload.new.receiver_id,
            text: payload.new.text,
            image: payload.new.image,
            createdAt: payload.new.created_at
          }];
        });
      }).subscribe();
      
    const subReads = supabase.channel('chat:read_receipts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_read_receipts', filter: `user_id=eq.${authUser.id}` }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setChatReadReceipts(prev => {
            const exists = prev.find(r => r.user_id === payload.new.user_id && r.community_id === payload.new.community_id && r.channel_id === payload.new.channel_id);
            if (exists) return prev.map(r => r.id === payload.new.id ? payload.new : r);
            return [...prev, payload.new];
          });
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(subMessages);
      supabase.removeChannel(subDMs);
      supabase.removeChannel(subReads);
    };
  }, [authUser, user]);

  const sendMessage = async (communityId, channel, text, image = '') => {
    if (!user.id) return;
    const tempId = 'temp-' + Date.now();
    const newMessage = { id: tempId, communityId, channel, senderId: user.id, text, image, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, newMessage]);

    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      
      const data = await sendMessageAction({
        communityId,
        channel,
        authorId: user.id,
        text,
        image
      }, token);
      
      setMessages(prev => {
        if (prev.some(m => m.id === data.id && m.id !== tempId)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { id: data.id, communityId: data.community_id, channel: data.channel, senderId: data.author_id, text: data.text, image: data.image, createdAt: data.created_at } : m);
      });
      markChatRead(communityId, channel);
    } catch (err) {
      console.error(err);
      toast.error('Send Failed', 'Could not send message. Please refresh or log in again.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const sendDirectMessage = async (receiverId, text, image) => {
    if (!user.id) return;
    const tempId = 'temp-' + Date.now();
    const newMessage = { id: tempId, senderId: user.id, receiverId, text, image, createdAt: new Date().toISOString() };
    setDirectMessages(prev => [...prev, newMessage]);

    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      
      const data = await sendDirectMessageAction(user.id, receiverId, text, image, token);
      setDirectMessages(prev => {
        if (prev.some(m => m.id === data.id && m.id !== tempId)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { id: data.id, senderId: data.sender_id, receiverId: data.receiver_id, text: data.text, image: data.image, createdAt: data.created_at } : m);
      });
      markChatRead(null, receiverId);
    } catch (err) {
      console.error(err);
      toast.error('Send Failed', 'Could not send DM. Please refresh or log in again.');
      setDirectMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const markChatRead = async (communityId, channelId) => {
    if (!user.id) return;
    setChatReadReceipts(prev => {
      const exists = prev.find(r => r.community_id === communityId && r.channel_id === channelId);
      if (exists) return prev.map(r => r.id === exists.id ? { ...r, last_read_at: new Date().toISOString() } : r);
      return [...prev, { user_id: user.id, community_id: communityId, channel_id: channelId, last_read_at: new Date().toISOString() }];
    });
    try {
      await supabase.from('chat_read_receipts').upsert(
        [{ user_id: user.id, community_id: communityId, channel_id: channelId, last_read_at: new Date().toISOString() }],
        { onConflict: 'user_id,community_id,channel_id' }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    if (!user.id) return;
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    // Parse existing reactions if any
    let currentText = msg.text || '';
    let rawReactions = {};
    const metaMatch = currentText.match(/<!--REACTIONS:(.*?)-->/);
    if (metaMatch && metaMatch[1]) {
      try {
        rawReactions = JSON.parse(metaMatch[1]);
        currentText = currentText.replace(metaMatch[0], '');
      } catch (e) {}
    }

    // Toggle reaction logic
    if (!rawReactions[emoji]) {
      rawReactions[emoji] = [];
    }
    const userIndex = rawReactions[emoji].indexOf(user.id);
    if (userIndex > -1) {
      rawReactions[emoji].splice(userIndex, 1);
      if (rawReactions[emoji].length === 0) delete rawReactions[emoji];
    } else {
      rawReactions[emoji].push(user.id);
    }

    const newText = `${currentText}<!--REACTIONS:${JSON.stringify(rawReactions)}-->`;

    // Optimistic UI update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText } : m));

    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      await updateMessageAction(messageId, { text: newText }, token);
    } catch (err) {
      console.error('Reaction failed:', err);
      // Revert optimism
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: msg.text } : m));
    }
  };

  return (
    <ChatContext.Provider value={{
      messages, directMessages, chatReadReceipts, isChatLoading,
      sendMessage, sendDirectMessage, markChatRead, reactToMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
