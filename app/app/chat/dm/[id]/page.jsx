"use client";
import { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, Image as ImageIcon, X } from 'lucide-react';
import { useAppContext } from '../../../../src/context/AppContext';
import { useChat } from '../../../../src/context/ChatContext';
import { useRouter, useParams } from 'next/navigation';

export default function DirectMessage() {
  const { id: targetUserId } = useParams();
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { user, users, uploadImage } = useAppContext();
  const { directMessages, sendDirectMessage, markChatRead } = useChat();

  const targetUser = users.find(u => u.id === targetUserId);

  const activeMessages = directMessages.filter(m =>
    (m.senderId === user?.id && m.receiverId === targetUserId) ||
    (m.senderId === targetUserId && m.receiverId === user?.id)
  ).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  useEffect(() => {
    if (targetUserId) markChatRead(null, targetUserId);
  }, [targetUserId, activeMessages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

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

  if (!targetUser) {
    return (
      <div style={{ padding: '40px', color: 'var(--slate-400)', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px' }}>User not found</div>
        <button onClick={() => router.push('/chat')} className="btn btn-primary" style={{ borderRadius: '99px' }}>Back to Chat</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--slate-950)' }}>
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

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-500)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👋</div>
            <div style={{ fontSize: '0.9rem' }}>Say hello to {targetUser.name}!</div>
          </div>
        )}
        {activeMessages.map((msg, i) => {
          const isOwn = msg.senderId === user?.id;
          const author = isOwn ? user : targetUser;
          return (
            <div key={msg.id || i} style={{ display: 'flex', gap: '8px', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
              {!isOwn && (
                <img 
                  src={author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.name || 'U')}&background=0D8B93&color=fff`}
                  alt="" 
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isOwn ? 'var(--teal-600)' : 'var(--slate-800)',
                border: isOwn ? 'none' : '1px solid var(--slate-700)',
              }}>
                {msg.image && <img src={msg.image} alt="" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : 0 }} />}
                {msg.text && <div style={{ color: isOwn ? 'white' : 'var(--slate-200)', fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</div>}
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
        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => setImageFile(e.target.files[0])} />
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
  );
}
