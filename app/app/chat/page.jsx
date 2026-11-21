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
} from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { FALLBACK_IMAGES } from '../../src/lib/constants';
import { useToast } from '../../src/components/Toast';
import { resolveUserAvatar, getDefaultAvatar } from '../../src/lib/avatar';
import { formatChatTime, getManageableCommunities } from '../../src/lib/chatUtils';
import { getEventPath } from '../../src/lib/eventLinks';
import { isEventUpcoming } from '../../src/lib/calendar';

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
  const [inboxTab, setInboxTab] = useState('All'); // 'All' | 'Communities' | 'Direct'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState('menu'); // 'menu', 'dm', 'group'
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

  // Build unified inbox items
  const inboxItems = useMemo(() => {
    if (!user?.id) return [];

    let items = [];

    myCommunities.forEach((c) => {
      const communityChannels = (channels || []).filter(
        (ch) => ch.community_id === c.id || ch.communityId === c.id
      );
      if (communityChannels.length === 0) {
        items.push({ type: 'channel', channelType: 'text', comm: c, name: 'general', id: 'general' });
      } else {
        communityChannels.forEach((ch) => {
          if (
            ch.member_ids &&
            ch.member_ids.length > 0 &&
            !ch.member_ids.includes(user?.id) &&
            !user?.ledCommunities?.includes(c.id)
          ) {
            return;
          }
          if (ch.type === 'announcement') return;
          items.push({
            type: 'channel',
            channelType: ch.type || 'text',
            comm: c,
            name: ch.name,
            id: ch.id,
            memberIds: ch.member_ids,
          });
        });
      }
    });

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

    // Event Discussion / Q&A threads for events user leads, is Going to, or commented on
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

    const enriched = items
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
          item.type === 'channel' && rawTitle.toLowerCase() === 'general' ? item.comm.name : rawTitle;
        const displaySubtitle =
          item.type === 'event_qna'
            ? `Event Q&A${item.event?.date ? ` · ${item.event.date}` : ''}`
            : item.type === 'channel'
              ? rawTitle.toLowerCase() === 'general'
                ? 'General Chat'
                : item.comm.name
              : null;

        const previewMsg = matchedMsg || latestMsg;

        return {
          ...item,
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
        if (inboxTab === 'All' && item.type === 'event_qna' && !item.hasComments && !q) return false;
        if (inboxTab === 'Communities' && item.type !== 'channel') return false;
        if (inboxTab === 'Events' && item.type !== 'event_qna') return false;
        if (inboxTab === 'Direct' && item.type !== 'dm') return false;
        if (q) {
          const inTitle = (item.displayTitle || '').toLowerCase().includes(q);
          const inSub = (item.displaySubtitle || '').toLowerCase().includes(q);
          const inAnyMsg = Boolean(item.matchedMsg);
          return inTitle || inSub || inAnyMsg;
        }
        return true;
      })
      .sort((a, b) => b.sortTime - a.sortTime);

    return enriched;
  }, [
    user,
    myCommunities,
    channels,
    directMessages,
    users,
    messages,
    chatReadReceipts,
    communityFilterId,
    inboxTab,
    inboxSearch,
    remoteSearchHits,
    events,
    eventRsvps,
    eventComments,
    communities,
  ]);

  const sharedCommunityMembers = useMemo(() => {
    const sharedUserIds = new Set();
    (user?.joinedCommunities || []).forEach((communityId) => {
      const members = communityMemberships?.[communityId] || [];
      members.forEach((m) => sharedUserIds.add(m.userId || m.user_id));
    });
    return (users || []).filter((u) => u.id !== user?.id && sharedUserIds.has(u.id));
  }, [user, communityMemberships, users]);

  const handleCreateChannel = async (type = 'text', members = null) => {
    if (!newChannelName.trim() || isCreating) return;
    const targetCommunity = createChannelCommunityId || manageableCommunities[0]?.id;
    if (!targetCommunity) {
      toast.error('Leader access required', 'Only community leaders can create group chats.');
      return;
    }

    setIsCreating(true);
    try {
      await createChannel(targetCommunity, newChannelName.trim(), type, members);
      toast.success('Chat created!', `${newChannelName.trim()} is now live`);
      setNewChannelName('');
      setSelectedMembers([]);
      setShowCreateModal(false);
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
                  setCreateMode('menu');
                  setUserSearchTerm('');
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

            {/* Search & Filter Row */}
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
                {['All', 'Communities', 'Events', 'Direct'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInboxTab(tab)}
                    className={inboxTab === tab ? 'active' : ''}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            {inboxItems.length === 0 ? (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px dashed var(--hairline-border-strong)',
                  borderRadius: '18px',
                  padding: '48px 20px',
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
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {isSearchingRemote
                    ? 'Searching message history...'
                    : inboxSearch
                      ? 'No matching chats'
                      : 'No conversations yet'}
                </div>
                <p style={{ margin: '0 auto 16px', fontSize: '0.86rem', maxWidth: '320px' }}>
                  {inboxSearch
                    ? 'Try a different name or keyword.'
                    : 'Join a community or start a direct message with a fellow member.'}
                </p>
                {!inboxSearch && (
                  <button
                    onClick={() => {
                      setCreateMode('menu');
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

                  if (item.type === 'channel' && rawTitle.toLowerCase() === 'general') {
                    avatar = item.comm.image || item.comm.cover_image || FALLBACK_IMAGES.community;
                  }

                  let Icon = Hash;
                  if (item.type === 'dm') Icon = MessageCircle;
                  else if (item.type === 'event_qna') Icon = Calendar;
                  else if (item.channelType === 'announcement') Icon = Megaphone;
                  else if (item.channelType === 'group' || item.memberIds) Icon = Lock;

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
                          router.push(`${getEventPath(item.event, events)}#discussion`);
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
                          if (item.type !== 'dm' && item.comm?.id) {
                            e.stopPropagation();
                            router.push(`/chat?communityId=${item.comm.id}`);
                          }
                        }}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: `var(--surface-elevated) url(${avatar}) center/cover no-repeat`,
                          position: 'relative',
                          flexShrink: 0,
                          border: '1px solid var(--hairline-border)',
                        }}
                      >
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
                          <Icon size={11} color="var(--brand-accent)" />
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: '8px',
                            marginBottom: '3px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: item.hasUnread ? 700 : 600,
                                fontSize: '0.98rem',
                                color: 'var(--ink-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {item.displayTitle}
                            </div>
                            {item.displaySubtitle && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: 'var(--ink-muted)',
                                  background: 'var(--surface-elevated)',
                                  border: '1px solid var(--hairline-border)',
                                  padding: '1px 7px',
                                  borderRadius: '99px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '140px',
                                  flexShrink: 0,
                                }}
                              >
                                {item.displaySubtitle}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '0.73rem',
                              color: item.hasUnread ? 'var(--teal-300)' : 'var(--ink-muted)',
                              fontWeight: item.hasUnread ? 700 : 500,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {formatChatTime(shownMsg)}
                          </div>
                        </div>

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
              maxHeight: '82vh',
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
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {createMode !== 'menu' && (
                  <button
                    onClick={() => setCreateMode('menu')}
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
                    fontSize: '1.2rem',
                    margin: 0,
                    color: 'var(--ink-primary)',
                  }}
                >
                  {createMode === 'menu' && 'New Chat'}
                  {createMode === 'dm' && 'New Direct Message'}
                  {createMode === 'group' && 'New Group Chat'}
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

            {/* Menu Mode */}
            {createMode === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setCreateMode('dm')}
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
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
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
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>New Direct Message</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      1-on-1 private chat with a fellow member
                    </div>
                  </div>
                </button>

                {manageableCommunities.length > 0 && (
                  <button
                    onClick={() => setCreateMode('group')}
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
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--brand-accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--brand-accent)',
                        flexShrink: 0,
                      }}
                    >
                      <Users size={19} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>New Group Chat</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                        Create a topic or private channel for your community
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
                  placeholder="Search members in your communities..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    borderRadius: '12px',
                    color: 'var(--ink-primary)',
                    fontSize: '0.92rem',
                    marginBottom: '14px',
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
                  {sharedCommunityMembers
                    .filter(
                      (u) =>
                        !userSearchTerm ||
                        (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .slice(0, 25)
                    .map((u) => (
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
                          <div style={{ fontWeight: 600, color: 'var(--ink-primary)', fontSize: '0.92rem' }}>
                            {u.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  {sharedCommunityMembers.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '24px 12px',
                        color: 'var(--ink-muted)',
                        fontSize: '0.86rem',
                      }}
                    >
                      Join a community first to message fellow members.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Group Mode */}
            {createMode === 'group' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
                <input
                  type="text"
                  placeholder="Group Name (e.g. Weekend Carpool)"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
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

                {manageableCommunities.length > 1 ? (
                  <select
                    value={createChannelCommunityId || manageableCommunities[0]?.id}
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
                    Community: {manageableCommunities[0].name}
                  </div>
                ) : null}

                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
                  Select Members (Optional — leave unchecked for open channel)
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '100px',
                    maxHeight: '220px',
                  }}
                >
                  {sharedCommunityMembers.slice(0, 15).map((u) => (
                    <label
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMembers([...selectedMembers, u.id]);
                          else setSelectedMembers(selectedMembers.filter((id) => id !== u.id));
                        }}
                      />
                      <img
                        src={resolveUserAvatar(u)}
                        alt={u.name}
                        style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ color: 'var(--ink-primary)', fontSize: '0.88rem' }}>{u.name}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() =>
                    handleCreateChannel(
                      'group',
                      selectedMembers.length > 0 ? [user?.id, ...selectedMembers] : null
                    )
                  }
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
                  {isCreating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
