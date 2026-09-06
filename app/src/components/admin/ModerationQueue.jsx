import React, { useState } from 'react';
import { Shield, AlertTriangle, Check, X, MessageCircle, User } from 'lucide-react';
import { useToast } from '../Toast';

// Mock moderation data
const INITIAL_QUEUE = [
  { id: 'M1', type: 'post', content: 'This event looks like a scam...', author: 'User123', reportedBy: 3, status: 'pending', date: '2026-09-06T10:00:00' },
  { id: 'M2', type: 'user', content: 'Inappropriate profile picture', author: 'Spammer99', reportedBy: 5, status: 'pending', date: '2026-09-05T14:30:00' },
];

export default function ModerationQueue() {
  const { toast } = useToast();
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [filter, setFilter] = useState('pending');

  const filteredQueue = queue.filter(q => q.status === filter);

  const handleAction = (id, action) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: action } : q));
    toast.success('Action Taken', `Content marked as ${action}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Trust & Safety Queue</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Review flagged content and user reports.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setFilter('pending')} className="btn" style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', background: filter === 'pending' ? 'white' : 'rgba(255,255,255,0.05)', color: filter === 'pending' ? 'black' : 'var(--slate-300)', border: 'none' }}>Pending</button>
          <button onClick={() => setFilter('resolved')} className="btn" style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', background: filter === 'resolved' ? 'white' : 'rgba(255,255,255,0.05)', color: filter === 'resolved' ? 'black' : 'var(--slate-300)', border: 'none' }}>Resolved</button>
          <button onClick={() => setFilter('dismissed')} className="btn" style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', background: filter === 'dismissed' ? 'white' : 'rgba(255,255,255,0.05)', color: filter === 'dismissed' ? 'black' : 'var(--slate-300)', border: 'none' }}>Dismissed</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredQueue.map(item => (
          <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', borderLeft: item.type === 'user' ? '4px solid #ef4444' : '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                {item.type === 'user' ? <User size={20} color="#ef4444" /> : <MessageCircle size={20} color="#f59e0b" />}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 600, marginBottom: '4px' }}>
                  {item.type === 'user' ? 'Reported User: ' : 'Flagged Content: '}
                  <span style={{ fontWeight: 400 }}>{item.author}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', marginBottom: '8px' }}>
                  "{item.content}"
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={12} /> Reported by {item.reportedBy} users • {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {item.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleAction(item.id, 'resolved')} className="btn interactive-press" style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                  <Shield size={14} /> Take Action
                </button>
                <button onClick={() => handleAction(item.id, 'dismissed')} className="btn interactive-press" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-300)', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                  <X size={14} /> Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
        {filteredQueue.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <Check size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            No {filter} items in the queue.
          </div>
        )}
      </div>
    </div>
  );
}
