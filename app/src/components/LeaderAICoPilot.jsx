"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  RotateCcw,
  MapPin,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { cleanLocationName } from '../lib/location';

const CONSENT_STORAGE_KEY = 'more_ai_copilot_consent_v1';

function normalizeActionCard(card) {
  if (!card || !card.type) return null;
  if (card.type === 'events') {
    const events = Array.isArray(card.data?.events)
      ? card.data.events
      : Array.isArray(card.events)
      ? card.events
      : [];
    if (events.length === 0) return null;
    return {
      type: 'events',
      title: card.title || (events.length === 1 ? 'Launch New Meetup' : 'Draft Meetup Schedule'),
      data: { events },
    };
  }
  if (card.type === 'poll') {
    const question = card.data?.question || card.question || '';
    const options = Array.isArray(card.data?.options)
      ? card.data.options
      : Array.isArray(card.options)
      ? card.options
      : [];
    if (!question || options.length < 2) return null;
    return {
      type: 'poll',
      title: card.title || 'Launch Community Poll',
      data: { question, options },
    };
  }
  if (card.type === 'broadcast') {
    const inAppTitle = card.data?.inAppTitle || card.announcementTitle || '';
    const inAppBody = card.data?.inAppBody || card.inAppAnnouncement || card.body || '';
    const whatsappCopy = card.data?.whatsappCopy || card.whatsappCopy || '';
    const instagramCopy = card.data?.instagramCopy || card.instagramCopy || '';
    return {
      type: 'broadcast',
      title: card.title || 'Ready-to-Send Community Copy',
      data: { inAppTitle, inAppBody, whatsappCopy, instagramCopy },
    };
  }
  if (card.type === 'document') {
    const content = card.data?.content || card.document || card.content || '';
    if (!content) return null;
    return {
      type: 'document',
      title: card.title || 'Generated Community Document',
      data: { content, docType: card.docType || card.data?.docType || 'rams' },
    };
  }
  return null;
}

export default function LeaderAICoPilot({
  community,
  communityEvents = [],
  memberCount = 1,
  verifiedMemberCount = 1,
  isPro = false,
  onJumpToUpgrade,
  onClose,
}) {
  const { user, createEvent, createEventsBatch, createPost, createFeedPost, createPoll } = useAppContext();
  const { toast } = useToast();

  const [hasConsented, setHasConsented] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
  });

  const hasProAccess = Boolean(
    isPro || user?.isAdmin || community?.is_insured || community?.insurance_tier === 'pro'
  );
  const communityLoc = cleanLocationName(community?.location_name) || 'Tunbridge Wells';

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return (communityEvents || [])
      .filter((e) => e.status !== 'cancelled' && e.status !== 'proposed' && (!e.date || e.date >= today))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  }, [communityEvents]);

  const nextUpcomingEvent = upcomingEvents[0] || communityEvents[0] || null;

  const buildInitialMessages = () => {
    const commName = community?.name || 'your community';
    const nextNote = nextUpcomingEvent
      ? `Your next meetup on the calendar is "${nextUpcomingEvent.title}" (${nextUpcomingEvent.date || 'soon'} at ${nextUpcomingEvent.time || '10:00'}).`
      : `You don't have an upcoming meetup scheduled on the calendar yet — we can sketch out your next few weeks whenever you're ready.`;

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        reply: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your **${commName}** Co-Pilot.\n\nI can see you have **${memberCount} member${memberCount === 1 ? '' : 's'}** (${verifiedMemberCount} Verified Local${verifiedMemberCount === 1 ? '' : 's'} who have attended in person). ${nextNote}\n\nTalk to me like a co-organiser — tell me what you're thinking of planning, ask how to re-engage quiet newcomers, or ask me to draft your next 4 weeks of events, a WhatsApp message, a UK Council RAMS, or a local sponsor pitch. You can always reply to tweak anything I draft.`,
        actionCard: null,
        suggestedReplies: [
          '🗓️ Plan our next 4 weeks of meetups',
          '👋 Draft a warm WhatsApp message for newcomers',
          '💡 How do I get quiet members to attend their first meetup?',
          '🛡️ Draft a UK Council Risk Assessment (RAMS)',
        ],
      },
    ];
  };

  const [messages, setMessages] = useState(() => buildInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Track published / copied action states per message ID
  const [publishedEventsMap, setPublishedEventsMap] = useState({});
  const [publishingBatchMap, setPublishingBatchMap] = useState({});
  const [sendingBroadcastMap, setSendingBroadcastMap] = useState({});
  const [sentBroadcastMap, setSentBroadcastMap] = useState({});
  const [launchingPollMap, setLaunchingPollMap] = useState({});
  const [launchedPollMap, setLaunchedPollMap] = useState({});
  const [activeModelLabel, setActiveModelLabel] = useState('Gemini 3.6 Flash');

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  const handleAcceptConsent = () => {
    setHasConsented(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      } catch {}
    }
  };

  const handleResetChat = () => {
    setMessages(buildInitialMessages());
    setInputValue('');
  };

  const handleSendMessage = async (textOverride = null) => {
    const text = (textOverride !== null ? textOverride : inputValue).trim();
    if (!text || isThinking) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      reply: text,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (textOverride === null) setInputValue('');
    setIsThinking(true);

    try {
      const compactHistory = nextHistory.slice(-10).map((m) => ({
        role: m.role,
        content:
          m.role === 'assistant' && m.actionCard
            ? `${m.reply}\n[Generated ${m.actionCard.type}: ${m.actionCard.title || ''}]`
            : m.reply,
      }));

      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'copilot-chat',
          prompt: text,
          history: compactHistory,
          communityName: community?.name || 'Local Community',
          communityLocation: communityLoc,
          communityTags: community?.tags || [],
          memberCount,
          verifiedCount: verifiedMemberCount,
          upcomingEvents: upcomingEvents.slice(0, 5).map((e) => ({
            title: e.title,
            date: e.date,
            time: e.time,
            location: cleanLocationName(e.location) || communityLoc,
          })),
        }),
      });

      const data = await res.json();
      if (data?.modelUsed) {
        setActiveModelLabel(data.modelUsed.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
      }
      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        reply:
          data?.reply ||
          "I've put together a recommendation for you below. Tell me if you'd like to adjust the tone, dates, or format!",
        actionCard: normalizeActionCard(data?.actionCard),
        suggestedReplies: Array.isArray(data?.suggestedReplies) ? data.suggestedReplies : [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          reply:
            "I hit a brief connection snag while thinking that through. Try sending that again or tap one of the quick options below!",
          actionCard: null,
          suggestedReplies: [
            '🗓️ Plan our next 4 weeks of meetups',
            '👋 Draft a warm WhatsApp message for newcomers',
          ],
        },
      ]);
      toast.error('Co-Pilot connection error', err?.message || 'Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  const handlePublishSingleEvent = async (msgId, ev, idx) => {
    if (!community?.id) return;
    const key = `${msgId}-${idx}`;
    if (publishedEventsMap[key]) return;
    try {
      await createEvent(community.id, {
        title: ev.title,
        description: ev.description,
        date: ev.date,
        time: ev.time || '10:00',
        location: ev.location || communityLoc,
        maxCapacity: Number(ev.maxCapacity) || 25,
        ticketPrice: Number(ev.ticketPrice) || 0,
        status: 'published',
      });
      setPublishedEventsMap((prev) => ({ ...prev, [key]: true }));
      toast.success('Event Published! 🎉', `"${ev.title}" is now live on your community calendar.`);
    } catch (err) {
      toast.error('Could not publish event', err?.message || 'Please try again.');
    }
  };

  const handlePublishAllEventsInCard = async (msgId, eventsList) => {
    if (!community?.id || !Array.isArray(eventsList) || eventsList.length === 0) return;
    const unpub = eventsList
      .map((ev, idx) => ({ ev, idx }))
      .filter(({ idx }) => !publishedEventsMap[`${msgId}-${idx}`]);
    if (unpub.length === 0) return;

    setPublishingBatchMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const payloads = unpub.map(({ ev }) => ({
        title: ev.title,
        description: ev.description,
        date: ev.date,
        time: ev.time || '10:00',
        location: ev.location || communityLoc,
        maxCapacity: Number(ev.maxCapacity) || 25,
        ticketPrice: Number(ev.ticketPrice) || 0,
        status: 'published',
      }));

      if (typeof createEventsBatch === 'function') {
        await createEventsBatch(community.id, payloads);
      } else {
        for (const p of payloads) {
          await createEvent(community.id, p);
        }
      }

      const nextPublished = { ...publishedEventsMap };
      unpub.forEach(({ idx }) => {
        nextPublished[`${msgId}-${idx}`] = true;
      });
      setPublishedEventsMap(nextPublished);
      toast.success('Schedule Published! 🚀', `Added ${unpub.length} events to your community calendar.`);
    } catch (err) {
      toast.error('Batch publish error', err?.message || 'Could not publish all events.');
    } finally {
      setPublishingBatchMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handlePublishBroadcastCard = async (msgId, broadcastData) => {
    if (!community?.id || !broadcastData?.inAppBody) return;
    setSendingBroadcastMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const fullText = broadcastData.inAppTitle
        ? `📣 **${broadcastData.inAppTitle}**\n\n${broadcastData.inAppBody}`
        : broadcastData.inAppBody;
      if (typeof createPost === 'function') {
        await createPost(community.id, fullText, null, ['in-app']);
      } else if (typeof createFeedPost === 'function') {
        await createFeedPost(community.id, fullText, null, true, false);
      }
      setSentBroadcastMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success(
        'Announcement Published! 📣',
        'Posted to your community feed and notified members.'
      );
    } catch (err) {
      toast.error('Broadcast Error', err?.message || 'Could not publish announcement.');
    } finally {
      setSendingBroadcastMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleLaunchPollCard = async (msgId, pollData) => {
    if (!community?.id || !pollData?.question || !Array.isArray(pollData?.options)) return;
    setLaunchingPollMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      if (typeof createPoll === 'function') {
        await createPoll(community.id, pollData.question, pollData.options);
      }
      setLaunchedPollMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success('Poll Launched! 📊', 'Your community poll is now live for members to vote on.');
    } catch (err) {
      toast.error('Poll Launch Error', err?.message || 'Could not launch community poll.');
    } finally {
      setLaunchingPollMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} Copied! 📋`, 'Ready to paste.');
  };

  const handleDownloadMarkdown = (title, content) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = String(title || 'community-document')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document Downloaded! 📄', 'Saved to your device.');
  };

  const renderFormattedReply = (text) => {
    if (!text) return null;
    const lines = String(text).split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} style={{ height: '8px' }} />;
      // Render bold **segments** inline
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <div
          key={i}
          style={{
            marginBottom: '4px',
            paddingLeft: trimmed.startsWith('•') || trimmed.startsWith('- ') ? '8px' : 0,
          }}
        >
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} style={{ fontWeight: 800 }}>
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline-border)',
        borderRadius: '22px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.08)',
        position: 'relative',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--hairline-border)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #EB5738, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 6px 16px rgba(235, 87, 56, 0.25)',
              flexShrink: 0,
            }}
          >
            <Sparkles size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.12rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--ink-primary)',
                }}
              >
                More. AI Leader Co-Pilot
              </h3>
              <span
                style={{
                  padding: '2px 9px',
                  borderRadius: '99px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.14)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {activeModelLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
              Brainstorm ideas, tweak event schedules, draft WhatsApp messages &amp; create UK Council RAMS in natural conversation
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasConsented && messages.length > 1 && (
            <button
              type="button"
              onClick={handleResetChat}
              className="interactive-press"
              title="Start a fresh conversation"
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--ink-secondary)',
                borderRadius: '10px',
                padding: '7px 11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.76rem',
                fontWeight: 700,
              }}
            >
              <RotateCcw size={13} /> New Chat
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="interactive-press"
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--hairline-border)',
                color: 'var(--ink-secondary)',
                borderRadius: '10px',
                padding: '7px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <X size={15} /> Close
            </button>
          )}
        </div>
      </div>

      {/* Apple Guideline 5.1.2(i) & UK GDPR One-Time Consent Gate */}
      {!hasConsented ? (
        <div
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid rgba(235, 87, 56, 0.28)',
            borderRadius: '16px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Shield size={22} color="#EB5738" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--ink-primary)',
                  marginBottom: '6px',
                }}
              >
                Privacy-First AI Disclosure
              </div>
              <p
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '0.84rem',
                  color: 'var(--ink-secondary)',
                  lineHeight: 1.5,
                }}
              >
                To help you plan events, write announcements, and prepare safety documents, More. AI Co-Pilot sends{' '}
                <strong>only your community&apos;s public title, town, category tags, and your chat messages</strong>{' '}
                to Google Gemini API.
              </p>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--ink-muted)',
                  background: 'var(--surface-card)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--hairline-border)',
                  marginBottom: '14px',
                }}
              >
                🔒 <strong>Never shared:</strong> Member names, private DMs, email addresses, phone numbers, or attendee
                rosters are strictly excluded from AI prompts. You always review and approve every draft before it goes
                live.
              </div>
              <button
                type="button"
                onClick={handleAcceptConsent}
                className="btn btn-primary interactive-press"
                style={{
                  padding: '10px 18px',
                  borderRadius: '11px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={16} /> Enable Conversational Co-Pilot
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Topic Bar */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '10px',
              marginBottom: '12px',
            }}
            className="no-scrollbar"
          >
            {[
              {
                label: '🚀 Launch a New Meetup',
                prompt: `Create a single welcoming meetup for ${community?.name || 'our community'} in ${communityLoc} this weekend at 10:00 AM with a post-event coffee stop.`,
              },
              {
                label: '🗓️ Plan Next 4 Weeks',
                prompt: `Can you plan our next 4 weeks of meetups in ${communityLoc} with a mix of beginner-friendly and regular sessions?`,
              },
              {
                label: '📊 Create a Member Poll',
                prompt: `Create a community poll asking members which day and time works best for our next meetup in ${communityLoc}.`,
              },
              {
                label: '👋 Newcomer WhatsApp Welcome',
                prompt:
                  'Draft a warm WhatsApp group message welcoming newcomers and explaining how attending their first in-person meetup unlocks Verified Local standing.',
              },
              {
                label: '💡 Activate Quiet Members',
                prompt:
                  'What is the best way to get our quiet members who joined online to actually show up to their first in-person meetup?',
              },
              {
                label: '🛡️ UK Council RAMS',
                prompt: nextUpcomingEvent
                  ? `Draft a UK Council Risk Assessment & Method Statement (RAMS) for our upcoming meetup "${nextUpcomingEvent.title}" at ${cleanLocationName(nextUpcomingEvent.location) || communityLoc}.`
                  : `Draft a UK Council Risk Assessment & Method Statement (RAMS) for our next community meetup in ${communityLoc}.`,
              },
              {
                label: '🤝 Local Café Sponsor Pitch',
                prompt: `Write a friendly sponsorship outreach email to an independent café or local business in ${communityLoc} to partner with ${community?.name || 'our community'}.`,
              },
              {
                label: '🏛️ UK Council Grant Application',
                prompt: `Draft a UK Local Council & National Lottery Awards for All community grant funding application for ${community?.name || 'our community'}.`,
              },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isThinking}
                onClick={() => handleSendMessage(chip.prompt)}
                className="interactive-press"
                style={{
                  padding: '7px 12px',
                  borderRadius: '99px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: isThinking ? 'not-allowed' : 'pointer',
                  background: 'var(--surface-elevated)',
                  color: 'var(--ink-secondary)',
                  border: '1px solid var(--hairline-border)',
                  flexShrink: 0,
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Conversation Stream */}
          <div
            style={{
              maxHeight: '520px',
              overflowY: 'auto',
              padding: '12px',
              borderRadius: '16px',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginBottom: '12px',
            }}
          >
            {messages.map((msg, msgIdx) => {
              const isUser = msg.role === 'user';
              const isLastAssistant = !isUser && msgIdx === messages.length - 1;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '8px',
                  }}
                >
                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: isUser ? '84%' : '96%',
                      width: msg.actionCard ? '100%' : 'auto',
                      padding: isUser ? '11px 15px' : '14px 16px',
                      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, #EB5738, #d94627)'
                        : 'var(--surface-card)',
                      color: isUser ? '#ffffff' : 'var(--ink-primary)',
                      border: isUser ? 'none' : '1px solid var(--hairline-border)',
                      boxShadow: isUser
                        ? '0 4px 14px rgba(235, 87, 56, 0.25)'
                        : '0 2px 10px rgba(0, 0, 0, 0.04)',
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#EB5738',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <Sparkles size={12} /> More. Co-Pilot
                      </div>
                    )}

                    <div>{renderFormattedReply(msg.reply)}</div>

                    {/* Embedded Executable Action Card: 4-Week / Multi-Event Schedule */}
                    {!isUser &&
                      msg.actionCard?.type === 'events' &&
                      Array.isArray(msg.actionCard?.data?.events) &&
                      msg.actionCard.data.events.length > 0 && (
                        <div
                          style={{
                            marginTop: '14px',
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid rgba(235, 87, 56, 0.25)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px',
                              flexWrap: 'wrap',
                              marginBottom: '12px',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Calendar size={15} color="#EB5738" />
                              {msg.actionCard.title || 'Drafted Meetup Schedule'}
                            </div>
                            <button
                              type="button"
                              disabled={
                                publishingBatchMap[msg.id] ||
                                msg.actionCard.data.events.every(
                                  (_, idx) => publishedEventsMap[`${msg.id}-${idx}`]
                                )
                              }
                              onClick={() =>
                                handlePublishAllEventsInCard(msg.id, msg.actionCard.data.events)
                              }
                              className="btn btn-primary interactive-press"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '9px',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              {publishingBatchMap[msg.id] ? (
                                <Loader2 size={13} className="spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              {msg.actionCard.data.events.length === 1
                                ? '🚀 Launch Event Live'
                                : `🚀 Launch All (${msg.actionCard.data.events.length})`}
                            </button>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                              gap: '10px',
                            }}
                          >
                            {msg.actionCard.data.events.map((ev, idx) => {
                              const isPublished = Boolean(publishedEventsMap[`${msg.id}-${idx}`]);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    background: 'var(--surface-card)',
                                    border: isPublished
                                      ? '1px solid rgba(16, 185, 129, 0.45)'
                                      : '1px solid var(--hairline-border)',
                                    borderRadius: '12px',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '4px',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: '0.66rem',
                                          fontWeight: 800,
                                          textTransform: 'uppercase',
                                          padding: '2px 7px',
                                          borderRadius: '99px',
                                          background: 'rgba(235, 87, 56, 0.12)',
                                          color: '#EB5738',
                                        }}
                                      >
                                        {ev.themeBadge || `Week ${ev.week || idx + 1}`}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          color: 'var(--ink-muted)',
                                        }}
                                      >
                                        {ev.date} • {ev.time}
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: '0.88rem',
                                        color: 'var(--ink-primary)',
                                        marginBottom: '4px',
                                      }}
                                    >
                                      {ev.title}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--ink-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginBottom: '6px',
                                      }}
                                    >
                                      <MapPin size={12} color="#EB5738" /> {ev.location}
                                    </div>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: '0.76rem',
                                        color: 'var(--ink-secondary)',
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {ev.description}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isPublished}
                                    onClick={() => handlePublishSingleEvent(msg.id, ev, idx)}
                                    className="interactive-press"
                                    style={{
                                      width: '100%',
                                      padding: '7px 10px',
                                      borderRadius: '8px',
                                      border: isPublished
                                        ? '1px solid rgba(16, 185, 129, 0.4)'
                                        : '1px solid rgba(235, 87, 56, 0.35)',
                                      background: isPublished
                                        ? 'rgba(16, 185, 129, 0.12)'
                                        : 'rgba(235, 87, 56, 0.1)',
                                      color: isPublished ? '#10b981' : '#EB5738',
                                      fontSize: '0.76rem',
                                      fontWeight: 800,
                                      cursor: isPublished ? 'default' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '5px',
                                    }}
                                  >
                                    {isPublished ? (
                                      <>
                                        <Check size={13} /> Published to Calendar
                                      </>
                                    ) : (
                                      <>
                                        <Plus size={13} /> Publish Week {ev.week || idx + 1}
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              marginTop: '10px',
                              fontSize: '0.74rem',
                              color: 'var(--ink-muted)',
                            }}
                          >
                            💬 Want to change days, times, or venues? Just reply in the chat below (e.g.{' '}
                            <em>&ldquo;Move these to Sunday mornings at 10:30&rdquo;</em>).
                          </div>
                        </div>
                      )}

                    {/* Embedded Executable Action Card: Launch Community Poll */}
                    {!isUser &&
                      msg.actionCard?.type === 'poll' &&
                      msg.actionCard?.data?.question && (
                        <div
                          style={{
                            marginTop: '14px',
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px',
                              flexWrap: 'wrap',
                              marginBottom: '10px',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                color: 'var(--ink-primary)',
                              }}
                            >
                              📊 {msg.actionCard.title || 'Draft Community Poll'}
                            </div>
                            <button
                              type="button"
                              disabled={launchingPollMap[msg.id] || launchedPollMap[msg.id]}
                              onClick={() => handleLaunchPollCard(msg.id, msg.actionCard.data)}
                              className="btn btn-primary interactive-press"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '9px',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              {launchedPollMap[msg.id] ? (
                                <>
                                  <Check size={13} /> Poll Live!
                                </>
                              ) : launchingPollMap[msg.id] ? (
                                <>
                                  <Loader2 size={13} className="spin" /> Launching...
                                </>
                              ) : (
                                <>🚀 Launch Poll Live</>
                              )}
                            </button>
                          </div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: 'var(--ink-primary)',
                              marginBottom: '8px',
                            }}
                          >
                            {msg.actionCard.data.question}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(msg.actionCard.data.options || []).map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                style={{
                                  padding: '8px 11px',
                                  borderRadius: '9px',
                                  background: 'var(--surface-card)',
                                  border: '1px solid var(--hairline-border)',
                                  fontSize: '0.8rem',
                                  color: 'var(--ink-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                {oIdx + 1}. {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Embedded Executable Action Card: Broadcast & Social Copy */}
                    {!isUser &&
                      msg.actionCard?.type === 'broadcast' &&
                      msg.actionCard?.data && (
                        <div
                          style={{
                            marginTop: '14px',
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              color: 'var(--ink-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Megaphone size={15} color="#10b981" />
                            {msg.actionCard.title || 'Ready-to-Send Community Copy'}
                          </div>

                          {/* In-App Feed & Push */}
                          {msg.actionCard.data.inAppBody && (
                            <div
                              style={{
                                background: 'var(--surface-card)',
                                borderRadius: '11px',
                                padding: '12px',
                                border: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '8px',
                                  flexWrap: 'wrap',
                                  marginBottom: '6px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#EB5738',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  📣 In-App Feed &amp; Push Notification
                                </span>
                                <button
                                  type="button"
                                  disabled={
                                    sendingBroadcastMap[msg.id] || sentBroadcastMap[msg.id]
                                  }
                                  onClick={() =>
                                    handlePublishBroadcastCard(msg.id, msg.actionCard.data)
                                  }
                                  className="btn btn-primary interactive-press"
                                  style={{
                                    padding: '5px 11px',
                                    borderRadius: '8px',
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  {sentBroadcastMap[msg.id] ? (
                                    <>
                                      <Check size={12} /> Posted to Feed
                                    </>
                                  ) : sendingBroadcastMap[msg.id] ? (
                                    <>
                                      <Loader2 size={12} className="spin" /> Posting...
                                    </>
                                  ) : (
                                    <>
                                      <Send size={12} /> Publish to Feed &amp; Notify
                                    </>
                                  )}
                                </button>
                              </div>
                              {msg.actionCard.data.inAppTitle && (
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: '0.86rem',
                                    color: 'var(--ink-primary)',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {msg.actionCard.data.inAppTitle}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--ink-secondary)',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {msg.actionCard.data.inAppBody}
                              </div>
                            </div>
                          )}

                          {/* WhatsApp Copy */}
                          {msg.actionCard.data.whatsappCopy && (
                            <div
                              style={{
                                background: 'var(--surface-card)',
                                borderRadius: '11px',
                                padding: '12px',
                                border: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '6px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#10b981',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  💬 WhatsApp Group Copy
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(
                                      msg.actionCard.data.whatsappCopy,
                                      'WhatsApp Message'
                                    )
                                  }
                                  className="interactive-press"
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '7px',
                                    border: '1px solid var(--hairline-border)',
                                    background: 'var(--surface-elevated)',
                                    color: 'var(--ink-primary)',
                                    fontSize: '0.73rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Copy size={12} /> Copy WhatsApp
                                </button>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--ink-secondary)',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {msg.actionCard.data.whatsappCopy}
                              </div>
                            </div>
                          )}

                          {/* Instagram Copy */}
                          {msg.actionCard.data.instagramCopy && (
                            <div
                              style={{
                                background: 'var(--surface-card)',
                                borderRadius: '11px',
                                padding: '12px',
                                border: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '6px',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#ec4899',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  📸 Instagram Caption
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(
                                      msg.actionCard.data.instagramCopy,
                                      'Instagram Caption'
                                    )
                                  }
                                  className="interactive-press"
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '7px',
                                    border: '1px solid var(--hairline-border)',
                                    background: 'var(--surface-elevated)',
                                    color: 'var(--ink-primary)',
                                    fontSize: '0.73rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Copy size={12} /> Copy Caption
                                </button>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--ink-secondary)',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {msg.actionCard.data.instagramCopy}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    {/* Embedded Executable Action Card: RAMS / Sponsor / Grant Document */}
                    {!isUser &&
                      msg.actionCard?.type === 'document' &&
                      msg.actionCard?.data?.content && (
                        <div
                          style={{
                            marginTop: '14px',
                            padding: '14px',
                            borderRadius: '14px',
                            background: 'var(--surface-elevated)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px',
                              flexWrap: 'wrap',
                              marginBottom: '10px',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: '0.86rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Shield size={15} color="#f59e0b" />
                              {msg.actionCard.title || 'Generated Community Document'}
                            </div>

                            {hasProAccess ? (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyText(
                                      msg.actionCard.data.content,
                                      msg.actionCard.title || 'Document'
                                    )
                                  }
                                  className="interactive-press"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--hairline-border)',
                                    background: 'var(--surface-card)',
                                    color: 'var(--ink-primary)',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Copy size={12} /> Copy Text
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadMarkdown(
                                      msg.actionCard.title,
                                      msg.actionCard.data.content
                                    )
                                  }
                                  className="interactive-press"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(235, 87, 56, 0.35)',
                                    background: 'rgba(235, 87, 56, 0.12)',
                                    color: '#EB5738',
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Download size={12} /> Download (.md)
                                </button>
                              </div>
                            ) : (
                              onJumpToUpgrade && (
                                <button
                                  type="button"
                                  onClick={onJumpToUpgrade}
                                  className="btn btn-primary interactive-press"
                                  style={{
                                    padding: '5px 11px',
                                    borderRadius: '8px',
                                    fontSize: '0.73rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Lock size={12} /> Unlock Full Export with Leader Pro
                                </button>
                              )
                            )}
                          </div>

                          <div
                            style={{
                              maxHeight: hasProAccess ? '280px' : '160px',
                              overflowY: 'auto',
                              background: 'var(--surface-card)',
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid var(--hairline-border)',
                              fontSize: '0.79rem',
                              color: 'var(--ink-secondary)',
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.55,
                            }}
                          >
                            {hasProAccess
                              ? msg.actionCard.data.content
                              : `${String(msg.actionCard.data.content).slice(0, 420)}...\n\n[Leader Pro (£20/mo) unlocks full UK Council RAMS & Sponsor/Grant export alongside £5M Public Liability Insurance]`}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Follow-up Suggestion Chips under the latest assistant message */}
                  {isLastAssistant &&
                    Array.isArray(msg.suggestedReplies) &&
                    msg.suggestedReplies.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                          marginTop: '2px',
                        }}
                      >
                        {msg.suggestedReplies.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            disabled={isThinking}
                            onClick={() => handleSendMessage(suggestion)}
                            className="interactive-press"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '99px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: 'rgba(235, 87, 56, 0.1)',
                              color: '#EB5738',
                              border: '1px solid rgba(235, 87, 56, 0.28)',
                              cursor: isThinking ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}

            {isThinking && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.83rem',
                  color: 'var(--ink-secondary)',
                  fontWeight: 600,
                }}
              >
                <Loader2 size={15} className="spin" color="#EB5738" />
                More. Co-Pilot is thinking...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Conversational Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              background: 'var(--surface-elevated)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '14px',
              padding: '8px 10px',
            }}
          >
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Chat with your ${community?.name || 'Community'} Co-Pilot... (e.g. "Make the schedule Sunday mornings" or "How do I welcome shy newcomers?")`}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'var(--ink-primary)',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                padding: '6px 4px',
                minHeight: '34px',
                maxHeight: '110px',
                lineHeight: 1.45,
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="btn btn-primary interactive-press"
              style={{
                padding: '9px 15px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: !inputValue.trim() || isThinking ? 0.5 : 1,
                cursor: !inputValue.trim() || isThinking ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
            >
              {isThinking ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
