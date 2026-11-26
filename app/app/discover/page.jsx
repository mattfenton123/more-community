"use client";
import React, { useState, useMemo } from 'react';
import {
  Users,
  MapPin,
  Search,
  Calendar,
  ChevronRight,
  X,
  List,
  Map as MapIcon,
  Sparkles,
  BadgeCheck,
  Heart,
  Plus,
  Compass,
} from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { FALLBACK_IMAGES, LAUNCH_LOCATION_DISPLAY } from '../../src/lib/constants';
import { SkeletonList, SkeletonCard } from '../../src/components/SkeletonCard';
import { useToast } from '../../src/components/Toast';
import dynamic from 'next/dynamic';
import AppHeader from '../../src/components/AppHeader';
import TownAlertCard from '../../src/components/TownAlertCard';
import SwipeDiscovery from '../../src/components/SwipeDiscovery';
import { isEventUpcoming, parseEventDateTime } from '../../src/lib/calendar';
import {
  getCommunityLocation,
  getCommunitySearchText,
  getLocationSearchRank,
  stripUkPostcode,
} from '../../src/lib/location';
import { getCommunitySlug } from '../../src/lib/communityLinks';
import { isCommunityPubliclyListed } from '../../src/lib/communityVisibility';
import { getEventPath } from '../../src/lib/eventLinks';

const MapView = dynamic(() => import('../../src/components/MapView'), { ssr: false });

const CATEGORY_PILLS = [
  { id: 'All', label: 'All' },
  { id: 'For You', label: 'For You' },
  { id: 'Saved', label: 'Saved', icon: 'heart' },
  { id: 'Nearby', label: 'Nearby', icon: 'pin' },
  { id: 'Walking', label: 'Walking', keywords: ['walk', 'walking', 'hik', 'trail', 'ramble', 'stroll'] },
  { id: 'Dog Walking', label: 'Dog Walking', keywords: ['dog', 'pup', 'golden'] },
  { id: 'Running', label: 'Running', keywords: ['run', 'jog', 'track', 'marathon', '5k'] },
  {
    id: 'Wellness',
    label: 'Wellness',
    keywords: [
      'well',
      'wellbeing',
      'wellness',
      'mindful',
      'meditat',
      'breath',
      'yoga',
      'pilates',
      'mental health',
      'peer support',
      'talking group',
      'chill',
      'calm',
    ],
  },
  { id: 'Adventure', label: 'Adventure', keywords: ['adventure', 'hik', 'climb', 'camp', 'wild swim', 'outdoor', 'nature', 'ecology'] },
  { id: 'Volunteering', label: 'Volunteering', keywords: ['volunteer', 'charity', 'community support', 'ambassador', 'cic'] },
  { id: 'Creative', label: 'Creative', keywords: ['creative', 'art', 'craft', 'photo', 'music', 'book', 'theatre', 'write', 'pottery', 'dance'] },
  { id: 'Business', label: 'Business', keywords: ['business', 'network', 'startup', 'founder', 'career', 'finance', 'leader'] },
];

const EXCLUDED_TOWN_PATTERNS = [
  'bewl',
  'various',
  'my local area',
  'local area',
  'global',
  'online',
  'tbc',
  'check events',
  'multiple',
];

const COUNTY_OR_COUNTRY_SUFFIXES = new Set([
  'uk',
  'united kingdom',
  'england',
  'east sussex',
  'west sussex',
  'sussex',
  'kent',
  'surrey',
]);

function normalizeTownLabel(raw) {
  const cleaned = stripUkPostcode(
    String(raw || '')
      .replace(/\s*&\s*other locations.*$/i, '')
      .replace(/\s*\(.*?\)\s*/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  if (/^st\.?\s+leonards[\s-]+on[\s-]+sea$/i.test(cleaned)) {
    return 'St Leonards-on-Sea';
  }
  return cleaned;
}

function extractTownFromCommunity(comm) {
  const loc = getCommunityLocation(comm);
  if (!loc) return '';
  const lowerFull = loc.toLowerCase();
  if (EXCLUDED_TOWN_PATTERNS.some((pat) => lowerFull.includes(pat))) return '';

  const parts = loc
    .split(',')
    .map((p) => normalizeTownLabel(p))
    .filter(Boolean);

  // Drop trailing county/country segments (e.g. "East Sussex", "Kent", "UK")
  while (parts.length > 1 && COUNTY_OR_COUNTRY_SUFFIXES.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }

  const candidate = parts[parts.length - 1] || '';
  if (!candidate) return '';
  const candLower = candidate.toLowerCase();
  if (
    EXCLUDED_TOWN_PATTERNS.some((pat) => candLower.includes(pat)) ||
    COUNTY_OR_COUNTRY_SUFFIXES.has(candLower) ||
    candidate.length > 32
  ) {
    return '';
  }
  return candidate;
}

function stripEmojiAndNormalize(str) {
  return String(str || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function formatEventDateShort(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return dateStr || 'Upcoming';
}

export default function Discover() {
  const [activePill, setActivePill] = useState('All');
  const [selectedTown, setSelectedTown] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [sortBy, setSortBy] = useState('trending');

  const {
    communities,
    user,
    users,
    communityMemberships,
    joinCommunity,
    isLoading,
    events,
    theme,
    saveItem,
    savedItems,
    unsaveItem,
    sponsors,
    sponsorshipAssignments,
  } = useAppContext();
  const { messages } = useChat();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLight = theme === 'light';
  const isLeader = (user?.ledCommunities?.length || 0) > 0;
  const isAdmin = Boolean(user?.isAdmin);

  // Publicly listed communities enriched with member, event & activity stats
  const enrichedCommunities = useMemo(() => {
    return (communities || [])
      .filter(
        (c) =>
          isCommunityPubliclyListed(c) &&
          (c.id !== 'more-leaders-network' || isAdmin || isLeader)
      )
      .map((c) => {
        const fromMap = (communityMemberships?.[c.id] || []).length;
        const members =
          fromMap > 0
            ? fromMap
            : typeof c.members === 'number' && c.members > 0
              ? c.members
              : typeof c.memberCount === 'number' && c.memberCount > 0
                ? c.memberCount
                : 1;
        const cEvents = (events || []).filter(
          (e) => e.communityId === c.id && e.status !== 'cancelled'
        ).length;
        const upcomingEvents = (events || []).filter(
          (e) => e.communityId === c.id && e.status !== 'cancelled' && isEventUpcoming(e)
        ).length;
        const cMessages = (messages || []).filter((m) => m.communityId === c.id).length;
        const activityScore = members * 2 + cEvents * 10 + cMessages;
        const activityLevel = activityScore >= 30 ? 'active' : activityScore >= 10 ? 'growing' : 'new';
        const town = extractTownFromCommunity(c);
        return {
          ...c,
          memberCount: members,
          cEvents,
          upcomingEvents,
          activityScore,
          activityLevel,
          extractedTown: town,
        };
      });
  }, [communities, communityMemberships, events, messages, isAdmin, isLeader]);

  // Publicly listed upcoming events (never leak pending/declined chapter events into Map or Swipe)
  const publicCommunityIdSet = useMemo(
    () => new Set(enrichedCommunities.map((c) => c.id)),
    [enrichedCommunities]
  );

  const publicEvents = useMemo(
    () =>
      (events || []).filter(
        (e) => e.status !== 'cancelled' && (!e.communityId || publicCommunityIdSet.has(e.communityId))
      ),
    [events, publicCommunityIdSet]
  );

  // Dynamic Town Filter Pills derived from live public communities (never hardcoded, never Bewl Water)
  const availableTowns = useMemo(() => {
    const counts = new Map();
    const displayNames = new Map();
    enrichedCommunities.forEach((c) => {
      if (!c.extractedTown) return;
      const key = c.extractedTown.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!displayNames.has(key)) displayNames.set(key, c.extractedTown);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || displayNames.get(a[0]).localeCompare(displayNames.get(b[0])))
      .map(([key]) => displayNames.get(key));
  }, [enrichedCommunities]);

  const calculateDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return 50;
    const l1 = loc1.toLowerCase().trim();
    const l2 = loc2.toLowerCase().trim();
    if (!l1 || !l2) return 50;
    if (l1 === l2) return 0;
    if (l1.includes(l2) || l2.includes(l1)) return 5;
    if (l1.split(',')[0]?.trim() === l2.split(',')[0]?.trim()) return 8;
    return 20;
  };

  // Recommendation Engine (operates on enrichedCommunities so stats & activity badges stay intact)
  const recommendedCommunities = useMemo(() => {
    if (!user) return enrichedCommunities;

    const userInterests = (user.interests || []).map(stripEmojiAndNormalize).filter(Boolean);
    const similarUsers = (users || []).filter(
      (u) =>
        u.id !== user.id &&
        (u.interests || []).some((interest) =>
          userInterests.includes(stripEmojiAndNormalize(interest))
        )
    );

    const scored = enrichedCommunities.map((c) => {
      let score = 0;

      const commTags = (c.tags || []).map(stripEmojiAndNormalize);
      const matchesInterest = commTags.some((t) =>
        userInterests.some((ui) => t.includes(ui) || ui.includes(t))
      );
      if (matchesInterest) score += 3;

      const membershipsForCommunity = communityMemberships?.[c.id] || [];
      const similarUsersJoined = membershipsForCommunity.filter((m) =>
        similarUsers.some((su) => su.id === m.userId)
      ).length;
      score += similarUsersJoined;

      const dist = calculateDistance(user.location, getCommunityLocation(c));
      if (dist < 10) score += 4;

      if (user.bio) {
        const firstWord = user.bio.toLowerCase().trim().split(/\s+/)[0];
        if (firstWord && firstWord.length > 3 && c.description?.toLowerCase().includes(firstWord)) {
          score += 1;
        }
      }

      return { ...c, score };
    });

    const positive = scored.filter((c) => c.score > 0).sort((a, b) => b.score - a.score);
    return positive.length > 0 ? positive : [...enrichedCommunities].sort((a, b) => b.activityScore - a.activityScore);
  }, [enrichedCommunities, user, users, communityMemberships]);

  const filteredCommunities = useMemo(() => {
    let list;
    if (activePill === 'For You') {
      list = [...recommendedCommunities];
    } else if (activePill === 'Nearby') {
      const userLoc = (user?.location || '').toLowerCase().trim();
      const userTown = userLoc.split(',')[0]?.trim();
      if (!userTown) {
        list = [...enrichedCommunities];
      } else {
        list = enrichedCommunities.filter((c) => {
          const commLoc = getCommunityLocation(c).toLowerCase();
          const commTown = (c.extractedTown || '').toLowerCase();
          return (
            commLoc.includes(userTown) ||
            userLoc.includes(commTown) ||
            (commTown && commTown === userTown)
          );
        });
      }
    } else if (activePill === 'Saved') {
      list = enrichedCommunities.filter(
        (c) =>
          (savedItems || []).includes(c.id) ||
          (savedItems || []).some(
            (id) => (events || []).find((e) => e.id === id)?.communityId === c.id
          )
      );
    } else if (activePill === 'All') {
      list = [...enrichedCommunities];
    } else {
      const pillConfig = CATEGORY_PILLS.find((p) => p.id === activePill);
      const keywords = pillConfig?.keywords || [activePill.toLowerCase()];
      list = enrichedCommunities.filter((c) => {
        const searchable = [
          stripEmojiAndNormalize(c.category),
          ...(c.tags || []).map(stripEmojiAndNormalize),
          (c.name || '').toLowerCase(),
          (c.description || '').toLowerCase(),
        ].join(' ');
        return keywords.some((kw) => searchable.includes(kw));
      });
    }

    // Town filter
    if (selectedTown !== 'All') {
      const targetTown = selectedTown.toLowerCase();
      list = list.filter((c) => {
        const commLoc = getCommunityLocation(c).toLowerCase();
        const commTown = (c.extractedTown || '').toLowerCase();
        return commTown === targetTown || commLoc.includes(targetTown);
      });
    }

    // Search query (supports direct text match + surrounding area expansion, e.g. Kent & Sussex)
    const searchRankById = new Map();
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const directMatch =
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags?.some((t) => stripEmojiAndNormalize(t).includes(q)) ||
          getCommunityLocation(c).toLowerCase().includes(q) ||
          (c.location_name && c.location_name.toLowerCase().includes(q));

        if (directMatch) {
          searchRankById.set(c.id, 2);
          return true;
        }

        const locationCorpus = `${getCommunityLocation(c)} ${getCommunitySearchText(c)}`;
        const rank = getLocationSearchRank(locationCorpus, q);
        if (rank > 0) {
          searchRankById.set(c.id, rank);
          return true;
        }
        return false;
      });
    }

    const compareWithSearchRank = (baseCompare) => (a, b) => {
      if (searchRankById.size > 0) {
        const rankDiff = (searchRankById.get(b.id) || 0) - (searchRankById.get(a.id) || 0);
        if (rankDiff !== 0) return rankDiff;
      }
      return baseCompare(a, b);
    };

    // Preserve recommendation score order for "For You" unless user changes sort away from default
    if (activePill === 'For You' && sortBy === 'trending') {
      return searchRankById.size > 0
        ? [...list].sort(compareWithSearchRank(() => 0))
        : list;
    }

    if (sortBy === 'trending') {
      list = [...list].sort(compareWithSearchRank((a, b) => b.activityScore - a.activityScore));
    } else if (sortBy === 'newest') {
      list = [...list].sort(
        compareWithSearchRank((a, b) => {
          const tA = new Date(a.createdAt || a.created_at || 0).getTime() || 0;
          const tB = new Date(b.createdAt || b.created_at || 0).getTime() || 0;
          return tB - tA;
        })
      );
    } else if (sortBy === 'active') {
      list = [...list].sort(compareWithSearchRank((a, b) => b.memberCount - a.memberCount));
    }

    return list;
  }, [
    activePill,
    selectedTown,
    enrichedCommunities,
    recommendedCommunities,
    searchQuery,
    user,
    sortBy,
    savedItems,
    events,
  ]);

  // Saved events for the Saved tab
  const savedEventsList = useMemo(
    () => publicEvents.filter((e) => (savedItems || []).includes(e.id)),
    [publicEvents, savedItems]
  );

  // Featured community: top-ranked active public community
  const featuredCommunity = useMemo(() => {
    if (enrichedCommunities.length === 0) return null;
    return [...enrichedCommunities].sort((a, b) => b.activityScore - a.activityScore)[0];
  }, [enrichedCommunities]);

  // Global sponsor
  const globalSponsor = useMemo(() => {
    const globalAssignment = sponsorshipAssignments?.find((a) => a.target_type === 'global');
    return globalAssignment ? sponsors?.find((s) => s.id === globalAssignment.sponsor_id) : null;
  }, [sponsors, sponsorshipAssignments]);

  const ActivityBadge = ({ level }) => {
    const conf = isLight
      ? {
          active: {
            bg: 'rgba(21, 128, 61, 0.11)',
            color: '#15803D',
            border: '1px solid rgba(21, 128, 61, 0.28)',
            label: '● Active',
          },
          growing: {
            bg: 'rgba(180, 83, 9, 0.11)',
            color: '#B45309',
            border: '1px solid rgba(180, 83, 9, 0.28)',
            label: '↑ Growing',
          },
          new: {
            bg: 'rgba(29, 78, 216, 0.10)',
            color: '#1D4ED8',
            border: '1px solid rgba(29, 78, 216, 0.24)',
            label: '✦ New',
          },
        }
      : {
          active: {
            bg: 'rgba(58, 142, 118, 0.20)',
            color: '#4ADE80',
            border: '1px solid rgba(74, 222, 128, 0.28)',
            label: '● Active',
          },
          growing: {
            bg: 'rgba(245, 158, 11, 0.16)',
            color: '#FBBF24',
            border: '1px solid rgba(251, 191, 36, 0.28)',
            label: '↑ Growing',
          },
          new: {
            bg: 'rgba(96, 165, 250, 0.16)',
            color: '#93C5FD',
            border: '1px solid rgba(147, 197, 253, 0.28)',
            label: '✦ New',
          },
        };
    const c = conf[level] || conf.new;
    return (
      <span
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          padding: '3px 9px',
          borderRadius: '99px',
          background: c.bg,
          color: c.color,
          border: c.border,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          lineHeight: 1.2,
        }}
      >
        {c.label}
      </span>
    );
  };

  const handleJoin = async (communityId, communityName) => {
    if (!user?.id) {
      navigate.push('/login?redirect=/discover');
      return;
    }
    await joinCommunity(communityId);
    toast.success('Joined!', `You're now a member of ${communityName}`);
  };

  const showFeatured =
    Boolean(featuredCommunity) &&
    activePill === 'All' &&
    selectedTown === 'All' &&
    !searchQuery.trim();

  return (
    <div
      className="view-discover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--surface-canvas)',
        paddingBottom: viewMode === 'map' ? 0 : '96px',
      }}
    >
      <AppHeader title="Discover" />

      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '18px 20px 0',
          boxSizing: 'border-box',
        }}
      >
        {/* Guest Welcome Banner */}
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
                <Compass size={16} color="var(--brand-accent)" /> Real-Life Local Communities
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                Free to browse. Open any group to see upcoming meetups, member reviews, and host bios.
              </div>
            </div>
            <button
              onClick={() => navigate.push('/login?redirect=/discover')}
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

        {/* Editorial Page Header */}
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
            <p
              style={{
                margin: 0,
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--ink-muted)',
              }}
            >
              Local communities around
            </p>
            <h1
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.45rem, 3.5vw, 1.9rem)',
                fontWeight: 700,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              {selectedTown !== 'All' ? selectedTown : user?.location || LAUNCH_LOCATION_DISPLAY}
            </h1>
          </div>

          <button
            onClick={() => navigate.push('/create-community')}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'var(--brand-accent-soft)',
              border: '1px solid var(--brand-accent)',
              color: 'var(--teal-300)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} /> Start a Community
          </button>
        </div>

        {/* Search + List/Map Toggle + Sort Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          {/* Search Input */}
          <div
            style={{
              flex: '1 1 260px',
              background: 'var(--surface-card)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--ink-muted)',
              border: '1px solid var(--hairline-border-strong)',
            }}
          >
            <Search size={17} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search groups, interests, or towns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-primary)',
                outline: 'none',
                flex: 1,
                fontSize: '0.9rem',
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

          {/* List / Map Segmented Toggle */}
          <div
            role="group"
            aria-label="View mode"
            style={{
              display: 'inline-flex',
              background: 'var(--surface-card)',
              border: '1px solid var(--hairline-border-strong)',
              borderRadius: '12px',
              padding: '3px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('list')}
              className="interactive-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '9px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--brand-accent)' : 'transparent',
                color: viewMode === 'list' ? '#FFFFFF' : 'var(--ink-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <List size={15} /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className="interactive-press"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '9px',
                border: 'none',
                background: viewMode === 'map' ? 'var(--brand-accent)' : 'transparent',
                color: viewMode === 'map' ? '#FFFFFF' : 'var(--ink-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <MapIcon size={15} /> Map
            </button>
          </div>

          {/* Sort Select */}
          {viewMode === 'list' && (
            <select
              aria-label="Sort communities"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border-strong)',
                borderRadius: '12px',
                padding: '9px 12px',
                color: 'var(--ink-primary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="trending">Sort: Most Active</option>
              <option value="active">Sort: Most Members</option>
              <option value="newest">Sort: Newest</option>
            </select>
          )}
        </div>

        {/* Category Filter Pills */}
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollSnapType: 'x mandatory',
          }}
        >
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activePill === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActivePill(pill.id)}
                className="interactive-press"
                style={{
                  whiteSpace: 'nowrap',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  border: isActive
                    ? '1px solid var(--ink-primary)'
                    : '1px solid var(--hairline-border-strong)',
                  background: isActive ? 'var(--ink-primary)' : 'var(--surface-card)',
                  color: isActive ? 'var(--surface-canvas)' : 'var(--ink-secondary)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  scrollSnapAlign: 'start',
                }}
              >
                {pill.icon === 'heart' && (
                  <Heart
                    size={13}
                    fill={isActive ? 'currentColor' : 'none'}
                    color={isActive ? 'currentColor' : '#DC2626'}
                  />
                )}
                {pill.icon === 'pin' && (
                  <MapPin
                    size={13}
                    color={isActive ? 'currentColor' : 'var(--brand-accent)'}
                  />
                )}
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Town Filter Pills (auto-derived from live communities, excludes venues/placeholders) */}
        {availableTowns.length > 1 && (
          <div
            className="hide-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '16px',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                marginRight: '2px',
              }}
            >
              Towns:
            </span>
            {['All', ...availableTowns].map((town) => {
              const isSelected = selectedTown === town;
              return (
                <button
                  key={town}
                  onClick={() => setSelectedTown(town)}
                  className="interactive-press"
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '5px 11px',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 600,
                    background: isSelected ? 'var(--brand-accent-soft)' : 'var(--surface-elevated)',
                    color: isSelected ? 'var(--teal-300)' : 'var(--ink-secondary)',
                    border: isSelected
                      ? '1px solid var(--brand-accent)'
                      : '1px solid var(--hairline-border)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {town !== 'All' && (
                    <MapPin
                      size={11}
                      color={isSelected ? 'var(--teal-300)' : 'var(--ink-muted)'}
                    />
                  )}
                  <span>{town === 'All' ? 'All Towns' : town}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MAP VIEW ================= */}
      {viewMode === 'map' ? (
        <div
          style={{
            width: '100%',
            maxWidth: '1180px',
            margin: '0 auto',
            padding: '0 20px 24px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 'calc(100dvh - 280px)',
              minHeight: '420px',
              position: 'relative',
              borderRadius: '18px',
              overflow: 'hidden',
              border: '1px solid var(--hairline-border-strong)',
            }}
          >
            <MapView communities={filteredCommunities} events={publicEvents} />
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(20, 18, 15, 0.88)',
                backdropFilter: 'blur(12px)',
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                color: '#FFFFFF',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
              }}
            >
              {filteredCommunities.length} communit{filteredCommunities.length === 1 ? 'y' : 'ies'}{' '}
              shown
            </div>
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div
          style={{
            width: '100%',
            maxWidth: '1180px',
            margin: '0 auto',
            padding: '4px 20px 0',
            boxSizing: 'border-box',
          }}
        >
          {/* Featured Community Editorial Split Hero */}
          {showFeatured && (
            <article
              onClick={() =>
                navigate.push('/community/' + getCommunitySlug(featuredCommunity, communities))
              }
              className="featured-community-hero stagger-item"
            >
              {/* Clean Photo Panel */}
              <div className="featured-hero-media">
                <img
                  src={featuredCommunity.image || featuredCommunity.cover_image || FALLBACK_IMAGES.general}
                  alt={featuredCommunity.name}
                  loading="lazy"
                  className="featured-hero-img"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to bottom, rgba(18,18,18,0.22) 0%, transparent 40%, rgba(18,18,18,0.12) 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                  <span
                    style={{
                      background: 'var(--brand-accent)',
                      color: '#FFFFFF',
                      padding: '5px 12px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                    }}
                  >
                    <Sparkles size={12} /> Featured Community
                  </span>
                </div>
              </div>

              {/* Editorial Content Panel */}
              <div className="featured-hero-body">
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginBottom: '10px',
                    }}
                  >
                    {featuredCommunity.category && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: 'var(--surface-elevated)',
                          color: 'var(--ink-secondary)',
                          border: '1px solid var(--hairline-border)',
                        }}
                      >
                        {featuredCommunity.category}
                      </span>
                    )}
                    {featuredCommunity.activityLevel && (
                      <ActivityBadge level={featuredCommunity.activityLevel} />
                    )}
                  </div>

                  <h2
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: 'clamp(1.32rem, 2.4vw, 1.72rem)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                      lineHeight: 1.18,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {featuredCommunity.name}
                  </h2>

                  <p
                    style={{
                      margin: '0 0 14px 0',
                      fontSize: '0.88rem',
                      color: 'var(--ink-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.55,
                    }}
                  >
                    {featuredCommunity.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap',
                      fontSize: '0.8rem',
                      color: 'var(--ink-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Users size={14} color="var(--brand-accent)" /> {featuredCommunity.memberCount} member
                      {featuredCommunity.memberCount === 1 ? '' : 's'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="var(--brand-accent)" /> {getCommunityLocation(featuredCommunity)}
                    </span>
                    {featuredCommunity.upcomingEvents > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} color="var(--brand-accent)" /> {featuredCommunity.upcomingEvents} upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Editorial Footer CTA */}
                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--hairline-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--ink-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {featuredCommunity.cost && featuredCommunity.cost !== 'Free'
                      ? featuredCommunity.cost
                      : 'Free to join'}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      background: 'var(--brand-accent)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    Explore community <ChevronRight size={15} />
                  </span>
                </div>
              </div>
            </article>
          )}

          {/* Compact Experiences Marketplace Strip */}
          {activePill === 'All' && !searchQuery.trim() && (
            <div
              onClick={() => navigate.push('/experiences')}
              className="interactive-press"
              style={{
                marginBottom: '22px',
                padding: '14px 18px',
                borderRadius: '16px',
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border-strong)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--brand-accent-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-accent)',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                    }}
                  >
                    Guided Days Out &amp; Retreats
                  </span>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: 'var(--brand-accent-soft)',
                      color: 'var(--brand-accent)',
                    }}
                  >
                    Experiences
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
                  Bookable partner outings, workshops &amp; venues — pitch one to your group or book with a leader
                </div>
              </div>
              <ChevronRight size={18} color="var(--ink-muted)" style={{ flexShrink: 0 }} />
            </div>
          )}

          {/* Section Heading */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '14px',
              gap: '8px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--ink-primary)',
              }}
            >
              {activePill === 'For You'
                ? 'Recommended for You'
                : activePill === 'Saved'
                  ? 'Your Saved Groups & Events'
                  : activePill === 'Nearby'
                    ? 'Communities Near You'
                    : selectedTown !== 'All'
                      ? `Groups in ${selectedTown}`
                      : activePill !== 'All'
                        ? `${activePill} Communities`
                        : 'Explore Communities'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontWeight: 600 }}>
              {filteredCommunities.length} group{filteredCommunities.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* For You Context & Swipe Deck */}
          {activePill === 'For You' && (
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  marginBottom: '14px',
                  fontSize: '0.83rem',
                  color: 'var(--teal-300)',
                  background: 'var(--brand-accent-soft)',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(235, 87, 56, 0.25)',
                  fontWeight: 500,
                }}
              >
                Tailored to your interests, location, and active groups nearby.
              </div>
              <SwipeDiscovery
                inline={true}
                events={publicEvents.filter(
                  (e) => isEventUpcoming(e) && !(savedItems || []).includes(e.id)
                )}
                communities={enrichedCommunities}
                onClose={() => {}}
                onSave={(item) => {
                  saveItem(item.id);
                  toast.success('Saved!', 'Added to your Saved list.');
                }}
              />
            </div>
          )}

          {/* Saved Events Sub-section (only rendered when there are saved events, or empty state when nothing is saved at all) */}
          {activePill === 'Saved' && savedEventsList.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--ink-muted)',
                  marginBottom: '10px',
                }}
              >
                Saved Meetups ({savedEventsList.length})
              </div>
              <div className="desktop-grid-layout" style={{ gap: '14px' }}>
                {savedEventsList.map((event) => {
                  const community = enrichedCommunities.find((c) => c.id === event.communityId);
                  return (
                    <div
                      key={event.id}
                      className="interactive-press"
                      onClick={() => navigate.push(getEventPath(event, events))}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={event.image || community?.image || FALLBACK_IMAGES.event}
                        alt={event.title}
                        style={{ width: '96px', minHeight: '100px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ padding: '12px 4px 12px 0', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: 'var(--teal-300)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            marginBottom: '3px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {community?.name || 'Community Event'}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            color: 'var(--ink-primary)',
                            fontSize: '0.95rem',
                            lineHeight: 1.25,
                            marginBottom: '6px',
                          }}
                        >
                          {event.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--ink-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <Calendar size={12} /> {formatEventDateShort(event.date, event.time)}
                        </div>
                      </div>
                      <div style={{ padding: '10px' }}>
                        <button
                          aria-label="Remove saved event"
                          onClick={(e) => {
                            e.stopPropagation();
                            unsaveItem(event.id);
                          }}
                          style={{
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--hairline-border)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#DC2626',
                            cursor: 'pointer',
                          }}
                        >
                          <Heart size={15} fill="#DC2626" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community Listings Grid */}
          {isLoading ? (
            <SkeletonList count={5} Component={SkeletonCard} />
          ) : (
            <>
              <div
                className="desktop-grid-layout"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '18px',
                }}
              >
                {filteredCommunities.map((community, index) => {
                  const isMember = Boolean(user?.joinedCommunities?.includes(community.id));
                  const isSaved = (savedItems || []).includes(community.id);
                  const primaryTag = community.category || community.tags?.[0] || null;
                  const injectSponsor = index === 1 && globalSponsor && activePill === 'All';

                  return (
                    <React.Fragment key={community.id}>
                      {injectSponsor && (
                        <article
                          onClick={() => navigate.push('/sponsors/' + globalSponsor.id)}
                          className="stagger-item interactive-press"
                          style={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            background: 'var(--surface-card)',
                            border: '1px solid rgba(217, 119, 6, 0.35)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div
                            style={{
                              height: '150px',
                              background: `var(--surface-elevated) url(${globalSponsor.heroImage}) center/cover no-repeat`,
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                  'linear-gradient(to top, rgba(18,18,18,0.45) 0%, transparent 50%)',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: '#B45309',
                                padding: '4px 10px',
                                borderRadius: '99px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                              }}
                            >
                              <BadgeCheck size={12} /> Partner
                            </div>
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-18px',
                                left: '16px',
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: '#FFFFFF',
                                border: '2px solid var(--surface-card)',
                                overflow: 'hidden',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                                padding: '3px',
                              }}
                            >
                              <img
                                src={globalSponsor.logo}
                                alt={globalSponsor.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              padding: '24px 16px 16px',
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <h3
                              style={{
                                margin: '0 0 6px 0',
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1.08rem',
                                color: 'var(--ink-primary)',
                              }}
                            >
                              {globalSponsor.name}
                            </h3>
                            <p
                              style={{
                                margin: '0 0 14px 0',
                                fontSize: '0.84rem',
                                color: 'var(--ink-secondary)',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.45,
                              }}
                            >
                              {globalSponsor.bio}
                            </p>
                            <div
                              style={{
                                marginTop: 'auto',
                                paddingTop: '12px',
                                borderTop: '1px solid var(--hairline-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                                Supporting local communities
                              </span>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  color: 'var(--teal-300)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                Learn More <ChevronRight size={14} />
                              </span>
                            </div>
                          </div>
                        </article>
                      )}

                      {/* Organic Community Listing Card */}
                      <article
                        onClick={() =>
                          navigate.push('/community/' + getCommunitySlug(community, communities))
                        }
                        className="stagger-item interactive-press"
                        style={{
                          borderRadius: '16px',
                          overflow: 'hidden',
                          background: 'var(--surface-card)',
                          border: '1px solid var(--hairline-border)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Cover Photo */}
                        <div
                          style={{
                            height: '154px',
                            background: community.image || community.cover_image
                              ? `var(--surface-elevated) url(${community.image || community.cover_image}) center/cover no-repeat`
                              : 'linear-gradient(135deg, var(--brand-accent), var(--surface-elevated))',
                            position: 'relative',
                          }}
                        >
                          {primaryTag && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                background: 'rgba(20, 18, 15, 0.78)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.16)',
                                padding: '4px 10px',
                                borderRadius: '99px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#FFFFFF',
                                lineHeight: 1.25,
                              }}
                            >
                              {primaryTag}
                            </span>
                          )}

                          {/* Quick Save Heart Overlay */}
                          <button
                            className="interactive-press"
                            aria-label={isSaved ? 'Remove from saved' : 'Save community'}
                            title={isSaved ? 'Remove from saved' : 'Save community'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSaved) {
                                unsaveItem(community.id);
                                toast.info('Removed', 'Removed from saved communities');
                              } else {
                                saveItem(community.id);
                                toast.success('Saved!', 'Added to your Saved list');
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: 'rgba(20, 18, 15, 0.72)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.18)',
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: isSaved ? '#F87171' : '#FFFFFF',
                            }}
                          >
                            <Heart
                              size={15}
                              fill={isSaved ? '#EF4444' : 'none'}
                              color={isSaved ? '#EF4444' : '#FFFFFF'}
                            />
                          </button>
                        </div>

                        {/* Card Body */}
                        <div
                          style={{
                            padding: '16px',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '6px',
                            }}
                          >
                            <h3
                              style={{
                                margin: 0,
                                fontFamily: 'var(--font-heading)',
                                fontSize: '1.08rem',
                                fontWeight: 700,
                                color: 'var(--ink-primary)',
                                lineHeight: 1.25,
                              }}
                            >
                              {community.name}
                            </h3>
                            {community.verified && (
                              <BadgeCheck size={15} color="var(--brand-secondary)" style={{ flexShrink: 0 }} />
                            )}
                          </div>

                          <p
                            style={{
                              margin: '0 0 12px 0',
                              fontSize: '0.84rem',
                              color: 'var(--ink-secondary)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.45,
                            }}
                          >
                            {community.description}
                          </p>

                          {/* Listing Meta & High-Contrast Pills */}
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              alignItems: 'center',
                              marginBottom: '14px',
                            }}
                          >
                            <ActivityBadge level={community.activityLevel} />

                            {community.upcomingEvents > 0 && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: '99px',
                                  background: isLight
                                    ? 'rgba(180, 83, 9, 0.11)'
                                    : 'rgba(245, 158, 11, 0.16)',
                                  color: isLight ? '#B45309' : '#FBBF24',
                                  border: isLight
                                    ? '1px solid rgba(180, 83, 9, 0.28)'
                                    : '1px solid rgba(251, 191, 36, 0.28)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  lineHeight: 1.2,
                                }}
                              >
                                <Calendar size={11} /> {community.upcomingEvents} upcoming
                              </span>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div
                            style={{
                              marginTop: 'auto',
                              paddingTop: '12px',
                              borderTop: '1px solid var(--hairline-border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.78rem',
                                  color: 'var(--ink-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                <Users size={13} color="var(--brand-accent)" />
                                {community.memberCount} member
                                {community.memberCount === 1 ? '' : 's'}
                              </span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.75rem',
                                  color: 'var(--ink-muted)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                <MapPin
                                  size={12}
                                  color="var(--ink-muted)"
                                  style={{ flexShrink: 0 }}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {getCommunityLocation(community)}
                                </span>
                              </span>
                            </div>

                            <button
                              className="interactive-press"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isMember) handleJoin(community.id, community.name);
                              }}
                              disabled={isMember}
                              style={{
                                padding: '7px 16px',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: isMember ? 'default' : 'pointer',
                                flexShrink: 0,
                                background: isMember
                                  ? 'var(--surface-elevated)'
                                  : 'var(--brand-accent)',
                                color: isMember ? 'var(--ink-secondary)' : '#FFFFFF',
                                border: isMember
                                  ? '1px solid var(--hairline-border-strong)'
                                  : '1px solid transparent',
                              }}
                            >
                              {isMember ? 'Joined' : 'Join'}
                            </button>
                          </div>
                        </div>
                      </article>
                    </React.Fragment>
                  );
                })}

                {filteredCommunities.length === 0 && (activePill !== 'Saved' || savedEventsList.length === 0) && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '24px 0',
                      maxWidth: '520px',
                      margin: '0 auto',
                      width: '100%',
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      {activePill === 'Saved' ? (
                        <>
                          <Heart
                            size={36}
                            color="var(--ink-muted)"
                            style={{ marginBottom: '10px' }}
                          />
                          <h3
                            style={{
                              fontFamily: 'var(--font-heading)',
                              color: 'var(--ink-primary)',
                              margin: '0 0 6px',
                              fontSize: '1.2rem',
                            }}
                          >
                            No saved communities or events yet
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.86rem',
                              color: 'var(--ink-secondary)',
                            }}
                          >
                            Tap the heart icon on any community or event to shortlist it here.
                          </p>
                        </>
                      ) : (
                        <>
                          <Search
                            size={32}
                            color="var(--ink-muted)"
                            style={{ marginBottom: '10px' }}
                          />
                          <h3
                            style={{
                              fontFamily: 'var(--font-heading)',
                              color: 'var(--ink-primary)',
                              margin: '0 0 6px',
                              fontSize: '1.2rem',
                            }}
                          >
                            No groups found
                          </h3>
                          <p
                            style={{
                              margin: '0 0 14px',
                              fontSize: '0.86rem',
                              color: 'var(--ink-secondary)',
                            }}
                          >
                            No communities currently match your filters.
                          </p>
                          {(activePill !== 'All' || selectedTown !== 'All' || searchQuery) && (
                            <button
                              onClick={() => {
                                setActivePill('All');
                                setSelectedTown('All');
                                setSearchQuery('');
                              }}
                              className="interactive-press"
                              style={{
                                padding: '8px 16px',
                                borderRadius: '999px',
                                background: 'var(--surface-card)',
                                border: '1px solid var(--hairline-border-strong)',
                                color: 'var(--ink-primary)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: '8px',
                              }}
                            >
                              Reset filters
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {activePill !== 'Saved' && (
                      <TownAlertCard
                        town={
                          searchQuery ||
                          (selectedTown !== 'All'
                            ? selectedTown
                            : activePill !== 'All'
                              ? activePill
                              : 'your area')
                        }
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Calm Editorial Create Community CTA */}
              <div
                onClick={() => navigate.push('/create-community')}
                className="interactive-press"
                style={{
                  marginTop: '28px',
                  padding: '24px 20px',
                  border: '1px solid var(--hairline-border-strong)',
                  background: 'var(--surface-card)',
                  borderRadius: '18px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.15rem',
                    color: 'var(--ink-primary)',
                    fontWeight: 700,
                    marginBottom: '6px',
                  }}
                >
                  Don&apos;t see your community?
                </div>
                <div
                  style={{
                    fontSize: '0.86rem',
                    color: 'var(--ink-secondary)',
                    maxWidth: '380px',
                    margin: '0 auto 16px',
                    lineHeight: 1.5,
                  }}
                >
                  Start your own club, walking group, or local network. Free forever for community
                  leaders.
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate.push('/create-community');
                  }}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} /> Start a Community
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
