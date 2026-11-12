"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { initialExperiences } from '../lib/constants';
import imageCompression from 'browser-image-compression';
import { createEventAction, createEventsBatchAction, joinCommunityAction, leaveCommunityAction, rsvpToEventAction, updateAttendeeStatusAction, addEventPhotoAction, createCommunityAction, uploadImageAction, updateEventAction, updateCommunityAction, deleteCommunityAction, createChannelAction, markNotificationReadAction, updateUserAction, adminVerifyCommunityAction, broadcastNotificationAction, promoteMemberAction, removeMemberAction, subscribeToPushNotificationsAction, ensureLeadersNetworkAction, sendEventReminderAction, createSelfNotificationAction } from '../lib/actions';
import { Capacitor } from '@capacitor/core';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { authUser, session } = useAuth();
  

  // Auto-sync offline trail check-ins whenever mobile signal returns
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSignalRestored = async () => {
      const synced = await flushOfflineCheckinQueue();
      if (synced > 0) {
        toast?.success?.('Signal Restored! 📶', `Synced ${synced} offline trail check-in${synced === 1 ? '' : 's'} to server.`);
      }
    };

    window.addEventListener('online', handleSignalRestored);
    // Also run an initial flush on mount if online
    if (navigator.onLine) {
      flushOfflineCheckinQueue();
    }

    return () => window.removeEventListener('online', handleSignalRestored);
  }, []);

  // Accessibility & Theme State
  const [theme, setTheme] = useState('dark'); // 'light', 'dark', 'system'
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Perspective Simulator & Impersonation State
  const [simulatedPersona, setSimulatedPersonaState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mc_simulated_persona') || 'real';
    }
    return 'real';
  });

  const [impersonatedUserId, setImpersonatedUserIdState] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mc_impersonated_user_id') || null;
    }
    return null;
  });

  const setSimulatedPersona = (persona) => {
    setSimulatedPersonaState(persona);
    if (typeof window !== 'undefined') {
      if (persona === 'real' || persona === 'admin') sessionStorage.removeItem('mc_simulated_persona');
      else sessionStorage.setItem('mc_simulated_persona', persona);
    }
  };

  const setImpersonatedUserId = (id) => {
    setImpersonatedUserIdState(id);
    if (typeof window !== 'undefined') {
      if (!id) sessionStorage.removeItem('mc_impersonated_user_id');
      else sessionStorage.setItem('mc_impersonated_user_id', id);
    }
  };

  const exitSimulator = () => {
    setSimulatedPersona('real');
    setImpersonatedUserId(null);
  };

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
  const [reviews, setReviews] = useState([]);
  const [prescribingLinks, setPrescribingLinks] = useState([
    { id: 'lnk-1', name: 'Mental Health Walk Link', created: '2026-08-10', uses: 14, communityId: 'mindful-miles' },
    { id: 'lnk-2', name: 'Type-2 Diabetes Active Group', created: '2026-08-15', uses: 8, communityId: 'tw-ramblers' }
  ]);
  const [polls, setPolls] = useState([]);
  const [pollVotes, setPollVotes] = useState({});
  const [savedItems, setSavedItems] = useState([]);
  
  // Sponsors
  const [sponsors, setSponsors] = useState([]);
  const [sponsorshipAssignments, setSponsorshipAssignments] = useState([]);

  const [services, setServices] = useState([]);

  const pitchService = (serviceData) => {
    const newService = {
      id: `srv-${Date.now()}`,
      ...serviceData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setServices(prev => [newService, ...prev]);
  };

  const updateServiceStatus = (serviceId, newStatus) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: newStatus } : s));
  };

  const addReview = useCallback((newReview) => {
    setReviews(prev => [newReview, ...prev]);
  }, []);

  const [connectedSocialAccounts, setConnectedSocialAccounts] = useState({
    instagram: { connected: true, handle: '@more.community' },
    x: { connected: false, handle: '' },
    linkedin: { connected: false, handle: '' },
    facebook: { connected: true, handle: 'More Community' }
  });
  const [whatsappSettings, setWhatsappSettings] = useState({});
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [chatReadReceipts, setChatReadReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute full user object with memberships based on real authUser
  const dbUser = users.find(u => u.id === authUser?.id) || {
    id: authUser?.id,
    name: authUser?.user_metadata?.full_name || authUser?.email || 'New User',
    role: 'Member',
    avatar: '/images/default-avatar.svg',
    bio: 'New here.',
    joined: new Date().toISOString(),
    onboarded: !authUser ? true : false,
    interests: [],
    affinityProfile: { tagScores: {}, likedCommunityIds: [], passedCommunityIds: [] }
  };

  const user = { ...dbUser, joinedCommunities: [], ledCommunities: [], savedItems: savedItems, isAdmin: false, leaderOf: null };
    if (authUser?.email) {
      const email = authUser.email.toLowerCase();
      const ADMIN_EMAILS = [
        'msf199@hotmail.com', 
        'mattfenton123@gmail.com', 
        'matthewfenton123@gmail.com', 
        'matt@inspiredventures.co.uk',
        'alex@maorecommunity.co.uk', 
        'alex@morecommunity.co.uk',
        'matt@morecommunity.app',
        'alex@morecommunity.app'
      ];
      if (ADMIN_EMAILS.includes(email)) {
        user.isAdmin = true;
      }
      if (email === 'alex@morecommunity.app' || email === 'alex@morecommunity.co.uk') {
        if (!user.ledCommunities.includes('more-leaders-network')) user.ledCommunities.push('more-leaders-network');
        if (!user.joinedCommunities.includes('more-leaders-network')) user.joinedCommunities.push('more-leaders-network');
      }
    }

  if (user.id) {
    Object.keys(communityMemberships).forEach(communityId => {
      const mems = communityMemberships[communityId];
      const myMem = mems.find(m => m.userId === user.id || m.user_id === user.id);
      if (myMem) {
        if (!user.joinedCommunities.includes(communityId)) user.joinedCommunities.push(communityId);
        if (myMem.role === 'Leader' || myMem.role === 'Co-Leader') {
          if (!user.ledCommunities.includes(communityId)) user.ledCommunities.push(communityId);
        }
      }
    });

    // Ensure any communities created by or led by this user are included
    communities.forEach(c => {
      if (c.leader_id === user.id || c.creator_id === user.id || c.creatorId === user.id) {
        if (!user.ledCommunities.includes(c.id)) user.ledCommunities.push(c.id);
        if (!user.joinedCommunities.includes(c.id)) user.joinedCommunities.push(c.id);
      }
    });

    user.leaderOf = user.ledCommunities[0] || null;
  }

  // Calculate Effective User for Global Simulator
  const realUser = { ...user };
  let effectiveUser = { ...user };

  if (realUser.isAdmin) {
    if (impersonatedUserId) {
      const impUser = users.find(u => u.id === impersonatedUserId);
      if (impUser) {
        effectiveUser = {
          ...impUser,
          isAdmin: false,
          joinedCommunities: [],
          ledCommunities: [],
          isSimulated: true,
          realAdminEmail: authUser?.email
        };
        Object.keys(communityMemberships).forEach(communityId => {
          const mems = communityMemberships[communityId] || [];
          const myMem = mems.find(m => m.userId === impUser.id || m.user_id === impUser.id);
          if (myMem) {
            effectiveUser.joinedCommunities.push(communityId);
            if (myMem.role === 'Leader' || myMem.role === 'Co-Leader') {
              effectiveUser.ledCommunities.push(communityId);
            }
          }
        });
        communities.forEach(c => {
          if (c.leader_id === impUser.id || c.creator_id === impUser.id) {
            if (!effectiveUser.ledCommunities.includes(c.id)) effectiveUser.ledCommunities.push(c.id);
            if (!effectiveUser.joinedCommunities.includes(c.id)) effectiveUser.joinedCommunities.push(c.id);
          }
        });
        effectiveUser.leaderOf = effectiveUser.ledCommunities[0] || null;
      }
    } else if (simulatedPersona === 'member') {
      effectiveUser = {
        ...user,
        isAdmin: false,
        ledCommunities: [],
        leaderOf: null,
        isSimulated: true
      };
    } else if (simulatedPersona === 'leader') {
      const targetCommId = user.ledCommunities?.[0] || communities[0]?.id || 'mankind-heathfield-ymow0';
      effectiveUser = {
        ...user,
        isAdmin: false,
        ledCommunities: user.ledCommunities?.length > 0 ? user.ledCommunities : [targetCommId],
        leaderOf: targetCommId,
        isSimulated: true
      };
    } else if (simulatedPersona === 'sponsor') {
      effectiveUser = {
        ...user,
        isAdmin: false,
        ledCommunities: [],
        leaderOf: null,
        isSimulated: true,
        isSponsor: true
      };
    } else if (simulatedPersona === 'partner') {
      effectiveUser = {
        ...user,
        isAdmin: false,
        ledCommunities: [],
        leaderOf: null,
        isSimulated: true,
        isPartner: true
      };
    }
  }

  // Track daily user login / active session for investor analytics
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = 'more_daily_active_sessions';
      const stored = localStorage.getItem(storageKey);
      let sessionMap = stored ? JSON.parse(stored) : {};
      if (!sessionMap[today]) sessionMap[today] = [];
      if (!sessionMap[today].includes(user.id)) {
        sessionMap[today].push(user.id);
        localStorage.setItem(storageKey, JSON.stringify(sessionMap));
      }
    } catch {
      // Non-blocking
    }
  }, [user?.id]);

  const [waConfig, setWaConfig] = useState(null);

  // Initialize Push Notifications on Native platforms
  useEffect(() => {
    if (Capacitor.isNativePlatform() && user?.id) {
      const initPush = async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          
          const permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }

          PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            // Save token to DB
            if (session?.access_token) {
              try {
                await subscribeToPushNotificationsAction(user.id, token.value, session.access_token);
              } catch (e) {
                console.error("Failed to save push token", e);
              }
            }
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
          });

          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
          });
        } catch (e) {
          console.error("Push Notifications init failed", e);
        }
      };
      
      initPush();
    }
  }, [user?.id, session?.access_token]);

  // Load accessibility and user preferences from local storage and apply to DOM
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('more_theme') || 'dark';
      const savedHighContrast = localStorage.getItem('more_high_contrast') === 'true';
      const savedLargeText = localStorage.getItem('more_large_text') === 'true';
      const savedReduceMotion = localStorage.getItem('more_reduce_motion') === 'true';
      
      setTheme(savedTheme);
      setHighContrast(savedHighContrast);
      setLargeText(savedLargeText);
      setReduceMotion(savedReduceMotion);

      const localSavedItems = localStorage.getItem('more_saved_items');
      let initialSaved = [];
      if (localSavedItems) {
        try {
          initialSaved = JSON.parse(localSavedItems);
        } catch(e) {}
      }
      
      // Merge with DB saved items if available
      const dbSavedItems = user?.affinityProfile?.savedEventIds || [];
      const mergedSavedItems = [...new Set([...initialSaved, ...dbSavedItems])];
      setSavedItems(mergedSavedItems);
      if (mergedSavedItems.length > 0) {
        localStorage.setItem('more_saved_items', JSON.stringify(mergedSavedItems));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      }
      
      root.setAttribute('data-theme', effectiveTheme);
      if (highContrast) root.setAttribute('data-high-contrast', 'true');
      else root.removeAttribute('data-high-contrast');
      
      if (largeText) root.setAttribute('data-large-text', 'true');
      else root.removeAttribute('data-large-text');
      
      if (reduceMotion) root.setAttribute('data-reduce-motion', 'true');
      else root.removeAttribute('data-reduce-motion');
      
      // Save to localStorage
      localStorage.setItem('more_theme', theme);
      localStorage.setItem('more_high_contrast', highContrast);
      localStorage.setItem('more_large_text', largeText);
      localStorage.setItem('more_reduce_motion', reduceMotion);
    }
  }, [theme, highContrast, largeText, reduceMotion]);

  const fetchAllDataRef = useRef(null);
  const refreshData = async () => {
    if (fetchAllDataRef.current) {
      await fetchAllDataRef.current();
    }
  };

  // Supabase Real-time Setup & Initial Fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);

      // Batch 1: All independent queries run in parallel
      const [usersRes, commsRes, chanRes, evRes, rsvpRes, memRes, revRes, pollsRes, pollVotesRes] =
        await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('communities').select('*'),
          supabase.from('channels').select('*'),
          supabase.from('events').select('*'),
          supabase.from('event_rsvps').select('*'),
          supabase.from('community_memberships').select('*'),
          supabase.from('reviews').select('*'),
          supabase.from('polls').select('*'),
          supabase.from('poll_votes').select('*'),
        ]);

      // Process results
      if (usersRes.data) {
        const ALEX_ID = 'a31edbf0-db87-4a32-b108-c13d365adbf8';
        const processedUsers = usersRes.data.map(u => {
          if (u.id === ALEX_ID) {
            return {
              ...u,
              name: (u.name === 'alex@morecommunity.app' || !u.name) ? 'Alex' : u.name,
              avatar: u.avatar || 'https://ui-avatars.com/api/?name=Alex&background=21726c&color=fff&size=200&bold=true',
              role: 'Leader'
            };
          }
          return u;
        });
        if (!processedUsers.some(u => u.id === ALEX_ID)) {
          processedUsers.push({
            id: ALEX_ID,
            name: 'Alex',
            role: 'Leader',
            avatar: 'https://ui-avatars.com/api/?name=Alex&background=21726c&color=fff&size=200&bold=true',
            bio: 'Community Leader & Founder at more.',
            onboarded: true
          });
        }
        setUsers(processedUsers);
      }
      if (revRes && revRes.data) setReviews(revRes.data);
      if (pollsRes && pollsRes.data) setPolls(pollsRes.data);
      if (pollVotesRes && pollVotesRes.data) {
        const pVotes = {};
        pollVotesRes.data.forEach(pv => {
          if (!pVotes[pv.poll_id]) pVotes[pv.poll_id] = [];
          pVotes[pv.poll_id].push(pv);
        });
        setPollVotes(pVotes);
      }

      if (commsRes.data) {
        const ALEX_ID = 'a31edbf0-db87-4a32-b108-c13d365adbf8';
        let comms = commsRes.data.map(c => {
          if (c.id === 'more-leaders-network') {
            return {
              ...c,
              name: (c.name && c.name !== 'more community Network' && c.name !== 'The More. Community Leaders Network')
                ? c.name
                : 'More Community Leaders Network',
              leader_id: c.leader_id || ALEX_ID
            };
          }
          return c;
        });

        // Ensure Leaders Network is in state (and seed DB if missing)
        if (!comms.find(c => c.id === 'more-leaders-network')) {
          const leadersComm = {
             id: 'more-leaders-network',
             name: 'More Community Leaders Network',
             description: 'A private space for more. leaders to collaborate, share tips, and organize cross-community events.',
             tags: ['leadership', 'network'],
             image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
             category: 'leadership',
             leader_id: ALEX_ID,
             is_private: true
          };
          comms.push(leadersComm);
          ensureLeadersNetworkAction().catch(e => console.error("Error ensuring leaders network:", e));
        }

        const memberCountsMap = {};
        if (memRes?.data) {
          memRes.data.forEach(m => {
            if (m.community_id) {
              memberCountsMap[m.community_id] = (memberCountsMap[m.community_id] || 0) + 1;
            }
          });
        }

        setCommunities(comms.map((c) => {
          let storedGuidelines = [];
          if (Array.isArray(c.guidelines) && c.guidelines.length > 0) {
            storedGuidelines = c.guidelines;
          } else if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem(`more_community_guidelines_${c.id}`);
              if (raw) storedGuidelines = JSON.parse(raw);
            } catch (e) {}
          }

          const count = memberCountsMap[c.id] || (c.leader_id ? 1 : 1);

          const rawTags = Array.isArray(c.tags) ? c.tags : [];
          const cfgTag = rawTags.find(t => typeof t === 'string' && t.startsWith('__cfg:'));
          const visibleTags = rawTags.filter(t => !(typeof t === 'string' && t.startsWith('__cfg:')));
          const tagSettingsObj = {};
          if (cfgTag) {
            cfgTag.replace('__cfg:', '').split(',').forEach(pair => {
              const [k, v] = pair.split('=');
              if (k === 'chapters') tagSettingsObj.allow_chapters = v === '1' || v === 'true';
              if (k === 'pitches') tagSettingsObj.accepts_pitches = v === '1' || v === 'true';
              if (k === 'carpool') tagSettingsObj.allow_carpool = v === '1' || v === 'true';
              if (k === 'guests') tagSettingsObj.allow_guests = v === '1' || v === 'true';
              if (k === 'parent') tagSettingsObj.parent_community_id = v;
              if (k === 'status') tagSettingsObj.chapter_status = v;
              if (k === 'royalty') tagSettingsObj.chapter_royalty = Number(v);
            });
          }

          const rawLinks = Array.isArray(c.external_links) ? c.external_links : [];
          const dbSettingsObj = rawLinks.find(item => item && item.__type === 'community_settings') || {};
          const cleanExternalLinks = rawLinks.filter(item => !item || item.__type !== 'community_settings');

          let localSettingsObj = {};
          if (typeof window !== 'undefined') {
            try {
              const rawSettings = localStorage.getItem(`more_community_settings_${c.id}`);
              if (rawSettings) localSettingsObj = JSON.parse(rawSettings);
            } catch (e) {}
          }

          // Priority: localSettingsObj (latest on this device) + tagSettingsObj / dbSettingsObj (persisted in Supabase)
          const mergedSettings = { ...dbSettingsObj, ...tagSettingsObj, ...localSettingsObj };
          const defaultAllowChapters = c.id === 'more-leaders-network' ? false : true;
          const allowChaptersVal = mergedSettings.allow_chapters !== undefined
            ? Boolean(mergedSettings.allow_chapters)
            : (c.allow_chapters !== undefined ? Boolean(c.allow_chapters) : defaultAllowChapters);
          const acceptsPitchesVal = mergedSettings.accepts_pitches !== undefined
            ? Boolean(mergedSettings.accepts_pitches)
            : (c.accepts_pitches !== undefined ? Boolean(c.accepts_pitches) : (c.id === 'more-leaders-network' ? false : true));
          const allowCarpoolVal = mergedSettings.allow_carpool !== undefined
            ? Boolean(mergedSettings.allow_carpool)
            : (c.allow_carpool !== undefined ? Boolean(c.allow_carpool) : true);
          const allowGuestsVal = mergedSettings.allow_guests !== undefined
            ? Boolean(mergedSettings.allow_guests)
            : (c.allow_guests !== undefined ? Boolean(c.allow_guests) : true);

          return {
            ...c, // pass through ALL columns from Supabase
            external_links: cleanExternalLinks,
            allow_chapters: allowChaptersVal,
            allowChapters: allowChaptersVal,
            accepts_pitches: acceptsPitchesVal,
            allow_carpool: allowCarpoolVal,
            allowCarpool: allowCarpoolVal,
            allow_guests: allowGuestsVal,
            allowGuests: allowGuestsVal,
            parent_community_id: mergedSettings.parent_community_id || c.parent_community_id || null,
            chapter_status: mergedSettings.chapter_status || (mergedSettings.parent_community_id || c.parent_community_id ? 'pending_approval' : 'approved'),
            chapter_royalty: mergedSettings.chapter_royalty !== undefined ? mergedSettings.chapter_royalty : 5,
            members: count,
            memberCount: count,
            guidelines: storedGuidelines,
            tags: visibleTags,
            image: c.image || c.cover_image, // support both column names
            category: visibleTags.length > 0 ? visibleTags[0] : 'All',
            metrics: { members: count, cost: c.cost || 'Free', eventsRun: 0 },
            colors: ['#3b82f6', '#14b8a6'], // fallback gradient
            highlights: c.highlights || []
          };
        }));
      }

      if (chanRes.data) setChannels(chanRes.data);

      if (evRes.data) {
        setEvents(evRes.data.map(e => ({
          id: e.id,
          communityId: e.community_id,
          collabCommunityIds: e.cohost_community_ids || [],
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
          meetingPoint: e.meeting_point || '',
          itinerary: e.itinerary || '',
          whatToBring: e.what_to_bring || '',
          activityLevel: e.activity_level || 'All Levels',
          profitShareEnabled: e.profit_share_enabled || false,
          profitShareAmount: e.profit_share_amount || 0,
          requireApproval: Boolean(e.require_approval || (e.description && e.description.includes('[Host Approval Required]'))),
          rsvpQuestion: e.rsvp_question || (e.description?.match(/\[RSVP Question: ([^\]]+)\]/)?.[1] || ''),
            whatsappGroup: e.whatsapp_group || (e.description?.match(/\[WhatsApp: ([^\]]+)\]/)?.[1] || ''),
          allowCarpool: e.allow_carpool !== undefined ? Boolean(e.allow_carpool) : (e.description && e.description.includes('[Carpool: disabled]') ? false : true),
          allowGuests: e.allow_guests !== undefined ? Boolean(e.allow_guests) : (e.description && e.description.includes('[Guests: disabled]') ? false : true),
          galleryImages: Array.isArray(e.gallery_images) ? e.gallery_images : (Array.isArray(e.galleryImages) ? e.galleryImages : []),
          createdAt: e.created_at
        })));
      }

      if (rsvpRes.data) {
        const rsvpMap = {};
        rsvpRes.data.forEach(r => {
          if (!rsvpMap[r.event_id]) rsvpMap[r.event_id] = [];
          let guestName = r.guest_name || null;
          let answer = r.answer || null;
          let refBy = r.referred_by || null;
          if (r.referred_by?.startsWith('meta:')) {
            const parts = r.referred_by.replace('meta:', '').split(';;');
            for (const p of parts) {
              if (p.startsWith('guest:')) guestName = p.replace('guest:', '');
              if (p.startsWith('ans:')) answer = p.replace('ans:', '');
              if (p.startsWith('ref:')) refBy = p.replace('ref:', '');
            }
          }
          rsvpMap[r.event_id].push({
            userId: r.user_id,
            status: r.status,
            referredBy: refBy,
            guestName: guestName,
            answer: answer,
            ticketType: r.ticket_type || 'free',
            checkedIn: Boolean(r.checked_in || r.checkedIn),
            createdAt: r.created_at || null
          });
        });
        setEventRsvps(rsvpMap);
      }

      if (memRes.data) {
        const memMap = {};
        memRes.data.forEach(m => {
          if (!memMap[m.community_id]) memMap[m.community_id] = [];
          memMap[m.community_id].push({ userId: m.user_id, role: m.role, joinedAt: m.created_at || m.joined_at || null, createdAt: m.created_at || null });
        });

        // Ensure Alex is always registered as Leader in more-leaders-network
        const ALEX_ID = 'a31edbf0-db87-4a32-b108-c13d365adbf8';
        if (!memMap['more-leaders-network']) memMap['more-leaders-network'] = [];
        if (!memMap['more-leaders-network'].some(m => m.userId === ALEX_ID)) {
          memMap['more-leaders-network'].push({ userId: ALEX_ID, role: 'Leader' });
        }

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

      // Fetch live Viator experiences (with fallback to curated defaults)
      try {
        const expRes = await fetch('/api/experiences/discover?q=Tunbridge%20Wells');
        const expJson = await expRes.json();
        if (expJson.status === 'success' && expJson.data && expJson.data.length > 0) {
          setExperiences(expJson.data);
        } else {
          setExperiences(initialExperiences);
        }
      } catch (err) {
        console.warn('Viator fetch fallback:', err);
        setExperiences(initialExperiences);
      }

      setIsLoading(false);
    };

    fetchAllDataRef.current = fetchAllData;
    fetchAllData();

    // Safe notification helper  -  uses Service Worker on mobile, falls back to Notification API
    const showSafeNotification = async (title, options = {}) => {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, { icon: '/logo.png', badge: '/logo.png', ...options });
        } else {
          new Notification(title, { icon: '/logo.png', ...options });
        }
      } catch (e) { /* Notification not supported */ }
    };

    // Automated Event Reminders (24h pre-event alert & 48h post-event follow-up)
    const runAutomatedEventChecks = () => {
      if (!authUser?.id) return;
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      // Check events and RSVPs after data load
      setTimeout(() => {
        setEvents(currentEvents => {
          setEventRsvps(currentRsvps => {
            const now = Date.now();
            currentEvents.forEach(async (e) => {
              if (!e.date || e.status === 'cancelled') return;

              const isGoing = (currentRsvps[e.id] || []).some(
                r => (r.userId === authUser.id || r.user_id === authUser.id) && (r.status === 'going' || r.status === 'checked_in' || !r.status)
              );
              if (!isGoing) return;

              const rawStartHm = e.time ? (String(e.time).match(/\d{1,2}:\d{2}/)?.[0] || '12:00') : '12:00';
              const eventDateTimeStr = `${e.date}T${rawStartHm}:00`;
              const eventTime = new Date(eventDateTimeStr).getTime();
              if (isNaN(eventTime)) return;

              const diffHours = (eventTime - now) / (1000 * 60 * 60);

              // 1. 24h Pre-event reminder (starts within next 26 hours)
              if (diffHours > 0 && diffHours <= 26) {
                const notifKey = `more_reminded_24h_${e.id}_${authUser.id}`;
                if (typeof window !== 'undefined' && !localStorage.getItem(notifKey)) {
                  localStorage.setItem(notifKey, 'true');
                  const cleanLoc = e.location ? String(e.location).replace(/\s*•\s*@-?\d+\.?\d*,-?\d+\.?\d*/g, '').replace(/\s*\[r=\d+\.?\d*km\]/gi, '').trim() : '';
                  const title = `⏰ Reminder: ${e.title} is coming up!`;
                  const message = `Get ready! ${e.title} takes place ${e.time ? 'at ' + e.time : 'tomorrow'}${cleanLoc ? ' at ' + cleanLoc : ''}. See you there!`;
                  
                  showSafeNotification(title, { body: message });

                  try {
                    const token = session?.access_token;
                    if (token) {
                      const saved = await createSelfNotificationAction({
                        title,
                        message,
                        link: `/events/${e.id}`,
                        type: 'reminder'
                      }, token);
                      if (saved) {
                        setNotifications(prev => [saved, ...prev.filter(n => n.id !== saved.id)]);
                      }
                    }
                  } catch (err) {
                    console.warn('Pre-event notification save skipped:', err);
                  }
                }
              }

              // 2. Post-event recap & photo prompt (ended within last 48 hours)
              if (diffHours < 0 && diffHours >= -48) {
                const postKey = `more_post_event_${e.id}_${authUser.id}`;
                if (typeof window !== 'undefined' && !localStorage.getItem(postKey)) {
                  localStorage.setItem(postKey, 'true');
                  const title = `📸 How was ${e.title}?`;
                  const message = `Hope you had a great time at ${e.title}! Share your favourite moments, photos, or feedback with the group.`;

                  showSafeNotification(title, { body: message });

                  try {
                    const token = session?.access_token;
                    if (token) {
                      const saved = await createSelfNotificationAction({
                        title,
                        message,
                        link: `/community/${e.communityId}`,
                        type: 'event'
                      }, token);
                      if (saved) {
                        setNotifications(prev => [saved, ...prev.filter(n => n.id !== saved.id)]);
                      }
                    }
                  } catch (err) {
                    console.warn('Post-event notification save skipped:', err);
                  }
                }
              }
            });
            return currentRsvps;
          });
          return currentEvents;
        });
      }, 2500);
    };
    runAutomatedEventChecks();

    // Realtime Subscriptions
    const subMessages = supabase.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          // Fire browser notification if message is from someone else
          if (payload.new.author_id !== authUser?.id && 'Notification' in window && Notification.permission === 'granted') {
            showSafeNotification('New message in more.', {
              body: payload.new.text?.substring(0, 100) || 'New message',
            });
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
            showSafeNotification(payload.new.title, { body: payload.new.message });
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

  const canManageCommunity = (communityId) => {
    return user.ledCommunities?.includes(communityId) || user.isAdmin;
  };

  const saveItem = async (itemId) => {
    let next = [];
    setSavedItems(prev => {
      if (prev.includes(itemId)) {
        next = prev;
        return prev;
      }
      next = [...prev, itemId];
      if (typeof window !== 'undefined') localStorage.setItem('more_saved_items', JSON.stringify(next));
      return next;
    });
    
    if (user?.id && next.includes(itemId)) {
      const currentAp = user.affinityProfile || { tagScores: {}, likedCommunityIds: [], passedCommunityIds: [] };
      const newAp = { ...currentAp, savedEventIds: next };
      try {
        const { updateUserAction } = await import('../lib/actions');
        await updateUserAction(user.id, { affinityProfile: newAp }, session?.access_token);
      } catch(e) { console.error("Failed to sync saved items to DB", e); }
    }
  };

  const unsaveItem = async (itemId) => {
    let next = [];
    setSavedItems(prev => {
      next = prev.filter(id => id !== itemId);
      if (typeof window !== 'undefined') localStorage.setItem('more_saved_items', JSON.stringify(next));
      return next;
    });
    
    if (user?.id) {
      const currentAp = user.affinityProfile || { tagScores: {}, likedCommunityIds: [], passedCommunityIds: [] };
      const newAp = { ...currentAp, savedEventIds: next };
      try {
        const { updateUserAction } = await import('../lib/actions');
        await updateUserAction(user.id, { affinityProfile: newAp }, session?.access_token);
      } catch(e) { console.error("Failed to sync unsaved items to DB", e); }
    }
  };

  const joinCommunity = async (communityId) => {
    if (!user?.id) throw new Error("Please sign in to join a community");
    if (user.joinedCommunities.includes(communityId)) return;
    
    // Optimistic update
    const tempMem = { userId: user.id, role: 'Member' };
    setCommunityMemberships(prev => ({
      ...prev,
      [communityId]: [...(prev[communityId] || []), tempMem]
    }));

    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token || session?.access_token;
      const result = await joinCommunityAction(user.id, communityId, token);
      if (result && result.error) throw new Error(result.error);
      
      // Notify community leaders
      const targetComm = communities.find(c => c.id === communityId);
      const leaderIds = (communityMemberships[communityId] || [])
        .filter(m => m.role === 'Leader' || m.role === 'Co-Leader')
        .map(m => m.userId || m.user_id)
        .concat(targetComm?.leader_id, targetComm?.creator_id)
        .filter(Boolean);
      const uniqueLeaderIds = [...new Set(leaderIds)].filter(id => id !== user.id);
      if (uniqueLeaderIds.length > 0 && targetComm) {
        const notifs = uniqueLeaderIds.map(lid => ({
          user_id: lid,
          title: `👋 New Member in ${targetComm.name}`,
          message: `${user.name || 'A new member'} has joined ${targetComm.name}!`,
          type: 'member',
          link: `/community/${communityId}`
        }));
        await broadcastNotificationAction(notifs, token).catch(e => console.error("Failed to notify leader", e));
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
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token || session?.access_token;
      const result = await leaveCommunityAction(user.id, communityId, token);
      if (result && result.error) throw new Error(result.error);
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
      const exists = commMembers.some(m => m.userId === memberId || m.user_id === memberId);
      if (exists) {
        return {
          ...prev,
          [communityId]: commMembers.map(m => (m.userId === memberId || m.user_id === memberId) ? { ...m, role: newRole, userId: memberId, user_id: memberId } : m)
        };
      } else {
        return {
          ...prev,
          [communityId]: [...commMembers, { userId: memberId, user_id: memberId, role: newRole, communityId, community_id: communityId }]
        };
      }
    });
    try {
      await promoteMemberAction(communityId, memberId, newRole, session?.access_token);
    } catch (err) {
      console.error('Failed to promote member', err);
      throw err;
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

  const createFeedPost = async (communityId, text, media = null, isAnnouncement = false, isPinned = false) => {
    try {
      const { error } = await supabase.from('feed_posts').insert([{
        community_id: communityId,
        author_id: user.id,
        text: text,
        media: media,
        likes: 0,
        comments: 0,
        is_announcement: isAnnouncement,
        is_pinned: isPinned
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

  const createFeedComment = async (postId, text, communityId, mediaUrl = null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { createFeedPostCommentAction } = await import('../lib/actions');
      await createFeedPostCommentAction(postId, communityId, session?.user?.id, text, mediaUrl, session?.access_token);
      setFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };


  const updateAttendeeStatus = async (eventId, attendeeUserId, newStatus) => {
    setEventRsvps(prev => {
      const currentList = prev[eventId] || [];
      let updatedList;
      if (newStatus === 'declined' || newStatus === 'not_going') {
        updatedList = currentList.filter(r => r.userId !== attendeeUserId);
      } else {
        const exists = currentList.some(r => r.userId === attendeeUserId);
        if (exists) {
          updatedList = currentList.map(r => r.userId === attendeeUserId ? { ...r, status: newStatus } : r);
        } else {
          updatedList = [...currentList, { userId: attendeeUserId, status: newStatus }];
        }
      }
      return { ...prev, [eventId]: updatedList };
    });

    try {
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
      await updateAttendeeStatusAction(eventId, attendeeUserId, newStatus, token);
    } catch (err) {
      console.error('updateAttendeeStatus error:', err);
      throw err;
    }
  };

  const rsvpToEvent = async (eventId, status, ticketType = 'free', referredBy = null, metadata = {}) => {
    // Optimistic update
    setEventRsvps(prev => {
      const eventRsvpsList = prev[eventId] || [];
      const updatedList = eventRsvpsList.filter(r => r.userId !== user.id);
      if (status !== 'not_going') {
        updatedList.push({
          userId: user.id,
          status,
          ticketType,
          referredBy,
          guestName: metadata.guestName || null,
          answer: metadata.answer || null
        });
      }
      return { ...prev, [eventId]: updatedList };
    });

    try {
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
      await rsvpToEventAction(user.id, eventId, status, ticketType, referredBy, token, metadata);
      
      // Notify community leaders on positive RSVP
      if (status !== 'not_going') {
        const ev = events.find(e => e.id === eventId);
        const comm = communities.find(c => c.id === ev?.communityId);
        const leaderIds = (communityMemberships[comm?.id] || [])
          .filter(m => m.role === 'Leader' || m.role === 'Co-Leader')
          .map(m => m.userId || m.user_id)
          .concat(comm?.leader_id, comm?.creator_id)
          .filter(Boolean);
        const uniqueLeaderIds = [...new Set(leaderIds)].filter(id => id !== user.id);
        if (uniqueLeaderIds.length > 0 && ev) {
          const guestNote = metadata.guestName ? ` (with guest ${metadata.guestName})` : '';
          const notifs = uniqueLeaderIds.map(lid => ({
            user_id: lid,
            type: 'rsvp',
            title: `🎫 New RSVP for ${ev.title}`,
            message: `${user.name || 'A member'} booked a spot for "${ev.title}"${guestNote}!`,
            link: `/events/${eventId}`
          }));
          broadcastNotificationAction(notifs, token).catch(e => console.warn('Leader RSVP notif failed', e));
        }
      }
    } catch (err) {
      console.error('RSVP error:', err);
    }
  };

  const addEventPhoto = async (eventId, photoFile) => {
    try {
      const photoUrl = await uploadImage(photoFile, 'events');
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
      await addEventPhotoAction(eventId, photoUrl, token);
      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          const gallery = Array.isArray(e.galleryImages) ? e.galleryImages : [];
          return { ...e, galleryImages: [...gallery, photoUrl] };
        }
        return e;
      }));
      return photoUrl;
    } catch (err) {
      console.error('addEventPhoto error:', err);
      throw err;
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
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
      await adminVerifyCommunityAction(communityId, isVerified, token);
    } catch (err) {
      console.error('adminVerifyCommunity failed:', err);
      // Revert optimistic update on failure
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, verified: !isVerified } : c));
      throw err;
    }
  };

  const broadcastNotification = async (communityId, title, message, targetUserIds = null, customLink = null) => {
    let recipientIds = [];
    if (Array.isArray(targetUserIds) && targetUserIds.length > 0) {
      recipientIds = targetUserIds;
    } else {
      const members = communityMemberships[communityId] || [];
      recipientIds = members.map(m => m.userId || m.user_id).filter(Boolean);
    }
    const notifications = recipientIds.map(uid => ({
      user_id: uid,
      type: 'broadcast',
      title: title,
      message: message,
      link: customLink || `/community/${communityId}`,
      is_read: false
    }));
    
    if (notifications.length === 0) return;
    
    try {
      await broadcastNotificationAction(notifications, session?.access_token, communityId);
    } catch (err) {
      console.error('Broadcast failed:', err);
      throw err;
    }
  };

  const notifyCommunityLeaders = async (communityId, title, message, link = `/community/${communityId}`) => {
    const leaders = (communityMemberships[communityId] || []).filter(m => m.role === 'Leader' || m.role === 'Co-Leader');
    const notifications = leaders.map(l => ({
      user_id: l.userId,
      type: 'alert',
      title: title,
      message: message,
      link: link,
      is_read: false
    }));
    
    if (notifications.length === 0) return;
    
    try {
      await broadcastNotificationAction(notifications, session?.access_token);
    } catch (err) {
      console.error(err);
    }
  };

  const platformBroadcast = async (title, message) => {
    const notifications = users.map(u => ({
      user_id: u.id,
      type: 'broadcast',
      title: title,
      message: message,
      link: '/',
      is_read: false
    }));

    if (notifications.length === 0) return;
    
    try {
      await broadcastNotificationAction(notifications, session?.access_token);
    } catch (err) {
      console.error('Platform broadcast failed:', err);
      throw err;
    }
  };

  const sendEventReminder = async (eventId, customMessage = null) => {
    let token = session?.access_token;
    if (!token) {
      const { data: sessionData } = await supabase.auth.getSession();
      token = sessionData?.session?.access_token;
    }
    if (!token) throw new Error("Authentication required to send event reminders");
    return await sendEventReminderAction(eventId, customMessage, token);
  };

  // ─── Offline Trail Mode Check-in & Queue ─────────────────────────
  const flushOfflineCheckinQueue = async () => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = localStorage.getItem('more_offline_checkin_queue');
      const queue = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(queue) || queue.length === 0) return 0;

      let syncedCount = 0;
      const remaining = [];

      for (const item of queue) {
        try {
          const { error } = await supabase.from('event_rsvps')
            .update({ checked_in: true })
            .match({ event_id: item.eventId, user_id: item.userId });
          if (!error) {
            syncedCount++;
          } else {
            remaining.push(item);
          }
        } catch (e) {
          remaining.push(item);
        }
      }

      localStorage.setItem('more_offline_checkin_queue', JSON.stringify(remaining));
      return syncedCount;
    } catch (err) {
      console.warn('Could not flush offline checkin queue:', err);
      return 0;
    }
  };

  const checkInMember = async (eventId, userId) => {
    // 1. Instant optimistic in-memory check-in
    setEventRsvps(prev => ({
      ...prev,
      [eventId]: (prev[eventId] || []).map(r => 
        r.userId === userId ? { ...r, checkedIn: true } : r
      )
    }));

    // 2. Queue locally for zero-signal trail reliability
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('more_offline_checkin_queue');
        const queue = raw ? JSON.parse(raw) : [];
        const exists = queue.some(q => q.eventId === eventId && q.userId === userId);
        if (!exists) {
          queue.push({ eventId, userId, scannedAt: Date.now() });
          localStorage.setItem('more_offline_checkin_queue', JSON.stringify(queue));
        }
      } catch (e) {}
    }

    // 3. Attempt direct network sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { error } = await supabase.from('event_rsvps')
          .update({ checked_in: true })
          .match({ event_id: eventId, user_id: userId });
        if (!error && typeof window !== 'undefined') {
          // Remove synced item from offline queue
          try {
            const raw = localStorage.getItem('more_offline_checkin_queue');
            const queue = raw ? JSON.parse(raw) : [];
            const filtered = queue.filter(q => !(q.eventId === eventId && q.userId === userId));
            localStorage.setItem('more_offline_checkin_queue', JSON.stringify(filtered));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Network sync failed; item safely retained in offline trail queue:', err);
      }
    }
  };


  // ─── Carpool Hub State & Actions ─────────────────────────
  const [carpools, setCarpools] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const loaded = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('more_event_carpools_')) {
          const eventId = key.replace('more_event_carpools_', '');
          const raw = localStorage.getItem(key);
          if (raw) loaded[eventId] = JSON.parse(raw);
        }
      }
      if (Object.keys(loaded).length > 0) {
        setCarpools(loaded);
      }
    } catch (e) {}
  }, []);

  const offerCarpool = async (eventId, offerData) => {
    const newOffer = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId,
      driverId: user?.id,
      driverName: user?.name || 'Community Member',
      driverAvatar: user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Driver')}`,
      origin: offerData.origin,
      time: offerData.time,
      seatsTotal: Number(offerData.seatsTotal) || 3,
      seatsAvailable: Number(offerData.seatsTotal) || 3,
      passengers: [],
      flexibleOnRoute: Boolean(offerData.flexibleOnRoute),
      notes: offerData.notes || '',
      chipIn: offerData.chipIn || 'Free',
      createdAt: new Date().toISOString()
    };

    setCarpools(prev => {
      const list = [newOffer, ...(prev[eventId] || [])];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`more_event_carpools_${eventId}`, JSON.stringify(list)); } catch (e) {}
      }
      return { ...prev, [eventId]: list };
    });
    return newOffer;
  };

  const reserveCarpoolSeat = async (eventId, carpoolId) => {
    if (!user?.id) throw new Error("Must be signed in to reserve a seat");
    setCarpools(prev => {
      let currentList = prev[eventId];
      if (!currentList && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`more_event_carpools_${eventId}`);
          if (raw) currentList = JSON.parse(raw);
        } catch (e) {}
      }
      currentList = currentList || [];

      const updated = currentList.map(c => {
        if (c.id === carpoolId) {
          const isAlreadyPassenger = (c.passengers || []).some(p => p.userId === user.id);
          if (isAlreadyPassenger) return c;
          if (c.seatsAvailable <= 0) return c;

          const newPassengers = [...(c.passengers || []), {
            userId: user.id,
            name: user.name || 'Community Member',
            avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Rider')}`,
            reservedAt: new Date().toISOString()
          }];
          return {
            ...c,
            passengers: newPassengers,
            seatsAvailable: Math.max(0, c.seatsTotal - newPassengers.length)
          };
        }
        return c;
      });

      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`more_event_carpools_${eventId}`, JSON.stringify(updated)); } catch (e) {}
      }
      return { ...prev, [eventId]: updated };
    });
  };

  const cancelCarpoolSeat = async (eventId, carpoolId) => {
    if (!user?.id) return;
    setCarpools(prev => {
      let currentList = prev[eventId];
      if (!currentList && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`more_event_carpools_${eventId}`);
          if (raw) currentList = JSON.parse(raw);
        } catch (e) {}
      }
      currentList = currentList || [];

      const updated = currentList.map(c => {
        if (c.id === carpoolId) {
          const newPassengers = (c.passengers || []).filter(p => p.userId !== user.id);
          return {
            ...c,
            passengers: newPassengers,
            seatsAvailable: Math.max(0, c.seatsTotal - newPassengers.length)
          };
        }
        return c;
      });

      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`more_event_carpools_${eventId}`, JSON.stringify(updated)); } catch (e) {}
      }
      return { ...prev, [eventId]: updated };
    });
  };

  const deleteCarpoolOffer = async (eventId, carpoolId) => {
    setCarpools(prev => {
      let currentList = prev[eventId];
      if (!currentList && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`more_event_carpools_${eventId}`);
          if (raw) currentList = JSON.parse(raw);
        } catch (e) {}
      }
      currentList = currentList || [];

      const updated = currentList.filter(c => c.id !== carpoolId);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(`more_event_carpools_${eventId}`, JSON.stringify(updated)); } catch (e) {}
      }
      return { ...prev, [eventId]: updated };
    });
  };

  const createEvent = async (communityId, eventData) => {
    try {
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      let desc = eventData.description || '';
      if (eventData.requireApproval && !desc.includes('[Host Approval Required]')) {
        desc = (desc ? desc + '\n\n' : '') + '[Host Approval Required]';
      }
      if (eventData.rsvpQuestion?.trim() && !desc.includes('[RSVP Question:')) {
        desc = (desc ? desc + '\n\n' : '') + `[RSVP Question: ${eventData.rsvpQuestion.trim()}]`;
      }
      if (eventData.whatsappGroup?.trim() && !desc.includes('[WhatsApp:')) {
        desc = (desc ? desc + '\n\n' : '') + `[WhatsApp: ${eventData.whatsappGroup.trim()}]`;
      }
      if (eventData.allowCarpool === false && !desc.includes('[Carpool: disabled]')) {
        desc = (desc ? desc + '\n\n' : '') + '[Carpool: disabled]';
      }
      if (eventData.allowGuests === false && !desc.includes('[Guests: disabled]')) {
        desc = (desc ? desc + '\n\n' : '') + '[Guests: disabled]';
      }
      const newEvent = {
        communityId: communityId,
        collabCommunityIds: eventData.collabCommunityIds || [],
        title: eventData.title,
        description: desc,
        requireApproval: Boolean(eventData.requireApproval),
        date: eventData.date,
        time: eventData.time,
        ticketPrice: eventData.ticketPrice || eventData.ticket_price || 0,
        location: eventData.location,
        image: eventData.image || null,
        attendees: 0,
        status: 'published',
        maxCapacity: eventData.maxCapacity || null,
      };

      const data = await createEventAction(newEvent, token);
      
      // Optimistic UI update
      if (data) {
        const e = data;
        setEvents(prev => [...prev, {
          id: e.id,
          communityId: e.community_id,
          collabCommunityIds: e.cohost_community_ids || newEvent.collabCommunityIds || [],
          title: e.title,
          description: e.description || '',
          date: e.date,
          time: e.time,
          location: e.location,
          image: e.image,
          attendees: e.attendees || 0,
          status: e.status || 'published',
          maxCapacity: e.max_capacity || null,
          ticketPrice: e.ticket_price || 0,
          requireApproval: Boolean(e.require_approval || (e.description && e.description.includes('[Host Approval Required]')) || newEvent.requireApproval),
          rsvpQuestion: eventData.rsvpQuestion?.trim() || '',
          whatsappGroup: eventData.whatsappGroup?.trim() || '',
          allowCarpool: eventData.allowCarpool !== false,
          allowGuests: eventData.allowGuests !== false,
          galleryImages: [],
          createdAt: e.created_at
        }]);
      }
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const createEventsBatch = async (communityId, eventsList) => {
    try {
      if (!Array.isArray(eventsList) || eventsList.length === 0) return [];
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }

      const formattedEvents = eventsList.map(item => ({
        communityId: communityId,
        collabCommunityIds: item.collabCommunityIds || [],
        title: item.title,
        description: item.description || '',
        date: item.date,
        time: item.time,
        ticketPrice: item.ticketPrice || item.ticket_price || 0,
        location: item.location,
        image: item.image || null,
        attendees: 0,
        status: 'published',
        maxCapacity: item.maxCapacity || null,
      }));

      const data = await createEventsBatchAction(formattedEvents, token);

      if (data && Array.isArray(data)) {
        const mapped = data.map((e, idx) => {
          const item = eventsList[idx] || {};
          return {
            id: e.id,
            communityId: e.community_id,
            collabCommunityIds: e.cohost_community_ids || formattedEvents[idx]?.collabCommunityIds || [],
            title: e.title,
            description: e.description || '',
            date: e.date,
            time: e.time,
            location: e.location,
            image: e.image,
            attendees: e.attendees || 0,
            status: e.status || 'published',
            maxCapacity: e.max_capacity || null,
            ticketPrice: e.ticket_price || 0,
            requireApproval: Boolean(e.require_approval || (e.description && e.description.includes('[Host Approval Required]')) || item.requireApproval),
            rsvpQuestion: item.rsvpQuestion?.trim() || '',
            whatsappGroup: item.whatsappGroup?.trim() || '',
            allowCarpool: item.allowCarpool !== false,
            allowGuests: item.allowGuests !== false,
            galleryImages: [],
            createdAt: e.created_at
          };
        });
        setEvents(prev => [...prev, ...mapped]);
      }
      return data;
    } catch (err) {
      console.error('Batch creation error:', err);
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
    let finalUpdates = { ...updates };
    if (updates.requireApproval !== undefined) {
      const existing = events.find(e => e.id === eventId);
      let desc = updates.description !== undefined ? updates.description : (existing?.description || '');
      if (updates.requireApproval && !desc.includes('[Host Approval Required]')) {
        desc = (desc ? desc + '\n\n' : '') + '[Host Approval Required]';
      } else if (!updates.requireApproval && desc.includes('[Host Approval Required]')) {
        desc = desc.replace(/\[Host Approval Required\]/g, '').trim();
      }
      finalUpdates.description = desc;
      finalUpdates.requireApproval = updates.requireApproval;
    }
    if (updates.whatsappGroup !== undefined) {
      const existing = events.find(e => e.id === eventId);
      let desc = updates.description !== undefined ? updates.description : (existing?.description || '');
      desc = desc.replace(/\[WhatsApp: [^\]]+\]/g, '').trim();
      if (updates.whatsappGroup?.trim()) {
        desc = (desc ? desc + '\n\n' : '') + `[WhatsApp: ${updates.whatsappGroup.trim()}]`;
      }
      finalUpdates.description = desc;
      finalUpdates.whatsappGroup = updates.whatsappGroup.trim();
    }
    if (updates.allowCarpool !== undefined) {
      const existing = events.find(e => e.id === eventId);
      let desc = finalUpdates.description !== undefined ? finalUpdates.description : (updates.description !== undefined ? updates.description : (existing?.description || ''));
      if (!updates.allowCarpool && !desc.includes('[Carpool: disabled]')) {
        desc = (desc ? desc + '\n\n' : '') + '[Carpool: disabled]';
      } else if (updates.allowCarpool && desc.includes('[Carpool: disabled]')) {
        desc = desc.replace(/\[Carpool: disabled\]/g, '').trim();
      }
      finalUpdates.description = desc;
      finalUpdates.allowCarpool = updates.allowCarpool;
      finalUpdates.allow_carpool = updates.allowCarpool;
    }
    if (updates.allowGuests !== undefined) {
      const existing = events.find(e => e.id === eventId);
      let desc = finalUpdates.description !== undefined ? finalUpdates.description : (updates.description !== undefined ? updates.description : (existing?.description || ''));
      if (!updates.allowGuests && !desc.includes('[Guests: disabled]')) {
        desc = (desc ? desc + '\n\n' : '') + '[Guests: disabled]';
      } else if (updates.allowGuests && desc.includes('[Guests: disabled]')) {
        desc = desc.replace(/\[Guests: disabled\]/g, '').trim();
      }
      finalUpdates.description = desc;
      finalUpdates.allowGuests = updates.allowGuests;
      finalUpdates.allow_guests = updates.allowGuests;
    }
    const prevEvents = events;
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...finalUpdates } : e));
    
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
    const baseSlug = communityData.name
      .toLowerCase()
      .trim()
      .replace(/&/g, ' and ')
      .replace(/['’`.]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slugTaken = communities.some(
      c => c.id === baseSlug || String(c.id || '').replace(/-[a-z0-9]{5}$/i, '') === baseSlug
    );
    const newId = slugTaken ? `${baseSlug}-${Math.random().toString(36).substring(2, 6)}` : baseSlug;
    const parentId = communityData.parent_community_id || null;
    const chapterStatus = parentId ? (communityData.chapter_status || 'pending_approval') : 'approved';
    const royaltyPercent = communityData.chapter_royalty !== undefined ? Number(communityData.chapter_royalty) : 5;

    const initialSettings = {
      __type: "community_settings",
      allow_chapters: communityData.allow_chapters !== undefined ? Boolean(communityData.allow_chapters) : false,
      accepts_pitches: communityData.accepts_pitches !== undefined ? Boolean(communityData.accepts_pitches) : true,
      allow_carpool: communityData.allow_carpool !== undefined ? Boolean(communityData.allow_carpool) : true,
      allow_guests: communityData.allow_guests !== undefined ? Boolean(communityData.allow_guests) : true,
      parent_community_id: parentId,
      chapter_status: chapterStatus,
      chapter_royalty: royaltyPercent
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`more_community_settings_${newId}`, JSON.stringify(initialSettings));
      } catch (e) {}
    }
    const newCommunity = {
      id: newId,
      ...communityData,
      allow_chapters: initialSettings.allow_chapters,
      allowChapters: initialSettings.allow_chapters,
      accepts_pitches: initialSettings.accepts_pitches,
      acceptsPitches: initialSettings.accepts_pitches,
      allow_carpool: initialSettings.allow_carpool,
      allowCarpool: initialSettings.allow_carpool,
      allow_guests: initialSettings.allow_guests,
      allowGuests: initialSettings.allow_guests,
      leader_id: user.id
    };
    
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
        tags: [
          ...(Array.isArray(communityData.tags) ? communityData.tags.filter(t => !(typeof t === 'string' && t.startsWith('__cfg:'))) : []),
          `__cfg:chapters=${initialSettings.allow_chapters ? 1 : 0},pitches=${initialSettings.accepts_pitches ? 1 : 0},carpool=${initialSettings.allow_carpool ? 1 : 0},guests=${initialSettings.allow_guests ? 1 : 0}${parentId ? `,parent=${parentId},status=${chapterStatus},royalty=${royaltyPercent}` : ''}`
        ],
        cover_image: communityData.image || communityData.cover_image || null,
        creatorId: user.id,
        whatsapp_group: communityData.whatsapp_group || null,
        instagram_handle: communityData.instagram_handle || null,
        cost: communityData.cost || 'Free',
        target_audience: communityData.target_audience || null,
        location_name: communityData.location_name || null,
        activity_level: communityData.activity_level || 'Active',
        external_links: [...(Array.isArray(communityData.external_links) ? communityData.external_links : []), initialSettings]
      }, session?.access_token);
      
      if (parentId) {
        const parentComm = communities.find(c => c.id === parentId);
        if (parentComm?.leader_id) {
          try {
            await broadcastNotificationAction([{
              user_id: parentComm.leader_id,
              title: 'New Chapter Application 🏛️',
              message: `${user?.name || 'A local leader'} applied to launch a chapter of "${parentComm.name}" in ${communityData.location_name || 'their town'}. Review and approve in your dashboard.`,
              type: 'alert',
              link: `/dashboard?community=${parentId}`
            }], session?.access_token).catch(() => {});
          } catch (e) {}
        }
      }

      return newId;
    } catch (err) {
      console.error(err);
      setCommunities(prev => prev.filter(c => c.id !== newId));
      throw err;
    }
  };

  const createPost = async (communityId, text, media = null, destinations = { app: true }, audience = null) => {
    const { data: { session: curSession } } = await supabase.auth.getSession();
    const token = curSession?.access_token;
    
    let dbPost = null;
    // 1. Post to internal feed if app destination selected
    if (destinations?.app) {
      try {
        const { createFeedPostAction } = await import('../lib/actions');
        const res = await createFeedPostAction(
          communityId,
          user.id,
          text,
          media,
          true, // isAnnouncement
          false, // isPinned
          token
        );
        if (res?.data) {
          dbPost = res.data;
          setFeedPosts(prev => [{
            id: dbPost.id,
            communityId,
            authorId: user.id,
            text,
            media,
            likes: 0,
            comments: 0,
            is_announcement: true,
            timestamp: dbPost.created_at || new Date().toISOString()
          }, ...prev]);
        }
      } catch (feedErr) {
        console.error('Error in createPost feed insert:', feedErr);
      }
      
      // Also broadcast an in-app notification to all community members
      try {
        const preview = text.length > 100 ? text.slice(0, 97) + '...' : text;
        const notifTitle = audience?.title || '📢 Community Announcement';
        await broadcastNotification(communityId, notifTitle, preview, audience?.targetUserIds, audience?.link);
      } catch (notifErr) {
        console.warn('Could not broadcast notification to community members:', notifErr);
      }
    }

    // 2. Capture external syndication
    const selectedSocials = Object.keys(destinations || {}).filter(k => k !== 'app' && destinations[k]);
    const record = {
      id: dbPost?.id || `broadcast_${Date.now()}`,
      communityId,
      text,
      media,
      destinations: { ...destinations },
      syndicatedTo: selectedSocials,
      timestamp: new Date().toISOString(),
      status: 'published'
    };
    setBroadcastHistory(prev => [record, ...prev]);

    // Simulate short network delay for external platforms if selected
    if (selectedSocials.length > 0) {
      await new Promise(res => setTimeout(res, 600));
    }

    return {
      success: true,
      post: dbPost,
      destinations,
      socialCount: selectedSocials.length,
      selectedSocials
    };
  };

  const createChannel = async (communityId, channelName, type = 'text', memberIds = null) => {
    const newId = `ch_${Date.now()}`;
    const newChannel = { id: newId, community_id: communityId, name: channelName, type, member_ids: memberIds };
    setChannels(prev => [...prev, newChannel]);

    try {
      await createChannelAction({ id: newId, communityId, name: channelName, type, memberIds }, session?.access_token);
    } catch (err) {
      console.error(err);
      setChannels(prev => prev.filter(c => c.id !== newId));
    }
  };

  const uploadImage = async (file, bucketOrOptions) => {
    try {
      if (!file) throw new Error("No file provided");

      // 50MB limit check
      const maxSizeInBytes = 50 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        throw new Error("File exceeds the 50MB limit. Please choose a smaller file.");
      }

      // High-resolution options for banners, covers, and retina screens
      const isBannerOrCover = typeof bucketOrOptions === 'string' && (
        bucketOrOptions.includes('cover') || bucketOrOptions.includes('banner') || bucketOrOptions.includes('event')
      );

      // Compress with high fidelity (up to 2560px for banners, 3.5MB max size, 92% quality)
      const options = {
        maxSizeMB: isBannerOrCover ? 3.5 : 2.0,
        maxWidthOrHeight: isBannerOrCover ? 2560 : 1800,
        initialQuality: 0.92,
        useWebWorker: true,
        fileType: "image/webp",
      };
      
      let fileToCompress = file;

      // Handle HEIC/HEIF files from iOS
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
          // Dynamically import heic2any to avoid bloating the initial client bundle
          const heic2any = (await import('heic2any')).default;
          console.log("Converting HEIC to JPEG...");
          const conversionResult = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.92
          });
          
          const jpegBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
          const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
          fileToCompress = new File([jpegBlob], newName, { type: 'image/jpeg' });
          console.log("Converted HEIC to JPEG successfully");
        } catch (heicError) {
          console.error("HEIC conversion failed:", heicError);
        }
      }

      let finalFile = fileToCompress;
      if (fileToCompress.type.startsWith('image/')) {
        try {
          const result = await imageCompression(fileToCompress, options);
          
          // Rename the file to .webp to ensure the server action gets the correct extension
          const newName = fileToCompress.name.replace(/\.[^/.]+$/, "") + ".webp";
          finalFile = new File([result], newName, { type: 'image/webp' });
          
          console.log(`Compressed image from ${fileToCompress.size / 1024}KB to ${finalFile.size / 1024}KB`);
        } catch (error) {
          console.error("Compression failed, using original file", error);
        }
      } else if (fileToCompress.type.startsWith('video/')) {
        console.log(`Uploading raw video: ${finalFile.size / 1024 / 1024} MB`);
      }

      const formData = new FormData();
      formData.append('file', finalFile);
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
    
    // Strip frontend-only mock fields before sending to db
    const { affinityProfile, banner, ...dbUpdates } = updates;
    
    try {
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
      await updateUserAction(userId, dbUpdates, token);
    } catch (err) {
      console.error('User update failed (ignoring for prototype):', err);
    }
  };

  const updateCommunity = async (communityId, updates) => {
    // Optimistic UI update
    setCommunities(prev => prev.map(c => {
      if (c.id !== communityId) return c;
      const updated = { ...c, ...updates };
      if (updates.tags && updates.tags.length > 0) {
        updated.category = updates.category || updates.tags[0];
      }
      return updated;
    }));
    
    try {
      const dbUpdates = { ...updates };
      if (updates.guidelines !== undefined) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`more_community_guidelines_${communityId}`, JSON.stringify(updates.guidelines));
          } catch (e) {}
        }
      }
      const targetComm = communities.find(c => c.id === communityId) || {};
      const hasSettingsUpdate =
        updates.allow_chapters !== undefined ||
        updates.allowChapters !== undefined ||
        updates.accepts_pitches !== undefined ||
        updates.allow_carpool !== undefined ||
        updates.allowCarpool !== undefined ||
        updates.allow_guests !== undefined ||
        updates.allowGuests !== undefined;

      const parentId = updates.parent_community_id !== undefined ? updates.parent_community_id : (targetComm.parent_community_id || null);
      const chapterStatus = updates.chapter_status !== undefined ? updates.chapter_status : (targetComm.chapter_status || (parentId ? 'pending_approval' : 'approved'));
      const chapterRoyalty = updates.chapter_royalty !== undefined ? Number(updates.chapter_royalty) : (targetComm.chapter_royalty !== undefined ? Number(targetComm.chapter_royalty) : 5);

      const nextSettings = {
        __type: 'community_settings',
        allow_chapters: Boolean(updates.allow_chapters ?? updates.allowChapters ?? targetComm.allow_chapters ?? true),
        accepts_pitches: Boolean(updates.accepts_pitches ?? targetComm.accepts_pitches ?? true),
        allow_carpool: Boolean(updates.allow_carpool ?? updates.allowCarpool ?? targetComm.allow_carpool ?? true),
        allow_guests: Boolean(updates.allow_guests ?? updates.allowGuests ?? targetComm.allow_guests ?? true),
        parent_community_id: parentId,
        chapter_status: chapterStatus,
        chapter_royalty: chapterRoyalty
      };

      if (hasSettingsUpdate && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`more_community_settings_${communityId}`, JSON.stringify(nextSettings));
        } catch (e) {}
      }

      if (hasSettingsUpdate || updates.tags !== undefined) {
        const baseTags = Array.isArray(updates.tags !== undefined ? updates.tags : targetComm.tags)
          ? (updates.tags !== undefined ? updates.tags : targetComm.tags).filter(t => !(typeof t === 'string' && t.startsWith('__cfg:')))
          : [];
        const cfgStr = `__cfg:chapters=${nextSettings.allow_chapters ? 1 : 0},pitches=${nextSettings.accepts_pitches ? 1 : 0},carpool=${nextSettings.allow_carpool ? 1 : 0},guests=${nextSettings.allow_guests ? 1 : 0}${parentId ? `,parent=${parentId},status=${chapterStatus},royalty=${chapterRoyalty}` : ''}`;
        dbUpdates.tags = [...baseTags, cfgStr];
      }

      if (hasSettingsUpdate || updates.external_links !== undefined) {
        const sourceLinks = updates.external_links !== undefined ? updates.external_links : targetComm.external_links;
        const baseLinks = Array.isArray(sourceLinks)
          ? sourceLinks.filter(item => !item || item.__type !== 'community_settings')
          : [];
        dbUpdates.external_links = [...baseLinks, nextSettings];
      }

      // Prevent throwing error for non-existent mock CRM columns
      delete dbUpdates.allow_chapters;
      delete dbUpdates.allowChapters;
      delete dbUpdates.accepts_pitches;
      delete dbUpdates.allow_carpool;
      delete dbUpdates.allowCarpool;
      delete dbUpdates.allow_guests;
      delete dbUpdates.allowGuests;
      delete dbUpdates.parent_community_id;
      delete dbUpdates.chapter_status;
      delete dbUpdates.chapter_royalty;
      delete dbUpdates.autoWelcomeEnabled;
      delete dbUpdates.autoRemindersEnabled;
      delete dbUpdates.autoFeedbackEnabled;
      delete dbUpdates.customTagInput;
      
      if (Object.keys(dbUpdates).length > 0) {
        let token = session?.access_token;
        if (!token) {
          const { data: sessionData } = await supabase.auth.getSession();
          token = sessionData?.session?.access_token;
        }
        await updateCommunityAction(communityId, dbUpdates, token);
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...Object.fromEntries(Object.entries(updates).map(([k]) => [k, c[k]])) } : c));
      throw err;
    }
  };

  const deleteCommunity = async (communityId, confirmName) => {
    const prevCommunities = [...communities];
    const prevMemberships = { ...communityMemberships };
    const prevEvents = [...events];

    // Find the community name if not provided directly
    const targetComm = communities.find(c => c.id === communityId);
    const resolvedConfirmName = confirmName || targetComm?.name;

    // Optimistic UI update
    setCommunities(prev => prev.filter(c => c.id !== communityId));
    setEvents(prev => prev.filter(e => e.communityId !== communityId));
    setCommunityMemberships(prev => {
      const next = { ...prev };
      delete next[communityId];
      return next;
    });

    try {
      let token = session?.access_token;
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData?.session?.access_token;
      }
      const res = await deleteCommunityAction(communityId, token, resolvedConfirmName);
      if (res && res.error) {
        throw new Error(res.error);
      }
      return { success: true };
    } catch (err) {
      console.error('deleteCommunity failed:', err);
      // Revert optimistic update
      setCommunities(prevCommunities);
      setCommunityMemberships(prevMemberships);
      setEvents(prevEvents);
      throw err;
    }
  };

  const addCommunityHighlight = async (communityId, highlightUrl, title = 'New Highlight') => {
    const community = communities.find(c => c.id === communityId);
    if (!community) throw new Error("Community not found");
    
    const newHighlight = {
      id: `h_${Date.now()}`,
      url: highlightUrl,
      title,
      uploaderName: user?.name || 'Member',
      uploaderAvatar: user?.avatar || '',
      timestamp: 'Just now'
    };
    
    const currentHighlights = community.highlights || [];
    const updatedHighlights = [newHighlight, ...currentHighlights];
    
    // Attempt to persist to Supabase if a highlights JSONB column exists, otherwise just update state
    try {
      await supabase.from('communities').update({ highlights: updatedHighlights }).eq('id', communityId);
    } catch (e) {
      console.warn("Could not persist highlights to DB (schema missing), updating local state only");
    }
    
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, highlights: updatedHighlights } : c));
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

  const createPoll = async (communityId, question, options) => {
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token || session?.access_token;
      const { createPollAction } = await import('../lib/actions');
      const newPoll = await createPollAction(communityId, question, options, token);
      setPolls(prev => [...prev, newPoll]);
      return newPoll;
    } catch (err) {
      console.error('Failed to create poll', err);
      throw err;
    }
  };

  const votePoll = async (pollId, optionIndex) => {
    try {
      setPollVotes(prev => {
        const currentVotes = prev[pollId] || [];
        const filtered = currentVotes.filter(v => v.user_id !== user.id);
        filtered.push({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
        return { ...prev, [pollId]: filtered };
      });

      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token || session?.access_token;
      const { votePollAction } = await import('../lib/actions');
      await votePollAction(pollId, user.id, optionIndex, token);
    } catch (err) {
      console.error('Failed to vote on poll', err);
      throw err;
    }
  };



  return (
    <AppContext.Provider value={{
      user: effectiveUser,
      realUser,
      simulatedPersona,
      setSimulatedPersona,
      impersonatedUserId,
      setImpersonatedUserId,
      exitSimulator,
      isSimulating: (simulatedPersona !== 'real' && simulatedPersona !== 'admin') || Boolean(impersonatedUserId),
      communities: communities.filter(c => !c.is_banned),
      allCommunities: communities,
      events,
      messages,
      channels,
      users,
      communityMemberships,
      eventRsvps,
      notifications,
      directMessages,
      isLoading,
      polls,
      pollVotes,
      createPoll,
      votePoll,
      joinCommunity,
      leaveCommunity,
      sendMessage,
      sendDirectMessage,
      updateCommunityProfile,
      adminVerifyCommunity,
      broadcastNotification,
      sendEventReminder,
      notifyCommunityLeaders,
      createEvent,
      createEventsBatch,
      updateEvent,
      cancelEvent,
      rsvpToEvent,
      updateAttendeeStatus,
      addEventPhoto,
      createCommunity,
      createChannel,
      uploadImage,
      addCommunityHighlight,
      updateUser,
      updateCommunity,
      deleteCommunity,
      approveChapter: async (chapterId) => {
        await updateCommunity(chapterId, { chapter_status: 'approved' });
        const targetComm = communities.find(c => c.id === chapterId);
        if (targetComm?.leader_id) {
          try {
            await broadcastNotificationAction([{
              user_id: targetComm.leader_id,
              title: 'Chapter Approved! 🎉',
              message: `Your chapter "${targetComm.name}" has been approved by the founding leader and is now active across the network!`,
              type: 'alert',
              link: `/community/${chapterId}`
            }], session?.access_token).catch(() => {});
          } catch (e) {}
        }
      },
      declineChapter: async (chapterId) => {
        await updateCommunity(chapterId, { chapter_status: 'declined' });
        const targetComm = communities.find(c => c.id === chapterId);
        if (targetComm?.leader_id) {
          try {
            await broadcastNotificationAction([{
              user_id: targetComm.leader_id,
              title: 'Chapter Application Update',
              message: `Your chapter application for "${targetComm.name}" was not approved at this time.`,
              type: 'alert',
              link: `/community/${chapterId}`
            }], session?.access_token).catch(() => {});
          } catch (e) {}
        }
      },
      toggleUserRole,
      promoteMember,
      removeMember,
      subscribeToPushNotifications,
      markNotificationRead,
      feedPosts,
      experiences,
      setExperiences,
      services,
      reviews,
      addReview,
      savedItems,
      saveItem,
      unsaveItem,
      setReviews,
      connectedSocialAccounts,
      setConnectedSocialAccounts,
      createPost,
      broadcastHistory,
      createFeedPost,
      likeFeedPost,
      createFeedComment,
      whatsappSettings,
      setWhatsappSettings,
      broadcastNotification,
      platformBroadcast,
      checkInMember,
      refreshData,
      flushOfflineCheckinQueue,
      carpools,
      setCarpools,
      offerCarpool,
      reserveCarpoolSeat,
      cancelCarpoolSeat,
      deleteCarpoolOffer,
      chatReadReceipts,
      markChatRead,
      sponsors,
      sponsorshipAssignments,
      prescribingLinks,
      setPrescribingLinks,
      services,
      pitchService,
      updateServiceStatus,
      theme, setTheme,
      highContrast, setHighContrast,
      largeText, setLargeText,
      reduceMotion, setReduceMotion,
      getAffinityScore: (community) => {
        if (!user?.affinityProfile && !user?.interests) return 0;

        if (user?.gender === 'Male') {
          const name = community?.name?.toLowerCase() || '';
          const desc = community?.description?.toLowerCase() || '';
          if (name.includes('mum') || name.includes('women') || desc.includes('women only') || desc.includes('for mums') || desc.includes('mothers')) {
            return -100;
          }
        }

        const ap = user?.affinityProfile || { tagScores: {}, likedCommunityIds: [], passedCommunityIds: [] };
        const userInterests = user?.interests || [];
        const communityTags = community?.tags || [];
        // Tag overlap score (broad categories)
        const tagOverlap = communityTags.filter(tag => 
          userInterests.some(interest => interest.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(interest.toLowerCase()))
        ).length;
        // Swipe affinity score (behavioural signal, weighted higher)
        const swipeScore = communityTags.reduce((sum, tag) => {
          const tagLower = tag.toLowerCase();
          return sum + Object.entries(ap.tagScores || {}).reduce((s, [k, v]) => {
            return tagLower.includes(k.toLowerCase()) || k.toLowerCase().includes(tagLower) ? s + v : s;
          }, 0);
        }, 0);
        // Liked community bonus
        const likedBonus = (ap.likedCommunityIds || []).includes(community?.id) ? 5 : 0;
        // Passed community penalty
        const passedPenalty = (ap.passedCommunityIds || []).includes(community?.id) ? -3 : 0;
        return (tagOverlap * 1.0) + (swipeScore * 1.5) + likedBonus + passedPenalty;
      }
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
