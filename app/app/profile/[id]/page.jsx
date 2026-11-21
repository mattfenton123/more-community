"use client";
import { useState, useRef, useMemo } from 'react';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { useAppContext } from '../../../src/context/AppContext';
import { useAuth } from '../../../src/context/AuthContext';
import {
  Users,
  Calendar,
  MapPin,
  Settings,
  Camera,
  Check,
  X,
  MessageCircle,
  Edit3,
  Trophy,
  Flame,
  Plus,
  Compass,
  Star,
  LogOut,
  ChevronRight,
  Shield,
  BarChart2,
  Heart,
  Eye,
} from 'lucide-react';
import AppHeader from '../../../src/components/AppHeader';
import { useToast } from '../../../src/components/Toast';
import GamificationPanel, { BadgeRow, useGamification } from '../../../src/components/Gamification';
import { FALLBACK_IMAGES } from '../../../src/lib/constants';
import ProfileImageModal from '../../../src/components/ProfileImageModal';
import { getEventPath } from '../../../src/lib/eventLinks';
import { getCommunitySlug } from '../../../src/lib/communityLinks';
import { isCommunityPubliclyListed } from '../../../src/lib/communityVisibility';
import { getCommunityLocation } from '../../../src/lib/location';
import { parseEventDateTime } from '../../../src/lib/calendar';
import { resolveUserAvatar } from '../../../src/lib/avatar';


const BANNER_PRESETS = [
  { label: 'Woodland Trail', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Weald Sunrise', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Campfire Circle', url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Wild Swim Lake', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Ridgeway Horizon', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Coffee & Social', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80' },
];

const LOCAL_TOWNS = [
  'Tunbridge Wells',
  'Tonbridge',
  'Sevenoaks',
  'Crowborough',
  'Heathfield',
  'Wadhurst',
  'Mayfield',
  'Paddock Wood',
  'East Grinstead',
];

const MEETUP_VIBES = [
  '👋 Happy to buddy with first-timers',
  '🚗 Open to carpooling',
  '🐕 Brings a friendly dog',
  '🌱 New to the area',
  '☕ Up for post-event coffee',
  '🥾 Gentle / social pace',
  '🏃 Active / brisk pace',
];

const CURATED_INTERESTS = [
  'Hiking & Outdoors',
  'Running',
  'Wild Swimming',
  "Men's Circles",
  "Women's Circles",
  'Mindfulness',
  'Coffee & Social',
  'Dog Walking',
  'Cycling',
  'Cold Plunge',
  'Yoga & Movement',
  'Book Clubs',
  'Live Music',
  'Arts & Crafts',
  'Volunteering',
  'Food & Drink',
];

function formatReadableDate(dateStr, timeStr) {
  const dt = parseEventDateTime(dateStr, timeStr);
  if (dt && !isNaN(dt.getTime())) {
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return dateStr || 'Date TBC';
}

export default function UserProfile() {
  const params = useParams();
  const id = params?.id;
  const navigate = useNavigate();
  const {
    users,
    communities,
    communityMemberships,
    user: currentUser,
    updateUser,
    uploadImage,
    events,
    experiences,
    eventRsvps,
    savedItems,
    unsaveItem,
    isLoading,
  } = useAppContext();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const targetId = id || currentUser?.id;
  const profileUser = useMemo(() => {
    if (!targetId) return null;
    return (users || []).find((u) => u.id === targetId) || (targetId === currentUser?.id ? currentUser : null);
  }, [users, targetId, currentUser]);

  const isOwnProfile = Boolean(targetId && currentUser?.id && targetId === currentUser.id);
  const isLeader = Boolean((currentUser?.ledCommunities?.length || 0) > 0 || currentUser?.leaderOf);
  const { standing, streak, earnedBadges } = useGamification(targetId);
  const { hasVerifiedMeetup: viewerHasVerifiedMeetup } = useGamification(currentUser?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    headline: '',
    location: '',
    bio: '',
    vibes: [],
    interests: [],
    instagram: '',
    website: '',
    banner: FALLBACK_IMAGES.general,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('badges');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const joinedCommunities = useMemo(() => {
    if (!targetId) return [];
    const joinedIds = new Set();
    Object.entries(communityMemberships || {}).forEach(([commId, mems]) => {
      if ((mems || []).some((m) => (m.userId || m.user_id) === targetId)) {
        joinedIds.add(commId);
      }
    });
    if (isOwnProfile) {
      (currentUser?.joinedCommunities || []).forEach((cid) => joinedIds.add(cid));
    }
    return (communities || []).filter(
      (c) => joinedIds.has(c.id) && (isOwnProfile || isCommunityPubliclyListed(c))
    );
  }, [communityMemberships, targetId, communities, isOwnProfile, currentUser?.joinedCommunities]);

  const eventsAttended = useMemo(() => {
    if (!targetId) return 0;
    let count = 0;
    Object.values(eventRsvps || {}).forEach((rsvps) => {
      if ((rsvps || []).some((r) => (r.userId || r.user_id) === targetId && r.status === 'going')) {
        count++;
      }
    });
    return count;
  }, [eventRsvps, targetId]);

  const sharesCommunityWithTarget = useMemo(() => {
    if (isOwnProfile || !currentUser?.id || !targetId) return false;
    const sharedUserIds = new Set();
    (currentUser.joinedCommunities || []).forEach((communityId) => {
      const members = communityMemberships?.[communityId] || [];
      members.forEach((m) => sharedUserIds.add(m.userId || m.user_id));
    });
    return sharedUserIds.has(targetId);
  }, [isOwnProfile, currentUser, targetId, communityMemberships]);

  const isTargetLeader = useMemo(() => {
    if (!targetId) return false;
    if ((communities || []).some((c) => c.leader_id === targetId || c.creator_id === targetId)) return true;
    return Object.values(communityMemberships || {}).some((mems) =>
      (mems || []).some((m) => (m.userId || m.user_id) === targetId && (m.role === 'Leader' || m.role === 'Co-Leader'))
    );
  }, [targetId, communities, communityMemberships]);

  const canMessageTarget = Boolean(
    isTargetLeader || currentUser?.isAdmin || (sharesCommunityWithTarget && viewerHasVerifiedMeetup)
  );

  // Saved items split cleanly across Communities, Events, and Experiences
  const savedCommunities = useMemo(
    () => (communities || []).filter((c) => (savedItems || []).includes(c.id) && isCommunityPubliclyListed(c)),
    [communities, savedItems]
  );
  const savedEvents = useMemo(
    () => (events || []).filter((e) => (savedItems || []).includes(e.id)),
    [events, savedItems]
  );
  const savedExperiences = useMemo(
    () => (experiences || []).filter((e) => (savedItems || []).includes(e.id)),
    [experiences, savedItems]
  );
  const totalSavedCount = savedCommunities.length + savedEvents.length + savedExperiences.length;

  const openEditMode = () => {
    if (!profileUser) return;
    const initialHeadline =
      profileUser.headline ||
      (profileUser.role && profileUser.role !== 'Member' && profileUser.role !== 'Leader' ? profileUser.role : '');
    setEditForm({
      name: profileUser.name || '',
      headline: initialHeadline,
      location: profileUser.location || '',
      bio: profileUser.bio === 'New here.' ? '' : (profileUser.bio || ''),
      vibes: Array.isArray(profileUser.vibes) ? profileUser.vibes : [],
      interests: Array.isArray(profileUser.interests) ? profileUser.interests : [],
      instagram: profileUser.instagram || '',
      website: profileUser.website || '',
      banner: profileUser.banner || FALLBACK_IMAGES.general,
    });
    setCustomInterestInput('');
    setIsEditing(true);
  };

  if (isLoading && !profileUser) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', paddingBottom: '100px' }}>
        <AppHeader title="Profile" showBack={true} />
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-muted)' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', paddingBottom: '100px' }}>
        <AppHeader title="Profile" showBack={true} />
        <div
          style={{
            maxWidth: '420px',
            margin: '48px auto',
            padding: '32px 24px',
            textAlign: 'center',
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border-strong)',
            borderRadius: '20px',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)', margin: '0 0 8px' }}>
            {!currentUser?.id && !id ? 'Sign in to view your profile' : 'Member not found'}
          </h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.88rem', margin: '0 0 20px' }}>
            {!currentUser?.id && !id
              ? 'Manage your communities, saved events, badges, and account settings.'
              : 'This member profile could not be found.'}
          </p>
          <button
            onClick={() => navigate.push(!currentUser?.id && !id ? '/login?redirect=/profile' : '/discover')}
            className="btn btn-primary interactive-press"
            style={{ borderRadius: '999px', padding: '10px 22px', color: '#FFFFFF', fontWeight: 700 }}
          >
            {!currentUser?.id && !id ? 'Sign In / Join' : 'Back to Discover'}
          </button>
        </div>
      </div>
    );
  }

  const handleAvatarClick = () => {
    if (isOwnProfile && isEditing) {
      fileInputRef.current?.click();
    } else {
      setSelectedImageModal({
        imageUrl: resolveUserAvatar(profileUser),
        name: profileUser.name,
        subtitle: isOwnProfile ? 'Your Profile Picture' : `${profileUser.name}'s Profile Picture`,
        isOwnProfile,
        onEditPhoto: isOwnProfile ? () => fileInputRef.current?.click() : null,
      });
    }
  };

  const handleBannerClick = () => {
    if (!isEditing) {
      setSelectedImageModal({
        imageUrl: profileUser.banner || FALLBACK_IMAGES.general,
        name: profileUser.name,
        subtitle: isOwnProfile ? 'Your Cover Banner' : `${profileUser.name}'s Cover Banner`,
        isOwnProfile,
        onEditPhoto: isOwnProfile ? () => bannerInputRef.current?.click() : null,
      });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file, 'avatars');
      await updateUser(targetId, { avatar: publicUrl });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const publicUrl = await uploadImage(file, 'banners');
      if (isEditing) {
        setEditForm((prev) => ({ ...prev, banner: publicUrl }));
      } else {
        await updateUser(targetId, { banner: publicUrl });
      }
      toast.success('Cover banner updated!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name required', 'Please enter your display name.');
      return;
    }
    try {
      await updateUser(targetId, {
        name: editForm.name.trim(),
        headline: editForm.headline.trim(),
        location: editForm.location.trim(),
        bio: editForm.bio.trim(),
        vibes: editForm.vibes,
        interests: editForm.interests,
        instagram: editForm.instagram.trim().replace(/^@/, ''),
        website: editForm.website.trim(),
        banner: editForm.banner,
      });
      setIsEditing(false);
      toast.success('Profile Updated ✓', 'Your member profile has been saved.');
    } catch {
      toast.error('Failed to save profile');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate.push('/login');
    } catch {
      toast.error('Sign out failed');
    }
  };

  const quickActions = [
    ...(currentUser?.isAdmin
      ? [{ icon: Shield, label: 'Admin Hub', desc: 'Platform management', color: '#DC2626', href: '/admin' }]
      : []),
    ...(isLeader
      ? [{ icon: BarChart2, label: 'Leader Dashboard', desc: 'Manage your communities & events', color: 'var(--brand-accent)', href: '/dashboard' }]
      : [{ icon: Plus, label: 'Start a Community', desc: 'Create and lead your own local group', color: 'var(--brand-accent)', href: '/create-community' }]),
    { icon: Compass, label: 'Discover Communities', desc: 'Find groups near you', color: '#265E4F', href: '/discover' },
    { icon: Calendar, label: 'Browse Events', desc: "See what's happening locally", color: '#2563EB', href: '/events' },
    { icon: Shield, label: 'Community Standing', desc: 'In-person trust tiers & active locals', color: '#265E4F', href: '/leaderboard' },
    { icon: Settings, label: 'Settings', desc: 'Account & theme preferences', color: 'var(--ink-secondary)', href: '/settings' },
  ];

  const firstName = (profileUser.name || 'Member').split(' ')[0];

  return (
    <div
      className="view-profile"
      style={{
        paddingBottom: '100px',
        minHeight: '100dvh',
        background: 'var(--surface-canvas)',
        width: '100%',
      }}
    >
      <AppHeader
        title={isOwnProfile ? 'Profile' : profileUser.name}
        showBack={true}
        rightElement={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isOwnProfile && canMessageTarget && (
              <button
                className="btn btn-primary interactive-press"
                onClick={() => navigate.push(`/chat/dm/${targetId}`)}
                style={{
                  height: '34px',
                  padding: '0 14px',
                  borderRadius: '999px',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                <MessageCircle size={14} /> Message
              </button>
            )}

            {isOwnProfile && !isEditing && (
              <>
                <button
                  className="interactive-press"
                  onClick={openEditMode}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  className="interactive-press"
                  onClick={() => navigate.push('/settings')}
                  aria-label="Settings"
                  title="Settings"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Settings size={16} />
                </button>
              </>
            )}

            {isOwnProfile && isEditing && (
              <>
                <button
                  className="interactive-press"
                  onClick={() => setIsEditing(false)}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    borderRadius: '999px',
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--hairline-border-strong)',
                    color: 'var(--ink-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  className="btn btn-primary interactive-press"
                  onClick={handleSave}
                  style={{
                    height: '34px',
                    padding: '0 14px',
                    borderRadius: '999px',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  <Check size={14} strokeWidth={2.5} /> Save
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Centered Editorial Profile Shell */}
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          margin: '0 auto',
          padding: '16px 20px 0',
          boxSizing: 'border-box',
        }}
      >
        {/* Hero Banner Card */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--hairline-border)',
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              height: '180px',
              background: `var(--surface-elevated) url(${isEditing ? editForm.banner : profileUser.banner || FALLBACK_IMAGES.general}) center/cover no-repeat`,
              position: 'relative',
              cursor: !isEditing ? 'pointer' : 'default',
            }}
            onClick={handleBannerClick}
            title={!isEditing ? 'Click to view cover banner' : undefined}
          >
            {isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  bannerInputRef.current?.click();
                }}
                className="interactive-press"
                style={{
                  position: 'absolute',
                  right: '14px',
                  bottom: '14px',
                  background: 'rgba(20, 18, 15, 0.78)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '6px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 20,
                }}
              >
                <Camera size={14} /> Change Cover
              </button>
            )}
          </div>
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {/* Avatar + Identity */}
          <div style={{ padding: '0 22px 24px', marginTop: '-56px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{ position: 'relative', marginBottom: '12px', cursor: 'pointer', display: 'inline-block' }}
                onClick={handleAvatarClick}
                className="interactive-hover"
                title={isOwnProfile && isEditing ? 'Click to change avatar' : 'Click to view full picture'}
                onMouseEnter={(e) => {
                  const overlay = e.currentTarget.querySelector('.avatar-zoom-overlay');
                  if (overlay) overlay.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  const overlay = e.currentTarget.querySelector('.avatar-zoom-overlay');
                  if (overlay) overlay.style.opacity = '0';
                }}
              >
                <div style={{ position: 'relative', borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={resolveUserAvatar(profileUser)}
                    alt={profileUser.name}
                    style={{
                      width: '108px',
                      height: '108px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid var(--surface-card)',
                      background: 'var(--surface-elevated)',
                      opacity: isUploading ? 0.5 : 1,
                      display: 'block',
                    }}
                  />
                  {!isEditing && (
                    <div
                      className="avatar-zoom-overlay"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'rgba(18, 18, 18, 0.42)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <Eye size={22} color="#FFFFFF" />
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 4,
                      borderRadius: '50%',
                      background: 'rgba(18, 18, 18, 0.52)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                    }}
                  >
                    <Camera size={24} />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {/* Level Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'var(--brand-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid var(--surface-card)',
                  }}
                >
                  <span title={standing?.name || 'Member'} style={{ fontSize: '0.9rem', lineHeight: 1 }}>
                    {standing?.emoji || '🌱'}
                  </span>
                </div>
              </div>

              {isEditing ? (
                <div style={{ width: '100%', maxWidth: '580px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '6px' }}>
                  {/* Photo & Cover Presets */}
                  <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Photos &amp; Cover Theme
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="interactive-press"
                          style={{ padding: '5px 11px', borderRadius: '999px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Camera size={12} /> Upload Avatar
                        </button>
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          className="interactive-press"
                          style={{ padding: '5px 11px', borderRadius: '999px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Camera size={12} /> Upload Cover
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: '8px' }}>
                      {BANNER_PRESETS.map((preset) => {
                        const isSelected = editForm.banner === preset.url;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setEditForm((prev) => ({ ...prev, banner: preset.url }))}
                            className="interactive-press"
                            style={{
                              height: '46px',
                              borderRadius: '10px',
                              background: `url(${preset.url}) center/cover no-repeat`,
                              border: isSelected ? '2.5px solid var(--brand-accent)' : '1px solid var(--hairline-border-strong)',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                            title={preset.label}
                          >
                            <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0.1))', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '4px', color: '#FFFFFF', fontSize: '0.63rem', fontWeight: 700, lineHeight: 1.1 }}>
                              {preset.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Identity &Headline */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '5px' }}>
                        Display Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input"
                        placeholder="e.g. Matt Fenton"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '5px' }}>
                        Headline / Tagline
                      </label>
                      <input
                        type="text"
                        value={editForm.headline}
                        onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                        className="input"
                        placeholder="e.g. Trail walker, founder & weekend coffee fan"
                        maxLength={80}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Local Town / Base */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '5px' }}>
                      Local Base / Home Town
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="input"
                      placeholder="e.g. Tunbridge Wells, Kent"
                      style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {LOCAL_TOWNS.map((town) => {
                        const active = editForm.location.toLowerCase() === town.toLowerCase();
                        return (
                          <button
                            key={town}
                            type="button"
                            onClick={() => setEditForm((prev) => ({ ...prev, location: active ? '' : town }))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              background: active ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                              color: active ? '#FFFFFF' : 'var(--ink-secondary)',
                              border: active ? '1px solid var(--brand-accent)' : '1px solid var(--hairline-border)',
                              cursor: 'pointer',
                            }}
                          >
                            📍 {town}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)' }}>
                        About You
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                        {(editForm.bio || '').length}/280
                      </span>
                    </div>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value.slice(0, 280) })}
                      className="input"
                      placeholder="Share what brings you to local meetups, your favourite trails or activities, or what you enjoy chatting about..."
                      style={{ width: '100%', minHeight: '92px', resize: 'vertical', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Meetup Vibes & Icebreakers */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                      Meetup Vibe &amp; Preferences
                    </label>
                    <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                      Let fellow members know how you like to connect at events:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {MEETUP_VIBES.map((vibe) => {
                        const selected = (editForm.vibes || []).includes(vibe);
                        return (
                          <button
                            key={vibe}
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                vibes: selected
                                  ? prev.vibes.filter((v) => v !== vibe)
                                  : [...(prev.vibes || []), vibe],
                              }))
                            }
                            style={{
                              padding: '6px 12px',
                              borderRadius: '999px',
                              fontSize: '0.77rem',
                              fontWeight: selected ? 700 : 500,
                              background: selected ? 'var(--brand-secondary-soft)' : 'var(--surface-elevated)',
                              color: selected ? 'var(--brand-secondary)' : 'var(--ink-secondary)',
                              border: selected ? '1.5px solid var(--brand-secondary)' : '1px solid var(--hairline-border)',
                              cursor: 'pointer',
                            }}
                          >
                            {vibe}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Interests Picker */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                      Your Interests ({editForm.interests.length} selected)
                    </label>
                    <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                      Tap topics to personalise your event matches and connect with like-minded members:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '10px' }}>
                      {Array.from(new Set([...CURATED_INTERESTS, ...(editForm.interests || [])])).map((interest) => {
                        const active = (editForm.interests || []).includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                interests: active
                                  ? prev.interests.filter((i) => i !== interest)
                                  : [...(prev.interests || []), interest],
                              }))
                            }
                            style={{
                              padding: '6px 12px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: active ? 700 : 500,
                              background: active ? 'var(--brand-accent)' : 'var(--surface-elevated)',
                              color: active ? '#FFFFFF' : 'var(--ink-secondary)',
                              border: active ? '1.5px solid var(--brand-accent)' : '1px solid var(--hairline-border)',
                              cursor: 'pointer',
                            }}
                          >
                            {active ? '✓ ' : '+ '}{interest}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={customInterestInput}
                        onChange={(e) => setCustomInterestInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInterestInput.trim()) {
                            e.preventDefault();
                            const tag = customInterestInput.trim();
                            if (!editForm.interests.includes(tag)) {
                              setEditForm((prev) => ({ ...prev, interests: [...prev.interests, tag] }));
                            }
                            setCustomInterestInput('');
                          }
                        }}
                        className="input"
                        placeholder="Add custom interest (e.g. Trail Photography, Padel)..."
                        style={{ flex: 1, fontSize: '0.82rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const tag = customInterestInput.trim();
                          if (!tag) return;
                          if (!editForm.interests.includes(tag)) {
                            setEditForm((prev) => ({ ...prev, interests: [...prev.interests, tag] }));
                          }
                          setCustomInterestInput('');
                        }}
                        className="interactive-press"
                        style={{
                          padding: '0 14px',
                          borderRadius: '10px',
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--hairline-border-strong)',
                          color: 'var(--ink-primary)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Optional Social Links */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '5px' }}>
                        Instagram Handle (optional)
                      </label>
                      <input
                        type="text"
                        value={editForm.instagram}
                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                        className="input"
                        placeholder="@yourhandle"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '5px' }}>
                        Website or LinkedIn (optional)
                      </label>
                      <input
                        type="text"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="input"
                        placeholder="https://..."
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Save / Cancel Footer */}
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="interactive-press"
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'var(--surface-elevated)',
                        border: '1px solid var(--hairline-border-strong)',
                        color: 'var(--ink-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="btn btn-primary interactive-press"
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        color: '#FFFFFF',
                      }}
                    >
                      <Check size={16} strokeWidth={2.5} /> Save Profile
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1
                    style={{
                      margin: '0 0 4px 0',
                      fontSize: '1.55rem',
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--ink-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {profileUser.name}
                  </h1>
                  {(profileUser.headline || (profileUser.role && profileUser.role !== 'Member')) && (
                    <div style={{ color: 'var(--teal-300)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', maxWidth: '480px' }}>
                      {profileUser.headline || profileUser.role}
                    </div>
                  )}

                  {/* Trust, Location & Activity Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '10px' }}>
                    {profileUser.location && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--ink-primary)',
                          background: 'var(--surface-elevated)',
                          border: '1px solid var(--hairline-border-strong)',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin size={12} color="var(--brand-accent)" /> {profileUser.location}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: standing?.color || 'var(--ink-secondary)',
                        background: standing?.bgSoft || 'var(--surface-elevated)',
                        border: `1px solid ${standing?.borderSoft || 'var(--hairline-border)'}`,
                        padding: '4px 11px',
                        borderRadius: '99px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span>{standing?.emoji || '🌱'}</span>
                      <span>{standing?.name || 'Newcomer'}</span>
                      {eventsAttended > 0 && (
                        <span style={{ opacity: 0.85 }}>
                          • {eventsAttended} {eventsAttended === 1 ? 'meetup' : 'meetups'}
                        </span>
                      )}
                    </span>
                    {streak > 0 && (
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: '#DC2626',
                          background: 'rgba(220, 38, 38, 0.1)',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          border: '1px solid rgba(220, 38, 38, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Flame size={12} /> {streak}w streak
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--ink-muted)',
                      fontSize: '0.78rem',
                      marginBottom: '10px',
                    }}
                  >
                    <Calendar size={12} /> Member since{' '}
                    {profileUser.joined && !isNaN(new Date(profileUser.joined).getTime())
                      ? new Date(profileUser.joined).toLocaleDateString('en-GB', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'June 2025'}
                  </div>

                  <p
                    style={{
                      margin: '0 0 12px 0',
                      color: 'var(--ink-secondary)',
                      fontSize: '0.92rem',
                      lineHeight: 1.55,
                      maxWidth: '500px',
                    }}
                  >
                    {profileUser.bio && profileUser.bio !== 'New here.'
                      ? profileUser.bio
                      : isOwnProfile
                      ? 'Tap Edit to add a short bio, your local town, and your meetup preferences.'
                      : 'No bio yet.'}
                  </p>

                  {/* Meetup Vibe Chips */}
                  {Array.isArray(profileUser.vibes) && profileUser.vibes.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        maxWidth: '540px',
                      }}
                    >
                      {profileUser.vibes.map((vibe) => (
                        <span
                          key={vibe}
                          style={{
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            background: 'var(--surface-elevated)',
                            color: 'var(--ink-primary)',
                            padding: '4px 10px',
                            borderRadius: '99px',
                            border: '1px solid var(--hairline-border-strong)',
                          }}
                        >
                          {vibe}
                        </span>
                      ))}
                    </div>
                  )}

                  <BadgeRow userId={targetId} maxShow={6} />

                  {profileUser.interests && profileUser.interests.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        justifyContent: 'center',
                        marginTop: '12px',
                      }}
                    >
                      {profileUser.interests.map((interest) => (
                        <span
                          key={interest}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            background: 'var(--brand-accent-soft)',
                            color: 'var(--teal-300)',
                            padding: '4px 10px',
                            borderRadius: '99px',
                            border: '1px solid rgba(235, 87, 56, 0.26)',
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Social Links if provided */}
                  {(profileUser.instagram || profileUser.website) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
                      {profileUser.instagram && (
                        <a
                          href={`https://instagram.com/${profileUser.instagram.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="interactive-press"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--ink-secondary)',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--hairline-border)',
                            padding: '4px 11px',
                            borderRadius: '99px',
                            textDecoration: 'none',
                          }}
                        >
                          📸 @{profileUser.instagram.replace(/^@/, '')}
                        </a>
                      )}
                      {profileUser.website && (
                        <a
                          href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="interactive-press"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--ink-secondary)',
                            background: 'var(--surface-elevated)',
                            border: '1px solid var(--hairline-border)',
                            padding: '4px 11px',
                            borderRadius: '99px',
                            textDecoration: 'none',
                          }}
                        >
                          🔗 Website
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Single Clean 4-Stat Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Groups', value: joinedCommunities.length, color: '#2563EB' },
            { label: 'Events', value: eventsAttended, color: 'var(--brand-accent)' },
            { label: 'Badges', value: earnedBadges.length, color: '#15803D' },
            { label: 'Streak', value: `${streak}w`, color: '#DC2626' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: '12px 8px',
                background: 'var(--surface-card)',
                borderRadius: '14px',
                border: '1px solid var(--hairline-border)',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stat.color }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--ink-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '2px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Message Action (other profile only) */}
        {!isOwnProfile && (
          <div style={{ marginBottom: '20px' }}>
            {canMessageTarget ? (
              <button
                onClick={() => navigate.push(`/chat/dm/${targetId}`)}
                className="btn btn-primary interactive-press"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <MessageCircle size={18} /> Message {firstName}{isTargetLeader ? ' (Community Leader)' : ''}
              </button>
            ) : sharesCommunityWithTarget ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px 16px',
                  background: 'var(--surface-card)',
                  borderRadius: '14px',
                  border: '1px solid var(--hairline-border-strong)',
                  color: 'var(--ink-secondary)',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: 'var(--ink-primary)' }}>🛡️ Verified Local Unlock:</strong> Attend your first in-person meetup to unlock 1:1 direct messages with fellow members (you can always message Community Leaders directly).
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px 16px',
                  background: 'var(--surface-card)',
                  borderRadius: '14px',
                  border: '1px solid var(--hairline-border)',
                  color: 'var(--ink-secondary)',
                  fontSize: '0.88rem',
                }}
              >
                Join a shared community to connect with {firstName}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions (own profile only) */}
        {isOwnProfile && !isEditing && (
          <div style={{ marginBottom: '22px' }}>
            <h2
              style={{
                fontSize: '0.74rem',
                color: 'var(--ink-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                margin: '0 0 10px 0',
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--surface-card)',
                borderRadius: '16px',
                border: '1px solid var(--hairline-border)',
                overflow: 'hidden',
              }}
            >
              {quickActions.map((action, i) => (
                <button
                  key={action.label}
                  onClick={() => navigate.push(action.href)}
                  className="interactive-press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '13px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--hairline-border)',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--hairline-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <action.icon size={17} color={action.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink-primary)', fontSize: '0.9rem' }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{action.desc}</div>
                  </div>
                  <ChevronRight size={16} color="var(--ink-muted)" />
                </button>
              ))}

              <button
                onClick={handleSignOut}
                className="interactive-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '13px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(220, 38, 38, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <LogOut size={17} color="#DC2626" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#DC2626', fontSize: '0.9rem' }}>Sign Out</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Log out of your account
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Standard Segmented Control */}
        <div style={{ marginBottom: '20px' }}>
          <div className="segmented-control">
            {[
              { id: 'badges', label: `Badges (${earnedBadges.length})` },
              { id: 'communities', label: `Communities (${joinedCommunities.length})` },
              ...(isOwnProfile ? [{ id: 'saved', label: `Saved (${totalSavedCount})` }] : []),
            ].map((tab) => (
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

        {/* Badges Tab */}
        {activeTab === 'badges' && <GamificationPanel userId={targetId} hideStats={true} />}

        {/* Communities Tab */}
        {activeTab === 'communities' && (
          <div style={{ marginBottom: '24px' }}>
            {joinedCommunities.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: 'var(--surface-card)',
                  borderRadius: '16px',
                  border: '1px dashed var(--hairline-border-strong)',
                }}
              >
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                  Not a member of any communities yet.
                </p>
                <button
                  onClick={() => navigate.push('/discover')}
                  className="btn btn-primary interactive-press"
                  style={{ borderRadius: '999px', color: '#FFFFFF', fontWeight: 700 }}
                >
                  Discover Communities
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '14px',
                }}
              >
                {joinedCommunities.map((comm) => (
                  <div
                    key={comm.id}
                    onClick={() => navigate.push(`/community/${getCommunitySlug(comm, communities)}`)}
                    className="interactive-press"
                    style={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border)',
                    }}
                  >
                    <div
                      style={{
                        height: '110px',
                        background: `var(--surface-elevated) url(${comm.image || comm.cover_image || FALLBACK_IMAGES.community}) center/cover no-repeat`,
                      }}
                    />
                    <div style={{ padding: '12px' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          color: 'var(--ink-primary)',
                          fontSize: '0.92rem',
                          lineHeight: 1.25,
                          marginBottom: '4px',
                        }}
                      >
                        {comm.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--ink-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin size={11} /> {getCommunityLocation(comm)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Tab (Communities + Events + Experiences) */}
        {activeTab === 'saved' && isOwnProfile && (
          <div style={{ marginBottom: '24px' }}>
            {totalSavedCount === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: 'var(--surface-card)',
                  borderRadius: '16px',
                  border: '1px dashed var(--hairline-border-strong)',
                }}
              >
                <div
                  style={{
                    margin: '0 auto 14px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--brand-accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-accent)',
                  }}
                >
                  <Heart size={22} />
                </div>
                <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                  You haven&apos;t saved any communities, events, or experiences yet.
                </p>
                <button
                  onClick={() => navigate.push('/discover')}
                  className="btn btn-primary interactive-press"
                  style={{ borderRadius: '999px', color: '#FFFFFF', fontWeight: 700 }}
                >
                  Explore Communities
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {savedCommunities.map((comm) => (
                  <div
                    key={comm.id}
                    onClick={() => navigate.push(`/community/${getCommunitySlug(comm, communities)}`)}
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={comm.image || comm.cover_image || FALLBACK_IMAGES.community}
                      alt={comm.name}
                      style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--teal-300)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Community
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {comm.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                        {getCommunityLocation(comm)}
                      </div>
                    </div>
                    <button
                      aria-label="Remove saved community"
                      onClick={(e) => {
                        e.stopPropagation();
                        unsaveItem?.(comm.id);
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
                ))}

                {savedEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate.push(getEventPath(event, events))}
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={event.image || FALLBACK_IMAGES.event}
                      alt={event.title}
                      style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--teal-300)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Event
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} /> {formatReadableDate(event.date, event.time)}
                      </div>
                    </div>
                    <button
                      aria-label="Remove saved event"
                      onClick={(e) => {
                        e.stopPropagation();
                        unsaveItem?.(event.id);
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
                ))}

                {savedExperiences.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => navigate.push(`/checkout/experience/${exp.id}`)}
                    className="interactive-press"
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline-border)',
                      borderRadius: '14px',
                      padding: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={exp.image || FALLBACK_IMAGES.general}
                      alt={exp.title}
                      style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.68rem', color: '#B45309', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                        Experience
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                        {exp.title}
                      </div>
                    </div>
                    <button
                      aria-label="Remove saved experience"
                      onClick={(e) => {
                        e.stopPropagation();
                        unsaveItem?.(exp.id);
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile / Cover Image Modal */}
      {selectedImageModal && (
        <ProfileImageModal
          isOpen={Boolean(selectedImageModal)}
          imageUrl={selectedImageModal.imageUrl}
          name={selectedImageModal.name}
          subtitle={selectedImageModal.subtitle}
          isOwnProfile={selectedImageModal.isOwnProfile}
          onEditPhoto={selectedImageModal.onEditPhoto}
          onClose={() => setSelectedImageModal(null)}
        />
      )}
    </div>
  );
}
