"use client";
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  Megaphone,
  Shield,
  Briefcase,
  Check,
  Copy,
  Download,
  Loader2,
  Lock,
  Plus,
  Send,
  X,
  ChevronRight,
  MapPin,
  Clock,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { cleanLocationName } from '../lib/location';

const CONSENT_STORAGE_KEY = 'more_ai_copilot_consent_v1';

export default function LeaderAICoPilot({
  community,
  communityEvents = [],
  memberCount = 1,
  verifiedMemberCount = 1,
  isPro = false,
  onJumpToUpgrade,
  onClose,
}) {
  const { user, createEvent, createEventsBatch, createPost } = useAppContext();
  const { toast } = useToast();

  const [hasConsented, setHasConsented] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
  });
  const [activeTool, setActiveTool] = useState('planner'); // 'planner' | 'broadcast' | 'rams' | 'sponsor'

  // Tool 1: 4-Week Calendar Planner
  const [plannerFocus, setPlannerFocus] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannedEvents, setPlannedEvents] = useState([]);
  const [publishedWeeks, setPublishedWeeks] = useState({});
  const [isPublishingBatch, setIsPublishingBatch] = useState(false);

  // Tool 2: Broadcast & Social Copywriter
  const [broadcastGoal, setBroadcastGoal] = useState('Welcome newcomers & explain 1st-meetup Verified Local unlocks');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Tool 3 & 4: Leader Pro RAMS & Sponsor/Grant Docs
  const [selectedEventId, setSelectedEventId] = useState(communityEvents[0]?.id || '');
  const [ramsNotes, setRamsNotes] = useState('');
  const [pitchType, setPitchType] = useState('sponsor'); // 'sponsor' | 'grant'
  const [pitchNotes, setPitchNotes] = useState('');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const hasProAccess = Boolean(isPro || user?.isAdmin || community?.is_insured || community?.insurance_tier === 'pro');
  const communityLoc = cleanLocationName(community?.location_name) || 'Tunbridge Wells';

  const nextUpcomingEvent = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = (communityEvents || [])
      .filter((e) => e.status !== 'cancelled' && e.status !== 'proposed' && (!e.date || e.date >= today))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    return upcoming[0] || communityEvents[0] || null;
  }, [communityEvents]);

  const handleAcceptConsent = () => {
    setHasConsented(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      } catch {}
    }
  };

  const handleGenerateFourWeekPlan = async () => {
    setIsPlanning(true);
    setPublishedWeeks({});
    try {
      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'plan-month',
          prompt: plannerFocus.trim() || 'Balanced 4-week schedule of welcoming local meetups',
          communityName: community?.name || 'Local Community',
          communityLocation: communityLoc,
          communityTags: community?.tags || [],
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.events) && data.events.length > 0) {
        setPlannedEvents(data.events);
        toast.success('4-Week Plan Ready! ✨', 'Review each week below and publish with one tap.');
      } else {
        toast.error('Could not generate plan', data?.error || 'Please try again.');
      }
    } catch (err) {
      toast.error('Planner Error', err?.message || 'Failed to generate 4-week plan.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handlePublishSinglePlannedEvent = async (ev, idx) => {
    if (!community?.id || publishedWeeks[idx]) return;
    try {
      await createEvent(community.id, {
        title: ev.title,
        description: ev.description,
        date: ev.date,
        time: ev.time || '10:00',
        location: ev.location || communityLoc,
        maxCapacity: Number(ev.maxCapacity) || 25,
        ticketPrice: Number(ev.ticketPrice) || 0,
        image: community?.image || community?.cover_image || null,
        status: 'published',
      });
      setPublishedWeeks((prev) => ({ ...prev, [idx]: true }));
      toast.success('Event Published! 🗓️', `"${ev.title}" is now live on your community calendar.`);
    } catch (err) {
      toast.error('Publish Failed', err?.message || 'Could not publish event.');
    }
  };

  const handlePublishAllPlannedEvents = async () => {
    const remaining = plannedEvents.filter((_, idx) => !publishedWeeks[idx]);
    if (!community?.id || remaining.length === 0) return;
    setIsPublishingBatch(true);
    try {
      await createEventsBatch(
        community.id,
        remaining.map((ev) => ({
          title: ev.title,
          description: ev.description,
          date: ev.date,
          time: ev.time || '10:00',
          location: ev.location || communityLoc,
          maxCapacity: Number(ev.maxCapacity) || 25,
          ticketPrice: Number(ev.ticketPrice) || 0,
          image: community?.image || community?.cover_image || null,
        }))
      );
      const allMarked = {};
      plannedEvents.forEach((_, i) => {
        allMarked[i] = true;
      });
      setPublishedWeeks(allMarked);
      toast.success('4-Week Calendar Published! 🎉', `Added ${remaining.length} events to ${community.name}.`);
    } catch (err) {
      toast.error('Batch Publish Failed', err?.message || 'Could not publish batch.');
    } finally {
      setIsPublishingBatch(false);
    }
  };

  const handleGenerateBroadcastCopy = async (customGoal) => {
    const goalToUse = customGoal || broadcastGoal;
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'copilot-broadcast',
          prompt: goalToUse,
          communityName: community?.name || 'Local Community',
          communityLocation: communityLoc,
          memberCount,
          nextEventTitle: nextUpcomingEvent?.title || 'our next weekend meetup',
          nextEventDate: nextUpcomingEvent?.date
            ? `${nextUpcomingEvent.date}${nextUpcomingEvent.time ? ' at ' + nextUpcomingEvent.time : ''}`
            : 'this weekend',
        }),
      });
      const data = await res.json();
      if (data?.inAppAnnouncement) {
        setGeneratedCopy(data);
      } else {
        toast.error('Copy Generation Failed', data?.error || 'Please try again.');
      }
    } catch (err) {
      toast.error('Error', err?.message || 'Could not draft copy.');
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleSendInAppAnnouncement = async () => {
    if (!generatedCopy?.inAppAnnouncement || !community?.id) return;
    setIsSendingBroadcast(true);
    try {
      await createPost(
        community.id,
        generatedCopy.inAppAnnouncement,
        null,
        { app: true },
        {
          title: generatedCopy.announcementTitle || `📢 ${community.name} Update`,
          link: `/community/${community.id}`,
        }
      );
      toast.success('Announcement Published! 📢', `Posted to ${community.name} feed and notified members.`);
    } catch (err) {
      toast.error('Broadcast Failed', err?.message || 'Could not post announcement.');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleGenerateProDocument = async (docTypeOverride) => {
    const type = docTypeOverride || (activeTool === 'rams' ? 'rams' : pitchType);
    const chosenEvent =
      communityEvents.find((e) => e.id === selectedEventId) || nextUpcomingEvent || communityEvents[0];
    setIsGeneratingDoc(true);
    setGeneratedDoc(null);
    try {
      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'copilot-pro-doc',
          docType: type,
          prompt:
            type === 'rams'
              ? ramsNotes.trim() || 'Standard outdoor/venue community gathering'
              : pitchNotes.trim() || 'Local community partnership',
          communityName: community?.name || 'Local Community',
          communityLocation: communityLoc,
          memberCount,
          verifiedCount: verifiedMemberCount,
          eventsHosted: Math.max(1, communityEvents.length),
          eventTitle: chosenEvent?.title || `${community?.name || 'Community'} Meetup`,
          eventLocation: chosenEvent?.location || communityLoc,
        }),
      });
      const data = await res.json();
      if (data?.document) {
        setGeneratedDoc(data);
        toast.success('Document Generated ✨', data.title || 'Ready to review below.');
      } else {
        toast.error('Generation Failed', data?.error || 'Please try again.');
      }
    } catch (err) {
      toast.error('Error', err?.message || 'Could not generate document.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} Copied! ✓`, 'Ready to paste.');
    } catch {
      toast.error('Copy failed', 'Please select and copy manually.');
    }
  };

  const downloadTextFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded! 📄', `${filename} saved to your device.`);
  };

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1.5px solid var(--hairline-border-strong)',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '22px',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.14)',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--brand-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem',
                  color: 'var(--ink-primary)',
                }}
              >
                More AI Community Co-Pilot
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'var(--brand-secondary-soft)',
                  color: 'var(--brand-secondary)',
                  border: '1px solid rgba(58, 142, 118, 0.3)',
                }}
              >
                LEADER STUDIO
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.79rem', color: 'var(--ink-secondary)' }}>
              Plan 4 weeks of events, draft broadcasts, and generate UK RAMS &amp; sponsor pitches for{' '}
              <strong>{community?.name}</strong>.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="interactive-press"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border)',
              color: 'var(--ink-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Close AI Co-Pilot"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Apple App Store 5.1.1(i) & GDPR First-Time Consent Disclosure */}
      {!hasConsented ? (
        <div
          style={{
            padding: '18px',
            borderRadius: '16px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--hairline-border-strong)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={18} color="var(--brand-secondary)" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
              Privacy &amp; AI Transparency Notice
            </span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
            More AI Co-Pilot uses <strong>Google Gemini</strong> to help you draft event schedules, community
            announcements, risk assessments, and sponsorship proposals.
            <br />• <strong>What is shared:</strong> Only your community&apos;s public title ({community?.name}), town (
            {communityLoc}), activity tags, and aggregate member count ({memberCount}).
            <br />• <strong>What is NEVER shared:</strong> Private member names, emails, phone numbers, or 1:1 direct
            messages are never sent to third-party AI.
            <br />• <strong>You are in control:</strong> Nothing is ever published or sent to members until you review
            and tap Publish.
          </p>
          <button
            type="button"
            onClick={handleAcceptConsent}
            className="btn btn-primary interactive-press"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.86rem',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={15} /> Agree &amp; Open AI Co-Pilot
          </button>
        </div>
      ) : (
        <>
          {/* 4 Tool Tabs (2 Free Growth Tools + 2 Leader Pro Concierge Tools) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            {[
              { id: 'planner', icon: Calendar, label: '4-Week Planner', badge: 'Free' },
              { id: 'broadcast', icon: Megaphone, label: 'Social & Broadcast', badge: 'Free' },
              { id: 'rams', icon: Shield, label: 'UK Council RAMS', badge: 'Pro' },
              { id: 'sponsor', icon: Briefcase, label: 'Sponsor & Grant Pitch', badge: 'Pro' },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTool === t.id;
              const isProBadge = t.badge === 'Pro';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(t.id);
                    setGeneratedDoc(null);
                  }}
                  className="interactive-press"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: active ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                    border: active ? '1.5px solid var(--brand-accent)' : '1px solid var(--hairline-border)',
                    color: active ? '#FFFFFF' : 'var(--ink-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontWeight: 700, fontSize: '0.8rem' }}>
                    <Icon size={15} />
                    <span>{t.label}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      background: active
                        ? 'rgba(255,255,255,0.22)'
                        : isProBadge
                        ? 'rgba(217, 119, 6, 0.16)'
                        : 'var(--brand-secondary-soft)',
                      color: active ? '#FFFFFF' : isProBadge ? '#D97706' : 'var(--brand-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TOOL 1: 4-WEEK CALENDAR PLANNER (FREE) */}
          {activeTool === 'planner' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="text"
                  value={plannerFocus}
                  onChange={(e) => setPlannerFocus(e.target.value)}
                  className="input"
                  placeholder={`Optional theme (e.g. "Saturday morning walks & mid-week coffee in ${communityLoc}")...`}
                  style={{ flex: 1, minWidth: '220px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleGenerateFourWeekPlan}
                  disabled={isPlanning}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    cursor: isPlanning ? 'wait' : 'pointer',
                  }}
                >
                  {isPlanning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isPlanning ? 'Planning 4 Weeks...' : 'Auto-Plan Next 4 Weeks'}
                </button>
              </div>

              {plannedEvents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-secondary)' }}>
                      4-Week Draft Schedule for {community?.name}
                    </span>
                    <button
                      type="button"
                      onClick={handlePublishAllPlannedEvents}
                      disabled={isPublishingBatch || plannedEvents.every((_, i) => publishedWeeks[i])}
                      className="btn btn-primary interactive-press"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isPublishingBatch ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {plannedEvents.every((_, i) => publishedWeeks[i])
                        ? 'All 4 Published ✓'
                        : 'Publish All 4 Events to Calendar'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {plannedEvents.map((ev, idx) => {
                      const isPublished = Boolean(publishedWeeks[idx]);
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--surface-elevated)',
                            border: isPublished
                              ? '1.5px solid var(--brand-secondary)'
                              : '1px solid var(--hairline-border-strong)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '10px',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: 'var(--teal-300)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                marginBottom: '4px',
                              }}
                            >
                              {ev.weekLabel || `Week ${idx + 1}`}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--ink-primary)', marginBottom: '6px' }}>
                              {ev.title}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--ink-secondary)', marginBottom: '8px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={12} color="var(--brand-accent)" /> {ev.date}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} color="var(--brand-accent)" /> {ev.time || '10:00'}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={12} color="var(--brand-secondary)" /> {ev.location}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '0.77rem',
                                color: 'var(--ink-secondary)',
                                lineHeight: 1.45,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {ev.description}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isPublished}
                            onClick={() => handlePublishSinglePlannedEvent(ev, idx)}
                            className="interactive-press"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: isPublished ? 'var(--brand-secondary-soft)' : 'var(--surface-card)',
                              border: isPublished
                                ? '1px solid rgba(58, 142, 118, 0.35)'
                                : '1px solid var(--hairline-border-strong)',
                              color: isPublished ? 'var(--brand-secondary)' : 'var(--ink-primary)',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: isPublished ? 'default' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                          >
                            {isPublished ? (
                              <>
                                <Check size={14} /> Published to Calendar
                              </>
                            ) : (
                              <>
                                <Plus size={14} /> Publish Week {idx + 1}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 2: BROADCAST & WHATSAPP COPYWRITER (FREE) */}
          {activeTool === 'broadcast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  {
                    label: '👋 Welcome Newcomers & Explain 1st-Meetup Unlocks',
                    goal: 'Welcome newcomers & explain 1st-meetup Verified Local unlocks',
                  },
                  {
                    label: '🗓️ Rally RSVPs for Next Meetup',
                    goal: 'Rally RSVPs and carpool coordination for our next meetup',
                  },
                  {
                    label: '📸 Post-Meetup Thank You & Photo Prompt',
                    goal: 'Thank attendees after a meetup and ask them to upload photos to the private attendee gallery',
                  },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setBroadcastGoal(preset.goal);
                      handleGenerateBroadcastCopy(preset.goal);
                    }}
                    className="interactive-press"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: broadcastGoal === preset.goal ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                      border:
                        broadcastGoal === preset.goal
                          ? '1px solid var(--brand-accent)'
                          : '1px solid var(--hairline-border)',
                      color: broadcastGoal === preset.goal ? 'var(--teal-300)' : 'var(--ink-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={broadcastGoal}
                  onChange={(e) => setBroadcastGoal(e.target.value)}
                  className="input"
                  placeholder="What would you like to announce?"
                  style={{ flex: 1, minWidth: '220px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleGenerateBroadcastCopy()}
                  disabled={isGeneratingCopy}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isGeneratingCopy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGeneratingCopy ? 'Drafting...' : 'Draft Multi-Channel Copy'}
                </button>
              </div>

              {generatedCopy && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {/* In-App Broadcast */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--teal-300)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        📢 In-App Feed &amp; Push Alert
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink-primary)', marginBottom: '6px' }}>
                        {generatedCopy.announcementTitle}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {generatedCopy.inAppAnnouncement}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendInAppAnnouncement}
                      disabled={isSendingBroadcast}
                      className="btn btn-primary interactive-press"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {isSendingBroadcast ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Publish to Community Feed &amp; Notify
                    </button>
                  </div>

                  {/* WhatsApp Copy */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase', marginBottom: '6px' }}>
                        💬 WhatsApp Group Broadcast
                      </div>
                      <div style={{ fontSize: '0.79rem', color: 'var(--ink-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {generatedCopy.whatsappCopy}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedCopy.whatsappCopy, 'WhatsApp message')}
                      className="interactive-press"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border-strong)',
                        color: 'var(--ink-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Copy size={14} /> Copy for WhatsApp
                    </button>
                  </div>

                  {/* Instagram Copy */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '6px' }}>
                        📸 Instagram Caption
                      </div>
                      <div style={{ fontSize: '0.79rem', color: 'var(--ink-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {generatedCopy.instagramCopy}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedCopy.instagramCopy, 'Instagram caption')}
                      className="interactive-press"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border-strong)',
                        color: 'var(--ink-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Copy size={14} /> Copy Instagram Caption
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 3: UK COUNCIL RAMS & RISK ASSESSMENT GENERATOR (LEADER PRO) */}
          {activeTool === 'rams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: hasProAccess ? 'var(--brand-secondary-soft)' : 'rgba(217, 119, 6, 0.10)',
                  border: hasProAccess ? '1px solid rgba(58, 142, 118, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-primary)', lineHeight: 1.45 }}>
                  <strong>🛡️ UK Council &amp; Venue RAMS Generator:</strong>{' '}
                  {hasProAccess
                    ? 'Active with your Leader Pro plan. Generate and download full Venue & Trail Risk Assessments for any event.'
                    : 'Preview a bespoke Risk Assessment below. Full export & unlimited custom RAMS are included in Leader Pro (£15/mo along with 2% ticket fees).'}
                </div>
                {!hasProAccess && onJumpToUpgrade && (
                  <button
                    type="button"
                    onClick={onJumpToUpgrade}
                    className="interactive-press"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      background: 'var(--brand-accent)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    View Leader Pro →
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                    Select Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.84rem' }}
                  >
                    {communityEvents.length === 0 ? (
                      <option value="">General {community?.name} Meetup</option>
                    ) : (
                      communityEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({ev.date || 'Upcoming'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                    Specific Hazards / Terrain Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={ramsNotes}
                    onChange={(e) => setRamsNotes(e.target.value)}
                    className="input"
                    placeholder="e.g. Woodland path, dogs on leads, lakeside..."
                    style={{ width: '100%', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleGenerateProDocument('rams')}
                  disabled={isGeneratingDoc}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  {isGeneratingDoc ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                  {isGeneratingDoc ? 'Generating RAMS Assessment...' : 'Generate UK Council RAMS'}
                </button>
              </div>
            </div>
          )}

          {/* TOOL 4: LOCAL SPONSOR & GRANT PITCH WRITER (LEADER PRO) */}
          {activeTool === 'sponsor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'sponsor', label: '☕ Local Business Sponsorship Pitch (£15 / £49 tier)' },
                  { id: 'grant', label: '🏛️ UK Council / National Lottery Micro-Grant Pitch' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPitchType(opt.id);
                      setGeneratedDoc(null);
                    }}
                    className="interactive-press"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '999px',
                      background: pitchType === opt.id ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                      border:
                        pitchType === opt.id
                          ? '1.5px solid var(--brand-accent)'
                          : '1px solid var(--hairline-border)',
                      color: pitchType === opt.id ? 'var(--teal-300)' : 'var(--ink-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={pitchNotes}
                  onChange={(e) => setPitchNotes(e.target.value)}
                  className="input"
                  placeholder={
                    pitchType === 'sponsor'
                      ? `Optional target business (e.g. "The Black Dog Café in ${communityLoc}")...`
                      : 'Optional grant focus (e.g. "Winter indoor venue hire & mental health first aid")...'
                  }
                  style={{ flex: 1, minWidth: '220px', fontSize: '0.84rem' }}
                />
                <button
                  type="button"
                  onClick={() => handleGenerateProDocument(pitchType)}
                  disabled={isGeneratingDoc}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  {isGeneratingDoc ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGeneratingDoc
                    ? 'Drafting Pitch...'
                    : pitchType === 'sponsor'
                    ? 'Draft Sponsor Proposal'
                    : 'Draft Grant Statement'}
                </button>
              </div>
            </div>
          )}

          {/* GENERATED PRO DOCUMENT VIEWER (FOR RAMS / SPONSOR / GRANT) */}
          {(activeTool === 'rams' || activeTool === 'sponsor') && generatedDoc && (
            <div
              style={{
                marginTop: '14px',
                padding: '16px',
                borderRadius: '14px',
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border-strong)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginBottom: '10px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--ink-primary)' }}>
                  {generatedDoc.title}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedDoc.document, generatedDoc.title)}
                    className="interactive-press"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9px',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border-strong)',
                      color: 'var(--ink-primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Copy Full Text
                  </button>
                  {hasProAccess ? (
                    <button
                      type="button"
                      onClick={() =>
                        downloadTextFile(
                          `${(community?.id || 'community')}-${activeTool}-${new Date().toISOString().split('T')[0]}.md`,
                          generatedDoc.document
                        )
                      }
                      className="btn btn-primary interactive-press"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '9px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Download size={13} /> Download (.md)
                    </button>
                  ) : (
                    onJumpToUpgrade && (
                      <button
                        type="button"
                        onClick={onJumpToUpgrade}
                        className="interactive-press"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '9px',
                          background: 'rgba(217, 119, 6, 0.16)',
                          border: '1px solid rgba(217, 119, 6, 0.35)',
                          color: '#D97706',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Lock size={12} /> Export with Leader Pro
                      </button>
                    )
                  )}
                </div>
              </div>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  fontSize: '0.81rem',
                  color: 'var(--ink-secondary)',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '360px',
                  overflowY: 'auto',
                }}
              >
                {generatedDoc.document}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
