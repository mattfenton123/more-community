"use client";
import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { supabase } from '../../src/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageCircle,
  Users,
  Hash,
  Search,
  Plus,
  Megaphone,
  Lock,
  X,
  ChevronLeft,
  Calendar,
  Check,
} from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { FALLBACK_IMAGES } from '../../src/lib/constants';
import { useToast } from '../../src/components/Toast';
import { resolveUserAvatar, getDefaultAvatar } from '../../src/lib/avatar';
import { formatChatTime, getManageableCommunities } from '../../src/lib/chatUtils';
import { isEventUpcoming } from '../../src/lib/calendar';
import { parseChannel } from '../../src/lib/channelMeta';
import { getMetInPersonMap } from '../../src/lib/inPersonGraph';

const INBOX_TABS = [
  { id: 'All', label: 'All' },
  { id: 'Clubs', label: 'Clubs' },
  { id: 'Events', label: 'Events' },
  { id: 'People', label: 'People' },
];

export default function ChatIndex() {
  const {
    communities,
    user,
    users,
    isLoading,
    channels,
    createChannel,
    communityMemberships,
    events = [],
    eventRsvps = {},
    eventComments = {},
    theme,
  } = useAppContext();
  const { directMessages, chatReadReceipts, messages, markChatRead } = useChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityFilterId = searchParams?.get('communityId');
  const { toast } = useToast();

  const isLight = theme === 'light';

  const [inboxSearch, setInboxSearch] = useState('');
  const [remoteSearchHits, setRemoteSearchHits] = useState({ channelHits: [], dmHits: [] });
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [inboxTab, setInboxTab] = useState('All'); // 'All' | 'Clubs' | 'Events' | 'People'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState('menu'); // 'menu' | 'dm' | 'sidegroup' | 'channel'
  const [newChannelName, setNewChannelName] = useState('');
  const [createChannelCommunityId, setCreateChannelCommunityId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const myCommunities = useMemo(
    () => (communities || []).filter((c) => user?.joinedCommunities?.includes(c.id)),
    [communities, user?.joinedCommunities]
  );

  const manageableCommunities = useMemo(
    () => getManageableCommunities(communities || [], user, communityMemberships),
    [communities, user, communityMemberships]
  );

  // Communities where this user is allowed to spin up a private side-group
  const sideGroupCommunities = useMemo(() => {
    const map = new Map();
    manageableCommunities.forEach((c) => {
      if (c?.id) map.set(c.id, c);
    });
    myCommunities.forEach((c) => {
      if (!c?.id) return;
      const allowed = c.allow_member_groups !== false && c.allowMemberGroups !== false;
      if (allowed && !map.has(c.id)) {
        map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  }, [myCommunities, manageableCommunities]);

  const metInPersonMap = useMemo(
    () => getMetInPersonMap(user?.id, events, eventRsvps),
    [user?.id, events, eventRsvps]
  );

  const filteredCommunityName = useMemo(() => {
    if (!communityFilterId) return null;
    return (communities || []).find((c) => c.id === communityFilterId)?.name || 'Community';
  }, [communities, communityFilterId]);

  // Debounced full-history Supabase search across messages & direct_messages
  useEffect(() => {
    const q = inboxSearch.trim();
    if (!user?.id || q.length < 2) {
      setRemoteSearchHits({ channelHits: [], dmHits: [] });
      setIsSearchingRemote(false);
      return;
    }

    let cancelled = false;
    setIsSearchingRemote(true);
    const timer = setTimeout(async () => {
      try {
        const joinedIds = (user.joinedCommunities || []).filter(Boolean);
        const channelPromise =
          joinedIds.length > 0
            ? supabase
                .from('messages')
                .select('id, community_id, channel, author_id, text, created_at')
                .in('community_id', joinedIds)
                .ilike('text', `%${q}%`)
                .order('created_at', { ascending: false })
                .limit(50)
            : Promise.resolve({ data: [] });

        const dmPromise = supabase
          .from('direct_messages')
          .select('id, sender_id, receiver_id, text, created_at')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .ilike('text', `%${q}%`)
          .order('created_at', { ascending: false })
          .limit(50);

        const [chRes, dmRes] = await Promise.all([channelPromise, dmPromise]);
        if (!cancelled) {
          setRemoteSearchHits({
            channelHits: (chRes.data || []).map((m) => ({
              id: m.id,
              communityId: m.community_id,
              channel: m.channel,
              authorId: m.author_id,
              senderId: m.author_id,
              text: m.text,
              createdAt: m.created_at,
            })),
            dmHits: (dmRes.data || []).map((dm) => ({
              id: dm.id,
              senderId: dm.sender_id,
              receiverId: dm.receiver_id,
              text: dm.text,
              createdAt: dm.created_at,
            })),
          });
        }
      } catch (err) {
        console.warn('Chat remote search error:', err);
      } finally {
        if (!cancelled) setIsSearchingRemote(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inboxSearch, user?.id, user?.joinedCommunities]);

  // Build unified enriched inbox items BEFORE tab filtering so we can also compute tab unread counts
  const allEnrichedItems = useMemo(() => {
    if (!user?.id) return [];

    const items = [];
    const seenChannelKeys = new Set();
    const parsedChannels = (channels || []).map(parseChannel).filter(Boolean);

    // 1. Official club channels for communities the user joined
    myCommunities.forEach((c) => {
      const commChannels = parsedChannels.filter((ch) => ch.communityId === c.id);
      const openClubChannels = commChannels.filter(
        (ch) => !ch.isPrivateGroup && ch.channelType !== 'announcement'
      );

      if (openClubChannels.length === 0) {
        const key = `${c.id}::general`;
        seenChannelKeys.add(key);
        items.push({
          type: 'channel',
          channelType: 'text',
          isPrivateGroup: false,
          comm: c,
          name: 'general',
          id: 'general',
        });
      } else {
        openClubChannels.forEach((ch) => {
          const key = `${c.id}::${ch.id}`;
          if (seenChannelKeys.has(key)) return;
          seenChannelKeys.add(key);
          items.push({
            type: 'channel',
            channelType: ch.channelType || 'text',
            isPrivateGroup: false,
            comm: c,
            name: ch.name,
            id: ch.id,
            created_at: ch.created_at,
          });
        });
      }
    });

    // 2. Private side-groups where this user is explicitly a member
    parsedChannels.forEach((ch) => {
      if (!ch.isPrivateGroup) return;
      const memberIds = Array.isArray(ch.memberIds) ? ch.memberIds : [];
      if (!memberIds.includes(user.id)) return;
      const comm = (communities || []).find((c) => c.id === ch.communityId) || {
        id: ch.communityId,
        name: 'Community',
      };
      const key = `${comm.id}::${ch.id}`;
      if (seenChannelKeys.has(key)) return;
      seenChannelKeys.add(key);
      items.push({
        type: 'channel',
        channelType: 'group',
        isPrivateGroup: true,
        comm,
        name: ch.name,
        id: ch.id,
        memberIds,
        creatorId: ch.creatorId,
        created_at: ch.created_at,
      });
    });

    // 3. Direct Messages
    if (directMessages && user) {
      const dmUsers = new Set();
      directMessages.forEach((dm) => {
        const otherUserId = dm.senderId === user.id ? dm.receiverId : dm.senderId;
        if (otherUserId && otherUserId !== user.id) dmUsers.add(otherUserId);
      });
      (remoteSearchHits.dmHits || []).forEach((dm) => {
        const otherUserId = dm.senderId === user.id ? dm.receiverId : dm.senderId;
        if (otherUserId && otherUserId !== user.id) dmUsers.add(otherUserId);
      });
      dmUsers.forEach((otherId) => {
        const otherUserObj = (users || []).find((u) => u.id === otherId) || {
          id: otherId,
          name: 'Community Member',
        };
        items.push({ type: 'dm', otherUser: otherUserObj, id: otherId });
      });
    }

    // 4. Event Discussion / Q&A threads for events user leads, is Going to, or commented on
    (events || []).forEach((ev) => {
      if (!ev?.id || ev.status === 'cancelled' || ev.status === 'proposed') return;
      const comm = (communities || []).find((c) => c.id === ev.communityId) || null;
      const rsvps = eventRsvps?.[ev.id] || [];
      const isGoing = rsvps.some(
        (r) => (r.userId === user.id || r.user_id === user.id) && r.status !== 'declined' && r.status !== 'cancelled'
      );
      const isHost =
        Boolean(user?.ledCommunities?.includes(ev.communityId)) ||
        (Array.isArray(ev.cohostCommunityIds) && ev.cohostCommunityIds.some((cid) => user?.ledCommunities?.includes(cid))) ||
        (Array.isArray(ev.cohost_community_ids) && ev.cohost_community_ids.some((cid) => user?.ledCommunities?.includes(cid)));
      const evComments = eventComments?.[ev.id] || [];
      const hasCommented = evComments.some((c) => c.authorId === user.id || c.author_id === user.id);
      const upcoming = isEventUpcoming(ev);

      if (!isGoing && !isHost && !hasCommented) return;
      if (!upcoming && evComments.length === 0) return;

      items.push({
        type: 'event_qna',
        id: ev.id,
        event: ev,
        comm,
        hasComments: evComments.length > 0,
        isUpcoming: upcoming,
      });
    });

    const q = inboxSearch.toLowerCase().trim();

    return items
      .map((item) => {
        let itemMessages = [];
        let latestMsg = null;
        let matchedMsg = null;
        let hasUnread = false;

        if (item.type === 'dm') {
          itemMessages = (directMessages || []).filter(
            (m) =>
              (m.senderId === item.id && m.receiverId === user?.id) ||
              (m.senderId === user?.id && m.receiverId === item.id)
          );
          latestMsg = itemMessages[itemMessages.length - 1] || null;

          if (q) {
            for (let idx = itemMessages.length - 1; idx >= 0; idx--) {
              if ((itemMessages[idx]?.text || '').toLowerCase().includes(q)) {
                matchedMsg = itemMessages[idx];
                break;
              }
            }
            if (!matchedMsg) {
              matchedMsg =
                (remoteSearchHits.dmHits || []).find(
                  (m) =>
                    (m.senderId === item.id && m.receiverId === user?.id) ||
                    (m.senderId === user?.id && m.receiverId === item.id)
                ) || null;
            }
          }

          const dmLastReadMs = (chatReadReceipts || [])
            .filter((r) => !r.community_id && r.channel_id === item.id)
            .reduce((max, r) => Math.max(max, new Date(r.last_read_at || 0).getTime()), 0);
          hasUnread = Boolean(
            latestMsg &&
              latestMsg.senderId !== user?.id &&
              (!dmLastReadMs ||
                dmLastReadMs <
                  new Date(latestMsg.createdAt || latestMsg.created_at || new Date().toISOString()).getTime())
          );
        } else if (item.type === 'event_qna') {
          itemMessages = (eventComments?.[item.id] || []).map((c) => ({
            id: c.id,
            authorId: c.authorId || c.author_id,
            senderId: c.authorId || c.author_id,
            authorName: c.authorName,
            text: c.text,
            createdAt: c.createdAt || c.created_at,
          }));
          latestMsg = itemMessages[itemMessages.length - 1] || null;

          if (q) {
            for (let idx = itemMessages.length - 1; idx >= 0; idx--) {
              if ((itemMessages[idx]?.text || '').toLowerCase().includes(q)) {
                matchedMsg = itemMessages[idx];
                break;
              }
            }
          }

          const evLastReadMs = (chatReadReceipts || [])
            .filter((r) => r.community_id === 'event_qna' && r.channel_id === item.id)
            .reduce((max, r) => Math.max(max, new Date(r.last_read_at || 0).getTime()), 0);
          hasUnread = Boolean(
            latestMsg &&
              latestMsg.authorId !== user?.id &&
              (!evLastReadMs ||
                evLastReadMs <
                  new Date(latestMsg.createdAt || latestMsg.created_at || new Date().toISOString()).getTime())
          );
        } else {
          itemMessages = (messages || []).filter(
            (m) =>
              m.communityId === item.comm.id &&
              (m.channel === item.id || m.channelId === item.id)
          );
          latestMsg = itemMessages[itemMessages.length - 1] || null;

          if (q) {
            for (let idx = itemMessages.length - 1; idx >= 0; idx--) {
              if ((itemMessages[idx]?.text || '').toLowerCase().includes(q)) {
                matchedMsg = itemMessages[idx];
                break;
              }
            }
            if (!matchedMsg) {
              matchedMsg =
                (remoteSearchHits.channelHits || []).find(
                  (m) => m.communityId === item.comm.id && m.channel === item.id
                ) || null;
            }
          }

          const commLastReadMs = (chatReadReceipts || [])
            .filter((r) => r.community_id === item.comm.id && r.channel_id === item.id)
            .reduce((max, r) => Math.max(max, new Date(r.last_read_at || 0).getTime()), 0);
          hasUnread = Boolean(
            latestMsg &&
              latestMsg.authorId !== user?.id &&
              latestMsg.senderId !== user?.id &&
              (!commLastReadMs ||
                commLastReadMs <
                  new Date(latestMsg.createdAt || latestMsg.created_at || new Date().toISOString()).getTime())
          );
        }

        const rawTitle =
          item.type === 'dm'
            ? item.otherUser.name
            : item.type === 'event_qna'
              ? item.event.title
              : item.name;
        const displayTitle =
          item.type === 'channel' && !item.isPrivateGroup && rawTitle.toLowerCase() === 'general'
            ? item.comm.name
            : rawTitle;

        const metCount = item.type === 'dm' ? metInPersonMap.get(item.id) || 0 : 0;

        let displaySubtitle = null;
        if (item.type === 'event_qna') {
          displaySubtitle = `Event Q&A${item.event?.date ? ` · ${item.event.date}` : ''}`;
        } else if (item.type === 'channel' && item.isPrivateGroup) {
          const count = item.memberIds?.length || 2;
          displaySubtitle = `Private group · ${count} members${item.comm?.name ? ` · ${item.comm.name}` : ''}`;
        } else if (item.type === 'channel') {
          displaySubtitle =
            rawTitle.toLowerCase() === 'general' ? 'Club Chat' : `#${rawTitle} · ${item.comm.name}`;
        } else if (item.type === 'dm' && metCount > 0) {
          displaySubtitle = `✓ Met in person${metCount > 1 ? ` · ${metCount} meetups` : ''}`;
        }

        const bucket =
          item.type === 'event_qna'
            ? 'Events'
            : item.type === 'dm' || item.isPrivateGroup
              ? 'People'
              : 'Clubs';

        const previewMsg = matchedMsg || latestMsg;

        return {
          ...item,
          bucket,
          metCount,
          displayTitle,
          displaySubtitle,
          latestMsg,
          matchedMsg,
          previewMsg,
          hasUnread,
          sortTime: previewMsg?.createdAt
            ? new Date(previewMsg.createdAt).getTime()
            : previewMsg?.created_at
              ? new Date(previewMsg.created_at).getTime()
              : item.created_at
                ? new Date(item.created_at).getTime()
                : 0,
        };
      })
      .filter((item) => {
        if (communityFilterId && item.comm?.id !== communityFilterId) return false;
        return true;
      })
      .sort((a, b) => b.sortTime - a.sortTime);
  }, [
    user,
    myCommunities,
    channels,
    directMessages,
    users,
    messages,
    chatReadReceipts,
    communityFilterId,
    inboxSearch,
    remoteSearchHits,
    events,
    eventRsvps,
    eventComments,
    communities,
    metInPersonMap,
  ]);

  const tabUnreadCounts = useMemo(() => {
    const counts = { All: 0, Clubs: 0, Events: 0, People: 0 };
    allEnrichedItems.forEach((item) => {
      if (!item.hasUnread) return;
      if (item.bucket === 'Clubs') counts.Clubs += 1;
      else if (item.bucket === 'Events') counts.Events += 1;
      else if (item.bucket === 'People') counts.People += 1;
      counts.All += 1;
    });
    return counts;
  }, [allEnrichedItems]);

  const inboxItems = useMemo(() => {
    const q = inboxSearch.toLowerCase().trim();
    return allEnrichedItems.filter((item) => {
      if (inboxTab === 'All' && item.type === 'event_qna' && !item.hasComments && !q) return false;
      if (inboxTab === 'Clubs' && item.bucket !== 'Clubs') return false;
      if (inboxTab === 'Events' && item.bucket !== 'Events') return false;
      if (inboxTab === 'People' && item.bucket !== 'People') return false;
      if (q) {
        const inTitle = (item.displayTitle || '').toLowerCase().includes(q);
        const inSub = (item.displaySubtitle || '').toLowerCase().includes(q);
        const inAnyMsg = Boolean(item.matchedMsg);
        return inTitle || inSub || inAnyMsg;
      }
      return true;
    });
  }, [allEnrichedItems, inboxTab, inboxSearch]);

  // Eligible contacts for DMs: shared communities + met in person, sorted with Met in person first
  const dmCandidates = useMemo(() => {
    const allowedIds = new Set();
    (user?.joinedCommunities || []).forEach((communityId) => {
      const members = communityMemberships?.[communityId] || [];
      members.forEach((m) => allowedIds.add(m.userId || m.user_id));
    });
    metInPersonMap.forEach((_count, uid) => allowedIds.add(uid));

    return (users || [])
      .filter((u) => u.id && u.id !== user?.id && allowedIds.has(u.id))
      .sort((a, b) => {
        const metA = metInPersonMap.get(a.id) || 0;
        const metB = metInPersonMap.get(b.id) || 0;
        if (metB !== metA) return metB - metA;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [user, communityMemberships, users, metInPersonMap]);

  const activeSideGroupCommunityId =
    createChannelCommunityId && sideGroupCommunities.some((c) => c.id === createChannelCommunityId)
      ? createChannelCommunityId
      : sideGroupCommunities[0]?.id || null;

  const activeOfficialChannelCommunityId =
    createChannelCommunityId && manageableCommunities.some((c) => c.id === createChannelCommunityId)
      ? createChannelCommunityId
      : manageableCommunities[0]?.id || null;

  // Contacts for Private Side-Group: members of selected community + people met in person
  const sideGroupCandidates = useMemo(() => {
    const allowedIds = new Set();
    if (activeSideGroupCommunityId) {
      const members = communityMemberships?.[activeSideGroupCommunityId] || [];
      members.forEach((m) => allowedIds.add(m.userId || m.user_id));
    }
    metInPersonMap.forEach((_count, uid) => allowedIds.add(uid));

    return (users || [])
      .filter((u) => u.id && u.id !== user?.id && allowedIds.has(u.id))
      .sort((a, b) => {
        const metA = metInPersonMap.get(a.id) || 0;
        const metB = metInPersonMap.get(b.id) || 0;
        if (metB !== metA) return metB - metA;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [activeSideGroupCommunityId, communityMemberships, users, user?.id, metInPersonMap]);

  const resetModalState = () => {
    setCreateMode('menu');
    setNewChannelName('');
    setSelectedMembers([]);
    setUserSearchTerm('');
  };

  const handleCreatePrivateSideGroup = async () => {
    if (!newChannelName.trim() || isCreating) return;
    if (!activeSideGroupCommunityId) {
      toast.error('Join a community first', 'You need to belong to a community that allows side-groups.');
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error('Pick at least one person', 'Select who you want to include in this private side-group.');
      return;
    }

    setIsCreating(true);
    try {
      const memberIds = Array.from(new Set([user?.id, ...selectedMembers].filter(Boolean)));
      const created = await createChannel(
        activeSideGroupCommunityId,
        newChannelName.trim(),
        'group',
        memberIds
      );
      toast.success('Private group created!', `${newChannelName.trim()} is ready`);
      resetModalState();
      setShowCreateModal(false);
      if (created?.id) {
        router.push(`/chat/${activeSideGroupCommunityId}/${created.id}`);
      }
    } catch (err) {
      toast.error('Could not create group', err?.message || 'Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateOfficialChannel = async () => {
    if (!newChannelName.trim() || isCreating) return;
    if (!activeOfficialChannelCommunityId) {
      toast.error('Leader access required', 'Only community leaders can create official club channels.');
      return;
    }

    setIsCreating(true);
    try {
      const cleanChannelName = newChannelName.trim().replace(/^#+/, '');
      const created = await createChannel(
        activeOfficialChannelCommunityId,
        cleanChannelName,
        'text',
        null
      );
      toast.success('Club channel created!', `#${cleanChannelName} is now live for all members`);
      resetModalState();
      setShowCreateModal(false);
      if (created?.id) {
        router.push(`/chat/${activeOfficialChannelCommunityId}/${created.id}`);
      }
    } catch (err) {
      toast.error('Could not create channel', err?.message || 'Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', paddingBottom: '100px' }}>
        <AppHeader title="Chats" />
        <div style={{ color: 'var(--ink-muted)', textAlign: 'center', padding: '64px 20px' }}>
          Loading chats...
        </div>
      </div>
    );
  }

  return (
    <div
      className="view-chat"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--surface-canvas)',
        paddingBottom: '96px',
      }}
    >
      <AppHeader title="Chats" />

      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '18px 20px 0',
          boxSizing: 'border-box',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Guest Prompt */}
        {!user?.id ? (
          <div
            style={{
              margin: '40px auto',
              maxWidth: '420px',
              width: '100%',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '20px',
              padding: '36px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--brand-accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--brand-accent)',
              }}
            >
              <MessageCircle size={28} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                color: 'var(--ink-primary)',
                margin: '0 0 8px',
              }}
            >
              Sign in to join the conversation
            </h2>
            <p
              style={{
                color: 'var(--ink-secondary)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              Chat with your local community groups, coordinate walks, and message fellow members.
            </p>
            <button
              onClick={() => router.push('/login?redirect=/chat')}
              className="btn btn-primary interactive-press"
              style={{
                padding: '11px 22px',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#FFFFFF',
              }}
            >
              Sign In / Join
            </button>
          </div>
        ) : (
          <>
            {/* Editorial Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.45rem, 3.5vw, 1.85rem)',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Messages
              </h1>
              <button
                onClick={() => {
                  resetModalState();
                  setShowCreateModal(true);
                }}
                className="btn btn-primary interactive-press"
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={15} /> New Chat
              </button>
            </div>

            {/* Active Community Filter Banner */}
            {communityFilterId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  borderRadius: '12px',
                  background: 'var(--brand-accent-soft)',
                  border: '1px solid rgba(235, 87, 56, 0.28)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--teal-300)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <Hash size={14} /> Showing chats for {filteredCommunityName}
                </div>
                <button
                  onClick={() => router.push('/chat')}
                  aria-label="Clear community filter"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--teal-300)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Search & 4-Bucket Filter Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--ink-muted)',
                }}
              >
                <Search size={16} style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search conversations or messages..."
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                {inboxSearch && (
                  <button
                    onClick={() => setInboxSearch('')}
                    aria-label="Clear search"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="segmented-control">
                {INBOX_TABS.map((tab) => {
                  const unreadCount = tabUnreadCounts[tab.id] || 0;
                  const isActive = inboxTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setInboxTab(tab.id)}
                      className={isActive ? 'active' : ''}
                      style={{
                        padding: '9px 6px',
                        fontSize: '0.82rem',
                        gap: '5px',
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{tab.label}</span>
                      {unreadCount > 0 && tab.id !== 'All' && (
                        <span
                          style={{
                            minWidth: '17px',
                            height: '17px',
                            padding: '0 5px',
                            borderRadius: '999px',
                            fontSize: '0.67rem',
                            fontWeight: 800,
                            lineHeight: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isActive ? 'var(--brand-accent)' : 'var(--brand-accent)',
                            color: '#FFFFFF',
                          }}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation List */}
            {inboxItems.length === 0 ? (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px dashed var(--hairline-border-strong)',
                  borderRadius: '18px',
                  padding: '44px 20px',
                  textAlign: 'center',
                  color: 'var(--ink-secondary)',
                }}
              >
                <MessageCircle
                  size={36}
                  color="var(--ink-muted)"
                  style={{ marginBottom: '10px' }}
                />
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.08rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {isSearchingRemote
                    ? 'Searching message history...'
                    : inboxSearch
                      ? 'No matching chats'
                      : inboxTab === 'Events'
                        ? 'No active event chats yet'
                        : inboxTab === 'People'
                          ? 'No direct or private group chats yet'
                          : inboxTab === 'Clubs'
                            ? 'No club channels yet'
                            : 'No conversations yet'}
                </div>
                <p style={{ margin: '0 auto 16px', fontSize: '0.86rem', maxWidth: '340px' }}>
                  {inboxSearch
                    ? 'Try a different name or keyword.'
                    : inboxTab === 'Events'
                      ? 'RSVP to an upcoming meetup to join its event chat.'
                      : inboxTab === 'People'
                        ? 'Message someone you met or spin up a small private side-group for carpools or coffee.'
                        : 'Join a community or start a direct message with a fellow member.'}
                </p>
                {!inboxSearch && inboxTab !== 'Events' && (
                  <button
                    onClick={() => {
                      resetModalState();
                      setShowCreateModal(true);
                    }}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '9px 18px',
                      borderRadius: '999px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    Start a New Chat
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                {inboxItems.map((item, i) => {
                  const rawTitle =
                    item.type === 'dm'
                      ? item.otherUser.name
                      : item.type === 'event_qna'
                        ? item.event.title
                        : item.name;
                  let avatar =
                    item.type === 'dm'
                      ? resolveUserAvatar(item.otherUser)
                      : item.type === 'event_qna'
                        ? item.event.image || item.comm?.image || item.comm?.cover_image || FALLBACK_IMAGES.event
                        : getDefaultAvatar(item.displayTitle);

                  if (item.type === 'channel' && !item.isPrivateGroup && rawTitle.toLowerCase() === 'general') {
                    avatar = item.comm.image || item.comm.cover_image || FALLBACK_IMAGES.community;
                  }

                  let Icon = Hash;
                  let badgeColor = 'var(--brand-accent)';
                  if (item.type === 'dm') {
                    Icon = MessageCircle;
                  } else if (item.type === 'event_qna') {
                    Icon = Calendar;
                  } else if (item.channelType === 'announcement') {
                    Icon = Megaphone;
                  } else if (item.isPrivateGroup) {
                    Icon = Users;
                    badgeColor = 'var(--teal-300)';
                  }

                  const shownMsg = item.previewMsg || item.latestMsg;
                  const msgAuthorId = shownMsg?.authorId || shownMsg?.senderId;
                  const isMe = msgAuthorId === user?.id;
                  const authorName =
                    shownMsg?.authorName || (users || []).find((u) => u.id === msgAuthorId)?.name || 'Member';

                  return (
                    <div
                      key={`${item.type}-${item.id}-${i}`}
                      onClick={() => {
                        if (item.type === 'event_qna') {
                          if (markChatRead) markChatRead('event_qna', item.id);
                          router.push(`/chat/event/${encodeURIComponent(item.id)}`);
                        } else {
                          router.push(
                            item.type === 'dm'
                              ? `/chat/dm/${item.id}`
                              : `/chat/${item.comm.id}/${item.id}`
                          );
                        }
                      }}
                      className="interactive-press"
                      style={{
                        display: 'flex',
                        gap: '14px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        alignItems: 'center',
                        borderBottom:
                          i < inboxItems.length - 1 ? '1px solid var(--hairline-border)' : 'none',
                        background: item.hasUnread
                          ? isLight
                            ? 'rgba(200, 90, 50, 0.04)'
                            : 'rgba(235, 87, 56, 0.05)'
                          : 'transparent',
                      }}
                    >
                      <div
                        onClick={(e) => {
                          if (item.type !== 'dm' && !item.isPrivateGroup && item.comm?.id) {
                            e.stopPropagation();
                            router.push(`/chat?communityId=${item.comm.id}`);
                          }
                        }}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: item.isPrivateGroup
                            ? isLight
                              ? 'rgba(13, 148, 136, 0.12)'
                              : 'rgba(20, 184, 166, 0.18)'
                            : `var(--surface-elevated) url(${avatar}) center/cover no-repeat`,
                          position: 'relative',
                          flexShrink: 0,
                          border: '1px solid var(--hairline-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--teal-300)',
                        }}
                      >
                        {item.isPrivateGroup && <Users size={20} />}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            background: 'var(--surface-elevated)',
                            borderRadius: '50%',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid var(--surface-card)',
                          }}
                        >
                          {item.isPrivateGroup ? (
                            <Lock size={10} color={badgeColor} />
                          ) : (
                            <Icon size={11} color={badgeColor} />
                          )}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Row 1: Full-width Chat Name + Timestamp */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '8px',
                            marginBottom: '2px',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontWeight: item.hasUnread ? 700 : 600,
                              fontSize: '0.96rem',
                              lineHeight: 1.25,
                              color: 'var(--ink-primary)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            {item.displayTitle}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: item.hasUnread ? 'var(--teal-300)' : 'var(--ink-muted)',
                              fontWeight: item.hasUnread ? 700 : 500,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                              paddingTop: '2px',
                            }}
                          >
                            {formatChatTime(shownMsg)}
                          </div>
                        </div>

                        {/* Row 2: Subtitle / Context */}
                        {item.displaySubtitle && (
                          <div
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: 600,
                              color:
                                item.type === 'event_qna'
                                  ? 'var(--brand-accent)'
                                  : item.isPrivateGroup || (item.type === 'dm' && item.metCount > 0)
                                    ? 'var(--teal-300)'
                                    : 'var(--ink-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '3px',
                            }}
                          >
                            {item.displaySubtitle}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.84rem',
                              color: item.matchedMsg
                                ? 'var(--teal-300)'
                                : item.hasUnread
                                  ? 'var(--ink-primary)'
                                  : 'var(--ink-secondary)',
                              fontWeight: item.matchedMsg || item.hasUnread ? 600 : 400,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1,
                            }}
                          >
                            {shownMsg ? (
                              <>
                                {item.matchedMsg && (
                                  <span style={{ fontWeight: 700, marginRight: '4px' }}>Match:</span>
                                )}
                                {item.type !== 'dm' && (
                                  <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>
                                    {isMe ? 'You' : authorName}:{' '}
                                  </span>
                                )}
                                {shownMsg.image ? 'Photo attachment' : shownMsg.text}
                              </>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>
                                No messages yet
                              </span>
                            )}
                          </div>
                          {item.hasUnread && (
                            <span
                              aria-label="Unread messages"
                              style={{
                                width: '9px',
                                height: '9px',
                                borderRadius: '50%',
                                background: 'var(--brand-accent)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(18, 18, 18, 0.72)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '22px',
              padding: '22px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {createMode !== 'menu' && (
                  <button
                    onClick={() => {
                      setCreateMode('menu');
                      setUserSearchTerm('');
                    }}
                    aria-label="Back to chat options"
                    className="interactive-press"
                    style={{
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border)',
                      color: 'var(--ink-primary)',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.18rem',
                    margin: 0,
                    color: 'var(--ink-primary)',
                  }}
                >
                  {createMode === 'menu' && 'Start a Chat'}
                  {createMode === 'dm' && 'Direct Message'}
                  {createMode === 'sidegroup' && 'Private Side-Group'}
                  {createMode === 'channel' && 'Official Club Channel'}
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
                className="interactive-press"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-primary)',
                  cursor: 'pointer',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Menu Mode — 3 Clear, Self-Explanatory Options */}
            {createMode === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Direct Message */}
                <button
                  onClick={() => {
                    setUserSearchTerm('');
                    setCreateMode('dm');
                  }}
                  className="interactive-press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '14px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '14px',
                    color: 'var(--ink-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'var(--brand-accent-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-accent)',
                      flexShrink: 0,
                    }}
                  >
                    <MessageCircle size={19} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', marginBottom: '2px' }}>
                      Direct Message
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.35 }}>
                      Private 1-on-1 chat with someone from your communities or meetups
                    </div>
                  </div>
                </button>

                {/* 2. Private Side-Group (available to all eligible members!) */}
                {sideGroupCommunities.length > 0 && (
                  <button
                    onClick={() => {
                      setNewChannelName('');
                      setSelectedMembers([]);
                      setUserSearchTerm('');
                      setCreateChannelCommunityId(sideGroupCommunities[0]?.id || null);
                      setCreateMode('sidegroup');
                    }}
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '14px',
                      color: 'var(--ink-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: isLight ? 'rgba(13, 148, 136, 0.12)' : 'rgba(20, 184, 166, 0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--teal-300)',
                        flexShrink: 0,
                      }}
                    >
                      <Users size={19} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.94rem',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>Private Side-Group</span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: isLight ? 'rgba(13, 148, 136, 0.12)' : 'rgba(20, 184, 166, 0.18)',
                            color: 'var(--teal-300)',
                          }}
                        >
                          Invite-only
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.35 }}>
                        Spin up a small private chat for a carpool, coffee crew, or walking buddies
                      </div>
                    </div>
                  </button>
                )}

                {/* 3. Official Club Channel (Leaders / Co-Leaders / Admins only) */}
                {manageableCommunities.length > 0 && (
                  <button
                    onClick={() => {
                      setNewChannelName('');
                      setCreateChannelCommunityId(manageableCommunities[0]?.id || null);
                      setCreateMode('channel');
                    }}
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '14px',
                      color: 'var(--ink-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'var(--brand-accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--brand-accent)',
                        flexShrink: 0,
                      }}
                    >
                      <Hash size={19} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.94rem',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>Official Club Channel</span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: 'var(--brand-accent-soft)',
                            color: 'var(--brand-accent)',
                          }}
                        >
                          Leader
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.35 }}>
                        Create an open #topic channel visible to every member in your club
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* DM Contacts Mode */}
            {createMode === 'dm' && (
              <>
                <input
                  type="text"
                  placeholder="Search people you've met or share a club with..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    borderRadius: '12px',
                    color: 'var(--ink-primary)',
                    fontSize: '0.9rem',
                    marginBottom: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {dmCandidates
                    .filter(
                      (u) =>
                        !userSearchTerm ||
                        (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .slice(0, 30)
                    .map((u) => {
                      const metCount = metInPersonMap.get(u.id) || 0;
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setShowCreateModal(false);
                            router.push(`/chat/dm/${u.id}`);
                          }}
                          className="interactive-press"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--hairline-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          <img
                            src={resolveUserAvatar(u)}
                            alt={u.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--ink-primary)',
                                fontSize: '0.92rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.name}
                            </div>
                            {metCount > 0 && (
                              <div
                                style={{
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                  color: 'var(--teal-300)',
                                  marginTop: '1px',
                                }}
                              >
                                ✓ Met in person{metCount > 1 ? ` · ${metCount} meetups` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {dmCandidates.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '24px 12px',
                        color: 'var(--ink-muted)',
                        fontSize: '0.86rem',
                      }}
                    >
                      Join a community or attend a meetup first to message fellow members.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Private Side-Group Creation Mode (Members + Leaders) */}
            {createMode === 'sidegroup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1, minHeight: 0 }}>
                <input
                  type="text"
                  placeholder="Group name (e.g. Sunday Carpool, Coffee Crew)"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  maxLength={60}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    borderRadius: '12px',
                    color: 'var(--ink-primary)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {sideGroupCommunities.length > 1 ? (
                  <select
                    value={activeSideGroupCommunityId || ''}
                    onChange={(e) => {
                      setCreateChannelCommunityId(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--surface-elevated)',
                      color: 'var(--ink-primary)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      colorScheme: isLight ? 'light' : 'dark',
                    }}
                  >
                    {sideGroupCommunities.map((c) => (
                      <option key={c.id} value={c.id}>
                        Community: {c.name}
                      </option>
                    ))}
                  </select>
                ) : sideGroupCommunities[0] ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                    Inside <span style={{ color: 'var(--teal-300)' }}>{sideGroupCommunities[0].name}</span> · Only invited people can see this chat
                  </div>
                ) : null}

                {/* Selected member pills */}
                {selectedMembers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedMembers.map((uid) => {
                      const u = (users || []).find((x) => x.id === uid);
                      return (
                        <button
                          key={uid}
                          type="button"
                          onClick={() => setSelectedMembers((prev) => prev.filter((id) => id !== uid))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 9px',
                            borderRadius: '999px',
                            border: '1px solid rgba(20, 184, 166, 0.35)',
                            background: isLight ? 'rgba(13, 148, 136, 0.10)' : 'rgba(20, 184, 166, 0.16)',
                            color: 'var(--ink-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <span>{u?.name || 'Member'}</span>
                          <X size={12} />
                        </button>
                      );
                    })}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Filter people to invite..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '10px',
                    color: 'var(--ink-primary)',
                    fontSize: '0.86rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '110px',
                    maxHeight: '220px',
                  }}
                >
                  {sideGroupCandidates
                    .filter(
                      (u) =>
                        !userSearchTerm ||
                        (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .slice(0, 30)
                    .map((u) => {
                      const isSelected = selectedMembers.includes(u.id);
                      const metCount = metInPersonMap.get(u.id) || 0;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedMembers((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((id) => id !== u.id)
                                : prev.length < 24
                                  ? [...prev, u.id]
                                  : prev
                            );
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: isSelected
                              ? '1px solid var(--teal-300)'
                              : '1px solid transparent',
                            background: isSelected
                              ? isLight
                                ? 'rgba(13, 148, 136, 0.08)'
                                : 'rgba(20, 184, 166, 0.14)'
                              : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '6px',
                              border: isSelected
                                ? 'none'
                                : '1.5px solid var(--hairline-border-strong)',
                              background: isSelected ? 'var(--teal-300)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && <Check size={13} />}
                          </div>
                          <img
                            src={resolveUserAvatar(u)}
                            alt={u.name}
                            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                color: 'var(--ink-primary)',
                                fontSize: '0.88rem',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.name}
                            </div>
                            {metCount > 0 && (
                              <div style={{ fontSize: '0.71rem', color: 'var(--teal-300)', fontWeight: 600 }}>
                                ✓ Met in person
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  {sideGroupCandidates.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px 10px',
                        color: 'var(--ink-muted)',
                        fontSize: '0.84rem',
                      }}
                    >
                      No other members found in this community yet.
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreatePrivateSideGroup}
                  disabled={!newChannelName.trim() || selectedMembers.length === 0 || isCreating}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    opacity: !newChannelName.trim() || selectedMembers.length === 0 || isCreating ? 0.55 : 1,
                  }}
                >
                  {isCreating
                    ? 'Creating...'
                    : `Create Private Group (${selectedMembers.length + 1} people)`}
                </button>
              </div>
            )}

            {/* Official Club Channel Mode (Leaders / Co-Leaders / Admins Only) */}
            {createMode === 'channel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--ink-secondary)',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    lineHeight: 1.4,
                  }}
                >
                  Official club channels appear under the <strong>Clubs</strong> tab and are open to every member of the selected community.
                </div>

                {manageableCommunities.length > 1 ? (
                  <select
                    value={activeOfficialChannelCommunityId || ''}
                    onChange={(e) => setCreateChannelCommunityId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      background: 'var(--surface-elevated)',
                      color: 'var(--ink-primary)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      colorScheme: isLight ? 'light' : 'dark',
                    }}
                  >
                    {manageableCommunities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : manageableCommunities[0] ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--teal-300)', fontWeight: 600 }}>
                    Club: {manageableCommunities[0].name}
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 14px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    borderRadius: '12px',
                  }}
                >
                  <Hash size={16} color="var(--brand-accent)" />
                  <input
                    type="text"
                    placeholder="Channel name (e.g. beginners, gear-swap, lifts)"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    maxLength={50}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateOfficialChannel}
                  disabled={!newChannelName.trim() || isCreating}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    opacity: !newChannelName.trim() || isCreating ? 0.55 : 1,
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create Club Channel'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
