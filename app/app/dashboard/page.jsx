"use client";
import { supabase } from '../../src/lib/supabaseClient';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Printer, ExternalLink, HelpCircle, Users, Calendar, MessageCircle, TrendingUp, Search, Plus, MapPin, Image as ImageIcon, CreditCard, ChevronRight, ChevronLeft, Download, Activity, Globe, Heart, Crown, Info, X, Map, Zap, Mail, Trash2, UserCheck, Ban, ChevronDown, ChevronUp, Settings, Megaphone, QrCode, BarChart3, Ticket, ScanLine, UserPlus, DollarSign, Clock, Edit3, Check, CheckCircle2, Eye, EyeOff, Shield, Star, Sparkles, BookOpen, ListChecks, Bell, Archive, Mic, MicOff, Wand2, Lightbulb, Car } from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import { isEventUpcoming, isEventPast, parseEventDateTime } from '../../src/lib/calendar';
import { getEventPath } from '../../src/lib/eventLinks';
import { findCommunityByParam, getCommunitySlug } from '../../src/lib/communityLinks';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { useToast } from '../../src/components/Toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import SocialHub from '../../src/components/SocialHub';
import MemberCRM from '../../src/components/MemberCRM';
import DigitalTicket from '../../src/components/DigitalTicket';
import QRScanner from '../../src/components/QRScanner';
import CommunityOnboardingFlow from '../../src/views/CommunityOnboardingFlow';
import EventFlyerGenerator from '../../src/components/EventFlyerGenerator';
import LeaderSetupChecklist from '../../src/components/LeaderSetupChecklist';
import dynamic from 'next/dynamic';
const LocationPicker = dynamic(() => import('../../src/components/LocationPicker'), { ssr: false });
const CommunityRegionPicker = dynamic(() => import('../../src/components/CommunityRegionPicker'), { ssr: false });
import { cleanLocationName, parseLocationCoords, geocodeLocation } from '../../src/lib/location';
import RecurringSchedulePicker from '../../src/components/RecurringSchedulePicker';
import { formatEventDate } from '../../src/lib/recurrence';
import { COMMUNITY_TAG_CATEGORIES, ALL_COMMUNITY_TAGS } from '../../src/lib/constants';

import { PREMADE_GUIDELINE_PACKS, QUICK_INSPIRATION_RULES } from '../../src/lib/guidelinesPacks';
import EventReminderModal from '../../src/components/EventReminderModal';
import NetworkEventPreviewModal from '../../src/components/NetworkEventPreviewModal';
import ProfileImageModal from '../../src/components/ProfileImageModal';
import LeaderShieldModal from '../../src/components/LeaderShieldModal';
import LeaderProposalsInbox from '../../src/components/LeaderProposalsInbox';
import SpecialistVaultModal from '../../src/components/SpecialistVaultModal';
import PayoutBankModal from '../../src/components/PayoutBankModal';
import { Banknote } from 'lucide-react';
import CouncilImpactMetrics from '../../src/components/CouncilImpactMetrics';
import { generatePliCertificatePdf, generateRamsPdf } from '../../src/lib/insurance';

// ─── Stat Card Component ──────────────────────────────────
const StatCard = ({ value, label, color, icon: Icon, accent }) => (
  <div className="glass-panel stagger-item interactive-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', ...(accent ? { border: `1px solid ${accent}30`, background: `linear-gradient(135deg, ${accent}10 0%, ${accent}02 100%)` } : {}) }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: color || 'var(--white)' }}>{value}</div>
      {Icon && <Icon size={18} color={color || 'var(--slate-500)'} />}
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
  </div>
);

// ─── Utilities ──────────────────────────────────────────────────
function parseDateParts(dateStr) {
  if (!dateStr) return { day: ' - ', month: '' };
  if (dateStr.includes('-')) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!isNaN(d)) return { day: d.getDate().toString(), month: d.toLocaleDateString('en-GB', { month: 'short' }) };
  }
  const parts = dateStr.split(' ');
  if (parts.length >= 3) return { day: parts[1], month: parts[2] };
  if (parts.length === 2) return { day: parts[0], month: parts[1] };
  return { day: dateStr, month: '' };
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!isNaN(d)) return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return dateStr;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.includes('-') ? new Date(dateStr + 'T00:00:00') : null;
  if (!d || isNaN(d)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

// ─── Engagement Score (shared with CRM) ─────────────────────────
function getEngagementScore(member, events, eventRsvps, messages, communityId) {
  let score = 0;
  const communityEvents = events.filter(e => e.communityId === communityId);
  communityEvents.forEach(event => {
    if ((eventRsvps[event.id] || []).some(r => r.userId === member.userId)) score += 20;
  });
  const memberMessages = messages.filter(m => m.authorId === member.userId && m.communityId === communityId);
  score += Math.min(memberMessages.length * 5, 40);
  score += 10;
  return Math.min(score, 100);
}

// ─── Component ──────────────────────────────────────────────────
export default function LeaderDashboard({ initialCommunityId }) {
  const { user, communities, events, updateCommunity, deleteCommunity, approveChapter, declineChapter, users, communityMemberships, createEvent, createEventsBatch, updateEvent, cancelEvent, uploadImage, eventRsvps, updateAttendeeStatus, whatsappSettings, setWhatsappSettings, promoteMember, removeMember, checkInMember, broadcastNotification, sendEventReminder, experiences, setExperiences, isLoading, services = [], updateServiceStatus } = useAppContext();
    const { messages } = useChat();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ─── State ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [waConfig, setWaConfig] = useState({ businessConnected: false, groupLink: '' });
  const [editForm, setEditForm] = useState({ 
    name: '', category: '', description: '', location_name: '', lat: null, lng: null, cost: 'Free', target_audience: '', activity_level: 'Active', tags: [], customTagInput: '', website: '', whatsapp_group: '', instagram_handle: '' 
  });
  const [editTagCategory, setEditTagCategory] = useState('All');
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'overview');
  const [networkSearchQuery, setNetworkSearchQuery] = useState('');
  const [markupInfoExp, setMarkupInfoExp] = useState(null);
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false);
  const [showShieldModal, setShowShieldModal] = useState(false);
  const [specialistModalState, setSpecialistModalState] = useState({ isOpen: false, mode: 'inspect', specialist: null });
  const [experiencesSubTab, setExperiencesSubTab] = useState('pitches');
  const [showPayoutBankModal, setShowPayoutBankModal] = useState(false); // 'pitches' | 'trips' | 'council'
  const [activeCommunityId, setActiveCommunityId] = useState(
    initialCommunityId || searchParams?.get('community') || user?.ledCommunities?.[0] || null
  );
  
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) setActiveTab(tab);
    const comm = searchParams?.get('community');
    if (comm) setActiveCommunityId(comm);
    if (searchParams?.get('shield') === 'success') {
      toast.success('Leader Pro Active! 🛡️', 'Your Venue Compliance RAMS, Attendee Waivers and 2% Reduced Platform Fee are active.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialCommunityId) setActiveCommunityId(initialCommunityId);
  }, [initialCommunityId]);
  
  // ─── Derived Data ─────────────────────────────────────────
  const availableCommunities = user?.isAdmin 
    ? communities 
    : communities.filter(comm => 
        (user?.ledCommunities || []).includes(comm.id) ||
        comm.leader_id === user?.id ||
        comm.creator_id === user?.id ||
        comm.creatorId === user?.id ||
        comm.id === activeCommunityId ||
        (communityMemberships[comm.id] || []).some(m => (m.userId === user?.id || m.user_id === user?.id) && (m.role === 'co-founder' || m.role === 'Leader' || m.role === 'Co-Leader' || m.role === 'Admin'))
      );

  useEffect(() => {
    if (!activeCommunityId && availableCommunities.length > 0) {
      setActiveCommunityId(availableCommunities[0].id);
    }
  }, [availableCommunities, activeCommunityId]);

  const rawCommunityParam = activeCommunityId || availableCommunities[0]?.id || user?.ledCommunities?.[0] || (user?.isAdmin && communities.length > 0 ? communities[0].id : null);
  const community = findCommunityByParam(communities, rawCommunityParam) || findCommunityByParam(availableCommunities, rawCommunityParam);
  const communityIdLed = community?.id || rawCommunityParam;

  useEffect(() => {
    if (!community || typeof window === 'undefined') return;
    const cleanSlug = getCommunitySlug(community, communities);
    const url = new URL(window.location.href);
    const currentParam = url.searchParams.get('community');
    if (currentParam && currentParam !== cleanSlug) {
      url.searchParams.set('community', cleanSlug);
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, [community, communities]);
  const memberList = community ? (communityMemberships[community.id] || []) : [];
  const communityEvents = community ? events.filter(e => e.communityId === community.id || e.collabCommunityIds?.includes(community.id)).sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
  const publishedEvents = communityEvents.filter(e => e.status !== 'cancelled');
  const communityMessages = community ? messages.filter(m => m.communityId === community.id) : [];

  const isShieldActive = Boolean(
    community?.is_insured || 
    community?.insurance_tier === 'pro' ||
    (typeof window !== 'undefined' && community?.id && localStorage.getItem(`more_community_insured_${community.id}`) === 'true')
  );

  const emptyEventForm = { 
    title: '', 
    description: '', 
    date: '', 
    time: '', 
    location: community?.location_name || '', 
    coords: (community?.lat != null && community?.lng != null) ? [community.lat, community.lng] : null,
    maxCapacity: '', 
    ticketPrice: '',
    allowCash: false, 
    allowGuests: true,
    collabCommunityIds: [],
    autoReminders: true, 
    autoFeedback: true,
    requireApproval: false,
    rsvpQuestion: '',
    whatsappGroup: '',
    scheduleMode: 'single',
    resolvedDates: [],
    recurrenceSummary: 'Single event'
  };
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const coverFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [flyerEvent, setFlyerEvent] = useState(null);
  const [reminderModalEvent, setReminderModalEvent] = useState(null);
  const [dashboardEventFilter, setDashboardEventFilter] = useState('upcoming');
  const [linkCopied, setLinkCopied] = useState(false);

  const handleOpenReminderModal = (event) => {
    setReminderModalEvent(event);
  };

  const [selectedNetworkEvent, setSelectedNetworkEvent] = useState(null);
  const networkChapters = useMemo(() => {
    if (!community) return [];
    return communities.filter(c => {
      if (c.id === community.id) return false;
      if (c.parent_community_id === community.id) return true;
      if (community.parent_community_id && (c.id === community.parent_community_id || c.parent_community_id === community.parent_community_id)) return true;
      return false;
    });
  }, [communities, community]);

  const pendingChapterApplications = useMemo(() => {
    return networkChapters.filter(c => c.chapter_status === 'pending_approval' && c.parent_community_id === community?.id);
  }, [networkChapters, community]);

  const activeSisterChapters = useMemo(() => {
    return networkChapters.filter(c => c.chapter_status !== 'pending_approval' && c.chapter_status !== 'declined');
  }, [networkChapters]);

  const communityPitches = useMemo(() => {
    return (services || []).filter(s => s.communityId === community?.id);
  }, [services, community]);
  const pendingPitchesCount = useMemo(() => {
    return communityPitches.filter(s => s.status === 'pending').length;
  }, [communityPitches]);

  const pendingProposedEvents = useMemo(() => {
    return (events || []).filter(e => e.communityId === community?.id && e.status === 'proposed');
  }, [events, community]);

  const pendingCollaborationsCount = pendingPitchesCount + pendingProposedEvents.length;
  const [isCoHostingNetworkEvent, setIsCoHostingNetworkEvent] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  const handleCoHostNetworkEvent = async (eventToCoHost) => {
    const targetCommunityId = activeCommunityId || communityIdLed;
    if (!eventToCoHost || !targetCommunityId) {
      toast.error('Selection Error', 'Please select a community to add this event to.');
      return;
    }
    try {
      setIsCoHostingNetworkEvent(true);
      const sourceCommunity = communities.find(c => c.id === eventToCoHost.communityId);
      const newEvent = {
        title: `Co-Hosted: ${eventToCoHost.title}`,
        description: (eventToCoHost.description || '') + `\n\n🤝 Co-hosted with ${sourceCommunity?.name || 'our partner community'}.`,
        date: eventToCoHost.date,
        time: eventToCoHost.time,
        location: eventToCoHost.location,
        image: eventToCoHost.image,
        communityId: targetCommunityId,
        status: 'published',
        maxCapacity: eventToCoHost.maxCapacity || 50,
        ticketPrice: eventToCoHost.ticketPrice || eventToCoHost.ticket_price || 0
      };
      await createEvent(targetCommunityId, newEvent);
      toast.success('Event Co-Hosted! 🎉', `"${eventToCoHost.title}" is now added to your community calendar.`);
      setSelectedNetworkEvent(null);
    } catch (err) {
      console.error('Failed to co-host event:', err);
      toast.error('Co-Host Failed', 'Could not add this event to your calendar. Please try again.');
    } finally {
      setIsCoHostingNetworkEvent(false);
    }
  };
  const [coLeaderSearch, setCoLeaderSearch] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [communityVisibility, setCommunityVisibility] = useState('public');
  const [requireApproval, setRequireApproval] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [isDeletingCommunity, setIsDeletingCommunity] = useState(false);
  const [eventStep, setEventStep] = useState(0);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [discoverySearchTerm, setDiscoverySearchTerm] = useState('');
  const [discoveryProvider, setDiscoveryProvider] = useState('viator');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVibes, setGeneratedVibes] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [isDictatingDescription, setIsDictatingDescription] = useState(false);
  const [isExpandingDescription, setIsExpandingDescription] = useState(false);
  const descRecognitionRef = useRef(null);

  const handleToggleDictateDescription = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info('Voice Not Supported', 'Voice dictation is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    if (isDictatingDescription) {
      if (descRecognitionRef.current) {
        try { descRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsDictatingDescription(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const baseText = (eventForm.description || '').trim();

      recognition.onstart = () => {
        setIsDictatingDescription(true);
        toast.info('Listening...', 'Speak your walk notes. Pauses are safe - tap "Done" when finished.');
      };

      recognition.onresult = (event) => {
        let spoken = '';
        for (let i = 0; i < event.results.length; i++) {
          spoken += event.results[i][0].transcript;
        }
        setEventForm(prev => {
          const separator = baseText && !baseText.endsWith('\n') ? '\n' : '';
          return {
            ...prev,
            description: baseText ? `${baseText}${separator}• ${spoken.trim()}` : `• ${spoken.trim()}`
          };
        });
      };

      recognition.onerror = (event) => {
        console.warn('Description dictation error:', event.error);
        setIsDictatingDescription(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone Denied', 'Please allow microphone access in your browser to dictate.');
        }
      };

      recognition.onend = () => {
        setIsDictatingDescription(false);
      };

      descRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Description speech recognition error:', err);
      setIsDictatingDescription(false);
    }
  };

  const handleExpandDescriptionWithAI = async () => {
    const rawText = (eventForm.description || '').trim();
    if (!rawText) {
      toast.info('Add Some Notes', 'Type or dictate a few bullet points first (e.g. "• 10am at gate", "• dogs welcome", "• coffee after").');
      return;
    }
    setIsExpandingDescription(true);
    try {
      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'expand-description',
          prompt: rawText,
          communityName: community?.name,
          communityLocation: community?.location_name
        })
      });
      const data = await res.json();
      if (data.description) {
        setEventForm(prev => ({
          ...prev,
          description: data.description
        }));
        if (data.fallback) {
          toast.info(
            'Notes Structured',
            data.reason ? `AI notice: ${data.reason}` : 'Your bullet points have been structured into a full event.'
          );
        } else {
          toast.success(
            '✨ Polished by Gemini 2.0 Flash!',
            'Your notes have been expanded into an engaging community description.'
          );
        }
      } else {
        toast.error('Could not expand notes', 'Please try again or edit manually.');
      }
    } catch (err) {
      console.error('Expand description error:', err);
      toast.error('Connection error', 'Could not reach AI assistant.');
    } finally {
      setIsExpandingDescription(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info('Voice Not Supported', 'Voice input is not supported in this browser. Try Chrome or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening...', 'Speak your walk idea. Take your time, pauses will not submit.');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setAiPrompt(transcript.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone Denied', 'Please enable microphone access in your browser to speak event ideas.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const AI_IDEA_CHIPS = [
    { emoji: '🌲', label: 'Scenic Trail & Coffee', prompt: 'Scenic nature trail walk followed by coffee at a local cafe' },
    { emoji: '🐾', label: 'Dog Friendly Social', prompt: 'Dog friendly park walk with open play on the greens' },
    { emoji: '☕', label: 'Morning Stroll & Chat', prompt: 'Gentle morning stroll and community conversation for all fitness levels' },
    { emoji: '🌅', label: 'Golden Hour & Pub', prompt: 'Sunset golden hour walk finishing at a local pub garden' },
    { emoji: '🏃', label: 'Beginners 5km Flat Walk', prompt: 'Beginners flat 5km nature walk, step-free and conversational pace' }
  ];

  const handleSelectChip = (chipPrompt) => {
    setAiPrompt(chipPrompt);
    handleAIGenerateEvent(chipPrompt);
  };

  const handleAppendToDescription = (textToAppend) => {
    setEventForm(prev => {
      const current = prev.description || '';
      const separator = current.trim() ? '\n\n' : '';
      return {
        ...prev,
        description: current.trim() + separator + textToAppend
      };
    });
    toast.success('Section Added', 'Refinement applied to event description.');
  };
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [peopleSubTab, setPeopleSubTab] = useState('members');
  const [leaderDrillDown, setLeaderDrillDown] = useState(null); // 'members'|'active'|'revenue'|'events'|'checkin'|'next'

  // ─── Stripe Connect Express State & Handlers ──────────────
  const [stripeConnected, setStripeConnected] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`more_stripe_connected_${community?.id}`) === 'true';
    }
    return false;
  });
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  useEffect(() => {
    if (searchParams?.get('stripe_connect') === 'success') {
      const accId = searchParams.get('account_id') || `acct_express_${community?.id || 'leader'}`;
      setStripeConnected(true);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`more_stripe_connected_${community?.id}`, 'true');
          localStorage.setItem(`more_stripe_account_${community?.id}`, accId);
        } catch (e) {}
      }
      toast.success('Stripe Express Connected!', 'Your bank account is linked. 95% of ticket revenue will be paid out automatically.');
    }
  }, [searchParams, community?.id]);

  const handleConnectStripe = async (preferStripeExpress = false) => {
    if (!community?.id) return;
    if (!preferStripeExpress) {
      setShowPayoutBankModal(true);
      return;
    }
    try {
      setIsConnectingStripe(true);
      let authHeader = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authHeader = { 'Authorization': `Bearer ${session.access_token}` };
      } catch (e) {}

      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          communityId: community.id,
          returnUrl: `${window.location.origin}/dashboard?tab=monetisation&stripe_connect=success`,
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to generate onboarding URL');
      }
    } catch (err) {
      console.error(err);
      toast.error('Stripe Connect Failed', err.message || 'Please try again.');
    } finally {
      setIsConnectingStripe(false);
    }
  };

  // ─── Community Guidelines State & Effects ─────────────────
  const [guidelinesDraft, setGuidelinesDraft] = useState([]);
  const [newGuidelineInput, setNewGuidelineInput] = useState('');
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);
  const [isSavingGuidelines, setIsSavingGuidelines] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState(null);

  useEffect(() => {
    if (community?.id) {
      if (Array.isArray(community.guidelines) && community.guidelines.length > 0) {
        setGuidelinesDraft([...community.guidelines]);
      } else {
        try {
          const raw = localStorage.getItem(`more_community_guidelines_${community.id}`);
          if (raw) setGuidelinesDraft(JSON.parse(raw));
          else setGuidelinesDraft([]);
        } catch {
          setGuidelinesDraft([]);
        }
      }
    }
  }, [community?.id, community?.guidelines]);

  useEffect(() => {
    if (searchParams?.get('tab') === 'settings' && (searchParams?.get('section') === 'guidelines' || searchParams?.get('action') === 'guidelines')) {
      setIsGuidelinesExpanded(true);
    }
  }, [searchParams]);

  const handleSaveGuidelines = async () => {
    if (!community?.id) return;
    setIsSavingGuidelines(true);
    const cleaned = guidelinesDraft.map(g => g.trim()).filter(Boolean);
    try {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`more_community_guidelines_${community.id}`, JSON.stringify(cleaned));
        } catch (e) {}
      }
      await updateCommunity(community.id, { guidelines: cleaned });
      toast.success('Guidelines saved!', `${cleaned.length} community guidelines are now active.`);
    } catch (err) {
      console.error(err);
      toast.error('Could not save guidelines', 'Please try again.');
    } finally {
      setIsSavingGuidelines(false);
    }
  };

  const handleApplyPresetPack = (pack, replace = false) => {
    setSelectedPackId(pack.id);
    if (replace || guidelinesDraft.length === 0) {
      setGuidelinesDraft([...pack.rules]);
      toast.success('Starter rules loaded!', `${pack.rules.length} rules loaded into your draft. Edit or save below.`);
    } else {
      const existing = new Set(guidelinesDraft.map(r => r.toLowerCase().trim()));
      const toAdd = pack.rules.filter(r => !existing.has(r.toLowerCase().trim()));
      if (toAdd.length === 0) {
        toast.info('Already in your list', 'These rules are already included.');
      } else {
        setGuidelinesDraft(prev => [...prev, ...toAdd]);
        toast.success('Rules added!', `Added ${toAdd.length} rules from ${pack.name} to your draft.`);
      }
    }
  };

  const handleAddInspirationRule = (ruleText) => {
    const trimmed = ruleText.trim();
    if (!trimmed) return;
    if (guidelinesDraft.some(r => r.toLowerCase().trim() === trimmed.toLowerCase())) {
      toast.info('Already in draft', 'This guideline is already in your list.');
      return;
    }
    setGuidelinesDraft(prev => [...prev, trimmed]);
    toast.success('Rule added', `Added to guidelines.`);
  };

  const handleAddCustomGuideline = (e) => {
    if (e) e.preventDefault();
    const text = newGuidelineInput.trim();
    if (!text) return;
    setGuidelinesDraft(prev => [...prev, text]);
    setNewGuidelineInput('');
  };

  const fileInputRef = useRef(null);

  // ─── Computed Stats ───────────────────────────────────────
  const stats = useMemo(() => {
    if (!community) return {};
    const totalMembers = memberList.length;
    const activeMembers = memberList.filter(m => 
      getEngagementScore(m, events, eventRsvps, communityMessages, community.id) >= 30
    ).length;
    
    // Revenue: sum ticket prices for all going RSVPs
    let totalRevenue = 0;
    let monthRevenue = 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    communityEvents.forEach(event => {
      const price = event.ticketPrice || 0;
      const rsvps = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
      const eventRevenue = price * rsvps.length;
      totalRevenue += eventRevenue;
      
      if (event.date) {
        const eventDate = new Date(event.date + 'T00:00:00');
        if (eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear) {
          monthRevenue += eventRevenue;
        }
      }
    });
    
    // Events this month
    const eventsThisMonth = publishedEvents.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    
    // Check-in rate
    let totalRsvps = 0;
    let totalCheckins = 0;
    communityEvents.forEach(event => {
      const rsvps = eventRsvps[event.id] || [];
      totalRsvps += rsvps.filter(r => r.status === 'going').length;
      totalCheckins += rsvps.filter(r => r.checkedIn).length;
    });
    const checkinRate = totalRsvps > 0 ? Math.round((totalCheckins / totalRsvps) * 100) : 0;
    
    // Next event countdown
    const upcoming = publishedEvents.filter(e => daysUntil(e.date) !== null);
    const nextEvent = upcoming.length > 0 ? upcoming[0] : null;
    const daysToNext = nextEvent ? daysUntil(nextEvent.date) : null;
    
    return { totalMembers, activeMembers, totalRevenue, monthRevenue, eventsThisMonth, checkinRate, daysToNext, nextEvent };
  }, [community, memberList, communityEvents, publishedEvents, eventRsvps, communityMessages, events]);

  // ─── Per-event revenue helper ─────────────────────────────
  const getEventRevenue = (event) => {
    const price = event.ticketPrice || 0;
    const rsvps = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
    return { price, rsvpCount: rsvps.length, revenue: price * rsvps.length, checkedIn: rsvps.filter(r => r.checkedIn).length };
  };

  // ─── Member growth data (last 7 weeks) ────────────────────
  const growthData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      // Count members who "joined" in this week window (simulate from index)
      const count = Math.max(1, Math.floor(memberList.length * (7 - i) / 7) + (i % 3));
      weeks.push({ count, label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    }
    const max = Math.max(...weeks.map(w => w.count), 1);
    return { weeks, max };
  }, [memberList]);

  // ─── Recent Activity with Date & Time ──────────────────────
  const formatActivityTime = (rawDate) => {
    if (!rawDate) return 'Recently';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today at ${timeStr}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${timeStr}`;
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const yearStr = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
    return `${dateStr}${yearStr} at ${timeStr}`;
  };

  const recentActivity = useMemo(() => {
    const activities = [];
    // Recent messages
    communityMessages.forEach(m => {
      const author = users.find(u => u.id === m.authorId);
      const rawDate = m.timestamp || m.created_at;
      activities.push({
        type: 'message',
        text: `${author?.name || 'Someone'} sent a message`,
        icon: MessageCircle,
        color: '#3b82f6',
        time: formatActivityTime(rawDate),
        rawTime: rawDate ? new Date(rawDate).getTime() : 0
      });
    });
    // Recent RSVPs
    communityEvents.forEach(event => {
      const rsvps = eventRsvps[event.id] || [];
      rsvps.forEach(r => {
        const rUser = users.find(u => u.id === r.userId);
        const rawDate = r.createdAt || r.created_at;
        activities.push({
          type: 'rsvp',
          text: `${rUser?.name || 'Someone'} RSVP'd to ${event.title}`,
          icon: Ticket,
          color: '#14b8a6',
          time: formatActivityTime(rawDate),
          rawTime: rawDate ? new Date(rawDate).getTime() : 0
        });
      });
    });
    // Member joins
    memberList.forEach(m => {
      const mUser = users.find(u => u.id === m.userId);
      const rawDate = m.joinedAt || m.createdAt || m.created_at || mUser?.created_at || mUser?.joinedDate;
      activities.push({
        type: 'join',
        text: `${mUser?.name || 'Someone'} joined the community`,
        icon: UserPlus,
        color: '#a78bfa',
        time: formatActivityTime(rawDate),
        rawTime: rawDate ? new Date(rawDate).getTime() : 0
      });
    });
    activities.sort((a, b) => b.rawTime - a.rawTime);
    return activities.slice(0, 5);
  }, [communityMessages, communityEvents, eventRsvps, memberList, users]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleCoverImageSelect = async (e, directSave = false) => {
    const file = e.target.files[0];
    if (!file) return;

    let processedFile = file;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
        processedFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", { type: 'image/jpeg' });
      } catch (err) {
        console.warn("HEIC conversion fallback:", err);
      }
    }

    if (directSave && community) {
      setIsUploading(true);
      try {
        const url = await uploadImage(processedFile, 'community_covers');
        await updateCommunity(community.id, { cover_image: url, image: url });
        setCoverImagePreview(url);
        toast.success('Cover image updated!', 'Your community cover is now live');
      } catch (err) {
        console.error(err);
        toast.error('Upload failed', 'Could not upload cover image');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setCoverImageFile(processedFile);
    const reader = new FileReader();
    reader.onloadend = () => setCoverImagePreview(reader.result);
    reader.readAsDataURL(processedFile);
  };

  const handleEditClick = () => {
    if (community) {
      const currentTags = Array.isArray(community.tags) 
        ? [...community.tags] 
        : (typeof community.tags === 'string' && community.tags ? community.tags.split(',').map(t => t.trim()).filter(Boolean) : []);

      setEditForm({ 
        name: community.name || '',
        category: community.category || currentTags[0] || '',
        description: community.description || '', 
        location_name: community.location_name || '',
        lat: community.lat || null,
        lng: community.lng || null,
        cost: community.cost || 'Free',
        target_audience: community.target_audience || '',
        activity_level: community.activity_level || 'Active',
        tags: currentTags,
        customTagInput: '',
        website: community.website || '',
        whatsapp_group: community.whatsapp_group || '',
        instagram_handle: community.instagram_handle || ''
      });
      setCoverImageFile(null);
      setCoverImagePreview(community.cover_image || community.image || null);
      setSubscriptionPrice(community.subscriptionPrice || community.subscription_price || '');
      setEditTagCategory('All');
    }
    setIsEditing(true);
  };

  // Automatically trigger edit modal when arriving with ?edit=true
  useEffect(() => {
    if (searchParams?.get('edit') === 'true' && community) {
      handleEditClick();
    }
  }, [searchParams, community?.id]);

  const toggleEditTag = (tag) => {
    setEditForm(prev => {
      const currentTags = Array.isArray(prev.tags) ? prev.tags : [];
      const updated = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      return { 
        ...prev, 
        tags: updated,
        category: prev.category || (updated.length > 0 ? updated[0] : '')
      };
    });
  };

  const removeEditTag = (tag) => {
    setEditForm(prev => {
      const currentTags = Array.isArray(prev.tags) ? prev.tags : [];
      return { ...prev, tags: currentTags.filter(t => t !== tag) };
    });
  };

  const addCustomEditTag = (e) => {
    if (e) e.preventDefault();
    const tag = (editForm.customTagInput || '').trim();
    if (!tag) return;
    setEditForm(prev => {
      const currentTags = Array.isArray(prev.tags) ? prev.tags : [];
      if (currentTags.includes(tag)) return { ...prev, customTagInput: '' };
      const updated = [...currentTags, tag];
      return { 
        ...prev, 
        tags: updated, 
        customTagInput: '',
        category: prev.category || updated[0]
      };
    });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim()) {
      toast.error('Name required', 'Community name cannot be empty');
      return;
    }

    setIsUploading(true);
    let coverUrl = community?.cover_image || community?.image;
    if (coverImageFile) {
      try {
        coverUrl = await uploadImage(coverImageFile, 'community_covers');
      } catch (err) {
        console.error('Failed to upload cover image:', err);
        toast.error('Image upload failed', 'Could not upload cover image');
      }
    }

    let wa = (editForm.whatsapp_group || '').trim();
    if (wa && !wa.startsWith('http://') && !wa.startsWith('https://')) {
      wa = `https://${wa}`;
    }
    let ig = (editForm.instagram_handle || '').trim();
    if (ig && !ig.startsWith('@') && !ig.includes('instagram.com')) {
      ig = `@${ig}`;
    }

    const currentTags = Array.isArray(editForm.tags) 
      ? editForm.tags 
      : (typeof editForm.tags === 'string' ? editForm.tags.split(',') : []);
    const cleanedTags = currentTags.map(t => t.trim()).filter(Boolean);

    let finalLat = editForm.lat || null;
    let finalLng = editForm.lng || null;
    if (!finalLat || !finalLng) {
      const parsed = parseLocationCoords(editForm.location_name);
      if (parsed) {
        finalLat = parsed.lat;
        finalLng = parsed.lng;
      } else if (editForm.location_name) {
        try {
          const geo = await geocodeLocation(cleanLocationName(editForm.location_name));
          if (geo && geo.lat && geo.lng) {
            finalLat = geo.lat;
            finalLng = geo.lng;
          }
        } catch (e) {}
      }
    }

    // Sanitize and validate website link if provided
    let cleanWebsite = (editForm.website || '').trim();
    if (cleanWebsite) {
      if (!/^https?:\/\//i.test(cleanWebsite)) {
        cleanWebsite = 'https://' + cleanWebsite;
      }
      try {
        const parsedUrl = new URL(cleanWebsite);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          toast.error('Invalid website', 'Please provide a valid website URL starting with https://');
          setIsUploading(false);
          return;
        }
        const blockedHosts = ['bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'ow.ly', 'cutt.ly', 'rb.gy'];
        if (blockedHosts.some(h => parsedUrl.hostname.toLowerCase().includes(h))) {
          toast.error('Direct link required', 'URL shorteners (e.g. bit.ly, tinyurl) are blocked to protect community members from scams.');
          setIsUploading(false);
          return;
        }
      } catch (e) {
        toast.error('Invalid website address', 'Please enter a valid domain (e.g. yourcommunity.co.uk)');
        setIsUploading(false);
        return;
      }
    }

    await updateCommunity(community.id, {
      name: editForm.name.trim(),
      category: editForm.category.trim() || cleanedTags[0] || 'General',
      description: editForm.description.trim(),
      tags: cleanedTags,
      location_name: editForm.location_name.trim(),
      lat: finalLat,
      lng: finalLng,
      cost: editForm.cost.trim() || 'Free',
      target_audience: editForm.target_audience.trim(),
      activity_level: editForm.activity_level || 'Active',
      website: cleanWebsite,
      whatsapp_group: wa,
      instagram_handle: ig,
      cover_image: coverUrl,
      image: coverUrl
    });

    setIsUploading(false);
    setIsEditing(false);
    setCoverImageFile(null);
    toast.success('Community updated!', 'Changes to name and details have been saved');
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;
    if (deleteConfirmText.trim() !== community.name.trim() || !deleteConfirmChecked) {
      toast.error('Safeguard check failed', 'Please type the exact community name and check the confirmation box');
      return;
    }

    setIsDeletingCommunity(true);
    try {
      await deleteCommunity(community.id, deleteConfirmText.trim());
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
      setDeleteConfirmChecked(false);
      toast.success('Community Deleted', `"${community.name}" and all associated data have been permanently removed`);
      router.push('/discover');
    } catch (err) {
      console.error('Error deleting community:', err);
      toast.error('Deletion failed', err.message || 'Could not delete community');
    } finally {
      setIsDeletingCommunity(false);
    }
  };

  const handleCreateEvent = async () => {
    const dates = (eventForm.resolvedDates && eventForm.resolvedDates.length > 0)
      ? eventForm.resolvedDates
      : (eventForm.date ? [eventForm.date] : []);

    if (!eventForm.title?.trim()) {
      toast.error('Missing Title', 'Please enter a title for your event.');
      return;
    }
    if (dates.length === 0) {
      toast.error('No Dates Selected', 'Please select at least one date for your event.');
      return;
    }
    if (!eventForm.time) {
      toast.error('Missing Time', 'Please set a start time for the event.');
      return;
    }
    if (!eventForm.location?.trim()) {
      toast.error('Missing Location', 'Please provide a location or meeting point.');
      return;
    }

    if (parseFloat(eventForm.ticketPrice) > 0 && !stripeConnected && !eventForm.allowCash) {
      toast.error('Payout Account or Cash Option Required', 'Please register a payout account or check "Allow Pay in Cash" to publish a paid event.');
      setShowPayoutBankModal(true);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dates.length === 1 && dates[0] < todayStr) {
      const proceed = window.confirm('The date you selected is in the past. This event will be archived immediately under Past Events. Do you wish to publish it anyway?');
      if (!proceed) return;
    }

    setIsUploading(true);
    let imageUrl = '';
    
    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'events');
      }
      
      const finalImage = imageUrl || community?.cover_image || community?.image || null;

      if (dates.length === 1) {
        await createEvent(community.id, {
          ...eventForm,
          date: dates[0],
          maxCapacity: eventForm.maxCapacity ? parseInt(eventForm.maxCapacity, 10) : null,
          ticketPrice: eventForm.ticketPrice ? parseFloat(eventForm.ticketPrice) : 0,
          autoReminders: eventForm.autoReminders,
          autoFeedback: eventForm.autoFeedback,
          allowGuests: eventForm.allowGuests !== false,
          requireApproval: Boolean(eventForm.requireApproval),
          rsvpQuestion: eventForm.rsvpQuestion?.trim() || '',
            whatsappGroup: eventForm.whatsappGroup?.trim() || '',
          image: finalImage
        });
        toast.success('Event created!', `${eventForm.title} has been published`);
      } else {
        const eventsList = dates.map(d => ({
          ...eventForm,
          date: d,
          maxCapacity: eventForm.maxCapacity ? parseInt(eventForm.maxCapacity, 10) : null,
          ticketPrice: eventForm.ticketPrice ? parseFloat(eventForm.ticketPrice) : 0,
          autoReminders: eventForm.autoReminders,
          autoFeedback: eventForm.autoFeedback,
          requireApproval: Boolean(eventForm.requireApproval),
          rsvpQuestion: eventForm.rsvpQuestion?.trim() || '',
            whatsappGroup: eventForm.whatsappGroup?.trim() || '',
          image: finalImage
        }));
        await createEventsBatch(community.id, eventsList);
        toast.success(`${dates.length} events created!`, `${eventForm.title} recurring schedule published`);
      }
      
      setModalType(null);
      setEventStep(0);
      setEventForm(emptyEventForm);
      setImageFile(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create event', e.message || 'An error occurred while publishing.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEventId(event.id);
    const parsedCoords = parseLocationCoords(event.location);
    setEventForm({
      title: event.title || '', description: event.description || '',
      date: event.date || '', time: event.time || '',
      location: event.location || '',
      coords: parsedCoords || (event.lat && event.lng ? { lat: event.lat, lng: event.lng } : null),
      maxCapacity: event.maxCapacity ? event.maxCapacity.toString() : '',
      ticketPrice: event.ticketPrice ? event.ticketPrice.toString() : '',
      allowCash: Boolean(event.allowCash || event.allow_cash),
      allowGuests: event.allowGuests !== false && event.allow_guests !== false,
      collabCommunityIds: event.collabCommunityIds || [],
      autoReminders: event.autoReminders ?? true,
      autoFeedback: event.autoFeedback ?? true,
      requireApproval: Boolean(event.requireApproval || event.require_approval || (event.description && event.description.includes('[Host Approval Required]'))),
      rsvpQuestion: event.rsvpQuestion || (event.description?.match(/\[RSVP Question: ([^\]]+)\]/)?.[1] || ''),
        whatsappGroup: event.whatsappGroup || (event.description?.match(/\[WhatsApp: ([^\]]+)\]/)?.[1] || '') || '',
      scheduleMode: 'single',
      resolvedDates: event.date ? [event.date] : [],
      recurrenceSummary: 'Single event'
    });
    setImageFile(null);
    setModalType('edit-event');
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location) return;
    if (parseFloat(eventForm.ticketPrice) > 0 && !stripeConnected && !eventForm.allowCash) {
      toast.error('Payout Account or Cash Option Required', 'Please register a payout account or check "Allow Pay in Cash" to publish a paid event.');
      setShowPayoutBankModal(true);
      return;
    }
    setIsUploading(true);
    let imageUrl;
    if (imageFile) {
      try { imageUrl = await uploadImage(imageFile, 'events'); } catch (e) {
        toast.error('Upload failed', 'Could not upload event image');
      }
    }
    const updates = {
      title: eventForm.title, description: eventForm.description,
      date: eventForm.date, time: eventForm.time, location: eventForm.location,
      maxCapacity: eventForm.maxCapacity ? parseInt(eventForm.maxCapacity, 10) : null,
      ticketPrice: eventForm.ticketPrice ? parseFloat(eventForm.ticketPrice) : 0,
      allowCash: Boolean(eventForm.allowCash),
      allowGuests: eventForm.allowGuests !== false,
      requireApproval: Boolean(eventForm.requireApproval),
      rsvpQuestion: eventForm.rsvpQuestion?.trim() || '',
            whatsappGroup: eventForm.whatsappGroup?.trim() || '',
      collabCommunityIds: eventForm.collabCommunityIds || [],
        whatsappGroup: eventForm.whatsappGroup?.trim() || '',
      autoReminders: eventForm.autoReminders,
      autoFeedback: eventForm.autoFeedback
    };
    if (imageUrl) updates.image = imageUrl;
    await updateEvent(editingEventId, updates);
    setIsUploading(false);
    setModalType(null);
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setImageFile(null);
    toast.success('Event updated!', `${eventForm.title} has been saved`);
  };

  const handleCancelEvent = async (eventId) => {
    await cancelEvent(eventId);
    setCancelConfirmId(null);
    toast.info('Event cancelled', 'This event has been marked as cancelled');
  };

  const handlePromote = async (memberUser) => {
    try {
      await promoteMember(community.id, memberUser.id, 'Co-Leader');
      toast.success('Co-Leader Appointed! ??', `${memberUser.name} is now a Co-Leader of ${community.name}`);
    } catch (err) {
      toast.error('Could not appoint co-leader', err.message || 'Please try again.');
    }
  };
  
  const handleDemote = async (memberUser) => {
    try {
      await promoteMember(community.id, memberUser.id, 'Member');
      toast.success('Demoted', `${memberUser.name} is now a regular Member`);
    } catch (err) {
      toast.error('Could not update role', err.message || 'Please try again.');
    }
  };

  const handleRemove = async (memberUser) => {
    await removeMember(community.id, memberUser.id);
    toast.info('Member removed', `${memberUser.name} has been removed from the community`);
  };



  const handleAIGenerateEvent = async (overridePrompt) => {
    const promptToUse = (typeof overridePrompt === 'string' ? overridePrompt : aiPrompt) || '';
    if (!promptToUse.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          communityName: community?.name,
          communityLocation: community?.location_name,
          communityTags: community?.tags
        })
      });
      const data = await res.json();
      if (data.event) {
        setEventForm(prev => ({
          ...prev,
          title: data.event.title || prev.title,
          description: data.event.description || prev.description,
          date: data.event.date || prev.date,
          time: data.event.time || prev.time,
          location: data.event.location || prev.location,
          maxCapacity: data.event.maxCapacity != null ? String(data.event.maxCapacity) : prev.maxCapacity,
          ticketPrice: data.event.ticketPrice != null ? String(data.event.ticketPrice) : prev.ticketPrice,
          autoReminders: data.event.autoReminders ?? prev.autoReminders,
          autoFeedback: data.event.autoFeedback ?? prev.autoFeedback
        }));
        if (Array.isArray(data.event.vibeTags) && data.event.vibeTags.length > 0) {
          setGeneratedVibes(data.event.vibeTags);
        }
        setAiPrompt('');
        if (data.fallback) {
          toast.info(
            'Smart Template Applied',
            data.reason ? `AI notice: ${data.reason}` : 'Smart template created - review & tweak below.'
          );
        } else {
          toast.success(
            '✨ Gemini 2.0 Flash!',
            'Gemini crafted your custom event with rich local details.'
          );
        }
      } else {
        toast.error('Generation failed', 'Please try again or fill in manually.');
      }
    } catch (err) {
      console.error('AI event generation error:', err);
      toast.error('Connection error', 'Could not reach the AI. Try again shortly.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateApiSearch = async () => {
    if (!discoverySearchTerm.trim()) return;
    setIsDiscovering(true);
    setDiscoveryResults(null);
    try {
      const res = await fetch(`/api/experiences/discover?q=${encodeURIComponent(discoverySearchTerm)}&provider=${discoveryProvider}`);
      const result = await res.json();
      
      if (result.status === 'success') {
        if (result.isTestMode) toast.info('Using Test Mode (API Keys missing)');
        setDiscoveryResults(result.data);
      } else {
        toast.error('API Error: ' + result.message);
      }
    } catch (err) {
      toast.error('Failed to query provider API.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImportExperience = (exp) => {
    const newExp = {
      ...exp,
      communityId: community.id,
      leaderMarkup: 15,
      promotedBy: community?.id,
    };
    
    if (!experiences.find(e => e.id === exp.id)) {
      setExperiences(prev => [...prev, newExp]);
      toast.success(`${exp.title} added to your marketplace!`);
    } else {
      toast.error('Experience already imported.');
    }
    
    setIsDiscoveryModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Engagement Score'];
    const rows = memberList.map(m => {
      const u = users.find(usr => usr.id === m.userId);
      const score = getEngagementScore(m, events, eventRsvps, communityMessages, community.id);
      return [u?.name || 'Unknown', m.role || 'Member', score];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${community.name}-members.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!', 'Member data downloaded as CSV');
  };

  const handleSaveSubscriptionPrice = () => {
    const price = parseFloat(subscriptionPrice) || 0;
    updateCommunity(community.id, { subscription_price: price });
    toast.success('Pricing updated!', price > 0 ? `Community subscription set to £${price}/month` : 'Community set to free');
  };

  // ─── Event Wizard Steps ────────────────────────────────────
  const eventSteps = [
    { label: 'Details', icon: Edit3, desc: 'Name & describe your event' },
    { label: 'When & Where', icon: MapPin, desc: 'Set the date, time & location' },
    { label: 'Extras', icon: Settings, desc: 'Capacity, pricing & image' },
    { label: 'Autopilot', icon: Sparkles, desc: 'Automated CRM Triggers' },
  ];

  const canAdvanceStep = () => {
    if (eventStep === 0) return eventForm.title.trim().length > 0;
    if (eventStep === 1) {
      const hasDate = (eventForm.resolvedDates && eventForm.resolvedDates.length > 0) || Boolean(eventForm.date);
      return hasDate && Boolean(eventForm.time) && eventForm.location.trim().length > 0;
    }
    return true;
  };

  const openEventWizard = (editing = false, event = null) => {
    setEventStep(0);
    if (editing && event) {
      handleEditEvent(event);
    } else {
      setEditingEventId(null);
      setEventForm(emptyEventForm);
      setImageFile(null);
      setModalType('event');
    }
  };

  const renderEventForm = () => (
    <>
      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {eventSteps.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer', opacity: i <= eventStep ? 1 : 0.4 }} onClick={() => { if (i < eventStep || (i === eventStep + 1 && canAdvanceStep())) setEventStep(i); }}>
            <div style={{ height: '3px', borderRadius: '99px', background: i <= eventStep ? 'var(--teal-500)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <s.icon size={12} color={i <= eventStep ? 'var(--teal-400)' : 'var(--slate-600)'} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: i <= eventStep ? 'var(--teal-300)' : 'var(--slate-600)' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 0: Details */}
      {eventStep === 0 && (
        <>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12), rgba(236,72,153,0.08))',
            border: '1px solid rgba(168,85,247,0.35)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 8px 24px -6px rgba(0,0,0,0.3)'
          }}>
            {/* Header with Title and Mode pill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#f3e8ff', fontSize: '0.98rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Way 1: Draft Full Event with AI
                    <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(168,85,247,0.3)', color: '#e9d5ff', border: '1px solid rgba(168,85,247,0.5)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Fastest
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#c4b5fd', marginTop: '2px' }}>
                    Speak or type a rough idea. AI sets up the Title, Date, Time, Location, and Description.
                  </div>
                </div>
              </div>
            </div>

            {/* Active Voice Listening Banner */}
            {isListening && (
              <div style={{
                background: 'rgba(239,68,68,0.18)',
                border: '1px solid rgba(239,68,68,0.45)',
                borderRadius: '10px',
                padding: '9px 12px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
                  <span style={{ fontSize: '0.82rem', color: '#fecaca', fontWeight: 600 }}>
                    Listening... Speak naturally. Pauses are safe!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done Speaking ✓
                </button>
              </div>
            )}

            {/* Multi-paragraph prompt box (spacious on mobile & desktop) */}
            <div style={{ marginBottom: '14px' }}>
              <textarea 
                placeholder={isListening ? "Listening... Speak your walk or event idea freely. Take your time, pauses will not submit." : "Type or speak your event thoughts here (several paragraphs or bullet points welcome!)...\n\ne.g. A Saturday morning walk around the heath starting at 10am. Friendly dogs on leads welcome. We will take a relaxed 5km route through the woods with nice views, and finish up at the cafe for warm drinks and chats."} 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isListening ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.18)',
                  background: isListening ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.45)',
                  color: 'var(--white)',
                  fontSize: '0.94rem',
                  lineHeight: 1.55,
                  minHeight: '115px',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />

              {/* Action buttons row directly under the box */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      style={{
                        background: isListening ? '#ef4444' : 'rgba(255,255,255,0.08)',
                        border: '1px solid ' + (isListening ? '#ef4444' : 'rgba(255,255,255,0.18)'),
                        borderRadius: '8px',
                        padding: '8px 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        color: isListening ? '#ffffff' : '#c4b5fd',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                      <span>{isListening ? 'Done Speaking ✓' : '🎙️ Speak Idea'}</span>
                    </button>
                  )}
                  {aiPrompt.trim() && (
                    <button
                      type="button"
                      onClick={() => setAiPrompt('')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--slate-400)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear text
                    </button>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={() => handleAIGenerateEvent()}
                  disabled={isGenerating || !aiPrompt.trim()}
                  title="Generate all event details from these notes"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: isGenerating ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: (!aiPrompt.trim() && !isGenerating) ? 0.45 : 1,
                    boxShadow: '0 4px 14px rgba(139,92,246,0.35)'
                  }}
                  className="interactive-press"
                >
                  {isGenerating ? (
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Wand2 size={15} />
                      <span>✨ Draft Full Event</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Idea Starter Chips */}
            <div>
              <div style={{ fontSize: '0.72rem', color: '#c4b5fd', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lightbulb size={12} color="#fbbf24" /> Instant Idea Starters (1-Tap):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {AI_IDEA_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectChip(chip.prompt)}
                    disabled={isGenerating}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '999px',
                      padding: '4px 11px',
                      color: '#e9d5ff',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Vibes & Status feedback banner if draft active */}
            {generatedVibes && generatedVibes.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#d8b4fe', fontWeight: 600 }}>Detected Vibes:</span>
                {generatedVibes.map((v, i) => (
                  <span key={i} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(45,212,191,0.15)', color: '#5eead4', border: '1px solid rgba(45,212,191,0.3)', fontWeight: 500 }}>
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '22px 0 16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Way 2: Fill In Manually (or with bullet points)
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="var(--teal-400)" /> Event Title <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span></label>
            <input className="form-input" placeholder="e.g. Saturday Morning Walk" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} autoFocus style={{ fontSize: '1.05rem', padding: '14px 16px' }} />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <MessageCircle size={14} color="var(--slate-400)" /> Description & Meeting Details
                </label>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                  Drop rough notes or speak aloud, then tap <strong>Expand Bullets with AI</strong>.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleToggleDictateDescription}
                    title={isDictatingDescription ? "Stop dictation" : "Dictate your description or bullet points"}
                    style={{
                      background: isDictatingDescription ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      border: '1px solid ' + (isDictatingDescription ? '#ef4444' : 'rgba(255,255,255,0.14)'),
                      borderRadius: '999px',
                      padding: '3px 9px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      color: isDictatingDescription ? '#ffffff' : '#c4b5fd',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isDictatingDescription ? <MicOff size={12} /> : <Mic size={12} />}
                    <span>{isDictatingDescription ? 'Listening...' : 'Dictate'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExpandDescriptionWithAI}
                  disabled={isExpandingDescription || !(eventForm.description || '').trim()}
                  title="Turn rough notes or bullet points into an engaging, structured community description"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(217,70,239,0.3))',
                    border: '1px solid rgba(168,85,247,0.5)',
                    borderRadius: '999px',
                    padding: '3px 11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: isExpandingDescription ? 'wait' : 'pointer',
                    color: '#f3e8ff',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    opacity: !(eventForm.description || '').trim() && !isExpandingDescription ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                  className="interactive-press"
                >
                  {isExpandingDescription ? (
                    <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Sparkles size={12} color="#d8b4fe" />
                  )}
                  <span>{isExpandingDescription ? 'Expanding...' : '✨ Expand Bullets with AI'}</span>
                </button>
              </div>
            </div>
            {/* Active Description Dictating Banner if listening */}
            {isDictatingDescription && (
              <div style={{
                background: 'rgba(239,68,68,0.18)',
                border: '1px solid rgba(239,68,68,0.45)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 6px #ef4444' }} />
                  <span style={{ fontSize: '0.78rem', color: '#fecaca', fontWeight: 600 }}>
                    Recording notes... Each phrase becomes a bullet point. Pauses are safe!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDictateDescription}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done ✓
                </button>
              </div>
            )}

            <textarea 
              className="form-input" 
              placeholder="Type rough bullets or speak aloud:&#10;• 10am meet at North Gate&#10;• 5k flat park loop, gentle pace&#10;• Dogs welcome on leads&#10;• Coffee after at the boathouse cafe&#10;&#10;Then tap '✨ Expand Bullets with AI' above to polish!" 
              value={eventForm.description} 
              onChange={e => setEventForm({...eventForm, description: e.target.value})} 
              rows={7} 
              style={{ minHeight: '140px', lineHeight: 1.55 }} 
            />

            {/* Quick Polish Actions */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✨ 1-Tap Copy Polish:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleAppendToDescription('☕ Post-Walk Coffee:\nWe will wrap up at a local indie cafe for warm drinks, pastries, and relaxed conversations. Everyone is welcome!')}
                  style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', cursor: 'pointer' }}
                >
                  ☕ Add Coffee Stop
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendToDescription('🐾 Dog Friendly:\nFriendly dogs on leads are very welcome on this route! Please bring waste bags and water for your four-legged companion.')}
                  style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', cursor: 'pointer' }}
                >
                  🐾 Make Dog Friendly
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendToDescription('🎒 What to Bring:\n• Comfortable walking trainers or boots\n• Reusable water bottle\n• Weather-appropriate layers')}
                  style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', cursor: 'pointer' }}
                >
                  🎒 Add Kit Checklist
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendToDescription('🥾 Route Accessibility:\nThis is a step-free, mostly flat route on paved park paths, ideal for all paces, strollers, and beginners.')}
                  style={{ fontSize: '0.74rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', cursor: 'pointer' }}
                >
                  🥾 Gentle / Step-Free Note
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 1: When & Where */}
      {eventStep === 1 && (
        <>
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#93c5fd', lineHeight: 1.4 }}>Pick a single date, repeating schedule, or variety of dates.</span>
          </div>

          <RecurringSchedulePicker
            initialDate={eventForm.date}
            initialTime={eventForm.time}
            isEditing={Boolean(editingEventId)}
            onChange={(scheduleData) => {
              setEventForm(prev => ({
                ...prev,
                date: scheduleData.date,
                time: scheduleData.time,
                scheduleMode: scheduleData.scheduleMode,
                resolvedDates: scheduleData.resolvedDates,
                recurrenceSummary: scheduleData.recurrenceSummary
              }));
            }}
          />

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#3b82f6" /> Location <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span>
            </label>
            <LocationPicker 
              locationName={eventForm.location} 
              setLocationName={(loc) => setEventForm(prev => ({...prev, location: loc}))} 
              coords={eventForm.coords}
              onCoordsChange={(coords) => setEventForm(prev => ({...prev, coords}))}
            />
          </div>
        </>
      )}

      {/* Step 2: Extras */}
      {eventStep === 2 && (
        <>
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#fcd34d', lineHeight: 1.4 }}>These are optional  -  you can always edit them later.</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} color="#f59e0b" /> Max Capacity</label>
              <input type="number" className="form-input" placeholder="Unlimited" value={eventForm.maxCapacity} onChange={e => setEventForm({...eventForm, maxCapacity: e.target.value})} min="1" style={{ padding: '14px 16px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14} color="#f59e0b" /> Ticket Price (£)</label>
              <input type="number" className="form-input" placeholder="0 = Free" value={eventForm.ticketPrice} onChange={e => setEventForm({...eventForm, ticketPrice: e.target.value})} min="0" step="0.50" style={{ padding: '14px 16px' }} />
            </div>
          </div>

          {/* Cash on Arrival & Payout Bank Controls */}
          {parseFloat(eventForm.ticketPrice) > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Allow Cash Checkbox */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={eventForm.allowCash || false}
                  onChange={e => setEventForm({ ...eventForm, allowCash: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--teal-500)', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Banknote size={16} color="#fbbf24" /> Allow Pay in Cash at Venue (£{eventForm.ticketPrice})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                    Members can reserve a spot and hand you cash directly on arrival.
                  </div>
                </div>
              </label>

              {/* Allow +1 Guest Pass Checkbox */}
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={eventForm.allowGuests ?? true}
                  onChange={e => setEventForm({ ...eventForm, allowGuests: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--teal-500)', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="var(--teal-400)" /> Allow Attendees to Bring a +1 / Named Guest
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                    Members can reserve an extra spot for a friend without requiring them to sign up.
                  </div>
                </div>
              </label>

              {/* Payout Account Status Banner */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: stripeConnected ? 'rgba(20, 184, 166, 0.08)' : (eventForm.allowCash ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.1)'),
                border: stripeConnected ? '1px solid rgba(45, 212, 191, 0.3)' : (eventForm.allowCash ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.3)'),
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CreditCard size={18} color={stripeConnected ? 'var(--teal-400)' : (eventForm.allowCash ? '#fbbf24' : '#f87171')} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: stripeConnected ? 'var(--teal-200)' : (eventForm.allowCash ? '#fef08a' : '#fca5a5') }}>
                      {stripeConnected 
                        ? '✓ Payout Account Active (Faster Payments)' 
                        : (eventForm.allowCash ? 'Cash on Arrival Enabled' : 'Register a Payout Account to Sell Tickets Online')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', marginTop: '2px', lineHeight: 1.4 }}>
                      {stripeConnected 
                        ? 'Ticket revenue transfers automatically to your registered UK bank account via Faster Payments within 24-48 hours after your event takes place.' 
                        : (eventForm.allowCash 
                            ? 'You can collect cash in person at the meetup. To also accept online card payments, register a payout account.' 
                            : `To charge £${eventForm.ticketPrice} online, register your UK bank account so ticket sales transfer to you directly.`)}
                    </div>
                  </div>
                </div>

                {!stripeConnected && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowPayoutBankModal(true)}
                      className="btn btn-primary interactive-press"
                      style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}
                    >
                      Register Payout Account
                    </button>
                    {!eventForm.allowCash && (
                      <button
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, allowCash: true })}
                        className="btn btn-outline interactive-press"
                        style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem' }}
                      >
                        Allow Cash on Arrival
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={14} color="#f59e0b" /> Cover Image</label>
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setImageFile(e.target.files[0])} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', width: '100%', justifyContent: 'center', borderStyle: 'dashed', borderRadius: '12px' }}>
                <ImageIcon size={18} /> {imageFile ? imageFile.name : 'Choose Image (optional)'}
              </button>
            </div>
          </div>

          {/* Partner Community Co-Hosting & Cross-Promotion */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} color="var(--teal-400)" /> Community Co-Hosting & Cross-Promotion
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--teal-400)', fontWeight: 600 }}>Optional</span>
            </label>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginBottom: '10px', lineHeight: 1.4 }}>
              Select partner communities in Tunbridge Wells to co-host. This cross-promotes the event to their members and displays joint host branding.
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {communities
                .filter(c => c.id !== (community?.id || activeCommunityId))
                .map(partner => {
                  const isSelected = (eventForm.collabCommunityIds || []).includes(partner.id);
                  return (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() => {
                        const current = eventForm.collabCommunityIds || [];
                        const updated = isSelected 
                          ? current.filter(id => id !== partner.id)
                          : [...current, partner.id];
                        setEventForm({ ...eventForm, collabCommunityIds: updated });
                      }}
                      className="interactive-press"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: isSelected ? 'rgba(20,184,166,0.18)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.08)',
                        color: isSelected ? 'var(--teal-300)' : 'var(--slate-300)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {partner.image ? (
                        <img src={partner.image} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                          🤝
                        </div>
                      )}
                      <span>{partner.name}</span>
                      {isSelected && <Check size={13} color="var(--teal-400)" />}
                    </button>
                  );
                })}
            </div>
            {eventForm.collabCommunityIds?.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#86efac', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> {eventForm.collabCommunityIds.length} partner {eventForm.collabCommunityIds.length === 1 ? 'community' : 'communities'} selected for cross-promotion
              </div>
            )}
          </div>
          {/* Preview card */}
          {eventForm.title && (
            <div style={{ marginTop: '4px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</span>
                {eventForm.resolvedDates && eventForm.resolvedDates.length > 1 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--teal-300)', background: 'rgba(20,184,166,0.15)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                    🔁 {eventForm.recurrenceSummary || `${eventForm.resolvedDates.length} sessions`}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '48px', background: 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>{eventForm.date ? new Date(eventForm.date + 'T00:00:00').getDate() : ' - '}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{eventForm.date ? new Date(eventForm.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }) : ''}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem', marginBottom: '2px' }}>{eventForm.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {eventForm.time && <span>🕐 {eventForm.time}</span>}
                    {eventForm.location && <span>📍 {cleanLocationName(eventForm.location)}</span>}
                    {eventForm.ticketPrice && parseFloat(eventForm.ticketPrice) > 0 ? <span>💷 £{eventForm.ticketPrice}</span> : <span>🎟️ Free</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Step 3: Autopilot Triggers */}
      {eventStep === 3 && (
        <>
          <div style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Sparkles size={20} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--teal-400)', fontSize: '0.9rem', marginBottom: '4px' }}>AI-Configured Triggers</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                Based on your event details, the AI has pre-configured these automated CRM triggers. You can toggle them off if you prefer to manage communications manually.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              className="interactive-press"
              onClick={() => setEventForm({...eventForm, autoReminders: !eventForm.autoReminders})}
              style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={18} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>24h Event Reminder</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Auto-message attendees 1 day before</div>
                </div>
              </div>
              <div style={{ width: '44px', height: '24px', background: eventForm.autoReminders ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: eventForm.autoReminders ? '22px' : '2px', transition: 'all 0.3s' }} />
              </div>
            </div>

            <div 
              className="interactive-press"
              onClick={() => setEventForm({...eventForm, autoFeedback: !eventForm.autoFeedback})}
              style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={18} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>Post-Event Feedback</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Request a 5-star review 2h after event ends</div>
                </div>
              </div>
              <div style={{ width: '44px', height: '24px', background: eventForm.autoFeedback ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: eventForm.autoFeedback ? '22px' : '2px', transition: 'all 0.3s' }} />
              </div>
            </div>

            {/* Lu.ma Host Approval Mode */}
            <div 
              className="interactive-press"
              onClick={() => setEventForm({...eventForm, requireApproval: !eventForm.requireApproval})}
              style={{ padding: '16px', background: eventForm.requireApproval ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)', border: eventForm.requireApproval ? '1px solid rgba(20,184,166,0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="var(--teal-400)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Require Host Approval
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', fontWeight: 700 }}>LU.MA STYLE</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Shield exact meeting pin & coordinates until you approve each request</div>
                </div>
              </div>
              <div style={{ width: '44px', height: '24px', background: eventForm.requireApproval ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: eventForm.requireApproval ? '22px' : '2px', transition: 'all 0.3s' }} />
              </div>
            </div>

            {/* Lu.ma RSVP Micro-Question */}
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={16} color="var(--teal-400)" /> Custom RSVP Question
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)' }}>OPTIONAL</span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '10px' }}>
                Ask attendees 1 question before they RSVP (answers appear on your door list)
              </div>
              <input
                type="text"
                placeholder="e.g. Any injuries or dietary needs? Bringing a dog?..."
                value={eventForm.rsvpQuestion || ''}
                onChange={e => setEventForm({ ...eventForm, rsvpQuestion: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--white)', fontSize: '0.88rem', outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                {[
                  'Any dietary requirements?',
                  'Are you bringing a dog?',
                  'First time joining a walk?',
                  'Pacing / distance preference?'
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, rsvpQuestion: q })}
                    style={{
                      padding: '3px 8px', borderRadius: '99px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--slate-300)', fontSize: '0.7rem', cursor: 'pointer'
                    }}
                  >
                    + {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Private WhatsApp Carpool & Group Link */}
            <div style={{ padding: '16px', background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageCircle size={16} color="#25D366" /> Private WhatsApp Carpool & Walk Chat
                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(37,211,102,0.15)', color: '#4ade80', fontWeight: 700 }}>AUTO-INVITE</span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '10px' }}>
                Paste a WhatsApp invite link (e.g. chat.whatsapp.com/...). Auto-revealed on RSVP confirmation for carpools & trail coordination.
              </div>
              <input
                type="text"
                placeholder="https://chat.whatsapp.com/..."
                value={eventForm.whatsappGroup || ''}
                onChange={e => setEventForm({ ...eventForm, whatsappGroup: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(37,211,102,0.25)',
                  color: 'var(--white)', fontSize: '0.88rem', outline: 'none'
                }}
              />
              {community?.whatsapp_group && !eventForm.whatsappGroup && (
                <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#94a3b8' }}>
                  Default: Will use community WhatsApp group <span style={{ color: '#4ade80', fontWeight: 600 }}>({community.whatsapp_group})</span>
                </div>
              )}
            </div>

            <div 
              className="interactive-press"
              onClick={() => setEventForm({...eventForm, requireWaiver: eventForm.requireWaiver === false ? true : false})}
              style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="var(--teal-400)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>Attendee Safety & Liability Waiver</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Require member safety declaration on RSVP</div>
                </div>
              </div>
              <div style={{ width: '44px', height: '24px', background: eventForm.requireWaiver !== false ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)', borderRadius: '12px', position: 'relative', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'white', borderRadius: '50%', top: '2px', left: eventForm.requireWaiver !== false ? '22px' : '2px', transition: 'all 0.3s' }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer for bottom docked footer */}
      <div style={{ height: '24px' }} />
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="view-dashboard dashboard-layout" style={{ position: 'relative', minHeight: '100dvh', display: 'flex' }}>
      {/* Desktop Sidebar */}
      {community && (
        <div className="dashboard-sidebar desktop-only">
          <div className="dashboard-sidebar-header">
            <button 
              onClick={() => community?.id ? router.push(`/community/${community.id}`) : router.back()}
              style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 0 12px 0', fontWeight: 600 }}
              className="interactive-press"
            >
              <ChevronLeft size={16} /> Back to Community
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              {availableCommunities.length > 1 ? (
                <select 
                  value={communityIdLed} 
                  onChange={e => setActiveCommunityId(e.target.value)}
                  style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 12px', borderRadius: '8px', fontSize: '1rem', fontFamily: 'var(--font-heading)', outline: 'none', width: '100%', marginBottom: '4px', cursor: 'pointer' }}
                >
                  {availableCommunities.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#0f172a', color: '#f8fafc' }}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px' }}>{community.name}</h2>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Leader View</span>
              {user?.isAdmin && (
                <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                  Admin View →
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[
              { id: 'overview', icon: Activity, label: 'Overview' },
              { id: 'events', icon: Calendar, label: 'Events' },
              { id: 'people', icon: Users, label: 'People' },
              { id: 'monetisation', icon: DollarSign, label: 'Revenue' },
              { id: 'experiences', icon: Globe, label: 'Specialists & Experiences' },
              { id: 'social hub', icon: Heart, label: 'Social Hub' },
              { id: 'network', icon: Map, label: 'Network' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`dashboard-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={18} />
                <span style={{ textTransform: 'capitalize' }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
      {!community ? (
        isLoading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', color: 'var(--slate-400)', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(20,184,166,0.2)', borderTopColor: 'var(--teal-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
            <div style={{ fontSize: '0.95rem' }}>Loading Leader Dashboard...</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--white)', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '16px' }}>Lead a Community</h2>
            <p style={{ color: 'var(--slate-400)', marginBottom: '32px' }}>You do not lead any communities yet. Start one today!</p>
            <button onClick={() => setModalType('community')} className="btn btn-primary interactive-press" style={{ padding: '16px 32px', borderRadius: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> Create Community
            </button>
            {modalType === 'community' && <CommunityOnboardingFlow onComplete={() => setModalType(null)} />}
          </div>
        )
      ) : (
        <>
          <div className="mobile-only">
            <AppHeader 
              title="Dashboard" 
              showBack={true} 
              onBack={() => community?.id ? router.push(`/community/${community.id}`) : router.back()} 
            />
            <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {availableCommunities.length > 1 ? (
                  <select 
                    value={communityIdLed} 
                    onChange={e => setActiveCommunityId(e.target.value)}
                    style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {availableCommunities.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#0f172a', color: '#f8fafc' }}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>{community.name}</span>
                )}
                <span>• Leader View</span>
              </div>
              {user?.isAdmin && (
                <button 
                  onClick={() => router.push('/admin')} 
                  className="btn btn-outline interactive-press"
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: '#3b82f6', color: '#3b82f6' }}
                >
                  <Shield size={12} /> Admin
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-content-scroll">
          {/* Tab Navigation (Mobile) - 4x2 Grid layout: No horizontal sliding */}
          <div className="mobile-only" style={{ padding: '0 20px', marginBottom: '20px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '6px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '16px', 
              padding: '6px' 
            }}>
              {[
                { id: 'overview', icon: Activity, label: 'Overview' },
                { id: 'events', icon: Calendar, label: 'Events' },
                { id: 'people', icon: Users, label: 'People' },
                { id: 'monetisation', icon: DollarSign, label: 'Revenue' },
                { id: 'experiences', icon: Globe, label: 'Experiences' },
                { id: 'social hub', icon: Heart, label: 'Social Hub' },
                { id: 'network', icon: Map, label: 'Network' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: isActive ? '1px solid rgba(20,184,166,0.3)' : '1px solid transparent',
                      background: isActive ? 'rgba(20,184,166,0.15)' : 'transparent',
                      color: isActive ? 'var(--teal-300)' : 'var(--slate-400)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={16} color={isActive ? 'var(--teal-300)' : 'var(--slate-400)'} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: OVERVIEW  -  Command Centre                       */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Community Banner & Quick Cover Update */}
              <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                <div style={{ 
                  position: 'relative', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  height: '140px', 
                  background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(15,23,42,0.8))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                  {(community.cover_image || community.image) ? (
                    <img 
                      src={community.cover_image || community.image} 
                      alt={community.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                      No cover photo yet
                    </div>
                  )}
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'linear-gradient(to top, rgba(2,6,23,0.9) 0%, rgba(2,6,23,0.3) 50%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    padding: '16px'
                  }}>
                    <div>
                      <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>{community.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--teal-300)', fontWeight: 500 }}>Public Community Microsite</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <a 
                        href={`/community/${community.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline interactive-press"
                        style={{ 
                          background: 'rgba(15,23,42,0.85)', 
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(45,212,191,0.4)', 
                          color: 'var(--teal-300)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={14} color="var(--teal-300)" /> View Live Microsite ↗
                      </a>
                      <button 
                        onClick={handleEditClick}
                        className="btn btn-primary interactive-press"
                        style={{ 
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 size={14} /> Edit Microsite Profile
                      </button>
                      <input 
                        type="file" 
                        ref={bannerFileInputRef} 
                        onChange={(e) => handleCoverImageSelect(e, true)} 
                        accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp" 
                        style={{ display: 'none' }} 
                      />
                      <button 
                        onClick={() => bannerFileInputRef.current?.click()}
                        disabled={isUploading}
                        className="btn btn-outline interactive-press"
                        style={{ 
                          background: 'rgba(15,23,42,0.85)', 
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.2)', 
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ImageIcon size={14} /> {isUploading ? 'Updating...' : 'Update Cover'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leader Setup & Launch Checklist */}
              <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                <LeaderSetupChecklist
                  community={community}
                  events={communityEvents}
                  onOpenEventModal={() => {
                    setEditingEventId(null);
                    setEventForm(emptyEventForm);
                    setModalType('event');
                  }}
                  onOpenSettings={(section) => {
                    setActiveTab('settings');
                    if (section === 'guidelines') setIsGuidelinesExpanded(true);
                  }}
                />
              </div>

              {/* Leader Shield & InsurTech Compliance Card */}
              <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                {(() => {
                  const isShieldActive = Boolean(
                    community.is_insured || 
                    community.insurance_tier === 'pro' ||
                    (typeof window !== 'undefined' && localStorage.getItem(`more_community_insured_${community.id}`) === 'true')
                  );
                  const policyNo = community.insurance_policy_number || `MC-PRO-2026-${community.id.slice(0, 6).toUpperCase()}`;

                  return isShieldActive ? (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.14), rgba(15,23,42,0.92))',
                      border: '1px solid rgba(20,184,166,0.35)',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: 'rgba(20,184,166,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Shield size={22} color="#2dd4bf" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.92rem' }}>MORE Leader Shield Active</span>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>£5M COVER</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                            Policy #{policyNo} • 2% Reduced Ticket Fees (Save 60%)
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowShieldModal(true)} className="btn btn-outline interactive-press" style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                          Manage
                        </button>
                        <button onClick={() => generatePliCertificatePdf({ community, leaderName: user?.name, policyNumber: policyNo })} className="btn btn-primary interactive-press" style={{ padding: '8px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Download size={13} /> Certificate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(15,23,42,0.92))',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: 'rgba(245,158,11,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Shield size={22} color="#fbbf24" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--white)', fontSize: '1rem', letterSpacing: '-0.01em' }}>Upgrade to Leader Pro</span>
                            <span style={{ fontSize: '0.68rem', background: '#f59e0b', color: '#000', padding: '2px 7px', borderRadius: '5px', fontWeight: 800, letterSpacing: '0.04em' }}>PRO</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--slate-300)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', lineHeight: 1.3 }}>
                            <span style={{ color: '#38bdf8' }}><strong>✓ £5M Organiser Legal Protection</strong> included</span>
                            <span><strong>✓ 2% ticket fee</strong> (save 60%)</span>
                            <span><strong>✓ Council & Venue Safety Packs</strong></span>
                            <span><strong>✓ Digital attendee waivers</strong></span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowShieldModal(true)} 
                        className="btn btn-primary interactive-press"
                        style={{ padding: '9px 16px', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
                      >
                        <Crown size={15} /> Upgrade to Pro (£16.50/mo)
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Stats Grid 2x3  -  clickable for drill-down */}
              <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: leaderDrillDown ? '0' : '24px' }}>
                {[
                  { key: 'members',   value: stats.totalMembers || 0,                                                                    label: 'Total Members',     icon: Users,     color: 'white' },
                  { key: 'active',    value: stats.activeMembers || 0,                                                                   label: 'Active Members',    icon: Activity,  color: '#22c55e', accent: '#22c55e' },
                  { key: 'revenue',   value: `£${stats.totalRevenue || 0}`,                                                          label: 'Total Revenue',     icon: DollarSign,color: '#f59e0b', accent: '#f59e0b' },
                  { key: 'events',    value: stats.eventsThisMonth || 0,                                                                 label: 'Events This Month', icon: Calendar,  color: 'var(--teal-400)' },
                  { key: 'checkin',   value: `${stats.checkinRate || 0}%`,                                                               label: 'Check-in Rate',     icon: ScanLine,  color: '#3b82f6', accent: '#3b82f6' },
                  { key: 'next',      value: stats.daysToNext !== null ? (stats.daysToNext === 0 ? 'Today!' : `${stats.daysToNext}d`) : '\u2014', label: 'Next Event', icon: Zap, color: '#a78bfa', accent: '#a78bfa' },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setLeaderDrillDown(leaderDrillDown === s.key ? null : s.key)}
                    className="interactive-press"
                    style={{
                      all: 'unset', display: 'block', cursor: 'pointer', borderRadius: '14px',
                      outline: leaderDrillDown === s.key ? `2px solid ${s.accent || s.color || 'white'}` : '2px solid transparent',
                      transition: 'outline 0.2s'
                    }}
                  >
                    <div className="glass-panel stagger-item" style={{
                      padding: '16px', borderRadius: '14px',
                      ...(s.accent ? { border: `1px solid ${s.accent}30`, background: `linear-gradient(135deg, ${s.accent}10 0%, ${s.accent}02 100%)` } : {})
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: s.color || 'white' }}>{s.value}</div>
                        <s.icon size={18} color={s.color || 'var(--slate-500)'} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{s.label}</div>
                      <div style={{ fontSize: '0.6rem', color: leaderDrillDown === s.key ? (s.accent || s.color || 'white') : 'var(--slate-600)', marginTop: '4px', fontWeight: 600 }}>
                        {leaderDrillDown === s.key ? '\u25b2 Hide details' : '\u25bc Tap for details'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Drill-down panel */}
              {leaderDrillDown && (
                <div style={{ margin: '12px 20px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>

                  {/* Members */}
                  {leaderDrillDown === 'members' && (
                    <>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={14} /> Member Breakdown
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        {[
                          { label: 'Total',    value: stats.totalMembers || 0,                                             color: 'white' },
                          { label: 'Active',   value: stats.activeMembers || 0,                                            color: '#22c55e' },
                          { label: 'Inactive', value: (stats.totalMembers || 0) - (stats.activeMembers || 0),              color: '#6b7280' },
                        ].map(r => (
                          <div key={r.label} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: r.color, fontFamily: 'var(--font-heading)' }}>{r.value}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>{r.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '10px', fontWeight: 600 }}>Top engaged members</div>
                      {memberList.map(m => {
                        const u = users.find(x => x.id === m.userId);
                        if (!u) return null;
                        return { u, score: getEngagementScore(m, events, eventRsvps, communityMessages, community.id) };
                      }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 5).map(({ u, score }) => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <img src={u.avatar} alt={u.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--white)' }}>{u.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${score}%`, height: '100%', background: score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : '#6b7280', borderRadius: '99px' }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', minWidth: '32px', textAlign: 'right' }}>{score}%</span>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => { setActiveTab('people'); setLeaderDrillDown(null); }} style={{ marginTop: '14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', width: '100%', fontWeight: 600 }}>Manage Members →</button>
                    </>
                  )}

                  {/* Active Members */}
                  {leaderDrillDown === 'active' && (
                    <>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} /> Active Member Insights
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ padding: '14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#22c55e', fontFamily: 'var(--font-heading)' }}>{stats.activeMembers || 0}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Active (30%+ eng.)</div>
                        </div>
                        <div style={{ padding: '14px', background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6b7280', fontFamily: 'var(--font-heading)' }}>{(stats.totalMembers || 0) - (stats.activeMembers || 0)}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Need Re-engaging</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.6, marginBottom: '14px' }}>
                        Members are marked active if they have attended an event or sent a message. Use CRM to re-engage dormant members with a broadcast.
                      </div>
                      <button onClick={() => { setActiveTab('people'); setPeopleSubTab('crm'); setLeaderDrillDown(null); }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', width: '100%', fontWeight: 600 }}>Open CRM & Broadcast →</button>
                    </>
                  )}

                  {/* Revenue */}
                  {leaderDrillDown === 'revenue' && (
                    <>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={14} /> Revenue Breakdown
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        <div style={{ padding: '14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>£{stats.totalRevenue || 0}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>All Time</div>
                        </div>
                        <div style={{ padding: '14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e', fontFamily: 'var(--font-heading)' }}>£{stats.monthRevenue || 0}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>This Month</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '10px', fontWeight: 600 }}>Revenue by event</div>
                      {communityEvents.filter(e => (e.ticketPrice || 0) > 0).map(e => {
                        const r = getEventRevenue(e);
                        return (
                          <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--white)' }}>{e.title}</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>£{r.revenue}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{r.rsvpCount} tickets × £{r.price}</div>
                          </div>
                        );
                      })}
                      {communityEvents.filter(e => (e.ticketPrice || 0) > 0).length === 0 && (
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>No paid events yet. Add a ticket price when creating your next event.</div>
                      )}
                      <button onClick={() => { setActiveTab('monetisation'); setLeaderDrillDown(null); }} style={{ marginTop: '14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', width: '100%', fontWeight: 600 }}>Revenue Hub →</button>
                    </>
                  )}

                  {/* Events This Month */}
                  {leaderDrillDown === 'events' && (
                    <>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} /> Events This Month
                      </div>
                      {(() => {
                        const now = new Date();
                        const thisMonthEvents = publishedEvents.filter(e => {
                          if (!e.date) return false;
                          const d = new Date(e.date + 'T00:00:00');
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        });
                        if (thisMonthEvents.length === 0) return (
                          <div style={{ color: 'var(--slate-500)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>No events this month. Create one!</div>
                        );
                        return thisMonthEvents.map(e => {
                          const r = getEventRevenue(e);
                          const isPast = new Date(e.date + 'T00:00:00') < now;
                          return (
                            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ width: '36px', height: '40px', background: isPast ? 'rgba(107,114,128,0.15)' : 'rgba(20,184,166,0.12)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: isPast ? 'var(--slate-400)' : 'var(--teal-300)', lineHeight: 1 }}>{new Date(e.date + 'T00:00:00').getDate()}</div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--white)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{r.rsvpCount} going{r.revenue > 0 ? ` · £${r.revenue}` : ''}</div>
                              </div>
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isPast ? 'var(--slate-500)' : '#22c55e', background: isPast ? 'rgba(107,114,128,0.1)' : 'rgba(34,197,94,0.1)', padding: '3px 7px', borderRadius: '6px' }}>{isPast ? 'Past' : 'Upcoming'}</span>
                            </div>
                          );
                        });
                      })()}
                      <button onClick={() => { setActiveTab('events'); setLeaderDrillDown(null); }} style={{ marginTop: '14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', width: '100%', fontWeight: 600 }}>View All Events →</button>
                    </>
                  )}

                  {/* Check-in & Member Retention Analytics */}
                  {leaderDrillDown === 'checkin' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ScanLine size={15} color="var(--teal-400)" /> Attendance & Member Retention Analytics
                        </div>
                        <button
                          onClick={() => {
                            if (!communityEvents || communityEvents.length === 0) {
                              toast.info('No events', 'No attendance data to export.');
                              return;
                            }
                            const rows = [
                              ['Event Title', 'Event Date', 'Member Name', 'Member Email', 'RSVP Status', 'Checked In', 'Referred By']
                            ];
                            communityEvents.forEach(e => {
                              const rsvps = eventRsvps[e.id] || [];
                              rsvps.forEach(r => {
                                const u = users.find(x => x.id === r.userId);
                                rows.push([
                                  `"${(e.title || '').replace(/"/g, '""')}"`,
                                  `"${e.date || ''}"`,
                                  `"${(u?.name || 'Member').replace(/"/g, '""')}"`,
                                  `"${(u?.email || '').replace(/"/g, '""')}"`,
                                  `"${r.status || 'going'}"`,
                                  r.checkedIn || r.status === 'checked_in' ? 'Yes' : 'No',
                                  `"${r.referred_by || r.referredBy || 'Direct'}"`
                                ]);
                              });
                            });
                            const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement('a');
                            link.setAttribute('href', encodedUri);
                            link.setAttribute('download', `${community?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'community'}_attendance_roster.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success('Roster Exported!', 'Attendance CSV downloaded successfully.');
                          }}
                          className="interactive-press"
                          style={{
                            padding: '6px 12px', borderRadius: '8px',
                            background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)',
                            color: 'var(--teal-300)', fontSize: '0.75rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                          }}
                        >
                          <Download size={13} /> Export Roster (.CSV)
                        </button>
                      </div>

                      {(() => {
                        let totalR = 0, totalC = 0, referralCount = 0;
                        const attendeeCounts = {};
                        communityEvents.forEach(e => {
                          const rsvps = eventRsvps[e.id] || [];
                          rsvps.forEach(r => {
                            if (r.status === 'going' || r.status === 'checked_in') {
                              totalR++;
                              if (r.referred_by || r.referredBy) referralCount++;
                              if (r.checkedIn || r.status === 'checked_in') {
                                totalC++;
                                attendeeCounts[r.userId] = (attendeeCounts[r.userId] || 0) + 1;
                              }
                            }
                          });
                        });
                        const uniqueAttendees = Object.keys(attendeeCounts).length;
                        const repeatAttendees = Object.values(attendeeCounts).filter(c => c >= 2).length;
                        const retentionRate = uniqueAttendees > 0 ? Math.round((repeatAttendees / uniqueAttendees) * 100) : 0;
                        const checkinRate = totalR > 0 ? Math.round((totalC / totalR) * 100) : 0;

                        return (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                              {[
                                { label: 'Total RSVPs',   value: totalR,              color: '#a78bfa' },
                                { label: 'Checked In',    value: totalC,              color: '#22c55e' },
                                { label: 'Check-in Rate', value: `${checkinRate}%`,   color: '#3b82f6' },
                                { label: 'Retention Rate',value: `${retentionRate}%`, color: '#f59e0b', sub: `${repeatAttendees} repeat` },
                              ].map(r => (
                                <div key={r.label} style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: r.color, fontFamily: 'var(--font-heading)' }}>{r.value}</div>
                                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>{r.label}</div>
                                  {r.sub && <div style={{ fontSize: '0.62rem', color: 'var(--slate-500)', marginTop: '2px' }}>{r.sub}</div>}
                                </div>
                              ))}
                            </div>

                            {/* Retention & Referral summary cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                              <div style={{ padding: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Loyalty Retention
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--slate-200)', lineHeight: 1.4 }}>
                                  <strong>{repeatAttendees}</strong> members have attended 2+ events, giving you a <strong>{retentionRate}%</strong> loyalty retention rate.
                                </div>
                              </div>
                              <div style={{ padding: '12px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.72rem', color: '#7dd3fc', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                                  Word of Mouth
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--slate-200)', lineHeight: 1.4 }}>
                                  <strong>{referralCount}</strong> bookings originated from member referral share links.
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '10px', fontWeight: 600 }}>Check-in Performance by Event</div>
                      {communityEvents.filter(e => (eventRsvps[e.id] || []).some(r => r.status === 'going')).map(e => {
                        const rsvps = eventRsvps[e.id] || [];
                        const going = rsvps.filter(r => r.status === 'going' || r.status === 'checked_in').length;
                        const checkedIn = rsvps.filter(r => r.checkedIn || r.status === 'checked_in').length;
                        const pct = going > 0 ? Math.round((checkedIn / going) * 100) : 0;
                        return (
                          <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--white)', fontWeight: 600 }}>{e.title}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct >= 75 ? '#22c55e' : pct >= 40 ? '#f59e0b' : 'var(--slate-400)' }}>
                                {checkedIn}/{going} checked in ({pct}%)
                              </span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#6b7280', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Next Event */}
                  {leaderDrillDown === 'next' && (
                    <>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={14} /> Upcoming Events
                      </div>
                      {publishedEvents.filter(e => daysUntil(e.date) !== null).slice(0, 5).map(e => {
                        const d = daysUntil(e.date);
                        const r = getEventRevenue(e);
                        return (
                          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ padding: '4px 10px', background: 'rgba(139,92,246,0.15)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', whiteSpace: 'nowrap' }}>
                              {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d}d`}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--white)', fontWeight: 600 }}>{e.title}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{e.time} · {r.rsvpCount} going</div>
                            </div>
                          </div>
                        );
                      })}
                      {publishedEvents.filter(e => daysUntil(e.date) !== null).length === 0 && (
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>No upcoming events. Create one to get your community moving!</div>
                      )}
                      <button onClick={() => { setActiveTab('events'); setLeaderDrillDown(null); }} style={{ marginTop: '14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', borderRadius: '8px', padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', width: '100%', fontWeight: 600 }}>Manage Events →</button>
                    </>
                  )}

                </div>
              )}

              {/* Member Growth Chart */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div className="glass-panel stagger-item" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-300)' }}>Member Growth</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Last 7 weeks</div>
                  </div>
                  <div style={{ height: '140px', width: '100%', marginLeft: '-10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData.weeks} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--teal-500)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--teal-500)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="label" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: 'var(--slate-500)' }} 
                          dy={10}
                        />
                        <RechartsTooltip 
                          contentStyle={{ background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--white)', fontSize: '0.85rem' }}
                          itemStyle={{ color: 'var(--teal-400)', fontWeight: 700 }}
                          cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="var(--teal-400)" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                          activeDot={{ r: 6, fill: 'var(--teal-500)', stroke: 'white', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Next Event Hero Card */}
              {stats.nextEvent && (
                <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                  <div 
                    onClick={() => setActiveTab('events')}
                    className="interactive-press stagger-item"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                      border: '1px solid rgba(20,184,166,0.2)',
                      borderRadius: '16px', padding: '18px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}
                  >
                    <div style={{ width: '56px', height: '60px', background: 'rgba(20,184,166,0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>{parseDateParts(stats.nextEvent.date).day}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{parseDateParts(stats.nextEvent.date).month}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--teal-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        {stats.daysToNext === 0 ? '🔴 Happening Today' : stats.daysToNext === 1 ? '⏰ Tomorrow' : `Coming up in ${stats.daysToNext} days`}
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.nextEvent.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> {stats.nextEvent.time}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} /> {cleanLocationName(stats.nextEvent.location)}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--teal-400)" />
                  </div>
                </div>
              )}

              {/* Create Event  -  Prominent CTA when no upcoming events */}
              {!stats.nextEvent && (
                <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                  <div 
                    onClick={() => openEventWizard()}
                    className="interactive-press"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.06) 100%)',
                      border: '1px dashed rgba(20,184,166,0.3)',
                      borderRadius: '16px', padding: '28px 20px', cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal-500), #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Plus size={24} color="white" />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '1.05rem', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>Create Your First Event</div>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem', lineHeight: 1.5 }}>Events bring your community together. Set up one in under a minute.</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'New Event', icon: Plus, color: '#14b8a6', action: () => openEventWizard() },
                    { label: 'Broadcast', icon: Megaphone, color: '#f59e0b', action: () => setActiveTab('people') },
                    { label: 'Scan QR', icon: QrCode, color: '#3b82f6', action: () => setShowScanner(true) },
                    { label: 'People', icon: Users, color: '#a78bfa', action: () => setActiveTab('people') },
                    { label: 'Microsite', icon: Globe, color: '#f43f5e', action: () => router.push(`/community/${community.id}`) },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} className="interactive-press" style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 8px',
                      background: `${a.color}08`, border: `1px solid ${a.color}20`, borderRadius: '12px',
                      color: a.color, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                    }}>
                      <a.icon size={20} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Growth Kit */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>🚀 Growth Kit</div>
                <div style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.06) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>Invite your community</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '16px', lineHeight: 1.5 }}>Share your community page link to grow your membership.</div>
                  
                  {/* Share link bar */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--slate-400)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      morecommunity.app/community/{community.id}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://morecommunity.app/community/${community.id}`);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                        toast.success('Link copied!', 'Share it anywhere to grow your community');
                      }}
                      className="interactive-press"
                      style={{ padding: '10px 16px', background: linkCopied ? 'rgba(34,197,94,0.2)' : 'rgba(20,184,166,0.15)', border: `1px solid ${linkCopied ? 'rgba(34,197,94,0.4)' : 'rgba(20,184,166,0.3)'}`, borderRadius: '10px', color: linkCopied ? '#22c55e' : 'var(--teal-300)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                    >
                      {linkCopied ? '✓ Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  {/* Share channels */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const url = `https://morecommunity.app/community/${community.id}`;
                        const text = `Join ${community.name} on MoreCommunity! 🌟 ${url}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="interactive-press"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '12px', color: '#25d366', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>💬</span>
                      Share on WhatsApp
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://morecommunity.app/community/${community.id}`;
                        const text = `Join ${community.name} on MoreCommunity!`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                      className="interactive-press"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.25)', borderRadius: '12px', color: '#1da1f2', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>🐦</span>
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => router.push(`/community/${community.id}`)}
                      className="interactive-press"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', borderRadius: '12px', color: '#ec4899', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <Globe size={16} />
                      View Microsite
                    </button>
                    <button
                      onClick={() => setActiveTab('people')}
                      className="interactive-press"
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', color: '#a78bfa', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <BarChart3 size={16} />
                      Member CRM
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Recent Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                    <div key={i} className="stagger-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <a.icon size={14} color={a.color} />
                      </div>
                      <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--slate-300)' }}>{a.text}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-600)', whiteSpace: 'nowrap' }}>{a.time}</div>
                    </div>
                  )) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No recent activity yet  -  create your first event!</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: EVENTS                                          */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'events' && (
            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--teal-400)" /> My Events
                </h2>
                <button onClick={() => openEventWizard()} className="btn btn-primary interactive-press" style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> New Event
                </button>
              </div>

              {communityEvents.length === 0 ? (
                <div 
                  onClick={() => openEventWizard()}
                  className="interactive-press"
                  style={{ padding: '40px 24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(20,184,166,0.06) 0%, rgba(59,130,246,0.04) 100%)', borderRadius: '20px', border: '1px dashed rgba(20,184,166,0.25)', cursor: 'pointer' }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(59,130,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px dashed rgba(20,184,166,0.3)' }}>
                    <Calendar size={28} color="var(--teal-400)" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 8px', fontSize: '1.15rem' }}>Create Your First Event</h3>
                  <p style={{ color: 'var(--slate-400)', margin: '0 0 20px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Events are the heartbeat of your community. Set one up in under a minute with our guided wizard.
                  </p>
                  <div className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Plus size={18} /> Get Started
                  </div>
                </div>
              ) : (
                <>
                  {/* Member Walk Proposals (1-Click Approve & Publish) */}
                  {(() => {
                    const proposedEvents = communityEvents.filter(e => e.status === 'proposed');
                    if (proposedEvents.length === 0) return null;
                    return (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '16px',
                        padding: '16px 18px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.95rem' }}>
                            <Lightbulb size={18} />
                            <span>Member Walk Proposals ({proposedEvents.length})</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>1-click to approve & add to schedule</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {proposedEvents.map(prop => {
                            const cleanTitle = prop.title.replace(/^\[Proposal\]\s*/i, '');
                            return (
                              <div key={prop.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.95rem' }}>{cleanTitle}</span>
                                  <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                                    Member Idea
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginBottom: '6px' }}>
                                  📅 {prop.date} at {prop.time || '10:00'} • 📍 {cleanLocationName(prop.location)}
                                </div>
                                {prop.description && (
                                  <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)', margin: '0 0 10px 0', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                                    {prop.description}
                                  </p>
                                )}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateEvent(prop.id, { status: 'published', title: cleanTitle });
                                        toast.success('Walk Approved! 🎉', `"${cleanTitle}" is now live on the calendar.`);
                                      } catch (e) {
                                        toast.error('Error', 'Could not approve proposal.');
                                      }
                                    }}
                                    className="interactive-press"
                                    style={{
                                      padding: '6px 14px', borderRadius: '99px',
                                      background: '#10b981', color: '#fff', border: 'none',
                                      fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                  >
                                    <Check size={14} /> Approve & Publish
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await cancelEvent(prop.id);
                                        toast.info('Proposal Declined', 'Removed from proposal queue.');
                                      } catch (e) {
                                        toast.error('Error', 'Could not decline proposal.');
                                      }
                                    }}
                                    className="interactive-press"
                                    style={{
                                      padding: '6px 12px', borderRadius: '99px',
                                      background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                                      border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600,
                                      fontSize: '0.8rem', cursor: 'pointer'
                                    }}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Event Filter Tabs */}
                  {(() => {
                    const upcomingCount = publishedEvents.filter(e => isEventUpcoming(e)).length;
                    const pastCount = publishedEvents.filter(e => isEventPast(e)).length;
                    return (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
                        {[
                          { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
                          { id: 'past', label: `Past & Archived (${pastCount})` },
                          { id: 'all', label: `All Events (${communityEvents.length})` }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setDashboardEventFilter(tab.id)}
                            className="interactive-press"
                            style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: '1px solid',
                              borderColor: dashboardEventFilter === tab.id ? 'var(--teal-500)' : 'rgba(255,255,255,0.08)',
                              background: dashboardEventFilter === tab.id ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.02)',
                              color: dashboardEventFilter === tab.id ? 'var(--teal-300)' : 'var(--slate-400)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(() => {
                      let filteredEvents = communityEvents;
                      if (dashboardEventFilter === 'upcoming') {
                        filteredEvents = communityEvents.filter(e => isEventUpcoming(e) && e.status !== 'cancelled')
                          .sort((a, b) => (parseEventDateTime(a.date, a.time) || 0) - (parseEventDateTime(b.date, b.time) || 0));
                      } else if (dashboardEventFilter === 'past') {
                        filteredEvents = communityEvents.filter(e => isEventPast(e) && e.status !== 'cancelled')
                          .sort((a, b) => (parseEventDateTime(b.date, b.time) || 0) - (parseEventDateTime(a.date, a.time) || 0));
                      }

                      if (filteredEvents.length === 0) {
                        return (
                          <div style={{ padding: '36px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                            <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.9rem' }}>
                              {dashboardEventFilter === 'upcoming' 
                                ? 'No upcoming events scheduled. Create one to gather your members!' 
                                : dashboardEventFilter === 'past'
                                  ? 'No past events archived yet.'
                                  : 'No events found.'}
                            </p>
                          </div>
                        );
                      }

                      return filteredEvents.map(event => {
                        const { day, month } = parseDateParts(event.date);
                        const ev = getEventRevenue(event);
                        const isCancelled = event.status === 'cancelled';
                        const isPast = isEventPast(event);
                        const isExpanded = expandedEventId === event.id;
                        const attendees = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
                        const pendingRequests = (eventRsvps[event.id] || []).filter(r => r.status === 'pending_approval');
                        
                        return (
                          <div key={event.id} className="stagger-item" style={{ 
                            background: isPast ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.02)', 
                            border: isPast ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.06)', 
                            borderRadius: '14px', 
                            overflow: 'hidden', 
                            opacity: isCancelled ? 0.5 : isPast ? 0.88 : 1 
                          }}>
                            <div style={{ display: 'flex', gap: '14px', padding: '14px' }}>
                              {/* Date block */}
                              <div style={{ width: '48px', height: '54px', background: isPast ? 'rgba(51,65,85,0.4)' : 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isPast ? 'var(--slate-300)' : 'var(--white)', lineHeight: 1 }}>{day}</div>
                                <div style={{ fontSize: '0.65rem', color: isPast ? 'var(--slate-400)' : 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{month}</div>
                              </div>
                              
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <h4 style={{ margin: 0, flex: 1, fontSize: '0.95rem', fontWeight: 600, color: isPast ? 'var(--slate-200)' : 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h4>
                                  {isPast ? (
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(51,65,85,0.6)', color: 'var(--slate-300)', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, textTransform: 'uppercase' }}>Archived</span>
                                  ) : (
                                    <span className={`status-badge ${event.status || 'published'}`}>{event.status || 'live'}</span>
                                  )}
                                  {pendingRequests.length > 0 && (
                                    <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 8px', borderRadius: '99px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={10} /> {pendingRequests.length} Pending Approval
                                    </span>
                                  )}
                                </div>
                                
                                {/* Meta row */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> {event.time}</span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} /> {cleanLocationName(event.location)}</span>
                                </div>

                                {/* Pending Join Requests (Lu.ma Host Approval) */}
                                {pendingRequests.length > 0 && (
                                  <div style={{ marginTop: '8px', marginBottom: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>⏳ Pending Join Requests ({pendingRequests.length})</span>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--slate-400)', textTransform: 'none' }}>Location hidden until approved</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {pendingRequests.map(att => {
                                        const u = users.find(x => x.id === att.userId);
                                        return (
                                          <div key={att.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                              <img src={u?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.name || 'Member')}`} alt={u?.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u?.name || 'Community Member'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  try {
                                                    await updateAttendeeStatus(event.id, att.userId, 'going');
                                                    toast.success('Approved!', `${u?.name || 'Member'} approved.`);
                                                  } catch (e) {
                                                    toast.error('Error', 'Could not approve.');
                                                  }
                                                }}
                                                style={{ padding: '3px 10px', borderRadius: '99px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                                              >
                                                Approve
                                              </button>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  try {
                                                    await updateAttendeeStatus(event.id, att.userId, 'declined');
                                                    toast.info('Declined', 'Request declined.');
                                                  } catch (e) {
                                                    toast.error('Error', 'Could not decline.');
                                                  }
                                                }}
                                                style={{ padding: '3px 8px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}
                                              >
                                                Decline
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Stats row */}
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                                  <span style={{ color: isPast ? 'var(--slate-400)' : 'var(--teal-400)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <UserCheck size={12} /> {ev.rsvpCount}{event.maxCapacity ? `/${event.maxCapacity}` : ''} {isPast ? 'attended' : 'going'}
                                  </span>
                                  {ev.price > 0 && (
                                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <DollarSign size={12} /> £{ev.revenue} revenue
                                    </span>
                                  )}
                                  <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <ScanLine size={12} /> {ev.checkedIn} checked in
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            {!isCancelled && (
                              <div style={{ display: 'flex', gap: '6px', padding: '0 14px 10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {!isPast ? (
                                  <>
                                    <button onClick={() => setShowScanner(true)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--teal-400)', borderColor: 'rgba(20,184,166,0.3)' }}>
                                      <QrCode size={12} style={{ marginRight: '4px' }} /> Scan
                                    </button>
                                    <button onClick={() => setFlyerEvent(event)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}>
                                      <Printer size={12} style={{ marginRight: '4px' }} /> Flyer & Poster
                                    </button>
                                    <button 
                                      onClick={() => generateRamsPdf({ community, event, leaderName: user?.name, policyNumber: community.insurance_policy_number })} 
                                      className="btn btn-outline interactive-press" 
                                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#2dd4bf', borderColor: 'rgba(20,184,166,0.3)' }}
                                      title="Download Council & Venue Safety Assessment (Risk Document PDF)"
                                    >
                                      <Shield size={12} style={{ marginRight: '4px' }} /> Safety Pack
                                    </button>
                                    <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                      {isExpanded ? <ChevronUp size={12} style={{ marginRight: '4px' }} /> : <ChevronDown size={12} style={{ marginRight: '4px' }} />}
                                      {isExpanded ? 'Hide' : 'Attendees'}
                                    </button>
                                    <button 
                                      onClick={() => handleOpenReminderModal(event)} 
                                      className="btn btn-outline interactive-press" 
                                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}
                                      title={attendees.length === 0 ? "No registered attendees yet" : `Broadcast reminder to ${attendees.length} attendee(s)`}
                                    >
                                      <Bell size={12} style={{ marginRight: '4px' }} /> Remind
                                    </button>
                                    <button onClick={() => handleEditEvent(event)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                      <Edit3 size={12} style={{ marginRight: '4px' }} /> Edit
                                    </button>
                                    {cancelConfirmId === event.id ? (
                                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Cancel?</span>
                                        <button onClick={() => handleCancelEvent(event.id)} className="btn btn-danger interactive-press" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Yes</button>
                                        <button onClick={() => setCancelConfirmId(null)} className="btn btn-outline interactive-press" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>No</button>
                                      </div>
                                    ) : (
                                      <button onClick={() => setCancelConfirmId(event.id)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                                        <Ban size={12} style={{ marginRight: '4px' }} /> Cancel
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                      <Archive size={12} /> Event Ended (Archived)
                                    </span>
                                    <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                      {isExpanded ? <ChevronUp size={12} style={{ marginRight: '4px' }} /> : <ChevronDown size={12} style={{ marginRight: '4px' }} />}
                                      {isExpanded ? 'Hide' : `Attendees (${attendees.length})`}
                                    </button>
                                    <button onClick={() => setFlyerEvent(event)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}>
                                      <Printer size={12} style={{ marginRight: '4px' }} /> Flyer & Poster
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {/* Expandable Attendee List */}
                            {isExpanded && attendees.length > 0 && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '4px' }}>Attendees ({attendees.length})</div>
                                {attendees.map((rsvp, idx) => {
                                  const attendee = users.find(u => u.id === rsvp.userId);
                                  if (!attendee) return null;
                                  return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                                      <img src={attendee.avatar} alt={attendee.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span>{attendee.name}</span>
                                          {rsvp.guestName && (
                                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', color: '#7dd3fc', fontWeight: 600 }}>
                                              +1 {rsvp.guestName}
                                            </span>
                                          )}
                                        </div>
                                        {rsvp.answer && (
                                          <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '1px' }}>
                                            &ldquo;{rsvp.answer}&rdquo;
                                          </div>
                                        )}
                                      </div>
                                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, ...(rsvp.checkedIn ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--slate-500)' }) }}>
                                        {rsvp.checkedIn ? '✓ Checked In' : 'Pending'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {isExpanded && attendees.length === 0 && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 14px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem' }}>No attendees yet</div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: NETWORK (Cross-Pollination)                       */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'network' && (
            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Map size={20} color="var(--teal-400)" /> Network Events
                </h2>
                <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  Discover and co-host events from other communities in the network. Co-hosting helps you provide more value to your members instantly.
                </p>
              </div>

              {/* Network Events Search Bar */}
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search network events by title, community, location, or description..."
                  value={networkSearchQuery}
                  onChange={(e) => setNetworkSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'var(--white)',
                    fontSize: '0.9rem'
                  }}
                />
                {networkSearchQuery && (
                  <button
                    onClick={() => setNetworkSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--slate-400)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '4px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {events.filter(e => e.status === 'published' && !user?.ledCommunities?.includes(e.communityId)).filter(event => {
                  if (!networkSearchQuery.trim()) return true;
                  const q = networkSearchQuery.toLowerCase();
                  const sourceComm = communities.find(c => c.id === event.communityId);
                  return (
                    (event.title && event.title.toLowerCase().includes(q)) ||
                    (event.description && event.description.toLowerCase().includes(q)) ||
                    (event.location && event.location.toLowerCase().includes(q)) ||
                    (sourceComm && sourceComm.name && sourceComm.name.toLowerCase().includes(q))
                  );
                }).map(event => {
                  const sourceCommunity = communities.find(c => c.id === event.communityId);
                  const attendeeCount = (eventRsvps[event.id] || []).length;
                  const priceLabel = (event.ticketPrice || event.ticket_price) > 0 ? `£${event.ticketPrice || event.ticket_price}` : 'Free';

                  return (
                    <div 
                      key={event.id} 
                      className="stagger-item interactive-hover" 
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        borderRadius: '16px', 
                        padding: '18px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        {/* Clickable Image / Icon */}
                        <div 
                          onClick={() => setSelectedNetworkEvent(event)}
                          title="Click to view event details"
                          style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }}
                        >
                          {event.image ? (
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              style={{ width: '80px', height: '80px', borderRadius: '14px', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Calendar size={28} color="var(--teal-400)" />
                            </div>
                          )}
                          <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.65)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '6px',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <Eye size={10} color="#fff" />
                          </div>
                        </div>

                        {/* Event Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <h4 
                              onClick={() => setSelectedNetworkEvent(event)}
                              style={{ 
                                margin: '0 0 6px 0', 
                                fontSize: '1.1rem', 
                                color: 'var(--white)', 
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--teal-300)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--white)'}
                            >
                              {event.title}
                            </h4>
                            <span style={{
                              background: (event.ticketPrice || event.ticket_price) > 0 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                              color: (event.ticketPrice || event.ticket_price) > 0 ? '#c084fc' : '#4ade80',
                              border: `1px solid ${(event.ticketPrice || event.ticket_price) > 0 ? 'rgba(168, 85, 247, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                              padding: '2px 8px',
                              borderRadius: '99px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}>
                              {priceLabel}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--teal-300)', fontWeight: 500 }}>
                              {sourceCommunity?.name || 'Partner Community'}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {event.date} at {event.time || 'TBD'}
                            </span>
                            {event.location && (
                              <>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MapPin size={12} /> {cleanLocationName(event.location)}
                                </span>
                              </>
                            )}
                            {attendeeCount > 0 && (
                              <>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Users size={12} /> {attendeeCount} going
                                </span>
                              </>
                            )}
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, marginBottom: '14px' }}>
                            {event.description}
                          </div>
                          
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedNetworkEvent(event)}
                              className="btn btn-outline interactive-press"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                padding: '7px 14px',
                                borderRadius: '8px',
                                color: 'var(--slate-200)',
                                borderColor: 'rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.03)'
                              }}
                            >
                              <Eye size={14} color="var(--teal-400)" /> View Full Details
                            </button>

                            <button 
                              type="button"
                              onClick={() => handleCoHostNetworkEvent(event)}
                              disabled={isCoHostingNetworkEvent}
                              className="btn interactive-press" 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                fontSize: '0.8rem', 
                                padding: '7px 16px', 
                                borderRadius: '8px', 
                                color: '#fff', 
                                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                border: '1px solid #14b8a6',
                                fontWeight: 500
                              }}
                            >
                              <Plus size={14} /> Promote to My Community
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {events.filter(e => e.status === 'published' && !user?.ledCommunities?.includes(e.communityId)).filter(event => {
                  if (!networkSearchQuery.trim()) return true;
                  const q = networkSearchQuery.toLowerCase();
                  const sourceComm = communities.find(c => c.id === event.communityId);
                  return (
                    (event.title && event.title.toLowerCase().includes(q)) ||
                    (event.description && event.description.toLowerCase().includes(q)) ||
                    (event.location && event.location.toLowerCase().includes(q)) ||
                    (sourceComm && sourceComm.name && sourceComm.name.toLowerCase().includes(q))
                  );
                }).length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                    {networkSearchQuery ? `No network events matching "${networkSearchQuery}".` : 'No network events found. Check back later!'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: MONETISATION                                    */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'monetisation' && (
            <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
              {/* Revenue Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                <StatCard value={`£${stats.totalRevenue || 0}`} label="All-Time Revenue" icon={DollarSign} color="#f59e0b" accent="#f59e0b" />
                <StatCard value={`£${stats.monthRevenue || 0}`} label="This Month" icon={TrendingUp} color="#22c55e" accent="#22c55e" />
              </div>

              {/* Community Subscription Pricing */}
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Crown size={18} color="#f59e0b" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-heading)', color: '#fff' }}>Community Subscription</h3>
                    <button
                      type="button"
                      onClick={() => setShowSubscriptionInfo(true)}
                      className="interactive-press"
                      title="How does community subscription work? Click for full financial breakdown"
                      style={{
                        background: 'rgba(20, 184, 166, 0.15)',
                        border: '1px solid rgba(20, 184, 166, 0.35)',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--teal-400)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Info size={11} />
                    </button>
                  </div>
                  {Number(subscriptionPrice) > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '99px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                      Paid Community Active
                    </span>
                  )}
                </div>
                
                <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  Set a monthly price for your community. New members will be asked to pay before joining. Existing members are not affected.
                </p>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--slate-300)', fontSize: '1.2rem', fontWeight: 700 }}>£</span>
                  <input 
                    type="number" value={subscriptionPrice} onChange={e => setSubscriptionPrice(e.target.value)}
                    placeholder="0" min="0" step="1"
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', color: 'var(--white)', fontSize: '1.1rem', fontWeight: 600 }}
                  />
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>/ month</span>
                </div>

                {/* Live Breakdown Box if Price > 0 */}
                {Number(subscriptionPrice) > 0 && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                        Subscription Revenue Breakdown
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSubscriptionInfo(true)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--teal-400)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        How it works →
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-300)' }}>
                        <span>Member Monthly Dues:</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>£{Number(subscriptionPrice).toFixed(2)} / mo</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                        <span>Your Club Fund (95% standard / 100% Pro):</span>
                        <span style={{ fontWeight: 700 }}>+£{(Number(subscriptionPrice) * 0.95).toFixed(2)} / member</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
                        <span>Platform & Card Processing (5% standard / 0% Pro):</span>
                        <span>£{(Number(subscriptionPrice) * 0.05).toFixed(2)}</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', color: 'var(--teal-300)', fontSize: '0.8rem' }}>
                        <span>Estimated Annual (20 active members):</span>
                        <span style={{ fontWeight: 700 }}>£{(Number(subscriptionPrice) * 0.95 * 20 * 12).toLocaleString()}/year to your fund</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Setup Warning or Active Badge */}
                {Number(subscriptionPrice) > 0 && (
                  !stripeConnected ? (
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.08)', 
                      border: '1px solid rgba(239, 68, 68, 0.25)', 
                      borderRadius: '12px', 
                      padding: '14px', 
                      marginBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5' }}>
                            Payout Account Required
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', marginTop: '2px', lineHeight: 1.4 }}>
                            To charge £{subscriptionPrice}/month, register your UK bank account so recurring member payments transfer to you automatically.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPayoutBankModal(true)}
                        className="btn btn-primary interactive-press"
                        style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, alignSelf: 'flex-start' }}
                      >
                        Register Payout Account
                      </button>
                    </div>
                  ) : (
                    <div style={{ 
                      background: 'rgba(20, 184, 166, 0.08)', 
                      border: '1px solid rgba(20, 184, 166, 0.25)', 
                      borderRadius: '12px', 
                      padding: '12px 14px', 
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <CheckCircle2 size={16} color="var(--teal-400)" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: '0.78rem', color: 'var(--teal-200)', lineHeight: 1.4 }}>
                        <strong>✓ Payout Account Active (Faster Payments):</strong> Monthly subscription revenue transfers automatically to your registered UK bank account on the 1st of each month.
                      </div>
                    </div>
                  )
                )}

                <button onClick={handleSaveSubscriptionPrice} className="btn btn-primary interactive-press" style={{ width: '100%', padding: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={16} /> Save Pricing
                </button>
              </div>

              {/* ─── SUBSCRIPTION EXPLANATION MODAL ─── */}
              {showSubscriptionInfo && (
                <div 
                  onClick={() => setShowSubscriptionInfo(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    background: 'rgba(2, 6, 23, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                  }}
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    style={{
                      background: 'var(--slate-900)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '20px',
                      maxWidth: '520px',
                      width: '100%',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    {/* Modal Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                          Community Subscription Breakdown
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', margin: '4px 0 0' }}>
                          How member subscription fees and payouts work
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowSubscriptionInfo(false)}
                        className="interactive-press"
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* 3-Pillar Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* 1. Member Fee */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>1. Member Monthly Dues</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>£{Number(subscriptionPrice || 20).toFixed(2)}/mo</div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--slate-300)', margin: 0, lineHeight: 1.45 }}>
                          Billed securely to members every 30 days via card or direct debit. Existing community members remain unaffected when you update pricing.
                        </p>
                      </div>

                      {/* 2. Leader Community Fund */}
                      <div style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2dd4bf' }}>2. Your Community Fund (95% standard / 100% Pro)</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                            +£{(Number(subscriptionPrice || 20) * 0.95).toFixed(2)}/mo
                          </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--slate-300)', margin: 0, lineHeight: 1.45 }}>
                          Credited directly to your community treasury. Transfers automatically to your UK bank account on the 1st of each month via Faster Payments. Use it to buy group equipment, subsidise member tickets, or cover venue hire.
                        </p>
                      </div>

                      {/* 3. More Platform & Card Processing */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>3. More Platform & Payment Processing (5% standard / 0% Pro)</div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#a78bfa' }}>
                            £{(Number(subscriptionPrice || 20) * 0.05).toFixed(2)}/mo
                          </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--slate-300)', margin: 0, lineHeight: 1.45 }}>
                          Covers UK payment gateway fees (Stripe card/direct debit charges), automated recurring subscription billing, member access controls, and fraud protection. Reduced to 0% for Leader Pro members.
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setShowSubscriptionInfo(false)}
                      className="btn btn-primary interactive-press"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </div>
              )}

              {/* Revenue Per Event */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Revenue by Event</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {publishedEvents.length > 0 ? publishedEvents.map(event => {
                    const ev = getEventRevenue(event);
                    return (
                      <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--white)', marginBottom: '2px' }}>{event.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{ev.rsvpCount} tickets × £{ev.price}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: ev.revenue > 0 ? '#f59e0b' : 'var(--slate-500)', fontSize: '1rem' }}>£{ev.revenue}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{ev.price > 0 ? 'Paid' : 'Free'}</div>

                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '12px' }}>
                        <Calendar size={24} />
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--white)' }}>No upcoming events</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-400)', maxWidth: '250px' }}>Create your first event to start engaging with your community.</p>
                      <button className="btn btn-outline" style={{ marginTop: '16px', borderRadius: '20px', padding: '8px 20px' }} onClick={() => openEventWizard()}>Create Event</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stripe Connect Express Leader Payouts */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={20} color="var(--teal-400)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>Stripe Connect Express Payouts</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Automated UK Faster Payments to your bank</div>
                    </div>
                  </div>
                  {stripeConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '99px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.8rem', fontWeight: 700 }}>
                      <CheckCircle2 size={14} /> Bank Connected
                    </div>
                  ) : (
                    <div style={{ padding: '6px 12px', borderRadius: '99px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
                      Setup Required
                    </div>
                  )}
                </div>

                {stripeConnected ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>In Transit</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--teal-400)' }}>£450.00</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>Rolling daily transfer</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Lifetime Earnings</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)' }}>£3,240.00</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>95% Leader share</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Platform Split</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{isShieldActive ? '98% / 2%' : '95% / 5%'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>{isShieldActive ? '2% reduced fee (Pro)' : '5% standard platform fee'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-400)' }}></div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 600 }}>
                            {community?.payout_bank ? `${community.payout_bank.bankName || 'UK Bank'} Linked` : 'Payout Bank Linked'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '4px' }}>
                          {community?.payout_bank 
                            ? `Account: ${community.payout_bank.accountName} • Sort: ${community.payout_bank.sortCodeMasked || '••-••-••'} • Acc: ${community.payout_bank.accountMasked || '••••'}` 
                            : 'Payouts route automatically via UK Faster Payments directly to your bank.'}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPayoutBankModal(true)}
                        className="interactive-press"
                        style={{
                          padding: '8px 14px', borderRadius: '8px',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                          color: 'var(--white)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Manage Payout Account
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{
                    padding: '20px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)',
                    border: '1px solid rgba(20,184,166,0.2)',
                  }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ color: 'var(--white)', margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700 }}>
                        Register Your Payout Account
                      </h4>
                      <p style={{ color: 'var(--slate-300)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
                        Connect your bank account via Stripe Express in under 2 minutes. Receive 95% of every event ticket and subscription directly into your account with automatic daily payouts. Standard Stripe card processing (~1.5% + 20p UK) is deducted by Stripe directly from payouts. Upgrade to Leader Pro to reduce platform ticket fees to just 2% (saving 60%).
                      </p>
                    </div>
                    <button
                      onClick={handleConnectStripe}
                      disabled={isConnectingStripe}
                      className="btn btn-primary interactive-press"
                      style={{
                        padding: '12px 24px', borderRadius: '12px',
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        fontSize: '0.95rem', fontWeight: 700,
                        cursor: isConnectingStripe ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <DollarSign size={18} />
                      {isConnectingStripe ? 'Opening Stripe Express...' : 'Register Payout Account'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: EXPERIENCES MARKETPLACE                          */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'experiences' && (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', margin: '0 20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--white)', fontFamily: 'var(--font-heading)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe color="var(--teal-400)" /> Trips & Retreats Marketplace
                  </h2>
                  <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.95rem' }}>Curate premium, high-margin experiences for your community. Powered by Viator & TourRadar.</p>
                </div>
                <button onClick={() => setIsDiscoveryModalOpen(true)} className="btn btn-primary interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px' }}>
                  <Search size={16} /> Discover via API
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {experiences.map(exp => {
                  const isPromoted = exp.promotedBy === community?.id;
                  const finalPrice = exp.basePrice + Math.round(exp.basePrice * ((exp.leaderMarkup || 0) / 100));
                  return (
                    <div key={exp.id} style={{ background: 'rgba(255,255,255,0.03)', border: isPromoted ? '2px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div 
                        onClick={() => window.open(`/experiences/${exp.id || exp.productCode}`, '_blank')}
                        style={{ position: 'relative', height: '140px', cursor: 'pointer' }}
                        title="Click to view full experience page"
                      >
                        <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--white)', backdropFilter: 'blur(4px)' }}>
                          £{exp.basePrice} base
                        </div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.category}</div>
                        <h4 
                          onClick={() => window.open(`/experiences/${exp.id || exp.productCode}`, '_blank')}
                          style={{ color: 'var(--white)', margin: '0 0 8px 0', fontSize: '1.05rem', lineHeight: 1.3, cursor: 'pointer' }}
                          className="interactive-hover"
                          title="Click to view full experience page"
                        >
                          {exp.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {exp.duration}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} color="#fbbf24" /> {exp.rating}</span>
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                          <a 
                            href={`/experiences/${exp.id || exp.productCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '0.78rem', 
                              color: 'var(--teal-400)', 
                              textDecoration: 'none',
                              fontWeight: 600 
                            }}
                            className="interactive-hover"
                          >
                            <span>Read more about this experience</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {!isPromoted ? (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--slate-300)' }}>Your Markup:</span>
                                <button
                                  type="button"
                                  onClick={() => setMarkupInfoExp(exp)}
                                  className="interactive-press"
                                  title="How does markup work? Click for full financial breakdown"
                                  style={{
                                    background: 'rgba(20, 184, 166, 0.15)',
                                    border: '1px solid rgba(20, 184, 166, 0.35)',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--teal-400)',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  <Info size={11} />
                                </button>
                              </div>
                              <select 
                                value={exp.leaderMarkup ?? 15}
                                onChange={(e) => { 
                                  const val = parseInt(e.target.value) || 0;
                                  setExperiences(prev => prev.map(item => item.id === exp.id ? { ...item, leaderMarkup: val } : item));
                                  toast.success(`Markup set to +${val}%`); 
                                }}
                                style={{ background: 'var(--slate-800)', color: 'var(--white)', border: '1px solid var(--slate-700)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                <option value="0">0%</option><option value="10">+10%</option><option value="15">+15%</option><option value="20">+20%</option><option value="30">+30%</option>
                              </select>
                            </div>
                            <button 
                              onClick={() => { 
                                setExperiences(prev => prev.map(item => item.id === exp.id ? { ...item, promotedBy: community?.id } : item));
                                toast.success(`${exp.title} added!`); 
                              }}
                              className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}>Promote to Community</button>
                          </div>
                        ) : (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'rgba(20,184,166,0.1)', padding: '10px', borderRadius: '8px' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--teal-300)' }}>Selling: <strong>£{finalPrice}</strong></span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--teal-300)' }}>Profit: <strong>£{finalPrice - exp.basePrice}</strong></span>
                            </div>
                            <button 
                              onClick={() => { 
                                setExperiences(prev => prev.map(item => item.id === exp.id ? { ...item, promotedBy: null } : item));
                                toast.info(`${exp.title} removed.`); 
                              }}
                              className="btn btn-outline" style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ═══ MARKUP EXPLANATION MODAL ═══ */}
              
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: SOCIAL HUB                                      */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'social hub' && (
            <div style={{ padding: '0 20px', paddingBottom: '40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <SocialHub communityId={community.id} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: PEOPLE (Members + CRM merged)                   */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'people' && (
            <div style={{ paddingBottom: '40px' }}>
              {/* Sub-tab switcher */}
              <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', gap: '2px' }}>
                  {[{ id: 'members', label: 'Members', icon: Users }, { id: 'crm', label: 'CRM & Broadcast', icon: BarChart3 }].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPeopleSubTab(t.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                        borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                        background: peopleSubTab === t.id ? 'rgba(20,184,166,0.15)' : 'transparent',
                        color: peopleSubTab === t.id ? 'var(--teal-300)' : 'var(--slate-400)'
                      }}
                    >
                      <t.icon size={15} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members sub-tab */}
              {peopleSubTab === 'members' && (
                <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Member count header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}><span style={{ color: 'var(--white)', fontWeight: 700 }}>{memberList.length}</span> members in {community.name}</div>
                    <button onClick={() => setModalType('coleader')} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '8px', color: '#a78bfa', borderColor: 'rgba(139,92,246,0.3)' }}>
                      <Crown size={12} /> Promote
                    </button>
                  </div>

                  {memberList.map(membership => {
                    const memberUser = users.find(u => u.id === membership.userId);
                    if (!memberUser) return null;
                    const score = getEngagementScore(membership, events, eventRsvps, communityMessages, community.id);
                    return (
                      <div key={memberUser.id} className="stagger-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <img 
                              onClick={() => setSelectedProfileImage({
                                imageUrl: memberUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberUser.name)}&background=0D8B93&color=fff`,
                                name: memberUser.name,
                                subtitle: `${membership.role || 'Member'} • ${community?.name || ''}`
                              })} 
                              src={memberUser.avatar} 
                              alt={memberUser.name} 
                              title="Click to view full photo"
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} 
                            />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', background: score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : '#6b7280', border: '2px solid var(--slate-900)' }} />
                          </div>
                          <div>
                            <div onClick={() => router.push(`/profile/${memberUser.id}`)} style={{ fontWeight: 600, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                              {memberUser.name}
                              {membership.role === 'Leader' && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', padding: '2px 6px', borderRadius: '4px' }}>Leader</span>}
                              {membership.role === 'Co-Leader' && <span style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.3)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>Co-Leader</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: score >= 60 ? '#22c55e' : score >= 30 ? '#f59e0b' : 'var(--slate-500)', fontWeight: 600 }}>{score}%</span> engagement
                            </div>
                          </div>
                        </div>
                        {membership.role !== 'Leader' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {membership.role === 'Co-Leader' ? (
                              <button onClick={() => handleDemote(memberUser)} className="btn btn-outline interactive-press" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Demote</button>
                            ) : (
                              <button onClick={() => handlePromote(memberUser)} className="btn btn-outline interactive-press" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Promote</button>
                            )}
                            <button onClick={() => handleRemove(memberUser)} className="btn btn-danger interactive-press" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>Remove</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {memberList.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)' }}>No members yet. Share your community link to grow!</div>
                  )}
                </div>
              )}

              {/* CRM sub-tab */}
              {peopleSubTab === 'crm' && (
                <div style={{ padding: '0 20px' }}>
                  <MemberCRM communityId={community.id} />
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: SETTINGS  -  Full Config                          */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '50px' }}>
              {/* Header Title */}
              <div style={{ marginBottom: '6px', paddingTop: '4px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--white)' }}>
                  Settings & Controls
                </h2>
                <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--slate-400)', lineHeight: 1.45 }}>
                  Manage community identity, guidelines, messaging channels, and privacy.
                </p>
              </div>

              {/* ─── GROUP 1: BRANDING & GUIDELINES ─── */}
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--teal-300)', marginTop: '4px' }}>
                Branding & Guidelines
              </div>

              {/* Edit Microsite Profile */}
              <button 
                type="button"
                onClick={handleEditClick} 
                className="interactive-press" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', 
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '14px', color: 'var(--white)', width: '100%', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s, background 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', flexShrink: 0 }}>
                  <Edit3 size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>
                    Edit Microsite Profile
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Cover photo, story description, location radius, cadence & links
                  </div>
                </div>
                <ChevronRight size={18} color="var(--slate-500)" style={{ flexShrink: 0 }} />
              </button>

              {/* Community Guidelines & Norms Accordion */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setIsGuidelinesExpanded(!isGuidelinesExpanded)}
                  className="interactive-press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px',
                    width: '100%', background: 'transparent', border: 'none',
                    color: 'var(--white)', cursor: 'pointer', textAlign: 'left'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)', flexShrink: 0 }}>
                    <BookOpen size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'var(--white)', fontSize: '0.98rem' }}>
                        Community Guidelines & Norms
                      </span>
                      {guidelinesDraft.length > 0 ? (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', fontWeight: 600 }}>
                          {guidelinesDraft.length} {guidelinesDraft.length === 1 ? 'Rule' : 'Rules'} Active
                        </span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontWeight: 600 }}>
                          Not Set
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                      Set safety expectations, pet etiquette, and welcoming norms
                    </div>
                  </div>
                  {isGuidelinesExpanded ? <ChevronUp size={18} color="var(--slate-400)" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="var(--slate-400)" style={{ flexShrink: 0 }} />}
                </button>

                {isGuidelinesExpanded && (
                  <div style={{ padding: '0 18px 20px 18px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
                    {/* Pre-made template pack selector */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal-300)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={14} /> Starter Rule Packs
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--slate-400)' }}>Pick a pack to load pre-written rules, then customize them below</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                        {PREMADE_GUIDELINE_PACKS.map(pack => {
                          const isRecommended = (pack.id === 'dogs' && (
                            (community?.name || '').toLowerCase().includes('dog') || 
                            (community?.name || '').toLowerCase().includes('golden') ||
                            (community?.tags || []).some(t => t.toLowerCase().includes('dog') || t.toLowerCase().includes('pet'))
                          ));
                          const isSelected = selectedPackId === pack.id;
                          return (
                            <div
                              key={pack.id}
                              style={{
                                padding: '12px',
                                background: isSelected ? 'rgba(20,184,166,0.12)' : isRecommended ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
                                border: isSelected ? '1px solid var(--teal-500)' : isRecommended ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '8px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--white)' }}>{pack.name}</span>
                                  {isRecommended && (
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.25)', color: '#fbbf24', fontWeight: 700 }}>
                                      Best Fit
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--slate-400)', margin: '0 0 6px 0', lineHeight: 1.4 }}>{pack.desc}</p>
                                <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                                  • {pack.rules.length} pre-written rules
                                </div>
                              </div>
                              <div style={{ marginTop: '8px' }}>
                                {guidelinesDraft.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyPresetPack(pack, true)}
                                    className="interactive-press"
                                    style={{
                                      width: '100%', padding: '8px 12px', borderRadius: '8px', border: 'none',
                                      background: isSelected ? 'var(--teal-500)' : 'rgba(20,184,166,0.2)',
                                      color: isSelected ? '#000' : 'var(--teal-300)',
                                      fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                  >
                                    <Check size={13} /> Load Starter Rules ({pack.rules.length})
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPresetPack(pack, false)}
                                      className="interactive-press"
                                      style={{
                                        width: '100%', padding: '7px 10px', borderRadius: '6px',
                                        border: '1px solid rgba(20,184,166,0.3)',
                                        background: 'rgba(20,184,166,0.15)',
                                        color: 'var(--teal-300)',
                                        fontFamily: 'var(--font-body)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                      }}
                                    >
                                      <Plus size={13} /> + Add to My Rules
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Replace your current ${guidelinesDraft.length} rules with the ${pack.rules.length} rules from "${pack.name}"?`)) {
                                          handleApplyPresetPack(pack, true);
                                        }
                                      }}
                                      className="interactive-press"
                                      style={{
                                        width: '100%', padding: '5px 8px', borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.03)',
                                        color: 'var(--slate-400)',
                                        fontFamily: 'var(--font-body)', fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
                                        textAlign: 'center'
                                      }}
                                    >
                                      Replace all with this template
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Inspiration Chips */}
                    <div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '8px' }}>
                        💡 Tap any rule to add instantly:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {QUICK_INSPIRATION_RULES.map((rule, idx) => {
                          const isAlreadyAdded = guidelinesDraft.some(r => r.toLowerCase().trim() === rule.toLowerCase().trim());
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAddInspirationRule(rule)}
                              disabled={isAlreadyAdded}
                              className="interactive-press"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '999px',
                                border: isAlreadyAdded ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(20,184,166,0.3)',
                                background: isAlreadyAdded ? 'rgba(255,255,255,0.02)' : 'rgba(20,184,166,0.08)',
                                color: isAlreadyAdded ? 'var(--slate-500)' : 'var(--teal-300)',
                                fontFamily: 'var(--font-body)', fontSize: '0.75rem',
                                cursor: isAlreadyAdded ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {isAlreadyAdded ? <Check size={12} /> : <Plus size={12} />}
                              <span>{rule}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Guidelines Draft List */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)' }}>
                          Your Group Guidelines ({guidelinesDraft.length})
                        </span>
                        {guidelinesDraft.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Clear all draft guidelines?')) setGuidelinesDraft([]);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--rose-400)', fontFamily: 'var(--font-body)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {guidelinesDraft.length === 0 ? (
                        <div style={{ padding: '20px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--slate-400)', fontFamily: 'var(--font-body)', fontSize: '0.82rem' }}>
                          No guidelines set yet. Choose a starter pack above or type a custom rule below.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {guidelinesDraft.map((rule, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px'
                              }}
                            >
                              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal-400)', minWidth: '22px' }}>
                                #{idx + 1}
                              </span>
                              <input
                                type="text"
                                value={rule}
                                onChange={e => {
                                  const newVal = e.target.value;
                                  setGuidelinesDraft(prev => prev.map((r, i) => i === idx ? newVal : r));
                                }}
                                style={{
                                  flex: 1, background: 'transparent', border: 'none',
                                  color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setGuidelinesDraft(prev => prev.filter((_, i) => i !== idx))}
                                style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                                title="Remove rule"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Custom Rule Input */}
                    <form onSubmit={handleAddCustomGuideline} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={newGuidelineInput}
                        onChange={e => setNewGuidelineInput(e.target.value)}
                        placeholder="Type a custom guideline (e.g. Bring dog waste bags & water)..."
                        style={{
                          flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                          color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newGuidelineInput.trim()}
                        className="interactive-press"
                        style={{
                          padding: '0 16px', background: newGuidelineInput.trim() ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)',
                          border: newGuidelineInput.trim() ? '1px solid rgba(20,184,166,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px', color: newGuidelineInput.trim() ? 'var(--teal-300)' : 'var(--slate-500)',
                          fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 700, cursor: newGuidelineInput.trim() ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </form>

                    {/* Save Guidelines Action Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        Changes are published to your community microsite immediately.
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveGuidelines}
                        disabled={isSavingGuidelines}
                        className="btn btn-primary interactive-press"
                        style={{
                          padding: '8px 18px', fontSize: '0.85rem', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <Check size={14} /> {isSavingGuidelines ? 'Saving...' : 'Save Guidelines'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── GROUP 2: CHAT & MESSAGING ─── */}
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--teal-300)', marginTop: '8px' }}>
                Communication & Messaging
              </div>

              {/* WhatsApp Integration Button */}
              <button 
                type="button"
                onClick={() => { 
                  const existingWa = (whatsappSettings && community?.id && whatsappSettings[community.id]) || {};
                  setWaConfig({ 
                    businessConnected: Boolean(existingWa.businessConnected), 
                    groupLink: existingWa.groupLink || community?.whatsapp_group || '' 
                  }); 
                  setModalType('whatsapp'); 
                }} 
                className="interactive-press" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', 
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '14px', color: 'var(--white)', width: '100%', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s, background 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', flexShrink: 0 }}>
                  <MessageCircle size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)' }}>
                      WhatsApp Integration
                    </span>
                    {community?.whatsapp_group || (whatsappSettings && community?.id && whatsappSettings[community.id]?.groupLink) ? (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(37,211,102,0.2)', color: '#25D366', fontWeight: 600 }}>
                        Active Link
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)', fontWeight: 600 }}>
                        Not Set
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Connect official group chat link & toggle WhatsApp meetup alerts
                  </div>
                </div>
                <ChevronRight size={18} color="var(--slate-500)" style={{ flexShrink: 0 }} />
              </button>

              {/* ─── GROUP 3: ACCESS & SAFETY ─── */}
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--teal-300)', marginTop: '8px' }}>
                Access & Collaboration
              </div>

              {/* Community Visibility */}
              <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                    {communityVisibility === 'public' ? <Eye size={20} /> : <EyeOff size={20} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>
                      Community Visibility
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                      Control who can discover and preview your group
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['public', 'private', 'invite-only'].map(v => (
                    <button key={v} onClick={() => { 
                      setCommunityVisibility(v);
                      updateCommunity(community.id, { visibility: v });
                      toast.info('Visibility updated', `Community is now ${v}`);
                    }} className="interactive-press" style={{
                      flex: 1, padding: '10px 12px', borderRadius: '8px', border: 'none',
                      background: communityVisibility === v ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.03)',
                      border: communityVisibility === v ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.05)',
                      color: communityVisibility === v ? 'var(--teal-300)' : 'var(--slate-400)',
                      fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer'
                    }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Member Approval */}
              <div style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', flexShrink: 0 }}>
                  <Shield size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>
                    Require Member Approval
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                    New members must be vetted and approved before accessing chat
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { 
                    const newVal = !requireApproval;
                    setRequireApproval(newVal); 
                    updateCommunity(community.id, { require_approval: newVal });
                    toast.info(newVal ? 'Approval required' : 'Auto-approve enabled', newVal ? 'You\'ll review join requests' : 'Members join instantly'); 
                  }} 
                  style={{
                    width: '46px', height: '26px', borderRadius: '99px', border: 'none',
                    background: requireApproval ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: requireApproval ? '22px' : '2px', transition: 'left 0.2s' }}></div>
                </button>
              </div>

              {/* Accept Guest Sessions & Sponsor Pitches Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)', flexShrink: 0 }}>
                  <Sparkles size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)' }}>
                      Accept Guest Sessions & Sponsor Pitches
                    </div>
                    {pendingCollaborationsCount > 0 && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '99px'
                      }}>
                        {pendingCollaborationsCount} Pending
                      </span>
                    )}
                    <button 
                      type="button"
                      onClick={() => setModalType('pitches-review')}
                      title="Review guest session pitches and sponsor perks"
                      className="interactive-press"
                      style={{
                        background: 'none', border: 'none', padding: '2px',
                        color: 'var(--teal-400)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
                      }}
                    >
                      <Info size={16} />
                    </button>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                    Allow local guides, instructors & businesses to pitch sessions or member perks
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { 
                    const newVal = !(community.accepts_pitches ?? true);
                    updateCommunity(community.id, { accepts_pitches: newVal });
                    toast.info(newVal ? 'Collaborations Enabled' : 'Collaborations Disabled', newVal ? 'Instructors & sponsors can propose sessions' : 'Incoming pitches hidden from your page'); 
                  }} 
                  style={{
                    width: '46px', height: '26px', borderRadius: '99px', border: 'none',
                    background: (community.accepts_pitches ?? true) ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: (community.accepts_pitches ?? true) ? '22px' : '2px', transition: 'left 0.2s' }}></div>
                </button>
              </div>

              {/* Pitches & Collaborations Action Callout */}
              {(community.accepts_pitches ?? true) && (
                <div style={{
                  marginTop: '-4px',
                  marginBottom: '6px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: pendingCollaborationsCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(20, 184, 166, 0.05)',
                  border: pendingCollaborationsCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(20, 184, 166, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem' }}>🤝</span>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--white)' }}>
                        {pendingCollaborationsCount > 0 
                          ? `${pendingCollaborationsCount} Pitch${pendingCollaborationsCount > 1 ? 'es' : ''} & Session Proposal${pendingCollaborationsCount > 1 ? 's' : ''} Awaiting Review` 
                          : 'Guest Sessions & Sponsor Partnerships Active'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                        Review guest workshop pitches, sponsor perks, and member proposals
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalType('pitches-review')}
                    className="btn btn-outline interactive-press"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', color: 'var(--teal-300)', borderColor: 'rgba(20, 184, 166, 0.4)' }}
                  >
                    Review Pitches & Partnerships →
                  </button>
                </div>
              )}

              {/* Multi-Town Chapter Network Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                  <Globe size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)' }}>
                      Multi-Town Chapter Network
                    </div>
                    {pendingChapterApplications.length > 0 && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '99px'
                      }}>
                        {pendingChapterApplications.length} Pending
                      </span>
                    )}
                    <button 
                      type="button"
                      onClick={() => setModalType('chapter-info')}
                      title="Learn what is shown, where it appears, and how expansion works"
                      className="interactive-press"
                      style={{
                        background: 'none', border: 'none', padding: '2px',
                        color: 'var(--teal-400)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
                      }}
                    >
                      <Info size={16} />
                    </button>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                    Allow leaders in other villages or towns to launch official chapters of your community ({activeSisterChapters.length} active)
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { 
                    const currentVal = community.allow_chapters ?? community.allowChapters ?? true;
                    const newVal = !currentVal;
                    updateCommunity(community.id, { allow_chapters: newVal, allowChapters: newVal });
                    toast.info(newVal ? 'Chapters Enabled' : 'Chapters Disabled', newVal ? 'Chapter expansion banner is now visible on your page' : 'Chapter expansion banner hidden from your page'); 
                  }} 
                  style={{
                    width: '46px', height: '26px', borderRadius: '99px', border: 'none',
                    background: (community.allow_chapters ?? community.allowChapters ?? true) ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px',
                    left: (community.allow_chapters ?? community.allowChapters ?? true) ? '22px' : '2px', transition: 'left 0.2s'
                  }}></div>
                </button>
              </div>

              {/* Chapter Management Callout */}
              {(community.allow_chapters ?? community.allowChapters ?? true) && (
                <div style={{
                  marginTop: '-4px',
                  marginBottom: '6px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: pendingChapterApplications.length > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(56, 189, 248, 0.05)',
                  border: pendingChapterApplications.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.05rem' }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--white)' }}>
                        {pendingChapterApplications.length > 0 
                          ? `${pendingChapterApplications.length} Chapter Application${pendingChapterApplications.length > 1 ? 's' : ''} Awaiting Review` 
                          : `${activeSisterChapters.length} Active Sister Chapter${activeSisterChapters.length === 1 ? '' : 's'}`}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                        Review applications, payment splits, and network governance
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalType('chapter-info')}
                    className="btn btn-outline interactive-press"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                  >
                    Manage Chapters & Applications →
                  </button>
                </div>
              )}

              {/* Community Carpool & Lift Sharing Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                  <Car size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>
                    Community Carpool & Lift Sharing
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                    Allow attendees to offer spare seats and coordinate lifts on your event pages
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = community.allow_carpool ?? community.allowCarpool ?? true;
                    const newVal = !currentVal;
                    updateCommunity(community.id, { allow_carpool: newVal, allowCarpool: newVal });
                    toast.info(newVal ? 'Carpool Enabled' : 'Carpool Disabled', newVal ? 'Share a Lift section is visible on your event pages' : 'Share a Lift section hidden from your event pages');
                  }}
                  style={{
                    width: '46px', height: '26px', borderRadius: '99px', border: 'none',
                    background: (community.allow_carpool ?? community.allowCarpool ?? true) ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px',
                    left: (community.allow_carpool ?? community.allowCarpool ?? true) ? '22px' : '2px', transition: 'left 0.2s'
                  }}></div>
                </button>
              </div>

              {/* +1 Named Guest Passes Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                  <Users size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>
                    +1 Named Guest Passes (Bring a Friend)
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                    Allow members to reserve an extra spot for a friend (+1) on your event pages
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = community.allow_guests ?? community.allowGuests ?? true;
                    const newVal = !currentVal;
                    updateCommunity(community.id, { allow_guests: newVal, allowGuests: newVal });
                    toast.info(newVal ? 'Guest Passes Enabled' : 'Guest Passes Disabled', newVal ? 'Members can bring a +1 to your events' : 'Guest pass option hidden from event RSVPs');
                  }}
                  style={{
                    width: '46px', height: '26px', borderRadius: '99px', border: 'none',
                    background: (community.allow_guests ?? community.allowGuests ?? true) ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px',
                    left: (community.allow_guests ?? community.allowGuests ?? true) ? '22px' : '2px', transition: 'left 0.2s'
                  }}></div>
                </button>
              </div>

              {/* ─── GROUP 4: DATA & ADVANCED ─── */}
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--teal-300)', marginTop: '8px' }}>
                Data & Advanced
              </div>

              {/* Export Data */}
              <button 
                type="button"
                onClick={handleExportCSV} 
                className="interactive-press" 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 18px', 
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '14px', color: 'var(--white)', width: '100%', cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s, background 0.2s'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)', flexShrink: 0 }}>
                  <Download size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 600, color: 'var(--white)', marginBottom: '2px' }}>
                    Export Member Roster (CSV)
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                    Download member names, join dates, and engagement stats
                  </div>
                </div>
                <ChevronRight size={18} color="var(--slate-500)" style={{ flexShrink: 0 }} />
              </button>

              {/* Danger Zone */}
              <div style={{ marginTop: '8px', padding: '18px 20px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Trash2 size={16} color="#ef4444" />
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Danger Zone
                  </div>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--slate-400)', fontSize: '0.84rem', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                  Permanently delete this community, its upcoming events, tickets, discussion channels, and member relationships.
                </p>
                <button 
                  type="button"
                  onClick={() => { setIsDeleteModalOpen(true); setDeleteConfirmText(''); setDeleteConfirmChecked(false); }} 
                  className="btn btn-danger interactive-press" 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}
                >
                  <Trash2 size={16} /> Delete Community
                </button>
              </div>
            </div>
          )}
          </div> {/* closes dashboard-content-scroll */}
        </>
      )}
      </div> {/* closes dashboard-main */}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(isEditing || (modalType && modalType !== 'community')) && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 10000 }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: modalType === 'whatsapp' ? '540px' : modalType === 'coleader' ? '540px' : (isEditing || modalType === 'event' || modalType === 'edit-event') ? '680px' : '580px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            background: '#0b1120',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>
                {isEditing ? 'Edit Profile' : 
                 modalType === 'pitches-review' ? 'Guest Sessions & Sponsor Partnerships' :
                 modalType === 'chapter-info' ? 'Multi-Town Chapter Network' :
                 modalType === 'event' ? (eventForm.resolvedDates && eventForm.resolvedDates.length > 1 ? `Create Schedule (${eventForm.resolvedDates.length} Events)` : 'Create Event') : 
                 modalType === 'edit-event' ? 'Edit Event' :
                 modalType === 'members' ? 'Manage Members' : 
                 modalType === 'whatsapp' ? 'WhatsApp Integration' : 'Promote Co-Leader'}
              </h2>
              <button onClick={() => { setIsEditing(false); setModalType(null); setEditingEventId(null); setCoLeaderSearch(''); }} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--white)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Edit Profile */}
            {isEditing && (
              <>
                {/* 1. Community Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Community Name <span style={{ color: 'var(--teal-400)' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                    placeholder="e.g. Tunbridge Wells Run Club"
                    style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem', fontWeight: 600 }} 
                  />
                </div>

                {/* 2. Primary Category */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Primary Category / Focus
                  </label>
                  <input 
                    type="text" 
                    value={editForm.category} 
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} 
                    placeholder="e.g. ⚽ Sports, 🏃 Running, 🧘 Wellness, 🎨 Creative"
                    style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.95rem' }} 
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {['⚽ Sports', '🏃 Running', '🚶 Walking', '🐕 Dog Walking', '🧘 Wellness', '⛰️ Adventure', '🎨 Creative', '🍷 Food & Drink', '💻 Tech & Gaming'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, category: cat })}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          background: editForm.category === cat ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)',
                          border: editForm.category === cat ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)',
                          color: editForm.category === cat ? 'var(--teal-300)' : 'var(--slate-300)',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Cadence */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600 }}>How Often? (Cadence)</label>
                  <select
                    value={editForm.activity_level}
                    onChange={(e) => setEditForm({ ...editForm, activity_level: e.target.value })}
                    style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem', appearance: 'none' }}
                  >
                    <option value="Very Active">Very Active (Weekly)</option>
                    <option value="Active">Active (Fortnightly)</option>
                    <option value="Casual">Casual (Monthly or less)</option>
                    <option value="Flexible">Flexible / Pop-up</option>
                  </select>
                </div>

                {/* 4. Community Region & Coverage Area */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600 }}>Community Hub & Region Radius</label>
                  <CommunityRegionPicker
                    locationName={editForm.location_name}
                    setLocationName={(loc) => setEditForm(prev => ({ ...prev, location_name: loc }))}
                    coords={editForm.lat && editForm.lng ? [Number(editForm.lat), Number(editForm.lng)] : null}
                    onCoordsChange={(coords) => setEditForm(prev => ({ ...prev, lat: coords[0], lng: coords[1] }))}
                  />
                </div>

                {/* 4. Target Audience & Cost */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600 }}>Who is it for?</label>
                    <input 
                      type="text" 
                      placeholder="e.g. All abilities welcome" 
                      value={editForm.target_audience} 
                      onChange={(e) => setEditForm({ ...editForm, target_audience: e.target.value })} 
                      style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 600 }}>Cost / Pricing</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Free, Pay for coffee" 
                      value={editForm.cost} 
                      onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} 
                      style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem' }} 
                    />
                  </div>
                </div>

                {/* 5. Cover Photo */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600 }}>Community Cover Photo</label>
                  <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', background: 'var(--slate-800)', border: '1px dashed var(--slate-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    {coverImagePreview ? (
                      <img src={coverImagePreview} alt="Community cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--slate-400)' }}>
                        <ImageIcon size={28} />
                        <span style={{ fontSize: '0.8rem' }}>No cover photo uploaded</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={coverFileInputRef} 
                    onChange={(e) => handleCoverImageSelect(e, false)} 
                    accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp" 
                    style={{ display: 'none' }} 
                  />
                  <button 
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()} 
                    className="btn btn-outline interactive-press" 
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <ImageIcon size={16} /> {coverImagePreview ? 'Change Cover Photo' : 'Upload Cover Photo'}
                  </button>
                  <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '6px', textAlign: 'center' }}>Tip: Landscape photos (16:9, e.g. 1920×1080) display sharpest. Avoid small or portrait photos.</div>
                </div>

                {/* 6. Description */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600 }}>Description & Story</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} placeholder="What is this community about? Who is it for? What can members expect?" style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', minHeight: '120px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }} />
                </div>

                {/* 7. Tags (Multi-select & Custom) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                      Community Tags ({editForm.tags?.length || 0} selected)
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Add multiple tags</span>
                  </div>

                  {/* Selected Tags Chips */}
                  {editForm.tags && editForm.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {editForm.tags.map((tag, idx) => (
                        <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(20,184,166,0.15)', color: 'var(--teal-300)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {tag}
                          <button type="button" onClick={() => removeEditTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--teal-400)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Custom Tag Input */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Add custom tag (e.g. 🏸 Badminton)" 
                      value={editForm.customTagInput || ''} 
                      onChange={e => setEditForm({ ...editForm, customTagInput: e.target.value })} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomEditTag(); } }}
                      style={{ flex: 1, padding: '10px 12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.85rem' }}
                    />
                    <button 
                      type="button"
                      onClick={addCustomEditTag}
                      disabled={!editForm.customTagInput?.trim()} 
                      className="btn btn-outline interactive-press" 
                      style={{ padding: '0 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', opacity: editForm.customTagInput?.trim() ? 1 : 0.4 }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px', scrollbarWidth: 'none' }}>
                    {['All', ...Object.keys(COMMUNITY_TAG_CATEGORIES)].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditTagCategory(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          border: editTagCategory === cat ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.08)',
                          background: editTagCategory === cat ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.02)',
                          color: editTagCategory === cat ? 'var(--teal-300)' : 'var(--slate-400)',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Available Tag Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '160px', overflowY: 'auto', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                    {(editTagCategory === 'All' ? ALL_COMMUNITY_TAGS : (COMMUNITY_TAG_CATEGORIES[editTagCategory] || ALL_COMMUNITY_TAGS)).map(tag => {
                      const selected = editForm.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleEditTag(tag)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            border: selected ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)',
                            background: selected ? 'rgba(20,184,166,0.15)' : 'transparent',
                            color: selected ? 'var(--teal-300)' : 'var(--slate-300)',
                            fontWeight: selected ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8. Links & External Website */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600 }}>Official Website</label>
                  <input type="url" placeholder="https://yourgroup.co.uk" value={editForm.website || ''} onChange={(e) => setEditForm({...editForm, website: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem' }} />
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '4px' }}>
                    🔒 Direct HTTPS links only. URL shorteners (bit.ly, etc.) are blocked for member safety.
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600 }}>WhatsApp Group Link</label>
                  <input type="url" placeholder="https://chat.whatsapp.com/..." value={editForm.whatsapp_group} onChange={(e) => setEditForm({...editForm, whatsapp_group: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600 }}>Instagram Handle</label>
                  <input type="text" placeholder="@your.community" value={editForm.instagram_handle} onChange={(e) => setEditForm({...editForm, instagram_handle: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem' }} />
                </div>
              </>
            )}

            {/* Event Forms */}
            {(modalType === 'event' || modalType === 'edit-event') && renderEventForm()}

            {/* Members Modal */}
            {modalType === 'members' && (
              <div style={{ color: 'var(--white)' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{memberList.length} Members</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {memberList.map(membership => {
                    const memberUser = users.find(u => u.id === membership.userId);
                    if (!memberUser) return null;
                    return (
                      <div key={memberUser.id} className="stagger-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            onClick={() => setSelectedProfileImage({
                              imageUrl: memberUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberUser.name)}&background=0D8B93&color=fff`,
                              name: memberUser.name,
                              subtitle: `${membership.role || 'Member'} • ${community?.name || ''}`
                            })} 
                            src={memberUser.avatar} 
                            alt={memberUser.name} 
                            title="Click to view full photo"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} 
                          />
                          <div>
                            <div onClick={() => { router.push(`/profile/${memberUser.id}`); setModalType(null); }} style={{ fontWeight: 600, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              {memberUser.name}
                              {membership.role === 'Leader' && <span style={{ fontSize: '0.7rem', background: 'var(--teal-500)', padding: '2px 6px', borderRadius: '4px' }}>Leader</span>}
                              {membership.role === 'Co-Leader' && <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.3)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>Co-Leader</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Joined {memberUser.joinedDate || memberUser.joined}</div>
                          </div>
                        </div>
                        {membership.role !== 'Leader' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {membership.role === 'Co-Leader' ? (
                              <button onClick={() => handleDemote(memberUser)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Demote</button>
                            ) : (
                              <button onClick={() => handlePromote(memberUser)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Promote</button>
                            )}
                            <button onClick={() => handleRemove(memberUser)} className="btn btn-danger interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Remove</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Co-Leader Promotion  -  FIXED */}
            {modalType === 'coleader' && (
              <div style={{ color: 'var(--white)' }}>
                <p style={{ color: 'var(--slate-400)', marginBottom: '12px' }}>Search for a member to promote to Co-Leader.</p>
                <input 
                  placeholder="Search members by name..." 
                  value={coLeaderSearch}
                  onChange={e => setCoLeaderSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {memberList
                    .filter(m => m.role !== 'Leader' && m.role !== 'Co-Leader')
                    .filter(m => {
                      const u = users.find(usr => usr.id === m.userId);
                      return coLeaderSearch ? u?.name?.toLowerCase().includes(coLeaderSearch.toLowerCase()) : true;
                    })
                    .map(membership => {
                      const memberUser = users.find(u => u.id === membership.userId);
                      if (!memberUser) return null;
                      return (
                        <div key={memberUser.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img onClick={() => { router.push(`/profile/${memberUser.id}`); setModalType(null); }} src={memberUser.avatar} alt={memberUser.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
                            <span onClick={() => { router.push(`/profile/${memberUser.id}`); setModalType(null); }} style={{ fontWeight: 500, cursor: 'pointer' }}>{memberUser.name}</span>
                          </div>
                          <button onClick={() => { handlePromote(memberUser); setModalType(null); setCoLeaderSearch(''); }} className="btn btn-primary interactive-press" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}>
                            <Crown size={12} style={{ marginRight: '4px' }} /> Promote
                          </button>
                        </div>
                      );
                    })}
                  {memberList.filter(m => m.role !== 'Leader' && m.role !== 'Co-Leader').length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)' }}>No eligible members to promote.</div>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp Settings */}
            {modalType === 'pitches-review' && (
              <div style={{ color: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '14px' }}>
                  <Sparkles size={22} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--white)', marginBottom: '4px' }}>
                      Collaborations & Guest Sessions Hub
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                      Review incoming pitches from verified instructors, local guides, community members, and sponsoring businesses. You have full veto control: only approved sessions or perks are published to your group.
                    </div>
                  </div>
                </div>

                {/* Member Proposed Walks */}
                {pendingProposedEvents.length > 0 && (
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.06)', border: '1.5px solid rgba(56, 189, 248, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={16} /> Member Walk Proposals ({pendingProposedEvents.length})
                    </div>
                    {pendingProposedEvents.map(pe => (
                      <div key={pe.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.92rem' }}>{pe.title.replace('[Proposal]', '').trim()}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px' }}>📅 {pe.date} at {pe.time || '10:00'} • 📍 {pe.location}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={async () => {
                                await updateEvent(pe.id, { status: 'published', title: pe.title.replace('[Proposal]', '').trim() });
                                toast.success('Event Published! 🎉', 'The proposed walk is now live on your calendar.');
                              }}
                              className="btn btn-primary interactive-press"
                              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', background: 'var(--teal-500)' }}
                            >
                              Approve & Publish ✓
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await cancelEvent(pe.id);
                                toast.info('Proposal Declined', 'The proposed walk has been dismissed.');
                              }}
                              className="btn btn-outline interactive-press"
                              style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '8px', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                        {pe.description && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--slate-300)', lineHeight: 1.4, background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>
                            {pe.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Partner & Specialist Pitches */}
                {communityPitches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--white)' }}>
                      Guest Workshop & Sponsor Pitches ({communityPitches.length})
                    </div>
                    {communityPitches.map(p => (
                      <div key={p.id} style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.95rem' }}>{p.title || p.businessName || 'Specialist Session'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--teal-300)', marginTop: '2px' }}>
                              Type: {p.type || p.discipline || 'Workshop'} {p.fee ? `• Offer: £${p.fee}` : ''}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                              By: {p.authorName || p.contactName || 'Local Specialist'} ({p.contactEmail || p.email || 'Partner'})
                            </div>
                          </div>
                          {p.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  updateServiceStatus(p.id, 'approved');
                                  toast.success('Pitch Approved! 🎉', 'Partner collaboration accepted.');
                                }}
                                className="btn btn-primary interactive-press"
                                style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', background: 'var(--teal-500)' }}
                              >
                                Approve Pitch ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateServiceStatus(p.id, 'rejected');
                                  toast.info('Pitch Declined', 'Pitch has been dismissed.');
                                }}
                                className="btn btn-outline interactive-press"
                                style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '8px', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: p.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: p.status === 'approved' ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                              {p.status === 'approved' ? 'Approved' : 'Declined'}
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: 1.45, background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '8px' }}>
                            {p.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  pendingProposedEvents.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-400)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                      No incoming pitches right now. When instructors, businesses, or members pitch sessions via your community page, they will appear here for 1-tap review.
                    </div>
                  )
                )}

                <div style={{ padding: '12px 14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', fontSize: '0.8rem', color: '#fef08a', lineHeight: 1.45 }}>
                  💡 <strong>100% Leader Revenue Control:</strong> Any sponsorship or workshop fee you negotiate with local businesses or guides goes 100% to you and your community club fund.
                </div>
              </div>
            )}

            {modalType === 'chapter-info' && (
              <div style={{ color: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 20px', maxHeight: '75vh', overflowY: 'auto' }}>
                
                {/* Pending Applications Section */}
                {pendingChapterApplications.length > 0 && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1.5px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>⏳</span>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fca5a5' }}>
                          Chapter Applications Awaiting Your Approval ({pendingChapterApplications.length})
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>
                        Action Required
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {pendingChapterApplications.map(app => {
                        const applicantLeader = users.find(u => u.id === app.leader_id);
                        return (
                          <div key={app.id} style={{
                            padding: '12px 14px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.92rem' }}>
                                  {app.name}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#7dd3fc', marginTop: '2px' }}>
                                  📍 Proposed Town: {app.location_name || 'Local Town'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                                  Applicant: {applicantLeader?.name || 'Local Organizer'} ({applicantLeader?.email || 'Leader'})
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (typeof approveChapter === 'function') {
                                      await approveChapter(app.id);
                                      toast.success('Chapter Approved! 🎉', `"${app.name}" is now active in the network.`);
                                    }
                                  }}
                                  className="btn btn-primary interactive-press"
                                  style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', background: 'var(--teal-500)' }}
                                >
                                  Approve Chapter ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (typeof declineChapter === 'function') {
                                      await declineChapter(app.id);
                                      toast.info('Application Declined', `"${app.name}" will not be listed.`);
                                    }
                                  }}
                                  className="btn btn-outline interactive-press"
                                  style={{ padding: '6px 10px', fontSize: '0.78rem', borderRadius: '8px', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                            {app.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-300)', lineHeight: 1.4, background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                                &quot;{app.description.slice(0, 160)}...&quot;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 1: Overview & What Appears on Your Page */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px' }}>
                  <Globe size={22} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--white)', marginBottom: '4px' }}>
                      1. What is shown on your public page?
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                      When enabled, a <strong>&quot;Multi-Town Chapter Network&quot;</strong> section appears under the About tab of your community page ({community?.name}). It displays your active sister chapters and includes a <em>&quot;Launch a Chapter in Your Town&quot;</em> button.
                    </div>
                  </div>
                </div>

                {/* Section 2: How Approvals & Control Work */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '14px' }}>
                  <CheckCircle2 size={22} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--white)', marginBottom: '4px' }}>
                      2. How the Approval Gate Works (Full Founding Leader Control)
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                      When a local organizer clicks <em>Launch a Chapter</em>, their chapter is created in a <strong>&quot;Pending Approval&quot;</strong> state. It does <strong>not</strong> show on your public network until you review and approve it above. You hold complete veto power and can turn chapter applications on or off anytime using the slider.
                    </div>
                  </div>
                </div>

                {/* Section 3: How Payments & Revenue Splits Work */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '14px' }}>
                  <CreditCard size={22} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--white)', marginBottom: '4px' }}>
                      3. How Payments & Revenue Splits Work (Transparent UK Bank Payouts)
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                      Ticket revenue and membership fees for each town are processed through Stripe Faster Payments:
                      <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                        <li><strong>90% to Local Chapter Leader:</strong> Direct into their registered UK bank account within 24-48 hours.</li>
                        <li><strong>5% Founding Network Royalty:</strong> Allocated to the founding parent group for brand guidance, route templates, and collective insurance.</li>
                        <li><strong>5% Platform Fee (or 2% with Leader Pro):</strong> Covers card processing fees, VAT invoices, and attendee check-in systems.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Section 4: Franchise Benefits & Growth Clout */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--white)', marginBottom: '8px' }}>
                    🏛️ Why scale your community with multi-town chapters?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--teal-300)', marginBottom: '2px' }}>
                        1. Scale your brand & mission without extra legwork
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: 1.45 }}>
                        Passionate leaders in nearby towns (e.g. Sevenoaks, Tonbridge, Maidstone) can launch a chapter of your community using your proven walk format, branding, and guidance.
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--teal-300)', marginBottom: '2px' }}>
                        2. Higher sponsorship & commercial clout
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: 1.45 }}>
                        Regional outdoor brands, councils, and local businesses pay significantly more to sponsor a 5 to 10 chapter network than a single isolated local group.
                      </div>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--teal-300)', marginBottom: '2px' }}>
                        3. Standardized safety & quality control
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-300)', lineHeight: 1.45 }}>
                        New chapters follow your verified route templates, risk assessments, and co-leader wellbeing ratios, protecting your group reputation.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Chapters Roster */}
                {activeSisterChapters.length > 0 && (
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--white)', marginBottom: '8px' }}>
                      Active Network Chapters ({activeSisterChapters.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {activeSisterChapters.map(sc => (
                        <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--slate-200)' }}>{sc.name} ({sc.location_name || 'Town'})</span>
                          <span style={{ color: 'var(--teal-400)', fontSize: '0.74rem' }}>{sc.members || 1} members • Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ padding: '12px 14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', fontSize: '0.8rem', color: '#fef08a', lineHeight: 1.45 }}>
                  💡 <strong>Want to keep it purely local?</strong> Turn the toggle off anytime in Settings. The chapter network banner and application button will disappear immediately from your public community page.
                </div>
              </div>
            )}

            {modalType === 'whatsapp' && (
              <div style={{ color: 'var(--white)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}>
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--white)' }}>
                      WhatsApp & Community Chat Bridge
                    </h4>
                    <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
                      Bridge your community with WhatsApp so members can stay connected in your group chat and receive automated meetup alerts.
                    </p>
                  </div>
                </div>

                {/* Section 1: Official Group Invite Link */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '0.92rem', fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>
                    WhatsApp Group Invite Link
                  </label>
                  <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                    Members can tap this link directly from your community microsite and event pages to join your WhatsApp chat.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      placeholder="https://chat.whatsapp.com/..."
                      value={waConfig.groupLink || ''}
                      onChange={e => setWaConfig(prev => ({ ...prev, groupLink: e.target.value }))}
                      style={{ flex: 1, padding: '12px 14px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '10px', color: 'var(--white)', fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}
                    />
                    {waConfig.groupLink?.trim() && (
                      <a
                        href={waConfig.groupLink.startsWith('http') ? waConfig.groupLink : `https://${waConfig.groupLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline interactive-press"
                        style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', textDecoration: 'none', color: '#25D366', borderColor: 'rgba(37,211,102,0.4)' }}
                      >
                        <ExternalLink size={14} /> Test
                      </a>
                    )}
                  </div>
                </div>

                {/* Section 2: Automated WhatsApp Reminders & CRM Sync */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.92rem', fontWeight: 600, color: 'var(--white)' }}>
                      Automated Meetup Reminders (WhatsApp Cloud API)
                    </div>
                    <button
                      type="button"
                      onClick={() => setWaConfig(prev => ({ ...prev, businessConnected: !prev.businessConnected }))}
                      style={{
                        background: waConfig.businessConnected ? 'var(--teal-500)' : 'var(--slate-700)',
                        border: 'none', borderRadius: '16px', width: '44px', height: '24px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ position: 'absolute', top: '2px', left: waConfig.businessConnected ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }}></div>
                    </button>
                  </div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
                    When enabled, More Community automatically sends registered attendees a polite WhatsApp reminder 24 hours and 2 hours before every scheduled meetup.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Sticky Docked Footer */}
          {(modalType === 'event' || modalType === 'edit-event') ? (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0f172a', position: 'sticky', bottom: 0, zIndex: 20, paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                {eventStep > 0 && (
                  <button onClick={() => setEventStep(eventStep - 1)} className="btn btn-outline interactive-press" style={{ padding: '14px', flex: 1, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    ← Back
                  </button>
                )}
                {eventStep < 3 ? (
                  <button 
                    onClick={() => setEventStep(eventStep + 1)} 
                    disabled={!canAdvanceStep()}
                    className="btn btn-primary interactive-press" 
                    style={{ padding: '14px', flex: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: canAdvanceStep() ? 1 : 0.4 }}
                  >
                    Next: {eventSteps[eventStep + 1].label} →
                  </button>
                ) : (
                  <button 
                    onClick={() => { if (editingEventId) handleSaveEvent(); else handleCreateEvent(); }}
                    disabled={isUploading || !canAdvanceStep()}
                    className="btn btn-primary interactive-press" 
                    style={{ padding: '14px', flex: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, var(--teal-500), #3b82f6)', opacity: isUploading ? 0.7 : 1 }}
                  >
                    <Check size={18} /> {isUploading ? 'Publishing...' : editingEventId ? 'Save Changes' : (eventForm.resolvedDates && eventForm.resolvedDates.length > 1 ? `Publish ${eventForm.resolvedDates.length} Events` : 'Publish Event')}
                  </button>
                )}
              </div>
            </div>
          ) : (isEditing || (modalType && modalType !== 'community' && modalType !== 'coleader')) ? (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0f172a', position: 'sticky', bottom: 0, zIndex: 20, paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}>
              <button 
                onClick={() => { 
                  if(isEditing) handleSave(); 
                  else if (modalType === 'whatsapp') {
                    let link = (waConfig.groupLink || '').trim();
                    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
                      link = `https://${link}`;
                    }
                    const updatedConfig = { ...waConfig, groupLink: link };
                    setWhatsappSettings(prev => ({...prev, [community.id]: updatedConfig}));
                    updateCommunity(community.id, { whatsapp_group: link });
                    toast.success('WhatsApp Settings Saved', 'Your community chat integration has been updated.');
                    setModalType(null);
                  }
                  else { toast.success('Done!', 'Action completed'); setModalType(null); }
                }} 
                disabled={isUploading}
                className="btn btn-primary interactive-press" 
                style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', borderRadius: '12px', opacity: isUploading ? 0.7 : 1 }}>
                <Check size={20} /> 
                {isUploading ? 'Uploading...' : isEditing ? 'Save Changes' : modalType === 'whatsapp' ? 'Save Settings' : modalType === 'chapter-info' ? 'Close Window' : 'Confirm'}
              </button>
            </div>
          ) : null}
          </div> {/* closes inner modal card */}
        </div>
      )}

      {/* Heavy-Safeguard Community Deletion Modal */}
      {isDeleteModalOpen && community && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.4)', background: 'linear-gradient(180deg, #1e1014 0%, #0f172a 100%)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--white)', fontWeight: 700 }}>Delete Community</h3>
                  <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strict Safeguard Mode</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); setDeleteConfirmChecked(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Warning Body */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <strong style={{ color: '#ef4444', display: 'block', marginBottom: '6px' }}>⚠️ Warning: This action cannot be reversed!</strong>
                Deleting <strong>{community.name}</strong> will permanently erase:
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li>All {memberList.length} member connections and roles</li>
                  <li>All past & upcoming events, RSVPs, and ticket records</li>
                  <li>All community feed posts, comments, and chat channels</li>
                  <li>The community public microsite and branding</li>
                </ul>
              </div>

              {/* Step 1: Type exact name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-200)', marginBottom: '8px' }}>
                  1. To confirm, type <span style={{ color: '#ef4444', userSelect: 'all', background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px' }}>{community.name}</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={`Type "${community.name}"`}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--slate-900)',
                    border: deleteConfirmText === community.name ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: '0.95rem'
                  }}
                  autoFocus
                />
              </div>

              {/* Step 2: Confirmation Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={deleteConfirmChecked}
                  onChange={e => setDeleteConfirmChecked(e.target.checked)}
                  style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#ef4444' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
                  I understand that this action is permanent, and that all data and members for <strong>{community.name}</strong> will be permanently destroyed.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); setDeleteConfirmChecked(false); }}
                className="btn btn-outline interactive-press"
                style={{ flex: 1, padding: '12px', borderRadius: '10px', color: 'var(--slate-300)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCommunity}
                disabled={isDeletingCommunity || deleteConfirmText !== community.name || !deleteConfirmChecked}
                className="btn interactive-press"
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  background: (deleteConfirmText === community.name && deleteConfirmChecked) ? '#ef4444' : 'rgba(239,68,68,0.2)',
                  color: 'var(--white)',
                  fontWeight: 700,
                  border: 'none',
                  cursor: (deleteConfirmText === community.name && deleteConfirmChecked && !isDeletingCommunity) ? 'pointer' : 'not-allowed',
                  opacity: (deleteConfirmText === community.name && deleteConfirmChecked && !isDeletingCommunity) ? 1 : 0.45,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={16} />
                {isDeletingCommunity ? 'Deleting Community...' : 'Permanently Delete'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Event Flyer Generator Modal */}
      {flyerEvent && (
        <EventFlyerGenerator
          event={flyerEvent}
          community={community}
          onClose={() => setFlyerEvent(null)}
          uploadImage={uploadImage}
        />
      )}

      {/* Event Reminder Broadcast Modal */}
      {reminderModalEvent && (
        <EventReminderModal
          event={reminderModalEvent}
          eventRsvps={eventRsvps}
          onClose={() => setReminderModalEvent(null)}
          sendEventReminder={sendEventReminder}
          toast={toast}
        />
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner 
          onScan={(data) => {
            if (data.eventId && data.userId) {
              checkInMember(data.eventId, data.userId);
              toast.success('Checked in!', `${data.userName} has been checked in.`);
            }
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Network Event Preview Modal */}
      {selectedNetworkEvent && (
        <NetworkEventPreviewModal
          event={selectedNetworkEvent}
          sourceCommunity={communities.find(c => c.id === selectedNetworkEvent.communityId)}
          onClose={() => setSelectedNetworkEvent(null)}
          onCoHost={handleCoHostNetworkEvent}
          isCoHosting={isCoHostingNetworkEvent}
        />
      )}

      {/* Profile Image Modal */}
      {selectedProfileImage && (
        <ProfileImageModal
          isOpen={Boolean(selectedProfileImage)}
          imageUrl={selectedProfileImage.imageUrl}
          name={selectedProfileImage.name}
          subtitle={selectedProfileImage.subtitle}
          onClose={() => setSelectedProfileImage(null)}
        />
      )}

      {/* Discovery Modal */}
      {isDiscoveryModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsDiscoveryModalOpen(false)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 99999, 
            background: 'rgba(2, 6, 23, 0.85)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="modal-content"
            style={{ 
              background: '#0f172a', 
              border: '1px solid rgba(255,255,255,0.14)', 
              borderRadius: '20px', 
              maxWidth: '740px', 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)' 
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe color="#2dd4bf" size={20} /> Third-Party Discovery
              </h2>
              <button 
                onClick={() => setIsDiscoveryModalOpen(false)} 
                className="interactive-press" 
                style={{ 
                  background: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: '#94a3b8', 
                  cursor: 'pointer', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div style={{ padding: '20px 22px', flex: 1, overflowY: 'auto' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Search for premium experiences from our partners to offer your community members.
              </p>
              
              {/* Responsive Search Controls - Fits width-ways cleanly on all screens */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                <select 
                  value={discoveryProvider} 
                  onChange={e => setDiscoveryProvider(e.target.value)}
                  style={{ flex: '1 1 140px', minWidth: '130px', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '0.9rem' }}
                >
                  <option value="viator">Viator Partner</option>
                  <option value="google">Google Places</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search destination (e.g. Tunbridge Wells)" 
                  value={discoverySearchTerm} 
                  onChange={e => setDiscoverySearchTerm(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSimulateApiSearch()}
                  style={{ flex: '2 1 200px', minWidth: '180px', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '12px', fontSize: '0.9rem' }} 
                />
                <button 
                  onClick={handleSimulateApiSearch}
                  disabled={isDiscovering || !discoverySearchTerm.trim()}
                  className="btn btn-primary interactive-press" 
                  style={{ flex: '1 1 110px', minWidth: '100px', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (isDiscovering || !discoverySearchTerm.trim()) ? 0.7 : 1 }}
                >
                  {isDiscovering ? <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span> : <Search size={16} />}
                  Search
                </button>
              </div>

              {isDiscovering && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#2dd4bf', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                  Querying {discoveryProvider === 'viator' ? 'Viator Partner API' : 'Google Places API'}...
                </div>
              )}

              {!isDiscovering && discoveryResults && (
                <div>
                  <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Results ({discoveryResults.length})</h3>
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {discoveryResults.map(exp => (
                      <div key={exp.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', alignItems: 'center' }}>
                        <img src={exp.image} alt={exp.title} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                          <div style={{ fontSize: '0.72rem', color: '#2dd4bf', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.category} • {exp.source}</div>
                          <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '0.95rem', lineHeight: 1.3 }}>{exp.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{exp.description}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
                            <span>{exp.duration}</span>
                            <span>⭐ {exp.rating}</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>£{exp.basePrice} base</span>
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, width: '100%', maxWidth: '160px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleImportExperience(exp)} className="btn btn-outline interactive-press" style={{ width: '100%', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            Import
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SpecialistVaultModal
        isOpen={specialistModalState.isOpen}
        onClose={() => setSpecialistModalState({ ...specialistModalState, isOpen: false })}
        specialist={specialistModalState.specialist}
        mode={specialistModalState.mode}
        onProposalSubmitted={() => {
          toast.success('Your specialist pitch has been dispatched to local leaders!');
        }}
      />

      <PayoutBankModal
        isOpen={showPayoutBankModal}
        onClose={() => setShowPayoutBankModal(false)}
        community={community}
        onBankSaved={(bankData) => {
          setStripeConnected(true);
          if (community?.id) {
            updateCommunity(community.id, {
              stripe_account_id: `acct_payout_${Date.now()}`,
              payout_bank: bankData
            });
            try {
              localStorage.setItem(`more_stripe_connected_${community.id}`, 'true');
            } catch (e) {}
          }
        }}
      />

      <LeaderShieldModal
        isOpen={showShieldModal}
        onClose={() => setShowShieldModal(false)}
        community={community}
        leaderUser={user}
        onUpgradeSuccess={(updates) => {
          if (community?.id) {
            updateCommunity(community.id, updates);
          }
        }}
      />

      

      {/* MARKUP MODAL FIXED VIEWPORT */}
      {markupInfoExp && (
                <div 
                  onClick={() => setMarkupInfoExp(null)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    background: 'rgba(2, 6, 23, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                  }}
                >
                  <div 
                    onClick={e => e.stopPropagation()}
                    style={{
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '20px',
                      maxWidth: '560px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      position: 'relative'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--teal-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Transparent Financial Breakdown
                        </span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '4px 0 0', fontFamily: 'var(--font-heading)' }}>
                          How Your Markup Works
                        </h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', margin: '4px 0 0' }}>
                          {markupInfoExp.title}
                        </p>
                      </div>
                      <button 
                        onClick={() => setMarkupInfoExp(null)}
                        className="interactive-press"
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* 3-Pillar Breakdown with More 10% Wholesale Split */}
                    {(() => {
                      const basePrice = markupInfoExp.basePrice || 40;
                      const supplierBase = markupInfoExp.supplierBase || Math.round(basePrice / 1.10);
                      const moreMargin = markupInfoExp.moreMargin || (basePrice - supplierBase);
                      const markupPct = markupInfoExp.leaderMarkup ?? 15;
                      const leaderProfit = Math.round((basePrice * markupPct) / 100);
                      const memberFinalPrice = basePrice + leaderProfit;

                      return (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* 1. Supplier Base */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>1. Supplier Wholesale Rate</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>£{supplierBase}.00</div>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--slate-300)', margin: 0, lineHeight: 1.45 }}>
                                Goes 100% directly to the licensed experience operator or venue (Viator partner, Hotel du Vin, or local provider). Covers certified facilities, hosts, and equipment.
                              </p>
                            </div>

                            {/* 2. More Platform Margin (10%) */}
                            <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc' }}>2. More Platform Margin (10%)</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#c084fc' }}>+£{moreMargin}.00</div>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--slate-300)', margin: 0, lineHeight: 1.45 }}>
                                More adds a 10% platform wholesale markup to the raw supplier rate before displaying it. This covers marketplace curation, booking escrow, API connectivity, and payment processing fees.
                              </p>
                            </div>

                            {/* 3. Leader Markup */}
                            <div style={{ background: 'rgba(20, 184, 166, 0.08)', border: '1px solid rgba(20, 184, 166, 0.25)', borderRadius: '12px', padding: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2dd4bf' }}>3. Your Community Leader Cut (+{markupPct}%)</div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                                  +£{leaderProfit}.00
                                </div>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--slate-300)', margin: 0, lineHeight: 1.45 }}>
                                100% of your added markup goes straight into your Community Club Fund. More does not deduct anything from your leader cut. Payouts transfer to your bank via Stripe Faster Payments.
                              </p>
                            </div>
                          </div>

                          {/* Live Example Calculation */}
                          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>
                              Stripe Payment Breakdown (Member Pays £{memberFinalPrice}.00)
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-300)' }}>
                                <span>Supplier Receives:</span>
                                <span>£{supplierBase}.00</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc' }}>
                                <span>More Platform Gross Profit (10%):</span>
                                <span>+£{moreMargin}.00</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                                <span>Your Community Fund (+{markupPct}%):</span>
                                <span style={{ fontWeight: 700 }}>+£{leaderProfit}.00</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                                <span>Member Ticket Price:</span>
                                <span>£{memberFinalPrice}.00</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Close Button */}
                    <button
                      onClick={() => setMarkupInfoExp(null)}
                      className="btn btn-primary interactive-press"
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </div>
              )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
