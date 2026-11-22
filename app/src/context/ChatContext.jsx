"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useAppContext } from './AppContext';
import { useToast } from '../components/Toast';
import { sendMessageAction, sendDirectMessageAction, updateMessageAction, addReactionAction, removeReactionAction } from '../lib/actions';

const ChatContext = createContext({});

function dedupeLatestReceipts(rows = []) {
  const map = new Map();
  (rows || []).forEach((row) => {
    if (!row || !row.channel_id) return;
    const key = `${row.community_id || '__DM__'}::${row.channel_id}`;
    const prev = map.get(key);
    const rowMs = new Date(row.last_read_at || 0).getTime();
    const prevMs = prev ? new Date(prev.last_read_at || 0).getTime() : -1;
    if (!prev || rowMs >= prevMs) {
      map.set(key, row);
    }
  });
  return Array.from(map.values());
}

export function ChatProvider({ children }) {
  const { authUser } = useAuth();
  const { user } = useAppContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [chatReadReceipts, setChatReadReceipts] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(true);

  const authUserId = authUser?.id || '';
  const isAdminFlag = Boolean(user?.isAdmin);
  const joinedKey = Array.isArray(user?.joinedCommunities)
    ? [...user.joinedCommunities].filter(Boolean).sort().join(',')
    : '';

  useEffect(() => {
    if (!authUserId || !user?.id) return;
    let cancelled = false;
    
    const fetchChatData = async () => {
      if (messages.length === 0 && directMessages.length === 0) {
        setIsChatLoading(true);
      }
      try {
        const joinedCommunityIds = joinedKey ? joinedKey.split(',') : [];
        const messagesQuery = !isAdminFlag && joinedCommunityIds.length > 0
          ? supabase
              .from('messages')
              .select('*')
              .in('community_id', joinedCommunityIds)
              .order('created_at', { ascending: false })
              .limit(300)
          : supabase
              .from('messages')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(300);

        const [msgRes, dmRes, readRes] = await Promise.all([
          messagesQuery,
          supabase.from('direct_messages').select('*')
            .or(`sender_id.eq.${authUserId},receiver_id.eq.${authUserId}`)
            .order('created_at', { ascending: true }),
          supabase.from('chat_read_receipts').select('*').eq('user_id', authUserId).order('last_read_at', { ascending: false }),
        ]);
        if (cancelled) return;

        const msgIds = msgRes.data ? msgRes.data.map(m => m.id) : [];
        const dmIds = dmRes.data ? dmRes.data.map(m => m.id) : [];

        const [msgReactRes, dmReactRes] = await Promise.all([
          msgIds.length > 0 ? supabase.from('message_reactions').select('*').in('message_id', msgIds) : { data: [] },
          dmIds.length > 0 ? supabase.from('direct_message_reactions').select('*').in('message_id', dmIds) : { data: [] }
        ]);

        if (msgRes.data) {
          setMessages(msgRes.data.reverse().map(msg => ({
            id: msg.id,
            communityId: msg.community_id,
            channel: msg.channel,
            senderId: msg.author_id,
            authorId: msg.author_id,
            text: msg.text,
            image: msg.image,
            createdAt: msg.created_at,
            created_at: msg.created_at,
            timestamp: msg.created_at,
            parentId: msg.parent_id || null,
            reactions: msgReactRes.data ? msgReactRes.data.filter(r => r.message_id === msg.id) : []
          })));
        }

        if (dmRes.data) {
          setDirectMessages(dmRes.data.map(dm => ({
            id: dm.id,
            senderId: dm.sender_id,
            receiverId: dm.receiver_id,
            text: dm.text,
            image: dm.image,
            createdAt: dm.created_at,
            created_at: dm.created_at,
            timestamp: dm.created_at,
            parentId: dm.parent_id || null,
            reactions: dmReactRes.data ? dmReactRes.data.filter(r => r.message_id === dm.id) : []
          })));
        }

        if (readRes.data) {
          setChatReadReceipts(dedupeLatestReceipts(readRes.data));
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
            authorId: payload.new.author_id,
            text: payload.new.text,
            image: payload.new.image,
            createdAt: payload.new.created_at,
            created_at: payload.new.created_at,
            timestamp: payload.new.created_at,
            parentId: payload.new.parent_id || null,
            reactions: []
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
            createdAt: payload.new.created_at,
            created_at: payload.new.created_at,
            timestamp: payload.new.created_at,
            parentId: payload.new.parent_id || null,
            reactions: []
          }];
        });
      }).subscribe();

    const subMsgReactions = supabase.channel('chat:message_reactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.message_id ? { ...m, reactions: [...(m.reactions || []), payload.new] } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.old.message_id ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== payload.old.id) } : m));
      }).subscribe();

    const subDMReactions = supabase.channel('chat:dm_reactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_message_reactions' }, payload => {
        setDirectMessages(prev => prev.map(m => m.id === payload.new.message_id ? { ...m, reactions: [...(m.reactions || []), payload.new] } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_message_reactions' }, payload => {
        setDirectMessages(prev => prev.map(m => m.id === payload.old.message_id ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== payload.old.id) } : m));
      }).subscribe();
      
    const subReads = supabase.channel('chat:read_receipts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_read_receipts', filter: `user_id=eq.${authUser.id}` }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setChatReadReceipts(prev => dedupeLatestReceipts([...prev, payload.new]));
        }
      }).subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subMessages);
      supabase.removeChannel(subDMs);
      supabase.removeChannel(subMsgReactions);
      supabase.removeChannel(subDMReactions);
      supabase.removeChannel(subReads);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId, isAdminFlag, joinedKey]);

  const sendMessage = async (communityId, channel, text, image = '', parentId = null) => {
    if (!user.id) return;
    const tempId = 'temp-' + Date.now();
    const newMessage = { id: tempId, communityId, channel, senderId: user.id, text, image, createdAt: new Date().toISOString(), parentId, reactions: [] };
    setMessages(prev => [...prev, newMessage]);

    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      
      const data = await sendMessageAction({
        communityId,
        channel,
        authorId: user.id,
        text,
        image,
        parentId
      }, token);
      
      setMessages(prev => {
        if (prev.some(m => m.id === data.id && m.id !== tempId)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { id: data.id, communityId: data.community_id, channel: data.channel, senderId: data.author_id, text: data.text, image: data.image, createdAt: data.created_at, parentId: data.parent_id || null, reactions: [] } : m);
      });
      markChatRead(communityId, channel);
    } catch (err) {
      console.error(err);
      toast.error('Send Failed', 'Could not send message. Please refresh or log in again.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const sendDirectMessage = async (receiverId, text, image, parentId = null) => {
    if (!user.id) return;
    const tempId = 'temp-' + Date.now();
    const newMessage = { id: tempId, senderId: user.id, receiverId, text, image, createdAt: new Date().toISOString(), parentId, reactions: [] };
    setDirectMessages(prev => [...prev, newMessage]);

    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      
      const data = await sendDirectMessageAction(user.id, receiverId, text, image, parentId, token);
      setDirectMessages(prev => {
        if (prev.some(m => m.id === data.id && m.id !== tempId)) return prev.filter(m => m.id !== tempId);
        return prev.map(m => m.id === tempId ? { id: data.id, senderId: data.sender_id, receiverId: data.receiver_id, text: data.text, image: data.image, createdAt: data.created_at, parentId: data.parent_id || null, reactions: [] } : m);
      });
      markChatRead(null, receiverId);
    } catch (err) {
      console.error(err);
      toast.error('Send Failed', 'Could not send DM. Please refresh or log in again.');
      setDirectMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const markChatRead = async (communityId, channelId) => {
    if (!user?.id || !channelId) return;
    const normCommId = communityId || null;

    // Guard against client/server clock skew by ensuring last_read_at >= newest message + 1s
    let latestMsgMs = 0;
    if (!normCommId) {
      directMessages.forEach((m) => {
        if (
          (m.senderId === channelId && m.receiverId === user.id) ||
          (m.senderId === user.id && m.receiverId === channelId)
        ) {
          const ms = new Date(m.createdAt || m.created_at || 0).getTime();
          if (ms > latestMsgMs) latestMsgMs = ms;
        }
      });
    } else {
      messages.forEach((m) => {
        if (m.communityId === normCommId && (m.channel === channelId || m.channelId === channelId)) {
          const ms = new Date(m.createdAt || m.created_at || 0).getTime();
          if (ms > latestMsgMs) latestMsgMs = ms;
        }
      });
    }
    const readIso = new Date(Math.max(Date.now(), latestMsgMs + 1000)).toISOString();

    setChatReadReceipts(prev =>
      dedupeLatestReceipts([
        ...prev.filter(
          (r) => !((r.community_id || null) === normCommId && r.channel_id === channelId)
        ),
        { user_id: user.id, community_id: normCommId, channel_id: channelId, last_read_at: readIso },
      ])
    );

    try {
      if (!normCommId) {
        // Postgres UNIQUE(user_id, community_id, channel_id) treats NULL != NULL,
        // so upsert inserts duplicate DM rows instead of updating. Update existing
        // NULL rows directly, and only insert when none exist yet.
        const { data: updatedRows, error: updateErr } = await supabase
          .from('chat_read_receipts')
          .update({ last_read_at: readIso })
          .eq('user_id', user.id)
          .is('community_id', null)
          .eq('channel_id', channelId)
          .select('id');

        if (updateErr) throw updateErr;

        if (!updatedRows || updatedRows.length === 0) {
          const { error: insertErr } = await supabase
            .from('chat_read_receipts')
            .insert([
              { user_id: user.id, community_id: null, channel_id: channelId, last_read_at: readIso },
            ]);
          if (insertErr) throw insertErr;
        }
      } else {
        await supabase.from('chat_read_receipts').upsert(
          [{ user_id: user.id, community_id: normCommId, channel_id: channelId, last_read_at: readIso }],
          { onConflict: 'user_id,community_id,channel_id' }
        );
      }
    } catch (err) {
      console.error('Failed to persist read receipt:', err);
    }
  };

  const reactToMessage = async (messageId, emoji, isDirectMessage = false) => {
    if (!user.id) return;
    
    const collection = isDirectMessage ? directMessages : messages;
    const msg = collection.find(m => m.id === messageId);
    if (!msg) return;

    const existingReaction = (msg.reactions || []).find(r => r.user_id === user.id && r.emoji === emoji);

    const updater = prev => prev.map(m => {
      if (m.id !== messageId) return m;
      let newReactions = m.reactions || [];
      if (existingReaction) {
        newReactions = newReactions.filter(r => !(r.user_id === user.id && r.emoji === emoji));
      } else {
        newReactions = [...newReactions, { id: 'temp-' + Date.now(), message_id: messageId, user_id: user.id, emoji }];
      }
      return { ...m, reactions: newReactions };
    });
    
    if (isDirectMessage) setDirectMessages(updater);
    else setMessages(updater);

    try {
      const sessionResponse = await supabase.auth.getSession();
      const token = sessionResponse.data.session?.access_token;
      
      if (existingReaction) {
        await removeReactionAction(messageId, isDirectMessage, emoji, user.id, token);
      } else {
        await addReactionAction(messageId, isDirectMessage, emoji, user.id, token);
      }
    } catch (err) {
      console.error('Reaction failed:', err);
      const reverter = prev => prev.map(m => m.id === messageId ? { ...m, reactions: msg.reactions || [] } : m);
      if (isDirectMessage) setDirectMessages(reverter);
      else setMessages(reverter);
    }
  };

  const loadChannelMessages = async (communityId, channel) => {
    if (!communityId || !channel) return [];
    try {
      const { data: channelRows, error } = await supabase
        .from('messages')
        .select('*')
        .eq('community_id', communityId)
        .eq('channel', channel)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !channelRows) return [];

      const orderedRows = [...channelRows].reverse();
      const msgIds = orderedRows.map(m => m.id).filter(Boolean);
      let reactionsData = [];
      if (msgIds.length > 0) {
        const { data: reactRows } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', msgIds);
        reactionsData = reactRows || [];
      }

      const mapped = orderedRows.map(msg => ({
        id: msg.id,
        communityId: msg.community_id,
        channel: msg.channel,
        senderId: msg.author_id,
        authorId: msg.author_id,
        text: msg.text,
        image: msg.image,
        createdAt: msg.created_at,
        created_at: msg.created_at,
        timestamp: msg.created_at,
        parentId: msg.parent_id || null,
        reactions: reactionsData.filter(r => r.message_id === msg.id)
      }));

      setMessages(prev => {
        const fetchedIds = new Set(mapped.map(m => m.id));
        const maxFetchedMs = mapped.reduce(
          (max, m) => Math.max(max, new Date(m.createdAt || 0).getTime()),
          0
        );
        const keepRecentOrOptimistic = prev.filter(m => {
          if (m.communityId !== communityId || m.channel !== channel) return false;
          if (fetchedIds.has(m.id)) return false;
          const msgMs = new Date(m.createdAt || m.created_at || 0).getTime();
          return String(m.id).startsWith('temp') || String(m.id).startsWith('msg_') || msgMs > maxFetchedMs;
        });
        const otherChannelMessages = prev.filter(
          m => !(m.communityId === communityId && m.channel === channel)
        );
        return [...otherChannelMessages, ...mapped, ...keepRecentOrOptimistic].sort(
          (a, b) => new Date(a.createdAt || a.created_at || 0).getTime() - new Date(b.createdAt || b.created_at || 0).getTime()
        );
      });

      return mapped;
    } catch (err) {
      console.error('Error loading channel messages:', err);
      return [];
    }
  };

  return (
    <ChatContext.Provider value={{
      messages, directMessages, chatReadReceipts, isChatLoading,
      loadChannelMessages, sendMessage, sendDirectMessage, markChatRead, reactToMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
