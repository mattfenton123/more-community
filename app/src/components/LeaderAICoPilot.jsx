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
  Mic,
  MicOff,
  Settings2,
  Bell,
  Hash,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { useToast } from './Toast';
import { cleanLocationName } from '../lib/location';
import { getCommunitySlug } from '../lib/communityLinks';
import { isEventPast } from '../lib/calendar';

const CONSENT_STORAGE_KEY = 'more_ai_copilot_consent_v1';

const COMMUNITY_SETTING_KEYS = [
  'name',
  'description',
  'guidelines',
  'category',
  'location_name',
  'cost',
  'target_audience',
  'activity_level',
  'tags',
  'visibility',
  'subscription_price',
  'whatsapp_group',
  'instagram_handle',
  'website',
  'require_approval',
  'accepts_pitches',
  'allow_carpool',
  'allow_guests',
  'allow_chapters',
];

function buildCommunityBaseData(community) {
  const rawTags = Array.isArray(community?.tags)
    ? community.tags.filter((t) => typeof t === 'string' && !t.startsWith('__cfg:'))
    : [];
  return {
    name: community?.name || '',
    description: community?.description || '',
    guidelines: Array.isArray(community?.guidelines) ? [...community.guidelines] : [],
    category: community?.category || rawTags[0] || '',
    location_name: cleanLocationName(community?.location_name) || '',
    cost: community?.cost || 'Free',
    target_audience: community?.target_audience || '',
    activity_level: community?.activity_level || 'Active',
    tagsText: rawTags.join(', '),
    visibility: community?.visibility || 'public',
    subscription_price: Number(community?.subscription_price || 0),
    whatsapp_group: community?.whatsapp_group || '',
    instagram_handle: community?.instagram_handle || '',
    website: community?.website || '',
    require_approval: Boolean(community?.require_approval),
    accepts_pitches: community?.accepts_pitches !== false,
    allow_carpool: community?.allow_carpool !== false,
    allow_guests: community?.allow_guests !== false,
    allow_chapters: community?.allow_chapters !== false,
  };
}

function normalizeActionCard(card, { community = null, upcomingEvents = [] } = {}) {
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
          requireApproval: Boolean(ev.requireApproval),
          allowCarpool: ev.allowCarpool !== false,
          allowGuests: ev.allowGuests !== false,
        })),
      },
    };
  }
  if (card.type === 'event_update') {
    const src = card.data || card;
    const rawId = src.eventId || src.id || '';
    const rawTitle = String(src.eventTitle || src.changes?.title || '').toLowerCase();
    const matched =
      upcomingEvents.find((e) => e.id === rawId) ||
      (rawTitle ? upcomingEvents.find((e) => String(e.title || '').toLowerCase().includes(rawTitle.slice(0, 14))) : null) ||
      upcomingEvents[0] ||
      null;
    if (!matched && !rawId) return null;
    const ch = src.changes && typeof src.changes === 'object' ? src.changes : src;
    const action = src.action === 'cancel' || ch.status === 'cancelled' || ch.cancel === true ? 'cancel' : 'update';
    return {
      type: 'event_update',
      title: card.title || (action === 'cancel' ? `Cancel Event — ${matched?.title || src.eventTitle || 'Event'}` : `Edit Event — ${matched?.title || src.eventTitle || 'Event'}`),
      data: {
        eventId: matched?.id || rawId,
        originalTitle: matched?.title || src.eventTitle || '',
        action,
        confirmCancel: false,
        title: ch.title !== undefined && ch.title !== '' ? ch.title : (matched?.title || ''),
        date: ch.date !== undefined && ch.date !== '' ? ch.date : (matched?.date || ''),
        time: ch.time !== undefined && ch.time !== '' ? ch.time : (matched?.time || '10:00'),
        location: ch.location !== undefined && ch.location !== '' ? ch.location : (cleanLocationName(matched?.location) || ''),
        description: ch.description !== undefined ? ch.description : (matched?.description || ''),
        maxCapacity: ch.maxCapacity !== undefined ? Number(ch.maxCapacity) : Number(matched?.maxCapacity || matched?.max_capacity || 25),
        ticketPrice: ch.ticketPrice !== undefined ? Number(ch.ticketPrice) : Number(matched?.ticketPrice ?? matched?.ticket_price ?? 0),
        requireApproval: ch.requireApproval !== undefined ? Boolean(ch.requireApproval) : Boolean(matched?.requireApproval),
        allowCarpool: ch.allowCarpool !== undefined ? Boolean(ch.allowCarpool) : (matched?.allowCarpool !== false),
        allowGuests: ch.allowGuests !== undefined ? Boolean(ch.allowGuests) : (matched?.allowGuests !== false),
      },
    };
  }
  if (card.type === 'event_reminder') {
    const src = card.data || card;
    const rawId = src.eventId || src.id || '';
    const matched = upcomingEvents.find((e) => e.id === rawId) || upcomingEvents[0] || null;
    if (!matched && !rawId) return null;
    return {
      type: 'event_reminder',
      title: card.title || `Send Reminder — ${matched?.title || src.eventTitle || 'Event'}`,
      data: {
        eventId: matched?.id || rawId,
        eventTitle: matched?.title || src.eventTitle || 'Upcoming Event',
        message: src.message || `⏰ Reminder: ${matched?.title || 'Our upcoming meetup'} is coming up${matched?.date ? ` on ${matched.date}` : ''}${matched?.time ? ` at ${matched.time}` : ''}! Looking forward to seeing you there.`,
      },
    };
  }
  if (card.type === 'create_channel') {
    const src = card.data || card;
    const rawName = String(src.channelName || src.name || '').trim();
    if (!rawName) return null;
    return {
      type: 'create_channel',
      title: card.title || `Create #${rawName} Chat Channel`,
      data: {
        channelName: rawName,
        channelType: src.channelType === 'announcement' || src.type === 'announcement' ? 'announcement' : 'text',
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
    const src = card.data || card;
    const base = buildCommunityBaseData(community);
    const touched = [];
    const merged = { ...base };

    COMMUNITY_SETTING_KEYS.forEach((key) => {
      if (src[key] === undefined || src[key] === null) return;
      if (key === 'guidelines') {
        if (Array.isArray(src.guidelines)) {
          merged.guidelines = [...src.guidelines.map((g) => String(g || ''))];
          touched.push('guidelines');
        }
        return;
      }
      if (key === 'tags') {
        if (Array.isArray(src.tags)) {
          merged.tagsText = src.tags.filter((t) => typeof t === 'string' && !t.startsWith('__cfg:')).join(', ');
          touched.push('tags');
        } else if (typeof src.tags === 'string') {
          merged.tagsText = src.tags;
          touched.push('tags');
        }
        return;
      }
      if (key === 'subscription_price') {
        const num = Number(src.subscription_price);
        if (!Number.isNaN(num) && num >= 0) {
          merged.subscription_price = num;
          touched.push('subscription_price');
        }
        return;
      }
      if (
        key === 'require_approval' ||
        key === 'accepts_pitches' ||
        key === 'allow_carpool' ||
        key === 'allow_guests' ||
        key === 'allow_chapters'
      ) {
        merged[key] = Boolean(src[key]);
        touched.push(key);
        return;
      }
      if (typeof src[key] === 'string' && (src[key].trim() !== '' || key === 'whatsapp_group' || key === 'instagram_handle' || key === 'website')) {
        merged[key] = src[key];
        touched.push(key);
      }
    });

    const hasAdvancedTouched = touched.some(
      (k) => k !== 'description' && k !== 'guidelines'
    );

    return {
      type: 'community_update',
      title: card.title || 'Community Settings & Club Rules',
      data: {
        ...merged,
        touchedFields: touched,
        showAllSettings: Boolean(src.showAllSettings || hasAdvancedTouched),
      },
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
    channels,
    createEvent,
    createEventsBatch,
    updateEvent,
    cancelEvent,
    sendEventReminder,
    createChannel,
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

    const communityChannels = (channels || [])
      .filter((ch) => (ch.community_id || ch.communityId) === community?.id && ch.type !== 'dm')
      .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type || 'text' }));

    return {
      upcoming,
      description: community?.description || '',
      guidelines: Array.isArray(community?.guidelines) ? community.guidelines : [],
      category: community?.category || '',
      cost: community?.cost || 'Free',
      target_audience: community?.target_audience || '',
      activity_level: community?.activity_level || 'Active',
      visibility: community?.visibility || 'public',
      subscription_price: Number(community?.subscription_price || 0),
      website: community?.website || '',
      instagram_handle: community?.instagram_handle || '',
      whatsapp_group: community?.whatsapp_group || '',
      require_approval: Boolean(community?.require_approval),
      accepts_pitches: community?.accepts_pitches !== false,
      allow_carpool: community?.allow_carpool !== false,
      allow_guests: community?.allow_guests !== false,
      allow_chapters: community?.allow_chapters !== false,
      hasWhatsappGroup: Boolean(community?.whatsapp_group),
      channels: communityChannels,
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
    channels,
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
        reply: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your **${commName}** Co-Pilot — connected to your live club data.\n\n**Live Snapshot:** **${mb.total} members** (${mb.verifiedLocals} Verified Locals, ${mb.quietNeverAttended} quiet newcomers who haven't attended yet). ${nextNote}\n\nType or tap the **microphone** to talk — you can create or edit events, add club rules, tweak any club setting, send attendee reminders, create chat channels, launch polls, or broadcast to members. Everything opens in **Output & Launchpad** so you can review, edit inline, and publish in 1 tap.`,
        actionCard: null,
        suggestedReplies: [
          '📈 Audit my community & tell me what to do this week',
          '🚀 Launch a meetup this Sunday at 10am',
          '📊 Create a poll to vote on our next meetup',
          '⚙️ Add a new club rule or update settings',
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
  const [hasUnreadOutput, setHasUnreadOutput] = useState(false);

  // Studio-Grade Voice Input (MediaRecorder -> Gemini 2.5 Flash /api/ai/transcribe)
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const autoSendAfterTranscribeRef = useRef(false);
  const voiceBaseTextRef = useRef('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const canRecord = Boolean(
        navigator?.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined'
      );
      setSpeechSupported(canRecord);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
        }
      } catch {}
      try {
        mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
      } catch {}
    };
  }, []);

  const cleanupRecordingStream = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    try {
      mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    setIsListening(false);
    setRecordingSeconds(0);
  };

  const stopListening = (autoSend = false) => {
    autoSendAfterTranscribeRef.current = Boolean(autoSend);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        cleanupRecordingStream();
      }
    } else {
      cleanupRecordingStream();
    }
  };

  const cancelListening = () => {
    autoSendAfterTranscribeRef.current = false;
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.onstop = null;
        rec.stop();
      } catch {}
    }
    audioChunksRef.current = [];
    cleanupRecordingStream();
  };

  const toggleListening = async () => {
    if (isTranscribing) return;
    if (isListening) {
      stopListening(false);
      return;
    }
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      toast.info(
        'Microphone unavailable here',
        'Try Chrome, Safari, or Edge over HTTPS — or use your phone keyboard microphone.'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      voiceBaseTextRef.current = inputValue.trim();
      autoSendAfterTranscribeRef.current = false;

      // Pick best cross-browser MIME (iOS Safari uses audio/mp4, Chrome/Android uses audio/webm)
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const chosenMime = mimeCandidates.find((m) => {
        try {
          return typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(m);
        } catch {
          return false;
        }
      });

      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const shouldAutoSend = autoSendAfterTranscribeRef.current;
        const chunks = [...audioChunksRef.current];
        const mimeType = recorder.mimeType || chosenMime || 'audio/webm';
        audioChunksRef.current = [];
        cleanupRecordingStream();

        if (chunks.length === 0) {
          toast.info('Nothing recorded', 'Tap the microphone and speak clearly for at least 1 second.');
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 400) {
          toast.info('Recording too short', 'Hold on a moment longer while speaking, then tap Stop.');
          return;
        }

        setIsTranscribing(true);
        try {
          const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          const fd = new FormData();
          fd.append('audio', blob, `voice.${ext}`);
          fd.append('context', `${community?.name || ''} in ${communityLoc}`);

          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: fd,
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || 'Could not transcribe voice note.');
          }

          const transcript = String(data?.text || '').trim();
          if (!transcript) {
            toast.info('No speech detected', 'Try speaking a bit closer to your microphone.');
            return;
          }

          const combined = voiceBaseTextRef.current
            ? `${voiceBaseTextRef.current} ${transcript}`.trim()
            : transcript;

          if (shouldAutoSend) {
            setInputValue('');
            handleSendMessage(combined);
          } else {
            setInputValue(combined);
          }
        } catch (err) {
          toast.error('Voice transcription failed', err?.message || 'Please try again or type your message.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsListening(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      cleanupRecordingStream();
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error(
          'Microphone permission blocked',
          'Allow microphone access in your browser settings to talk to More AI.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast.error('No microphone found', 'Connect a microphone and try again.');
      } else {
        toast.error('Could not start recording', err?.message || 'Please check browser permissions.');
      }
    }
  };

  // Launched / Published state + created destination URLs
  const [publishedEventsMap, setPublishedEventsMap] = useState({}); // key -> createdEventId or true
  const [publishingBatchMap, setPublishingBatchMap] = useState({});
  const [sendingBroadcastMap, setSendingBroadcastMap] = useState({});
  const [sentBroadcastMap, setSentBroadcastMap] = useState({});
  const [launchingPollMap, setLaunchingPollMap] = useState({});
  const [launchedPollMap, setLaunchedPollMap] = useState({});
  const [applyingProfileMap, setApplyingProfileMap] = useState({});
  const [appliedProfileMap, setAppliedProfileMap] = useState({});
  const [applyingEventUpdateMap, setApplyingEventUpdateMap] = useState({});
  const [appliedEventUpdateMap, setAppliedEventUpdateMap] = useState({});
  const [sendingReminderMap, setSendingReminderMap] = useState({});
  const [sentReminderMap, setSentReminderMap] = useState({});
  const [creatingChannelMap, setCreatingChannelMap] = useState({});
  const [createdChannelMap, setCreatedChannelMap] = useState({});

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
    stopListening();
    setMessages(buildInitialMessages());
    setSelectedOutputMsgId(null);
    setMobileView('chat');
    setHasUnreadOutput(false);
    setInputValue('');
  };

  // Instant 1-tap Club Settings & Rules Editor (no AI wait needed!)
  const handleOpenLiveSettingsEditor = () => {
    stopListening();
    const msgId = `settings-${Date.now()}`;
    const card = normalizeActionCard(
      {
        type: 'community_update',
        title: `Live Club Settings & Rules — ${community?.name || 'Community'}`,
        showAllSettings: true,
      },
      { community, upcomingEvents }
    );
    if (!card) return;
    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        role: 'assistant',
        reply: `I've loaded all live settings, bio, links, toggles, and **Club Rules** for **${community?.name || 'your community'}** directly into the **Output & Launchpad** panel.\n\nTap **+ Add Club Rule** to add new guidelines, tweak any setting or toggle, or tell me what you'd like me to rewrite — then tap **Apply Live to Community Page**.`,
        actionCard: card,
        suggestedReplies: [
          'Rewrite our club bio to welcome first-timers',
          'Add a friendly dog-on-lead club rule',
          'Make our club visibility invite-only',
        ],
      },
    ]);
    setSelectedOutputMsgId(msgId);
    setMobileView('output');
    setHasUnreadOutput(false);
  };

  const handleSendMessage = async (textOverride = null) => {
    if (isListening) stopListening();
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
          communityTags: (community?.tags || []).filter((t) => typeof t === 'string' && !t.startsWith('__cfg:')),
          memberCount: communitySnapshot.memberBreakdown.total,
          verifiedCount: communitySnapshot.memberBreakdown.verifiedLocals,
          upcomingEvents: upcomingEvents.slice(0, 8).map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time,
            location: cleanLocationName(e.location) || communityLoc,
            maxCapacity: Number(e.maxCapacity || e.max_capacity || 25),
            ticketPrice: Number(e.ticketPrice ?? e.ticket_price ?? 0),
            requireApproval: Boolean(e.requireApproval),
            allowCarpool: e.allowCarpool !== false,
            allowGuests: e.allowGuests !== false,
            description: String(e.description || '').slice(0, 220),
            rsvps: (eventRsvps?.[e.id] || []).filter((r) => r.status === 'going').length,
          })),
          communitySnapshot: {
            description: communitySnapshot.description,
            guidelines: communitySnapshot.guidelines,
            category: communitySnapshot.category,
            cost: communitySnapshot.cost,
            target_audience: communitySnapshot.target_audience,
            activity_level: communitySnapshot.activity_level,
            visibility: communitySnapshot.visibility,
            subscription_price: communitySnapshot.subscription_price,
            website: communitySnapshot.website,
            instagram_handle: communitySnapshot.instagram_handle,
            whatsapp_group: communitySnapshot.whatsapp_group,
            require_approval: communitySnapshot.require_approval,
            accepts_pitches: communitySnapshot.accepts_pitches,
            allow_carpool: communitySnapshot.allow_carpool,
            allow_guests: communitySnapshot.allow_guests,
            allow_chapters: communitySnapshot.allow_chapters,
            hasWhatsappGroup: communitySnapshot.hasWhatsappGroup,
            channels: communitySnapshot.channels,
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
      const normalizedCard = normalizeActionCard(data?.actionCard, {
        community,
        upcomingEvents,
      });
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
        // Auto-open Output & Launch tab on mobile so leaders never have to ask twice
        setMobileView('output');
        setHasUnreadOutput(false);
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

  const appendSystemConfirmation = (replyText, suggestedReplies = []) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-done-${Date.now()}`,
        role: 'assistant',
        reply: replyText,
        actionCard: null,
        suggestedReplies,
      },
    ]);
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
        requireApproval: Boolean(ev.requireApproval),
        allowCarpool: ev.allowCarpool !== false,
        allowGuests: ev.allowGuests !== false,
        status: 'published',
      });
      setPublishedEventsMap((prev) => ({ ...prev, [key]: created?.id || true }));
      toast.success('Event Launched Live! 🚀', `"${ev.title}" is now on your Community Calendar & /events.`);
      appendSystemConfirmation(
        `✅ **Event Launched Live!** **"${ev.title.trim()}"** (${ev.date} at ${ev.time || '10:00'}) is now live on your **${community.name} Calendar** and \`/events\`.`,
        ['Draft a WhatsApp invite for this event', 'Create a poll for members', 'Generate a UK RAMS risk assessment']
      );
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
        requireApproval: Boolean(ev.requireApproval),
        allowCarpool: ev.allowCarpool !== false,
        allowGuests: ev.allowGuests !== false,
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
            requireApproval: Boolean(ev.requireApproval),
            allowCarpool: ev.allowCarpool !== false,
            allowGuests: ev.allowGuests !== false,
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
      appendSystemConfirmation(
        `✅ **${unpub.length === 1 ? 'Event' : `${unpub.length} Events`} Launched Live!** Published to your **${community.name} Calendar** and \`/events\`.`,
        ['Draft a WhatsApp announcement for members', 'Create a poll for our community', 'Generate a UK RAMS risk assessment']
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
      appendSystemConfirmation(
        `✅ **Announcement Published Live!** Posted to your **${community.name} Feed** and notified all members.`,
        ['Create a poll for members', 'Plan our next 4 weeks of meetups', 'Audit our community health']
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
      appendSystemConfirmation(
        `✅ **Poll Launched Live!** **"${cleanQ}"** is now live on your **${community.name} Page (Overview & Feed)** and all members have been notified to vote.`,
        ['Draft a WhatsApp message to share this poll', 'Launch a new meetup', 'Audit our community health']
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
      if (updateData.name?.trim()) payload.name = updateData.name.trim();
      if (updateData.description !== undefined) payload.description = String(updateData.description || '').trim();
      if (Array.isArray(updateData.guidelines)) {
        payload.guidelines = updateData.guidelines.map((g) => String(g || '').trim()).filter(Boolean);
      }
      if (updateData.category?.trim()) payload.category = updateData.category.trim();
      if (updateData.location_name?.trim()) payload.location_name = updateData.location_name.trim();
      if (updateData.cost !== undefined) payload.cost = String(updateData.cost || '').trim() || 'Free';
      if (updateData.target_audience !== undefined) payload.target_audience = String(updateData.target_audience || '').trim();
      if (updateData.activity_level) payload.activity_level = updateData.activity_level;
      if (updateData.tagsText !== undefined) {
        const cleanedTags = String(updateData.tagsText || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        if (cleanedTags.length > 0) payload.tags = cleanedTags;
      }
      if (['public', 'private', 'invite-only'].includes(updateData.visibility)) {
        payload.visibility = updateData.visibility;
      }
      if (updateData.subscription_price !== undefined && updateData.subscription_price !== '') {
        const numPrice = Math.max(0, Number(updateData.subscription_price) || 0);
        payload.subscription_price = numPrice;
      }
      if (updateData.whatsapp_group !== undefined) {
        let wa = String(updateData.whatsapp_group || '').trim();
        if (wa && !/^https?:\/\//i.test(wa)) wa = `https://${wa}`;
        payload.whatsapp_group = wa;
      }
      if (updateData.instagram_handle !== undefined) {
        let ig = String(updateData.instagram_handle || '').trim();
        if (ig && !ig.startsWith('@') && !ig.startsWith('http')) ig = `@${ig}`;
        payload.instagram_handle = ig;
      }
      if (updateData.website !== undefined) {
        let web = String(updateData.website || '').trim();
        if (web && !/^https?:\/\//i.test(web)) web = `https://${web}`;
        payload.website = web;
      }
      if (updateData.require_approval !== undefined) payload.require_approval = Boolean(updateData.require_approval);
      if (updateData.accepts_pitches !== undefined) payload.accepts_pitches = Boolean(updateData.accepts_pitches);
      if (updateData.allow_carpool !== undefined) {
        payload.allow_carpool = Boolean(updateData.allow_carpool);
        payload.allowCarpool = Boolean(updateData.allow_carpool);
      }
      if (updateData.allow_guests !== undefined) {
        payload.allow_guests = Boolean(updateData.allow_guests);
        payload.allowGuests = Boolean(updateData.allow_guests);
      }
      if (updateData.allow_chapters !== undefined) {
        payload.allow_chapters = Boolean(updateData.allow_chapters);
        payload.allowChapters = Boolean(updateData.allow_chapters);
      }

      await updateCommunity(community.id, payload);
      setAppliedProfileMap((prev) => ({ ...prev, [msgId]: true }));
      toast.success('Club Settings & Rules Saved Live! ✨', 'Your changes are now live on your Community Page.');
      appendSystemConfirmation(
        `✅ **Club Settings & Rules Saved Live!** Your public **${community.name} Page** has been updated immediately.`,
        ['Add another club rule', 'Draft a welcome announcement for newcomers', 'Launch a new meetup']
      );
    } catch (err) {
      toast.error('Update Failed', err?.message || 'Could not update community settings.');
    } finally {
      setApplyingProfileMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleApplyEventUpdate = async (msgId, evData) => {
    if (!evData?.eventId) {
      toast.error('Select an event', 'Choose which upcoming event you want to update.');
      return;
    }
    if (evData.action === 'cancel' && !evData.confirmCancel) {
      toast.error('Confirmation needed', 'Tick the confirmation box before cancelling this event.');
      return;
    }
    setApplyingEventUpdateMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      let ok = false;
      if (evData.action === 'cancel') {
        ok = await cancelEvent(evData.eventId);
        if (ok !== false) {
          setAppliedEventUpdateMap((prev) => ({ ...prev, [msgId]: { id: evData.eventId, action: 'cancel' } }));
          toast.success('Event Cancelled', `"${evData.title || evData.originalTitle}" has been marked cancelled.`);
          appendSystemConfirmation(
            `✅ **Event Cancelled:** **"${evData.title || evData.originalTitle}"** has been marked cancelled across your Club Calendar and \`/events\`.`,
            ['Draft a cancellation announcement for members', 'Create a replacement meetup', 'Audit our community health']
          );
        } else {
          toast.error('Could not cancel event', 'Please try again from Dashboard → Events.');
        }
      } else {
        if (!evData.title?.trim()) {
          toast.error('Missing title', 'Please provide an event title.');
          setApplyingEventUpdateMap((prev) => ({ ...prev, [msgId]: false }));
          return;
        }
        ok = await updateEvent(evData.eventId, {
          title: evData.title.trim(),
          date: evData.date,
          time: evData.time || '10:00',
          location: evData.location || communityLoc,
          description: evData.description || '',
          maxCapacity: Number(evData.maxCapacity) || 25,
          ticketPrice: Number(evData.ticketPrice) || 0,
          requireApproval: Boolean(evData.requireApproval),
          allowCarpool: evData.allowCarpool !== false,
          allowGuests: evData.allowGuests !== false,
        });
        if (ok !== false) {
          setAppliedEventUpdateMap((prev) => ({ ...prev, [msgId]: { id: evData.eventId, action: 'update' } }));
          toast.success('Event Updated Live! ✅', `"${evData.title}" changes are now live on Calendar & /events.`);
          appendSystemConfirmation(
            `✅ **Event Updated Live!** Your changes to **"${evData.title.trim()}"** are now live on your Community Calendar and \`/events\`.`,
            ['Send a reminder to attendees about the update', 'Draft a WhatsApp update', 'Audit our community health']
          );
        } else {
          toast.error('Event Update Failed', 'Could not save event changes. Please try again.');
        }
      }
    } catch (err) {
      toast.error('Event Update Error', err?.message || 'Could not update event.');
    } finally {
      setApplyingEventUpdateMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleSendEventReminderCard = async (msgId, reminderData) => {
    if (!reminderData?.eventId || typeof sendEventReminder !== 'function') return;
    setSendingReminderMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const res = await sendEventReminder(reminderData.eventId, reminderData.message?.trim() || null);
      const count = Number(res?.count ?? 0);
      setSentReminderMap((prev) => ({ ...prev, [msgId]: { count, eventId: reminderData.eventId } }));
      toast.success(
        count > 0 ? `Reminder Sent to ${count} Attendee${count === 1 ? '' : 's'}! 🔔` : 'Reminder Processed',
        count > 0 ? 'In-app & push notifications delivered.' : 'No registered attendees to notify yet.'
      );
      appendSystemConfirmation(
        count > 0
          ? `✅ **Reminder Sent!** Delivered to **${count} registered attendee${count === 1 ? '' : 's'}** of **${reminderData.eventTitle || 'your event'}**.`
          : `✅ **Reminder Checked:** No registered attendees are signed up for **${reminderData.eventTitle || 'this event'}** yet.`,
        ['Draft a WhatsApp reminder to boost RSVPs', 'Create a poll for members', 'Audit our community health']
      );
    } catch (err) {
      toast.error('Reminder Failed', err?.message || 'Could not send event reminder.');
    } finally {
      setSendingReminderMap((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const handleCreateChannelCard = async (msgId, chanData) => {
    if (!community?.id || typeof createChannel !== 'function') return;
    const cleanName = String(chanData?.channelName || '')
      .trim()
      .replace(/^#+/, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
    if (!cleanName) {
      toast.error('Channel name required', 'Enter a short name like carpool-rides or beginner-chat.');
      return;
    }
    setCreatingChannelMap((prev) => ({ ...prev, [msgId]: true }));
    try {
      const created = await createChannel(community.id, cleanName, chanData.channelType || 'text');
      if (created) {
        setCreatedChannelMap((prev) => ({ ...prev, [msgId]: created }));
        toast.success(`#${cleanName} Channel Created! 💬`, `Live now inside ${community.name} Community Chat.`);
        appendSystemConfirmation(
          `✅ **Channel Created Live!** **#${cleanName}** (${chanData.channelType === 'announcement' ? 'Announcements Only' : 'Open Member Discussion'}) is now live inside your **${community.name} Community Chat** (\`/chat\`).`,
          [`Draft a welcome message for #${cleanName}`, 'Create another chat channel', 'Launch a poll for members']
        );
      } else {
        toast.error('Channel Creation Failed', 'Could not create chat channel. Please try again.');
      }
    } catch (err) {
      toast.error('Channel Error', err?.message || 'Could not create channel.');
    } finally {
      setCreatingChannelMap((prev) => ({ ...prev, [msgId]: false }));
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
    stopListening();
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
    if (card.type === 'event_update') {
      return card.data?.action === 'cancel' ? '⚠️ Cancel Event' : '✏️ Edit Event';
    }
    if (card.type === 'event_reminder') return '🔔 Reminder';
    if (card.type === 'create_channel') return '# New Channel';
    if (card.type === 'poll') return '📊 Poll Draft';
    if (card.type === 'broadcast') return '📣 Broadcast';
    if (card.type === 'community_update') return '⚙️ Settings & Rules';
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
            @keyframes copilotPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.45; transform: scale(0.85); }
            }
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
              grid-template-rows: minmax(0, 1fr);
              flex: 1;
              min-height: 0;
              overflow: hidden;
            }
            .copilot-pane-chat,
            .copilot-pane-output {
              display: flex;
              flex-direction: column;
              min-height: 0;
              overflow: hidden;
            }
            .copilot-mobile-tabs {
              display: flex;
            }
            .copilot-mobile-only-btn {
              display: inline-flex;
            }
            .copilot-pane-chat.mobile-hidden,
            .copilot-pane-output.mobile-hidden {
              display: none !important;
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
              .copilot-mobile-only-btn {
                display: none !important;
              }
              .copilot-pane-chat,
              .copilot-pane-output,
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
              role="tablist"
              aria-label="Co-Pilot Studio Views"
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
                role="tab"
                aria-selected={mobileView === 'chat'}
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
                role="tab"
                aria-selected={mobileView === 'output'}
                onClick={() => {
                  setMobileView('output');
                  setHasUnreadOutput(false);
                }}
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
                      animation: hasUnreadOutput && mobileView === 'chat' ? 'copilotPulse 1.4s ease-in-out infinite' : 'none',
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
                      label: '⚙️ Club Settings & Rules',
                      directAction: handleOpenLiveSettingsEditor,
                      highlight: true,
                    },
                    {
                      label: '📈 Health Audit',
                      prompt: `Audit ${community?.name || 'my community'} using our real member and turnout numbers and tell me the top 3 things I should do this week.`,
                    },
                    {
                      label: '🚀 New Event',
                      prompt: `Create a single welcoming meetup for ${community?.name || 'our community'} in ${communityLoc} this Sunday at 10:00 AM with a post-event coffee stop.`,
                    },
                    ...(nextUpcomingEvent
                      ? [
                          {
                            label: '✏️ Edit Next Event',
                            prompt: `Load our upcoming event "${nextUpcomingEvent.title}" so I can review and edit its details.`,
                          },
                          {
                            label: '🔔 Remind Attendees',
                            prompt: `Draft an attendee reminder for our upcoming event "${nextUpcomingEvent.title}".`,
                          },
                        ]
                      : []),
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
                      label: '# New Chat Channel',
                      prompt: `Create a new community chat channel for ${community?.name || 'our members'} right now with a smart suggested name I can edit in the Launchpad.`,
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
                      onClick={() => (chip.directAction ? chip.directAction() : handleSendMessage(chip.prompt))}
                      className="interactive-press"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '99px',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: isThinking ? 'not-allowed' : 'pointer',
                        background: chip.highlight ? 'rgba(139, 92, 246, 0.14)' : 'var(--surface-card)',
                        color: chip.highlight ? '#8b5cf6' : 'var(--ink-secondary)',
                        border: chip.highlight ? '1px solid rgba(139, 92, 246, 0.38)' : '1px solid var(--hairline-border)',
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
                                setHasUnreadOutput(false);
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

                {/* Live Voice Recording / Transcribing Banner */}
                {(isListening || isTranscribing) && (
                  <div
                    style={{
                      padding: '8px 14px',
                      background: isTranscribing
                        ? 'rgba(139, 92, 246, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                      borderTop: isTranscribing
                        ? '1px solid rgba(139, 92, 246, 0.3)'
                        : '1px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: isTranscribing ? '#8b5cf6' : '#ef4444',
                      flexShrink: 0,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isTranscribing ? (
                        <>
                          <Loader2 size={14} className="spin" />
                          <span>Transcribing with Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              width: '9px',
                              height: '9px',
                              borderRadius: '50%',
                              background: '#ef4444',
                              display: 'inline-block',
                              animation: 'copilotPulse 1.1s ease-in-out infinite',
                            }}
                          />
                          <span>
                            Recording {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')} — speak naturally
                          </span>
                        </>
                      )}
                    </div>
                    {isListening && !isTranscribing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={cancelListening}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#ef4444',
                            borderRadius: '99px',
                            padding: '3px 9px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => stopListening(false)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            color: '#ef4444',
                            borderRadius: '99px',
                            padding: '3px 10px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Stop &amp; Review
                        </button>
                        <button
                          type="button"
                          onClick={() => stopListening(true)}
                          style={{
                            background: '#ef4444',
                            border: 'none',
                            color: '#ffffff',
                            borderRadius: '99px',
                            padding: '3px 11px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Send Now →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Composer */}
                <form
                  className="copilot-portal-composer"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isListening) {
                      stopListening(true);
                    } else {
                      handleSendMessage();
                    }
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
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isThinking || isTranscribing}
                    className="interactive-press"
                    title={isListening ? 'Stop & transcribe' : 'Record voice message for More AI'}
                    aria-label={isListening ? 'Stop & transcribe' : 'Record voice message for More AI'}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      border: isListening
                        ? '1.5px solid #ef4444'
                        : '1px solid var(--hairline-border-strong)',
                      background: isListening
                        ? 'rgba(239, 68, 68, 0.16)'
                        : 'var(--surface-elevated)',
                      color: isListening
                        ? '#ef4444'
                        : speechSupported
                        ? 'var(--ink-primary)'
                        : 'var(--ink-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isThinking || isTranscribing ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                      animation: isListening ? 'copilotPulse 1.4s ease-in-out infinite' : 'none',
                    }}
                  >
                    {isTranscribing ? <Loader2 size={16} className="spin" /> : isListening ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>
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
                    placeholder={
                      isListening
                        ? 'Listening... speak your instructions...'
                        : 'Type or tap the mic — edit events, add rules, launch polls...'
                    }
                    style={{
                      flex: 1,
                      background: 'var(--surface-elevated)',
                      border: isListening
                        ? '1.5px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid var(--hairline-border-strong)',
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
                      padding: '10px 14px',
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
                  background: 'var(--surface-card)',
                }}
              >
                {/* Output Pane Header + Session Draft History Switcher */}
                <div
                  style={{
                    padding: '10px 14px',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setMobileView('chat')}
                      className="copilot-mobile-only-btn interactive-press"
                      style={{
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border-strong)',
                        color: 'var(--ink-primary)',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowLeft size={13} /> Chat
                    </button>
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
                            icon: '⚙️',
                            title: 'Edit Club Settings & Rules',
                            sub: 'Add club rules, links, visibility & toggles',
                            directAction: handleOpenLiveSettingsEditor,
                          },
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
                        ].map((card, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={isThinking}
                            onClick={() => (card.directAction ? card.directAction() : handleSendMessage(card.prompt))}
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
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {!isLaunched && evList.length > 1 && (
                                          <button
                                            type="button"
                                            title="Remove this draft event"
                                            onClick={() =>
                                              updateOutputCardData(msgId, (d) => ({
                                                ...d,
                                                events: d.events.filter((_, i) => i !== idx),
                                              }))
                                            }
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
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

                                    {/* Per-Event Permission Toggles */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: isLaunched ? 'default' : 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          disabled={isLaunched}
                                          checked={Boolean(ev.requireApproval)}
                                          onChange={(e) => updateEvField('requireApproval', e.target.checked)}
                                        />
                                        Host Approval
                                      </label>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: isLaunched ? 'default' : 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          disabled={isLaunched}
                                          checked={ev.allowCarpool !== false}
                                          onChange={(e) => updateEvField('allowCarpool', e.target.checked)}
                                        />
                                        Carpool Hub
                                      </label>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: isLaunched ? 'default' : 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          disabled={isLaunched}
                                          checked={ev.allowGuests !== false}
                                          onChange={(e) => updateEvField('allowGuests', e.target.checked)}
                                        />
                                        Allow +1 Guests
                                      </label>
                                    </div>

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

                              {!allLaunched && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateOutputCardData(msgId, (d) => ({
                                      ...d,
                                      events: [
                                        ...d.events,
                                        {
                                          weekLabel: `Event ${d.events.length + 1}`,
                                          title: `${community?.name || 'Community'} Meetup`,
                                          date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                                          time: '10:00',
                                          location: communityLoc,
                                          description: '',
                                          maxCapacity: 25,
                                          ticketPrice: 0,
                                          requireApproval: false,
                                          allowCarpool: true,
                                          allowGuests: true,
                                        },
                                      ],
                                    }))
                                  }
                                  className="interactive-press"
                                  style={{
                                    padding: '9px 14px',
                                    borderRadius: '11px',
                                    border: '1px dashed var(--hairline-border-strong)',
                                    background: 'transparent',
                                    color: 'var(--ink-secondary)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <Plus size={14} /> Add Another Event Draft
                                </button>
                              )}
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

                      // 4. COMMUNITY SETTINGS, BIO & CLUB RULES LIVE EDITOR
                      if (card.type === 'community_update' && card.data) {
                        const isApplied = Boolean(appliedProfileMap[msgId]);
                        const rulesList = Array.isArray(card.data.guidelines) ? card.data.guidelines : [];
                        const touched = Array.isArray(card.data.touchedFields) ? card.data.touchedFields : [];
                        const showAll = Boolean(card.data.showAllSettings);
                        const isTouched = (k) => touched.includes(k);

                        const renderBadge = (key) =>
                          isTouched(key) ? (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '99px',
                                background: 'rgba(139, 92, 246, 0.16)',
                                color: '#8b5cf6',
                                textTransform: 'uppercase',
                              }}
                            >
                              Updated
                            </span>
                          ) : null;

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
                              <Settings2 size={15} color="#8b5cf6" style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Where this goes:</strong> Updates your public <strong>{community?.name} Page</strong>, join club rules, links, visibility &amp; club settings immediately.
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <h3 style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                {card.title}
                              </h3>
                              {isApplied ? (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAppliedProfileMap((prev) => {
                                        const next = { ...prev };
                                        delete next[msgId];
                                        return next;
                                      })
                                    }
                                    className="btn btn-outline interactive-press"
                                    style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}
                                  >
                                    Edit Again
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => jumpToRoute(`/community/${communitySlug || community?.id}`)}
                                    className="btn btn-primary interactive-press"
                                    style={{ padding: '9px 15px', borderRadius: '11px', fontSize: '0.82rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    View Updated Page <ExternalLink size={14} />
                                  </button>
                                </div>
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

                            {/* CLUB RULES / COMMUNITY GUIDELINES */}
                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ink-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                  Club Rules &amp; Join Guidelines ({rulesList.length})
                                  {renderBadge('guidelines')}
                                </label>
                                {!isApplied && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOutputCardData(msgId, (d) => ({
                                        ...d,
                                        guidelines: [...(Array.isArray(d.guidelines) ? d.guidelines : []), ''],
                                      }))
                                    }
                                    className="interactive-press"
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      background: 'rgba(139, 92, 246, 0.14)',
                                      border: '1px solid rgba(139, 92, 246, 0.35)',
                                      color: '#8b5cf6',
                                      fontSize: '0.73rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <Plus size={13} /> Add Club Rule
                                  </button>
                                )}
                              </div>

                              {rulesList.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                                  No club rules yet — tap &ldquo;+ Add Club Rule&rdquo; above or ask More AI to add one.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                  {rulesList.map((rule, rIdx) => (
                                    <div key={rIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span
                                        style={{
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '50%',
                                          background: 'var(--surface-card)',
                                          border: '1px solid var(--hairline-border)',
                                          color: 'var(--ink-muted)',
                                          fontSize: '0.7rem',
                                          fontWeight: 800,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {rIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={rule}
                                        placeholder="Type a clear, friendly club rule..."
                                        onChange={(e) =>
                                          updateOutputCardData(msgId, (d) => ({
                                            ...d,
                                            guidelines: (d.guidelines || []).map((x, idx2) => (idx2 === rIdx ? e.target.value : x)),
                                          }))
                                        }
                                        style={inputFieldStyle}
                                      />
                                      {!isApplied && (
                                        <button
                                          type="button"
                                          title="Remove club rule"
                                          onClick={() =>
                                            updateOutputCardData(msgId, (d) => ({
                                              ...d,
                                              guidelines: (d.guidelines || []).filter((_, idx2) => idx2 !== rIdx),
                                            }))
                                          }
                                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', flexShrink: 0 }}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* PUBLIC BIO / DESCRIPTION */}
                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--ink-primary)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                  Public Community Bio / Description
                                  {renderBadge('description')}
                                </label>
                                <textarea
                                  rows={4}
                                  disabled={isApplied}
                                  value={card.data.description || ''}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, description: e.target.value }))}
                                  placeholder="Tell local residents what makes your club welcoming..."
                                  style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                                />
                              </div>
                            </div>

                            {/* EXPANDABLE FULL CLUB SETTINGS (ALL LEADER CONTROLS) */}
                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--hairline-border)', overflow: 'hidden' }}>
                              <button
                                type="button"
                                onClick={() => updateOutputCardData(msgId, (d) => ({ ...d, showAllSettings: !d.showAllSettings }))}
                                style={{
                                  width: '100%',
                                  padding: '12px 14px',
                                  background: 'transparent',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  color: 'var(--ink-primary)',
                                  fontWeight: 800,
                                  fontSize: '0.8rem',
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                                  <Settings2 size={14} color="#8b5cf6" />
                                  All Club Details, Visibility, Links &amp; Toggles
                                </span>
                                {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>

                              {showAll && (
                                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '11px', borderTop: '1px solid var(--hairline-border)', paddingTop: '12px' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '9px' }}>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Club Name {renderBadge('name')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.name || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, name: e.target.value }))}
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Town / Hub Location {renderBadge('location_name')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.location_name || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, location_name: e.target.value }))}
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Category {renderBadge('category')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.category || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, category: e.target.value }))}
                                        placeholder="e.g. Outdoors, Running, Social"
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Cadence {renderBadge('activity_level')}
                                      </label>
                                      <select
                                        disabled={isApplied}
                                        value={card.data.activity_level || 'Active'}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, activity_level: e.target.value }))}
                                        style={inputFieldStyle}
                                      >
                                        <option value="Very Active">Very Active (Weekly)</option>
                                        <option value="Active">Active (Fortnightly)</option>
                                        <option value="Casual">Casual (Monthly or less)</option>
                                        <option value="Flexible">Flexible / Pop-up</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Who Is It For? {renderBadge('target_audience')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.target_audience || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, target_audience: e.target.value }))}
                                        placeholder="e.g. All abilities welcome"
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Session Cost Label {renderBadge('cost')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.cost || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, cost: e.target.value }))}
                                        placeholder="e.g. Free, Pay for coffee"
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                      Discovery Tags (comma-separated) {renderBadge('tags')}
                                    </label>
                                    <input
                                      type="text"
                                      disabled={isApplied}
                                      value={card.data.tagsText || ''}
                                      onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, tagsText: e.target.value }))}
                                      placeholder="e.g. Walking, Dog Friendly, Coffee, Outdoors"
                                      style={inputFieldStyle}
                                    />
                                  </div>

                                  {/* Visibility Selector */}
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '5px' }}>
                                      Community Visibility {renderBadge('visibility')}
                                    </label>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {['public', 'private', 'invite-only'].map((v) => {
                                        const active = (card.data.visibility || 'public') === v;
                                        return (
                                          <button
                                            key={v}
                                            type="button"
                                            disabled={isApplied}
                                            onClick={() => updateOutputCardData(msgId, (d) => ({ ...d, visibility: v }))}
                                            style={{
                                              flex: 1,
                                              padding: '8px 10px',
                                              borderRadius: '9px',
                                              border: active ? '1.5px solid var(--brand-accent)' : '1px solid var(--hairline-border-strong)',
                                              background: active ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
                                              color: active ? 'var(--brand-accent)' : 'var(--ink-secondary)',
                                              fontSize: '0.76rem',
                                              fontWeight: 700,
                                              textTransform: 'capitalize',
                                              cursor: isApplied ? 'default' : 'pointer',
                                            }}
                                          >
                                            {v}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Links & Monthly Supporter Tier */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '9px' }}>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        WhatsApp Group URL {renderBadge('whatsapp_group')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.whatsapp_group || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, whatsapp_group: e.target.value }))}
                                        placeholder="https://chat.whatsapp.com/..."
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Instagram Handle {renderBadge('instagram_handle')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.instagram_handle || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, instagram_handle: e.target.value }))}
                                        placeholder="@yourclub"
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Website URL {renderBadge('website')}
                                      </label>
                                      <input
                                        type="text"
                                        disabled={isApplied}
                                        value={card.data.website || ''}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, website: e.target.value }))}
                                        placeholder="https://yourclub.co.uk"
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>
                                        Monthly Supporter (£/mo, 0 = Free) {renderBadge('subscription_price')}
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        disabled={isApplied}
                                        value={card.data.subscription_price ?? 0}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, subscription_price: Number(e.target.value) }))}
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                  </div>

                                  {/* Club Permission Toggles */}
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', paddingTop: '4px' }}>
                                    {[
                                      { key: 'require_approval', label: 'Require Member Approval' },
                                      { key: 'allow_carpool', label: 'Enable Carpool Hub' },
                                      { key: 'allow_guests', label: 'Allow +1 Guests' },
                                      { key: 'accepts_pitches', label: 'Accept Business Pitches' },
                                      { key: 'allow_chapters', label: 'Allow Sister Chapters' },
                                    ].map((t) => (
                                      <label
                                        key={t.key}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          padding: '8px 10px',
                                          borderRadius: '10px',
                                          background: 'var(--surface-card)',
                                          border: isTouched(t.key)
                                            ? '1px solid rgba(139, 92, 246, 0.5)'
                                            : '1px solid var(--hairline-border)',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          color: 'var(--ink-primary)',
                                          cursor: isApplied ? 'default' : 'pointer',
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          disabled={isApplied}
                                          checked={Boolean(card.data[t.key])}
                                          onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, [t.key]: e.target.checked }))}
                                        />
                                        <span>{t.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // 4b. EDIT OR CANCEL AN EXISTING UPCOMING EVENT
                      if (card.type === 'event_update' && card.data) {
                        const appliedInfo = appliedEventUpdateMap[msgId];
                        const isApplied = Boolean(appliedInfo);
                        const isCancel = card.data.action === 'cancel';

                        const handleSelectTargetEvent = (newId) => {
                          const target = upcomingEvents.find((e) => e.id === newId);
                          if (!target) return;
                          updateOutputCardData(msgId, (d) => ({
                            ...d,
                            eventId: target.id,
                            originalTitle: target.title || '',
                            title: target.title || '',
                            date: target.date || '',
                            time: target.time || '10:00',
                            location: cleanLocationName(target.location) || '',
                            description: target.description || '',
                            maxCapacity: Number(target.maxCapacity || target.max_capacity || 25),
                            ticketPrice: Number(target.ticketPrice ?? target.ticket_price ?? 0),
                            requireApproval: Boolean(target.requireApproval),
                            allowCarpool: target.allowCarpool !== false,
                            allowGuests: target.allowGuests !== false,
                            confirmCancel: false,
                          }));
                        };

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                padding: '10px 13px',
                                borderRadius: '12px',
                                background: isCancel ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                border: isCancel ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(59, 130, 246, 0.28)',
                                fontSize: '0.78rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              {isCancel ? (
                                <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                              ) : (
                                <Calendar size={15} color="#3b82f6" style={{ flexShrink: 0 }} />
                              )}
                              <span>
                                <strong>Where this applies:</strong> {isCancel ? 'Cancels this live event across your Club Calendar, /events, and attendee tickets.' : 'Updates this live event immediately across your Club Calendar, /events, and attendee tickets.'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <h3 style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                {isCancel ? 'Cancel Live Event' : 'Edit Live Event'}
                              </h3>

                              {isApplied ? (
                                <button
                                  type="button"
                                  onClick={() => jumpToRoute(`/events/${appliedInfo.id}`)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '9px 15px', borderRadius: '11px', fontSize: '0.82rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  View Event <ExternalLink size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={applyingEventUpdateMap[msgId] || (isCancel && !card.data.confirmCancel)}
                                  onClick={() => handleApplyEventUpdate(msgId, card.data)}
                                  className="btn btn-primary interactive-press"
                                  style={{
                                    padding: '10px 16px',
                                    borderRadius: '11px',
                                    fontSize: '0.83rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: isCancel ? '#ef4444' : undefined,
                                    opacity: isCancel && !card.data.confirmCancel ? 0.55 : 1,
                                  }}
                                >
                                  {applyingEventUpdateMap[msgId] ? <Loader2 size={14} className="spin" /> : isCancel ? <AlertTriangle size={14} /> : <Check size={14} />}
                                  {isCancel ? 'Confirm Cancel Event' : '✅ Save Event Changes Live'}
                                </button>
                              )}
                            </div>

                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {/* Target Event Selector + Edit/Cancel Switch */}
                              {upcomingEvents.length > 0 && (
                                <div>
                                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                                    Target Upcoming Event
                                  </label>
                                  <select
                                    disabled={isApplied}
                                    value={card.data.eventId || ''}
                                    onChange={(e) => handleSelectTargetEvent(e.target.value)}
                                    style={inputFieldStyle}
                                  >
                                    {upcomingEvents.map((ev) => (
                                      <option key={ev.id} value={ev.id}>
                                        {ev.title} ({ev.date || 'TBD'} {ev.time || ''})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {!isApplied && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => updateOutputCardData(msgId, (d) => ({ ...d, action: 'update', confirmCancel: false }))}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      borderRadius: '9px',
                                      border: !isCancel ? '1.5px solid #3b82f6' : '1px solid var(--hairline-border-strong)',
                                      background: !isCancel ? 'rgba(59, 130, 246, 0.14)' : 'var(--surface-card)',
                                      color: !isCancel ? '#3b82f6' : 'var(--ink-secondary)',
                                      fontSize: '0.77rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✏️ Edit Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateOutputCardData(msgId, (d) => ({ ...d, action: 'cancel', confirmCancel: false }))}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      borderRadius: '9px',
                                      border: isCancel ? '1.5px solid #ef4444' : '1px solid var(--hairline-border-strong)',
                                      background: isCancel ? 'rgba(239, 68, 68, 0.14)' : 'var(--surface-card)',
                                      color: isCancel ? '#ef4444' : 'var(--ink-secondary)',
                                      fontSize: '0.77rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ⚠️ Cancel Event
                                  </button>
                                </div>
                              )}

                              {isCancel ? (
                                <div style={{ padding: '12px', borderRadius: '11px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                                    Are you sure you want to cancel &ldquo;{card.data.title || card.data.originalTitle}&rdquo;?
                                  </div>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', cursor: isApplied ? 'default' : 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      disabled={isApplied}
                                      checked={Boolean(card.data.confirmCancel)}
                                      onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, confirmCancel: e.target.checked }))}
                                    />
                                    Yes, mark this event as cancelled immediately
                                  </label>
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    disabled={isApplied}
                                    value={card.data.title || ''}
                                    onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, title: e.target.value }))}
                                    placeholder="Event title"
                                    style={{ ...inputFieldStyle, fontWeight: 800, fontSize: '0.94rem' }}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <input
                                      type="date"
                                      disabled={isApplied}
                                      value={card.data.date || ''}
                                      onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, date: e.target.value }))}
                                      style={inputFieldStyle}
                                    />
                                    <input
                                      type="time"
                                      disabled={isApplied}
                                      value={card.data.time || '10:00'}
                                      onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, time: e.target.value }))}
                                      style={inputFieldStyle}
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    disabled={isApplied}
                                    value={card.data.location || ''}
                                    onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, location: e.target.value }))}
                                    placeholder="Meeting venue / landmark"
                                    style={inputFieldStyle}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>Max Spots</label>
                                      <input
                                        type="number"
                                        min="2"
                                        disabled={isApplied}
                                        value={card.data.maxCapacity ?? 25}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, maxCapacity: Number(e.target.value) }))}
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '3px' }}>Ticket Price (£, 0 = Free)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        disabled={isApplied}
                                        value={card.data.ticketPrice ?? 0}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, ticketPrice: Number(e.target.value) }))}
                                        style={inputFieldStyle}
                                      />
                                    </div>
                                  </div>
                                  <textarea
                                    rows={3}
                                    disabled={isApplied}
                                    value={card.data.description || ''}
                                    onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, description: e.target.value }))}
                                    style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.45 }}
                                  />
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: isApplied ? 'default' : 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        disabled={isApplied}
                                        checked={Boolean(card.data.requireApproval)}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, requireApproval: e.target.checked }))}
                                      />
                                      Host Approval
                                    </label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: isApplied ? 'default' : 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        disabled={isApplied}
                                        checked={card.data.allowCarpool !== false}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, allowCarpool: e.target.checked }))}
                                      />
                                      Carpool Hub
                                    </label>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: isApplied ? 'default' : 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        disabled={isApplied}
                                        checked={card.data.allowGuests !== false}
                                        onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, allowGuests: e.target.checked }))}
                                      />
                                      Allow +1 Guests
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // 4c. SEND EVENT ATTENDEE REMINDER
                      if (card.type === 'event_reminder' && card.data) {
                        const sentInfo = sentReminderMap[msgId];
                        const isSent = Boolean(sentInfo);
                        const targetEvent = upcomingEvents.find((e) => e.id === card.data.eventId);
                        const attendeeCount = (eventRsvps?.[card.data.eventId] || []).filter((r) => r.status === 'going' || r.checkedIn).length;

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div
                              style={{
                                padding: '10px 13px',
                                borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                fontSize: '0.78rem',
                                color: 'var(--ink-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <Bell size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Where this goes:</strong> Sends an instant In-App &amp; Push notification reminder to all <strong>{attendeeCount} registered attendee{attendeeCount === 1 ? '' : 's'}</strong> of <strong>{targetEvent?.title || card.data.eventTitle}</strong>.
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <h3 style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                {card.title}
                              </h3>
                              {isSent ? (
                                <button
                                  type="button"
                                  onClick={() => jumpToRoute(`/events/${sentInfo.eventId}`)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '9px 15px', borderRadius: '11px', fontSize: '0.82rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  Sent ({sentInfo.count}) • View Event <ExternalLink size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={sendingReminderMap[msgId]}
                                  onClick={() => handleSendEventReminderCard(msgId, card.data)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '10px 16px', borderRadius: '11px', fontSize: '0.83rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  {sendingReminderMap[msgId] ? <Loader2 size={14} className="spin" /> : <Bell size={14} />}
                                  🔔 Send Reminder Now ({attendeeCount})
                                </button>
                              )}
                            </div>

                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {upcomingEvents.length > 0 && (
                                <div>
                                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                                    Event to Remind
                                  </label>
                                  <select
                                    disabled={isSent}
                                    value={card.data.eventId || ''}
                                    onChange={(e) => {
                                      const ev = upcomingEvents.find((x) => x.id === e.target.value);
                                      updateOutputCardData(msgId, (d) => ({
                                        ...d,
                                        eventId: e.target.value,
                                        eventTitle: ev?.title || d.eventTitle,
                                      }));
                                    }}
                                    style={inputFieldStyle}
                                  >
                                    {upcomingEvents.map((ev) => (
                                      <option key={ev.id} value={ev.id}>
                                        {ev.title} ({ev.date || 'TBD'})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              <div>
                                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                                  Reminder Message
                                </label>
                                <textarea
                                  rows={4}
                                  disabled={isSent}
                                  value={card.data.message || ''}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, message: e.target.value }))}
                                  style={{ ...inputFieldStyle, resize: 'vertical', lineHeight: 1.5 }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 4d. CREATE NEW COMMUNITY CHAT CHANNEL
                      if (card.type === 'create_channel' && card.data) {
                        const createdCh = createdChannelMap[msgId];
                        const isCreated = Boolean(createdCh);
                        const previewSlug = String(card.data.channelName || '')
                          .trim()
                          .replace(/^#+/, '')
                          .toLowerCase()
                          .replace(/\s+/g, '-');

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {isCreated ? (
                              <div
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: '12px',
                                  background: 'rgba(16, 185, 129, 0.16)',
                                  border: '1.5px solid rgba(16, 185, 129, 0.5)',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                                <span>
                                  <strong>#{createdCh.name || previewSlug}</strong> is now live in your <strong>{community?.name} Community Chat</strong>!
                                </span>
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: '10px 13px',
                                  borderRadius: '12px',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  fontSize: '0.78rem',
                                  color: 'var(--ink-primary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                <Hash size={15} color="#10b981" style={{ flexShrink: 0 }} />
                                <span>
                                  <strong>Where this goes:</strong> Creates <strong>#{previewSlug || 'new-channel'}</strong> live inside your <strong>{community?.name} Community Chat</strong> (<code>/chat</code>).
                                </span>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingBottom: '10px', borderBottom: '1px solid var(--hairline-border)' }}>
                              <h3 style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                                {card.title}
                              </h3>
                              {isCreated ? (
                                <button
                                  type="button"
                                  onClick={() => jumpToRoute('/chat')}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '9px 15px', borderRadius: '11px', fontSize: '0.82rem', fontWeight: 800, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  Open Community Chat <ExternalLink size={14} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={creatingChannelMap[msgId]}
                                  onClick={() => handleCreateChannelCard(msgId, card.data)}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '10px 16px', borderRadius: '11px', fontSize: '0.83rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  {creatingChannelMap[msgId] ? <Loader2 size={14} className="spin" /> : <Hash size={14} />}
                                  ✨ Create Channel Live
                                </button>
                              )}
                            </div>

                            <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', padding: '14px', border: '1px solid var(--hairline-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '4px' }}>
                                  Channel Name
                                </label>
                                <input
                                  type="text"
                                  disabled={isCreated}
                                  value={card.data.channelName || ''}
                                  onChange={(e) => updateOutputCardData(msgId, (d) => ({ ...d, channelName: e.target.value }))}
                                  placeholder="e.g. carpool-rides or beginner-chat"
                                  style={{ ...inputFieldStyle, fontWeight: 800 }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-muted)', display: 'block', marginBottom: '5px' }}>
                                  Channel Mode
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {[
                                    { id: 'text', label: '💬 Open Member Discussion' },
                                    { id: 'announcement', label: '📣 Announcements Only' },
                                  ].map((opt) => {
                                    const active = (card.data.channelType || 'text') === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        disabled={isCreated}
                                        onClick={() => updateOutputCardData(msgId, (d) => ({ ...d, channelType: opt.id }))}
                                        style={{
                                          flex: 1,
                                          padding: '9px 10px',
                                          borderRadius: '10px',
                                          border: active ? '1.5px solid #10b981' : '1px solid var(--hairline-border-strong)',
                                          background: active ? 'rgba(16, 185, 129, 0.14)' : 'var(--surface-card)',
                                          color: active ? '#10b981' : 'var(--ink-secondary)',
                                          fontSize: '0.76rem',
                                          fontWeight: 700,
                                          cursor: isCreated ? 'default' : 'pointer',
                                        }}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
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
                                {`${String(card.data.content).slice(0, 520)}...\n\n[Upgrade to Leader Pro (£16.50/mo or £165/yr) to export the full document alongside 1-click Venue Safety Packs & 2% reduced ticket fees.]`}
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
