"use client";
import { useState, useRef, useEffect } from 'react';
import {
  Send,
  ChevronLeft,
  Image as ImageIcon,
  X,
  MessageCircle,
  Plus,
  Smile,
  Shield,
} from 'lucide-react';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import SafeChatText from '../../../../src/components/SafeChatText';
import LinkSafetyModal from '../../../../src/components/LinkSafetyModal';
import ChatTrustModal from '../../../../src/components/ChatTrustModal';
import { calculateUserTrustLevel, checkRateLimit } from '../../../../src/lib/chatSecurity';
import { resolveUserAvatar } from '../../../../src/lib/avatar';
import { useToast } from '../../../../src/components/Toast';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const QUICK_EMOJIS = ['😊', '❤️', '🙌', '🔥', '👍', '🎉', '😂', '✨', '👏', '💯'];

export default function DirectMessage() {
  const { id: targetUserId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [threadInputText, setThreadInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [reactionMsgId, setReactionMsgId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showThreadEmojiPicker, setShowThreadEmojiPicker] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [selectedLinkAnalysis, setSelectedLinkAnalysis] = useState(null);
  const [showTrustModal, setShowTrustModal] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    user,
    users,
    uploadImage,
    communityMemberships = {},
    events = [],
    eventRsvps = {},
    theme,
  } = useAppContext();
  const { directMessages, sendDirectMessage, reactToMessage, markChatRead } = useChat();

  const isLight = theme === 'light';
  const pickerTheme = isLight ? 'light' : 'dark';

  const targetUser = (users || []).find((u) => u.id === targetUserId);
  const flatEventRsvps = Array.isArray(eventRsvps)
    ? eventRsvps
    : Object.values(eventRsvps || {})
        .flat()
        .filter(Boolean);
  const trustLevel = calculateUserTrustLevel(targetUser, communityMemberships, events, flatEventRsvps);

  const activeMessages = (directMessages || [])
    .filter(
      (m) =>
        (m.senderId === user?.id && m.receiverId === targetUserId) ||
        (m.senderId === targetUserId && m.receiverId === user?.id)
    )
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  const mainMessages = activeMessages.filter((m) => !m.parentId);

  useEffect(() => {
    if (user?.id && targetUserId) markChatRead(null, targetUserId);
  }, [user?.id, targetUserId, activeMessages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mainMessages.length]);

  const handleSend = async () => {
    if (!inputText.trim() && !imageFile) return;
    const rateCheck = checkRateLimit(user?.id);
    if (!rateCheck.allowed) {
      toast.error('Slow down a moment', rateCheck.message || 'Please wait a few seconds before sending again.');
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      setIsUploading(true);
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (e) {
        console.error(e);
        toast.error('Upload failed', 'Could not upload attachment.');
      }
      setIsUploading(false);
      setImageFile(null);
    }
    const text = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);
    await sendDirectMessage(targetUserId, text, imageUrl);
  };

  const onEmojiClick = (emojiObject) => {
    if (reactionMsgId) {
      reactToMessage(reactionMsgId, emojiObject.emoji, true);
      setReactionMsgId(null);
    }
  };

  const handleInputEmojiClick = (emojiObject) => {
    setInputText((prev) => prev + emojiObject.emoji);
  };

  const handleThreadEmojiClick = (emojiObject) => {
    setThreadInputText((prev) => prev + emojiObject.emoji);
  };

  if (!targetUser) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--surface-canvas)',
          padding: '60px 20px',
          color: 'var(--ink-secondary)',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '16px', fontSize: '1rem' }}>Member not found</div>
        <button
          onClick={() => router.push('/chat')}
          className="btn btn-primary"
          style={{ borderRadius: '99px', color: '#FFFFFF' }}
        >
          Back to Messages
        </button>
      </div>
    );
  }

  const canSend = Boolean(!isUploading && (inputText.trim() || imageFile));

  return (
    <div
      className="view-chat chat-room-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-canvas)',
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '960px',
          margin: '0 auto',
          overflow: 'hidden',
          borderLeft: '1px solid var(--hairline-border)',
          borderRight: '1px solid var(--hairline-border)',
          background: 'var(--surface-canvas)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid var(--hairline-border)',
            background: 'var(--surface-card)',
          }}
        >
          <button
            onClick={() => router.push('/chat')}
            aria-label="Back to messages"
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
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <img
            src={resolveUserAvatar(targetUser)}
            alt={targetUser.name}
            onClick={() => router.push(`/profile/${targetUserId}`)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                onClick={() => router.push(`/profile/${targetUserId}`)}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  fontSize: '0.98rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                }}
              >
                {targetUser.name}
              </div>
              {trustLevel?.badge && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    background: 'var(--brand-accent-soft)',
                    color: 'var(--teal-300)',
                    border: '1px solid rgba(235, 87, 56, 0.28)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {trustLevel.badge}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: '0.73rem',
                color: 'var(--ink-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {trustLevel.description}
            </div>
          </div>

          <button
            onClick={() => setShowTrustModal(true)}
            className="interactive-press"
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              color: 'var(--ink-secondary)',
              cursor: 'pointer',
              borderRadius: '999px',
              padding: '6px 11px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
            }}
            title="Safety, Report, or Block"
          >
            <Shield size={14} color="var(--brand-accent)" />
            <span>Safety</span>
          </button>
        </div>

        {/* Shield Harbor Safety Notice */}
        <div
          style={{
            background: 'var(--surface-elevated)',
            borderBottom: '1px solid var(--hairline-border)',
            padding: '9px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.76rem',
            color: 'var(--ink-secondary)',
          }}
        >
          <Shield size={15} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--ink-primary)' }}>Shield Harbor:</strong> Keep all ticket
            payments and bookings on More Community. Never send money directly.
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column', minWidth: 0 }}>
            {/* Messages */}
            <div
              onClick={() => setSelectedMsgId(null)}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {mainMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '44px 20px', color: 'var(--ink-muted)' }}>
                  <div style={{ fontSize: '0.92rem' }}>Say hello to {targetUser.name}!</div>
                </div>
              )}

              {mainMessages.map((msg, i) => {
                const isOwn = msg.senderId === user?.id;
                const author = isOwn ? user : targetUser;
                const isConsecutive = i > 0 && mainMessages[i - 1].senderId === msg.senderId;
                const isLastConsecutive =
                  i === mainMessages.length - 1 || mainMessages[i + 1].senderId !== msg.senderId;

                const reactionMap =
                  msg.reactions?.reduce((acc, r) => {
                    acc[r.emoji] = acc[r.emoji] || [];
                    acc[r.emoji].push(r.user_id);
                    return acc;
                  }, {}) || {};

                const showActions = hoveredMsgId === msg.id || selectedMsgId === msg.id;

                return (
                  <div
                    key={msg.id || i}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      marginTop: isConsecutive ? '2px' : '10px',
                    }}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMsgId((prev) => (prev === msg.id ? null : msg.id));
                    }}
                  >
                    {!isOwn && (
                      <img
                        src={resolveUserAvatar(author)}
                        alt=""
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          opacity: isLastConsecutive ? 1 : 0,
                        }}
                      />
                    )}

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isOwn
                            ? `16px ${isConsecutive ? '4px' : '16px'} ${isLastConsecutive ? '16px' : '4px'} 16px`
                            : `${isConsecutive ? '4px' : '16px'} 16px 16px ${isLastConsecutive ? '16px' : '4px'}`,
                          background: isOwn ? 'var(--brand-accent)' : 'var(--surface-card)',
                          border: isOwn ? 'none' : '1px solid var(--hairline-border-strong)',
                          color: isOwn ? '#FFFFFF' : 'var(--ink-primary)',
                          fontSize: '0.92rem',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                          position: 'relative',
                        }}
                      >
                        {showActions && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '-34px',
                              right: isOwn ? '4px' : 'auto',
                              left: isOwn ? 'auto' : '4px',
                              background: 'var(--surface-card)',
                              border: '1px solid var(--hairline-border-strong)',
                              borderRadius: '99px',
                              padding: '3px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              zIndex: 15,
                              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            {['❤️', '👍', '😂', '🔥', '🎉'].map((em) => (
                              <button
                                key={em}
                                onClick={() => {
                                  reactToMessage(msg.id, em, true);
                                  setSelectedMsgId(null);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.95rem',
                                  padding: '2px 4px',
                                }}
                              >
                                {em}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setActiveThreadId(msg.id);
                                setSelectedMsgId(null);
                              }}
                              aria-label="Reply in thread"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setReactionMsgId(reactionMsgId === msg.id ? null : msg.id);
                                setSelectedMsgId(null);
                              }}
                              aria-label="More reactions"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'var(--ink-secondary)',
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}

                        {msg.image &&
                          (msg.image.match(/\.(mp4|mov|webm)(\?.*)?$/i) ? (
                            <video
                              src={msg.image}
                              controls
                              style={{
                                maxWidth: '100%',
                                borderRadius: '8px',
                                marginBottom: msg.text ? '8px' : 0,
                                background: '#000000',
                              }}
                            />
                          ) : (
                            <img
                              src={msg.image}
                              alt=""
                              style={{
                                maxWidth: '100%',
                                borderRadius: '8px',
                                marginBottom: msg.text ? '8px' : 0,
                                display: 'block',
                              }}
                            />
                          ))}
                        {msg.text && (
                          <SafeChatText
                            text={msg.text}
                            onLinkClick={setSelectedLinkAnalysis}
                            isOwn={isOwn}
                          />
                        )}
                      </div>

                      {Object.keys(reactionMap).length > 0 && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '4px',
                            justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          }}
                        >
                          {Object.entries(reactionMap).map(([emoji, rUsers]) => {
                            const hasReacted = rUsers.includes(user?.id);
                            return (
                              <button
                                key={emoji}
                                onClick={() => reactToMessage(msg.id, emoji, true)}
                                className="interactive-press"
                                style={{
                                  background: hasReacted
                                    ? 'var(--brand-accent-soft)'
                                    : 'var(--surface-card)',
                                  border: hasReacted
                                    ? '1px solid var(--brand-accent)'
                                    : '1px solid var(--hairline-border-strong)',
                                  borderRadius: '99px',
                                  padding: '2px 7px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: hasReacted ? 'var(--teal-300)' : 'var(--ink-secondary)',
                                  cursor: 'pointer',
                                }}
                              >
                                <span>{emoji}</span>
                                <span>{rUsers.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {(() => {
                        const replyCount = activeMessages.filter((m) => m.parentId === msg.id).length;
                        if (replyCount === 0) return null;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveThreadId(msg.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              marginTop: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--teal-300)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <MessageCircle size={12} /> {replyCount} repl
                            {replyCount === 1 ? 'y' : 'ies'}
                          </button>
                        );
                      })()}

                      <div
                        style={{
                          fontSize: '0.66rem',
                          color: 'var(--ink-muted)',
                          marginTop: '3px',
                          textAlign: isOwn ? 'right' : 'left',
                        }}
                      >
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Theme-Aware Quick Emoji Bar */}
            <div
              className="hide-scrollbar"
              style={{
                padding: '6px 14px',
                background: 'var(--surface-elevated)',
                borderTop: '1px solid var(--hairline-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
              }}
            >
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--ink-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginRight: '4px',
                }}
              >
                Quick
              </span>
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setInputText((prev) => prev + em)}
                  className="interactive-press"
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    padding: '3px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`Insert ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Composer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--hairline-border)',
                background: 'var(--surface-card)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
              }}
            >
              {showEmojiPicker && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '12px',
                    zIndex: 100,
                    maxWidth: '340px',
                    width: 'calc(100% - 24px)',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--hairline-border-strong)',
                    marginBottom: '8px',
                    background: 'var(--surface-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--surface-card)',
                      padding: '8px 14px',
                      borderBottom: '1px solid var(--hairline-border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--ink-primary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Smile size={15} color="var(--brand-accent)" /> Emojis
                    </span>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      aria-label="Close emojis"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <EmojiPicker
                    onEmojiClick={handleInputEmojiClick}
                    theme={pickerTheme}
                    width="100%"
                    height={320}
                    searchDisabled={false}
                    skinTonesDisabled
                  />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach media"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: 'var(--ink-secondary)',
                  display: 'flex',
                }}
                title="Attach media"
              >
                <ImageIcon size={20} />
              </button>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label="Add emoji"
                className="interactive-press"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: showEmojiPicker ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Add emoji"
              >
                <Smile size={20} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Message ${targetUser.name}...`}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid var(--hairline-border-strong)',
                  background: 'var(--surface-elevated)',
                  color: 'var(--ink-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  minWidth: 0,
                }}
              />

              {imageFile && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'var(--brand-accent-soft)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    color: 'var(--teal-300)',
                    fontWeight: 600,
                  }}
                >
                  <span>{imageFile.name.substring(0, 10)}</span>
                  <button
                    onClick={() => setImageFile(null)}
                    aria-label="Remove attachment"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--teal-300)' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                className="interactive-press"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: canSend ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                  border: canSend ? 'none' : '1px solid var(--hairline-border)',
                  color: canSend ? '#FFFFFF' : 'var(--ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canSend ? 'pointer' : 'default',
                  flexShrink: 0,
                }}
              >
                <Send size={17} />
              </button>
            </div>
          </div>

          {/* Responsive Thread Drawer */}
          {activeThreadId && (
            <div className="chat-thread-drawer">
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--hairline-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1rem',
                    color: 'var(--ink-primary)',
                  }}
                >
                  Thread
                </h3>
                <button
                  onClick={() => setActiveThreadId(null)}
                  aria-label="Close thread"
                  className="interactive-press"
                  style={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border)',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {(() => {
                  const threadParent = activeMessages.find((m) => m.id === activeThreadId);
                  const threadReplies = activeMessages.filter((m) => m.parentId === activeThreadId);
                  if (!threadParent) return null;
                  const authorObj = (users || []).find(
                    (u) => u.id === (threadParent.senderId || threadParent.authorId)
                  ) || { name: 'Member' };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          paddingBottom: '14px',
                          borderBottom: '1px solid var(--hairline-border)',
                        }}
                      >
                        <img
                          src={resolveUserAvatar(authorObj)}
                          alt={authorObj.name}
                          style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink-primary)' }}>
                              {authorObj.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>
                              {threadParent.createdAt
                                ? new Date(threadParent.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              marginTop: '4px',
                              color: 'var(--ink-secondary)',
                              lineHeight: 1.45,
                            }}
                          >
                            {threadParent.text}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {threadReplies.length} {threadReplies.length === 1 ? 'Reply' : 'Replies'}
                      </div>

                      {threadReplies.map((reply) => {
                        const repAuth = (users || []).find(
                          (u) => u.id === (reply.senderId || reply.authorId)
                        ) || { name: 'Member' };
                        return (
                          <div key={reply.id} style={{ display: 'flex', gap: '10px' }}>
                            <img
                              src={resolveUserAvatar(repAuth)}
                              alt={repAuth.name}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--ink-primary)' }}>
                                  {repAuth.name}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>
                                  {reply.createdAt
                                    ? new Date(reply.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  marginTop: '3px',
                                  color: 'var(--ink-secondary)',
                                  lineHeight: 1.4,
                                }}
                              >
                                {reply.text}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderTop: '1px solid var(--hairline-border)',
                  background: 'var(--surface-card)',
                  position: 'relative',
                }}
              >
                {showThreadEmojiPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: '14px',
                      zIndex: 100,
                      maxWidth: '300px',
                      width: 'calc(100% - 28px)',
                      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid var(--hairline-border-strong)',
                      marginBottom: '8px',
                      background: 'var(--surface-card)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderBottom: '1px solid var(--hairline-border)',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-primary)', fontWeight: 600 }}>
                        Thread Emojis
                      </span>
                      <button
                        onClick={() => setShowThreadEmojiPicker(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <EmojiPicker
                      onEmojiClick={handleThreadEmojiClick}
                      theme={pickerTheme}
                      width="100%"
                      height={280}
                      searchDisabled={false}
                      skinTonesDisabled
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowThreadEmojiPicker(!showThreadEmojiPicker)}
                    aria-label="Insert emoji"
                    className="interactive-press"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: showThreadEmojiPicker ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                    }}
                  >
                    <Smile size={18} />
                  </button>
                  <input
                    type="text"
                    value={threadInputText}
                    onChange={(e) => setThreadInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && threadInputText.trim()) {
                        sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
                        setThreadInputText('');
                        setShowThreadEmojiPicker(false);
                      }
                    }}
                    placeholder="Reply in thread..."
                    style={{
                      flex: 1,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '999px',
                      padding: '9px 14px',
                      color: 'var(--ink-primary)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                  <button
                    disabled={!threadInputText.trim()}
                    onClick={() => {
                      if (threadInputText.trim()) {
                        sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
                        setThreadInputText('');
                        setShowThreadEmojiPicker(false);
                      }
                    }}
                    aria-label="Send thread reply"
                    className="interactive-press"
                    style={{
                      background: threadInputText.trim() ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                      border: threadInputText.trim() ? 'none' : '1px solid var(--hairline-border)',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: threadInputText.trim() ? '#FFFFFF' : 'var(--ink-muted)',
                      cursor: threadInputText.trim() ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Emoji Modal for Reactions */}
      {reactionMsgId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 18, 18, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setReactionMsgId(null)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <button
              onClick={() => setReactionMsgId(null)}
              aria-label="Close emoji picker"
              className="interactive-press"
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border-strong)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10000,
                color: 'var(--ink-primary)',
              }}
            >
              <X size={15} />
            </button>
            <EmojiPicker onEmojiClick={onEmojiClick} theme={pickerTheme} width={320} height={420} />
          </div>
        </div>
      )}

      <LinkSafetyModal
        isOpen={Boolean(selectedLinkAnalysis)}
        onClose={() => setSelectedLinkAnalysis(null)}
        linkAnalysis={selectedLinkAnalysis}
      />

      <ChatTrustModal
        isOpen={showTrustModal}
        onClose={() => setShowTrustModal(false)}
        targetUser={targetUser}
        trustLevel={trustLevel}
      />
    </div>
  );
}
