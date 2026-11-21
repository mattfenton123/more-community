"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalIcon,
  Mic,
  Lightbulb,
  MapPin,
  Search,
  X,
  Check,
  Users,
  Sparkles,
  ChevronRight,
  Archive,
  Filter,
  RotateCcw,
  Clock,
  Layers,
} from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { SkeletonList, SkeletonEvent } from '../../src/components/SkeletonCard';
import { useToast } from '../../src/components/Toast';
import DigitalTicket from '../../src/components/DigitalTicket';
import AppHeader from '../../src/components/AppHeader';
import SwipeDiscovery from '../../src/components/SwipeDiscovery';
import {
  isEventUpcoming,
  isEventPast,
  isEventToday,
  parseEventDateTime,
} from '../../src/lib/calendar';
import { cleanLocationName, getCommunityLocation } from '../../src/lib/location';
import { getEventPath } from '../../src/lib/eventLinks';
import { isCommunityPubliclyListed } from '../../src/lib/communityVisibility';

function stripEmojiAndNormalize(str) {
  return String(str || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function formatCalendarLeaf(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    return {
      month: dt.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
      day: String(dt.getDate()),
    };
  }
  const iso = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      month: months[parseInt(iso[2], 10) - 1] || 'TBA',
      day: String(parseInt(iso[3], 10)),
    };
  }
  return { month: 'TBA', day: '•' };
}

function formatReadableDate(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    return dt.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
  return dateStr || 'Date TBC';
}

const CATEGORY_KEYWORDS = {
  Walking: ['walk', 'walking', 'hik', 'trail', 'ramble', 'stroll', 'dog'],
  Running: ['run', 'jog', 'track', 'marathon', '5k'],
  Wellness: ['well', 'wellbeing', 'wellness', 'mindful', 'meditat', 'breath', 'yoga', 'pilates', 'mental health', 'calm'],
  Adventure: ['adventure', 'hik', 'climb', 'camp', 'wild swim', 'outdoor', 'nature'],
  Creative: ['creative', 'art', 'craft', 'photo', 'music', 'book', 'theatre', 'write', 'dance'],
  Social: ['social', 'coffee', 'pub', 'chat', 'dinner', 'brunch', 'talking', 'peer'],
};

export default function EventsHub() {
  const router = useRouter();
  const {
    events,
    communities,
    user,
    eventRsvps,
    createEvent,
    isLoading,
    saveItem,
    getAffinityScore,
    sponsors,
    sponsorshipAssignments,
    theme,
  } = useAppContext();
  const { toast } = useToast();

  const isLight = theme === 'light';
  const isLeader = (user?.ledCommunities?.length || 0) > 0;
  const isAdmin = Boolean(user?.isAdmin);

  const [activeTab, setActiveTab] = useState('All Upcoming');
  const [showTicket, setShowTicket] = useState(null);
  const [showSwipe, setShowSwipe] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'this_week' | 'this_weekend' | 'YYYY-MM-DD'
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'free' | 'paid'
  const [timeOfDayFilter, setTimeOfDayFilter] = useState('all'); // 'all' | 'morning' | 'afternoon' | 'evening'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // AI Matchmaker (collapsible drawer so events sit right above the fold)
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [isListeningAi, setIsListeningAi] = useState(false);
  const [aiMatches, setAiMatches] = useState(null);

  // Propose Event Modal
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeCommunityId, setProposeCommunityId] = useState('');
  const [proposeTitle, setProposeTitle] = useState('');
  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState('10:00');
  const [proposeLocation, setProposeLocation] = useState('');
  const [proposeNotes, setProposeNotes] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const dateInputRef = useRef(null);

  useEffect(() => {
    if (!user?.id && (activeTab === 'My Schedule' || activeTab === 'Recommended')) {
      setActiveTab('All Upcoming');
    }
  }, [user?.id, activeTab]);

  // Publicly listed communities for filtering & dropdowns
  const publicCommunities = useMemo(
    () =>
      (communities || []).filter(
        (c) =>
          isCommunityPubliclyListed(c) &&
          (c.id !== 'more-leaders-network' || isAdmin || isLeader)
      ),
    [communities, isAdmin, isLeader]
  );

  const publicCommunityIds = useMemo(
    () => new Set(publicCommunities.map((c) => c.id)),
    [publicCommunities]
  );

  const getUpcomingDayDate = (targetDay) => {
    const now = new Date();
    const current = now.getDay();
    let diff = (targetDay - current + 7) % 7;
    if (diff === 0) diff = 7;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const quickSatDate = getUpcomingDayDate(6);
  const quickSunDate = getUpcomingDayDate(0);
  const nextSatDate = (() => {
    const d = parseEventDateTime(quickSatDate) || new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const nextSunDate = (() => {
    const d = parseEventDateTime(quickSunDate) || new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const openProposeModal = () => {
    if (!user?.id) {
      router.push('/login?redirect=/events');
      return;
    }
    if (!proposeCommunityId) {
      const joinedPublic = publicCommunities.find((c) => user.joinedCommunities?.includes(c.id));
      setProposeCommunityId(joinedPublic?.id || publicCommunities[0]?.id || '');
    }
    setShowProposeModal(true);
  };

  const handleProposeWalk = async (e) => {
    e?.preventDefault();
    if (!user?.id) {
      router.push('/login?redirect=/events');
      return;
    }
    if (!proposeTitle.trim() || !proposeDate) {
      toast.error('Missing Details', 'Please provide an event title and preferred date.');
      return;
    }

    const targetCommunityId = proposeCommunityId || publicCommunities[0]?.id;
    if (!targetCommunityId) {
      toast.error('Community Required', 'Please select which community this event is for.');
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const desc = `${proposeNotes.trim() ? proposeNotes.trim() + '\n\n' : ''}Proposed by community member ${user.name || 'Member'}`;
      await createEvent(targetCommunityId, {
        title: `[Proposal] ${proposeTitle.trim()}`,
        description: desc,
        date: proposeDate,
        time: proposeTime || '10:00',
        location: proposeLocation.trim() || 'Local Area',
        status: 'proposed',
      });
      toast.success(
        'Event Idea Proposed!',
        'Your community leader has received your idea and can publish it with 1 click.'
      );
      setShowProposeModal(false);
      setProposeTitle('');
      setProposeNotes('');
      setProposeLocation('');
    } catch (err) {
      console.error(err);
      toast.error('Could not submit', 'Please try again later.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Base set of real, non-cancelled, non-proposed events from publicly listed communities
  const validPublicEvents = useMemo(() => {
    return (events || []).filter((e) => {
      if (e.status === 'cancelled' || e.status === 'proposed') return false;
      if (e.communityId && !publicCommunityIds.has(e.communityId)) return false;
      return true;
    });
  }, [events, publicCommunityIds]);

  // AI Event Matchmaker
  const handleAiSearch = async (overridePrompt) => {
    const queryToUse = (typeof overridePrompt === 'string' ? overridePrompt : aiPrompt).trim();
    if (!queryToUse) return;

    setIsSearchingAi(true);
    try {
      const upcoming = validPublicEvents.filter((e) => isEventUpcoming(e));
      const res = await fetch('/api/ai/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'match-events',
          prompt: queryToUse,
          events: upcoming,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.recommendations) {
        setAiMatches(data);
        setShowAiDrawer(true);
        toast.success(
          'AI Matches Ready!',
          `Found ${data.recommendations.length} event${data.recommendations.length === 1 ? '' : 's'} tailored to your vibe.`
        );
      } else {
        toast.info('No Matches Found', data?.reason || 'Try searching with different terms.');
      }
    } catch (err) {
      console.error('AI match error:', err);
      toast.error('Search Failed', 'Could not run AI concierge match.');
    } finally {
      setIsSearchingAi(false);
    }
  };

  const toggleAiSpeech = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info('Voice Not Supported', 'Your browser does not support Web Speech.');
      return;
    }

    if (isListeningAi) {
      setIsListeningAi(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-GB';

      recognition.onstart = () => setIsListeningAi(true);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setAiPrompt(transcript);
          handleAiSearch(transcript);
        }
      };
      recognition.onerror = () => setIsListeningAi(false);
      recognition.onend = () => setIsListeningAi(false);
      recognition.start();
    } catch {
      setIsListeningAi(false);
    }
  };

  // Multi-attribute filters
  const applyAllFilters = (list) => {
    let result = list;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const community = (communities || []).find((c) => c.id === e.communityId);
        return (
          e.title?.toLowerCase().includes(q) ||
          cleanLocationName(e.location).toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          community?.name?.toLowerCase().includes(q)
        );
      });
    }

    if (dateFilter !== 'all') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
        result = result.filter((e) => {
          if (e.date === dateFilter) return true;
          const dt = parseEventDateTime(e.date);
          if (!dt) return false;
          const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          return iso === dateFilter;
        });
      } else {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        result = result.filter((e) => {
          if (dateFilter === 'today') return isEventToday(e);
          const dt = parseEventDateTime(e.date);
          if (!dt) return false;
          const eventDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

          if (dateFilter === 'this_week') {
            const endOfWeek = new Date(startOfToday);
            endOfWeek.setDate(startOfToday.getDate() + 7);
            return eventDay >= startOfToday && eventDay <= endOfWeek;
          }

          if (dateFilter === 'this_weekend') {
            // Upcoming Saturday & Sunday window (if today is Sun, include today; if Sat, include Sat & Sun; otherwise next Sat & Sun)
            const todayDow = startOfToday.getDay(); // 0=Sun..6=Sat
            const daysUntilSat = todayDow === 6 ? 0 : todayDow === 0 ? -1 : 6 - todayDow;
            const satStart = new Date(startOfToday);
            satStart.setDate(startOfToday.getDate() + daysUntilSat);
            const sunEnd = new Date(satStart);
            sunEnd.setDate(satStart.getDate() + 1);
            return eventDay >= startOfToday && eventDay >= satStart && eventDay <= sunEnd;
          }

          return true;
        });
      }
    }

    if (priceFilter === 'free') {
      result = result.filter((e) => !e.ticketPrice || Number(e.ticketPrice) === 0);
    } else if (priceFilter === 'paid') {
      result = result.filter((e) => Number(e.ticketPrice) > 0);
    }

    if (timeOfDayFilter !== 'all') {
      result = result.filter((e) => {
        const dt = parseEventDateTime(e.date, e.time);
        if (!dt) return true;
        const hours = dt.getHours();
        if (timeOfDayFilter === 'morning') return hours < 12;
        if (timeOfDayFilter === 'afternoon') return hours >= 12 && hours < 17;
        if (timeOfDayFilter === 'evening') return hours >= 17;
        return true;
      });
    }

    if (categoryFilter !== 'all') {
      const keywords = CATEGORY_KEYWORDS[categoryFilter] || [categoryFilter.toLowerCase()];
      result = result.filter((e) => {
        const comm = (communities || []).find((c) => c.id === e.communityId);
        const searchable = [
          ...(comm?.tags || []).map(stripEmojiAndNormalize),
          stripEmojiAndNormalize(comm?.category),
          (e.title || '').toLowerCase(),
          (e.description || '').toLowerCase(),
        ].join(' ');
        return keywords.some((kw) => searchable.includes(kw));
      });
    }

    return result;
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    dateFilter !== 'all' ||
    priceFilter !== 'all' ||
    timeOfDayFilter !== 'all' ||
    categoryFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setPriceFilter('all');
    setTimeOfDayFilter('all');
    setCategoryFilter('all');
  };

  const myRsvpEventIds = useMemo(
    () =>
      Object.keys(eventRsvps || {}).filter((eventId) =>
        eventRsvps[eventId]?.some((r) => r.userId === user?.id)
      ),
    [eventRsvps, user?.id]
  );

  // My Schedule: events the user RSVPed to OR hosted by communities they joined (non-cancelled, non-proposed)
  const myScheduleEvents = useMemo(() => {
    const raw = (events || []).filter((e) => {
      if (e.status === 'cancelled' || e.status === 'proposed') return false;
      const inRsvp = myRsvpEventIds.includes(e.id);
      const inJoined = user?.joinedCommunities?.includes(e.communityId);
      const inCollab = e.collabCommunityIds?.some((id) => user?.joinedCommunities?.includes(id));
      return inRsvp || inJoined || inCollab;
    });
    return applyAllFilters(raw);
  }, [events, myRsvpEventIds, user?.joinedCommunities, searchQuery, dateFilter, priceFilter, timeOfDayFilter, categoryFilter, communities]);

  const upcomingUserEvents = useMemo(
    () =>
      myScheduleEvents
        .filter((e) => isEventUpcoming(e))
        .sort(
          (a, b) =>
            (parseEventDateTime(a.date, a.time)?.getTime() || 0) -
            (parseEventDateTime(b.date, b.time)?.getTime() || 0)
        ),
    [myScheduleEvents]
  );

  const pastUserEvents = useMemo(
    () =>
      myScheduleEvents
        .filter((e) => isEventPast(e))
        .sort(
          (a, b) =>
            (parseEventDateTime(b.date, b.time)?.getTime() || 0) -
            (parseEventDateTime(a.date, a.time)?.getTime() || 0)
        ),
    [myScheduleEvents]
  );

  // All Upcoming: ALL public events (never empty just because a user joined their local communities)
  const filteredPublicEvents = useMemo(
    () => applyAllFilters(validPublicEvents),
    [validPublicEvents, searchQuery, dateFilter, priceFilter, timeOfDayFilter, categoryFilter, communities]
  );

  const upcomingAllEvents = useMemo(
    () =>
      filteredPublicEvents
        .filter((e) => isEventUpcoming(e))
        .sort(
          (a, b) =>
            (parseEventDateTime(a.date, a.time)?.getTime() || 0) -
            (parseEventDateTime(b.date, b.time)?.getTime() || 0)
        ),
    [filteredPublicEvents]
  );

  const pastAllEvents = useMemo(
    () =>
      filteredPublicEvents
        .filter((e) => isEventPast(e))
        .sort(
          (a, b) =>
            (parseEventDateTime(b.date, b.time)?.getTime() || 0) -
            (parseEventDateTime(a.date, a.time)?.getTime() || 0)
        ),
    [filteredPublicEvents]
  );

  // Recommended: score ALL public upcoming events (emoji-normalized interest match + location + affinity + un-RSVPed bonus)
  // Always falls back cleanly to soonest upcoming public events so Recommended is never blank!
  const recommendedEvents = useMemo(() => {
    if (upcomingAllEvents.length === 0) return [];
    const userInterests = (user?.interests || []).map(stripEmojiAndNormalize).filter(Boolean);
    const userTown = (user?.location || '').toLowerCase().split(',')[0]?.trim() || '';

    const scored = upcomingAllEvents.map((e) => {
      const comm = (communities || []).find((c) => c.id === e.communityId);
      let score = 0;

      // Prefer events the user hasn't already RSVPed to
      const alreadyGoing = myRsvpEventIds.includes(e.id);
      if (!alreadyGoing) score += 2;

      // Interest match (emoji-stripped, substring-tolerant)
      const searchable = [
        ...(comm?.tags || []).map(stripEmojiAndNormalize),
        (e.title || '').toLowerCase(),
        (e.description || '').toLowerCase(),
      ].join(' ');
      userInterests.forEach((interest) => {
        if (searchable.includes(interest)) score += 3;
      });

      // Affinity score from AppContext
      if (comm && typeof getAffinityScore === 'function') {
        score += getAffinityScore(comm) || 0;
      }

      // Location proximity match
      if (userTown) {
        const loc = `${cleanLocationName(e.location)} ${getCommunityLocation(comm || {})}`.toLowerCase();
        if (loc.includes(userTown)) score += 3;
      }

      // Bonus for groups the user hasn't joined yet (discovery)
      if (comm && !user?.joinedCommunities?.includes(comm.id)) {
        score += 1;
      }

      return { event: e, score };
    });

    return scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (
          (parseEventDateTime(a.event.date, a.event.time)?.getTime() || 0) -
          (parseEventDateTime(b.event.date, b.event.time)?.getTime() || 0)
        );
      })
      .map((item) => item.event);
  }, [upcomingAllEvents, user, communities, myRsvpEventIds, getAffinityScore]);

  const isCustomDateActive = !['all', 'today', 'this_week', 'this_weekend'].includes(dateFilter);

  const renderEventCard = (event, isPast = false) => {
    const community = (communities || []).find((c) => c.id === event.communityId);
    const eventImage = event.image || community?.image || community?.cover_image;
    const price = event.ticketPrice && Number(event.ticketPrice) > 0 ? Number(event.ticketPrice) : 0;
    const rsvpList = eventRsvps?.[event.id] || [];
    const hasRsvp = Boolean(user && rsvpList.some((r) => r.userId === user.id));
    const isArchived = isPast || isEventPast(event);
    const leaf = formatCalendarLeaf(event.date, event.time);
    const displayDate = formatReadableDate(event.date, event.time);
    const displayLoc = cleanLocationName(event.location) || getCommunityLocation(community || {}) || 'Local Venue';

    const sponsorAssignment = (sponsorshipAssignments || []).find(
      (a) => a.target_id === event.communityId && a.target_type === 'community'
    );
    const sponsor = sponsorAssignment
      ? (sponsors || []).find((s) => s.id === sponsorAssignment.sponsor_id)
      : null;

    return (
      <article
        key={event.id}
        onClick={() => router.push(getEventPath(event, events))}
        className="interactive-press stagger-item"
        style={{
          cursor: 'pointer',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline-border)',
          opacity: isArchived ? 0.84 : 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {eventImage && (
          <div
            style={{
              height: '164px',
              background: `var(--surface-elevated) url(${eventImage}) center/cover no-repeat`,
              position: 'relative',
              filter: isArchived ? 'saturate(0.75)' : 'none',
            }}
          >
            {/* Calendar Leaf */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(20, 18, 15, 0.88)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '44px',
              }}
            >
              <div
                style={{
                  background: isArchived ? '#52525B' : 'var(--brand-accent)',
                  color: '#FFFFFF',
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '2px 4px',
                  letterSpacing: '0.05em',
                }}
              >
                {leaf.month}
              </div>
              <div
                style={{
                  padding: '3px 8px 4px',
                  color: '#FFFFFF',
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {leaf.day}
              </div>
            </div>

            {/* Top-right Price / Archived Pills */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
              }}
            >
              {isArchived && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: 'rgba(28, 25, 21, 0.86)',
                    backdropFilter: 'blur(6px)',
                    padding: '4px 9px',
                    borderRadius: '99px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    letterSpacing: '0.03em',
                  }}
                >
                  ARCHIVED
                </span>
              )}
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: price > 0 ? '#B45309' : 'rgba(20, 18, 15, 0.82)',
                  backdropFilter: 'blur(6px)',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                }}
              >
                {price > 0 ? `£${price}` : 'FREE'}
              </span>
            </div>

            {hasRsvp && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: isArchived ? 'rgba(28, 25, 21, 0.86)' : 'var(--brand-accent)',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                }}
              >
                <Check size={12} strokeWidth={2.75} /> {isArchived ? 'Attended' : 'Going'}
              </div>
            )}
          </div>
        )}

        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: isArchived ? 'var(--ink-muted)' : 'var(--teal-300)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {community?.name || 'Community Event'}
              </span>
              {event.collabCommunityIds?.length > 0 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: isLight ? 'rgba(29, 78, 216, 0.10)' : 'rgba(96, 165, 250, 0.16)',
                    color: isLight ? '#1D4ED8' : '#93C5FD',
                    border: isLight
                      ? '1px solid rgba(29, 78, 216, 0.24)'
                      : '1px solid rgba(147, 197, 253, 0.28)',
                    padding: '2px 7px',
                    borderRadius: '99px',
                    fontWeight: 700,
                  }}
                >
                  Co-Host
                </span>
              )}
            </div>

            {sponsor && (
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--ink-muted)',
                  background: 'var(--surface-elevated)',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  border: '1px solid var(--hairline-border)',
                  fontWeight: 600,
                }}
              >
                Supported by {sponsor.name}
              </span>
            )}
          </div>

          <h3
            style={{
              margin: '0 0 10px 0',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.08rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              lineHeight: 1.25,
            }}
          >
            {event.title}
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary)',
              marginTop: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <CalIcon size={13} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
              <span>{displayDate}</span>
              {event.time && (
                <>
                  <span style={{ color: 'var(--ink-muted)' }}>•</span>
                  <Clock size={13} color="var(--ink-muted)" style={{ flexShrink: 0 }} />
                  <span>{event.time}</span>
                </>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                color: 'var(--ink-muted)',
                fontSize: '0.78rem',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                <MapPin size={13} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayLoc}</span>
              </span>

              {rsvpList.length > 0 && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    fontWeight: 600,
                    color: 'var(--ink-secondary)',
                  }}
                >
                  <Users size={12} color="var(--brand-accent)" /> {rsvpList.length} going
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      className="view-events"
      style={{
        paddingBottom: '96px',
        background: 'var(--surface-canvas)',
        minHeight: '100dvh',
      }}
    >
      <AppHeader title="Events" />

      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '18px 20px 0',
          boxSizing: 'border-box',
        }}
      >
        {/* Guest Banner */}
        {!user?.id && (
          <div
            style={{
              marginBottom: '18px',
              padding: '14px 18px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--ink-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CalIcon size={16} color="var(--brand-accent)" /> Upcoming Events &amp; Meetups
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                Free to browse. Select any event to view meeting points, schedules, and carpool offers.
              </div>
            </div>
            <button
              onClick={() => router.push('/login?redirect=/events')}
              className="btn btn-primary interactive-press"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              Sign In / Join
            </button>
          </div>
        )}

        {/* Editorial Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 3.5vw, 1.95rem)',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Events &amp; Meetups
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
              Walks, workshops, and real-life gatherings happening near you.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={openProposeModal}
              className="interactive-press"
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border-strong)',
                borderRadius: '999px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                color: 'var(--ink-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              <Lightbulb size={14} color="var(--brand-accent)" /> Propose an Event
            </button>

            <button
              onClick={() => setShowSwipe(true)}
              className="btn btn-primary interactive-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              <Layers size={14} /> Swipe Events
            </button>
          </div>
        </div>

        {/* Search Bar + Ask AI Toggle */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              flex: '1 1 260px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--ink-muted)',
            }}
          >
            <Search size={17} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search events, locations, or communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                minWidth: 0,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAiDrawer((prev) => !prev)}
            className="interactive-press"
            style={{
              padding: '10px 15px',
              borderRadius: '12px',
              background: showAiDrawer || aiMatches ? 'var(--brand-accent-soft)' : 'var(--surface-card)',
              border: showAiDrawer || aiMatches
                ? '1px solid var(--brand-accent)'
                : '1px solid var(--hairline-border-strong)',
              color: showAiDrawer || aiMatches ? 'var(--teal-300)' : 'var(--ink-primary)',
              fontSize: '0.84rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles size={15} color="var(--brand-accent)" />
            <span>Ask AI Concierge</span>
          </button>
        </div>

        {/* Collapsible AI Concierge Matchmaker */}
        {showAiDrawer && (
          <div
            style={{
              marginBottom: '14px',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '16px',
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--teal-300)',
                }}
              >
                <Sparkles size={14} color="var(--brand-accent)" />
                <span>Ask More AI: Match Your Vibe</span>
              </div>
              {aiMatches && (
                <button
                  onClick={() => {
                    setAiMatches(null);
                    setAiPrompt('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-muted)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Clear ×
                </button>
              )}
            </div>

            <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. 'Saturday morning dog walk', 'Gentle breathwork session'..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAiSearch();
                }}
                style={{
                  flex: 1,
                  padding: '10px 40px 10px 12px',
                  borderRadius: '10px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-primary)',
                  fontSize: '0.86rem',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={toggleAiSpeech}
                title={isListeningAi ? 'Stop listening' : 'Speak your search'}
                aria-label="Voice search"
                style={{
                  position: 'absolute',
                  right: '70px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: isListeningAi ? 'rgba(220, 38, 38, 0.18)' : 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isListeningAi ? '#DC2626' : 'var(--ink-muted)',
                  cursor: 'pointer',
                }}
              >
                <Mic size={15} />
              </button>

              <button
                onClick={() => handleAiSearch()}
                disabled={isSearchingAi || !aiPrompt.trim()}
                className="btn btn-primary interactive-press"
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: isSearchingAi ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  opacity: !aiPrompt.trim() ? 0.6 : 1,
                }}
              >
                {isSearchingAi ? <Sparkles size={14} /> : 'Find'}
              </button>
            </div>

            {/* Quick Prompt Suggestions */}
            <div
              className="hide-scrollbar"
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                marginTop: '10px',
              }}
            >
              {[
                'Dog-friendly walks',
                'Coffee & stroll',
                'Saturday morning',
                'Gentle & beginner',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setAiPrompt(chip);
                    handleAiSearch(chip);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '99px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border)',
                    color: 'var(--ink-secondary)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* AI Concierge Results */}
            {aiMatches && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border-strong)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--teal-300)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} /> {aiMatches.summary || 'Top matches for you:'}
                  </div>
                  <button
                    onClick={() => {
                      setAiMatches(null);
                      setAiPrompt('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Dismiss ×
                  </button>
                </div>
                {Array.isArray(aiMatches.recommendations) && aiMatches.recommendations.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {aiMatches.recommendations.map((rec) => {
                      const matchedEvt = validPublicEvents.find((e) => e.id === rec.eventId);
                      if (!matchedEvt) return null;
                      return (
                        <div
                          key={rec.eventId}
                          onClick={() => router.push(getEventPath(matchedEvt, events))}
                          className="interactive-press"
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--hairline-border)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: 'var(--font-heading)',
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  color: 'var(--ink-primary)',
                                }}
                              >
                                {matchedEvt.title}
                              </span>
                              {rec.highlightTag && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    background: 'var(--brand-accent-soft)',
                                    color: 'var(--teal-300)',
                                    fontWeight: 700,
                                  }}
                                >
                                  {rec.highlightTag}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: '0.76rem',
                                color: 'var(--ink-secondary)',
                                marginTop: '2px',
                              }}
                            >
                              {rec.matchReason}
                            </div>
                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--ink-muted)',
                                marginTop: '3px',
                              }}
                            >
                              {formatReadableDate(matchedEvt.date, matchedEvt.time)}
                              {matchedEvt.time ? ` • ${matchedEvt.time}` : ''} •{' '}
                              {cleanLocationName(matchedEvt.location)}
                            </div>
                          </div>
                          <ChevronRight size={16} color="var(--ink-muted)" style={{ flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multi-Attribute Filter Pills + Working Date Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div
            className="hide-scrollbar"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              alignItems: 'center',
              paddingBottom: '2px',
            }}
          >
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_weekend', label: 'This Weekend' },
            ].map((filter) => {
              const active = dateFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setDateFilter(filter.id)}
                  className="interactive-press"
                  style={{
                    padding: '6px 13px',
                    borderRadius: '999px',
                    border: active
                      ? '1px solid var(--ink-primary)'
                      : '1px solid var(--hairline-border-strong)',
                    background: active ? 'var(--ink-primary)' : 'var(--surface-card)',
                    color: active ? 'var(--surface-canvas)' : 'var(--ink-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {filter.label}
                </button>
              );
            })}

            {/* Clickable Custom Date Picker Pill (works on Desktop Chrome/Safari/Firefox + iOS/Android) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <div
                  aria-hidden="true"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: isCustomDateActive
                      ? '1px solid var(--brand-accent)'
                      : '1px solid var(--hairline-border-strong)',
                    background: isCustomDateActive
                      ? 'var(--brand-accent-soft)'
                      : 'var(--surface-card)',
                    color: isCustomDateActive ? 'var(--teal-300)' : 'var(--ink-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: isCustomDateActive ? 700 : 600,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    pointerEvents: 'none',
                  }}
                >
                  <CalIcon size={13} color={isCustomDateActive ? 'var(--teal-300)' : 'var(--brand-accent)'} />
                  <span>{isCustomDateActive ? formatReadableDate(dateFilter) : 'Pick Date'}</span>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  aria-label="Filter by specific date"
                  value={isCustomDateActive ? dateFilter : ''}
                  onChange={(e) => setDateFilter(e.target.value || 'all')}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                    colorScheme: isLight ? 'light' : 'dark',
                  }}
                />
              </div>
              {isCustomDateActive && (
                <button
                  type="button"
                  aria-label="Clear selected date"
                  onClick={() => setDateFilter('all')}
                  className="interactive-press"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: '1px solid var(--brand-accent)',
                    background: 'var(--brand-accent-soft)',
                    color: 'var(--teal-300)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Free / Paid Pills (Theme-Aware High Contrast) */}
            <button
              onClick={() => setPriceFilter(priceFilter === 'free' ? 'all' : 'free')}
              className="interactive-press"
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                border:
                  priceFilter === 'free'
                    ? isLight
                      ? '1px solid #15803D'
                      : '1px solid #4ADE80'
                    : '1px solid var(--hairline-border-strong)',
                background:
                  priceFilter === 'free'
                    ? isLight
                      ? 'rgba(21, 128, 61, 0.12)'
                      : 'rgba(58, 142, 118, 0.22)'
                    : 'var(--surface-card)',
                color:
                  priceFilter === 'free'
                    ? isLight
                      ? '#15803D'
                      : '#4ADE80'
                    : 'var(--ink-secondary)',
                fontSize: '0.8rem',
                fontWeight: priceFilter === 'free' ? 700 : 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              Free
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === 'paid' ? 'all' : 'paid')}
              className="interactive-press"
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                border:
                  priceFilter === 'paid'
                    ? isLight
                      ? '1px solid #B45309'
                      : '1px solid #FBBF24'
                    : '1px solid var(--hairline-border-strong)',
                background:
                  priceFilter === 'paid'
                    ? isLight
                      ? 'rgba(180, 83, 9, 0.12)'
                      : 'rgba(245, 158, 11, 0.18)'
                    : 'var(--surface-card)',
                color:
                  priceFilter === 'paid'
                    ? isLight
                      ? '#B45309'
                      : '#FBBF24'
                    : 'var(--ink-secondary)',
                fontSize: '0.8rem',
                fontWeight: priceFilter === 'paid' ? 700 : 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              Paid
            </button>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="interactive-press"
              style={{
                padding: '6px 13px',
                borderRadius: '999px',
                border:
                  showAdvancedFilters || timeOfDayFilter !== 'all' || categoryFilter !== 'all'
                    ? '1px solid var(--brand-accent)'
                    : '1px solid var(--hairline-border-strong)',
                background:
                  showAdvancedFilters || timeOfDayFilter !== 'all' || categoryFilter !== 'all'
                    ? 'var(--brand-accent-soft)'
                    : 'var(--surface-card)',
                color:
                  showAdvancedFilters || timeOfDayFilter !== 'all' || categoryFilter !== 'all'
                    ? 'var(--teal-300)'
                    : 'var(--ink-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              <Filter size={13} />
              Filters {timeOfDayFilter !== 'all' || categoryFilter !== 'all' ? '•' : ''}
            </button>

            {/* Reset Pill */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="interactive-press"
                style={{
                  padding: '6px 11px',
                  borderRadius: '999px',
                  border: isLight
                    ? '1px solid rgba(185, 28, 28, 0.35)'
                    : '1px solid rgba(248, 113, 113, 0.35)',
                  background: isLight
                    ? 'rgba(185, 28, 28, 0.08)'
                    : 'rgba(248, 113, 113, 0.14)',
                  color: isLight ? '#B91C1C' : '#FCA5A5',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {/* Expandable Time of Day & Category Chips */}
          {showAdvancedFilters && (
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border-strong)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div
                className="hide-scrollbar"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Time:
                </span>
                {[
                  { id: 'all', label: 'Any Time' },
                  { id: 'morning', label: 'Morning (<12pm)' },
                  { id: 'afternoon', label: 'Afternoon (12–5pm)' },
                  { id: 'evening', label: 'Evening (5pm+)' },
                ].map((tod) => {
                  const active = timeOfDayFilter === tod.id;
                  return (
                    <button
                      key={tod.id}
                      onClick={() => setTimeOfDayFilter(tod.id)}
                      style={{
                        padding: '5px 11px',
                        borderRadius: '999px',
                        border: active
                          ? '1px solid var(--brand-accent)'
                          : '1px solid var(--hairline-border)',
                        background: active ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                        color: active ? 'var(--teal-300)' : 'var(--ink-secondary)',
                        fontSize: '0.76rem',
                        fontWeight: active ? 700 : 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      {tod.label}
                    </button>
                  );
                })}
              </div>

              <div
                className="hide-scrollbar"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  Category:
                </span>
                {['all', 'Walking', 'Running', 'Wellness', 'Adventure', 'Creative', 'Social'].map(
                  (cat) => {
                    const active = categoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '999px',
                          border: active
                            ? '1px solid var(--brand-accent)'
                            : '1px solid var(--hairline-border)',
                          background: active
                            ? 'var(--brand-accent-soft)'
                            : 'var(--surface-elevated)',
                          color: active ? 'var(--teal-300)' : 'var(--ink-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: active ? 700 : 600,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* Standard Segmented Tab Control */}
        <div style={{ marginBottom: '20px' }}>
          <div className="segmented-control">
            {(user?.id
              ? [
                  { id: 'All Upcoming', label: `All Upcoming (${upcomingAllEvents.length})` },
                  { id: 'My Schedule', label: `My Schedule (${upcomingUserEvents.length})` },
                  { id: 'Recommended', label: 'Recommended' },
                ]
              : [{ id: 'All Upcoming', label: `All Upcoming (${upcomingAllEvents.length})` }]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'active' : ''}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= TAB CONTENT ================= */}
        {activeTab === 'My Schedule' ? (
          <>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                marginBottom: '12px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Your Upcoming Meetups • Soonest First
            </div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : upcomingUserEvents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '18px',
                }}
              >
                {upcomingUserEvents.map((e) => renderEventCard(e, false))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  background: 'var(--surface-card)',
                  borderRadius: '18px',
                  border: '1px dashed var(--hairline-border-strong)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--brand-accent-soft)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: 'var(--brand-accent)',
                  }}
                >
                  <CalIcon size={28} />
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.2rem',
                    margin: '0 0 8px 0',
                    color: 'var(--ink-primary)',
                  }}
                >
                  No Upcoming Events in Your Schedule
                </h3>
                <p
                  style={{
                    color: 'var(--ink-secondary)',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    maxWidth: '340px',
                    margin: '0 auto 20px',
                  }}
                >
                  Browse all upcoming community meetups and RSVP to fill up your calendar.
                </p>
                <button
                  onClick={() => setActiveTab('All Upcoming')}
                  className="btn btn-primary interactive-press"
                  style={{
                    color: '#FFFFFF',
                    padding: '10px 22px',
                    borderRadius: '999px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                  }}
                >
                  Browse All Upcoming
                </button>
              </div>
            )}

            {pastUserEvents.length > 0 && (
              <div
                style={{
                  marginTop: '36px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--hairline-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--ink-muted)',
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Archive size={14} /> Past Events ({pastUserEvents.length})
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                    gap: '18px',
                  }}
                >
                  {pastUserEvents.map((e) => renderEventCard(e, true))}
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'Recommended' ? (
          <>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                marginBottom: '12px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Picked for You • Interests, Area &amp; Upcoming
            </div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : recommendedEvents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '18px',
                }}
              >
                {recommendedEvents.map((e) => renderEventCard(e, false))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '44px 20px',
                  background: 'var(--surface-card)',
                  borderRadius: '18px',
                  border: '1px dashed var(--hairline-border-strong)',
                  color: 'var(--ink-secondary)',
                }}
              >
                {hasActiveFilters
                  ? 'No recommended events match your active filters.'
                  : 'No upcoming community events are scheduled right now.'}
                {hasActiveFilters && (
                  <div style={{ marginTop: '14px' }}>
                    <button
                      onClick={resetAllFilters}
                      className="btn btn-primary interactive-press"
                      style={{
                        padding: '9px 18px',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--ink-muted)',
                marginBottom: '12px',
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Upcoming Community Meetups • Soonest First
            </div>

            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : upcomingAllEvents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: '18px',
                }}
              >
                {upcomingAllEvents.map((e) => renderEventCard(e, false))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '44px 20px',
                  background: 'var(--surface-card)',
                  borderRadius: '18px',
                  border: '1px dashed var(--hairline-border-strong)',
                  color: 'var(--ink-secondary)',
                }}
              >
                <div style={{ fontSize: '0.94rem', marginBottom: hasActiveFilters ? '14px' : 0 }}>
                  {hasActiveFilters
                    ? 'No upcoming events match your active filters.'
                    : 'No upcoming events scheduled right now.'}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="btn btn-primary interactive-press"
                    style={{
                      padding: '9px 18px',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {pastAllEvents.length > 0 && (
              <div
                style={{
                  marginTop: '36px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--hairline-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--ink-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Archive size={14} /> Past Community Events ({pastAllEvents.length})
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                    gap: '18px',
                  }}
                >
                  {pastAllEvents.map((e) => renderEventCard(e, true))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= PROPOSE EVENT MODAL ================= */}
      {showProposeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(18, 18, 18, 0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '90dvh',
              overflowY: 'auto',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '22px',
              padding: '22px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                  }}
                >
                  <Lightbulb size={18} color="var(--brand-accent)" /> Propose a Community Event
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '3px' }}>
                  Suggest a route or meetup — leaders can approve and publish it in 1 click.
                </div>
              </div>
              <button
                onClick={() => setShowProposeModal(false)}
                aria-label="Close modal"
                className="interactive-press"
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--hairline-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-primary)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleProposeWalk} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--ink-secondary)',
                    marginBottom: '5px',
                  }}
                >
                  Community *
                </label>
                <select
                  value={proposeCommunityId}
                  onChange={(e) => setProposeCommunityId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    colorScheme: isLight ? 'light' : 'dark',
                  }}
                >
                  {publicCommunities.map((c) => {
                    const isMember = user?.joinedCommunities?.includes(c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {isMember ? '(Your Community)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--ink-secondary)',
                    marginBottom: '5px',
                  }}
                >
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunday Morning Woodland Loop"
                  value={proposeTitle}
                  onChange={(e) => setProposeTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px',
                  }}
                >
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)' }}>
                    Preferred Date *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--teal-300)', fontWeight: 600 }}>
                    Quick pick
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'This Sat', date: quickSatDate },
                    { label: 'This Sun', date: quickSunDate },
                    { label: 'Next Sat', date: nextSatDate },
                    { label: 'Next Sun', date: nextSunDate },
                  ].map((item) => {
                    const selected = proposeDate === item.date;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setProposeDate(item.date)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          background: selected ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                          border: selected
                            ? '1px solid var(--brand-accent)'
                            : '1px solid var(--hairline-border)',
                          color: selected ? 'var(--teal-300)' : 'var(--ink-secondary)',
                          cursor: 'pointer',
                          fontWeight: selected ? 700 : 600,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="date"
                  value={proposeDate}
                  onChange={(e) => setProposeDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  required
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    colorScheme: isLight ? 'light' : 'dark',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--ink-secondary)',
                    marginBottom: '5px',
                  }}
                >
                  Preferred Time
                </label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: '9:30 AM', time: '09:30' },
                    { label: '10:00 AM', time: '10:00' },
                    { label: '11:00 AM', time: '11:00' },
                    { label: '2:00 PM', time: '14:00' },
                    { label: '6:00 PM', time: '18:00' },
                  ].map((item) => {
                    const selected = proposeTime === item.time;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setProposeTime(item.time)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          background: selected ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                          border: selected
                            ? '1px solid var(--brand-accent)'
                            : '1px solid var(--hairline-border)',
                          color: selected ? 'var(--teal-300)' : 'var(--ink-secondary)',
                          cursor: 'pointer',
                          fontWeight: selected ? 700 : 600,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="time"
                  value={proposeTime}
                  onChange={(e) => setProposeTime(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    colorScheme: isLight ? 'light' : 'dark',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--ink-secondary)',
                    marginBottom: '5px',
                  }}
                >
                  Meeting Landmark / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dunorlan Park Cafe, Pembury Rd"
                  value={proposeLocation}
                  onChange={(e) => setProposeLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--ink-secondary)',
                    marginBottom: '5px',
                  }}
                >
                  Vibe &amp; Notes (Distance, Dogs, Pace)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Casual 4km loop, dogs very welcome, coffee afterwards!"
                  value={proposeNotes}
                  onChange={(e) => setProposeNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProposal}
                className="btn btn-primary interactive-press"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  marginTop: '4px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: isSubmittingProposal ? 'wait' : 'pointer',
                }}
              >
                {isSubmittingProposal ? 'Submitting Idea...' : 'Submit Event Idea'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Digital Ticket Modal */}
      {showTicket && (
        <DigitalTicket
          event={showTicket}
          community={(communities || []).find((c) => c.id === showTicket.communityId)}
          user={user}
          onClose={() => setShowTicket(null)}
        />
      )}

      {/* Swipe Events Modal */}
      {showSwipe && (
        <SwipeDiscovery
          events={upcomingAllEvents}
          communities={publicCommunities}
          onClose={() => setShowSwipe(false)}
          onSave={(item) => {
            saveItem(item.id);
            toast.success('Saved!', 'Added to your Saved list on Discover.');
          }}
        />
      )}
    </div>
  );
}
