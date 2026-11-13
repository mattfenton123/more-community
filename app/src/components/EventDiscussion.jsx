"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { getEventPath } from '../lib/eventLinks';
import { getCommentAuthorAffiliation, isEventHostOrCohostLeader } from '../lib/eventCollaboration';

const BADGE_STYLES = {
  host: {
    background: 'rgba(20, 184, 166, 0.16)',
    border: '1px solid rgba(45, 212, 191, 0.4)',
    color: '#5eead4',
  },
  cohost: {
    background: 'rgba(56, 189, 248, 0.16)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    color: '#7dd3fc',
  },
  community: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    color: '#cbd5e1',
  },
  partner: {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#bae6fd',
  },
};

function formatCommentTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  const diffMins = Math.floor((Date.now() - dt.getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function EventDiscussion({
  event,
  community,
  partnerCommunities = [],
  user,
  goingUserIds = [],
}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    events,
    communities,
    communityMemberships,
    eventComments,
    addEventComment,
    deleteEventComment,
  } = useAppContext();

  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  if (!event?.id) return null;

  const comments = eventComments?.[event.id] || [];
  const canModerate = isEventHostOrCohostLeader(user, event);
  const allCommunityNames = [community?.name, ...partnerCommunities.map(p => p.name)].filter(Boolean);
  const eventPath = getEventPath(event, events);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      router.push(`/login?redirect=${encodeURIComponent(`${eventPath}#discussion`)}`);
      return;
    }
    const text = draft.trim();
    if (!text) return;

    setIsPosting(true);
    try {
      await addEventComment(event.id, text);
      setDraft('');
    } catch (err) {
      toast.error('Could not post message', err?.message || 'Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      await deleteEventComment(event.id, commentId);
    } catch (err) {
      toast.error('Could not delete message', err?.message || 'Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      id="discussion"
      style={{
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: '18px',
        padding: '20px',
        marginBottom: '28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '1.12rem',
            fontWeight: 700,
            color: 'var(--white)',
            fontFamily: 'var(--font-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={18} color="var(--teal-400)" />
          Event Discussion &amp; Q&amp;A
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '99px',
              background: 'rgba(20, 184, 166, 0.14)',
              color: '#5eead4',
            }}
          >
            {comments.length}
          </span>
        </h3>
        {partnerCommunities.length > 0 && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '99px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              color: '#7dd3fc',
            }}
          >
            Shared across all co-hosts
          </span>
        )}
      </div>

      <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--slate-400)', lineHeight: 1.45 }}>
        {partnerCommunities.length > 0
          ? `One shared thread for members from ${allCommunityNames.join(' & ')} — ask questions, coordinate meet-up spots, or say hello.`
          : 'Ask about the pace, kit, dog-friendliness, or meet-up point before the day.'}
      </p>

      {comments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {comments.map(comment => {
            const { badgeLabel, badgeTone, isGoing } = getCommentAuthorAffiliation({
              authorId: comment.authorId,
              event,
              communities,
              communityMemberships,
              goingUserIds,
            });
            const badgeStyle = badgeTone ? BADGE_STYLES[badgeTone] : null;
            const canDelete = user?.id && (user.id === comment.authorId || canModerate);

            return (
              <div
                key={comment.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <img
                  src={comment.authorAvatar}
                  alt={comment.authorName}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--white)' }}>
                      {comment.authorName}
                    </span>
                    {badgeLabel && badgeStyle && (
                      <span
                        style={{
                          ...badgeStyle,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 7px',
                          borderRadius: '99px',
                        }}
                      >
                        {badgeLabel}
                      </span>
                    )}
                    {isGoing && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#4ade80',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <CheckCircle2 size={11} /> Going
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginLeft: 'auto' }}>
                      {formatCommentTime(comment.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Delete comment"
                        disabled={deletingId === comment.id}
                        onClick={() => handleDelete(comment.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--slate-400)',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--slate-200)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {comment.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: 'var(--slate-400)',
            fontSize: '0.84rem',
            marginBottom: '14px',
          }}
        >
          No messages yet — start the conversation for anyone joining from either community.
        </div>
      )}

      {user?.id ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Ask a question, share kit tips, or say hi..."
            style={{
              flex: '1 1 240px',
              minHeight: '46px',
              maxHeight: '140px',
              padding: '11px 14px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--white)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isPosting || !draft.trim()}
            className="interactive-press"
            style={{
              padding: '11px 16px',
              borderRadius: '12px',
              border: 'none',
              background: isPosting || !draft.trim() ? 'rgba(20, 184, 166, 0.25)' : 'var(--teal-500)',
              color: isPosting || !draft.trim() ? '#94a3b8' : '#0f172a',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: isPosting || !draft.trim() ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '44px',
            }}
          >
            <Send size={15} />
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => router.push(`/login?redirect=${encodeURIComponent(`${eventPath}#discussion`)}`)}
          className="interactive-press"
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--teal-300)',
            fontWeight: 700,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Lock size={15} /> Sign in to ask a question or join the discussion
        </button>
      )}
    </section>
  );
}
