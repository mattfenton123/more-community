"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, Menu, MessageCircle, ChevronLeft, Plus, Users, Hash, Image as ImageIcon, X, Smile } from 'lucide-react';
import AppHeader from '../../../../src/components/AppHeader';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { SkeletonChatBubble, SkeletonLine, SkeletonAvatar } from '../../../../src/components/SkeletonCard';
import { useToast } from '../../../../src/components/Toast';
import { FALLBACK_IMAGES } from '../../../../src/lib/constants';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function Chat() {
  const { communityId, channelId, targetUserId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [activeTab, setActiveTab] = useState('Communities');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const onEmojiClick = (emojiObject) => {
    setInputText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };
  
  const { user, communities, users, communityMemberships, uploadImage, channels, createChannel, isLoading, whatsappSettings } = useAppContext();
  const { messages, directMessages, sendMessage, sendDirectMessage, chatReadReceipts, markChatRead, reactToMessage } = useChat();
  const { toast } = useToast();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const activeMessages = (targetUserId)
    ? directMessages.filter(m => (m.senderId === user.id && m.receiverId === targetUserId) || (m.senderId === targetUserId && m.receiverId === user.id))
    : messages.filter(m => m.communityId === communityId && m.channel === channelId);

  // Mark as read when entering a chat
  useEffect(() => {
    if (communityId && channelId) markChatRead(communityId, channelId);
    if (targetUserId) markChatRead(null, targetUserId);
  }, [communityId, channelId, targetUserId, activeMessages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // INBOX VIEW (If no params provided)
  if (!communityId && !channelId && !targetUserId) {
    const myCommunities = communities.filter(c => user.joinedCommunities.includes(c.id));
    
    // Build inbox items from real channels + fallback general
    const communityInboxItems = [];
    myCommunities.forEach(c => {
      const communityChannels = channels.filter(ch => ch.community_id === c.id);
      if (communityChannels.length === 0) {
        communityInboxItems.push({ comm: c, type: 'channel', name: 'general', id: 'general' });
      } else {
        communityChannels.forEach(ch => {
          communityInboxItems.push({ comm: c, type: 'channel', name: ch.name, id: ch.id });
        });
      }
      if (user.leaderOf === c.id) {
        communityInboxItems.push({ comm: c, type: 'group', name: 'Organizers Group', id: 'organizers' });
      }
    });

    // Build DM inbox items
    const dmInboxItems = [];
    if (directMessages && user) {
      const dmUsers = new Set();
      directMessages.forEach(dm => {
        const otherUserId = dm.senderId === user.id ? dm.receiverId : dm.senderId;
        dmUsers.add(otherUserId);
      });
      
      dmUsers.forEach(otherId => {
        const otherUserObj = users.find(u => u.id === otherId) || { id: otherId, name: 'Unknown User', avatar: 'https://i.pravatar.cc/150' };
        dmInboxItems.push({
          type: 'dm',
          otherUser: otherUserObj,
          id: otherId
        });
      });
    }

    const itemsToRender = activeTab === 'Communities' ? communityInboxItems : dmInboxItems;

    const handleCreateChannel = async () => {
      if (!newChannelName.trim()) return;
      const leaderCommunity = user.leaderOf;
      if (!leaderCommunity) return;
      await createChannel(leaderCommunity, newChannelName.trim());
      toast.success('Channel created!', `#${newChannelName.trim()} is now live`);
      setNewChannelName('');
      setShowCreateModal(false);
    };

    return (
      <div className="view-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AppHeader title="Inbox" />
        <div style={{ padding: '0 20px', display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => setActiveTab('Communities')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'Communities' ? 'white' : 'var(--slate-500)',
              borderBottom: activeTab === 'Communities' ? '2px solid var(--teal-400)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}>
            Communities
          </button>
          <button 
            onClick={() => setActiveTab('Direct Messages')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 0', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'Direct Messages' ? 'white' : 'var(--slate-500)',
              borderBottom: activeTab === 'Direct Messages' ? '2px solid var(--teal-400)' : '2px solid transparent',
              transition: 'all 0.2s'
            }}>
            Direct Messages
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {isLoading ? (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="stagger-item" style={{ display: 'flex', gap: '16px', padding: '12px 0' }}>
                  <SkeletonAvatar size={48} round />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <SkeletonLine width="60%" height="14px" />
                    <SkeletonLine width="35%" height="10px" />
                    <SkeletonLine width="80%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          ) : itemsToRender.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--slate-400)', textAlign: 'center' }}>
              {activeTab === 'Communities' ? 'You have no active community chats.' : 'You have no direct messages yet.'}
            </p>
          ) : (
            itemsToRender.map((item, i) => {
              if (item.type === 'dm') {
                const latestDm = directMessages.filter(m => (m.senderId === item.id && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === item.id)).pop();
                const dmReceipt = chatReadReceipts.find(r => !r.community_id && r.channel_id === item.id);
                const hasUnread = latestDm && latestDm.senderId !== user.id && (!dmReceipt || new Date(dmReceipt.last_read_at) < new Date(latestDm.createdAt || new Date().toISOString()));
                
                return (
                  <div 
                    key={`dm-${i}`} 
                    onClick={() => navigate.push('/chat')}
                    className="stagger-item interactive-press"
                    style={{ display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {hasUnread && <div style={{ position: 'absolute', top: '16px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-400)' }} />}
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `url(${item.otherUser.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--slate-800)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--slate-950)' }}>
                        <MessageCircle size={12} color="var(--teal-400)" />
                      </div>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <div style={{ fontWeight: hasUnread ? 700 : 600, fontSize: '1rem', color: hasUnread ? 'white' : 'var(--slate-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.otherUser.name}</div>
                        <div style={{ fontSize: '0.75rem', color: hasUnread ? 'var(--teal-400)' : 'var(--slate-500)', fontWeight: hasUnread ? 600 : 400 }}>{latestDm?.timestamp || ''}</div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: hasUnread ? 'var(--slate-300)' : 'var(--slate-400)', fontWeight: hasUnread ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {latestDm ? (latestDm.image ? '📸 Image' : `${latestDm.senderId === user.id ? 'You' : item.otherUser.name}: ${latestDm.text}`) : 'No messages yet...'}
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal community channel
              const latestMsg = messages.filter(m => m.communityId === item.comm.id && m.channel === item.id).pop();
              const commReceipt = chatReadReceipts.find(r => r.community_id === item.comm.id && r.channel_id === item.id);
              const hasUnread = latestMsg && latestMsg.authorId !== user.id && (!commReceipt || new Date(commReceipt.last_read_at) < new Date(latestMsg.createdAt || new Date().toISOString()));

              return (
                <div 
                  key={`comm-${i}`} 
                  onClick={() => navigate.push('/chat')}
                  className="stagger-item interactive-press"
                  style={{ display: 'flex', gap: '16px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {hasUnread && <div style={{ position: 'absolute', top: '16px', left: '8px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-400)' }} />}
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `url(${item.comm.image || FALLBACK_IMAGES.community})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--slate-800)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--slate-950)' }}>
                      {item.type === 'channel' ? <Hash size={12} color="var(--teal-400)" /> : <Users size={12} color="var(--amber-400)" />}
                    </div>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <div style={{ fontWeight: hasUnread ? 700 : 600, fontSize: '1rem', color: hasUnread ? 'white' : 'var(--slate-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.comm.name}</div>
                      <div style={{ fontSize: '0.75rem', color: hasUnread ? 'var(--teal-400)' : 'var(--slate-500)', fontWeight: hasUnread ? 600 : 400 }}>{latestMsg?.timestamp || ''}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 500, marginBottom: '2px' }}>{item.type === 'channel' ? '#' : ''}{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: hasUnread ? 'var(--slate-300)' : 'var(--slate-400)', fontWeight: hasUnread ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {latestMsg ? (latestMsg.image ? '📸 Image' : `${latestMsg.authorId === user.id ? 'You' : users.find(u=>u.id===latestMsg.authorId)?.name || 'Someone'}: ${latestMsg.text}`) : 'No messages yet...'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Channel Modal */}
        {showCreateModal && (
          <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div className="modal-content" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>New Channel</h2>
                <button onClick={() => setShowCreateModal(false)} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              <p style={{ color: 'var(--slate-400)', marginBottom: '24px' }}>Create a new channel for your community.</p>
              <input 
                type="text"
                placeholder="Channel name (e.g. weekend-planning)" 
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateChannel()}
                style={{ width: '100%', padding: '14px 16px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white', fontSize: '1rem', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={handleCreateChannel} className="btn btn-primary" style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '16px', borderRadius: '12px' }}>
                  <Hash size={20} /> Create Channel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start New DM Modal */}
        {showNewChatModal && (
          <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div className="modal-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Start a Chat</h2>
                <button onClick={() => setShowNewChatModal(false)} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              <input 
                type="text"
                placeholder="Search community members..." 
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white', fontSize: '1rem', marginBottom: '16px' }}
              />
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {users
                  .filter(u => u.id !== user.id)
                  .filter(u => user.isAdmin || (user.joinedCommunities || []).some(cid => (communityMemberships[cid] || []).some(m => m.userId === u.id)))
                  .filter(u => !userSearchTerm || u.name.toLowerCase().includes(userSearchTerm.toLowerCase()))
                  .slice(0, 20)
                  .map(u => (
                    <div 
                      key={u.id}
                      onClick={() => {
                        setShowNewChatModal(false);
                        navigate.push(`/chat/dm/${u.id}`);
                      }}
                      className="stagger-item interactive-press"
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer' }}
                    >
                      <img src={u.avatar} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'white' }}>{u.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{u.bio || 'Member'}</div>
                      </div>
                      <MessageCircle size={18} color="var(--teal-400)" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ACTIVE CHAT VIEW
  const isDirectMessage = !!targetUserId;
  const community = isDirectMessage ? null : communities.find(c => c.id === communityId);
  const targetUser = isDirectMessage ? users.find(u => u.id === targetUserId) : null;
  const waConfig = communityId ? whatsappSettings[communityId] : null;
  
  const handleSend = async () => {
    if ((!inputText.trim() && imageFiles.length === 0) || isUploading) return;
    setIsUploading(true);
    
    let imageUrls = [];
    if (imageFiles.length > 0) {
      try {
        for (let file of imageFiles) {
          const url = await uploadImage(file);
          imageUrls.push(url);
        }
      } catch (err) {
        toast.error('Upload failed', 'Could not upload some images');
      }
    }
    
    const finalImage = imageUrls.length > 0 ? JSON.stringify(imageUrls) : '';
    
    if (isDirectMessage) {
      await sendDirectMessage(targetUserId, inputText, finalImage);
    } else {
      sendMessage(communityId, channelId, inputText, finalImage);
    }
    
    setInputText('');
    setImageFiles([]);
    setIsUploading(false);
  };

  return (
    <div className="view-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      <AppHeader 
        title={isDirectMessage ? targetUser?.name : community?.name}
        subtitle={isDirectMessage ? 'Direct Message' : `#${channelId}`}
        showBack={true}
        onBack={() => navigate.push('/chat')}
      />

      {/* WhatsApp Banners */}
      {waConfig?.groupLink && !waConfig?.businessConnected && !isDirectMessage && (
        <div style={{ background: 'rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.2)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '0.85rem', fontWeight: 500 }}>
            <MessageCircle size={16} /> <span>This community is also on WhatsApp!</span>
          </div>
          <a href={waConfig.groupLink} target="_blank" rel="noreferrer" className="interactive-press" style={{ background: '#22c55e', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            Join Group
          </a>
        </div>
      )}
      {waConfig?.businessConnected && !isDirectMessage && (
        <div style={{ background: 'rgba(34,197,94,0.05)', borderBottom: '1px solid rgba(34,197,94,0.1)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={14} color="#22c55e" />
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Messages here are officially synced to members' WhatsApp via the Business API.</span>
        </div>
      )}

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
            activeMessages.map((msg, index) => {
              const currentAuthorId = msg.senderId || msg.authorId; // Handle both schemas
              const authorObj = users.find(u => u.id === currentAuthorId) || { name: 'Unknown', id: currentAuthorId, avatar: 'https://i.pravatar.cc/150' };
              const isMe = currentAuthorId === user.id;
              const isLeader = !isDirectMessage && communityMemberships[communityId]?.find(m => m.userId === currentAuthorId)?.role === 'Leader';
              
              const prevMsg = activeMessages[index - 1];
              const nextMsg = activeMessages[index + 1];
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

              // Parse reactions
              let cleanText = msg.text || '';
              let reactions = {};
              const metaMatch = cleanText.match(/<!--REACTIONS:(.*?)-->/);
              if (metaMatch && metaMatch[1]) {
                try {
                  reactions = JSON.parse(metaMatch[1]);
                  cleanText = cleanText.replace(metaMatch[0], '');
                } catch(e) {}
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
                        <img onClick={() => navigate.push(`/profile/${msg.authorId || msg.senderId}`)} src={authorObj.avatar} alt={authorObj.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                        <div onClick={() => navigate.push(`/profile/${msg.authorId || msg.senderId}`)} style={{ fontSize: '0.75rem', color: isLeader ? 'var(--teal-400)' : 'var(--slate-400)', fontWeight: isLeader ? 600 : 400, cursor: 'pointer' }}>
                          {authorObj.name} {isLeader && '👑'}
                        </div>
                      </div>
                    )}
                    <div style={{ 
                      background: isMe ? 'var(--teal-600)' : 'rgba(255,255,255,0.05)', 
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)', 
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
                            <button key={e} onClick={() => reactToMessage(msg.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', transition: 'transform 0.1s' }} onMouseEnter={ev => ev.currentTarget.style.transform='scale(1.2)'} onMouseLeave={ev => ev.currentTarget.style.transform='scale(1)'}>
                              {e}
                            </button>
                          ))}
                        </div>
                      )}

                      {msgImages.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: msgImages.length > 1 ? '1fr 1fr' : '1fr', gap: '4px', borderRadius: '8px', overflow: 'hidden' }}>
                          {msgImages.map((img, i) => <img key={i} src={img} alt="Attachment" style={{ width: '100%', height: msgImages.length > 1 ? '120px' : 'auto', maxHeight: '250px', objectFit: 'cover' }} />)}
                        </div>
                      )}
                      
                      {cleanText && <div>{cleanText}</div>}
                      
                      {Object.keys(reactions).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {Object.entries(reactions).map(([emoji, usersArr]) => (
                            <div key={emoji} onClick={() => reactToMessage(msg.id, emoji)} style={{ background: usersArr.includes(user.id) ? (isMe ? 'rgba(255,255,255,0.2)' : 'var(--teal-600)') : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                              {emoji} <span style={{ opacity: 0.9 }}>{usersArr.length}</span>
                            </div>
                          ))}
                        </div>
                      )}

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
      </div>

      <div style={{ padding: '16px 20px', background: 'rgba(15, 23, 42, 0.9)', borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
        {imageFiles.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', overflowX: 'auto' }}>
            {Array.from(imageFiles).map((file, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--slate-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={16} color="var(--teal-400)" />
                </div>
                <button onClick={() => setImageFiles(Array.from(imageFiles).filter((_, idx) => idx !== i))} className="interactive-press" style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--slate-700)', border: 'none', color: 'white', borderRadius: '50%', padding: '2px', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={e => {
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
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '12px 20px', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(20,184,166,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button disabled={isUploading} className="btn btn-primary interactive-press" onClick={handleSend} style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isUploading ? 0.5 : 1 }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
