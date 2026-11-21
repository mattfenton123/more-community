"use client";
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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
  MessageSquare,
  Layers,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Trash2,
  TrendingUp,
  FileEdit,
  Compass,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { useToast } from './Toast';
import { cleanLocationName } from '../lib/location';
import { getCommunitySlug } from '../lib/communityLinks';
import { isEventPast } from '../lib/calendar';

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
      data: {
        events: events.map((ev) => ({
          weekLabel: ev.weekLabel || ev.themeBadge || '',
          title: ev.title || '',
          date: ev.date || '',
          time: ev.time || '10:00',
          location: ev.location || '',
          description: ev.description || '',
          maxCapacity: Number(ev.maxCapacity) || 25,
          ticketPrice: Number(ev.ticketPrice) || 0,
        })),
      },
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
      data: { question, options: [...options] },
    };
  }
  if (card.type === 'broadcast') {
    const inAppTitle = card.data?.inAppTitle || card.announcementTitle || '';
    const inAppBody = card.data?.inAppBody || card.inAppAnnouncement || card.body || '';
    const whatsappCopy = card.data?.whatsappCopy || card.whatsappCopy || '';
    const instagramCopy = card.data?.instagramCopy || card.instagramCopy || '';
    const pinToTop = Boolean(card.data?.pinToTop ?? card.pinToTop ?? true);
    return {
      type: 'broadcast',
      title: card.title || 'Announcement & Social Copy',
      data: { inAppTitle, inAppBody, whatsappCopy, instagramCopy, pinToTop },
    };
  }
  if (card.type === 'community_update') {
    const description = card.data?.description || card.description || '';
    const guidelines = Array.isArray(card.data?.guidelines)
      ? card.data.guidelines
      : Array.isArray(card.guidelines)
      ? card.guidelines
      : [];
    if (!description && guidelines.length === 0) return null;
    return {
      type: 'community_update',
      title: card.title || 'Community Profile & Guidelines Upgrade',
      data: { description, guidelines: [...guidelines] },
    };
  }
  if (card.type === 'audit') {
    const summary = card.data?.summary || card.summary || '';
    const metrics = Array.isArray(card.data?.metrics)
      ? card.data.metrics
      : Array.isArray(card.metrics)
      ? card.metrics
      : [];
    const actions = Array.isArray(card.data?.actions)
      ? card.data.actions
      : Array.isArray(card.actions)
      ? card.actions
      : [];
    if (!summary && actions.length === 0) return null;
    return {
      type: 'audit',
      title: card.title || 'Community Health & Growth Audit',
      data: { summary, metrics, actions },
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
  const router = useRouter();
  const {
    user,
    communities,
    communityMemberships,
    eventRsvps,
    polls,
    pollVotes,
    services,
    createEvent,
    createEventsBatch,
    createPost,
    createFeedPost,
    createPoll,
    updateCommunity,
  } = useAppContext();
  const { feedPosts } = useFeed();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [hasConsented, setHasConsented] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const hasProAccess = Boolean(
    isPro || user?.isAdmin || community?.is_insured || community?.insurance_tier === 'pro'
  );
  const communityLoc = cleanLocationName(community?.location_name) || 'Tunbridge Wells';
  const communitySlug = useMemo(
    () => (community ? getCommunitySlug(community, communities || []) : ''),
    [community, communities]
  );

  // Build deep real-time Community Intelligence Snapshot from AppContext
  const communitySnapshot = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const validEvents = (communityEvents || []).filter(
      (e) => e.status !== 'cancelled' && e.status !== 'proposed'
    );
    const upcoming = validEvents
      .filter((e) => !isEventPast(e) && (!e.date || e.date >= today))
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    const past = validEvents
      .filter((e) => isEventPast(e))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const pastEventsSummary = past.slice(0, 5).map((ev) => {
      const rsvps = (eventRsvps?.[ev.id] || []).filter((r) => r.status === 'going' || r.checkedIn);
      const checked = rsvps.filter((r) => r.checkedIn || r.checked_in).length;
      return {
        title: ev.title,
        date: ev.date,
        rsvps: rsvps.length,
        checkedIn: checked,
        turnoutPct: rsvps.length > 0 ? Math.round((checked / rsvps.length) * 100) : 0,
      };
    });

    const members = communityMemberships?.[community?.id] || [];
    const total = Math.max(members.length, memberCount || 1);
    let verifiedLocals = 0;
    let regulars3Plus = 0;
    members.forEach((m) => {
      const uid = m.userId || m.user_id;
      const attended = validEvents.filter((ev) =>
        (eventRsvps?.[ev.id] || []).some(
          (r) => r.userId === uid && (r.checkedIn || r.checked_in || (r.status === 'going' && isEventPast(ev)))
        )
      ).length;
      if (attended >= 1 || m.role === 'Leader' || m.role === 'Co-Leader') verifiedLocals++;
      if (attended >= 3) regulars3Plus++;
    });
    if (verifiedLocals === 0 && verifiedMemberCount > 0) verifiedLocals = verifiedMemberCount;
    const quietNeverAttended = Math.max(0, total - verifiedLocals);

    const activePolls = (polls || [])
      .filter((p) => p.community_id === community?.id)
      .slice(0, 4)
      .map((p) => ({
        question: p.question,
        votes: (pollVotes?.[p.id] || []).length,
      }));

    const recentFeedPosts = (feedPosts || [])
      .filter((p) => p.communityId === community?.id)
      .slice(0, 4)
      .map((p) => String(p.text || '').slice(0, 110));

    const pendingProposalsCount = (communityEvents || []).filter((e) => e.status === 'proposed').length;
    const pendingPitchesCount = (services || []).filter(
      (s) => s.communityId === community?.id && s.status === 'pending'
    ).length;

    const totalRevenue = validEvents.reduce((sum, ev) => {
      const count = (eventRsvps?.[ev.id] || []).filter((r) => r.status === 'going').length;
      return sum + count * Number(ev.ticketPrice || 0);
    }, 0);

    return {
      upcoming,
      description: community?.description || '',
      guidelines: Array.isArray(community?.guidelines) ? community.guidelines : [],
      hasWhatsappGroup: Boolean(community?.whatsapp_group),
      memberBreakdown: { total, verifiedLocals, regulars3Plus, quietNeverAttended },
      pastEventsSummary,
      activePolls,
      recentFeedPosts,
      pendingProposalsCount,
      pendingPitchesCount,
      totalRevenue,
    };
  }, [
    community,
    communityEvents,
    communityMemberships,
    eventRsvps,
    polls,
    pollVotes,
    feedPosts,
    services,
    memberCount,
    verifiedMemberCount,
  ]);

  const upcomingEvents = communitySnapshot.upcoming;
  const nextUpcomingEvent = upcomingEvents[0] || communityEvents[0] || null;

  const buildInitialMessages = () => {
    const commName = community?.name || 'your community';
    const mb = communitySnapshot.memberBreakdown;
    const nextNote = nextUpcomingEvent
      ? `Next on your calendar: **"${nextUpcomingEvent.title}"** (${nextUpcomingEvent.date || 'soon'}).`
      : `You currently have **0 upcoming meetups** scheduled — let's put something great on the calendar!`;

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        reply: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your **${commName}** Co-Pilot — connected to your live club data.\n\n**Live Snapshot:** **${mb.total} members** (${mb.verifiedLocals} Verified Locals, ${mb.quietNeverAttended} quiet newcomers who haven't attended yet). ${nextNote}\n\nTell me what you want to build or tap a quick goal — every draft appears in **Output & Launchpad** where you can **edit any field directly**, see **exactly where it publishes**, and launch in 1 tap.`,
        actionCard: null,
        suggestedReplies: [
          '📈 Audit my community & tell me what to do this week',
          '🚀 Launch a meetup this Sunday at 10am',
          '📊 Create a poll to vote on our next meetup',
          '✨ Rewrite our community bio & guidelines',
        ],
      },
    ];
  };

  const [messages, setMessages] = useState(() => buildInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeModelLabel, setActiveModelLabel] = useState('Gemini 2.5 Flash');

  // Active Output & Mobile Tab state
  const [selectedOutputMsgId, setSelectedOutputMsgId] = useState(null);
  const [mobileView, setMobileView] = useState('chat'); // 'chat' | 'output'

  // Launched / Published state + created destination URLs
  const [publishedEventsMap, setPublishedEventsMap] = useState({}); // key -> createdEventId or true
  const [publishingBatchMap, setPublishingBatchMap] = useState({});
  const [sendingBroadcastMap, setSendingBroadcastMap] = useState({});
  const [sentBroadcastMap, setSentBroadcastMap] = useState({});
  const [launchingPollMap, setLaunchingPollMap] = useState({});
  const [launchedPollMap, setLaunchedPollMap] = useState({});
  const [applyingProfileMap, setApplyingProfileMap] = useState({});
  const [appliedProfileMap, setAppliedProfileMap] = useState({});

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  const outputHistory = useMemo(
    () => messages.filter((m) => m.role === 'assistant' && m.actionCard),
    [messages]
  );

  const activeOutputMessage = useMemo(() => {
    if (outputHistory.length === 0) return null;
    if (selectedOutputMsgId) {
      const found = outputHistory.find((m) => m.id === selectedOutputMsgId);
      if (found) return found;
    }
    return outputHistory[outputHistory.length - 1];
  }, [outputHistory, selectedOutputMsgId]);

  // Inline editing helper to mutate an output card in place before launching
  const updateOutputCardData = (msgId, updaterFn) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.actionCard) return m;
        return {
          ...m,
          actionCard: {
            ...m.actionCard,
            data: updaterFn(m.actionCard.data),
          },
        };
      })
    );
  };

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
    setMobileView('chat');

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
          memberCount: communitySnapshot.memberBreakdown.total,
          verifiedCount: communitySnapshot.memberBreakdown.verifiedLocals,
          upcomingEvents: upcomingEvents.slice(0, 5).map((e) => ({
            title: e.title,
            date: e.date,
            time: e.time,
            location: cleanLocationName(e.location) || communityLoc,
            rsvps: (eventRsvps?.[e.id] || []).filter((r) => r.status === 'going').length,
          })),
          communitySnapshot: {
            description: communitySnapshot.description,
            guidelines: communitySnapshot.guidelines,
            hasWhatsappGroup: communitySnapshot.hasWhatsappGroup,
            memberBreakdown: communitySnapshot.memberBreakdown,
            pastEventsSummary: communitySnapshot.pastEventsSummary,
            activePolls: communitySnapshot.activePolls,
            recentFeedPosts: communitySnapshot.recentFeedPosts,
            pendingProposalsCount: communitySnapshot.pendingProposalsCount,
            pendingPitchesCount: communitySnapshot.pendingPitchesCount,
            totalRevenue: communitySnapshot.totalRevenue,
          },
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
          "I've drafted that in the Output & Launchpad panel. You can edit any detail directly before launching!",
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
            '📈 Audit my community & tell me what to do this week',
            '🚀 Launch a meetup this Sunday at 10am',
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
    if (!ev.title?.trim() || !ev.date?.trim()) {
      toast.error('Missing event details', 'Please ensure the event has a title and date.');
      return;
    }
    try {
      const created = await createEvent(community.id, {
        title: ev.title.trim(),
        description: ev.description || '',
        date: ev.date,
        time: ev.time || '10:00',
        location: ev.location || communityLoc,
        maxCapacity: Number(ev.maxCapacity) || 25,
        ticketPrice: Number(ev.ticketPrice) || 0,
        status: 'published',
      });
      setPublishedEventsMap((prev) => ({ ...prev, [key]: created?.id || true }));
      toast.success('Event Launched Live! 🚀', `"${ev.title}" is now on your Community Calendar & /events.`);
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
        title: (ev.title || 'Community Meetup').trim(),
        description: ev.description || '',
        date: ev.date,
        time: ev.time || '10:00',
        location: ev.location || communityLoc,
        maxCapacity: Number(ev.maxCapacity) || 25,
        ticketPrice: Number(ev.ticketPrice) || 0,
        status: 'published',
      }));

      const nextPublished = { ...publishedEventsMap };
      if (typeof createEventsBatch === 'function' && payloads.length > 1) {
        const createdBatch = await createEventsBatch(community.id, payloads);
        unpub.forEach(({ idx }, arrIdx) => {
          nextPublished[`${msgId}-${idx}`] = createdBatch?.[arrIdx]?.id || true;
        });
      } else {
        for (const { ev, idx } of unpub) {
          const created = await createEvent(community.id, {
            title: (ev.title || 'Community Meetup').trim(),
            description: ev.description || '',
            date: ev.date,
            time: ev.time || '10:00',
            location: ev.location || communityLoc,
            maxCapacity: Number(ev.maxCapacity) || 25,
            ticketPrice: Number(ev.ticketPrice) || 0,
            status: 'published',
          });
          nextPublished[`${msgId}-${idx}`] = created?.id || true;
        }
      }

      setPublishedEventsMap(nextPublished);
      toast.success(
        payloads.length === 1 ? 'Event Launched Live! 🚀' : 'Schedule Launched Live! 🚀',
        `Published ${unpub.length} event${unpub.length === 1 ? '' : 's'} to ${community.name} Calendar & /events.`
      );
    } catch (err) {
      toast.error('Launch error', err?.message || 'Could not publish events.');
    } finally {
      setPublishingBatchMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handlePublishBroadcastCard = async (msgId, broadcastData) => {
    if (!community?.id || !broadcastData?.inAppBody?.trim()) return;
    setSendingBroadcastMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const fullText = broadcastData.inAppTitle?.trim()
        ? `📣 **${broadcastData.inAppTitle.trim()}**\n\n${broadcastData.inAppBody.trim()}`
        : broadcastData.inAppBody.trim();
      if (typeof createFeedPost === 'function') {
        await createFeedPost(community.id, fullText, null, true, Boolean(broadcastData.pinToTop));
      }
      if (typeof createPost === 'function') {
        try {
          await createPost(community.id, fullText, null, ['in-app']);
        } catch {}
      }
      setSentBroadcastMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success(
        'Announcement Published! 📣',
        `Posted to ${community.name} Feed & notified all members.`
      );
    } catch (err) {
      toast.error('Broadcast Error', err?.message || 'Could not publish announcement.');
    } finally {
      setSendingBroadcastMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleLaunchPollCard = async (msgId, pollData) => {
    if (!community?.id) return;
    const cleanQ = String(pollData?.question || '').trim();
    const cleanOpts = (pollData?.options || []).map((o) => String(o || '').trim()).filter(Boolean);
    if (!cleanQ || cleanOpts.length < 2) {
      toast.error('Incomplete Poll', 'Add a question and at least 2 options before launching.');
      return;
    }
    setLaunchingPollMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      await createPoll(community.id, cleanQ, cleanOpts);
      setLaunchedPollMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success(
        'Poll Launched Live! 📊',
        `Live on ${community.name} Overview & Feed tabs — members notified!`
      );
    } catch (err) {
      toast.error('Poll Launch Error', err?.message || 'Could not launch community poll.');
    } finally {
      setLaunchingPollMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleApplyCommunityUpdate = async (msgId, updateData) => {
    if (!community?.id || typeof updateCommunity !== 'function') return;
    setApplyingProfileMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const payload = {};
      if (updateData.description?.trim()) payload.description = updateData.description.trim();
      if (Array.isArray(updateData.guidelines)) {
        const cleanRules = updateData.guidelines.map((g) => String(g || '').trim()).filter(Boolean);
        if (cleanRules.length > 0) payload.guidelines = cleanRules;
      }
      await updateCommunity(community.id, payload);
      setAppliedProfileMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success('Community Page Updated! ✨', 'Your new description and guidelines are now live.');
    } catch (err) {
      toast.error('Update Failed', err?.message || 'Could not update community profile.');
    } finally {
      setApplyingProfileMap((prev) => ({ ...prev, [msgId]: false }));
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

  const jumpToRoute = (path) => {
    if (onClose) onClose();
    router.push(path);
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
      return len === 1 ? '🚀 Event Draft' : `🗓️ ${len}-Event Plan`;
    }
    if (card.type === 'poll') return '📊 Poll Draft';
    if (card.type === 'broadcast') return '📣 Broadcast';
    if (card.type === 'community_update') return '✨ Bio & Rules';
    if (card.type === 'audit') return '📈 Growth Audit';
    if (card.type === 'document') return '🛡️ Document';
    return '✨ Draft';
  };

  const inputFieldStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '9px',
    background: 'var(--surface-card)',
    border: '1px solid var(--hairline-border-strong)',
    color: 'var(--ink-primary)',
    fontSize: '0.84rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  if (!mounted) return null;

  const modalContent = (
    <div
      className="copilot-portal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: 'rgba(10, 12, 18, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .copilot-portal-shell {
              width: 100%;
              height: 100dvh;
              max-width: 100%;
              border-radius: 0;
              border: none;
            }
            .copilot-portal-header {
              padding: max(12px, env(safe-area-inset-top)) 14px 12px 14px;
            }
            .copilot-portal-composer {
              padding: 10px 12px max(12px, env(safe-area-inset-bottom)) 12px;
            }
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
              .copilot-portal-backdrop {
                padding: 20px;
              }
              .copilot-portal-shell {
                max-width: 1180px !important;
                height: min(90dvh, 840px) !important;
                border-radius: 22px !important;
                border: 1px solid var(--hairline-border-strong) !important;
              }
              .copilot-portal-header {
                padding: 14px 20px !important;
              }
              .copilot-portal-composer {
                padding: 10px 14px !important;
              }
              .copilot-split-body {
                grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.18fr);
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
        className="copilot-portal-shell"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Modal Bar */}
        <div
          className="copilot-portal-header"
          style={{
            borderBottom: '1px solid var(--hairline-border)',
            background: 'var(--surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #EB5738, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <Sparkles size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.02rem',
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
                    padding: '2px 7px',
                    borderRadius: '99px',
                    fontSize: '0.62rem',
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
                  fontSize: '0.73rem',
                  color: 'var(--ink-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {community?.name || 'Community'} • {communitySnapshot.memberBreakdown.total} members • Live launchpad
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {hasConsented && messages.length > 1 && (
              <button
                type="button"
                onClick={handleResetChat}
                className="interactive-press"
                title="Start fresh chat"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-secondary)',
                  borderRadius: '9px',
                  padding: '6px 9px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="interactive-press"
                aria-label="Close Co-Pilot"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-primary)',
                  borderRadius: '9px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                }}
              >
                <X size={16} /> Close
              </button>
            )}
          </div>
        </div>

        {/* One-Time Consent Gate */}
        {!hasConsented ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                maxWidth: '500px',
                background: 'var(--surface-elevated)',
                border: '1px solid rgba(235, 87, 56, 0.3)',
                borderRadius: '18px',
                padding: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Shield size={24} color="#EB5738" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink-primary)', marginBottom: '6px' }}>
                    Privacy-First AI Disclosure
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
                    To plan events, create polls, audit growth, write broadcasts, and draft safety documents, More. AI Co-Pilot shares{' '}
                    <strong>only your community&apos;s public profile, aggregate counts, event summaries, and your chat prompts</strong> with Google Gemini.
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
                    🔒 <strong>Never shared:</strong> Member names, emails, private DMs, or phone numbers are excluded. Nothing publishes until you tap Launch.
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
            {/* Mobile Top Switcher: Conversation vs Live Output & Launchpad */}
            <div
              className="copilot-mobile-tabs"
              style={{
                padding: '8px 12px',
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
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border:
                    mobileView === 'chat'
                      ? '1.5px solid var(--brand-accent)'
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
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border:
                    mobileView === 'output'
                      ? '1.5px solid #10b981'
                      : outputHistory.length > 0
                      ? '1.5px solid rgba(16, 185, 129, 0.45)'
                      : '1px solid var(--hairline-border)',
                  background:
                    mobileView === 'output'
                      ? 'rgba(16, 185, 129, 0.16)'
                      : outputHistory.length > 0
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--surface-elevated)',
                  color:
                    mobileView === 'output' || outputHistory.length > 0
                      ? '#10b981'
                      : 'var(--ink-secondary)',
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
                Output &amp; Launch
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

            {/* Split-Pane Studio Body */}
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
                {/* Quick Goal Chips */}
                <div
                  style={{
                    padding: '9px 12px',
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
                      label: '📈 Health Audit',
                      prompt: `Audit ${community?.name || 'my community'} using our real member and turnout numbers and tell me the top 3 things I should do this week.`,
                    },
                    {
                      label: '🚀 New Event',
                      prompt: `Create a single welcoming meetup for ${community?.name || 'our community'} in ${communityLoc} this Sunday at 10:00 AM with a post-event coffee stop.`,
                    },
                    {
                      label: '🗓️ 4-Week Plan',
                      prompt: `Plan our next 4 weeks of meetups in ${communityLoc} with a mix of beginner-friendly and regular sessions.`,
                    },
                    {
                      label: '📊 Live Poll',
                      prompt: `Create a community poll asking members which day and time works best for our next meetup in ${communityLoc}.`,
                    },
                    {
                      label: '📣 Broadcast',
                      prompt:
                        'Draft a warm pinned announcement and WhatsApp message welcoming quiet newcomers to join their first in-person meetup.',
                    },
                    {
                      label: '✨ Bio & Rules',
                      prompt: `Rewrite our public Community Description and 4 friendly Community Guidelines for ${community?.name || 'our community'} in ${communityLoc}.`,
                    },
                    {
                      label: '🛡️ UK RAMS',
                      prompt: nextUpcomingEvent
                        ? `Draft a UK Council Risk Assessment (RAMS) for "${nextUpcomingEvent.title}" at ${cleanLocationName(nextUpcomingEvent.location) || communityLoc}.`
                        : `Draft a UK Council Risk Assessment (RAMS) for our next community meetup in ${communityLoc}.`,
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

                {/* Chat Stream */}
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
                            maxWidth: '92%',
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

                          {/* Clear CTA linking right to the Output & Launchpad pane */}
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
                                padding: '9px 12px',
                                borderRadius: '10px',
                                background: isSelectedOutput
                                  ? 'rgba(16, 185, 129, 0.16)'
                                  : 'rgba(16, 185, 129, 0.08)',
                                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                                color: '#10b981',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <span style={{ textAlign: 'left' }}>
                                {getOutputBadgeLabel(msg.actionCard)}: {msg.actionCard.title}
                              </span>
                              <span style={{ flexShrink: 0 }}>Edit &amp; Launch →</span>
                            </button>
                          )}
                        </div>

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
                      Analysing {community?.name || 'your club'} &amp; preparing live output...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Composer */}
                <form
                  className="copilot-portal-composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  style={{
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
                    placeholder="Ask anything, or tweak what's in the launchpad..."
                    style={{
                      flex: 1,
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border-strong)',
                      borderRadius: '12px',
                      outline: 'none',
                      resize: 'none',
                      color: 'var(--ink-primary)',
                      fontSize: '0.88rem',
                      fontFamily: 'inherit',
                      padding: '9px 12px',
                      minHeight: '40px',
                      maxHeight: '100px',
                      lineHeight: 1.4,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isThinking}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '10px 15px',
                      borderRadius: '12px',
                      fontSize: '0.84rem',
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

              {/* RIGHT PANE: EDITABLE OUTPUT & LAUNCHPAD CANVAS */}
              <div
                className={`copilot-pane-output ${mobileView === 'chat' ? 'mobile-hidden' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  background: 'var(--surface-card)',
                }}
              >
                {/* Output Pane Header + Session Draft History Switcher */}
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
                        fontSize: '0.78rem',
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
                    <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }} className="no-scrollbar">
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

                {/* Output Canvas Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px max(24px, env(safe-area-inset-bottom))' }}>
                  {!activeOutputMessage?.actionCard ? (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '16px',
                          background: 'rgba(235, 87, 56, 0.12)',
                          border: '1px solid rgba(235, 87, 56, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#EB5738',
                          marginBottom: '12px',
                        }}
                      >
                        <Compass size={26} />
                      </div>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.06rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                        Your Live Drafts &amp; Launch Controls Appear Here
                      </h3>
                      <p style={{ margin: '0 0 18px 0', fontSize: '0.83rem', color: 'var(--ink-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
                        Pick a quick goal below or chat on the left. You can <strong>edit every field inline</strong>, see <strong>exactly where it publishes</strong>, and jump straight to the live page once launched.
                      </p>

                      <div
                        style={{
                          width: '100%',
                          maxWidth: '460px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                          gap: '8px',
                        }}
                      >
                        {[
                          {
                            icon: '📈',
                            title: 'Community Health Audit',
                            sub: 'Real turnout & 3-step action plan',
                            prompt: `Audit ${community?.name || 'my community'} using our real member and turnout numbers and tell me the top 3 things I should do this week.`,
                          },
                          {
                            icon: '🚀',
                            title: 'Launch a New Meetup',
                            sub: 'Publishes to Club Calendar & /events',
                            prompt: `Create a single welcoming meetup for ${community?.name || 'our community'} in ${communityLoc} this Sunday at 10:00 AM with a post-event coffee stop.`,
                          },
                          {
                            icon: '📊',
                            title: 'Launch a Member Poll',
                            sub: 'Publishes to Community Page & notifies',
                            prompt: `Create a community poll asking members which day and time works best for our next meetup in ${communityLoc}.`,
                          },
                          {
                            icon: '✨',
                            title: 'Upgrade Bio & Guidelines',
                            sub: 'Updates your public microsite live',
                            prompt: `Rewrite our public Community Description and 4 friendly Community Guidelines for ${community?.name || 'our community'} in ${communityLoc}.`,
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
                            <div style={{ fontSize: '1.15rem', marginBottom: '4px' }}>{card.icon}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ink-primary)' }}>{card.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: '2px' }}>{card.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const msgId = activeOutputMessage.id;
                      const card = activeOutputMessage.actionCard;

                      // 1. INLINE-EDITABLE EVENTS LAUNCHPAD
                      if (card.type === 'events' && Array.isArray(card.data?.events)) {
                        const evList = card.data.events;
                        const allLaunched = evList.every((_, idx) => publishedEventsMap[`${msgId}-${idx}`]);

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Destination Clarity Banner */}
                            <div
                              style={{
                                padding: '10px 13px',
                                borderRadius: '12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.28)',
                                fontSize: '0.78rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <MapPin size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Where this goes:</strong> Publishes directly to <strong>{community?.name} Calendar</strong>, Public Events Discovery (<code>/events</code>), and <strong>Dashboard → Events</strong>.
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap',
                                paddingBottom: '10px',
                                borderBottom: '1px solid var(--hairline-border)',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#EB5738', textTransform: 'uppercase' }}>
                                  Edit Details Inline or Launch in 1 Tap
                                </div>
                                <h3 style={{ margin: '2px 0 0', fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
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
                                  fontSize: '0.83rem',
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
                                  ? 'Launched Live ✓'
                                  : evList.length === 1
                                  ? '🚀 Launch Event Live'
                                  : `🚀 Launch All (${evList.length})`}
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {evList.map((ev, idx) => {
                                const launchedId = publishedEventsMap[`${msgId}-${idx}`];
                                const isLaunched = Boolean(launchedId);
                                const updateEvField = (field, val) => {
                                  updateOutputCardData(msgId, (d) => ({
                                    ...d,
                                    events: d.events.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
                                  }));
                                };

                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      background: 'var(--surface-elevated)',
                                      border: isLaunched
                                        ? '1.5px solid rgba(16, 185, 129, 0.55)'
                                        : '1px solid var(--hairline-border)',
                                      borderRadius: '15px',
                                      padding: '14px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '9px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '99px', background: 'rgba(235, 87, 56, 0.14)', color: '#EB5738' }}>
                                        {ev.weekLabel || `Event ${idx + 1}`}
                                      </span>
                                      {isLaunched && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            jumpToRoute(
                                              typeof launchedId === 'string'
                                                ? `/events/${launchedId}`
                                                : `/community/${communitySlug || community?.id}?tab=events`
                                            )
                                          }
                                          style={{
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                            color: '#10b981',
                                            borderRadius: '99px',
                                            padding: '4px 10px',
                                            fontSize: '0.73rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          View Live Event <ExternalLink size={12} />
                                        </button>
                                      )}
                                    </div>

                                    <input
                                      type="text"
                                      disabled={isLaunched}
                                      value={ev.title}
                                      onChange={(e) => updateEvField('title', e.target.value)}
                                      placeholder="Event title"
                                      style={{ ...inputFieldStyle, fontWeight: 800, fontSize: '0.94rem' }}
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <input
                                        type="date"
                                        disabled={isLaunched}
                                        value={ev.date}
                                        onChange={(e) => updateEvField('date', e.target.value)}
                                        style={inputFieldStyle}
                                      />
                                      <input
                                        type="time"
                                        disabled={isLaunched}
                                        value={ev.time}
                                        onChange={(e) => updateEvField('time', e.target.value)}
                                        style={inputFieldStyle}
                                      />
                                    </div>

                                    <input
                                      type="text"
                                      disabled={isLaunched}
                                      value={ev.location}
                                      onChange={(e) => updateEvField('location', e.target.value)}
                                      placeholder="Meeting venue / landmark"
                                      style={inputFieldStyle}
                                    />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                      <div>
                                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                          Max Spots
                                        </label>
                                        <input
                                          type="number"
                                          min="2"
                                          disabled={isLaunched}
                                          value={ev.maxCapacity}
                                          onChange={(e) => updateEvField('maxCapacity', Number(e.target.value))}
                                          style={inputFieldStyle}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                          Ticket Price (£, 0 = Free)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.5"
                                          disabled={isLaunched}
                                          value={ev.ticketPrice}
                                          onChange={(e) => updateEvField('ticketPrice', Number(e.target.value))}
                                          style={inputFieldStyle}
                                        />
                                      </div>
                                    </div>

                                    <textarea
                                      rows={3}
                                      disabled={isLaunched}
                                      value={ev.description}
                                      onChange={(e) => updateEvField('description', e.target.value)}
                                      style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.45 }}
                                    />

                                    {!isLaunched && (
                                      <button
                                        type="button"
                                        onClick={() => handlePublishSingleEvent(msgId, ev, idx)}
                                        className="interactive-press"
                                        style={{
                                          padding: '9px 14px',
                                          borderRadius: '10px',
                                          border: '1px solid rgba(235, 87, 56, 0.45)',
                                          background: 'rgba(235, 87, 56, 0.12)',
                                          color: '#EB5738',
                                          fontSize: '0.8rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '6px',
                                        }}
                                      >
                                        <Plus size={14} /> Launch This Event Live
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // 2. INLINE-EDITABLE POLL LAUNCHPAD
                      if (card.type === 'poll' && card.data) {
                        const isLaunched = Boolean(launchedPollMap[msgId]);
                        const opts = card.data.options || [];

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Destination Clarity Banner */}
                            <div
                              style={{
                                padding: '10px 13px',
                                borderRadius: '12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.28)',
                                fontSize: '0.78rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <BarChart3 size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Where this goes:</strong> Appears live at the top of <strong>{community?.name} Overview &amp; Feed &amp; Photos</strong> AND sends a vote notification to all <strong>{communitySnapshot.memberBreakdown.total} members</strong>.
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>
                                  Edit Question &amp; Options Inline
                                </div>
                                <h3 style={{ margin: '2px 0 0', fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                  {card.title}
                                </h3>
                              </div>

                              {isLaunched ? (
                                <button
                                  type="button"
                                  onClick={() => jumpToRoute(`/community/${communitySlug || community?.id}?tab=feed`)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '9px 15px', borderRadius: '11px', fontSize: '0.82rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  View Live Poll <ExternalLink size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={launchingPollMap[msgId]}
                                  onClick={() => handleLaunchPollCard(msgId, card.data)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '10px 16px', borderRadius: '11px', fontSize: '0.83rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  {launchingPollMap[msgId] ? <Loader2 size={15} className="spin" /> : <BarChart3 size={15} />}
                                  🚀 Launch Poll Live
                                </button>
                              )}
                            </div>

                            <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border)', borderRadius: '15px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                                  Poll Question
                                </label>
                                <input
                                  type="text"
                                  disabled={isLaunched}
                                  value={card.data.question}
                                  onChange={(e) =>
                                    updateOutputCardData(msgId, (d) => ({ ...d, question: e.target.value }))
                                  }
                                  style={{ ...inputFieldStyle, fontWeight: 800, fontSize: '0.94rem' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
                                  Voting Options
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                  {opts.map((opt, oIdx) => (
                                    <div key={oIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        disabled={isLaunched}
                                        value={opt}
                                        onChange={(e) =>
                                          updateOutputCardData(msgId, (d) => ({
                                            ...d,
                                            options: d.options.map((x, idx2) => (idx2 === oIdx ? e.target.value : x)),
                                          }))
                                        }
                                        style={inputFieldStyle}
                                      />
                                      {!isLaunched && opts.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            updateOutputCardData(msgId, (d) => ({
                                              ...d,
                                              options: d.options.filter((_, idx2) => idx2 !== oIdx),
                                            }))
                                          }
                                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {!isLaunched && opts.length < 6 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOutputCardData(msgId, (d) => ({
                                        ...d,
                                        options: [...(d.options || []), ''],
                                      }))
                                    }
                                    style={{
                                      marginTop: '8px',
                                      background: 'transparent',
                                      border: '1px dashed var(--hairline-border-strong)',
                                      color: 'var(--ink-secondary)',
                                      borderRadius: '8px',
                                      padding: '6px 10px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    + Add Option
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 3. INLINE-EDITABLE BROADCAST & SOCIAL PACK
                      if (card.type === 'broadcast' && card.data) {
                        const isSent = Boolean(sentBroadcastMap[msgId]);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                padding: '10px 13px',
                                borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.28)',
                                fontSize: '0.78rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <Megaphone size={15} color="#10b981" style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Where this goes:</strong> Publishes to <strong>{community?.name} Feed &amp; Photos</strong>{card.data.pinToTop ? ' (pinned to top)' : ''} + notifies all <strong>{communitySnapshot.memberBreakdown.total} members</strong>. WhatsApp &amp; Instagram copies are ready below.
                              </span>
                            </div>

                            {card.data.inAppBody !== undefined && (
                              <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '9px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#EB5738' }}>
                                    📣 IN-APP FEED &amp; PUSH NOTIFICATION
                                  </span>
                                  {isSent ? (
                                    <button
                                      type="button"
                                      onClick={() => jumpToRoute(`/community/${communitySlug || community?.id}?tab=feed`)}
                                      className="btn btn-primary interactive-press"
                                      style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.76rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                    >
                                      View on Feed <ExternalLink size={13} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={sendingBroadcastMap[msgId]}
                                      onClick={() => handlePublishBroadcastCard(msgId, card.data)}
                                      className="btn btn-primary interactive-press"
                                      style={{ padding: '7px 13px', borderRadius: '9px', fontSize: '0.76rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                    >
                                      {sendingBroadcastMap[msgId] ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
                                      Publish to Feed &amp; Notify
                                    </button>
                                  )}
                                </div>

                                <input
                                  type="text"
                                  disabled={isSent}
                                  value={card.data.inAppTitle || ''}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, inAppTitle: e.target.value }))}
                                  placeholder="Announcement headline"
                                  style={{ ...inputFieldStyle, fontWeight: 800 }}
                                />
                                <textarea
                                  rows={3}
                                  disabled={isSent}
                                  value={card.data.inAppBody || ''}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, inAppBody: e.target.value }))}
                                  style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                                />
                                {!isSent && (
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-secondary)', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(card.data.pinToTop)}
                                      onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, pinToTop: e.target.checked }))}
                                      style={{ accentColor: '#EB5738' }}
                                    />
                                    📌 Pin announcement to the top of Community Feed
                                  </label>
                                )}
                              </div>
                            )}

                            {card.data.whatsappCopy && (
                              <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981' }}>💬 WHATSAPP GROUP COPY</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(card.data.whatsappCopy, 'WhatsApp Message')}
                                    className="btn btn-outline interactive-press"
                                    style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Copy size={13} /> Copy WhatsApp
                                  </button>
                                </div>
                                <textarea
                                  rows={4}
                                  value={card.data.whatsappCopy}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, whatsappCopy: e.target.value }))}
                                  style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                                />
                              </div>
                            )}

                            {card.data.instagramCopy && (
                              <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ec4899' }}>📸 INSTAGRAM CAPTION</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(card.data.instagramCopy, 'Instagram Caption')}
                                    className="btn btn-outline interactive-press"
                                    style={{ padding: '6px 11px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <Copy size={13} /> Copy Caption
                                  </button>
                                </div>
                                <textarea
                                  rows={3}
                                  value={card.data.instagramCopy}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, instagramCopy: e.target.value }))}
                                  style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 4. COMMUNITY BIO & GUIDELINES LIVE UPGRADE
                      if (card.type === 'community_update' && card.data) {
                        const isApplied = Boolean(appliedProfileMap[msgId]);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                padding: '10px 13px',
                                borderRadius: '12px',
                                background: 'rgba(139, 92, 246, 0.1)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                fontSize: '0.78rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <FileEdit size={15} color="#a78bfa" style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Where this goes:</strong> Updates your public <strong>{community?.name} Page</strong> description and join guidelines immediately.
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <h3 style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                {card.title}
                              </h3>
                              {isApplied ? (
                                <button
                                  type="button"
                                  onClick={() => jumpToRoute(`/community/${communitySlug || community?.id}`)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '9px 15px', borderRadius: '11px', fontSize: '0.82rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  View Updated Page <ExternalLink size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={applyingProfileMap[msgId]}
                                  onClick={() => handleApplyCommunityUpdate(msgId, card.data)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '10px 16px', borderRadius: '11px', fontSize: '0.83rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  {applyingProfileMap[msgId] ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                                  ✨ Apply Live to Community Page
                                </button>
                              )}
                            </div>

                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                                  Public Community Bio / Description
                                </label>
                                <textarea
                                  rows={5}
                                  disabled={isApplied}
                                  value={card.data.description || ''}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, description: e.target.value }))}
                                  style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
                                  Community Guidelines (Shown When New Members Join)
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                  {(card.data.guidelines || []).map((rule, rIdx) => (
                                    <input
                                      key={rIdx}
                                      type="text"
                                      disabled={isApplied}
                                      value={rule}
                                      onChange={(e) =>
                                        updateOutputCardData(msgId, (d) => ({
                                          ...d,
                                          guidelines: d.guidelines.map((x, idx2) => (idx2 === rIdx ? e.target.value : x)),
                                        }))
                                      }
                                      style={inputFieldStyle}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 5. LIVE COMMUNITY HEALTH & GROWTH AUDIT
                      if (card.type === 'audit' && card.data) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <TrendingUp size={13} /> Powered by Live Dashboard Data
                              </div>
                              <h3 style={{ margin: '2px 0 6px', fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                {card.title}
                              </h3>
                              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                                {card.data.summary}
                              </p>
                            </div>

                            {Array.isArray(card.data.metrics) && card.data.metrics.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                                {card.data.metrics.map((met, mIdx) => {
                                  const color =
                                    met.status === 'good'
                                      ? '#10b981'
                                      : met.status === 'action'
                                      ? '#EB5738'
                                      : '#f59e0b';
                                  return (
                                    <div
                                      key={mIdx}
                                      style={{
                                        background: 'var(--surface-elevated)',
                                        border: `1px solid ${color}40`,
                                        borderRadius: '13px',
                                        padding: '12px',
                                        textAlign: 'center',
                                      }}
                                    >
                                      <div style={{ fontSize: '1.22rem', fontWeight: 800, color }}>{met.value}</div>
                                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '2px', textTransform: 'uppercase' }}>
                                        {met.label}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {(card.data.actions || []).map((act, aIdx) => (
                                <div
                                  key={aIdx}
                                  style={{
                                    background: 'var(--surface-elevated)',
                                    border: '1px solid var(--hairline-border)',
                                    borderRadius: '14px',
                                    padding: '14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                  }}
                                >
                                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                                    {aIdx + 1}. {act.title}
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
                                    {act.reason}
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      disabled={isThinking}
                                      onClick={() => handleSendMessage(act.prompt)}
                                      className="btn btn-primary interactive-press"
                                      style={{
                                        padding: '8px 14px',
                                        borderRadius: '9px',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                      }}
                                    >
                                      ✨ {act.buttonLabel || 'Draft This Now'} →
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // 6. EDITABLE DOCUMENT (RAMS / SPONSOR / GRANT)
                      if (card.type === 'document' && card.data?.content) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                                  Exportable Document (Edit Inline Before Copy / Download)
                                </div>
                                <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
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

                            {hasProAccess ? (
                              <textarea
                                rows={16}
                                value={card.data.content}
                                onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, content: e.target.value }))}
                                style={{
                                  ...inputFieldStyle,
                                  background: 'var(--surface-elevated)',
                                  padding: '14px',
                                  fontSize: '0.83rem',
                                  lineHeight: 1.55,
                                  resize: 'vertical',
                                }}
                              />
                            ) : (
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
                                {`${String(card.data.content).slice(0, 520)}...\n\n[Upgrade to Leader Pro (£20/mo) to export the full document alongside £5M Public Liability Insurance & 2% ticket fees.]`}
                              </div>
                            )}
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

  return createPortal(modalContent, document.body);
}
