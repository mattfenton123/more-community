"use client";
import React, { useState, useEffect } from 'react';
import { Info, X, CheckCircle2, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'more_seen_explainers_v1';

export function hasSeenExplainer(key) {
  if (typeof window === 'undefined' || !key) return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const seen = raw ? JSON.parse(raw) : {};
    return Boolean(seen[key]);
  } catch {
    return false;
  }
}

export function markExplainerSeen(key) {
  if (typeof window === 'undefined' || !key) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const seen = raw ? JSON.parse(raw) : {};
    seen[key] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // ignore storage errors
  }
}

export const EXPLAINER_CONTENT = {
  // Leader explainers
  leader_events: {
    badge: 'Leader Guide',
    title: 'Events, AI Studio & Flyers',
    summary: 'Everything you need to plan, promote, and run great in-person events without juggling five different apps.',
    steps: [
      'Use AI Co-Pilot or Magic AI Draft to turn a rough sentence into a full event, poll, or broadcast in seconds.',
      'Click "Flyer & Poster" on any event to export a print-ready poster for local cafes and noticeboards.',
      'On the day, open Attendee Check-In or the QR Scanner on your phone to check members in with one tap.'
    ],
    tip: 'You can duplicate any past event or set a recurring schedule (weekly, fortnightly, or monthly) in one click.'
  },
  leader_people: {
    badge: 'Member CRM & Automation',
    title: 'Keep Members Coming Back',
    summary: 'See who is active, who might be slipping away, and let automated messages welcome newcomers for you.',
    steps: [
      'Member CRM automatically groups members into Active, Engaged, Slipping, and Inactive based on attendance.',
      'Automated Triggers send friendly welcome notes to new joiners and reminders before events.',
      'Use Broadcasts, Community Polls, or the Idea Board to ask members what they want to do next.'
    ],
    tip: 'A quick personal message to a "Slipping" member is the easiest way to bring them back to your next event.'
  },
  leader_monetisation: {
    badge: 'Funding & Payouts',
    title: 'Fund Your Community, Not Out-of-Pocket',
    summary: 'Accept paid memberships, sell event tickets, or partner with local sponsors so your club pays for itself.',
    steps: [
      'Connect your UK bank once via Stripe to receive automated Faster Payments payouts.',
      'Local business sponsorships send 80% straight to your club fund.',
      'Platform fee is 5% on paid tickets (reduced to 2% on Leader Pro), plus standard Stripe card fees.'
    ],
    tip: 'Free community events always cost £0 to host and £0 for members to RSVP.'
  },
  leader_experiences: {
    badge: 'Specialist Vault',
    title: 'Book Vetted Coaches & Specialists',
    summary: 'Bring guest instructors, wellbeing coaches, or creative teachers to your group without chasing invoices.',
    steps: [
      'Browse specialists with verified qualifications and £5M insurance cover.',
      'Review 1-on-1 session pitches from local providers in one tap - zero inbox spam.',
      'Ticketed guest sessions hold funds safely in 24-48h post-event escrow.'
    ],
    tip: 'You can add a club fund markup to guest experiences, and 100% of your markup goes straight to your club.'
  },
  leader_network: {
    badge: 'Town Network',
    title: 'Co-Host & Grow Sister Chapters',
    summary: 'Team up with other local communities to cross-promote events or expand into neighbouring towns.',
    steps: [
      "Use \"Promote to My Community\" to share a partner group's network event onto your calendar.",
      'Assign trusted deputy co-hosts so no community relies on just one person.',
      'Launch sister chapters in nearby towns using your proven event format.'
    ],
    tip: 'Shared leadership prevents organiser burnout and keeps your calendar active even when you are away.'
  },
  leader_pro: {
    badge: 'Leader Pro (£16.50/mo or £165/yr)',
    title: 'Safety Packs, Trust Shield & Lower Fees',
    summary: 'Optional upgrade for organisers running regular events, venue hires, or paid tickets.',
    steps: [
      'Includes a Verified Organiser Trust Shield on your community page plus priority waitlist access to our upcoming group PLI scheme.',
      'Generate 1-click PDF council and venue safety (RAMS) packs plus digital member safety check-ins.',
      'Cuts your platform ticket fee from 5% down to 2% and boosts local discovery.'
    ],
    tip: 'You never need Leader Pro to start a free community - upgrade only when you want venue safety packs or lower ticket fees.'
  },
  leader_crm_card: {
    badge: 'Member CRM',
    title: 'How Member Engagement Tiers Work',
    summary: 'More Community tracks event check-ins automatically so you know how healthy your community is at a glance.',
    steps: [
      'Active & Engaged: Members attending regularly or recently.',
      'Slipping: Members who used to attend but have missed recent events.',
      'Inactive: Members who have not checked in for a while and may appreciate a friendly check-in.'
    ],
    tip: 'Using QR Check-In at events keeps these numbers accurate automatically.'
  },
  leader_flyer: {
    badge: 'Flyer & Poster Studio',
    title: 'Print-Ready Posters in Seconds',
    summary: 'Turn any event into a clean, branded poster for local coffee shops, community boards, or Instagram.',
    steps: [
      'Pick a layout and choose from 20 fonts with your event QR code built right in.',
      'Anyone scanning the QR code lands straight on your event RSVP page.',
      'Download as an image or PDF ready to print or share.'
    ],
    tip: 'Putting a poster in the café where you meet is one of the fastest ways to reach non-app locals.'
  },
  // Member explainers
  member_ticket: {
    badge: 'Your Digital Pass',
    title: 'How Your Event Ticket Works',
    summary: 'No printing needed. Your pass stays saved on your phone even if you lose mobile signal.',
    steps: [
      'Show your QR code to the host when you arrive for a 1-second check-in.',
      'Tap "Add to Calendar" so you get an automatic reminder before the event.',
      'Bringing a friend? Add them with a +1 Guest Pass (no extra sign-up needed, free on free events).'
    ],
    tip: 'Check the exact meeting pin on your ticket before setting off so you know right where to find the group.'
  },
  member_carpool: {
    badge: 'Carpool Hub',
    title: 'Share a Lift Safely',
    summary: 'Coordinate rides with fellow attendees without giving out your personal phone number.',
    steps: [
      'Drivers can offer spare seats with their rough pickup area and departure time.',
      'Members without transport can request a seat in one tap.',
      'Pickup details are shared privately once the driver confirms your seat.'
    ],
    tip: 'Sharing a lift is a great way to break the ice before you even arrive at the event.'
  },
  member_ideas: {
    badge: 'Idea Board',
    title: 'Shape What Your Community Does Next',
    summary: 'Have an idea for a workshop, coffee morning, walk, or social? Pitch it to the group.',
    steps: [
      'Post a quick title and rough idea - no need to organise everything yourself.',
      'Other members upvote the ideas they would love to attend.',
      'Leaders can turn popular ideas into official events on the calendar in one click.'
    ],
    tip: 'Even a simple "Anyone fancy a Thursday evening board game night?" can spark a regular meetup.'
  },
  member_discover: {
    badge: 'Explore Communities',
    title: 'Find Groups & Events Your Way',
    summary: 'Switch between List, Map, or Swipe view to discover what is happening nearby.',
    steps: [
      'Use category pills to filter by interests like Creative, Fitness, Social, or Walking.',
      'Switch to Map view to see events and groups right around your neighbourhood.',
      'Tap any group to preview upcoming events before you join.'
    ],
    tip: 'Joining a community is always free, and you can leave or mute notifications anytime.'
  }
};

export function ExplainerModal({ isOpen, onClose, badge, title, summary, steps = [], tip, onAction, actionLabel }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(18, 18, 18, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--surface-card)',
          border: '1px solid rgba(242, 114, 87, 0.35)',
          borderRadius: '20px',
          padding: '22px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          color: 'var(--ink-primary)',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close explainer"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '30px',
            height: '30px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--ink-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={15} />
        </button>

        {badge && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--brand-accent)',
            background: 'rgba(235, 87, 56, 0.14)',
            border: '1px solid rgba(242, 114, 87, 0.3)',
            borderRadius: '999px',
            padding: '4px 10px',
            marginBottom: '10px'
          }}>
            <Sparkles size={12} /> {badge}
          </div>
        )}

        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink-primary)', paddingRight: '28px', lineHeight: 1.25 }}>
          {title}
        </h3>

        {summary && (
          <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--ink-secondary)' }}>
            {summary}
          </p>
        )}

        {steps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: tip ? '14px' : '18px' }}>
            {steps.map((s, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)'
              }}>
                <CheckCircle2 size={16} color="#F27257" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.84rem', lineHeight: 1.45, color: 'var(--ink-primary)' }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {tip && (
          <div style={{
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'rgba(235, 87, 56, 0.1)',
            border: '1px solid rgba(235, 87, 56, 0.25)',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: 'var(--ink-primary)',
            marginBottom: '16px'
          }}>
            <strong style={{ color: 'var(--brand-accent)' }}>Tip:</strong> {tip}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={() => { onAction(); onClose(); }}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(242, 114, 87, 0.4)',
                background: 'rgba(235, 87, 56, 0.15)',
                color: 'var(--brand-accent)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #EB5738, #D94628)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InfoExplainer({ explainerKey, badge, title, summary, steps, tip, size = 15, label, style = {} }) {
  const [open, setOpen] = useState(false);
  const preset = explainerKey ? EXPLAINER_CONTENT[explainerKey] : null;
  const resolved = {
    badge: badge || preset?.badge,
    title: title || preset?.title || 'How this works',
    summary: summary || preset?.summary || '',
    steps: steps || preset?.steps || [],
    tip: tip || preset?.tip
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        title={`Learn about ${resolved.title}`}
        aria-label={`Explain ${resolved.title}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          width: label ? 'auto' : `${size + 8}px`,
          height: `${size + 8}px`,
          padding: label ? '0 8px' : '0',
          borderRadius: '999px',
          border: '1px solid rgba(242, 114, 87, 0.35)',
          background: 'rgba(235, 87, 56, 0.12)',
          color: 'var(--brand-accent)',
          cursor: 'pointer',
          verticalAlign: 'middle',
          flexShrink: 0,
          fontSize: '0.72rem',
          fontWeight: 600,
          ...style
        }}
      >
        <Info size={size} />
        {label && <span>{label}</span>}
      </button>

      <ExplainerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        {...resolved}
      />
    </>
  );
}

export function FeatureUnlockModal({ featureKey, enabled = true }) {
  const [open, setOpen] = useState(false);
  const preset = featureKey ? EXPLAINER_CONTENT[featureKey] : null;

  useEffect(() => {
    if (!enabled || !featureKey || !preset) return;
    if (!hasSeenExplainer(featureKey)) {
      const timer = setTimeout(() => setOpen(true), 220);
      return () => clearTimeout(timer);
    }
  }, [featureKey, enabled, preset]);

  if (!preset) return null;

  const handleClose = () => {
    markExplainerSeen(featureKey);
    setOpen(false);
  };

  return (
    <ExplainerModal
      isOpen={open}
      onClose={handleClose}
      badge={preset.badge}
      title={preset.title}
      summary={preset.summary}
      steps={preset.steps}
      tip={preset.tip}
    />
  );
}
