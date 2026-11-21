"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useFeed } from '../../src/context/FeedContext';
import {
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  MapPin,
  Clock,
  Compass,
  Plus,
  Megaphone,
  Edit3,
  ChevronUp,
  Shield,
  ArrowRight,
  Sparkles,
  Archive,
  Users,
  Lightbulb,
  LayoutDashboard,
} from 'lucide-react';
import { SkeletonList, SkeletonCard } from '../../src/components/SkeletonCard';
import InlineComments from '../../src/components/InlineComments';
import AppHeader from '../../src/components/AppHeader';
import PullToRefresh from '../../src/components/PullToRefresh';
import CreateIdeaModal from '../../src/components/CreateIdeaModal';
import GettingStarted from '../../src/views/GettingStarted';
import { useToast } from '../../src/components/Toast';
import { isEventUpcoming, isEventToday, parseEventDateTime } from '../../src/lib/calendar';
import { cleanLocationName, getCommunityLocation } from '../../src/lib/location';
import { isCommunityPubliclyListed } from '../../src/lib/communityVisibility';
import { getEventPath } from '../../src/lib/eventLinks';
import { getCommunitySlug } from '../../src/lib/communityLinks';
import { resolveUserAvatar } from '../../src/lib/avatar';

function formatBadgeDate(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    return {
      month: dt.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
      day: String(dt.getDate()),
    };
  }
  const isoMatch = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const mIdx = parseInt(isoMatch[2], 10) - 1;
    return {
      month: months[mIdx] || 'DATE',
      day: String(parseInt(isoMatch[3], 10)),
    };
  }
  return { month: 'SOON', day: '•' };
}

function formatReadableEventDate(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    return dt.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
  return dateStr || 'TBC';
}

export default function HomeFeed() {
  const {
    user,
    communities,
    events,
    refreshData,
    users,
    eventRsvps,
    isLoading,
    sponsors,
    sponsorshipAssignments,
    communityMemberships,
  } = useAppContext();
  const { feedPosts, likeFeedPost } = useFeed();
  const router = useRouter();
  const { toast } = useToast();

  const [expandedComments, setExpandedComments] = useState({});
  const [activeFeedTab, setActiveFeedTab] = useState('Feed');
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('pwa-dismissed')
  );
  const [showIOSInstallBanner, setShowIOSInstallBanner] = useState(false);

  const isLeader = (user?.ledCommunities?.length || 0) > 0;
  const isAdmin = Boolean(user?.isAdmin);

  const getMemberCount = (comm) => {
    if (!comm) return 1;
    const fromMap = (communityMemberships?.[comm.id] || []).length;
    if (fromMap > 0) return fromMap;
    if (comm.members && typeof comm.members === 'number') return comm.members;
    if (comm.memberCount && typeof comm.memberCount === 'number') return comm.memberCount;
    return 1;
  };

  // Capture PWA install prompt & iOS detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isStandalone =
      window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('ios-pwa-dismissed') === 'true';
    if (isIos && !isStandalone && !dismissed) {
      setShowIOSInstallBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleShare = async ({ title, text, url }) => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'More Community',
          text: text || 'Check this out on More Community.',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share error:', err);
        } else {
          return;
        }
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied!', 'Copied link to clipboard.');
      } catch {
        toast.info('Share link', shareUrl);
      }
    }
  };

  const joinedCommunities = useMemo(
    () => (communities || []).filter((c) => user?.joinedCommunities?.includes(c.id)),
    [communities, user?.joinedCommunities]
  );

  const platformCommunities = useMemo(() => {
    return (communities || []).filter(
      (c) =>
        isCommunityPubliclyListed(c) &&
        (c.id !== 'more-leaders-network' || isAdmin || isLeader)
    );
  }, [communities, isAdmin, isLeader]);

  // Curated local clubs for Sidebar & Mobile preview:
  // Prioritize unjoined communities matching the user's town/location, then other unjoined public communities.
  const suggestedCommunities = useMemo(() => {
    const userLoc = (user?.location || '').toLowerCase().trim();
    const userTown = userLoc.split(',')[0]?.trim();
    const unjoined = platformCommunities.filter((c) => !user?.joinedCommunities?.includes(c.id));
    const pool = unjoined.length > 0 ? unjoined : platformCommunities;

    const scored = [...pool].sort((a, b) => {
      const locA = getCommunityLocation(a).toLowerCase();
      const locB = getCommunityLocation(b).toLowerCase();
      const matchA = userTown && (locA.includes(userTown) || userLoc.includes(locA)) ? 1 : 0;
      const matchB = userTown && (locB.includes(userTown) || userLoc.includes(locB)) ? 1 : 0;
      if (matchA !== matchB) return matchB - matchA;
      return getMemberCount(b) - getMemberCount(a);
    });

    return scored.slice(0, 4);
  }, [platformCommunities, user?.joinedCommunities, user?.location, communityMemberships]);

  // Chronological upcoming public meetups for Sidebar
  const upcomingSidebarEvents = useMemo(() => {
    return (events || [])
      .filter((e) => {
        if (!isEventUpcoming(e)) return false;
        const comm = (communities || []).find((c) => c.id === e.communityId);
        if (comm && !isCommunityPubliclyListed(comm)) return false;
        return true;
      })
      .sort((a, b) => {
        const dtA = parseEventDateTime(a.date, a.time)?.getTime() || Number.MAX_SAFE_INTEGER;
        const dtB = parseEventDateTime(b.date, b.time)?.getTime() || Number.MAX_SAFE_INTEGER;
        return dtA - dtB;
      })
      .slice(0, 3);
  }, [events, communities]);

  // Accurate Daily Briefing: check actual event date (not createdAt)
  const todayEvents = useMemo(() => {
    return (events || []).filter((e) => {
      const inPrimary = user?.joinedCommunities?.includes(e.communityId);
      const inCollab = e.collabCommunityIds?.some((id) => user?.joinedCommunities?.includes(id));
      if (!inPrimary && !inCollab) return false;
      return isEventToday(e);
    });
  }, [events, user?.joinedCommunities]);

  const recentPosts = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (feedPosts || []).filter((p) => {
      if (!user?.joinedCommunities?.includes(p.communityId)) return false;
      const ts = new Date(p.timestamp || p.createdAt).getTime();
      return !isNaN(ts) && ts > cutoff;
    });
  }, [feedPosts, user?.joinedCommunities]);

  const feedItems = useMemo(() => {
    let items = [];
    if (feedPosts && user?.joinedCommunities) {
      feedPosts.forEach((post) => {
        if (user?.joinedCommunities?.includes(post.communityId)) {
          let isIdea = false;
          let ideaData = null;
          if (post.media) {
            try {
              const parsed = JSON.parse(post.media);
              if (parsed.type === 'idea') {
                isIdea = true;
                ideaData = parsed;
              }
            } catch {
              // Not JSON metadata
            }
          }

          if (isIdea) {
            if (activeFeedTab === 'Feed' || activeFeedTab === 'Ideas') {
              items.push({
                type: 'idea',
                id: `idea-${post.id}`,
                data: post,
                ideaData,
                timestamp: new Date(post.timestamp || post.createdAt).getTime(),
              });
            }
          } else if (activeFeedTab === 'Feed') {
            items.push({
              type: 'post',
              id: `post-${post.id}`,
              data: post,
              timestamp: new Date(post.timestamp || post.createdAt).getTime(),
            });
          }
        }
      });
    }

    if (events && user?.joinedCommunities) {
      events.forEach((event) => {
        const isMemberOfPrimary = user?.joinedCommunities?.includes(event.communityId);
        const isMemberOfCollab = event.collabCommunityIds?.some((id) =>
          user?.joinedCommunities?.includes(id)
        );

        if (isMemberOfPrimary || isMemberOfCollab) {
          const isUpcoming = isEventUpcoming(event);
          if (activeFeedTab === 'Events') {
            if (isUpcoming) {
              items.push({
                type: 'event',
                id: `event-${event.id}`,
                data: event,
                timestamp:
                  parseEventDateTime(event.date, event.time)?.getTime() ||
                  new Date(event.createdAt || event.date).getTime(),
              });
            }
          } else if (activeFeedTab === 'Feed') {
            items.push({
              type: 'event',
              id: `event-${event.id}`,
              data: event,
              timestamp: new Date(event.createdAt || event.date).getTime(),
            });
          }
        }
      });
    }

    // In the Events tab, sort upcoming events soonest-first; in Feed/Ideas, newest-first.
    let sortedItems =
      activeFeedTab === 'Events'
        ? items.sort((a, b) => a.timestamp - b.timestamp)
        : items.sort((a, b) => b.timestamp - a.timestamp);

    const globalAssignment = sponsorshipAssignments?.find((a) => a.target_type === 'global');
    const globalSponsor = globalAssignment
      ? sponsors?.find((s) => s.id === globalAssignment.sponsor_id)
      : null;

    if (globalSponsor && activeFeedTab === 'Feed') {
      const sponsoredPost = {
        type: 'sponsored_post',
        id: `sponsored-${globalSponsor.id}`,
        data: {
          text: 'We are incredibly proud to support More Community and help local communities thrive. Check out our story to see why we believe real-life connection is the foundation of wellbeing.',
          media: globalSponsor.videoUrl,
        },
        sponsor: globalSponsor,
        timestamp: Date.now(),
      };

      if (sortedItems.length > 0) {
        sortedItems.splice(1, 0, sponsoredPost);
      } else {
        sortedItems.push(sponsoredPost);
      }
    }

    return sortedItems;
  }, [feedPosts, events, user?.joinedCommunities, activeFeedTab, sponsors, sponsorshipAssignments]);

  // Show Getting Started screen for users with no communities
  if (!isLoading && user?.onboarded && joinedCommunities.length === 0) {
    return <GettingStarted />;
  }

  const greetingText =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <div
      className="view-home"
      style={{
        paddingBottom: '96px',
        background: 'var(--surface-canvas)',
        minHeight: '100dvh',
      }}
    >
      <AppHeader title="Home" />
      <PullToRefresh onRefresh={refreshData}>
        <div
          className="desktop-feed-layout"
          style={{ padding: '18px 20px 0' }}
        >
          {/* ================= LEFT / MAIN COLUMN ================= */}
          <div className="desktop-feed-main" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Editorial Greeting Header */}
            <header style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.55rem, 4vw, 2rem)',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                {greetingText}, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p
                style={{
                  color: 'var(--ink-secondary)',
                  fontSize: '0.92rem',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {todayEvents.length > 0
                  ? `You have ${todayEvents.length} meetup${todayEvents.length > 1 ? 's' : ''} happening today.`
                  : recentPosts.length > 0
                    ? `${recentPosts.length} new update${recentPosts.length > 1 ? 's' : ''} in your communities.`
                    : "You're all caught up for today."}
              </p>
            </header>

            {/* Mobile-only Compact Quick Actions Row (desktop uses sidebar) */}
            <div className="mobile-only" style={{ marginTop: '-4px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: '2px',
                }}
              >
                {isLeader || isAdmin ? (
                  <>
                    {isLeader && (
                      <>
                        <button
                          onClick={() => router.push('/dashboard')}
                          className="btn btn-primary interactive-press"
                          style={{
                            flex: '0 0 auto',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <LayoutDashboard size={15} /> Dashboard
                        </button>
                        <button
                          onClick={() => router.push('/dashboard?tab=events')}
                          className="interactive-press"
                          style={{
                            flex: '0 0 auto',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--hairline-border-strong)',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--ink-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <Calendar size={15} color="var(--brand-accent)" /> Host Event
                        </button>
                        <button
                          onClick={() => router.push('/dashboard?tab=crm')}
                          className="interactive-press"
                          style={{
                            flex: '0 0 auto',
                            background: 'var(--surface-card)',
                            border: '1px solid var(--hairline-border-strong)',
                            padding: '9px 14px',
                            borderRadius: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--ink-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <Megaphone size={15} color="var(--brand-accent)" /> Broadcast
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => router.push('/admin')}
                        className="interactive-press"
                        style={{
                          flex: '0 0 auto',
                          background: 'var(--surface-card)',
                          border: '1px solid var(--hairline-border-strong)',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--ink-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <Shield size={15} color="var(--brand-accent)" /> Admin
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => router.push('/discover')}
                      className="interactive-press"
                      style={{
                        flex: 1,
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border-strong)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: 'var(--ink-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <Compass size={16} color="var(--brand-accent)" /> Explore Groups
                    </button>
                    <button
                      onClick={() => router.push('/chat')}
                      className="interactive-press"
                      style={{
                        flex: 1,
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border-strong)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: 'var(--ink-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <MessageCircle size={16} color="var(--brand-accent)" /> Messages
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* PWA Install Banner */}
            {installPrompt && showInstallBanner && (
              <div
                style={{
                  padding: '14px 16px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src="/logo.png"
                  alt="More Community"
                  style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }}
                  className="theme-invert"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink-primary)' }}>
                    Install More Community
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                    Add to your home screen for quick access
                  </div>
                </div>
                <button
                  onClick={async () => {
                    installPrompt.prompt();
                    const result = await installPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                      setShowInstallBanner(false);
                      localStorage.setItem('pwa-dismissed', 'true');
                    }
                  }}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Install
                </button>
                <button
                  onClick={() => {
                    setShowInstallBanner(false);
                    localStorage.setItem('pwa-dismissed', 'true');
                  }}
                  aria-label="Dismiss install banner"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '1.15rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* iOS Install Guide Banner */}
            {showIOSInstallBanner && (
              <div
                style={{
                  padding: '14px 16px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src="/logo.png"
                  alt="More Community"
                  style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }}
                  className="theme-invert"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--ink-primary)' }}>
                    Install More Community on iOS
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
                    Tap <strong>Share</strong> (square with arrow up) then{' '}
                    <strong>Add to Home Screen</strong>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowIOSInstallBanner(false);
                    localStorage.setItem('ios-pwa-dismissed', 'true');
                  }}
                  aria-label="Dismiss iOS install banner"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '1.15rem',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Your Communities — Clean Single-Row Horizontal Strip */}
            {joinedCommunities.length > 0 && (
              <section aria-label="Your communities">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <h2
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--ink-muted)',
                      margin: 0,
                    }}
                  >
                    Your Communities ({joinedCommunities.length})
                  </h2>
                  <button
                    onClick={() => router.push('/discover')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--teal-300)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    Discover more <ArrowRight size={13} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: '4px',
                  }}
                >
                  {joinedCommunities.map((community) => {
                    const isPendingChapter = community.chapterApprovalStatus === 'pending';
                    return (
                      <div
                        key={community.id}
                        onClick={() =>
                          router.push(`/community/${getCommunitySlug(community, communities)}`)
                        }
                        className="interactive-press"
                        style={{
                          flex: '0 0 184px',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: 'var(--surface-card)',
                          border: '1px solid var(--hairline-border)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          style={{
                            height: '92px',
                            background: `var(--surface-elevated) url(${community.image || community.cover_image || ''}) center/cover no-repeat`,
                            position: 'relative',
                          }}
                        >
                          {isPendingChapter && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: '#B45309',
                                color: '#FFFFFF',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                padding: '3px 7px',
                                borderRadius: '6px',
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                              }}
                            >
                              Pending Sign-Off
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: 'var(--ink-primary)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.25,
                            }}
                          >
                            {community.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--ink-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: 'auto',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            <MapPin size={11} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {getCommunityLocation(community)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Segmented Feed Control */}
            <div style={{ borderTop: '1px solid var(--hairline-border)', paddingTop: '16px' }}>
              <div className="segmented-control">
                {['Feed', 'Events', 'Ideas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFeedTab(tab)}
                    className={activeFeedTab === tab ? 'active' : ''}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Ideas Pitch & Suggestion Banner */}
            {activeFeedTab === 'Ideas' && (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ minWidth: '210px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Lightbulb size={18} color="var(--brand-accent)" />
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        color: 'var(--ink-primary)',
                        fontSize: '1rem',
                      }}
                    >
                      Member Ideas & Proposals
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: 'var(--ink-secondary)',
                      lineHeight: 1.45,
                    }}
                  >
                    Suggest a walk, workshop, or gathering. Members upvote favorites, and leaders
                    turn popular ideas into official events.
                  </p>
                </div>
                <button
                  onClick={() => setShowIdeaModal(true)}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} /> Pitch an Idea
                </button>
              </div>
            )}

            {/* Main Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isLoading ? (
                <SkeletonList count={4} Component={SkeletonCard} />
              ) : feedItems.length > 0 ? (
                feedItems.map((item) => {
                  /* ---- SPONSORED POST ---- */
                  if (item.type === 'sponsored_post') {
                    const post = item.data;
                    const sponsor = item.sponsor;
                    return (
                      <article
                        key={item.id}
                        style={{
                          background: 'var(--surface-card)',
                          border: '1px solid rgba(217, 119, 6, 0.35)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            background: '#B45309',
                            color: '#FFFFFF',
                            padding: '4px 10px',
                            borderRadius: '99px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            zIndex: 10,
                          }}
                        >
                          Partner
                        </div>
                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={sponsor.logo}
                            alt={sponsor.name}
                            loading="lazy"
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              objectFit: 'contain',
                              background: '#FFFFFF',
                              cursor: 'pointer',
                              border: '1px solid var(--hairline-border)',
                              padding: '4px',
                            }}
                            onClick={() => router.push(`/sponsors/${sponsor.id}`)}
                          />
                          <div>
                            <div
                              style={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                color: 'var(--ink-primary)',
                                fontSize: '1rem',
                                cursor: 'pointer',
                              }}
                              onClick={() => router.push(`/sponsors/${sponsor.id}`)}
                            >
                              {sponsor.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                              Supporting local communities
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: '0 16px 16px',
                            color: 'var(--ink-secondary)',
                            fontSize: '0.94rem',
                            lineHeight: 1.6,
                          }}
                        >
                          {post.text}
                        </div>
                        {post.media && (
                          <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
                            <video
                              src={post.media}
                              controls
                              autoPlay
                              muted
                              loop
                              playsInline
                              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        )}
                        <div
                          style={{
                            padding: '14px 16px',
                            borderTop: '1px solid var(--hairline-border)',
                          }}
                        >
                          <button
                            onClick={() => router.push(`/sponsors/${sponsor.id}`)}
                            className="interactive-press"
                            style={{
                              background: 'var(--surface-elevated)',
                              color: 'var(--ink-primary)',
                              border: '1px solid var(--hairline-border-strong)',
                              padding: '10px 18px',
                              borderRadius: '10px',
                              fontSize: '0.86rem',
                              width: '100%',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Learn More About {sponsor.name}
                          </button>
                        </div>
                      </article>
                    );
                  }

                  /* ---- REGULAR FEED POST ---- */
                  if (item.type === 'post') {
                    const post = item.data;
                    const author = users?.find((u) => u.id === post.authorId);
                    const community = communities?.find((c) => c.id === post.communityId);
                    const commSlug = community ? getCommunitySlug(community, communities) : post.communityId;
                    const isCommentsOpen = Boolean(expandedComments[post.id]);

                    return (
                      <article
                        key={item.id}
                        style={{
                          background: 'var(--surface-card)',
                          border: '1px solid var(--hairline-border)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={community?.image || community?.cover_image}
                            alt={community?.name || 'Community'}
                            loading="lazy"
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              cursor: 'pointer',
                              border: '1px solid var(--hairline-border)',
                              flexShrink: 0,
                            }}
                            onClick={() => router.push(`/community/${commSlug}`)}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                color: 'var(--ink-primary)',
                                fontSize: '0.98rem',
                                cursor: 'pointer',
                                lineHeight: 1.25,
                              }}
                              onClick={() => router.push(`/community/${commSlug}`)}
                            >
                              {community?.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                              {author?.name || 'Community Leader'} •{' '}
                              {post.timestamp && !isNaN(new Date(post.timestamp).getTime())
                                ? new Date(post.timestamp).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : 'Recently'}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '0 16px 16px',
                            color: 'var(--ink-secondary)',
                            fontSize: '0.96rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {post.text}
                        </div>

                        {(() => {
                          if (!post.media) return null;

                          let mediaArr = [post.media];
                          try {
                            const parsed = JSON.parse(post.media);
                            if (Array.isArray(parsed)) mediaArr = parsed;
                          } catch {
                            // Single URL
                          }

                          if (mediaArr.length >= 4) {
                            return (
                              <div
                                style={{
                                  width: '100%',
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '2px',
                                  background: 'var(--surface-canvas)',
                                }}
                              >
                                <div style={{ height: '300px' }}>
                                  <img
                                    src={mediaArr[0]}
                                    alt="Post media 1"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                </div>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gridTemplateRows: '1fr 1fr',
                                    gap: '2px',
                                    height: '300px',
                                  }}
                                >
                                  <img
                                    src={mediaArr[1]}
                                    alt="Post media 2"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                  <img
                                    src={mediaArr[2]}
                                    alt="Post media 3"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                  <img
                                    src={mediaArr[3]}
                                    alt="Post media 4"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                  {mediaArr[4] ? (
                                    <img
                                      src={mediaArr[4]}
                                      alt="Post media 5"
                                      loading="lazy"
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'var(--surface-elevated)' }} />
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (mediaArr.length > 1) {
                            return (
                              <div
                                style={{
                                  width: '100%',
                                  display: 'grid',
                                  gridTemplateColumns: '2fr 1fr',
                                  gap: '2px',
                                  background: 'var(--surface-canvas)',
                                }}
                              >
                                <div style={{ height: '300px' }}>
                                  <img
                                    src={mediaArr[0]}
                                    alt="Post media 1"
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '300px' }}>
                                  <img
                                    src={mediaArr[1]}
                                    alt="Post media 2"
                                    loading="lazy"
                                    style={{ width: '100%', height: '50%', objectFit: 'cover', display: 'block' }}
                                  />
                                  {mediaArr[2] ? (
                                    <img
                                      src={mediaArr[2]}
                                      alt="Post media 3"
                                      loading="lazy"
                                      style={{ width: '100%', height: '50%', objectFit: 'cover', display: 'block' }}
                                    />
                                  ) : (
                                    <div style={{ width: '100%', height: '50%', background: 'var(--surface-elevated)' }} />
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div style={{ width: '100%', background: 'var(--surface-elevated)' }}>
                              <img
                                src={mediaArr[0]}
                                alt="Post media"
                                loading="lazy"
                                style={{ width: '100%', maxHeight: '420px', objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          );
                        })()}

                        <div
                          style={{
                            padding: '12px 16px',
                            borderTop: '1px solid var(--hairline-border)',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={() => likeFeedPost(post.id)}
                            className="interactive-press"
                            style={{
                              background: 'var(--surface-elevated)',
                              border: '1px solid var(--hairline-border)',
                              padding: '7px 14px',
                              borderRadius: '99px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '7px',
                              color: post.likes > 0 ? 'var(--teal-300)' : 'var(--ink-primary)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                            }}
                          >
                            <Heart
                              size={16}
                              fill={post.likes > 0 ? 'var(--brand-accent)' : 'none'}
                              color={post.likes > 0 ? 'var(--brand-accent)' : 'var(--ink-secondary)'}
                            />
                            <span>{post.likes || 0}</span>
                          </button>

                          <button
                            onClick={() =>
                              setExpandedComments((prev) => ({
                                ...prev,
                                [post.id]: !prev[post.id],
                              }))
                            }
                            className="interactive-press"
                            style={{
                              background: isCommentsOpen
                                ? 'var(--brand-accent-soft)'
                                : 'var(--surface-elevated)',
                              border: isCommentsOpen
                                ? '1px solid var(--brand-accent)'
                                : '1px solid var(--hairline-border)',
                              padding: '7px 14px',
                              borderRadius: '99px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '7px',
                              color: isCommentsOpen ? 'var(--teal-300)' : 'var(--ink-primary)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                            }}
                          >
                            <MessageCircle
                              size={16}
                              color={isCommentsOpen ? 'var(--teal-300)' : 'var(--ink-secondary)'}
                            />
                            <span>{post.comments || 0}</span>
                          </button>

                          <button
                            onClick={() =>
                              handleShare({
                                title: community?.name || 'More Community Post',
                                text: post.text,
                                url:
                                  typeof window !== 'undefined'
                                    ? `${window.location.origin}/app`
                                    : '',
                              })
                            }
                            className="interactive-press"
                            title="Share post"
                            aria-label="Share post"
                            style={{
                              background: 'var(--surface-elevated)',
                              border: '1px solid var(--hairline-border)',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ink-secondary)',
                              cursor: 'pointer',
                              marginLeft: 'auto',
                            }}
                          >
                            <Share2 size={16} />
                          </button>
                        </div>

                        {isCommentsOpen && <InlineComments post={post} />}
                      </article>
                    );
                  }

                  /* ---- MEMBER IDEA / SUGGESTION ---- */
                  if (item.type === 'idea') {
                    const idea = item.data;
                    const ideaData = item.ideaData || {};
                    const author = users?.find((u) => u.id === idea.authorId);
                    const community = communities?.find((c) => c.id === idea.communityId);
                    const canConvertIdea =
                      (user?.ledCommunities || []).includes(idea.communityId) ||
                      isAdmin ||
                      (communityMemberships?.[idea.communityId] || []).some(
                        (m) =>
                          (m.userId === user?.id || m.user_id === user?.id) &&
                          (m.role === 'Leader' || m.role === 'Co-Leader')
                      );

                    return (
                      <article
                        key={item.id}
                        style={{
                          background: 'var(--surface-card)',
                          border: '1px solid var(--hairline-border-strong)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          display: 'flex',
                        }}
                      >
                        {/* Upvote Rail */}
                        <div
                          style={{
                            padding: '16px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'var(--surface-elevated)',
                            borderRight: '1px solid var(--hairline-border)',
                            minWidth: '68px',
                          }}
                        >
                          <button
                            onClick={() => likeFeedPost(idea.id)}
                            className="interactive-press"
                            aria-label="Upvote idea"
                            style={{
                              background: idea.liked ? 'var(--brand-accent)' : 'var(--surface-card)',
                              border: idea.liked
                                ? '1px solid var(--brand-accent)'
                                : '1px solid var(--hairline-border-strong)',
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: idea.liked ? '#FFFFFF' : 'var(--ink-primary)',
                              cursor: 'pointer',
                              fontWeight: 800,
                            }}
                          >
                            <ChevronUp size={20} strokeWidth={2.75} />
                          </button>
                          <div
                            style={{
                              marginTop: '8px',
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color: 'var(--ink-primary)',
                            }}
                          >
                            {idea.likes || 0}
                          </div>
                          <div
                            style={{
                              fontSize: '0.66rem',
                              color: 'var(--ink-muted)',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
                            Votes
                          </div>
                        </div>

                        {/* Idea Body */}
                        <div style={{ flex: 1, padding: '16px', minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              marginBottom: '8px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.68rem',
                                background: 'var(--brand-accent-soft)',
                                color: 'var(--teal-300)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Suggestion
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                              by {author?.name || 'Member'}
                              {community?.name ? ` in ${community.name}` : ''}
                            </span>
                          </div>

                          <div
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontWeight: 700,
                              color: 'var(--ink-primary)',
                              fontSize: '1.12rem',
                              marginBottom: '8px',
                              lineHeight: 1.3,
                            }}
                          >
                            {ideaData.title || idea.text}
                          </div>

                          {ideaData.location && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.82rem',
                                color: 'var(--ink-muted)',
                                marginBottom: '10px',
                              }}
                            >
                              <MapPin size={14} /> {ideaData.location}
                            </div>
                          )}

                          {ideaData.title && idea.text !== ideaData.title && (
                            <div
                              style={{
                                color: 'var(--ink-secondary)',
                                fontSize: '0.92rem',
                                lineHeight: 1.55,
                                marginBottom: '14px',
                              }}
                            >
                              {idea.text}
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              borderTop: '1px solid var(--hairline-border)',
                              paddingTop: '12px',
                            }}
                          >
                            <button
                              onClick={() =>
                                setExpandedComments((prev) => ({
                                  ...prev,
                                  [idea.id]: !prev[idea.id],
                                }))
                              }
                              className="interactive-press"
                              style={{
                                background: 'var(--surface-elevated)',
                                border: '1px solid var(--hairline-border)',
                                color: 'var(--ink-primary)',
                                padding: '7px 13px',
                                borderRadius: '10px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                gap: '6px',
                                alignItems: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <MessageCircle size={15} color="var(--ink-secondary)" /> Discuss (
                              {idea.comments || 0})
                            </button>

                            {canConvertIdea && (
                              <button
                                onClick={() => {
                                  const q = new URLSearchParams({
                                    tab: 'events',
                                    create_event: 'true',
                                    community: idea.communityId || '',
                                    title: ideaData.title || idea.text,
                                    desc: idea.text,
                                    location: ideaData.location || '',
                                  });
                                  router.push(`/dashboard?${q.toString()}`);
                                }}
                                className="btn btn-primary interactive-press"
                                style={{
                                  padding: '7px 13px',
                                  borderRadius: '10px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Calendar size={14} /> Turn into Event →
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleShare({
                                  title: ideaData.title || idea.text,
                                  text: idea.text,
                                  url:
                                    typeof window !== 'undefined'
                                      ? `${window.location.origin}/app`
                                      : '',
                                })
                              }
                              className="interactive-press"
                              title="Share suggestion"
                              aria-label="Share suggestion"
                              style={{
                                background: 'var(--surface-elevated)',
                                border: '1px solid var(--hairline-border)',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--ink-secondary)',
                                cursor: 'pointer',
                                marginLeft: 'auto',
                              }}
                            >
                              <Share2 size={15} />
                            </button>
                          </div>

                          {expandedComments[idea.id] && (
                            <div style={{ marginTop: '14px' }}>
                              <InlineComments post={idea} />
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }

                  /* ---- EVENT CARD ---- */
                  if (item.type === 'event') {
                    const event = item.data;
                    const isUpcoming = isEventUpcoming(event);
                    const rsvps = eventRsvps[event.id] || [];
                    const community = communities?.find((c) => c.id === event.communityId);
                    const displayDate = formatReadableEventDate(event.date, event.time);

                    return (
                      <article
                        key={item.id}
                        style={{
                          background: 'var(--surface-card)',
                          border: isUpcoming
                            ? '1px solid var(--hairline-border-strong)'
                            : '1px solid var(--hairline-border)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          opacity: isUpcoming ? 1 : 0.85,
                        }}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (community?.id) {
                              router.push(`/community/${getCommunitySlug(community, communities)}`);
                            }
                          }}
                          className="interactive-press"
                          style={{
                            padding: '11px 16px',
                            borderBottom: '1px solid var(--hairline-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.76rem',
                            color: isUpcoming ? 'var(--teal-300)' : 'var(--ink-muted)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                          }}
                        >
                          {isUpcoming ? (
                            <>
                              <Calendar size={14} /> Upcoming in {community?.name || 'Community'}
                            </>
                          ) : (
                            <>
                              <Archive size={14} /> Past Event • {community?.name || 'Community'}
                            </>
                          )}
                        </div>

                        <div
                          onClick={() => router.push(getEventPath(event, events))}
                          className="interactive-press"
                          style={{ cursor: 'pointer' }}
                        >
                          {event.image && (
                            <div
                              style={{
                                height: '180px',
                                background: `var(--surface-elevated) url(${event.image}) center/cover no-repeat`,
                                position: 'relative',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background:
                                    'linear-gradient(to top, rgba(18, 18, 18, 0.55) 0%, transparent 45%)',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '12px',
                                  left: '14px',
                                  background: isUpcoming
                                    ? 'var(--brand-accent)'
                                    : 'rgba(28, 25, 21, 0.86)',
                                  padding: '5px 11px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                {!isUpcoming && <Archive size={12} />}
                                {isUpcoming ? displayDate : `Ended • ${displayDate}`}
                              </div>
                            </div>
                          )}

                          <div style={{ padding: '16px' }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                fontSize: '1.15rem',
                                color: 'var(--ink-primary)',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '8px',
                                lineHeight: 1.25,
                              }}
                            >
                              <span>{event.title}</span>
                              {!isUpcoming && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    background: 'var(--surface-elevated)',
                                    color: 'var(--ink-muted)',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontFamily: 'var(--font-body)',
                                  }}
                                >
                                  Archived
                                </span>
                              )}
                              {event.collabCommunityIds?.length > 0 && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    background: 'var(--brand-accent)',
                                    color: '#FFFFFF',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontFamily: 'var(--font-body)',
                                  }}
                                >
                                  Collab
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '14px',
                                fontSize: '0.84rem',
                                color: 'var(--ink-secondary)',
                                marginBottom: event.description || rsvps.length > 0 ? '12px' : 0,
                                fontWeight: 500,
                              }}
                            >
                              {!event.image && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <Calendar size={14} color="var(--ink-muted)" /> {displayDate}
                                </span>
                              )}
                              {event.time && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <Clock size={14} color="var(--ink-muted)" /> {event.time}
                                </span>
                              )}
                              {event.location && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <MapPin size={14} color="var(--ink-muted)" />{' '}
                                  {cleanLocationName(event.location)}
                                </span>
                              )}
                            </div>

                            {event.description && (
                              <p
                                style={{
                                  margin: rsvps.length > 0 ? '0 0 14px 0' : 0,
                                  fontSize: '0.9rem',
                                  color: 'var(--ink-muted)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.5,
                                }}
                              >
                                {event.description}
                              </p>
                            )}

                            {rsvps.length > 0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.82rem',
                                  color: 'var(--ink-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                <div style={{ display: 'flex' }}>
                                  {rsvps.slice(0, 3).map((r, i) => {
                                    const ru = users?.find((u) => u.id === r.userId);
                                    return (
                                      <img
                                        key={i}
                                        src={resolveUserAvatar(ru)}
                                        alt=""
                                        style={{
                                          width: '26px',
                                          height: '26px',
                                          borderRadius: '50%',
                                          border: '2px solid var(--surface-card)',
                                          marginLeft: i > 0 ? '-8px' : 0,
                                          objectFit: 'cover',
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                                <span>
                                  {rsvps.length} member{rsvps.length === 1 ? '' : 's'} going
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  }

                  return null;
                })
              ) : (
                <div
                  style={{
                    padding: '48px 20px',
                    textAlign: 'center',
                    background: 'var(--surface-card)',
                    borderRadius: '18px',
                    border: '1px dashed var(--hairline-border-strong)',
                  }}
                >
                  <Sparkles
                    size={28}
                    color="var(--brand-accent)"
                    style={{ marginBottom: '12px' }}
                  />
                  <h3
                    style={{
                      margin: '0 0 8px 0',
                      color: 'var(--ink-primary)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.25rem',
                    }}
                  >
                    Nothing to show yet
                  </h3>
                  <p
                    style={{
                      color: 'var(--ink-secondary)',
                      margin: '0 auto 20px',
                      maxWidth: '380px',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                    }}
                  >
                    {activeFeedTab === 'Feed'
                      ? 'Your feed is quiet right now. Join a local community to see updates and upcoming meetups here.'
                      : activeFeedTab === 'Events'
                        ? 'There are no upcoming events in your communities right now.'
                        : 'No suggestions pitched yet. Have an idea for a walk, workshop, or gathering? Pitch it to your community!'}
                  </p>
                  {activeFeedTab === 'Ideas' ? (
                    <button
                      onClick={() => setShowIdeaModal(true)}
                      className="btn btn-primary interactive-press"
                      style={{
                        padding: '11px 20px',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Lightbulb size={16} /> Pitch the First Idea
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/discover')}
                      className="btn btn-primary interactive-press"
                      style={{
                        padding: '11px 20px',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        color: '#FFFFFF',
                        fontWeight: 700,
                      }}
                    >
                      Discover Communities
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile-only Curated Local Clubs Preview */}
            {suggestedCommunities.length > 0 && (
              <section
                className="mobile-only"
                style={{
                  borderTop: '1px solid var(--hairline-border)',
                  paddingTop: '20px',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <h2
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.05rem',
                      color: 'var(--ink-primary)',
                      margin: 0,
                    }}
                  >
                    Explore Nearby
                  </h2>
                  <button
                    onClick={() => router.push('/discover')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--teal-300)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Browse all →
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    paddingBottom: '4px',
                  }}
                >
                  {suggestedCommunities.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/community/${getCommunitySlug(c, communities)}`)}
                      className="interactive-press"
                      style={{
                        flex: '0 0 164px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        background: 'var(--surface-card)',
                        border: '1px solid var(--hairline-border)',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          height: '82px',
                          background: `var(--surface-elevated) url(${c.image || c.cover_image || ''}) center/cover no-repeat`,
                        }}
                      />
                      <div style={{ padding: '10px' }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            color: 'var(--ink-primary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.25,
                            marginBottom: '5px',
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--ink-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          <MapPin size={10} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {getCommunityLocation(c)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mobile-only Single Calm Start a Community Card (non-leaders only) */}
            {!isLeader && (
              <div
                className="mobile-only"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '16px',
                  padding: '18px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Start a Community in Your Area
                </div>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '0.82rem',
                    color: 'var(--ink-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  Free microsite, event ticketing, and member tools — 100% free for local leaders.
                </p>
                <button
                  onClick={() => router.push('/create-community')}
                  className="btn btn-primary interactive-press"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} /> Start a Community
                </button>
              </div>
            )}
          </div>

          {/* ================= RIGHT STICKY SIDEBAR (>= 1024px) ================= */}
          <aside className="desktop-feed-sidebar" style={{ display: 'none' }}>
            {/* Leader / Admin Quick Actions Card */}
            {(isLeader || isAdmin) && (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '16px',
                  padding: '18px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: 'var(--ink-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                    }}
                  >
                    <Sparkles size={15} color="var(--brand-accent)" /> Leader Hub
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {user?.ledCommunities?.length || 0} led
                  </span>
                </div>

                {isLeader && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn btn-primary interactive-press"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    Open Leader Dashboard <ArrowRight size={15} />
                  </button>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {isLeader && (
                    <>
                      <button
                        onClick={() => router.push('/dashboard?tab=events')}
                        className="interactive-press"
                        style={{
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--hairline-border)',
                          borderRadius: '10px',
                          padding: '9px 10px',
                          color: 'var(--ink-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Calendar size={14} color="var(--brand-accent)" /> Host Event
                      </button>
                      <button
                        onClick={() => router.push('/dashboard?tab=members')}
                        className="interactive-press"
                        style={{
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--hairline-border)',
                          borderRadius: '10px',
                          padding: '9px 10px',
                          color: 'var(--ink-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={14} color="var(--brand-accent)" /> Members
                      </button>
                      <button
                        onClick={() => router.push('/dashboard?tab=crm')}
                        className="interactive-press"
                        style={{
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--hairline-border)',
                          borderRadius: '10px',
                          padding: '9px 10px',
                          color: 'var(--ink-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Megaphone size={14} color="var(--brand-accent)" /> Broadcast
                      </button>
                    </>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="interactive-press"
                      style={{
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--hairline-border)',
                        borderRadius: '10px',
                        padding: '9px 10px',
                        color: 'var(--ink-primary)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Shield size={14} color="var(--brand-accent)" /> Admin Panel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming Meetups Card */}
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '16px',
                padding: '18px 16px',
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
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Calendar size={16} color="var(--brand-accent)" /> Upcoming Meetups
                </div>
                <button
                  onClick={() => router.push('/events')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teal-300)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  View all →
                </button>
              </div>

              {upcomingSidebarEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {upcomingSidebarEvents.map((ev) => {
                    const comm = communities?.find((c) => c.id === ev.communityId);
                    const badge = formatBadgeDate(ev.date, ev.time);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => router.push(getEventPath(ev, events))}
                        className="interactive-press"
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '10px',
                          borderRadius: '12px',
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--hairline-border)',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            background: 'var(--brand-accent-soft)',
                            border: '1px solid rgba(235, 87, 56, 0.28)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              color: 'var(--teal-300)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              lineHeight: 1.1,
                            }}
                          >
                            {badge.month}
                          </span>
                          <span
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 800,
                              color: 'var(--ink-primary)',
                              lineHeight: 1.1,
                            }}
                          >
                            {badge.day}
                          </span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              color: 'var(--ink-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {ev.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.73rem',
                              color: 'var(--ink-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                            }}
                          >
                            {comm?.name || cleanLocationName(ev.location)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                  No upcoming meetups scheduled yet.
                </p>
              )}
            </div>

            {/* Explore Nearby / Local Clubs Card */}
            <div
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--hairline-border)',
                borderRadius: '16px',
                padding: '18px 16px',
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
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Compass size={16} color="var(--brand-accent)" /> Local Clubs
                </div>
                <button
                  onClick={() => router.push('/discover')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--teal-300)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Explore →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {suggestedCommunities.slice(0, 3).map((comm) => (
                  <div
                    key={comm.id}
                    onClick={() =>
                      router.push(`/community/${getCommunitySlug(comm, communities)}`)
                    }
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '10px',
                      borderRadius: '12px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={
                        comm.image ||
                        comm.cover_image ||
                        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=80&q=80'
                      }
                      alt={comm.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--ink-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comm.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--ink-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{getCommunityLocation(comm) || 'Local Community'}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={10} /> {getMemberCount(comm)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start a Community Card (non-leaders only) */}
            {!isLeader && (
              <div
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--hairline-border-strong)',
                  borderRadius: '16px',
                  padding: '18px 16px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.96rem',
                    fontWeight: 700,
                    color: 'var(--ink-primary)',
                    marginBottom: '6px',
                  }}
                >
                  Start Your Own Community
                </div>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    color: 'var(--ink-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  Free microsite, zero fees, ticketing, and member tools. 100% free forever for
                  local leaders.
                </p>
                <button
                  onClick={() => router.push('/create-community')}
                  className="btn btn-primary interactive-press"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} /> Launch a Club in 60s
                </button>
              </div>
            )}
          </aside>
        </div>

        <CreateIdeaModal isOpen={showIdeaModal} onClose={() => setShowIdeaModal(false)} />
      </PullToRefresh>
    </div>
  );
}
