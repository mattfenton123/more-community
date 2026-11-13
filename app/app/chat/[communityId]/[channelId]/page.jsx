"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, Menu, MessageCircle, ChevronLeft, Plus, Users, Hash, Image as ImageIcon, X, Smile, Megaphone } from 'lucide-react';
import AppHeader from '../../../../src/components/AppHeader';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { SkeletonChatBubble } from '../../../../src/components/SkeletonCard';
import { resolveUserAvatar } from '../../../../src/lib/avatar';
import { formatChatTime, isCommunityChatLeader, canManageCommunityChat } from '../../../../src/lib/chatUtils';
import { useToast } from '../../../../src/components/Toast';
import { FALLBACK_IMAGES } from '../../../../src/lib/constants';
import dynamic from 'next/dynamic';
import SafeChatText from '../../../../src/components/SafeChatText';
import LinkSafetyModal from '../../../../src/components/LinkSafetyModal';
import { checkRateLimit } from '../../../../src/lib/chatSecurity';
import { Shield, ShieldCheck } from 'lucide-react';


const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function Chat() {
  const { communityId, channelId, targetUserId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [threadInputText, setThreadInputText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [activeTab, setActiveTab] = useState('Communities');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionMsgId, setReactionMsgId] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [selectedLinkAnalysis, setSelectedLinkAnalysis] = useState(null);
  
  const onEmojiClick = (emojiObject) => {
    if (reactionMsgId) {
      reactToMessage(reactionMsgId, emojiObject.emoji, isDirectMessage);
      setReactionMsgId(null);
    } else {
      setInputText(prev => prev + emojiObject.emoji);
      setShowEmojiPicker(false);
    }
  };
  
  const { user, communities, users, communityMemberships, uploadImage, channels, createChannel, isLoading, whatsappSettings } = useAppContext();
  const { messages, directMessages, loadChannelMessages, sendMessage, sendDirectMessage, chatReadReceipts, markChatRead, reactToMessage } = useChat();
  const { toast } = useToast();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const activeMessages = (targetUserId && user)
    ? directMessages.filter(m => (m.senderId === user.id && m.receiverId === targetUserId) || (m.senderId === targetUserId && m.receiverId === user.id))
    : messages.filter(m => m.communityId === communityId && m.channel === channelId);

  // Load up to 200 channel messages cleanly on mount/navigation
  useEffect(() => {
    if (communityId && channelId) {
      loadChannelMessages?.(communityId, channelId);
    }
  }, [communityId, channelId]);

  // Mark as read when entering a chat
  useEffect(() => {
    if (communityId && channelId) markChatRead(communityId, channelId);
    if (targetUserId) markChatRead(null, targetUserId);
  }, [communityId, channelId, targetUserId, activeMessages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  if (!communityId && !channelId && !targetUserId) {
    return null;
  }

  // ACTIVE CHAT VIEW
  const isDirectMessage = !!targetUserId;
  const community = isDirectMessage ? null : communities.find(c => c.id === communityId);
  const targetUser = isDirectMessage ? users.find(u => u.id === targetUserId) : null;
  const waConfig = communityId ? whatsappSettings[communityId] : null;

  const currentChannelObj = channels.find(c => c.id === channelId);
  const isLeader = !isDirectMessage && canManageCommunityChat(user, community || { id: communityId }, communityMemberships[communityId]);
  const isReadOnly = currentChannelObj?.type === 'announcement' && !isLeader;
  
  const handleSend = async () => {
    if ((!inputText.trim() && imageFiles.length === 0) || isReadOnly) return;
    const rateCheck = checkRateLimit(user?.id);
    if (!rateCheck.allowed) {
      alert(rateCheck.message);
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
      } catch (err) {
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

  return (
    <div className="view-chat" style={{ height: 'calc(100dvh - 70px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      <AppHeader 
        title={isDirectMessage ? targetUser?.name : (currentChannelObj?.name || channelId)}
        subtitle={isDirectMessage ? 'Direct Message' : `${community?.name || ''} · 🛡️ Shield Guard Active`}
        showBack={true}
        onBack={() => navigate.push('/chat')}
      />

      {/* Subtle optional WhatsApp group companion strip */}
      {(() => {
        const waGroupLink = community?.whatsapp_group || waConfig?.groupLink;
        if (!waGroupLink || waConfig?.businessConnected || isDirectMessage) return null;
        const normalizedLink = waGroupLink.startsWith('http') ? waGroupLink : `https://${waGroupLink}`;
        return (
          <div style={{ background: 'rgba(15, 23, 42, 0.45)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '7px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--slate-400)' }}>
              Community chat lives here · WhatsApp group also linked
            </span>
            <a
              href={normalizedLink}
              target="_blank"
              rel="noreferrer"
              className="interactive-press"
              style={{
                color: '#4ade80',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.22)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <MessageCircle size={12} />
              <span>WhatsApp Group ↗</span>
            </a>
          </div>
        );
      })()}
      {waConfig?.businessConnected && !isDirectMessage && (
        <div style={{ background: 'rgba(34,197,94,0.05)', borderBottom: '1px solid rgba(34,197,94,0.1)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={14} color="#22c55e" />
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Messages here are officially synced to members' WhatsApp via the Business API.</span>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
        {/* Chat Feed */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
            {isDirectMessage ? `This is the start of your direct messages with ${targetUser?.name}.` : `This is the start of the #${channelId} chat for ${community?.name}.`}
          </div>

          {isLoading ? (
            <>
              <SkeletonChatBubble align="left" />
              <SkeletonChatBubble align="right" />
              <SkeletonChatBubble align="left" />
            </>
          ) : (
            activeMessages.filter(m => !m.parentId).map((msg, index, topLevelMessages) => {
              const currentAuthorId = msg.senderId || msg.authorId; // Handle both schemas
              const authorObj = users.find(u => u.id === currentAuthorId) || { name: 'Unknown', id: currentAuthorId };
              const isMe = Boolean(user?.id && currentAuthorId === user.id);
              const isLeader = !isDirectMessage && isCommunityChatLeader(authorObj, community || { id: communityId }, communityMemberships[communityId]);
              
              const prevMsg = topLevelMessages[index - 1];
              const nextMsg = topLevelMessages[index + 1];
              const prevAuthorId = prevMsg ? (prevMsg.senderId || prevMsg.authorId) : null;
              const nextAuthorId = nextMsg ? (nextMsg.senderId || nextMsg.authorId) : null;
              
              const isConsecutive = prevAuthorId === currentAuthorId;
              const isLastConsecutive = nextAuthorId !== currentAuthorId;

              // Date separator (very basic logic for prototype)
              const showDate = index === 0 || (prevMsg && new Date(msg.createdAt || new Date()).getDate() !== new Date(prevMsg.createdAt || new Date()).getDate());

              // Parse images
              let msgImages = [];
              if (msg.image) {
                try {
                  msgImages = JSON.parse(msg.image);
                  if (!Array.isArray(msgImages)) msgImages = [msg.image];
                } catch(e) {
                  msgImages = [msg.image];
                }
              }

              // Group relational reactions by emoji
              let cleanText = msg.text || '';
              let reactionsMap = {};
              if (msg.reactions) {
                msg.reactions.forEach(r => {
                  if (!reactionsMap[r.emoji]) reactionsMap[r.emoji] = [];
                  reactionsMap[r.emoji].push(r.user_id);
                });
              }

              return (
                <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column' }}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '24px 0 16px 0', fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Today'}
                    </div>
                  )}
                  <div className="stagger-item" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', marginTop: isConsecutive ? '4px' : '16px' }} onMouseEnter={() => setHoveredMsgId(msg.id)} onMouseLeave={() => setHoveredMsgId(null)}>
                    {!isMe && !isConsecutive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', marginLeft: '4px' }}>
                        <img onClick={() => navigate.push(`/profile/${msg.authorId || msg.senderId}`)} src={resolveUserAvatar(authorObj)} alt={authorObj.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                        <div onClick={() => navigate.push(`/profile/${msg.authorId || msg.senderId}`)} style={{ fontSize: '0.75rem', color: isLeader ? 'var(--teal-400)' : 'var(--slate-400)', fontWeight: isLeader ? 600 : 400, cursor: 'pointer' }}>
                          {authorObj.name} {isLeader && '👑'}
                        </div>
                      </div>
                    )}
                    <div style={{ 
                      background: isMe ? 'var(--teal-600)' : 'var(--slate-800)', 
                      border: isMe ? 'none' : '1px solid var(--slate-700)', 
                      padding: '12px 16px', 
                      borderRadius: isMe 
                        ? `16px ${isConsecutive ? '4px' : '16px'} ${isLastConsecutive ? '16px' : '4px'} 16px` 
                        : `${isConsecutive ? '4px' : '16px'} 16px 16px ${isLastConsecutive ? '16px' : '4px'}`, 
                      fontSize: '0.95rem', 
                      color: isMe ? 'white' : 'var(--slate-200)',
                      lineHeight: 1.4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative'
                    }}>
                      {hoveredMsgId === msg.id && (
                        <div style={{ position: 'absolute', top: '-16px', right: isMe ? '16px' : (msgImages.length ? '-16px' : 'auto'), left: isMe ? 'auto' : (msgImages.length ? 'auto' : '-16px'), background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '99px', padding: '4px', display: 'flex', gap: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                          {['❤️', '👍', '😂', '🔥', '🎉'].map(e => (
                            <button key={e} onClick={() => reactToMessage(msg.id, e, isDirectMessage)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', transition: 'transform 0.1s' }} onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.2)'} onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
                              {e}
                            </button>
                          ))}
                          <button onClick={() => setActiveThreadId(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }} onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.2)'} onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
                            <MessageCircle size={14} color="var(--slate-400)" />
                          </button>
                          <button onClick={() => setReactionMsgId(reactionMsgId === msg.id ? null : msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }} onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.2)'} onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
                            <Plus size={14} color="var(--slate-400)" />
                          </button>
                        </div>
                      )}

                      {msgImages.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: msgImages.length > 1 ? '1fr 1fr' : '1fr', gap: '4px', borderRadius: '8px', overflow: 'hidden' }}>
                          {msgImages.map((img, i) => {
                            if (img.match(/\.(mp4|mov|webm)(\?.*)?$/i)) {
                              return <video key={i} src={img} controls style={{ width: '100%', height: msgImages.length > 1 ? '120px' : 'auto', maxHeight: '250px', objectFit: 'contain', background: 'black' }} />;
                            }
                            return <img key={i} src={img} alt="Attachment" style={{ width: '100%', height: msgImages.length > 1 ? '120px' : 'auto', maxHeight: '250px', objectFit: 'cover' }} />;
                          })}
                        </div>
                      )}
                      
                      {cleanText && <SafeChatText text={cleanText} onLinkClick={setSelectedLinkAnalysis} isOwn={isMe} />}
                      
                      {Object.keys(reactionsMap).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {Object.entries(reactionsMap).map(([emoji, usersArr]) => (
                            <div key={emoji} onClick={() => reactToMessage(msg.id, emoji, isDirectMessage)} style={{ background: usersArr.includes(user?.id) ? (isMe ? 'rgba(255,255,255,0.2)' : 'var(--teal-600)') : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {emoji} <span style={{ opacity: 0.9 }}>{usersArr.length}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Thread Reply Count */}
                      {(() => {
                        const replyCount = activeMessages.filter(m => m.parentId === msg.id).length;
                        if (replyCount === 0) return null;
                        return (
                          <div onClick={() => setActiveThreadId(msg.id)} style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageCircle size={12} /> {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
                          </div>
                        );
                      })()}

                      <div style={{ fontSize: '0.65rem', alignSelf: 'flex-end', opacity: 0.7, marginTop: '2px' }}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (msg.timestamp ? (String(msg.timestamp).includes('T') ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : msg.timestamp) : '')}
                      </div>
                      {waConfig?.businessConnected && !isDirectMessage && isLastConsecutive && (
                        <div style={{ position: 'absolute', bottom: '-20px', right: isMe ? '0' : 'auto', left: isMe ? 'auto' : '0', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}>
                          <MessageCircle size={10} color="#22c55e" /> Synced
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>


      {!isReadOnly ? (
        <div style={{ padding: '16px 20px', background: 'var(--slate-900)', borderTop: '1px solid var(--slate-800)', zIndex: 10 }}>
          {imageFiles.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', overflowX: 'auto' }}>
              {Array.from(imageFiles).map((file, i) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--slate-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={16} color="var(--teal-400)" />
                  </div>
                  <button onClick={() => setImageFiles(Array.from(imageFiles).filter((_, idx) => idx !== i))} className="interactive-press" style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--slate-700)', border: 'none', color: 'var(--white)', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="file" accept="image/*,video/*" multiple ref={fileInputRef} onChange={e => {
              const files = Array.from(e.target.files);
              setImageFiles(prev => [...prev, ...files]);
            }} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', padding: '8px', cursor: 'pointer' }}>
              <ImageIcon size={20} />
            </button>
            <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="interactive-press" style={{ background: 'none', border: 'none', color: showEmojiPicker ? 'var(--teal-400)' : 'var(--slate-400)', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '50px', left: '0', zIndex: 100 }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                </div>
              )}
            </div>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isDirectMessage ? 'Message...' : `Message #${channelId}...`}
              style={{ flex: 1, background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '999px', padding: '12px 20px', color: 'var(--slate-200)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(20,184,166,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
            />
            <button disabled={isUploading || (!inputText.trim() && imageFiles.length === 0)} className="btn btn-primary interactive-press" onClick={handleSend} style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isUploading || (!inputText.trim() && imageFiles.length === 0)) ? 0.5 : 1 }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
          <Megaphone size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
          Only community leaders can send messages to this announcement channel.
        </div>
      )}
      </div>

      {activeThreadId && (
        <div style={{ width: '350px', borderLeft: '1px solid var(--slate-800)', background: 'var(--slate-900)', display: 'flex', flexDirection: 'column', zIndex: 20 }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--slate-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--white)' }}>Thread</h3>
            <button onClick={() => setActiveThreadId(null)} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {(() => {
              const threadParent = activeMessages.find(m => m.id === activeThreadId);
              const threadReplies = activeMessages.filter(m => m.parentId === activeThreadId);
              if (!threadParent) return null;
              const authorId = threadParent.senderId || threadParent.authorId;
              const authorObj = users.find(u => u.id === authorId) || { name: 'Unknown', id: authorId };
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Thread Parent */}
                  <div style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--slate-800)' }}>
                    <img src={resolveUserAvatar(authorObj)} alt={authorObj.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--white)' }}>{authorObj.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{formatChatTime(threadParent)}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginTop: '6px', color: 'var(--slate-200)', lineHeight: 1.4 }}>{threadParent.text}</div>
                    </div>
                  </div>
                  {/* Replies */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '-8px' }}>{threadReplies.length} {threadReplies.length === 1 ? 'Reply' : 'Replies'}</div>
                  {threadReplies.map(reply => {
                    const replyAuthorId = reply.senderId || reply.authorId;
                    const repAuth = users.find(u => u.id === replyAuthorId) || { name: 'Unknown', id: replyAuthorId };
                    return (
                      <div key={reply.id} style={{ display: 'flex', gap: '10px' }}>
                        <img src={resolveUserAvatar(repAuth)} alt={repAuth.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-200)' }}>{repAuth.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{formatChatTime(reply)}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--slate-300)', lineHeight: 1.4 }}>{reply.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          <div style={{ padding: '16px', borderTop: '1px solid var(--slate-800)', background: 'var(--slate-900)' }}>
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
                style={{ flex: 1, background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '999px', padding: '10px 16px', color: 'var(--white)', fontSize: '0.9rem', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'rgba(20,184,166,0.4)'}
                onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
              />
              <button disabled={!threadInputText.trim()} onClick={() => {
                if (threadInputText.trim()) {
                  if (isDirectMessage) sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
                  else sendMessage(communityId, channelId, threadInputText, '', activeThreadId);
                  setThreadInputText('');
                }
              }} className="interactive-press" style={{ background: 'var(--teal-600)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', opacity: threadInputText.trim() ? 1 : 0.5 }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* Global Emoji Modal for Reactions */}
      {reactionMsgId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setReactionMsgId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', animation: 'scaleUp 0.2s ease-out' }}>
            <button onClick={() => setReactionMsgId(null)} className="interactive-press" style={{ position: 'absolute', top: '-12px', right: '-12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '50%', padding: '4px', cursor: 'pointer', zIndex: 10000 }}>
              <X size={16} color="var(--slate-400)" />
            </button>
            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={320} height={450} />
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