"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, Image as ImageIcon, X, MessageCircle, Plus } from 'lucide-react';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useRouter, useParams } from 'next/navigation';
import EmojiPicker from 'emoji-picker-react';

export default function DirectMessage() {
  const { id: targetUserId } = useParams();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [threadInputText, setThreadInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [reactionMsgId, setReactionMsgId] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { user, users, uploadImage } = useAppContext();
  const { directMessages, sendDirectMessage, reactToMessage, markChatRead } = useChat();

  const targetUser = users.find(u => u.id === targetUserId);

  const activeMessages = directMessages.filter(m =>
    (m.senderId === user?.id && m.receiverId === targetUserId) ||
    (m.senderId === targetUserId && m.receiverId === user?.id)
  ).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  const mainMessages = activeMessages.filter(m => !m.parentId);

  useEffect(() => {
    if (targetUserId) markChatRead(null, targetUserId);
  }, [targetUserId, activeMessages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mainMessages]);

  const handleSend = async () => {
    if (!inputText.trim() && !imageFile) return;
    let imageUrl = null;
    if (imageFile) {
      setIsUploading(true);
      try { imageUrl = await uploadImage(imageFile); } 
      catch (e) { console.error(e); }
      setIsUploading(false);
      setImageFile(null);
    }
    const text = inputText.trim();
    setInputText('');
    await sendDirectMessage(targetUserId, text, imageUrl);
  };

  const onEmojiClick = (emojiObject) => {
    if (reactionMsgId) {
      reactToMessage(reactionMsgId, emojiObject.emoji, true);
      setReactionMsgId(null);
    }
  };

  if (!targetUser) {
    return (
      <div style={{ padding: '40px', color: 'var(--slate-400)', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>User not found</div>
        <button onClick={() => router.push('/chat')} className="btn btn-primary" style={{ borderRadius: '99px' }}>Back to Chat</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 70px)', background: 'var(--slate-950)', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => router.push('/chat')} style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <img 
          src={targetUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name)}&background=0D8B93&color=fff`}
          alt={targetUser.name}
          onClick={() => router.push(`/profile/${targetUserId}`)}
          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem' }}>{targetUser.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Direct Message</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mainMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👋</div>
                <div style={{ fontSize: '0.9rem' }}>Say hello to {targetUser.name}!</div>
              </div>
            )}
            {mainMessages.map((msg, i) => {
              const isOwn = msg.senderId === user?.id;
              const author = isOwn ? user : targetUser;
              
              const isConsecutive = i > 0 && mainMessages[i - 1].senderId === msg.senderId;
              const isLastConsecutive = i === mainMessages.length - 1 || mainMessages[i + 1].senderId !== msg.senderId;

              const reactionMap = msg.reactions?.reduce((acc, r) => {
                acc[r.emoji] = acc[r.emoji] || [];
                acc[r.emoji].push(r.user_id);
                return acc;
              }, {}) || {};

              return (
                <div key={msg.id || i} style={{ display: 'flex', gap: '8px', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  {!isOwn && (
                    <img 
                      src={author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name || 'U')}&background=0D8B93&color=fff`}
                      alt="" 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, opacity: isLastConsecutive ? 1 : 0 }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '75%', position: 'relative' }}>
                    <div style={{
                      padding: '10px 14px', 
                      borderRadius: isOwn 
                        ? `16px ${isConsecutive ? '4px' : '16px'} ${isLastConsecutive ? '16px' : '4px'} 16px` 
                        : `${isConsecutive ? '4px' : '16px'} 16px 16px ${isLastConsecutive ? '16px' : '4px'}`,
                      background: isOwn ? 'var(--teal-600)' : 'var(--slate-800)',
                      border: isOwn ? 'none' : '1px solid var(--slate-700)',
                      color: isOwn ? 'white' : 'var(--slate-200)',
                      fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word',
                      position: 'relative'
                    }}>
                      
                      {hoveredMsgId === msg.id && (
                        <div style={{ position: 'absolute', top: '-16px', right: isOwn ? '16px' : 'auto', left: isOwn ? 'auto' : '-16px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '99px', padding: '4px', display: 'flex', gap: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                          {['❤️', '👍', '😂', '🔥', '🎉'].map(e => (
                            <button key={e} onClick={() => reactToMessage(msg.id, e, true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', transition: 'transform 0.1s' }} onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.2)'} onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
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

                      {msg.image && (
                        msg.image.match(/\.(mp4|mov|webm)(\?.*)?$/i) ? (
                          <video src={msg.image} controls style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : 0, background: 'black' }} />
                        ) : (
                          <img src={msg.image} alt="" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : 0 }} />
                        )
                      )}
                      {msg.text && <div>{msg.text}</div>}
                    </div>

                    {Object.keys(reactionMap).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                        {Object.entries(reactionMap).map(([emoji, rUsers]) => {
                          const hasReacted = rUsers.includes(user?.id);
                          return (
                            <button key={emoji} onClick={() => reactToMessage(msg.id, emoji, true)} className="interactive-press" style={{ background: hasReacted ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${hasReacted ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '99px', padding: '2px 6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: hasReacted ? 'var(--teal-300)' : 'var(--slate-400)', cursor: 'pointer' }}>
                              <span>{emoji}</span><span>{rUsers.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(() => {
                      const replyCount = activeMessages.filter(m => m.parentId === msg.id).length;
                      if (replyCount === 0) return null;
                      return (
                        <div onClick={() => setActiveThreadId(msg.id)} style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageCircle size={12} /> {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
                        </div>
                      );
                    })()}

                    <div style={{ fontSize: '0.65rem', color: 'var(--slate-600)', marginTop: '4px', textAlign: isOwn ? 'right' : 'left' }}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--slate-800)', background: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <ImageIcon size={20} color="var(--slate-400)" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Message ${targetUser.name}...`}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '20px', border: '1px solid var(--slate-700)', background: 'var(--slate-800)', color: 'var(--slate-200)', fontSize: '0.9rem', outline: 'none' }}
            />
            {imageFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(20,184,166,0.1)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--teal-300)' }}>
                📷 {imageFile.name.substring(0, 10)}...
                <button onClick={() => setImageFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}><X size={12} color="var(--teal-300)" /></button>
              </div>
            )}
            <button 
              onClick={handleSend} 
              disabled={isUploading || (!inputText.trim() && !imageFile)}
              className="interactive-press"
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: inputText.trim() || imageFile ? 'var(--teal-500)' : 'rgba(255,255,255,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              <Send size={18} color={inputText.trim() || imageFile ? 'white' : 'var(--slate-600)'} />
            </button>
          </div>
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
                const authorObj = users.find(u => u.id === (threadParent.senderId || threadParent.authorId)) || { name: 'Unknown', avatar: 'https://i.pravatar.cc/150' };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--slate-800)' }}>
                      <img src={authorObj.avatar} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--white)' }}>{authorObj.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{threadParent.createdAt ? new Date(threadParent.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', marginTop: '6px', color: 'var(--slate-200)', lineHeight: 1.4 }}>{threadParent.text}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600, marginBottom: '-8px' }}>{threadReplies.length} {threadReplies.length === 1 ? 'Reply' : 'Replies'}</div>
                    {threadReplies.map(reply => {
                      const repAuth = users.find(u => u.id === (reply.senderId || reply.authorId)) || { name: 'Unknown', avatar: 'https://i.pravatar.cc/150' };
                      return (
                        <div key={reply.id} style={{ display: 'flex', gap: '10px' }}>
                          <img src={repAuth.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-200)' }}>{repAuth.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
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
                      sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
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
                    sendDirectMessage(targetUserId, threadInputText, '', activeThreadId);
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
    </div>
  );
}
