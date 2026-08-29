"use client";
import { useState } from 'react';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users, ChevronRight, Hash, Search, Plus, User } from 'lucide-react';
import { FALLBACK_IMAGES } from '../../src/lib/constants';

export default function ChatIndex() {
  const { communities, user, users, isLoading } = useAppContext();
  const { directMessages, chatReadReceipts } = useChat();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('communities');
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const myCommunities = communities.filter(c => user?.joinedCommunities?.includes(c.id));

  // Build DM conversations list
  const dmConversations = [];
  if (user) {
    const dmPartners = new Set();
    directMessages.forEach(dm => {
      if (dm.senderId === user.id) dmPartners.add(dm.receiverId);
      if (dm.receiverId === user.id) dmPartners.add(dm.senderId);
    });
    dmPartners.forEach(partnerId => {
      const partner = users.find(u => u.id === partnerId);
      if (!partner) return;
      const conversation = directMessages.filter(m =>
        (m.senderId === user.id && m.receiverId === partnerId) ||
        (m.senderId === partnerId && m.receiverId === user.id)
      ).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      const lastMessage = conversation[conversation.length - 1];
      
      // Check unread
      const receipt = chatReadReceipts.find(r => !r.community_id && r.channel_id === partnerId);
      const isUnread = lastMessage && lastMessage.senderId !== user.id && 
        (!receipt || new Date(receipt.last_read_at) < new Date(lastMessage.created_at || new Date().toISOString()));

      dmConversations.push({ partner, lastMessage, isUnread });
    });
    dmConversations.sort((a, b) => new Date(b.lastMessage?.created_at || 0) - new Date(a.lastMessage?.created_at || 0));
  }

  // Users for new DM modal
  const searchedUsers = users.filter(u => 
    u.id !== user?.id && 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', paddingBottom: '100px' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'white', marginBottom: '24px' }}>Chat</div>
        <div style={{ color: 'var(--slate-400)', textAlign: 'center', padding: '60px 0' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageCircle size={24} color="var(--teal-400)" />
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'white' }}>Chat</div>
        </div>
        <button 
          onClick={() => setShowNewDM(true)}
          className="interactive-press"
          style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Plus size={18} color="var(--teal-400)" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '3px' }}>
        {['communities', 'direct'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: activeTab === tab ? 'rgba(20,184,166,0.15)' : 'transparent',
            color: activeTab === tab ? 'var(--teal-300)' : 'var(--slate-400)',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            {tab === 'communities' ? <><Hash size={14} /> Communities</> : <><User size={14} /> Direct Messages</>}
            {tab === 'direct' && dmConversations.some(c => c.isUnread) && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-400)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Communities Tab */}
      {activeTab === 'communities' && (
        <>
          {myCommunities.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <MessageCircle size={40} color="var(--slate-500)" style={{ marginBottom: '12px' }} />
              <div style={{ color: 'var(--slate-400)', fontSize: '0.95rem', marginBottom: '16px' }}>Join a community to start chatting</div>
              <button onClick={() => router.push('/discover')} className="btn btn-primary interactive-press" style={{ borderRadius: '99px' }}>
                Discover Communities
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myCommunities.map(community => (
                <div 
                  key={community.id}
                  onClick={() => router.push(`/chat/${community.id}/general`)}
                  className="interactive-press glass-panel"
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderRadius: '14px' }}
                >
                  <img 
                    src={community.image || FALLBACK_IMAGES.community} 
                    alt={community.name} 
                    style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>{community.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                      <Hash size={12} /> general
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--slate-500)" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Direct Messages Tab */}
      {activeTab === 'direct' && (
        <>
          {dmConversations.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <User size={40} color="var(--slate-500)" style={{ marginBottom: '12px' }} />
              <div style={{ color: 'var(--slate-400)', fontSize: '0.95rem', marginBottom: '16px' }}>No direct messages yet</div>
              <button onClick={() => setShowNewDM(true)} className="btn btn-primary interactive-press" style={{ borderRadius: '99px' }}>
                Start a Conversation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dmConversations.map(({ partner, lastMessage, isUnread }) => (
                <div 
                  key={partner.id}
                  onClick={() => router.push(`/chat/dm/${partner.id}`)}
                  className="interactive-press glass-panel"
                  style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderRadius: '14px' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={partner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=0D8B93&color=fff`}
                      alt={partner.name} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    {isUnread && (
                      <div style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: 'var(--teal-400)', border: '2px solid var(--slate-950)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: isUnread ? 700 : 600, fontSize: '0.95rem', marginBottom: '2px' }}>{partner.name}</div>
                    {lastMessage && (
                      <div style={{ color: isUnread ? 'var(--slate-300)' : 'var(--slate-500)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastMessage.senderId === user.id ? 'You: ' : ''}{lastMessage.text || '📷 Photo'}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} color="var(--slate-500)" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* New DM Modal */}
      {showNewDM && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewDM(false); }}
        >
          <div style={{ width: '100%', maxWidth: '500px', maxHeight: '70vh', background: 'var(--slate-900)', borderRadius: '24px 24px 0 0', padding: '24px', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'white' }}>New Message</h3>
              <button onClick={() => setShowNewDM(false)} style={{ background: 'transparent', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={16} color="var(--slate-500)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Search people..." 
                autoFocus
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {searchedUsers.map(u => (
                <button 
                  key={u.id}
                  onClick={() => { setShowNewDM(false); router.push(`/chat/dm/${u.id}`); }}
                  className="interactive-press"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <img 
                    src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D8B93&color=fff`}
                    alt={u.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{u.name}</div>
                    {u.bio && <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>{u.bio}</div>}
                  </div>
                </button>
              ))}
              {searchedUsers.length === 0 && searchTerm && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No users found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
