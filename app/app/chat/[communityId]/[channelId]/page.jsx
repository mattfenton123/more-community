"use client";
import { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageCircle,
  Plus,
  Image as ImageIcon,
  X,
  Smile,
  Megaphone,
  ExternalLink,
} from 'lucide-react';
import AppHeader from '../../../../src/components/AppHeader';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { SkeletonChatBubble } from '../../../../src/components/SkeletonCard';
import { resolveUserAvatar } from '../../../../src/lib/avatar';
import { formatChatTime, isCommunityChatLeader, canManageCommunityChat } from '../../../../src/lib/chatUtils';
import { useToast } from '../../../../src/components/Toast';
import dynamic from 'next/dynamic';
import SafeChatText from '../../../../src/components/SafeChatText';
import LinkSafetyModal from '../../../../src/components/LinkSafetyModal';
import { checkRateLimit } from '../../../../src/lib/chatSecurity';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function Chat() {
  const { communityId, channelId, targetUserId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [threadInputText, setThreadInputText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionMsgId, setReactionMsgId] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [selectedLinkAnalysis, setSelectedLinkAnalysis] = useState(null);

  const {
    user,
    communities,
    users,
    communityMemberships,
    uploadImage,
    channels,
    isLoading,
    whatsappSettings,
    theme,
  } = useAppContext();
  const {
    messages,
    directMessages,
    loadChannelMessages,
    sendMessage,
    sendDirectMessage,
    markChatRead,
    reactToMessage,
  } = useChat();
  const { toast } = useToast();

  const isLight = theme === 'light';
  const pickerTheme = isLight ? 'light' : 'dark';
  const isDirectMessage = Boolean(targetUserId);

  const activeMessages =
    targetUserId && user
      ? directMessages.filter(
          (m) =>
            (m.senderId === user.id && m.receiverId === targetUserId) ||
            (m.senderId === targetUserId && m.receiverId === user.id)
        )
      : messages.filter((m) => m.communityId === communityId && m.channel === channelId);

  const onEmojiClick = (emojiObject) => {
    if (reactionMsgId) {
      reactToMessage(reactionMsgId, emojiObject.emoji, isDirectMessage);
      setReactionMsgId(null);
    } else {
      setInputText((prev) => prev + emojiObject.emoji);
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    if (communityId && channelId) {
      loadChannelMessages?.(communityId, channelId);
    }
  }, [communityId, channelId]);

  useEffect(() => {
    if (communityId && channelId) markChatRead(communityId, channelId);
    if (targetUserId) markChatRead(null, targetUserId);
  }, [communityId, channelId, targetUserId, activeMessages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  if (!communityId && !channelId && !targetUserId) {
    return null;
  }

  const community = isDirectMessage ? null : communities.find((c) => c.id === communityId);
  const targetUser = isDirectMessage ? users.find((u) => u.id === targetUserId) : null;
  const waConfig = communityId ? whatsappSettings?.[communityId] : null;

  const currentChannelObj = channels.find((c) => c.id === channelId);
  const isLeader =
    !isDirectMessage &&
    canManageCommunityChat(user, community || { id: communityId }, communityMemberships[communityId]);
  const isReadOnly = currentChannelObj?.type === 'announcement' && !isLeader;

  const handleSend = async () => {
    if ((!inputText.trim() && imageFiles.length === 0) || isReadOnly) return;
    const rateCheck = checkRateLimit(user?.id);
    if (!rateCheck.allowed) {
      toast.error('Slow down a moment', rateCheck.message || 'Please wait a few seconds before sending again.');
      return;
    }

    setIsUploading(true);
    let imageUrls = [];

    if (imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          const url = await uploadImage(file);
          if (url) imageUrls.push(url);
        }
      } catch {
        toast.error('Upload failed', 'Could not upload image');
      }
    }

    const finalImageValue = imageUrls.length > 0 ? JSON.stringify(imageUrls) : '';

    if (isDirectMessage) {
      await sendDirectMessage(targetUserId, inputText, finalImageValue);
    } else {
      await sendMessage(communityId, channelId, inputText, finalImageValue);
    }

    setInputText('');
    setImageFiles([]);
    setIsUploading(false);
  };

  const canSend = Boolean(!isUploading && (inputText.trim() || imageFiles.length > 0));

  return (
    <div
      className="view-chat chat-room-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--surface-canvas)',
      }}
    >
      <AppHeader
        title={isDirectMessage ? targetUser?.name : currentChannelObj?.name || channelId}
        subtitle={isDirectMessage ? 'Direct Message' : `${community?.name || ''} · Shield Guard Active`}
        showBack={true}
        onBack={() => navigate.push('/chat')}
      />

      {/* Centered Editorial Chat Shell */}
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
        {/* Optional WhatsApp Companion Strip */}
        {(() => {
          const waGroupLink = community?.whatsapp_group || waConfig?.groupLink;
          if (!waGroupLink || waConfig?.businessConnected || isDirectMessage) return null;
          const normalizedLink = waGroupLink.startsWith('http')
            ? waGroupLink
            : `https://${waGroupLink}`;
          return (
            <div
              style={{
                background: 'var(--surface-card)',
                borderBottom: '1px solid var(--hairline-border)',
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)' }}>
                Community chat lives here · WhatsApp group also linked
              </span>
              <a
                href={normalizedLink}
                target="_blank"
                rel="noreferrer"
                className="interactive-press"
                style={{
                  color: isLight ? '#15803D' : '#4ADE80',
                  background: isLight ? 'rgba(21, 128, 61, 0.10)' : 'rgba(58, 142, 118, 0.2)',
                  border: isLight
                    ? '1px solid rgba(21, 128, 61, 0.28)'
                    : '1px solid rgba(74, 222, 128, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <MessageCircle size={12} />
                <span>WhatsApp</span>
                <ExternalLink size={11} />
              </a>
            </div>
          );
        })()}

        {waConfig?.businessConnected && !isDirectMessage && (
          <div
            style={{
              background: isLight ? 'rgba(21, 128, 61, 0.08)' : 'rgba(58, 142, 118, 0.12)',
              borderBottom: '1px solid var(--hairline-border)',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <MessageCircle size={14} color={isLight ? '#15803D' : '#4ADE80'} />
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
              Messages here are synced with members&apos; WhatsApp via the Business API.
            </span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row', position: 'relative' }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column', minWidth: 0 }}>
            {/* Chat Feed */}
            <div
              onClick={() => setSelectedMsgId(null)}
              style={{
                flex: 1,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  margin: '12px 0 20px',
                  color: 'var(--ink-muted)',
                  fontSize: '0.8rem',
                }}
              >
                {isDirectMessage
                  ? `This is the start of your direct messages with ${targetUser?.name}.`
                  : `Welcome to #${currentChannelObj?.name || channelId} in ${community?.name || 'your community'}.`}
              </div>

              {isLoading ? (
                <>
                  <SkeletonChatBubble align="left" />
                  <SkeletonChatBubble align="right" />
                  <SkeletonChatBubble align="left" />
                </>
              ) : (
                activeMessages
                  .filter((m) => !m.parentId)
                  .map((msg, index, topLevelMessages) => {
                    const currentAuthorId = msg.senderId || msg.authorId;
                    const authorObj = users.find((u) => u.id === currentAuthorId) || {
                      name: 'Member',
                      id: currentAuthorId,
                    };
                    const isMe = Boolean(user?.id && currentAuthorId === user.id);
                    const isMsgLeader =
                      !isDirectMessage &&
                      isCommunityChatLeader(
                        authorObj,
                        community || { id: communityId },
                        communityMemberships[communityId]
                      );

                    const prevMsg = topLevelMessages[index - 1];
                    const nextMsg = topLevelMessages[index + 1];
                    const prevAuthorId = prevMsg ? prevMsg.senderId || prevMsg.authorId : null;
                    const nextAuthorId = nextMsg ? nextMsg.senderId || nextMsg.authorId : null;

                    const isConsecutive = prevAuthorId === currentAuthorId;
                    const isLastConsecutive = nextAuthorId !== currentAuthorId;

                    const msgDateObj = new Date(msg.createdAt || msg.created_at || Date.now());
                    const prevDateObj = prevMsg
                      ? new Date(prevMsg.createdAt || prevMsg.created_at || Date.now())
                      : null;
                    const showDate =
                      index === 0 || (prevDateObj && msgDateObj.toDateString() !== prevDateObj.toDateString());

                    let msgImages = [];
                    if (msg.image) {
                      try {
                        msgImages = JSON.parse(msg.image);
                        if (!Array.isArray(msgImages)) msgImages = [msg.image];
                      } catch {
                        msgImages = [msg.image];
                      }
                    }

                    const cleanText = msg.text || '';
                    const reactionsMap = {};
                    if (msg.reactions) {
                      msg.reactions.forEach((r) => {
                        if (!reactionsMap[r.emoji]) reactionsMap[r.emoji] = [];
                        reactionsMap[r.emoji].push(r.user_id);
                      });
                    }

                    const showActions = hoveredMsgId === msg.id || selectedMsgId === msg.id;

                    return (
                      <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column' }}>
                        {showDate && (
                          <div
                            style={{
                              textAlign: 'center',
                              margin: '18px 0 12px',
                              fontSize: '0.72rem',
                              color: 'var(--ink-muted)',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {msgDateObj.toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                        )}

                        <div
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '82%',
                            marginTop: isConsecutive ? '3px' : '12px',
                          }}
                          onMouseEnter={() => setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMsgId((prev) => (prev === msg.id ? null : msg.id));
                          }}
                        >
                          {!isMe && !isConsecutive && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                marginBottom: '4px',
                                marginLeft: '4px',
                              }}
                            >
                              <img
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate.push(`/profile/${currentAuthorId}`);
                                }}
                                src={resolveUserAvatar(authorObj)}
                                alt={authorObj.name}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                }}
                              />
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate.push(`/profile/${currentAuthorId}`);
                                }}
                                style={{
                                  fontSize: '0.75rem',
                                  color: isMsgLeader ? 'var(--teal-300)' : 'var(--ink-muted)',
                                  fontWeight: isMsgLeader ? 700 : 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {authorObj.name}
                                {isMsgLeader ? ' • Leader' : ''}
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              background: isMe ? 'var(--brand-accent)' : 'var(--surface-card)',
                              border: isMe ? 'none' : '1px solid var(--hairline-border-strong)',
                              padding: '10px 14px',
                              borderRadius: isMe
                                ? `16px ${isConsecutive ? '4px' : '16px'} ${isLastConsecutive ? '16px' : '4px'} 16px`
                                : `${isConsecutive ? '4px' : '16px'} 16px 16px ${isLastConsecutive ? '16px' : '4px'}`,
                              fontSize: '0.94rem',
                              color: isMe ? '#FFFFFF' : 'var(--ink-primary)',
                              lineHeight: 1.45,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              position: 'relative',
                            }}
                          >
                            {showActions && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  top: '-34px',
                                  right: isMe ? '4px' : 'auto',
                                  left: isMe ? 'auto' : '4px',
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
                                      reactToMessage(msg.id, em, isDirectMessage);
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
                                  title="Reply in thread"
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
                                  title="More reactions"
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

                            {msgImages.length > 0 && (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: msgImages.length > 1 ? '1fr 1fr' : '1fr',
                                  gap: '4px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                }}
                              >
                                {msgImages.map((img, idx) =>
                                  img.match(/\.(mp4|mov|webm)(\?.*)?$/i) ? (
                                    <video
                                      key={idx}
                                      src={img}
                                      controls
                                      style={{
                                        width: '100%',
                                        height: msgImages.length > 1 ? '120px' : 'auto',
                                        maxHeight: '260px',
                                        objectFit: 'contain',
                                        background: '#000000',
                                      }}
                                    />
                                  ) : (
                                    <img
                                      key={idx}
                                      src={img}
                                      alt="Attachment"
                                      style={{
                                        width: '100%',
                                        height: msgImages.length > 1 ? '120px' : 'auto',
                                        maxHeight: '260px',
                                        objectFit: 'cover',
                                        display: 'block',
                                      }}
                                    />
                                  )
                                )}
                              </div>
                            )}

                            {cleanText && (
                              <SafeChatText
                                text={cleanText}
                                onLinkClick={setSelectedLinkAnalysis}
                                isOwn={isMe}
                              />
                            )}

                            {Object.keys(reactionsMap).length > 0 && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}
                              >
                                {Object.entries(reactionsMap).map(([emoji, usersArr]) => {
                                  const reacted = usersArr.includes(user?.id);
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => reactToMessage(msg.id, emoji, isDirectMessage)}
                                      style={{
                                        background: isMe
                                          ? reacted
                                            ? 'rgba(255,255,255,0.28)'
                                            : 'rgba(255,255,255,0.16)'
                                          : reacted
                                            ? 'var(--brand-accent-soft)'
                                            : 'var(--surface-elevated)',
                                        border: isMe
                                          ? '1px solid rgba(255,255,255,0.28)'
                                          : reacted
                                            ? '1px solid var(--brand-accent)'
                                            : '1px solid var(--hairline-border-strong)',
                                        color: isMe
                                          ? '#FFFFFF'
                                          : reacted
                                            ? 'var(--teal-300)'
                                            : 'var(--ink-primary)',
                                        padding: '2px 7px',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <span>{emoji}</span>
                                      <span>{usersArr.length}</span>
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
                                    marginTop: '2px',
                                    fontSize: '0.75rem',
                                    color: isMe ? 'rgba(255,255,255,0.92)' : 'var(--teal-300)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    alignSelf: 'flex-start',
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
                                alignSelf: 'flex-end',
                                color: isMe ? 'rgba(255,255,255,0.82)' : 'var(--ink-muted)',
                              }}
                            >
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : msg.timestamp
                                  ? String(msg.timestamp).includes('T')
                                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : msg.timestamp
                                  : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            {!isReadOnly ? (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--surface-card)',
                  borderTop: '1px solid var(--hairline-border)',
                  zIndex: 10,
                }}
              >
                {imageFiles.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '8px 10px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      overflowX: 'auto',
                    }}
                  >
                    {Array.from(imageFiles).map((file, i) => (
                      <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--hairline-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ImageIcon size={16} color="var(--brand-accent)" />
                        </div>
                        <button
                          onClick={() => setImageFiles(Array.from(imageFiles).filter((_, idx) => idx !== i))}
                          aria-label="Remove attachment"
                          className="interactive-press"
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: 'var(--ink-primary)',
                            border: 'none',
                            color: 'var(--surface-canvas)',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    ref={fileInputRef}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImageFiles((prev) => [...prev, ...files]);
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image or video"
                    className="interactive-press"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink-secondary)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <ImageIcon size={20} />
                  </button>

                  <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      aria-label="Emoji picker"
                      className="interactive-press"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: showEmojiPicker ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div style={{ position: 'absolute', bottom: '50px', left: 0, zIndex: 100 }}>
                        <EmojiPicker onEmojiClick={onEmojiClick} theme={pickerTheme} />
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={
                      isDirectMessage
                        ? 'Write a message...'
                        : `Message #${currentChannelObj?.name || channelId}...`
                    }
                    style={{
                      flex: 1,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '999px',
                      padding: '10px 16px',
                      color: 'var(--ink-primary)',
                      fontSize: '0.92rem',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />

                  <button
                    disabled={!canSend}
                    onClick={handleSend}
                    aria-label="Send message"
                    className="interactive-press"
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: canSend ? 'none' : '1px solid var(--hairline-border)',
                      background: canSend ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                      color: canSend ? '#FFFFFF' : 'var(--ink-muted)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: canSend ? 'pointer' : 'default',
                    }}
                  >
                    <Send size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '18px 20px',
                  background: 'var(--surface-card)',
                  borderTop: '1px solid var(--hairline-border)',
                  textAlign: 'center',
                  color: 'var(--ink-muted)',
                  fontSize: '0.84rem',
                }}
              >
                <Megaphone
                  size={15}
                  style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
                />
                Only community leaders can post in this announcement channel.
              </div>
            )}
          </div>

          {/* Responsive Thread Drawer (full-screen sheet on mobile, 350px side panel on desktop) */}
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
                  const authorId = threadParent.senderId || threadParent.authorId;
                  const authorObj = users.find((u) => u.id === authorId) || {
                    name: 'Member',
                    id: authorId,
                  };
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
                              {formatChatTime(threadParent)}
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
                        const replyAuthorId = reply.senderId || reply.authorId;
                        const repAuth = users.find((u) => u.id === replyAuthorId) || {
                          name: 'Member',
                          id: replyAuthorId,
                        };
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
                                  {formatChatTime(reply)}
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
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={threadInputText}
                    onChange={(e) => setThreadInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && threadInputText.trim()) {
                        if (isDirectMessage) sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
                        else sendMessage(communityId, channelId, threadInputText, '', activeThreadId);
                        setThreadInputText('');
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
                        if (isDirectMessage) sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
                        else sendMessage(communityId, channelId, threadInputText, '', activeThreadId);
                        setThreadInputText('');
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
    </div>
  );
}
