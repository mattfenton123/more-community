"use client";
import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Share2,
  Calendar,
  Settings,
  Sparkles,
  MessageCircle,
  Copy,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from './Toast';
import { useAppContext } from '../context/AppContext';
import { getCommunitySlug } from '../lib/communityLinks';

export default function LeaderSetupChecklist({
  community,
  events = [],
  onOpenEventModal,
  onOpenSettings,
}) {
  const { toast } = useToast();
  const { communities, theme } = useAppContext();
  const isLight = theme === 'light';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!community) return null;

  const commSlug = getCommunitySlug(community, communities);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/community/${commSlug}`
      : `https://www.morecommunity.app/community/${commSlug}`;

  const hasCover = Boolean(community.image || community.cover_image);
  const hasDescription = Boolean(community.description && community.description.trim().length >= 20);
  const hasProfile = hasCover && hasDescription;

  const communityEvents = events.filter((e) => e.communityId === community.id);
  const hasEvents = communityEvents.length > 0;

  const hasGuidelines = Boolean(community.guidelines && community.guidelines.length > 0);
  const hasSocial = Boolean(community.whatsapp_group || community.whatsapp || community.instagram);

  const handleCopyInvite = () => {
    const shareText = `Join our community "${community.name}" on More Community! Connect with local members and join our upcoming meetups: ${shareUrl}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Invite link copied!', 'Ready to paste into WhatsApp, email, or social media.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! I've set up our community "${community.name}" on More Community. Join us and see our upcoming meetups here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const steps = [
    {
      id: 'profile',
      title: 'Complete Profile & Cover Photo',
      subtitle: 'Upload a banner and tell members what your community is about',
      completed: hasProfile,
      actionLabel: hasProfile ? 'Edit Details' : 'Add Cover & Info',
      icon: ImageIcon,
      onClick: onOpenSettings,
    },
    {
      id: 'event',
      title: 'Schedule First Event or Pitch',
      subtitle: 'Give members a date and reason to meet in real life',
      completed: hasEvents,
      actionLabel: hasEvents ? 'Add Another Event' : 'Create First Event',
      icon: Calendar,
      onClick: onOpenEventModal,
    },
    {
      id: 'guidelines',
      title: 'Set Community Guidelines',
      subtitle: 'Create welcoming norms and safety expectations',
      completed: hasGuidelines,
      actionLabel: hasGuidelines ? 'Review Rules' : 'Add Guidelines',
      icon: Settings,
      onClick: () => (onOpenSettings ? onOpenSettings('guidelines') : null),
    },
    {
      id: 'invite',
      title: 'Invite Founding Members',
      subtitle: 'Share your 1-tap invite link directly to WhatsApp or socials',
      completed: hasSocial || community.members > 1,
      actionLabel: 'Share Link',
      icon: Share2,
      onClick: handleCopyInvite,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const greenInk = isLight ? '#15803D' : '#4ADE80';
  const greenBg = isLight ? 'rgba(21, 128, 61, 0.11)' : 'rgba(58, 142, 118, 0.2)';
  const greenBorder = isLight ? 'rgba(21, 128, 61, 0.28)' : 'rgba(74, 222, 128, 0.3)';

  return (
    <div
      className="leader-setup-checklist-card"
      style={{
        background: 'var(--surface-card)',
        borderRadius: '18px',
        border: '1px solid var(--hairline-border-strong)',
        padding: '18px 20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--brand-accent-soft)',
              border: '1px solid rgba(235, 87, 56, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} color="var(--brand-accent)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.02rem',
                  color: 'var(--ink-primary)',
                  fontWeight: 700,
                }}
              >
                Leader Setup Checklist
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: progressPercent === 100 ? greenBg : 'var(--brand-accent-soft)',
                  color: progressPercent === 100 ? greenInk : 'var(--teal-300)',
                  border:
                    progressPercent === 100
                      ? `1px solid ${greenBorder}`
                      : '1px solid rgba(235, 87, 56, 0.28)',
                }}
              >
                {completedCount} of {steps.length} Complete ({progressPercent}%)
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
              Follow these steps to launch {community.name}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
          className="interactive-press"
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '8px',
            padding: '6px 8px',
            color: 'var(--ink-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          marginTop: '14px',
          height: '7px',
          background: 'var(--surface-elevated)',
          border: '1px solid var(--hairline-border)',
          borderRadius: '99px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: progressPercent === 100 ? '#15803D' : 'var(--brand-accent)',
            borderRadius: '99px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Checklist items */}
      {!isCollapsed && (
        <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '11px 14px',
                background: step.completed ? 'var(--surface-elevated)' : 'var(--surface-canvas)',
                border: step.completed
                  ? '1px solid var(--hairline-border)'
                  : '1px solid rgba(235, 87, 56, 0.28)',
                borderRadius: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ color: step.completed ? greenInk : 'var(--ink-muted)', display: 'flex', alignItems: 'center' }}>
                  {step.completed ? <CheckCircle2 size={19} color={greenInk} /> : <Circle size={19} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--ink-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {step.subtitle}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {step.id === 'invite' && (
                  <button
                    onClick={handleShareWhatsApp}
                    className="interactive-press"
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      background: greenBg,
                      border: `1px solid ${greenBorder}`,
                      color: greenInk,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                    title="Share to WhatsApp"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                )}
                {step.onClick && (
                  <button
                    onClick={step.onClick}
                    className={step.completed ? 'interactive-press' : 'btn btn-primary interactive-press'}
                    style={
                      step.completed
                        ? {
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '8px',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--hairline-border-strong)',
                            color: 'var(--ink-primary)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }
                        : {
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                          }
                    }
                  >
                    {step.id === 'invite' ? (copied ? 'Copied!' : 'Copy Link') : step.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Quick Action Bar */}
          <div
            style={{
              marginTop: '6px',
              paddingTop: '12px',
              borderTop: '1px solid var(--hairline-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
              Need help launching? Leaders get free 1-on-1 launch support from the More Community team.
            </span>
            <button
              onClick={handleCopyInvite}
              className="interactive-press"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--brand-accent-soft)',
                border: '1px solid var(--brand-accent)',
                color: 'var(--teal-300)',
                cursor: 'pointer',
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
