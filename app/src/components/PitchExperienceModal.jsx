"use client";
import React, { useState } from 'react';
import { X, Sparkles, Vote, MessageCircle, Copy, Check, ArrowRight } from 'lucide-react';
import { useToast } from './Toast';

export default function PitchExperienceModal({ experience, communities, user, onClose, onPitch }) {
  const ledCommunities = communities?.filter(c => user?.ledCommunities?.includes(c.id)) || [];
  const [selectedCommunityId, setSelectedCommunityId] = useState(ledCommunities[0]?.id || '');
  
  // Calculate upcoming Saturdays as sensible defaults
  const getUpcomingSaturday = (weeksAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7) + (weeksAhead - 1) * 7);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const [dateOption1, setDateOption1] = useState(`${getUpcomingSaturday(2)} @ 2:00 PM`);
  const [dateOption2, setDateOption2] = useState(`${getUpcomingSaturday(3)} @ 2:00 PM`);
  const [dateOption3, setDateOption3] = useState(`Keen, but need a different date`);
  const [pollQuestion, setPollQuestion] = useState(`Who's up for ${experience.title}? Vote on your preferred date:`);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    if (!selectedCommunityId) {
      toast.error('Select a community', 'Please select a community to post the poll.');
      return;
    }

    setIsSubmitting(true);
    try {
      const options = [dateOption1, dateOption2, dateOption3].filter(Boolean);
      await onPitch({
        communityId: selectedCommunityId,
        question: pollQuestion,
        options,
        experienceId: experience.id,
      });
      setCreatedSuccess(true);
      toast.success('Poll Created!', 'Your community poll is now live.');
    } catch (err) {
      toast.error('Failed to create poll', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const communityUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/community/${selectedCommunityId}` 
    : `https://www.morecommunity.app/community/${selectedCommunityId}`;

  const shareText = `Hey everyone! 🌟 Planning our next community trip: ${experience.title}. Vote for the date that works best for you here: ${communityUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(communityUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link Copied!', 'Copied poll link to clipboard.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)',
      padding: '16px'
    }}>
      <div style={{
        background: 'var(--slate-900)',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: '480px',
        borderRadius: '20px', padding: '24px',
        maxHeight: '90dvh', overflowY: 'auto',
        color: 'var(--white)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--teal-400)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Vote size={15} /> Community Interest Poll
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', margin: '4px 0 0', color: 'var(--white)' }}>
              Pitch to Community
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {!createdSuccess ? (
          <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Experience Mini Banner */}
            <div style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <img src={experience.image} alt={experience.title} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {experience.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                  From £{Math.round((experience.basePrice || 25) * 1.15)} / person • {experience.duration}
                </div>
              </div>
            </div>

            {/* Select Community */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                Select Community
              </label>
              <select
                value={selectedCommunityId}
                onChange={e => setSelectedCommunityId(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--slate-800)',
                  border: '1px solid var(--slate-700)', borderRadius: '10px',
                  color: 'var(--white)', fontSize: '0.9rem', outline: 'none'
                }}
              >
                {ledCommunities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Poll Question */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                Poll Question / Note
              </label>
              <textarea
                rows={2}
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--slate-800)',
                  border: '1px solid var(--slate-700)', borderRadius: '10px',
                  color: 'var(--white)', fontSize: '0.88rem', outline: 'none', resize: 'none'
                }}
              />
            </div>

            {/* Date Options */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                Proposed Date Options for Members to Vote On
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  required
                  placeholder="Option 1 (e.g. Sat 18 Oct @ 2pm)"
                  value={dateOption1}
                  onChange={e => setDateOption1(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'var(--slate-800)',
                    border: '1px solid var(--slate-700)', borderRadius: '10px',
                    color: 'var(--white)', fontSize: '0.85rem', outline: 'none'
                  }}
                />
                <input
                  type="text"
                  required
                  placeholder="Option 2 (e.g. Sat 25 Oct @ 2pm)"
                  value={dateOption2}
                  onChange={e => setDateOption2(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'var(--slate-800)',
                    border: '1px solid var(--slate-700)', borderRadius: '10px',
                    color: 'var(--white)', fontSize: '0.85rem', outline: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Option 3 (Optional)"
                  value={dateOption3}
                  onChange={e => setDateOption3(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'var(--slate-800)',
                    border: '1px solid var(--slate-700)', borderRadius: '10px',
                    color: 'var(--white)', fontSize: '0.85rem', outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary interactive-press"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                fontSize: '0.95rem', fontWeight: 700, marginTop: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Sparkles size={16} /> {isSubmitting ? 'Posting Poll...' : 'Post Poll to Community'}
            </button>
          </form>
        ) : (
          /* Success Screen with 1-Tap Share */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)',
              color: 'var(--teal-300)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Check size={28} />
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--white)', margin: '0 0 6px' }}>
                Poll is Live!
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', margin: 0, lineHeight: 1.5 }}>
                Your members can now vote on their preferred date in the community chat. Share the link into your WhatsApp or group chats to get fast votes!
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="interactive-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#25D366', color: '#000', padding: '14px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '0.92rem', textDecoration: 'none'
                }}
              >
                <MessageCircle size={18} /> Share to WhatsApp Group
              </a>

              <button
                onClick={handleCopy}
                className="btn btn-outline interactive-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', fontSize: '0.88rem'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Link Copied!' : 'Copy Poll Link'}
              </button>
            </div>

            <div style={{
              marginTop: '12px', padding: '12px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
              fontSize: '0.78rem', color: 'var(--slate-400)', textAlign: 'left', lineHeight: 1.5
            }}>
              💡 <strong>Next Step</strong>: Once the community votes on the winning date, return here and tap <strong>&quot;Host for my Community&quot;</strong> to lock in the tickets and booking link.
            </div>

            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--slate-400)' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
