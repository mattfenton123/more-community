"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  Send,
  Trash2,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useToast } from '../../../../src/components/Toast';
import { getEventPath } from '../../../../src/lib/eventLinks';
import { resolveUserAvatar } from '../../../../src/lib/avatar';
import { cleanLocationName } from '../../../../src/lib/location';
import {
  getCommentAuthorAffiliation,
  isEventHostOrCohostLeader,
} from '../../../../src/lib/eventCollaboration';
import SafeChatText from '../../../../src/components/SafeChatText';

function formatMessageTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const diffMins = Math.floor((Date.now() - dt.getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function EventChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const {
    user,
    users = [],
    events = [],
    communities = [],
    communityMemberships = {},
    eventRsvps = {},
    eventComments = {},
    addEventComment,
    deleteEventComment,
    isLoading,
  } = useAppContext();
  const { markChatRead } = useChat() || {};

  const eventId = params?.eventId ? decodeURIComponent(String(params.eventId)) : '';
  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const bottomRef = useRef(null);

  const event = useMemo(
    () => (events || []).find((e) => String(e.id) === eventId) || null,
    [events, eventId]
  );

  const community = useMemo(
    () => (event ? (communities || []).find((c) => c.id === event.communityId) || null : null),
    [communities, event]
  );

  const comments = useMemo(
    () => (event?.id ? eventComments?.[event.id] || [] : []),
    [event?.id, eventComments]
  );

  const goingUserIds = useMemo(() => {
    if (!event?.id) return [];
    return (eventRsvps?.[event.id] || [])
      .filter((r) => r.status === 'going' || r.status === 'checked_in' || r.checkedIn)
      .map((r) => r.userId)
      .filter(Boolean);
  }, [event?.id, eventRsvps]);

  useEffect(() => {
    if (user?.id && event?.id && markChatRead) {
      markChatRead('event_qna', event.id);
    }
  }, [user?.id, event?.id, comments.length, markChatRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const eventPath = event ? getEventPath(event, events) : '/events';
  const canModerate = event ? isEventHostOrCohostLeader(user, event) : false;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!event?.id) return;
    if (!user?.id) {
      router.push(`/login?redirect=${encodeURIComponent(`/chat/event/${event.id}`)}`);
      return;
    }
    const text = draft.trim();
    if (!text || isPosting) return;

    setIsPosting(true);
    try {
      await addEventComment(event.id, text);
      if (markChatRead) markChatRead('event_qna', event.id);
      setDraft('');
    } catch (err) {
      toast.error('Could not send message', err?.message || 'Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!event?.id) return;
    setDeletingId(commentId);
    try {
      await deleteEventComment(event.id, commentId);
    } catch (err) {
      toast.error('Could not delete message', err?.message || 'Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && !event) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-canvas)',
          color: 'var(--ink-muted)',
        }}
      >
        Loading event chat...
      </div>
    );
  }

  if (!event) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '24px',
          background: 'var(--surface-canvas)',
          color: 'var(--ink-primary)',
          textAlign: 'center',
        }}
      >
        <Calendar size={36} color="var(--brand-accent)" />
        <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Event chat not found</h2>
        <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>
          This event may have been removed or is no longer available.
        </p>
        <button
          type="button"
          onClick={() => router.push('/chat')}
          className="btn btn-primary"
          style={{ padding: '10px 18px', borderRadius: '999px' }}
        >
          Back to Chat
        </button>
      </div>
    );
  }

  const locationLabel = cleanLocationName(event.location || event.location_name || '');

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-canvas)',
        color: 'var(--ink-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Top Chat Header */}
      <header
        style={{
          flexShrink: 0,
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--hairline-border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={() => router.push('/chat')}
            aria-label="Back to chat inbox"
            className="interactive-press"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border)',
              color: 'var(--ink-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {event.image ? (
            <img
              src={event.image}
              alt=""
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid var(--hairline-border)',
              }}
            />
          ) : (
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--brand-accent-soft)',
                color: 'var(--brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calendar size={18} />
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '0.98rem',
                color: 'var(--ink-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {event.title}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span>Event Q&amp;A</span>
              {event.date && <span>· {event.date}</span>}
              {event.time && <span>{event.time}</span>}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(eventPath)}
          className="interactive-press"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 12px',
            borderRadius: '999px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border-strong)',
            color: 'var(--ink-primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          View Event <ExternalLink size={13} />
        </button>
      </header>

      {/* Pinned Compact Event Context Strip */}
      <div
        onClick={() => router.push(eventPath)}
        style={{
          flexShrink: 0,
          padding: '8px 16px',
          background: 'var(--surface-elevated)',
          borderBottom: '1px solid var(--hairline-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '0.76rem',
          color: 'var(--ink-secondary)',
          cursor: 'pointer',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {community?.name && (
            <span style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>{community.name}</span>
          )}
          {locationLabel && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} color="var(--brand-accent)" /> {locationLabel}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} color="var(--brand-accent)" /> {goingUserIds.length} going
          </span>
        </div>
        <span style={{ color: 'var(--brand-accent)', fontWeight: 600 }}>Event details →</span>
      </div>

      {/* Scrollable Messages Area */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px 16px',
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {comments.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              maxWidth: '340px',
              padding: '28px 20px',
              borderRadius: '18px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border)',
            }}
          >
            <MessageSquare
              size={28}
              color="var(--brand-accent)"
              style={{ marginBottom: '10px' }}
            />
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.02rem',
                color: 'var(--ink-primary)',
                marginBottom: '6px',
              }}
            >
              Start the event conversation
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.84rem',
                color: 'var(--ink-secondary)',
                lineHeight: 1.5,
              }}
            >
              Ask about parking, kit, meeting points, or say hello to others attending. Messages
              stay synced with the event page.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const authorId = comment.authorId || comment.author_id;
            const authorUser = users.find((u) => u.id === authorId);
            const authorName = authorUser?.name || comment.authorName || 'Member';
            const avatar = resolveUserAvatar(authorUser || { name: authorName });
            const isMe = Boolean(user?.id && authorId === user.id);
            const isGoing = goingUserIds.includes(authorId);
            const affiliation = getCommentAuthorAffiliation({
              authorId,
              event,
              communities,
              communityMemberships,
            });
            const canDelete = isMe || canModerate || Boolean(user?.isAdmin);

            return (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '10px',
                }}
              >
                {!isMe && (
                  <img
                    src={avatar}
                    alt={authorName}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid var(--hairline-border)',
                    }}
                  />
                )}
                <div
                  style={{
                    maxWidth: '78%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                      fontSize: '0.72rem',
                      color: 'var(--ink-muted)',
                      padding: '0 4px',
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--ink-secondary)' }}>
                      {isMe ? 'You' : authorName}
                    </span>
                    {affiliation?.label && (
                      <span
                        style={{
                          padding: '1px 7px',
                          borderRadius: '999px',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          background: 'var(--brand-accent-soft)',
                          color: 'var(--brand-accent)',
                        }}
                      >
                        {affiliation.label}
                      </span>
                    )}
                    {isGoing && !affiliation?.isLeader && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: '#16a34a',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={11} /> Going
                      </span>
                    )}
                    <span>{formatMessageTime(comment.createdAt || comment.created_at)}</span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        title="Delete message"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ink-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'var(--brand-accent)' : 'var(--surface-card)',
                      color: isMe ? '#FFFFFF' : 'var(--ink-primary)',
                      border: isMe ? 'none' : '1px solid var(--hairline-border)',
                      fontSize: '0.9rem',
                      lineHeight: 1.48,
                      wordBreak: 'break-word',
                    }}
                  >
                    <SafeChatText text={comment.text || comment.content || ''} />
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      {/* Sticky Bottom Composer */}
      <form
        onSubmit={handleSend}
        style={{
          flexShrink: 0,
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--hairline-border)',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              user?.id ? 'Message the event chat...' : 'Sign in to join the event chat...'
            }
            disabled={isPosting}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '999px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: 'var(--ink-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isPosting || (user?.id && !draft.trim())}
            className="interactive-press"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--brand-accent)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: isPosting || (user?.id && !draft.trim()) ? 0.55 : 1,
              flexShrink: 0,
            }}
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
