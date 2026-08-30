"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { initialExperiences } from '../lib/constants';
import imageCompression from 'browser-image-compression';
import { createEventAction, joinCommunityAction, leaveCommunityAction, rsvpToEventAction, createCommunityAction, uploadImageAction, updateEventAction, updateCommunityAction, createChannelAction, markNotificationReadAction, updateUserAction, adminVerifyCommunityAction, broadcastNotificationAction, promoteMemberAction, removeMemberAction, subscribeToPushNotificationsAction, ensureLeadersNetworkAction } from '../lib/actions';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { authUser, session } = useAuth();
  
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [communityMemberships, setCommunityMemberships] = useState({});
  const [eventRsvps, setEventRsvps] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [prescribingLinks, setPrescribingLinks] = useState([
    { id: 'lnk-1', name: 'Mental Health Walk Link', created: '2026-08-10', uses: 14, communityId: 'mindful-miles' },
    { id: 'lnk-2', name: 'Type-2 Diabetes Active Group', created: '2026-08-15', uses: 8, communityId: 'tw-ramblers' }
  ]);
  
  // Sponsors (Mocked until DB tables are created via Supabase Dashboard)
  const [sponsors, setSponsors] = useState([
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Gusto Coffee Roasters',
      logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
      url: 'https://example.com/gusto',
      tier: 'Headline'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Kent Outdoors',
      logo: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&q=80',
      url: 'https://example.com/kent-outdoors',
      tier: 'Community'
    }
  ]);
  const [sponsorshipAssignments, setSponsorshipAssignments] = useState([
    {
      id: 'a1',
      sponsor_id: '11111111-1111-1111-1111-111111111111',
      target_id: 'yentw',
      target_type: 'community'
    },
    {
      id: 'a2',
      sponsor_id: '22222222-2222-2222-2222-222222222222',
      target_id: 'tw-ramblers',
      target_type: 'community'
    }
  ]);

  const [connectedSocialAccounts, setConnectedSocialAccounts] = useState({
    instagram: { connected: true, handle: '@more.community' },
    x: { connected: false, handle: '' },
    linkedin: { connected: false, handle: '' },
    facebook: { connected: true, handle: 'More Community' }
  });
  const [whatsappSettings, setWhatsappSettings] = useState({});
  const [chatReadReceipts, setChatReadReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute full user object with memberships based on real authUser
  const dbUser = users.find(u => u.id === authUser?.id) || {
    id: authUser?.id,
    name: authUser?.user_metadata?.full_name || authUser?.email || 'New User',
    role: 'Member',
    avatar: 'https://i.pravatar.cc/150',
    bio: 'New here.',
    joined: new Date().toISOString(),
    onboarded: false,
    interests: []
  };

  const user = { ...dbUser, joinedCommunities: [], ledCommunities: [], isAdmin: false };
    if (authUser?.email) {
      const email = authUser.email.toLowerCase();
      // ⚠️ TODO: Move admin check to a Supabase user_roles table + RLS policy.
      // This client-side list is a stopgap — DB role should be the source of truth.
      const ADMIN_EMAILS = ['msf199@hotmail.com', 'matthewfenton123@gmail.com', 'alex@maorecommunity.co.uk', 'alex@morecommunity.co.uk'];
      if (ADMIN_EMAILS.includes(email) || email.includes('matthew') || email.includes('fenton')) {
        user.isAdmin = true;
      }
    }

  if (user.id) {
    Object.keys(communityMemberships).forEach(communityId => {
      const mems = communityMemberships[communityId];
      const myMem = mems.find(m => m.userId === user.id);
      if (myMem) {
        user.joinedCommunities.push(communityId);
        if (myMem.role === 'Leader' || myMem.role === 'Co-Leader') user.ledCommunities.push(communityId);
      }
    });
  }

  // Force demo users to be a leader of the first community (so they can test leader features)
  if ((authUser?.email?.includes('demo') || user.isAdmin) && communities.length > 0 && user.ledCommunities.length === 0) {
    const targetComm = communities[0];
    user.ledCommunities.push(targetComm.id);
    if (!user.joinedCommunities.includes(targetComm.id)) user.joinedCommunities.push(targetComm.id);
  }

  // Supabase Real-time Setup & Initial Fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);

      // Batch 1: All independent queries run in parallel
      const [usersRes, commsRes, chanRes, evRes, rsvpRes, memRes] =
        await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('communities').select('*'),
          supabase.from('channels').select('*'),
          supabase.from('events').select('*'),
          supabase.from('event_rsvps').select('*'),
          supabase.from('community_memberships').select('*'),
        ]);

      // Process results
      if (usersRes.data) setUsers(usersRes.data);

      if (commsRes.data) {
        let comms = [...commsRes.data];
        // Ensure Leaders Network is in state (and seed DB if missing)
        if (!comms.find(c => c.id === 'more-leaders-network')) {
          const leadersComm = {
             id: 'more-leaders-network',
             name: 'The more. Leaders Network',
             description: 'A private space for more. leaders to collaborate, share tips, and organize cross-community events.',
             tags: ['leadership', 'network'],
             image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
             category: 'leadership',
             leader_id: null,
             is_private: true
          };
          comms.push(leadersComm);
          ensureLeadersNetworkAction().catch(e => console.error("Error ensuring leaders network:", e));
        }

        setCommunities(comms.map(c => ({
          ...c, // pass through ALL columns from Supabase
          tags: c.tags || [],
          image: c.image || c.cover_image, // support both column names
          category: (c.tags && c.tags.length > 0) ? c.tags[0] : 'All',
          metrics: { members: 1, cost: c.cost || 'Free', eventsRun: 0 },
          colors: ['#3b82f6', '#14b8a6'] // fallback gradient
        })));
      }

      if (chanRes.data) setChannels(chanRes.data);

      if (evRes.data) {
        setEvents(evRes.data.map(e => ({
          id: e.id,
          communityId: e.community_id,
          title: e.title,
          description: e.description || '',
          date: e.date,
          time: e.time,
          location: e.location,
          image: e.image,
          attendees: e.attendees,
          status: e.status || 'published',
          maxCapacity: e.max_capacity || null,
          ticketPrice: e.ticket_price || 0,
          createdAt: e.created_at
        })));
      }

      if (rsvpRes.data) {
        const rsvpMap = {};
        rsvpRes.data.forEach(r => {
          if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = [];
          rsvpMap[r.event_id].push({ userId: r.user_id, status: r.status });
        });
        setEventRsvps(rsvpMap);
      }

      if (memRes.data) {
        const memMap = {};
        memRes.data.forEach(m => {
          if (!memMap[m.community_id]) memMap[m.community_id] = [];
          memMap[m.community_id].push({ userId: m.user_id, role: m.role });
        });

        // --- Leaders Network Auto-Join Logic ---
        if (authUser?.id && user?.ledCommunities?.length > 0) {
          if (!memMap['more-leaders-network']) memMap['more-leaders-network'] = [];
          
          // If they aren't in the network yet, add them optimistically and in DB
          if (!memMap['more-leaders-network'].some(m => m.userId === authUser.id)) {
            memMap['more-leaders-network'].push({ userId: authUser.id, role: 'Member' });
            
            // Fire and forget join action
            joinCommunityAction(authUser.id, 'more-leaders-network', session?.access_token)
              .catch(e => console.error('Failed auto-join Leaders Network:', e));
              
            // Also ensure it's in their local user profile joined list
            if (!user.joinedCommunities.includes('more-leaders-network')) {
              user.joinedCommunities.push('more-leaders-network');
            }
          }
        }

        setCommunityMemberships(memMap);
      }



      // Batch 2: Auth-dependent queries (run in parallel with each other)
      if (authUser?.id) {
        const [notifRes, readRes] = await Promise.all([
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('direct_messages')
            .select('*')
            .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
            .order('created_at', { ascending: true }),
          supabase
            .from('chat_read_receipts')
            .select('*')
            .eq('user_id', authUser.id),
        ]);

        if (!notifRes.error && notifRes.data) {
          setNotifications(notifRes.data);
        }

        if (!readRes.error && readRes.data) {
          setChatReadReceipts(readRes.data);
        }
      }

      // Experiences are client-side mock data for now (no DB table yet)
      setExperiences(initialExperiences);

      setIsLoading(false);
    };

    fetchAllData();

    // Push Notifications & Event Reminders
    const setupNotifications = () => {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted' && authUser?.id) {
            // Check for upcoming events in the next 24h that the user is RSVP'd to
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Wait for events to load, so we set a small timeout or do it after load
            setTimeout(() => {
              setEvents(currentEvents => {
                setEventRsvps(currentRsvps => {
                  currentEvents.forEach(e => {
                    if (e.date) {
                      const eventDate = new Date(e.date + 'T00:00:00');
                      const timeDiff = eventDate.getTime() - Date.now();
                      const isGoing = (currentRsvps[e.id] || []).some(r => r.userId === authUser.id && r.status === 'going');
                      
                      // If event is in exactly 24h (approximate window)
                      if (isGoing && timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) {
                        const notifKey = `reminded_${e.id}`;
                        if (!localStorage.getItem(notifKey)) {
                          new Notification(`Reminder: ${e.title} is tomorrow!`, {
                            body: 'Get ready for your upcoming event.',
                            icon: '/portal/favicon.svg'
                          });
                          localStorage.setItem(notifKey, 'true');
                        }
                      }
                    }
                  });
                  return currentRsvps;
                });
                return currentEvents;
              });
            }, 3000); // Check 3s after load
          }
        });
      }
    };
    setupNotifications();

    // Realtime Subscriptions
    const subMessages = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          // Fire browser notification if message is from someone else
          if (payload.new.author_id !== authUser?.id && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('New message in more.', {
                body: payload.new.text?.substring(0, 100) || 'New message',
                icon: '/portal/favicon.svg'
              });
            } catch (e) { /* silent */ }
          }
          return [...prev, {
            id: payload.new.id,
            communityId: payload.new.community_id,
            channel: payload.new.channel,
            authorId: payload.new.author_id,
            text: payload.new.text,
            image: payload.new.image,
            timestamp: payload.new.timestamp
          }];
        });
      })
      .subscribe();

    const subDMs = supabase.channel('public:direct_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        setDirectMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            receiverId: payload.new.receiver_id,
            text: payload.new.text,
            image: payload.new.image,
            created_at: payload.new.created_at,
            timestamp: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        });
      })
      .subscribe();

    const subFeed = supabase.channel('public:feed_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, payload => {
        setFeedPosts(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [{
            id: payload.new.id,
            communityId: payload.new.community_id,
            authorId: payload.new.author_id,
            text: payload.new.text,
            media: payload.new.media,
            likes: payload.new.likes,
            comments: payload.new.comments,
            timestamp: payload.new.created_at
          }, ...prev];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feed_posts' }, payload => {
        setFeedPosts(prev => prev.map(p => p.id === payload.new.id ? {
          id: payload.new.id,
          communityId: payload.new.community_id,
          authorId: payload.new.author_id,
          text: payload.new.text,
          media: payload.new.media,
          likes: payload.new.likes,
          comments: payload.new.comments,
          timestamp: payload.new.created_at
        } : p));
      })
      .subscribe();
      
    const subReads = supabase.channel('public:chat_read_receipts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_read_receipts', filter: `user_id=eq.${authUser?.id}` }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setChatReadReceipts(prev => {
            const exists = prev.find(r => r.user_id === payload.new.user_id && r.community_id === payload.new.community_id && r.channel_id === payload.new.channel_id);
            if (exists) return prev.map(r => r.id === payload.new.id ? payload.new : r);
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    const subNotifs = supabase.channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser?.id}` }, payload => {
        setNotifications(prev => {
          if (prev.find(n => n.id === payload.new.id)) return prev;
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.new.title, { body: payload.new.message, icon: '/portal/favicon.svg' });
          }
          return [payload.new, ...prev];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${authUser?.id}` }, payload => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();

    // Still keep a basic refetch for other tables, but exclude messages to avoid heavy refetches
    const subOther = supabase.channel('public:other')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_memberships' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(subMessages);
      supabase.removeChannel(subDMs);
      supabase.removeChannel(subFeed);
      supabase.removeChannel(subReads);
      supabase.removeChannel(subNotifs);
      supabase.removeChannel(subOther);
    };
  }, [authUser]);

  // Actions
  const toggleUserRole = () => {
    // Deprecated. Role is now derived from database.
  };

  const joinCommunity = async (communityId) => {
    if (user.joinedCommunities.includes(communityId)) return;
    
    // Optimistic update
    const tempMem = { userId: user.id, role: 'Member' };
    setCommunityMemberships(prev => ({
      ...prev,
      [communityId]: [...(prev[communityId] || []), tempMem]
    }));

    try {
      await joinCommunityAction(user.id, communityId, session?.access_token);
      
      // Notify community leaders
      const leaders = (communityMemberships[communityId] || []).filter(m => m.role === 'Leader');
      const targetComm = communities.find(c => c.id === communityId);
      if (leaders.length > 0 && targetComm) {
        const notifs = leaders.map(l => ({
          user_id: l.userId,
          title: 'New Member',
          message: `${user.name} has joined ${targetComm.name}!`,
          type: 'alert',
          link: `/community/${communityId}`
        }));
        await broadcastNotificationAction(notifs, session?.access_token).catch(e => console.error("Failed to notify leader", e));
      }
    } catch (err) {
      console.error(err);
      // Revert on failure
      setCommunityMemberships(prev => ({
        ...prev,
        [communityId]: (prev[communityId] || []).filter(m => m.userId !== user.id)
      }));
      throw err;
    }
  };

  const leaveCommunity = async (communityId) => {
    // Optimistic update
    const prevMems = communityMemberships[communityId] || [];
    setCommunityMemberships(prev => ({
      ...prev,
      [communityId]: prevMems.filter(m => m.userId !== user.id)
    }));

    try {
      await leaveCommunityAction(user.id, communityId, session?.access_token);
    } catch (err) {
      console.error(err);
      // Revert on failure
      setCommunityMemberships(prev => ({
        ...prev,
        [communityId]: prevMems
      }));
      throw err;
    }
  };

  const promoteMember = async (communityId, memberId, newRole) => {
    setCommunityMemberships(prev => {
      const commMembers = prev[communityId] || [];
      return {
        ...prev,
        [communityId]: commMembers.map(m => m.userId === memberId ? { ...m, role: newRole } : m)
      };
    });
    try {
      await promoteMemberAction(communityId, memberId, newRole, session?.access_token);
    } catch (err) {
      console.error('Failed to promote member', err);
    }
  };

  const removeMember = async (communityId, memberId) => {
    setCommunityMemberships(prev => {
      const commMembers = prev[communityId] || [];
      return {
        ...prev,
        [communityId]: commMembers.filter(m => m.userId !== memberId)
      };
    });
    try {
      await removeMemberAction(communityId, memberId, session?.access_token);
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const sendMessage = async (communityId, channel, text, image = '') => {
    const tempId = 'temp-' + Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: tempId,
      communityId: communityId,
      channel: channel,
      authorId: user.id,
      text: text,
      image: image,
      timestamp: timestamp,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      const { data, error } = await supabase.from('messages').insert([{
        community_id: communityId,
        channel: channel,
        author_id: user.id,
        text: text,
        image: image,
        timestamp: timestamp
      }]).select().single();
      
      if (error) throw error;
      
      setMessages(prev => {
        if (prev.some(m => m.id === data.id && m.id !== tempId)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? {
          ...m,
          id: data.id,
          created_at: data.created_at
        } : m);
      });
      
      // Auto-mark as read for sender
      markChatRead(communityId, channel);
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const sendDirectMessage = async (receiverId, text, image = '') => {
    const tempId = 'temp-' + Date.now();
    const newMessage = {
      id: tempId,
      senderId: user.id,
      receiverId: receiverId,
      text: text,
      image: image,
      created_at: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setDirectMessages(prev => [...prev, newMessage]);

    try {
      const { data, error } = await supabase.from('direct_messages').insert([{
        sender_id: user.id,
        receiver_id: receiverId,
        text: text,
        image: image
      }]).select().single();
      
      if (error) throw error;
      
      setDirectMessages(prev => {
        if (prev.some(m => m.id === data.id && m.id !== tempId)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? {
          ...m,
          id: data.id,
          created_at: data.created_at,
          timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } : m);
      });
      
      // Auto-mark as read for sender
      markChatRead(null, receiverId);
    } catch (err) {
      console.error(err);
      setDirectMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const markChatRead = async (communityId, channelId) => {
    if (!user.id) return;
    
    // Optimistic Update
    setChatReadReceipts(prev => {
      const exists = prev.find(r => r.community_id === communityId && r.channel_id === channelId);
      if (exists) {
        return prev.map(r => r.id === exists.id ? { ...r, last_read_at: new Date().toISOString() } : r);
      } else {
        return [...prev, { id: 'temp_'+Date.now(), user_id: user.id, community_id: communityId, channel_id: channelId, last_read_at: new Date().toISOString() }];
      }
    });

    try {
      await supabase.from('chat_read_receipts').upsert([{
        user_id: user.id,
        community_id: communityId,
        channel_id: channelId,
        last_read_at: new Date().toISOString()
      }], { onConflict: 'user_id,community_id,channel_id' });
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const createFeedPost = async (communityId, text, media = null) => {
    try {
      const { error } = await supabase.from('feed_posts').insert([{
        community_id: communityId,
        author_id: user.id,
        text: text,
        media: media,
        likes: 0,
        comments: 0
      }]);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    }
  };

  const likeFeedPost = async (postId) => {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    
    const isLiked = post.liked;
    const increment = isLiked ? -1 : 1;
    
    // Optimistic update
    setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) + increment), liked: !isLiked } : p));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { toggleFeedPostLikeAction } = await import('../lib/actions');
      await toggleFeedPostLikeAction(postId, session?.user?.id, session?.access_token);
    } catch (err) {
      console.error(err);
      // Revert on failure
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - increment), liked: isLiked } : p));
    }
  };

  const createFeedComment = async (postId, text, communityId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { createFeedPostCommentAction } = await import('../lib/actions');
      await createFeedPostCommentAction(postId, communityId, session?.user?.id, text, session?.access_token);
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const rsvpToEvent = async (eventId, status, ticketType = 'free') => {
    // Optimistic update
    setEventRsvps(prev => {
      const eventRsvpsList = prev[eventId] || [];
      const updatedList = eventRsvpsList.filter(r => r.userId !== user.id);
      if (status !== 'not_going') {
        updatedList.push({ userId: user.id, status, ticketType });
      }
      return { ...prev, [eventId]: updatedList };
    });

    try {
      await rsvpToEventAction(user.id, eventId, status, ticketType, session?.access_token);
    } catch (err) {
      console.error('RSVP error:', err);
    }
  };

  const updateCommunityProfile = (communityId, updates) => {
    setCommunities(communities.map(c => 
      c.id === communityId ? { ...c, ...updates } : c
    ));
    // In a full app, this would also POST to an update endpoint
  };

  const adminVerifyCommunity = async (communityId, isVerified) => {
    // Optimistic UI update
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, verified: isVerified } : c));
    try {
      const { error } = await supabase.from('communities').update({ verified: isVerified }).eq('id', communityId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert optimistic update on failure
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, verified: !isVerified } : c));
    }
  };

  const broadcastNotification = async (communityId, title, message) => {
    const members = communityMemberships[communityId] || [];
    const notifications = members.map(m => ({
      user_id: m.userId,
      type: 'broadcast',
      title: title,
      message: message,
      link: `/community/${communityId}`,
      is_read: false
    }));
    
    try {
      await broadcastNotificationAction(notifications, session?.access_token);
    } catch (err) {
      console.error('Broadcast failed:', err);
      throw err;
    }
  };

  const checkInMember = async (eventId, userId) => {
    setEventRsvps(prev => ({
      ...prev,
      [eventId]: (prev[eventId] || []).map(r => 
        r.userId === userId ? { ...r, checkedIn: true } : r
      )
    }));
    try {
      const { error } = await supabase.from('event_rsvps')
        .update({ checked_in: true })
        .match({ event_id: eventId, user_id: userId });
      if (error) console.warn('Check-in update failed:', error);
    } catch (err) {
      console.error(err);
    }
  };

  const createEvent = async (communityId, eventData) => {
    try {
      const newEvent = {
        communityId: communityId,
        title: eventData.title,
        description: eventData.description || '',
        date: eventData.date,
        time: eventData.time,
      ticket_price: eventData.ticketPrice || 0,
        location: eventData.location,
        image: eventData.image,
        attendees: 0,
        status: 'published',
        maxCapacity: eventData.maxCapacity || null
      };

      const data = await createEventAction(newEvent, session?.access_token);
      
      // Optimistic UI update
      if (data) {
        const e = data;
        setEvents(prev => [...prev, {
          id: e.id,
          communityId: e.community_id,
          title: e.title,
          description: e.description || '',
          date: e.date,
          time: e.time,
          location: e.location,
          image: e.image,
          attendees: e.attendees,
          status: e.status || 'published',
          maxCapacity: e.max_capacity || null,
          createdAt: e.created_at
        }]);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const markNotificationRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await markNotificationReadAction(id, session?.access_token);
    } catch (err) { console.error(err); }
  };

  const updateEvent = async (eventId, updates) => {
    const prevEvents = events;
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updates } : e));
    
    try {
      await updateEventAction(eventId, updates, session?.access_token);
    } catch (err) {
      console.error(err);
      setEvents(prevEvents);
    }
  };

  const cancelEvent = async (eventId) => {
    await updateEvent(eventId, { status: 'cancelled' });
  };

  const createCommunity = async (communityData) => {
    const baseSlug = communityData.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const suffix = Math.random().toString(36).substring(2, 7);
    const newId = `${baseSlug}-${suffix}`;
    const newCommunity = { id: newId, ...communityData, leader_id: user.id };
    
    // Optimistic UI update
    setCommunities(prev => [...prev, newCommunity]);
    setCommunityMemberships(prev => ({
      ...prev,
      [newId]: [{ userId: user.id, role: 'Leader' }]
    }));

    try {
      // Create the community using Server Action
      await createCommunityAction({
        id: newId,
        name: communityData.name,
        description: communityData.description,
        tags: communityData.tags || [],
        cover_image: communityData.image || null,
        creatorId: user.id
      }, session?.access_token);
      
      return newId;
    } catch (err) {
      console.error(err);
      setCommunities(prev => prev.filter(c => c.id !== newId));
      throw err;
    }
  };

  const createPost = async (communityId, text, media, destinations) => {
    // Optimistic UI update for internal feed
    if (destinations.app) {
      const newPost = {
        id: `post_${Date.now()}`,
        communityId,
        authorId: user.id,
        text,
        media,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0
      };
      setFeedPosts(prev => [newPost, ...prev]);
    }

    // In a real app, this would send a POST request to an edge function
    // which handles the OAuth API calls to Instagram, Facebook, etc.
    // We simulate the network delay here.
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const createChannel = async (communityId, channelName) => {
    const newId = `ch_${Date.now()}`;
    const newChannel = { id: newId, community_id: communityId, name: channelName, type: 'text' };
    setChannels(prev => [...prev, newChannel]);

    try {
      await createChannelAction({ id: newId, communityId, name: channelName, type: 'text' }, session?.access_token);
    } catch (err) {
      console.error(err);
      setChannels(prev => prev.filter(c => c.id !== newId));
    }
  };

  const uploadImage = async (file) => {
    try {
      // Compress the image before uploading
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      };
      
      let compressedFile = file;
      if (file.type.startsWith('image/')) {
        try {
          const result = await imageCompression(file, options);
          
          // Rename the file to .webp to ensure the server action gets the correct extension
          const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          compressedFile = new File([result], newName, { type: 'image/webp' });
          
          console.log(`Compressed image from ${file.size / 1024}KB to ${compressedFile.size / 1024}KB`);
        } catch (error) {
          console.error("Compression failed, using original file", error);
        }
      }

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('userId', user.id);
      
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;
      
      const publicUrl = await uploadImageAction(formData, session?.access_token);
      return publicUrl;
    } catch (err) {
      console.error('Error in uploadImage:', err);
      throw err;
    }
  };

  const updateUser = async (userId, updates) => {
    // Optimistic UI update
    setUsers(prev => {
      const exists = prev.find(u => u.id === userId);
      if (exists) return prev.map(u => u.id === userId ? { ...u, ...updates } : u);
      return [...prev, { id: userId, ...updates }];
    });
    
    try {
      await updateUserAction(userId, updates, session?.access_token);
    } catch (err) {
      console.error('User update failed (ignoring for prototype):', err);
    }
  };

  const updateCommunity = async (communityId, updates) => {
    // Optimistic UI update
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updates } : c));
    
    try {
      await updateCommunityAction(communityId, updates, session?.access_token);
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...Object.fromEntries(Object.entries(updates).map(([k]) => [k, c[k]])) } : c));
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!user?.id) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        await subscribeToPushNotificationsAction(user.id, subscription, session?.access_token);
        return true;
      }
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
    }
    return false;
  };

  return (
    <AppContext.Provider value={{
      user,
      communities,
      events,
      messages,
      channels,
      users,
      communityMemberships,
      eventRsvps,
      notifications,
      directMessages,
      isLoading,
      joinCommunity,
      leaveCommunity,
      sendMessage,
      sendDirectMessage,
      updateCommunityProfile,
      adminVerifyCommunity,
      createEvent,
      updateEvent,
      cancelEvent,
      rsvpToEvent,
      createCommunity,
      createChannel,
      uploadImage,
      updateUser,
      updateCommunity,
      toggleUserRole,
      promoteMember,
      removeMember,
      subscribeToPushNotifications,
      markNotificationRead,
      feedPosts,
      experiences,
      connectedSocialAccounts,
      setConnectedSocialAccounts,
      createFeedPost,
      likeFeedPost,
      createFeedComment,
      whatsappSettings,
      setWhatsappSettings,
      broadcastNotification,
      checkInMember,
      chatReadReceipts,
      markChatRead,
      sponsors,
      sponsorshipAssignments,
      prescribingLinks,
      setPrescribingLinks
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
