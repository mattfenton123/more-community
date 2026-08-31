"use client";
import { useState } from 'react';
import { BarChart2, Check } from 'lucide-react';

/**
 * Renders an inline poll card in the chat feed.
 * Props:
 *  - poll: { id, question, options: [{text, votes}], created_by }
 *  - currentUserId: string
 *  - userVote: number | null (option_index the user voted for, or null)
 *  - onVote: (pollId, optionIndex) => void
 */
export default function PollCard({ poll, currentUserId, userVote, onVote }) {
  const [voted, setVoted] = useState(userVote !== null && userVote !== undefined);
  const [selectedIndex, setSelectedIndex] = useState(userVote);

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  const handleVote = (index) => {
    if (voted) return;
    setVoted(true);
    setSelectedIndex(index);
    onVote(poll.id, index);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '20px',
      maxWidth: '100%',
      width: '100%',
    }}>
      {/* Poll header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <BarChart2 size={16} color="var(--teal-400)" />
        <span style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Poll</span>
      </div>

      {/* Question */}
      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--white)', marginBottom: '16px', lineHeight: 1.4 }}>
        {poll.question}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {poll.options.map((opt, i) => {
          const votes = opt.votes || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = selectedIndex === i;

          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              disabled={voted}
              className="interactive-press"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: isSelected ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                border: isSelected ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                color: 'var(--white)',
                cursor: voted ? 'default' : 'pointer',
                overflow: 'hidden',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              {/* Progress bar background */}
              {voted && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isSelected ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              )}

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                {isSelected && <Check size={14} color="var(--teal-400)" />}
                <span style={{ fontWeight: isSelected ? 600 : 400, fontSize: '0.9rem' }}>{opt.text}</span>
              </div>

              {voted && (
                <span style={{ position: 'relative', fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--teal-400)' : 'var(--slate-400)' }}>
                  {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vote count */}
      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • {voted ? 'You voted' : 'Tap to vote'}
      </div>
    </div>
  );
}
