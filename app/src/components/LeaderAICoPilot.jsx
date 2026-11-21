"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Megaphone,
  Shield,
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
  Layers,
  BarChart3,
  ArrowRight,
  CheckCircle2,
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
  const { user, createEvent, createEventsBatch, createPost, createFeedPost, createPoll } =
    useAppContext();
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
      ? `Your next meetup on the calendar is **"${nextUpcomingEvent.title}"** (${nextUpcomingEvent.date || 'soon'} at ${nextUpcomingEvent.time || '10:00'}).`
      : `You don't have an upcoming meetup scheduled yet — tell me what you have in mind and I'll build it on the right ready to launch.`;

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        reply: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your **${commName}** Co-Pilot.\n\nI can see you have **${memberCount} member${memberCount === 1 ? '' : 's'}** (${verifiedMemberCount} Verified Local${verifiedMemberCount === 1 ? '' : 's'}). ${nextNote}\n\nChat with me here — anything I build (new events, 4-week plans, member polls, WhatsApp copy, or UK RAMS docs) will appear live in the **Output & Launchpad** panel ready for 1-tap launch.`,
        actionCard: null,
        suggestedReplies: [
          '🚀 Launch a meetup this Sunday at 10am',
          '🗓️ Plan our next 4 weeks of meetups',
          '📊 Create a poll to vote on meetup day',
          '👋 Draft a warm WhatsApp welcome',
        ],
      },
    ];
  };

  const [messages, setMessages] = useState(() => buildInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeModelLabel, setActiveModelLabel] = useState('Gemini 3.6 Flash');

  // Output Workspace state (always synced to latest generated draft or user-selected draft)
  const [selectedOutputMsgId, setSelectedOutputMsgId] = useState(null);
  const [mobileView, setMobileView] = useState('chat'); // 'chat' | 'output'

  // Action completion tracking
  const [publishedEventsMap, setPublishedEventsMap] = useState({});
  const [publishingBatchMap, setPublishingBatchMap] = useState({});
  const [sendingBroadcastMap, setSendingBroadcastMap] = useState({});
  const [sentBroadcastMap, setSentBroadcastMap] = useState({});
  const [launchingPollMap, setLaunchingPollMap] = useState({});
  const [launchedPollMap, setLaunchedPollMap] = useState({});

  const chatEndRef = useRef(null);

  // Close modal on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  // All generated outputs in this session
  const outputHistory = useMemo(() => {
    return messages.filter((m) => m.role === 'assistant' && m.actionCard);
  }, [messages]);

  const activeOutputMessage = useMemo(() => {
    if (outputHistory.length === 0) return null;
    if (selectedOutputMsgId) {
      const found = outputHistory.find((m) => m.id === selectedOutputMsgId);
      if (found) return found;
    }
    return outputHistory[outputHistory.length - 1];
  }, [outputHistory, selectedOutputMsgId]);

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
    setSelectedOutputMsgId(null);
    setMobileView('chat');
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
        setActiveModelLabel(
          data.modelUsed.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        );
      }
      const normalizedCard = normalizeActionCard(data?.actionCard);
      const newMsgId = `ai-${Date.now()}`;
      const assistantMsg = {
        id: newMsgId,
        role: 'assistant',
        reply:
          data?.reply ||
          "I've drafted that for you in the Output & Launchpad panel. Tell me if you'd like to tweak anything before launching!",
        actionCard: normalizedCard,
        suggestedReplies: Array.isArray(data?.suggestedReplies) ? data.suggestedReplies : [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (normalizedCard) {
        setSelectedOutputMsgId(newMsgId);
      }
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
            '🚀 Launch a meetup this Sunday at 10am',
            '🗓️ Plan our next 4 weeks of meetups',
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
      toast.success('Event Launched Live! 🚀', `"${ev.title}" is now on your community calendar.`);
    } catch (err) {
      toast.error('Could not launch event', err?.message || 'Please try again.');
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

      if (typeof createEventsBatch === 'function' && payloads.length > 1) {
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
      toast.success(
        payloads.length === 1 ? 'Event Launched Live! 🚀' : 'Schedule Launched Live! 🚀',
        `Added ${unpub.length} event${unpub.length === 1 ? '' : 's'} to your community calendar.`
      );
    } catch (err) {
      toast.error('Launch error', err?.message || 'Could not publish events.');
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
      toast.success('Poll Launched Live! 📊', 'Members can now vote in your community.');
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
      if (!trimmed) return <div key={i} style={{ height: '7px' }} />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <div
          key={i}
          style={{
            marginBottom: '3px',
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

  const getOutputBadgeLabel = (card) => {
    if (!card) return 'Output';
    if (card.type === 'events') {
      const len = card.data?.events?.length || 1;
      return len === 1 ? '🚀 Event Draft' : `🗓️ ${len}-Week Plan`;
    }
    if (card.type === 'poll') return '📊 Poll Draft';
    if (card.type === 'broadcast') return '📣 Broadcast Copy';
    if (card.type === 'document') return '🛡️ Document Draft';
    return '✨ Draft';
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(10, 12, 18, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .copilot-split-body {
              display: grid;
              grid-template-columns: minmax(0, 1fr);
              flex: 1;
              min-height: 0;
              overflow: hidden;
            }
            .copilot-mobile-tabs {
              display: flex;
            }
            .copilot-pane-chat.mobile-hidden,
            .copilot-pane-output.mobile-hidden {
              display: none;
            }
            @media (min-width: 860px) {
              .copilot-split-body {
                grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr);
              }
              .copilot-mobile-tabs {
                display: none !important;
              }
              .copilot-pane-chat.mobile-hidden,
              .copilot-pane-output.mobile-hidden {
                display: flex !important;
              }
              .copilot-pane-chat {
                border-right: 1px solid var(--hairline-border);
              }
            }
          `,
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1120px',
          height: 'min(90dvh, 800px)',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border-strong)',
          borderRadius: '22px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Unified Modal Top Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--hairline-border)',
            background: 'var(--surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #EB5738, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.08rem',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--ink-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  More. AI Co-Pilot Studio
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '99px',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.14)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeModelLabel}
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--ink-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {community?.name || 'Community'} • Conversation on the left, live launchable output on the right
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {hasConsented && messages.length > 1 && (
              <button
                type="button"
                onClick={handleResetChat}
                className="interactive-press"
                title="Start a fresh session"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-secondary)',
                  borderRadius: '10px',
                  padding: '6px 10px',
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
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-secondary)',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <X size={16} /> Close
              </button>
            )}
          </div>
        </div>

        {/* One-Time Privacy Consent Gate */}
        {!hasConsented ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                maxWidth: '520px',
                background: 'var(--surface-elevated)',
                border: '1px solid rgba(235, 87, 56, 0.3)',
                borderRadius: '18px',
                padding: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Shield size={24} color="#EB5738" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: 'var(--ink-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    Privacy-First AI Disclosure
                  </div>
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '0.85rem',
                      color: 'var(--ink-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    To plan events, create polls, write announcements, and draft safety documents, More. AI Co-Pilot sends{' '}
                    <strong>only your community&apos;s public title, town, tags, and your chat messages</strong> to Google Gemini.
                  </p>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--ink-muted)',
                      background: 'var(--surface-card)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--hairline-border)',
                      marginBottom: '16px',
                    }}
                  >
                    🔒 <strong>Never shared:</strong> Member names, private DMs, emails, phone numbers, or attendee rosters are excluded. Nothing publishes until you tap Launch.
                  </div>
                  <button
                    type="button"
                    onClick={handleAcceptConsent}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '11px 20px',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Check size={16} /> Open Co-Pilot Studio
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View Switcher (Chat vs Live Output) */}
            <div
              className="copilot-mobile-tabs"
              style={{
                padding: '8px 14px',
                borderBottom: '1px solid var(--hairline-border)',
                background: 'var(--surface-card)',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setMobileView('chat')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border:
                    mobileView === 'chat'
                      ? '1px solid var(--brand-accent)'
                      : '1px solid var(--hairline-border)',
                  background:
                    mobileView === 'chat' ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                  color: mobileView === 'chat' ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <MessageSquare size={14} /> Conversation
              </button>
              <button
                type="button"
                onClick={() => setMobileView('output')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border:
                    mobileView === 'output'
                      ? '1px solid #10b981'
                      : '1px solid var(--hairline-border)',
                  background:
                    mobileView === 'output'
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'var(--surface-elevated)',
                  color: mobileView === 'output' ? '#10b981' : 'var(--ink-secondary)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} />
                Output &amp; Launchpad
                {outputHistory.length > 0 && (
                  <span
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '99px',
                      fontWeight: 800,
                    }}
                  >
                    {outputHistory.length}
                  </span>
                )}
              </button>
            </div>

            {/* Split-Pane Studio Body: Left = Conversation, Right = Live Output & Launchpad */}
            <div className="copilot-split-body">
              {/* LEFT PANE: CONVERSATION */}
              <div
                className={`copilot-pane-chat ${mobileView === 'output' ? 'mobile-hidden' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  background: 'var(--surface-canvas)',
                }}
              >
                {/* Quick Starter Chips */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--hairline-border)',
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    flexShrink: 0,
                  }}
                  className="no-scrollbar"
                >
                  {[
                    {
                      label: '🚀 New Meetup',
                      prompt: `Create a single welcoming meetup for ${community?.name || 'our community'} in ${communityLoc} this weekend at 10:00 AM with a post-event coffee stop.`,
                    },
                    {
                      label: '🗓️ 4-Week Plan',
                      prompt: `Plan our next 4 weeks of meetups in ${communityLoc} with a mix of beginner-friendly and regular sessions.`,
                    },
                    {
                      label: '📊 Member Poll',
                      prompt: `Create a community poll asking members which day and time works best for our next meetup in ${communityLoc}.`,
                    },
                    {
                      label: '👋 WhatsApp Copy',
                      prompt:
                        'Draft a warm WhatsApp group message welcoming newcomers and explaining how attending their first meetup unlocks Verified Local standing.',
                    },
                    {
                      label: '🛡️ UK RAMS',
                      prompt: nextUpcomingEvent
                        ? `Draft a UK Council Risk Assessment (RAMS) for "${nextUpcomingEvent.title}" at ${cleanLocationName(nextUpcomingEvent.location) || communityLoc}.`
                        : `Draft a UK Council Risk Assessment (RAMS) for our next community meetup in ${communityLoc}.`,
                    },
                    {
                      label: '🤝 Sponsor Pitch',
                      prompt: `Write a friendly sponsorship outreach email to an independent café in ${communityLoc} to partner with ${community?.name || 'our community'}.`,
                    },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isThinking}
                      onClick={() => handleSendMessage(chip.prompt)}
                      className="interactive-press"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '99px',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: isThinking ? 'not-allowed' : 'pointer',
                        background: 'var(--surface-card)',
                        color: 'var(--ink-secondary)',
                        border: '1px solid var(--hairline-border)',
                        flexShrink: 0,
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Chat Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {messages.map((msg, msgIdx) => {
                    const isUser = msg.role === 'user';
                    const isLastAssistant = !isUser && msgIdx === messages.length - 1;
                    const isSelectedOutput = activeOutputMessage?.id === msg.id;

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isUser ? 'flex-end' : 'flex-start',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '90%',
                            padding: isUser ? '10px 14px' : '12px 14px',
                            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isUser
                              ? 'linear-gradient(135deg, #EB5738, #d94627)'
                              : 'var(--surface-card)',
                            color: isUser ? '#ffffff' : 'var(--ink-primary)',
                            border: isUser ? 'none' : '1px solid var(--hairline-border)',
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {!isUser && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                marginBottom: '5px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: '#EB5738',
                                textTransform: 'uppercase',
                              }}
                            >
                              <Sparkles size={11} /> More. Co-Pilot
                            </div>
                          )}
                          <div>{renderFormattedReply(msg.reply)}</div>

                          {/* Compact pill linking directly to the Output Panel on the right (or mobile Output tab) */}
                          {!isUser && msg.actionCard && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOutputMsgId(msg.id);
                                setMobileView('output');
                              }}
                              className="interactive-press"
                              style={{
                                marginTop: '10px',
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: isSelectedOutput
                                  ? 'rgba(16, 185, 129, 0.14)'
                                  : 'var(--surface-elevated)',
                                border: isSelectedOutput
                                  ? '1px solid rgba(16, 185, 129, 0.45)'
                                  : '1px solid var(--hairline-border-strong)',
                                color: isSelectedOutput ? '#10b981' : 'var(--ink-primary)',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <span>
                                {getOutputBadgeLabel(msg.actionCard)}: {msg.actionCard.title}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {isSelectedOutput ? 'Viewing →' : 'Open Output →'}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Follow-up Suggestion Chips */}
                        {isLastAssistant &&
                          Array.isArray(msg.suggestedReplies) &&
                          msg.suggestedReplies.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {msg.suggestedReplies.map((suggestion, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  disabled={isThinking}
                                  onClick={() => handleSendMessage(suggestion)}
                                  className="interactive-press"
                                  style={{
                                    padding: '5px 11px',
                                    borderRadius: '99px',
                                    fontSize: '0.73rem',
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
                        padding: '10px 14px',
                        borderRadius: '14px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.82rem',
                        color: 'var(--ink-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      <Loader2 size={14} className="spin" color="#EB5738" />
                      Building your response &amp; live output...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Composer Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  style={{
                    padding: '10px 12px',
                    borderTop: '1px solid var(--hairline-border)',
                    background: 'var(--surface-card)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-end',
                    flexShrink: 0,
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
                    placeholder="Ask anything or tweak the draft on the right..."
                    style={{
                      flex: 1,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '12px',
                      outline: 'none',
                      resize: 'none',
                      color: 'var(--ink-primary)',
                      fontSize: '0.86rem',
                      fontFamily: 'inherit',
                      padding: '9px 12px',
                      minHeight: '38px',
                      maxHeight: '100px',
                      lineHeight: 1.4,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isThinking}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      opacity: !inputValue.trim() || isThinking ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {isThinking ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                    Send
                  </button>
                </form>
              </div>

              {/* RIGHT PANE: LIVE OUTPUT & LAUNCHPAD CANVAS */}
              <div
                className={`copilot-pane-output ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  background: 'var(--surface-card)',
                }}
              >
                {/* Output Pane Header + Draft Switcher */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--hairline-border)',
                    background: 'var(--surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Layers size={15} color="#10b981" />
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: 'var(--ink-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Live Output &amp; Launchpad
                    </span>
                  </div>

                  {outputHistory.length > 1 && (
                    <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
                      {outputHistory.map((m, idx) => {
                        const active = activeOutputMessage?.id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedOutputMsgId(m.id)}
                            style={{
                              padding: '4px 9px',
                              borderRadius: '99px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: active
                                ? '1px solid #10b981'
                                : '1px solid var(--hairline-border)',
                              background: active ? 'rgba(16, 185, 129, 0.14)' : 'var(--surface-card)',
                              color: active ? '#10b981' : 'var(--ink-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            #{idx + 1} {getOutputBadgeLabel(m.actionCard)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Output Canvas Scroll Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
                  {!activeOutputMessage?.actionCard ? (
                    /* Clean Empty State showing exactly what appears here */
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '20px',
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: 'rgba(235, 87, 56, 0.12)',
                          border: '1px solid rgba(235, 87, 56, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#EB5738',
                          marginBottom: '14px',
                        }}
                      >
                        <Sparkles size={26} />
                      </div>
                      <h3
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '1.08rem',
                          fontFamily: 'var(--font-heading)',
                          color: 'var(--ink-primary)',
                        }}
                      >
                        Your Live Drafts Appear Here
                      </h3>
                      <p
                        style={{
                          margin: '0 0 20px 0',
                          fontSize: '0.84rem',
                          color: 'var(--ink-secondary)',
                          maxWidth: '380px',
                          lineHeight: 1.5,
                        }}
                      >
                        Ask the Co-Pilot on the left to build anything — your ready-to-launch events, polls, WhatsApp broadcasts, or UK RAMS documents appear right here in full view.
                      </p>

                      <div
                        style={{
                          width: '100%',
                          maxWidth: '420px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                        }}
                      >
                        {[
                          {
                            icon: '🚀',
                            title: 'Launch an Event',
                            sub: '1-tap publish to calendar',
                            prompt: `Create a single welcoming meetup for ${community?.name || 'our community'} in ${communityLoc} this weekend at 10:00 AM with a post-event coffee stop.`,
                          },
                          {
                            icon: '🗓️',
                            title: '4-Week Schedule',
                            sub: 'Batch launch a full month',
                            prompt: `Plan our next 4 weeks of meetups in ${communityLoc} with a mix of beginner-friendly and regular sessions.`,
                          },
                          {
                            icon: '📊',
                            title: 'Member Poll',
                            sub: 'Let members vote live',
                            prompt: `Create a community poll asking members which day and time works best for our next meetup in ${communityLoc}.`,
                          },
                          {
                            icon: '📣',
                            title: 'WhatsApp & Feed',
                            sub: 'Post & copy social invites',
                            prompt:
                              'Draft a warm WhatsApp group message and in-app announcement welcoming newcomers to our next meetup.',
                          },
                        ].map((card, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={isThinking}
                            onClick={() => handleSendMessage(card.prompt)}
                            className="interactive-press"
                            style={{
                              padding: '12px',
                              borderRadius: '14px',
                              background: 'var(--surface-elevated)',
                              border: '1px solid var(--hairline-border)',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{card.icon}</div>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: 'var(--ink-primary)',
                              }}
                            >
                              {card.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                              {card.sub}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* ===== ACTIVE OUTPUT RENDERERS ===== */
                    (() => {
                      const msgId = activeOutputMessage.id;
                      const card = activeOutputMessage.actionCard;

                      // 1. EVENTS LAUNCHPAD (Single Event or Multi-Week Schedule)
                      if (card.type === 'events' && Array.isArray(card.data?.events)) {
                        const evList = card.data.events;
                        const allLaunched = evList.every((_, idx) => publishedEventsMap[`${msgId}-${idx}`]);

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                paddingBottom: '12px',
                                borderBottom: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#EB5738',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  {evList.length === 1 ? 'Ready to Launch Event' : `${evList.length}-Event Schedule Draft`}
                                </div>
                                <h3
                                  style={{
                                    margin: '2px 0 0',
                                    fontSize: '1.12rem',
                                    fontFamily: 'var(--font-heading)',
                                    color: 'var(--ink-primary)',
                                  }}
                                >
                                  {card.title}
                                </h3>
                              </div>

                              <button
                                type="button"
                                disabled={publishingBatchMap[msgId] || allLaunched}
                                onClick={() => handlePublishAllEventsInCard(msgId, evList)}
                                className="btn btn-primary interactive-press"
                                style={{
                                  padding: '10px 16px',
                                  borderRadius: '11px',
                                  fontSize: '0.84rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: allLaunched ? '#10b981' : undefined,
                                }}
                              >
                                {publishingBatchMap[msgId] ? (
                                  <Loader2 size={15} className="spin" />
                                ) : allLaunched ? (
                                  <CheckCircle2 size={15} />
                                ) : (
                                  <Calendar size={15} />
                                )}
                                {allLaunched
                                  ? 'Launched on Calendar ✓'
                                  : evList.length === 1
                                  ? '🚀 Launch Event Live'
                                  : `🚀 Launch All (${evList.length})`}
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {evList.map((ev, idx) => {
                                const isLaunched = Boolean(publishedEventsMap[`${msgId}-${idx}`]);
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      background: 'var(--surface-elevated)',
                                      border: isLaunched
                                        ? '1.5px solid rgba(16, 185, 129, 0.5)'
                                        : '1px solid var(--hairline-border)',
                                      borderRadius: '15px',
                                      padding: '15px',
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
                                          fontSize: '0.68rem',
                                          fontWeight: 800,
                                          textTransform: 'uppercase',
                                          padding: '2px 8px',
                                          borderRadius: '99px',
                                          background: 'rgba(235, 87, 56, 0.14)',
                                          color: '#EB5738',
                                        }}
                                      >
                                        {ev.weekLabel || ev.themeBadge || `Event ${idx + 1}`}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '0.78rem',
                                          fontWeight: 700,
                                          color: 'var(--ink-secondary)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                        }}
                                      >
                                        <Clock size={13} color="#EB5738" /> {ev.date} • {ev.time}
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: '1.02rem',
                                        color: 'var(--ink-primary)',
                                        marginBottom: '5px',
                                      }}
                                    >
                                      {ev.title}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--ink-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        marginBottom: '8px',
                                      }}
                                    >
                                      <MapPin size={13} color="#EB5738" /> {ev.location}
                                      <span style={{ opacity: 0.5 }}>•</span>
                                      <span>Max {ev.maxCapacity || 25} spots</span>
                                      <span style={{ opacity: 0.5 }}>•</span>
                                      <span>{Number(ev.ticketPrice) > 0 ? `£${ev.ticketPrice}` : 'Free'}</span>
                                    </div>
                                    <p
                                      style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '0.82rem',
                                        color: 'var(--ink-secondary)',
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                      }}
                                    >
                                      {ev.description}
                                    </p>

                                    <button
                                      type="button"
                                      disabled={isLaunched}
                                      onClick={() => handlePublishSingleEvent(msgId, ev, idx)}
                                      className="interactive-press"
                                      style={{
                                        padding: '8px 14px',
                                        borderRadius: '10px',
                                        border: isLaunched
                                          ? '1px solid rgba(16, 185, 129, 0.45)'
                                          : '1px solid rgba(235, 87, 56, 0.4)',
                                        background: isLaunched
                                          ? 'rgba(16, 185, 129, 0.14)'
                                          : 'rgba(235, 87, 56, 0.12)',
                                        color: isLaunched ? '#10b981' : '#EB5738',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        cursor: isLaunched ? 'default' : 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      {isLaunched ? (
                                        <>
                                          <Check size={14} /> Live on Community Calendar
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={14} /> Launch This Event Live
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            <div
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--ink-muted)',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: 'var(--surface-elevated)',
                                border: '1px dashed var(--hairline-border)',
                              }}
                            >
                              💬 Want to tweak times, dates, ticket price, or make it dog-friendly? Just tell the Co-Pilot in the chat on the left and this output will update automatically.
                            </div>
                          </div>
                        );
                      }

                      // 2. POLL LAUNCHPAD
                      if (card.type === 'poll' && card.data?.question) {
                        const isLaunched = Boolean(launchedPollMap[msgId]);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                flexWrap: 'wrap',
                                paddingBottom: '12px',
                                borderBottom: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#3b82f6',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Community Poll Ready
                                </div>
                                <h3
                                  style={{
                                    margin: '2px 0 0',
                                    fontSize: '1.12rem',
                                    fontFamily: 'var(--font-heading)',
                                    color: 'var(--ink-primary)',
                                  }}
                                >
                                  {card.title}
                                </h3>
                              </div>
                              <button
                                type="button"
                                disabled={launchingPollMap[msgId] || isLaunched}
                                onClick={() => handleLaunchPollCard(msgId, card.data)}
                                className="btn btn-primary interactive-press"
                                style={{
                                  padding: '10px 16px',
                                  borderRadius: '11px',
                                  fontSize: '0.84rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: isLaunched ? '#10b981' : undefined,
                                }}
                              >
                                {launchingPollMap[msgId] ? (
                                  <Loader2 size={15} className="spin" />
                                ) : isLaunched ? (
                                  <CheckCircle2 size={15} />
                                ) : (
                                  <BarChart3 size={15} />
                                )}
                                {isLaunched ? 'Poll Live ✓' : '🚀 Launch Poll Live'}
                              </button>
                            </div>

                            <div
                              style={{
                                background: 'var(--surface-elevated)',
                                border: '1px solid var(--hairline-border)',
                                borderRadius: '16px',
                                padding: '16px',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: '1.02rem',
                                  color: 'var(--ink-primary)',
                                  marginBottom: '12px',
                                }}
                              >
                                {card.data.question}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(card.data.options || []).map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    style={{
                                      padding: '10px 14px',
                                      borderRadius: '11px',
                                      background: 'var(--surface-card)',
                                      border: '1px solid var(--hairline-border)',
                                      fontSize: '0.86rem',
                                      color: 'var(--ink-primary)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {oIdx + 1}. {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 3. BROADCAST & SOCIAL COPY LAUNCHPAD
                      if (card.type === 'broadcast' && card.data) {
                        const isSent = Boolean(sentBroadcastMap[msgId]);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                paddingBottom: '12px',
                                borderBottom: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: '#10b981',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Ready-to-Send Multi-Channel Copy
                              </div>
                              <h3
                                style={{
                                  margin: '2px 0 0',
                                  fontSize: '1.12rem',
                                  fontFamily: 'var(--font-heading)',
                                  color: 'var(--ink-primary)',
                                }}
                              >
                                {card.title}
                              </h3>
                            </div>

                            {card.data.inAppBody && (
                              <div
                                style={{
                                  background: 'var(--surface-elevated)',
                                  borderRadius: '14px',
                                  padding: '14px',
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
                                    marginBottom: '8px',
                                  }}
                                >
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EB5738' }}>
                                    📣 IN-APP FEED &amp; PUSH NOTIFICATION
                                  </span>
                                  <button
                                    type="button"
                                    disabled={sendingBroadcastMap[msgId] || isSent}
                                    onClick={() => handlePublishBroadcastCard(msgId, card.data)}
                                    className="btn btn-primary interactive-press"
                                    style={{
                                      padding: '7px 13px',
                                      borderRadius: '9px',
                                      fontSize: '0.76rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      background: isSent ? '#10b981' : undefined,
                                    }}
                                  >
                                    {isSent ? (
                                      <>
                                        <Check size={13} /> Published ✓
                                      </>
                                    ) : sendingBroadcastMap[msgId] ? (
                                      <>
                                        <Loader2 size={13} className="spin" /> Publishing...
                                      </>
                                    ) : (
                                      <>
                                        <Send size={13} /> Publish to Feed &amp; Notify
                                      </>
                                    )}
                                  </button>
                                </div>
                                {card.data.inAppTitle && (
                                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ink-primary)', marginBottom: '5px' }}>
                                    {card.data.inAppTitle}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                  {card.data.inAppBody}
                                </div>
                              </div>
                            )}

                            {card.data.whatsappCopy && (
                              <div
                                style={{
                                  background: 'var(--surface-elevated)',
                                  borderRadius: '14px',
                                  padding: '14px',
                                  border: '1px solid var(--hairline-border)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>
                                    💬 WHATSAPP GROUP MESSAGE
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(card.data.whatsappCopy, 'WhatsApp Message')}
                                    className="btn btn-outline interactive-press"
                                    style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Copy size={13} /> Copy WhatsApp
                                  </button>
                                </div>
                                <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                  {card.data.whatsappCopy}
                                </div>
                              </div>
                            )}

                            {card.data.instagramCopy && (
                              <div
                                style={{
                                  background: 'var(--surface-elevated)',
                                  borderRadius: '14px',
                                  padding: '14px',
                                  border: '1px solid var(--hairline-border)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ec4899' }}>
                                    📸 INSTAGRAM CAPTION
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(card.data.instagramCopy, 'Instagram Caption')}
                                    className="btn btn-outline interactive-press"
                                    style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Copy size={13} /> Copy Caption
                                  </button>
                                </div>
                                <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                  {card.data.instagramCopy}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 4. DOCUMENT LAUNCHPAD (UK Council RAMS / Sponsor Pitch / Grant Application)
                      if (card.type === 'document' && card.data?.content) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap',
                                paddingBottom: '12px',
                                borderBottom: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                                  Ready-to-Use Document
                                </div>
                                <h3 style={{ margin: '2px 0 0', fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                  {card.title}
                                </h3>
                              </div>

                              {hasProAccess ? (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(card.data.content, card.title || 'Document')}
                                    className="btn btn-outline interactive-press"
                                    style={{ padding: '7px 12px', borderRadius: '9px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Copy size={13} /> Copy Text
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadMarkdown(card.title, card.data.content)}
                                    className="btn btn-primary interactive-press"
                                    style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.76rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Download size={13} /> Download (.md)
                                  </button>
                                </div>
                              ) : (
                                onJumpToUpgrade && (
                                  <button
                                    type="button"
                                    onClick={onJumpToUpgrade}
                                    className="btn btn-primary interactive-press"
                                    style={{ padding: '8px 13px', borderRadius: '9px', fontSize: '0.76rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Lock size={13} /> Unlock Full Export (Leader Pro)
                                  </button>
                                )
                              )}
                            </div>

                            <div
                              style={{
                                background: 'var(--surface-elevated)',
                                border: '1px solid var(--hairline-border)',
                                borderRadius: '14px',
                                padding: '16px',
                                fontSize: '0.84rem',
                                color: 'var(--ink-secondary)',
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                              }}
                            >
                              {hasProAccess
                                ? card.data.content
                                : `${String(card.data.content).slice(0, 520)}...\n\n[Upgrade to Leader Pro (£20/mo) to export the full document alongside £5M Public Liability Insurance & 2% ticket fees.]`}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })()
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
