"use client";
import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Share2, Calendar, Settings, Sparkles, MessageCircle, Copy, ExternalLink, Image as ImageIcon, Plus } from 'lucide-react';
import { useToast } from './Toast';

export default function LeaderSetupChecklist({ community, events = [], onOpenEventModal, onOpenSettings, onOpenPitchModal }) {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!community) return null;

  // Determine completion of steps
  const hasCover = Boolean(community.image || community.cover_image);
  const hasDescription = Boolean(community.description && community.description.trim().length >= 20);
  const hasProfile = hasCover && hasDescription;
  
  const communityEvents = events.filter(e => e.communityId === community.id);
  const hasEvents = communityEvents.length > 0;

  const hasGuidelines = Boolean(community.guidelines && community.guidelines.length > 0);
  const hasSocial = Boolean(community.whatsapp_group || community.whatsapp || community.instagram);

  const steps = [
    {
      id: 'profile',
      title: 'Complete Profile & Cover Photo',
      subtitle: 'Upload a banner and tell members what your community is about',
      completed: hasProfile,
      actionLabel: hasProfile ? 'Edit Details' : 'Add Cover & Info',
      icon: ImageIcon,
      onClick: onOpenSettings
    },
    {
      id: 'event',
      title: 'Schedule First Event or Pitch',
      subtitle: 'Give members a date and reason to meet in real life',
      completed: hasEvents,
      actionLabel: hasEvents ? 'Add Another Event' : 'Create First Event',
      icon: Calendar,
      onClick: onOpenEventModal
    },
    {
      id: 'guidelines',
      title: 'Set Community Guidelines',
      subtitle: 'Create welcoming norms and safety expectations',
      completed: hasGuidelines,
      actionLabel: hasGuidelines ? 'Review Rules' : 'Add Guidelines',
      icon: Settings,
      onClick: () => onOpenSettings ? onOpenSettings('guidelines') : null
    },
    {
      id: 'invite',
      title: 'Invite Founding Members',
      subtitle: 'Share your 1-tap invite link directly to WhatsApp or socials',
      completed: hasSocial || (community.members > 1),
      actionLabel: 'Share Link',
      icon: Share2,
      onClick: () => handleCopyInvite()
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleCopyInvite = () => {
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/community/${community.id}`
      : `https://www.morecommunity.app/community/${community.id}`;
    
    const shareText = `Join our new community "${community.name}" on more.! Connect with local members and join our upcoming events: ${shareUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Invite link copied!', 'Ready to paste into WhatsApp, email, or social media.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/community/${community.id}`
      : `https://www.morecommunity.app/community/${community.id}`;
    const text = encodeURIComponent(`Hey! I've just set up our community "${community.name}" on more. Join us here: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(30,41,59,0.7) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(20,184,166,0.3)',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={18} color="var(--teal-400)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--white)', fontWeight: 800 }}>
                Leader Setup Checklist
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '99px',
                background: progressPercent === 100 ? 'rgba(34,197,94,0.2)' : 'rgba(20,184,166,0.2)',
                color: progressPercent === 100 ? '#4ade80' : 'var(--teal-300)',
                border: progressPercent === 100 ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(20,184,166,0.3)'
              }}>
                {completedCount} of {steps.length} Complete ({progressPercent}%)
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
              Follow these simple steps to successfully launch {community.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="interactive-press"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 8px',
            color: 'var(--slate-400)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem'
          }}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{
        marginTop: '14px',
        height: '6px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '99px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: progressPercent === 100 
            ? 'linear-gradient(90deg, #22c55e, #10b981)'
            : 'linear-gradient(90deg, var(--teal-400), #3b82f6)',
          borderRadius: '99px',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* Checklist items */}
      {!isCollapsed && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map(step => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  background: step.completed ? 'rgba(255,255,255,0.02)' : 'rgba(20,184,166,0.05)',
                  border: step.completed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(20,184,166,0.2)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ color: step.completed ? '#22c55e' : 'var(--slate-500)', display: 'flex', alignItems: 'center' }}>
                    {step.completed ? <CheckCircle2 size={20} color="#22c55e" /> : <Circle size={20} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: step.completed ? 'var(--slate-200)' : 'var(--white)',
                      textDecoration: step.completed ? 'none' : 'none'
                    }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {step.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {step.id === 'invite' && (
                    <button
                      onClick={handleShareWhatsApp}
                      className="btn btn-outline interactive-press"
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '8px',
                        borderColor: '#22c55e',
                        color: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Share to WhatsApp"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </button>
                  )}
                  {step.onClick && (
                    <button
                      onClick={step.onClick}
                      className={`btn ${step.completed ? 'btn-outline' : 'btn-primary'} interactive-press`}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {step.id === 'invite' && (copied ? 'Copied!' : 'Copy Link')}
                      {step.id !== 'invite' && step.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick Action Bar for Leaders */}
          <div style={{
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
              Need help launching? Leaders get free 1-on-1 launch support from the more. team.
            </span>
            <button
              onClick={() => handleCopyInvite()}
              className="btn btn-outline interactive-press"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                borderColor: 'var(--teal-500)',
                color: 'var(--teal-300)'
              }}
            >
              <Copy size={13} /> {copied ? 'Link Copied!' : 'Copy Member Invite Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
