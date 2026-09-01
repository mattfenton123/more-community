"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, Menu, MessageCircle, ChevronLeft, Plus, Users, Hash, Image as ImageIcon, X, Smile, Megaphone, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import AppHeader from '../components/AppHeader';
import { useAppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';
import { useRouter as useNavigate, useParams, useSearchParams } from 'next/navigation';
import { SkeletonChatBubble, SkeletonLine, SkeletonAvatar } from '../components/SkeletonCard';
import { useToast } from '../components/Toast';
import { FALLBACK_IMAGES } from '../lib/constants';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function Chat() {
  const { communityId, channelId, targetUserId } = useParams();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const communityFilterId = searchParams?.get('communityId');
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState('menu'); // 'menu', 'dm', 'group', 'announcement'
  
  // Group creation state
  const [newChannelName, setNewChannelName] = useState('');
  const [createChannelCommunityId, setCreateChannelCommunityId] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const { user, communities, users, communityMemberships, uploadImage, channels, createChannel, isLoading, whatsappSettings } = useAppContext();
  const { messages, directMessages, sendMessage, sendDirectMessage, chatReadReceipts, markChatRead } = useChat();
  const { toast } = useToast();

  const onEmojiClick = (emojiObject) => {
    setInputText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

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
    let inboxItems = [];

    // Build unified inbox items
    myCommunities.forEach(c => {
      const communityChannels = channels.filter(ch => ch.community_id === c.id);
      if (communityChannels.length === 0) {
        inboxItems.push({ type: 'channel', channelType: 'text', comm: c, name: 'general', id: 'general' });
      } else {
        communityChannels.forEach(ch => {
          // Check access for private groups
          if (ch.member_ids && ch.member_ids.length > 0 && !ch.member_ids.includes(user.id) && !user.ledCommunities?.includes(c.id)) {
            return;
          }
          inboxItems.push({ 
            type: 'channel', 
            channelType: ch.type || 'text', 
            comm: c, 
            name: ch.name, 
            id: ch.id,
            memberIds: ch.member_ids
          });
        });
      }
    });

    if (directMessages && user) {
      const dmUsers = new Set();
      directMessages.forEach(dm => {
        const otherUserId = dm.senderId === user.id ? dm.receiverId : dm.senderId;
        dmUsers.add(otherUserId);
      });
      dmUsers.forEach(otherId => {
        const otherUserObj = users.find(u => u.id === otherId) || { id: otherId, name: 'Unknown User', avatar: 'https://i.pravatar.cc/150' };
        inboxItems.push({ type: 'dm', otherUser: otherUserObj, id: otherId });
      });
    }

    // Attach latest message for sorting and UI
    inboxItems = inboxItems.map(item => {
      let latestMsg = null;
      let hasUnread = false;
      if (item.type === 'dm') {
        latestMsg = directMessages.filter(m => (m.senderId === item.id && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === item.id)).pop();
        const dmReceipt = chatReadReceipts.find(r => !r.community_id && r.channel_id === item.id);
        hasUnread = latestMsg && latestMsg.senderId !== user.id && (!dmReceipt || new Date(dmReceipt.last_read_at) < new Date(latestMsg.createdAt || latestMsg.created_at || new Date().toISOString()));
      } else {
        latestMsg = messages.filter(m => m.communityId === item.comm.id && (m.channel === item.id || m.channelId === item.id)).pop();
        const commReceipt = chatReadReceipts.find(r => r.community_id === item.comm.id && r.channel_id === item.id);
        hasUnread = latestMsg && (latestMsg.authorId !== user.id && latestMsg.senderId !== user.id) && (!commReceipt || new Date(commReceipt.last_read_at) < new Date(latestMsg.createdAt || latestMsg.created_at || new Date().toISOString()));
      }
      return {
        ...item,
        latestMsg,
        hasUnread,
        sortTime: latestMsg?.createdAt 
          ? new Date(latestMsg.createdAt).getTime() 
          : (latestMsg?.created_at 
              ? new Date(latestMsg.created_at).getTime() 
              : (item.created_at ? new Date(item.created_at).getTime() : 0))
      };
    }).filter(item => {
      if (!communityFilterId) return true;
      return item.comm?.id === communityFilterId;
    }).sort((a, b) => b.sortTime - a.sortTime);

    const handleCreateChannel = async (type = 'text', members = null) => {
      if (!newChannelName.trim()) return;
      const targetCommunity = createChannelCommunityId || user.ledCommunities?.[0] || myCommunities[0]?.id;
      if (!targetCommunity) return;
      
      await createChannel(targetCommunity, newChannelName.trim(), type, members);
      toast.success('Chat created!', `${newChannelName.trim()} is now live`);
      
      setNewChannelName('');
      setSelectedMembers([]);
      setShowCreateModal(false);
    };

    return (
      <div className="view-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AppHeader title="Chats" />
        
        {communityFilterId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(20,184,166,0.1)', borderBottom: '1px solid rgba(20,184,166,0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--teal-300)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={14} /> Showing filtered community chats
            </div>
            <button onClick={() => navigate.push('/chat')} style={{ background: 'transparent', border: 'none', color: 'var(--teal-400)', cursor: 'pointer', padding: '4px' }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>
          {isLoading ? (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="stagger-item" style={{ display: 'flex', gap: '16px', padding: '12px 0' }}>
                  <SkeletonAvatar size={48} round />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <SkeletonLine width="60%" height="14px" />
                    <SkeletonLine width="80%" height="12px" />
                  </div>
                </div>
              ))}
            </div>
          ) : inboxItems.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--slate-400)', gap: '16px' }}>
              <MessageCircle size={48} opacity={0.5} />
              <p>No messages yet. Start a new chat!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {inboxItems.map((item, i) => {
                const title = item.type === 'dm' ? item.otherUser.name : item.name;
                
                let displayTitle = title;
                let displaySubtitle = item.type !== 'dm' ? item.comm.name : null;

                if (item.type !== 'dm' && title.toLowerCase() === 'general') {
                  displayTitle = item.comm.name;
                  displaySubtitle = 'General Chat';
                }
                
                let avatar = item.type === 'dm' 
                  ? (item.otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherUser.name)}&background=0D8B93&color=fff`)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayTitle)}&background=1e293b&color=2dd4bf`;
                
                if (item.type !== 'dm' && title.toLowerCase() === 'general') {
                  avatar = item.comm.image || FALLBACK_IMAGES.community;
                }
                
                let Icon = Hash;
                if (item.type === 'dm') Icon = MessageCircle;
                else if (item.channelType === 'announcement') Icon = Megaphone;
                else if (item.channelType === 'group' || item.memberIds) Icon = Lock;
                
                const currentUserId = user?.id;
                const msgAuthorId = item.latestMsg?.authorId || item.latestMsg?.senderId;
                const isMe = msgAuthorId === currentUserId;
                const authorName = users.find(u => u.id === msgAuthorId)?.name || 'Someone';

                return (
                  <div 
                    key={`${item.type}-${item.id}-${i}`} 
                    onClick={() => navigate.push(item.type === 'dm' ? `/chat/dm/${item.id}` : `/community/${item.comm.id}/chat/${item.id}`)}
                    className="stagger-item interactive-press"
                    style={{ display: 'flex', gap: '16px', padding: '16px 20px', cursor: 'pointer', transition: 'background 0.2s', position: 'relative' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div 
                      onClick={(e) => {
                        if (item.type !== 'dm' && item.comm?.id) {
                          e.stopPropagation();
                          navigate.push(`/chat?communityId=${item.comm.id}`);
                        }
                      }}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', background: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}
                    >
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--slate-800)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--slate-950)' }}>
                        <Icon size={12} color="var(--teal-400)" />
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <div style={{ fontWeight: item.hasUnread ? 700 : 600, fontSize: '1.05rem', color: item.hasUnread ? 'white' : 'var(--slate-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {displayTitle}
                          </div>
                          {displaySubtitle && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {displaySubtitle}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: item.hasUnread ? 'var(--teal-400)' : 'var(--slate-500)', fontWeight: item.hasUnread ? 600 : 400 }}>
                          {item.latestMsg?.timestamp?.split(' ')[0] || ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: item.hasUnread ? 'var(--slate-300)' : 'var(--slate-400)', fontWeight: item.hasUnread ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {item.latestMsg ? (
                            <>
                              {item.type !== 'dm' && <span style={{ color: 'var(--slate-500)' }}>{isMe ? 'You' : authorName}: </span>}
                              {item.latestMsg.image ? '📸 Image' : item.latestMsg.text}
                            </>
                          ) : <span style={{ fontStyle: 'italic', color: 'var(--slate-500)' }}>No messages yet</span>}
                        </div>
                        {item.hasUnread && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--teal-400)', flexShrink: 0 }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 50 }}>
          <button 
            onClick={() => { setCreateMode('menu'); setShowCreateModal(true); }}
            className="interactive-press"
            style={{ background: 'var(--teal-500)', color: 'white', width: '56px', height: '56px', borderRadius: '28px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(20,184,166,0.4)', cursor: 'pointer' }}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* New Chat Modal */}
        {showCreateModal && (
          <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
            <div className="modal-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
                  {createMode === 'menu' && 'New Chat'}
                  {createMode === 'dm' && 'New Direct Message'}
                  {createMode === 'group' && 'New Group'}
                  {createMode === 'announcement' && 'New Announcement'}
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Menu Mode */}
              {createMode === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => setCreateMode('dm')} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageCircle size={20} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>New Direct Message</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>1-on-1 private chat</div>
                    </div>
                  </button>
                  <button onClick={() => setCreateMode('group')} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="var(--teal-400)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>New Group Chat</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Create a private group for an event or topic</div>
                    </div>
                  </button>
                  {user.ledCommunities?.length > 0 && (
                    <button onClick={() => setCreateMode('announcement')} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', color: 'white', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Megaphone size={20} color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>New Announcement</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Read-only broadcast channel for members</div>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* DM / Contacts Mode */}
              {createMode === 'dm' && (
                <>
                  <input type="text" placeholder="Search members..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px 16px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', marginBottom: '16px' }} />
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {users.filter(u => u.id !== user.id && (!userSearchTerm || u.name.toLowerCase().includes(userSearchTerm.toLowerCase()))).slice(0, 20).map(u => (
                      <div key={u.id} onClick={() => { setShowCreateModal(false); navigate.push(`/chat/dm/${u.id}`); }} className="stagger-item interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer' }}>
                        <img src={u.avatar} alt={u.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--white)' }}>{u.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Group / Announcement Mode */}
              {(createMode === 'group' || createMode === 'announcement') && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <input type="text" placeholder={createMode === 'group' ? "Group Name" : "Announcement Name"} value={newChannelName} onChange={e => setNewChannelName(e.target.value)} style={{ width: '100%', padding: '14px 16px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', marginBottom: '16px' }} />
                  
                  {myCommunities.length > 1 && (
                    <select value={createChannelCommunityId || myCommunities[0]?.id} onChange={e => setCreateChannelCommunityId(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', color: 'var(--white)', border: '1px solid var(--slate-700)', borderRadius: '8px', marginBottom: '16px' }}>
                      {myCommunities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {createMode === 'group' && (
                    <>
                      <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px' }}>Select Members (Optional)</div>
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                        {users.filter(u => u.id !== user.id).slice(0, 10).map(u => (
                          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={(e) => {
                              if (e.target.checked) setSelectedMembers([...selectedMembers, u.id]);
                              else setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                            }} />
                            <img src={u.avatar} alt={u.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                            <span>{u.name}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  <button 
                    onClick={() => handleCreateChannel(createMode, selectedMembers.length > 0 ? [user.id, ...selectedMembers] : null)} 
                    disabled={!newChannelName.trim()}
                    className="btn btn-primary" 
                    style={{ padding: '16px', borderRadius: '12px', opacity: !newChannelName.trim() ? 0.5 : 1 }}
                  >
                    Create {createMode === 'group' ? 'Group' : 'Announcement'}
                  </button>
                </div>
              )}
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
  
  const currentChannelObj = channels.find(c => c.id === channelId);
  const isLeader = !isDirectMessage && communityMemberships[communityId]?.find(m => m.userId === user.id)?.role === 'Leader';
  const isReadOnly = currentChannelObj?.type === 'announcement' && !isLeader;

  const handleSend = async () => {
    if ((!inputText.trim() && !imageFile) || isReadOnly) return;
    
    setIsUploading(true);
    let imageUrl = '';
    
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (err) {
        toast.error('Upload failed', 'Could not upload image');
        setIsUploading(false);
        return;
      }
    }
    
    if (isDirectMessage) {
      await sendDirectMessage(targetUserId, inputText, imageUrl);
    } else {
      sendMessage(communityId, channelId, inputText, imageUrl);
    }
    
    setInputText('');
    setImageFile(null);
    setIsUploading(false);
  };

  return (
    <div className="view-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AppHeader 
        title={isDirectMessage ? targetUser?.name : (currentChannelObj?.name || channelId)}
        subtitle={isDirectMessage ? 'Direct Message' : community?.name}
        showBack={true}
        onBack={() => navigate.back()}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
            {isDirectMessage ? `This is the start of your direct messages with ${targetUser?.name}.` : 
             currentChannelObj?.type === 'announcement' ? `This is an announcement channel for ${community?.name}.` :
             `This is the start of the ${currentChannelObj?.name} chat for ${community?.name}.`}
          </div>

          {isLoading ? (
            <>
              <SkeletonChatBubble align="left" />
              <SkeletonChatBubble align="right" />
              <SkeletonChatBubble align="left" />
            </>
          ) : (
            activeMessages.map((msg, index) => {
              const currentAuthorId = msg.senderId || msg.authorId; 
              const authorObj = users.find(u => u.id === currentAuthorId) || { name: 'Unknown', id: currentAuthorId, avatar: 'https://i.pravatar.cc/150' };
              const isMe = currentAuthorId === user.id;
              const authorIsLeader = !isDirectMessage && communityMemberships[communityId]?.find(m => m.userId === currentAuthorId)?.role === 'Leader';
              
              const prevMsg = activeMessages[index - 1];
              const nextMsg = activeMessages[index + 1];
              const prevAuthorId = prevMsg ? (prevMsg.senderId || prevMsg.authorId) : null;
              const nextAuthorId = nextMsg ? (nextMsg.senderId || nextMsg.authorId) : null;
              
              const isConsecutive = prevAuthorId === currentAuthorId;
              const isLastConsecutive = nextAuthorId !== currentAuthorId;
              const showDate = index === 0 || (prevMsg && new Date(msg.created_at || new Date()).getDate() !== new Date(prevMsg.created_at || new Date()).getDate());

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '24px 0 16px 0', fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {msg.timestamp ? msg.timestamp.split(' ')[0] : 'Today'}
                    </div>
                  )}
                  <div className="stagger-item" style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', marginTop: isConsecutive ? '2px' : '16px' }}>
                    {!isMe && !isConsecutive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', marginLeft: '4px' }}>
                        <img onClick={() => navigate.push(isDirectMessage ? '#' : `/chat/dm/${authorObj.id}`)} src={authorObj.avatar} alt={authorObj.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <div onClick={() => navigate.push(isDirectMessage ? '#' : `/chat/dm/${authorObj.id}`)} style={{ fontSize: '0.8rem', color: authorIsLeader ? 'var(--teal-400)' : 'var(--slate-400)', fontWeight: authorIsLeader ? 600 : 500, cursor: 'pointer' }}>
                          {authorObj.name} {authorIsLeader && '👑'}
                        </div>
                      </div>
                    )}
                    <div style={{ 
                      background: isMe ? 'var(--teal-600)' : 'rgba(255,255,255,0.08)', 
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)', 
                      padding: '12px 16px', 
                      borderRadius: isMe 
                        ? `18px ${isConsecutive ? '4px' : '18px'} ${isLastConsecutive ? '2px' : '4px'} 18px` 
                        : `${isConsecutive ? '4px' : '18px'} 18px 18px ${isLastConsecutive ? '2px' : '4px'}`, 
                      fontSize: '0.95rem', 
                      color: isMe ? 'white' : 'var(--slate-100)',
                      lineHeight: 1.45,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: 'relative'
                    }}>
                      {msg.image && <img src={msg.image} alt="Attachment" style={{ width: '100%', borderRadius: '8px', maxHeight: '250px', objectFit: 'cover' }} />}
                      {msg.text && <div>{msg.text}</div>}
                      {isLastConsecutive && (
                        <div style={{ fontSize: '0.65rem', alignSelf: 'flex-end', opacity: 0.7, marginTop: '2px' }}>
                          {msg.timestamp?.split(' ')[1] || ''}
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

      {!isReadOnly ? (
        <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 10, position: 'relative' }}>
          {imageFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px' }}>
              <ImageIcon size={16} color="var(--teal-400)" />
              <span style={{ fontSize: '0.85rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{imageFile.name}</span>
              <button onClick={() => setImageFile(null)} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <label className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', padding: '8px', cursor: 'pointer', display: 'flex', margin: 0 }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                  e.target.value = null;
                }} 
                style={{ display: 'none' }} 
              />
              <ImageIcon size={20} />
            </label>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="interactive-press" style={{ background: 'none', border: 'none', color: showEmojiPicker ? 'var(--teal-400)' : 'var(--slate-400)', padding: '8px', cursor: 'pointer', display: 'flex' }}>
              <Smile size={20} />
            </button>
            {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '100%', left: '0', zIndex: 100, width: '100%', padding: '0 10px 10px 10px' }}>
                <div style={{ maxWidth: '350px', width: '100%', margin: '0 auto', background: 'var(--slate-900)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width="100%" height={320} />
                </div>
              </div>
            )}
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message..."
              style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', padding: '12px 16px', color: 'var(--white)', fontSize: '0.95rem', outline: 'none' }}
            />
            <button disabled={isUploading || (!inputText.trim() && !imageFile)} className="btn btn-primary interactive-press" onClick={handleSend} style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isUploading || (!inputText.trim() && !imageFile)) ? 0.5 : 1 }}>
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
  );
}
