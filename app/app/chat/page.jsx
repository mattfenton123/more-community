"use client";
import { useAppContext } from '../../src/context/AppContext';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users, ChevronRight, Hash } from 'lucide-react';

export default function ChatIndex() {
  const { communities, user, isLoading } = useAppContext();
  const router = useRouter();

  const myCommunities = communities.filter(c => user?.joinedCommunities?.includes(c.id));

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <MessageCircle size={24} color="var(--teal-400)" />
        <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'white' }}>Chat</div>
      </div>

      {myCommunities.length === 0 ? (
        <div style={{ 
          padding: '40px 24px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '16px', 
          border: '1px dashed rgba(255,255,255,0.1)' 
        }}>
          <MessageCircle size={40} color="var(--slate-500)" style={{ marginBottom: '12px' }} />
          <div style={{ color: 'var(--slate-400)', fontSize: '0.95rem' }}>Join a community to start chatting</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {myCommunities.map(community => (
            <div 
              key={community.id}
              onClick={() => router.push(`/chat/${community.id}/general`)}
              className="interactive-press glass-panel"
              style={{ 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                cursor: 'pointer',
                borderRadius: '14px'
              }}
            >
              <img 
                src={community.image} 
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
    </div>
  );
}
