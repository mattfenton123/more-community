"use client";
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Share2, Users, Calendar, Settings, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, Camera, Mail, Activity, Sparkles, MapPin, Clock, Star, MessageCircle, Heart, BadgeCheck, Globe, Trash2, Flag, Search, Briefcase, Check, X, MessageSquare, Lightbulb, Info, Megaphone, Video, Plus, Shield, Play } from 'lucide-react';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { useAppContext } from '../../../src/context/AppContext';
import { useFeed } from '../../../src/context/FeedContext';
import { useToast } from '../../../src/components/Toast';
import PhotoGallery from '../../../src/components/PhotoGallery';
import MemberDirectory from '../../../src/components/MemberDirectory';
import InlineComments from '../../../src/components/InlineComments';
import ExperiencesCatalog from '../../../src/components/ExperiencesCatalog';
import CreateServiceModal from '../../../src/components/CreateServiceModal';
import CreateIdeaModal from '../../../src/components/CreateIdeaModal';
import ReviewsList from '../../../src/components/ReviewsList';
import ReviewForm from '../../../src/components/ReviewForm';
import ReelViewer from '../../../src/components/ReelViewer';
import dynamic from 'next/dynamic';
import { downloadIcs } from '../../../src/lib/calendar';

const VideoUploader = dynamic(() => import('../../../src/components/VideoUploader'), { ssr: false });

import confetti from 'canvas-confetti';

// Category-specific gallery photos (generated unique images)
const IMG = '/images/communities';
const GALLERY_PHOTOS = {
  running: [
    `${IMG}/parkrun.webp`,
    `${IMG}/gallery-running-1.webp`,
    `${IMG}/gallery-running-2.webp`,
  ],
  walking: [
    `${IMG}/ramblers.webp`,
    `${IMG}/gallery-walking-1.webp`,
    `${IMG}/az-challenge.webp`,
  ],
  wellness: [
    `${IMG}/mindful-miles.webp`,
    `${IMG}/yoga-collective.webp`,
    `${IMG}/gallery-yoga-1.webp`,
  ],
  business: [
    `${IMG}/entrepreneurs.webp`,
    `${IMG}/gallery-running-2.webp`,
    `${IMG}/interfaith.webp`,
  ],
  creative: [
    `${IMG}/creative-collective.webp`,
    `${IMG}/gallery-creative-1.webp`,
    `${IMG}/good-neighbours.webp`,
  ],
  volunteering: [
    `${IMG}/good-neighbours.webp`,
    `${IMG}/interfaith.webp`,
    `${IMG}/gallery-walking-1.webp`,
  ],
  default: [
    `${IMG}/parkrun.webp`,
    `${IMG}/good-neighbours.webp`,
    `${IMG}/gallery-adventure-1.webp`,
  ]
};

// Mock reviews per community type removed

function getGalleryType(tags) {
  const tagStr = (tags || []).join(' ').toLowerCase();
  if (tagStr.includes('running') || tagStr.includes('fitness')) return 'running';
  if (tagStr.includes('walking') || tagStr.includes('adventure')) return 'walking';
  if (tagStr.includes('wellness') || tagStr.includes('yoga')) return 'wellness';
  if (tagStr.includes('business') || tagStr.includes('professional')) return 'business';
  if (tagStr.includes('creative') || tagStr.includes('art')) return 'creative';
  if (tagStr.includes('volunteering')) return 'volunteering';
  return 'default';
}

export default function CommunityProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, communities, events, communityMemberships, users, eventRsvps, uploadImage, joinCommunity, leaveCommunity, experiences, services, updateServiceStatus, reviews, updateCommunity, sponsors, sponsorshipAssignments, addCommunityHighlight } = useAppContext();
  const { feedPosts, createFeedPost, likeFeedPost, deleteFeedPost } = useFeed();
  const { toast } = useToast();
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [expandedComments, setExpandedComments] = useState({});
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const fileInputRef = useRef(null);
  
  const communityId = id || (user.joinedCommunities.length > 0 ? user.joinedCommunities[0] : 'tw-tech-meetup');
  const community = communities.find(c => c.id === communityId);

  if (!community) {
    return <div style={{ padding: '40px', color: 'var(--white)', textAlign: 'center' }}>Loading...</div>;
  }

  const isMember = user.joinedCommunities.includes(communityId);
  const isLeader = community.leader_id === user?.id || 
                   user?.ledCommunities?.includes(communityId) || 
                   (communityMemberships[communityId] || []).some(m => (m.userId === user?.id || m.user_id === user?.id) && (m.role === 'co-founder' || m.role === 'Leader'));
  const communityEvents = events.filter(e => e.communityId === communityId || e.collabCommunityIds?.includes(communityId));
  const upcomingEvents = communityEvents.filter(e => {
    try { return new Date(e.date) >= new Date(); } catch { return true; }
  });
  const leaderUser = users.find(u => u.id === community.leader_id);
  const memberList = (communityMemberships[communityId] || []).map(m => users.find(u => u.id === m.userId || u.id === m.user_id)).filter(Boolean);
  const galleryType = getGalleryType(community.tags);
  const dbPhotos = (community.gallery_photos || []).map(p => typeof p === 'string' ? { url: p, uploaderId: null } : p);
  const stockPhotos = GALLERY_PHOTOS[galleryType].map(url => ({ url, uploaderId: 'stock' }));
  const galleryPhotos = [...dbPhotos, ...stockPhotos];
  const nextEvent = upcomingEvents[0] || communityEvents[0];
  const communityFeed = feedPosts?.filter(p => p.communityId === communityId) || [];
  
  // Real reviews
  const communityReviews = (reviews || [])
    .filter(r => r.target_id === communityId && r.target_type === 'community')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const topReviews = communityReviews.slice(0, 3);

  const handleShare = async () => {
    const shareData = { title: community.name, text: community.description, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { /* ignore */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!', 'Share this community with friends');
    }
  };

  const handleCreatePost = async (overrideText = null) => {
    const textToPost = overrideText !== null ? overrideText : newPostText;
    if (!textToPost.trim() && !newPostImage) return;
    
    let mediaUrl = null;
    if (newPostImage) {
      try {
        toast.info('Uploading image...', 'Please wait');
        mediaUrl = await uploadImage(newPostImage);
      } catch (err) {
        toast.error('Upload failed', 'Could not upload image');
        return;
      }
    }
    
    await createFeedPost(communityId, textToPost, mediaUrl, isAnnouncement, isPinned);
    if (overrideText === null) {
      setNewPostText('');
      setNewPostImage(null);
      setIsAnnouncement(false);
      setIsPinned(false);
    }
    toast.success('Posted!', 'Your update is now live.');
  };

  const handleJoinLeave = async () => {
    try {
      if (isMember) {
        setShowLeaveModal(true);
      } else {
        await joinCommunity(community.id);
        toast.success('Welcome!', `You're now a member of ${community.name}`);
      }
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const confirmLeave = async () => {
    try {
      await leaveCommunity(community.id);
      toast.info('Left community', `You've left ${community.name}`);
      setShowLeaveModal(false);
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      toast.info('Uploading photo...', 'Please wait');
      const url = await uploadImage(file);
      const newPhoto = { url, uploaderId: user?.id };
      const currentGallery = community?.gallery_photos || [];
      await updateCommunity(community.id, { gallery_photos: [newPhoto, ...currentGallery] });
      toast.success('Photo added!', 'Your photo is now in the gallery.');
    } catch (err) {
      toast.error('Upload failed', 'Could not upload photo');
    }
    setIsUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoIndex, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      const currentGallery = community?.gallery_photos || [];
      const updatedGallery = currentGallery.filter((_, idx) => idx !== photoIndex);
      await updateCommunity(community.id, { gallery_photos: updatedGallery });
      toast.success("Photo deleted");
    } catch (err) {
      toast.error("Failed to delete photo");
    }
  };

  const handleGenerateFomoReel = async (event) => {
    toast.info('Generating FOMO Reel...', 'Pulling photos & attendees');
    
    // Pick 5 random photos from the gallery
    const allPhotos = [...(community?.gallery_photos || [])];
    const shuffledPhotos = allPhotos.sort(() => 0.5 - Math.random());
    const selectedPhotos = shuffledPhotos.slice(0, 5);
    
    // Pick up to 2 random RSVPs to tag
    const rsvps = eventRsvps[event.id] || [];
    const attendeesToTag = rsvps
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map(r => users.find(u => u.id === r.userId)?.name?.split(' ')[0] || 'Member')
      .map(name => `@${name}`);
      
    const tagsStr = attendeesToTag.length > 0 ? `Massive thanks to ${attendeesToTag.join(', ')} for bringing the energy to ${event.title}.` : `Massive thanks to everyone who brought the energy to ${event.title}!`;
    const fomoText = `🔥 WHAT A VIBE! 🔥\n\n${tagsStr}\n\nIf you missed it, you missed out! Make sure to RSVP to the next one! 🚀`;

    try {
      // Store array of image URLs as a JSON string in post.media
      const mediaPayload = JSON.stringify(selectedPhotos);
      await createFeedPost(communityId, fomoText, mediaPayload);
      toast.success('FOMO Reel Published!', 'Check the feed to see it in action.');
      setActiveTab('feed');
    } catch (err) {
      toast.error('Failed to generate Reel', err.message);
    }
  };

  const handlePitchPost = async (text, mediaUrl = null) => {
    if (!text.trim() && !mediaUrl) return;
    try {
      await createFeedPost(communityId, text, mediaUrl);
      setNewPostText('');
      setNewPostImage(null);
      toast.success('Post created!', 'Your post has been added to the feed.');
    } catch (err) {
      toast.error('Failed to post', err.message);
    }
  };

  const handlePitchExperience = (experience) => {
    const userMessage = prompt(`Add a message for pitching "${experience.title}":`, "I think this would be really fun for us!");
    if (userMessage === null) return;
    
    const pitchText = `🚀 **CAMPAIGN:** [${experience.id}]\n${userMessage}\n\n📍 Location: ${experience.location}\n⏱ Duration: ${experience.duration}\n💰 Price: £${experience.basePrice}\n\n*Click "I'm Interested" to support the idea!*`;
    handlePitchPost(pitchText, experience.image);
    setActiveTab('feed');
  };

  return (
    <div className="view-profile" style={{ background: 'var(--slate-950)', minHeight: '100dvh', paddingBottom: '80px', width: '100%' }}>
      <div className="microsite-container">
        
        {/* ===== HERO SECTION ===== */}
      <div style={{ 
        height: '380px', 
        background: community.image ? `url(${community.image})` : `linear-gradient(135deg, var(--teal-500), var(--slate-900))`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative' 
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(15,23,42,1) 100%)' }}></div>
        
        {/* Nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
          <button className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate.back()}>
            <ChevronLeft />
          </button>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="more." style={{ height: '20px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>

            {isLeader && (
              <button className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)', backdropFilter: 'blur(10px)', color: 'var(--teal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate.push('/dashboard')}>
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Hero Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', zIndex: 10 }}>
          {/* Tags */}
          {community.tags && community.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {community.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', color: 'var(--white)', padding: '4px 10px', borderRadius: '99px', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', color: 'var(--white)', margin: 0, lineHeight: 1.1 }}>
              {community.name}
            </h1>
            {community.verified && <BadgeCheck size={28} color="#3b82f6" style={{ flexShrink: 0 }} />}
          </div>
          
          {/* Meta strip */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {community.location_name || 'Tunbridge Wells'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {community.members || memberList.length || 1} members</span>
            {community.activity_level && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14} color="var(--teal-400)" /> {community.activity_level === 'Very Active' ? 'Very Active (Weekly)' : community.activity_level === 'Active' ? 'Active (Fortnightly)' : community.activity_level === 'Casual' ? 'Casual (Monthly)' : community.activity_level}</span>
            )}
          </div>

          {/* CTA */}
          {(() => {
            const subPrice = community.subscription_price || community.subscriptionPrice || 0;
            const isPaid = subPrice > 0 && !isMember;
            return (
              <>
                {isMember ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                      ✓ You're a Member
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleJoinLeave(); }} 
                      className="interactive-press" 
                      style={{ position: 'relative', zIndex: 100, background: 'none', border: 'none', color: 'var(--slate-400)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Leave Community
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary interactive-press" 
                    style={{ position: 'relative', zIndex: 100, width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '14px', boxShadow: '0 8px 24px rgba(20,184,166,0.3)', cursor: 'pointer' }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleJoinLeave(); }}
                  >
                    {isPaid ? `Join — £${subPrice}/month` : 'Join this Community — it\'s free'}
                  </button>
                )}
                {isPaid && !isMember && (
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '8px' }}>
                    Cancel anytime. You won't be charged during the trial period.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* ===== ORGANISER CARD (always visible) ===== */}
      <div style={{ padding: '0 20px', marginTop: '-1px' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '14px', 
          padding: '16px 20px', background: 'rgba(255,255,255,0.03)', 
          borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '20px'
        }}>
          <img 
            src={leaderUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=0D8B93&color=fff`} 
            alt="Organiser" 
            onClick={() => leaderUser && navigate.push(`/profile/${leaderUser.id}`)}
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--teal-500)', cursor: leaderUser ? 'pointer' : 'default' }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organised by</div>
            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '1rem' }}>{leaderUser?.name || 'Community Team'}</div>
          </div>
          <button onClick={() => leaderUser && navigate.push(`/chat/dm/${leaderUser.id}`)} className="btn btn-outline interactive-press" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <MessageCircle size={14} /> Message
          </button>
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
          // Hide scrollbar for Chrome, Safari and Opera
          paddingBottom: '8px',
          margin: '0 -20px', // allow scroll to edge
          padding: '4px 20px 8px 20px', // restore padding including edges
        }} className="no-scrollbar">
          {[
            { id: 'about', label: 'About', Icon: Info },
            { id: 'events', label: 'Events', Icon: Calendar },
            { id: 'reviews', label: 'Reviews', Icon: Star },
            { id: 'photos', label: 'Gallery', Icon: ImageIcon },
            { id: 'feed', label: 'Feed', Icon: MessageSquare },
            { id: 'services', label: 'Services', Icon: Briefcase },
            { id: 'suggestions', label: 'Ideas', Icon: Lightbulb },
            { id: 'members', label: 'Members', Icon: Users }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="interactive-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px', 
                borderRadius: '100px', 
                border: '1px solid',
                borderColor: activeTab === tab.id ? 'rgba(20,184,166,0.3)' : 'rgba(255,255,255,0.06)',
                background: activeTab === tab.id ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? 'var(--teal-300)' : 'var(--slate-300)',
                fontWeight: 600, 
                fontSize: '0.85rem', 
                cursor: 'pointer', 
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(20,184,166,0.1)' : 'none'
              }}
            >
              <tab.Icon size={16} style={{ opacity: activeTab === tab.id ? 1 : 0.7 }} />
              {tab.label}
            </button>
          ))}
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
      </div>

      {/* ===== HIGHLIGHTS STORY RINGS ===== */}
      <div style={{ padding: '0 20px 24px 20px', display: 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory' }} className="no-scrollbar">
        {/* Upload Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowUploader(true)}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(20,184,166,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Plus size={24} color="var(--teal-400)" />
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--teal-500)', borderRadius: '50%', padding: '4px', border: '2px solid var(--slate-950)' }}>
              <Video size={10} color="#000" />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)', fontWeight: 500 }}>Add</span>
        </div>

        {/* Highlight Rings */}
        {community?.highlights?.map((highlight, idx) => (
          <div key={highlight.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowReelViewer(idx)}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', padding: '2px', background: 'linear-gradient(45deg, var(--teal-400), var(--blue-500))' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--slate-950)', background: '#000', position: 'relative' }}>
                <video src={highlight.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
                <Play size={16} color="rgba(255,255,255,0.8)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-300)', fontWeight: 500, maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlight.title || 'Highlight'}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ===== FEED TAB ===== */}
        {activeTab === 'feed' && (
          <>
            {(isMember || isLeader) && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="You" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <textarea 
                      placeholder="Share an update with the community..." 
                      value={newPostText}
                      onChange={e => setNewPostText(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--white)', resize: 'none', outline: 'none', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.95rem' }}
                    />
                    {newPostImage && (
                      <div style={{ position: 'relative', marginTop: '8px', display: 'inline-block' }}>
                        <img src={URL.createObjectURL(newPostImage)} alt="Preview" style={{ height: '80px', borderRadius: '8px' }} />
                        <button onClick={() => setNewPostImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--slate-800)', border: 'none', color: 'var(--white)', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <label style={{ cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewPostImage(e.target.files[0])} />
                          <ImageIcon size={16} /> Add Media
                        </label>
                        {isLeader && (
                          <>
                            <label style={{ cursor: 'pointer', color: isAnnouncement ? 'var(--amber-400)' : 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', transition: 'color 0.2s' }}>
                              <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} style={{ display: 'none' }} />
                              <Megaphone size={16} /> Announcement
                            </label>
                            {isAnnouncement && (
                              <label style={{ cursor: 'pointer', color: isPinned ? 'var(--teal-400)' : 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', transition: 'color 0.2s' }}>
                                <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} style={{ display: 'none' }} />
                                <MapPin size={16} style={{ transform: 'rotate(45deg)' }} /> Pin
                              </label>
                            )}
                          </>
                        )}
                      </div>
                      <button onClick={() => handleCreatePost()} disabled={!newPostText.trim() && !newPostImage} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '20px' }}>
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {communityFeed.length > 0 ? communityFeed.sort((a,b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return 0;
              }).map(post => {
                const author = users.find(u => u.id === post.authorId) || leaderUser;
                const isCampaign = post.text?.includes('🚀 **CAMPAIGN:**');
                const isSuggestion = post.text?.includes('💡 **SUGGESTION:**');
                const isReview = post.text?.startsWith('⭐️⭐️⭐️⭐️⭐️');
                
                let wrapperStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' };
                if (isCampaign) {
                  wrapperStyle = { background: 'var(--slate-900)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(20,184,166,0.05)' };
                } else if (isSuggestion) {
                  wrapperStyle = { background: 'var(--slate-900)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '4px solid var(--amber-500)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(245,158,11,0.05)' };
                } else if (isReview) {
                  wrapperStyle = { background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(15,23,42,1))', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '16px', overflow: 'hidden' };
                } else if (post.is_announcement || post.isAnnouncement) {
                  wrapperStyle = { background: 'var(--slate-900)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '16px', overflow: 'hidden', position: 'relative' };
                }

                return (
                  <div key={post.id} style={wrapperStyle}>
                    {(post.is_announcement || post.isAnnouncement) && (
                      <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber-400)', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(245,158,11,0.1)' }}>
                        <Megaphone size={14} /> ANNOUNCEMENT
                        {post.is_pinned && <MapPin size={12} style={{ marginLeft: 'auto', transform: 'rotate(45deg)' }} />}
                      </div>
                    )}
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img onClick={() => author && navigate(`/profile/${author.id}`)} src={author?.avatar || 'https://i.pravatar.cc/40'} alt={author?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', cursor: author ? 'pointer' : 'default' }} />
                      <div style={{ flex: 1 }}>
                        <div onClick={() => author && navigate(`/profile/${author.id}`)} style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: author ? 'pointer' : 'default' }}>
                          {author?.name || 'Community Leader'}
                          {post.text?.includes('💡 **SUGGESTION:**') && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(234,179,8,0.2)', color: 'var(--yellow-400)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Idea</span>
                          )}
                          {community.leader_id === author?.id && (
                            <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'var(--white)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Leader</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          {(post.createdAt || post.created_at || post.timestamp) && !isNaN(new Date(post.createdAt || post.created_at || post.timestamp).getTime()) 
                            ? new Date(post.createdAt || post.created_at || post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Recently'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(isLeader || post.authorId === user?.id) && (
                          <button onClick={() => deleteFeedPost(post.id)} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--rose-400)', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                        {post.authorId !== user?.id && (
                          <button onClick={() => toast.success('Report submitted', 'Thank you for keeping the community safe.')} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}>
                            <Flag size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ padding: '0 16px 12px', color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {(() => {
                        let campaignExp = null;
                        let campaignText = post.text;
                        
                        if (isCampaign) {
                          const match = post.text.match(/🚀 \*\*CAMPAIGN:\*\* \[([a-zA-Z0-9-]+)\]/);
                          if (match) {
                            campaignExp = experiences.find(e => e.id === match[1]);
                            campaignText = post.text.replace(/🚀 \*\*CAMPAIGN:\*\* \[([a-zA-Z0-9-]+)\]\n/, '');
                          }
                        } else if (isSuggestion) {
                          campaignText = post.text.replace('💡 **SUGGESTION:**', '').trim();
                        } else if (isReview) {
                          campaignText = post.text.split('review: "')[1]?.slice(0, -1) || post.text;
                        }
                        
                        if (isCampaign && campaignExp) {
                          const votes = post.likes || 0;
                          const threshold = 20;
                          const progress = Math.min((votes / threshold) * 100, 100);
                          return (
                            <div style={{ padding: '0px', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <img src={campaignExp.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '1rem', marginBottom: '4px' }}>{campaignExp.title}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span><MapPin size={12} style={{ display: 'inline', marginRight: '2px' }} /> {campaignExp.location}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ marginTop: '16px' }}>
                                <button onClick={() => navigate.push(`/experiences/${campaignExp.id}`)} className="interactive-press" style={{ width: '100%', marginBottom: '16px', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--teal-400)', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)', cursor: 'pointer', fontWeight: 600 }}>
                                  View Experience Details
                                </button>
                                <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 12px 0' }}>{campaignText}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: '6px', fontWeight: 600 }}>
                                  <span>Campaign Progress</span>
                                  <span>{votes} / {threshold} Interested</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal-500)', transition: 'width 0.5s ease' }} />
                                </div>
                                {progress >= 100 && (
                                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--yellow-400)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Sparkles size={14} /> Goal Reached! Waiting for Leader to schedule.
                                    </div>
                                    {isLeader && (
                                      <button onClick={() => navigate.push(`/community/${communityId}/create-event?experienceId=${campaignExp.id}`)} className="btn btn-primary interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'fit-content', borderRadius: '8px' }}>
                                        Set Date & Schedule
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } else if (isSuggestion) {
                          return (
                            <div style={{ padding: '0px', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--amber-400)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Lightbulb size={16} /> Community Suggestion
                              </div>
                              <p style={{ color: 'var(--white)', fontSize: '1.05rem', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{campaignText}</p>
                            </div>
                          );
                        } else if (isReview) {
                          return (
                            <div style={{ padding: '0px', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', gap: '4px', color: 'var(--yellow-400)', marginBottom: '12px' }}>
                                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                              </div>
                              <p style={{ color: 'var(--white)', fontSize: '1.05rem', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>"{campaignText}"</p>
                            </div>
                          );
                        } else {
                          return post.text;
                        }
                      })()}
                    </div>

                    {(() => {
                      if (!post.media) return null;
                      
                      let mediaArr = [post.media];
                      try {
                        const parsed = JSON.parse(post.media);
                        if (Array.isArray(parsed)) mediaArr = parsed;
                      } catch (e) {
                        // Not JSON, assume it's a single URL
                      }
                      
                      if (mediaArr.length >= 4) {
                        return (
                          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: 'var(--slate-950)' }}>
                            <div style={{ height: '300px' }}>
                              <img src={mediaArr[0]} alt="Post media 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', height: '300px' }}>
                              <img src={mediaArr[1]} alt="Post media 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <img src={mediaArr[2]} alt="Post media 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <img src={mediaArr[3]} alt="Post media 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {mediaArr[4] ? (
                                <img src={mediaArr[4]} alt="Post media 5" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--slate-800)' }}></div>
                              )}
                            </div>
                          </div>
                        );
                      } else if (mediaArr.length > 1) {
                        // Render Collage (3 images)
                        return (
                          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2px', background: 'var(--slate-950)' }}>
                            <div style={{ height: '300px' }}>
                              <img src={mediaArr[0]} alt="Post media 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '300px' }}>
                              <img src={mediaArr[1]} alt="Post media 2" style={{ width: '100%', height: '50%', objectFit: 'cover' }} />
                              {mediaArr[2] ? (
                                <img src={mediaArr[2]} alt="Post media 3" style={{ width: '100%', height: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '50%', background: 'var(--slate-800)' }}></div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      
                      // Render Single Image
                      return (
                        <div style={{ width: '100%', background: 'var(--slate-900)' }}>
                          <img src={mediaArr[0]} alt="Post media" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                        </div>
                      );
                    })()}

                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                      {(() => {
                        const isCampaign = post.text?.includes('🚀 **CAMPAIGN:**');
                        const isSuggestion = post.text?.includes('💡 **SUGGESTION:**');
                        const isIdea = isCampaign || isSuggestion;
                        
                        if (isIdea) {
                          return (
                            <button 
                              onClick={() => likeFeedPost(post.id)}
                              className="interactive-press" 
                              style={{ background: post.liked ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid', borderColor: post.liked ? 'rgba(20,184,166,0.3)' : 'transparent', display: 'flex', alignItems: 'center', gap: '6px', color: post.liked ? 'var(--teal-400)' : 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                            >
                              <Heart size={16} fill={post.liked ? 'var(--teal-400)' : 'none'} />
                              {isCampaign ? "I'm Interested" : "Upvote"} ({post.likes || 0})
                            </button>
                          );
                        }
                        
                        return (
                          <button onClick={() => likeFeedPost(post.id)} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: post.liked ? 'var(--teal-400)' : 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <Heart size={16} fill={post.liked ? "currentColor" : "none"} /> {post.likes || 0}
                          </button>
                        );
                      })()}
                      <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: expandedComments[post.id] ? 'var(--teal-400)' : 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <MessageCircle size={16} /> {post.comments || 0}
                      </button>
                    </div>
                    {expandedComments[post.id] && (
                      <InlineComments post={post} />
                    )}
                  </div>
                );
              }) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📝</div>
                  <p style={{ color: 'var(--slate-400)', margin: 0 }}>No updates yet. Check back soon!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== SUGGESTIONS TAB ===== */}
        {activeTab === 'suggestions' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--yellow-400)" /> Drawing Board
              </h3>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '16px' }}>
                Got an idea for an event or trip? Post it here! If it gets enough support, the leader can turn it into an official event.
              </p>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button 
                  onClick={() => leaderUser ? navigate.push(`/chat/dm/${leaderUser.id}`) : toast.error('No Leader', 'This community does not have a designated leader.')}
                  className="btn btn-outline interactive-press" 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', borderColor: 'rgba(255,255,255,0.1)', opacity: leaderUser ? 1 : 0.5 }}
                >
                  <MessageCircle size={16} /> Message Leader Privately
                </button>
              </div>

              {/* Suggestion Form */}
              {isMember ? (
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--white)', margin: 0 }}>Browse Experiences to Pitch</h4>
                    <button 
                      onClick={() => setShowIdeaModal(true)}
                      className="btn btn-outline interactive-press"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      Or Pitch Custom Idea
                    </button>
                  </div>
                  <ExperiencesCatalog onPitchExperience={handlePitchExperience} />
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '32px' }}>
                  <p style={{ color: 'var(--slate-400)', margin: '0 0 12px 0' }}>You must be a member to pitch an event.</p>
                  <button onClick={handleJoinLeave} className="btn btn-primary interactive-press" style={{ padding: '8px 16px', borderRadius: '99px' }}>
                    Join Community
                  </button>
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '1rem', color: 'var(--white)', marginBottom: '16px' }}>Active Campaigns & Suggestions</h4>
            {communityFeed.filter(p => p.text?.includes('💡 **SUGGESTION:**') || p.text?.includes('🚀 **CAMPAIGN:**')).length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                <p style={{ color: 'var(--slate-400)' }}>No active campaigns yet. Pitch an experience above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {communityFeed.filter(p => p.text?.includes('💡 **SUGGESTION:**') || p.text?.includes('🚀 **CAMPAIGN:**')).map(post => {
                  const author = users.find(u => u.id === post.authorId);
                  const isCampaign = post.text?.includes('🚀 **CAMPAIGN:**');
                  let campaignExp = null;
                  let campaignText = post.text;
                  
                  if (isCampaign) {
                    const match = post.text.match(/🚀 \*\*CAMPAIGN:\*\* \[([a-zA-Z0-9-]+)\]/);
                    if (match) {
                      campaignExp = experiences.find(e => e.id === match[1]);
                      campaignText = post.text.replace(/🚀 \*\*CAMPAIGN:\*\* \[([a-zA-Z0-9-]+)\]\n/, '');
                    }
                  } else {
                    campaignText = post.text.replace('💡 **SUGGESTION:**', '').trim();
                  }

                  const votes = post.likes || 0;
                  const threshold = 10;
                  const progress = Math.min((votes / threshold) * 100, 100);

                  return (
                    <div key={post.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <img src={author?.avatar || 'https://i.pravatar.cc/150'} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {author?.name}
                            {isCampaign && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'var(--white)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Campaign</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                            {(post.timestamp || post.createdAt || post.created_at) && !isNaN(new Date(post.timestamp || post.createdAt || post.created_at).getTime())
                              ? new Date(post.timestamp || post.createdAt || post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                              : 'Recently'}
                          </div>
                        </div>
                      </div>
                      
                      {isCampaign && campaignExp && (
                        <div style={{ background: 'var(--slate-900)', borderRadius: '12px', padding: '12px', marginBottom: '16px', border: '1px solid rgba(20,184,166,0.2)' }}>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <img src={campaignExp.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '1rem', marginBottom: '4px' }}>{campaignExp.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span><MapPin size={12} style={{ display: 'inline', marginRight: '2px' }} /> {campaignExp.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ marginTop: '16px' }}>
                            <button onClick={() => navigate.push(`/experiences/${campaignExp.id}`)} className="interactive-press" style={{ width: '100%', marginBottom: '16px', padding: '8px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--teal-400)', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)', cursor: 'pointer', fontWeight: 600 }}>
                              View Experience Details
                            </button>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-300)', marginBottom: '6px', fontWeight: 600 }}>
                              <span>Campaign Progress</span>
                              <span>{votes} / {threshold} Interested</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal-500)', transition: 'width 0.5s ease' }} />
                            </div>
                            {progress >= 100 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--yellow-400)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Sparkles size={14} /> Goal Reached! Waiting for Leader to schedule.
                                </div>
                                {isLeader && (
                                  <button onClick={() => navigate.push(`/community/${communityId}/create-event?experienceId=${campaignExp.id}`)} className="btn btn-primary interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'fit-content', borderRadius: '8px' }}>
                                    Set Date & Schedule
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!isCampaign ? (
                        <div style={{ background: 'var(--slate-900)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '4px solid var(--amber-500)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--amber-400)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Lightbulb size={16} /> Community Suggestion
                          </div>
                          <p style={{ color: 'var(--white)', fontSize: '1.05rem', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{campaignText}</p>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 12px 0' }}>{campaignText}</p>
                      )}
                      {post.mediaUrl && <img src={post.mediaUrl} alt="Attached media" style={{ width: '100%', borderRadius: '12px', marginBottom: '12px', maxHeight: '200px', objectFit: 'cover' }} />}
                      
                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                        <button 
                          onClick={() => {
                            const isLiked = post.liked;
                            likeFeedPost(post.id);
                            if (isCampaign && !isLiked && votes + 1 === threshold) {
                              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                            }
                          }}
                          className="interactive-press" 
                          style={{ background: post.liked ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid', borderColor: post.liked ? 'rgba(20,184,166,0.3)' : 'transparent', display: 'flex', alignItems: 'center', gap: '6px', color: post.liked ? 'var(--teal-400)' : 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                        >
                          <Heart size={16} fill={post.liked ? 'var(--teal-400)' : 'none'} />
                          {isCampaign ? "I'm Interested" : "Upvote"} ({votes})
                        </button>
                        <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: expandedComments[post.id] ? 'var(--teal-400)' : 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <MessageCircle size={16} />
                          {post.comments?.length || 0}
                        </button>
                      </div>
                      {expandedComments[post.id] && (
                        <div style={{ marginTop: '16px' }}>
                          <InlineComments post={post} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== REVIEWS TAB ===== */}
        {activeTab === 'reviews' && (
          <ReviewsList communityId={communityId} onAddReview={() => {
            if (!isMember) {
              toast.error('Members Only', 'You must be a member to leave a review.');
            } else {
              setShowReviewForm(true);
            }
          }} />
        )}

        {/* ===== ABOUT TAB ===== */}
        {activeTab === 'about' && (
          <>
            {/* Leader Editing Prompt */}
            {isLeader && (
              <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(20,184,166,0.1)', border: '1px dashed var(--teal-500)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Sparkles size={20} color="var(--teal-400)" />
                  <div>
                    <div style={{ color: 'var(--teal-300)', fontWeight: 600, fontSize: '0.95rem' }}>Edit Community Profile</div>
                    <div style={{ color: 'var(--slate-300)', fontSize: '0.85rem' }}>Add a welcome video, update pricing, or change social links.</div>
                  </div>
                </div>
                <button onClick={() => navigate.push('/dashboard?tab=settings')} className="btn btn-primary interactive-press" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  Edit Settings
                </button>
              </div>
            )}

            {/* Welcome Video */}
            {community.welcome_video_url ? (
              <div style={{ marginBottom: '32px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <iframe 
                  width="100%" 
                  height="220" 
                  src={community.welcome_video_url} 
                  title="Welcome Video" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              </div>
            ) : isLeader ? (
              <div onClick={() => navigate.push('/dashboard?tab=settings')} className="interactive-press" style={{ marginBottom: '32px', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                <Camera size={24} color="var(--slate-400)" style={{ margin: '0 auto 8px' }} />
                <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.95rem' }}>Add a Welcome Video</div>
                <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>Introduce yourself and welcome new members.</div>
              </div>
            ) : null}

            {/* Community Supporters */}
            {(() => {
              const supporters = sponsorshipAssignments
                .filter(a => a.target_id === communityId && a.target_type === 'community')
                .map(a => sponsors.find(s => s.id === a.sponsor_id))
                .filter(Boolean);
                
              if (supporters.length > 0) {
                return (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0' }}>Community Supporters</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      {supporters.map(sponsor => (
                        <div key={sponsor.id} onClick={() => navigate.push(`/sponsors/${sponsor.id}`)} className="interactive-press" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'white', overflow: 'hidden', padding: '4px', flexShrink: 0 }}>
                            <img src={sponsor.logo} alt={sponsor.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>{sponsor.tier === 'Headline' ? 'Headline Sponsor' : 'Community Supporter'}</div>
                            <div style={{ fontSize: '1.1rem', color: 'var(--white)', fontWeight: 700 }}>{sponsor.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Description & Accordion */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0' }}>What we're about</h3>
              
              {/* Vibe Check */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(236,72,153,0.1)', color: 'var(--pink-400)', fontSize: '0.8rem', fontWeight: 600 }}>✨ {community.activity_level === 'Very Active' ? 'High Energy' : 'Chill Vibes'}</span>
                {community.tags?.slice(0, 2).map((tag, idx) => (
                   <span key={idx} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', color: 'var(--blue-400)', fontSize: '0.8rem', fontWeight: 600 }}>🔥 {tag}</span>
                ))}
              </div>

              <div style={{ 
                position: 'relative', 
                lineHeight: 1.8, 
                color: 'var(--slate-200)', 
                fontSize: '1rem',
                maxHeight: showFullDesc ? 'none' : '150px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease'
              }}>
                {community.description?.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '0 0 12px 0', minHeight: line.trim() === '' ? '12px' : 'auto' }}>{line}</p>
                ))}
                
                {!showFullDesc && (
                  <div style={{ 
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px', 
                    background: 'linear-gradient(to bottom, transparent, var(--slate-950))',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '8px'
                  }}>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="interactive-press"
                style={{ 
                  marginTop: '8px', width: '100%', padding: '12px', borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--teal-400)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                }}
              >
                {showFullDesc ? 'Show Less' : (
                  <>Show <img src="/images/logo.webp" alt="more." style={{ height: '14px', filter: 'brightness(0) invert(1)', opacity: 0.8 }} /></>
                )}
              </button>
            </div>

            {/* Key Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--teal-400)' }}>
                  <Users size={20} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Who It's For</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 500, lineHeight: 1.4 }}>All ages & abilities welcome. No experience needed.</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--teal-400)' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>£</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Cost</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 500, lineHeight: 1.4 }}>{community.cost || community.metrics?.cost || 'Free to join'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--teal-400)' }}>
                  <Calendar size={20} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>How Often</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 500, lineHeight: 1.4 }}>{community.activity_level === 'Very Active' ? 'Weekly meetups' : community.activity_level === 'Active' ? 'Fortnightly' : 'Monthly'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--teal-400)' }}>
                  <MapPin size={20} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Location</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--white)', fontWeight: 500, lineHeight: 1.4 }}>{community.location_name || 'Tunbridge Wells, Kent'}</div>
              </div>
            </div>

            {/* External Links */}
            {community.external_links && community.external_links.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--teal-400)" /> Community Links
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {community.external_links.map((link, idx) => {
                     let IconComponent = Globe;
                     const titleLower = (link.title || '').toLowerCase();
                     const urlLower = (link.url || '').toLowerCase();
                     if (titleLower.includes('strava') || urlLower.includes('strava')) IconComponent = Activity;
                     if (titleLower.includes('whatsapp') || urlLower.includes('whatsapp')) IconComponent = MessageCircle;
                     
                     let displayUrl = link.url;
                     try { displayUrl = new URL(link.url).hostname.replace('www.', ''); } catch(e) {}

                     return (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textDecoration: 'none', color: 'var(--white)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)' }}>
                            <IconComponent size={20} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{link.title}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '2px' }}>{displayUrl}</div>
                          </div>
                          <ChevronRight size={18} color="var(--slate-500)" />
                        </a>
                     )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Events List */}
            {upcomingEvents.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="var(--teal-400)" /> Upcoming Events
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcomingEvents.map(evt => (
                    <div 
                      key={evt.id}
                      onClick={() => navigate.push(`/events/${evt.id}`)} 
                      className="interactive-press"
                      style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex' }}
                    >
                      {evt.image && (
                        <div style={{ width: '100px', flexShrink: 0, background: `url(${evt.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        </div>
                      )}
                      <div style={{ padding: '16px', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--teal-300)', fontWeight: 600, marginBottom: '6px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {evt.date}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {evt.time}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--white)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {evt.title}
                          {evt.communityId !== communityId && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'var(--white)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Collab</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {evt.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What Members Say */}
            {topReviews.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageCircle size={20} color="var(--teal-400)" /> What Members Say
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topReviews.map(review => {
                    const author = users.find(u => u.id === review.user_id) || {};
                    return (
                      <div key={review.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: 'var(--white)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '12px', fontStyle: 'italic' }}>"{review.content}"</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={author.avatar || `https://ui-avatars.com/api/?name=${author.name}&background=random`} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                          <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', fontWeight: 500 }}>{author.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Get In Touch */}
            {leaderUser && (
              <div style={{ marginBottom: '32px', padding: '20px', background: 'rgba(20,184,166,0.05)', borderRadius: '16px', border: '1px solid rgba(20,184,166,0.2)' }}>
                <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0' }}>Get in Touch</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={leaderUser.avatar || `https://ui-avatars.com/api/?name=${leaderUser.name}&background=0D8B93&color=fff`} alt="" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--slate-800)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--white)' }}>{leaderUser.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Community Organiser</div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate.push(`/chat/dm/${leaderUser.id}`)}
                  className="btn btn-primary interactive-press"
                  style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <MessageCircle size={18} /> Message Organiser
                </button>
              </div>
            )}


            {/* Promoted Experiences (Marketplace) */}
            {experiences && experiences.filter(exp => exp.promotedBy === community.id).length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--teal-400)" /> Trips & Retreats
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {experiences.filter(exp => exp.promotedBy === community.id).map(exp => {
                    const finalPrice = exp.basePrice + Math.round(exp.basePrice * ((exp.leaderMarkup || 0) / 100));
                    return (
                      <div key={exp.id} onClick={() => navigate.push(`/checkout/experience/${exp.id}`)} className="interactive-press" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ width: '100px', flexShrink: 0 }}>
                          <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '12px', flex: 1 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.category}</div>
                          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem', marginBottom: '4px' }}>{exp.title}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}><Clock size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> {exp.duration}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>£{finalPrice}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} color="var(--amber-400)" /> What members say
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topReviews.length > 0 ? topReviews.map((review) => {
                  const author = users.find(u => u.id === review.user_id) || { name: 'Community Member', avatar: 'https://i.pravatar.cc/150' };
                  return (
                    <div key={review.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <img src={author.avatar} alt={author.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>{author.name}</div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} fill={i < review.rating ? "var(--amber-400)" : "none"} color={i < review.rating ? "var(--amber-400)" : "var(--slate-600)"} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: 'var(--slate-300)', fontSize: '0.9rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{review.content}"</p>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'var(--slate-400)', margin: '0 0 12px 0' }}>No reviews yet.</p>
                    {isMember && (
                      <button onClick={() => { setActiveTab('reviews'); setShowReviewForm(true); }} className="btn btn-outline interactive-press" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                        Leave a Review
                      </button>
                    )}
                  </div>
                )}
                {communityReviews.length > 3 && (
                  <button onClick={() => setActiveTab('reviews')} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', padding: '8px' }}>
                    View all {communityReviews.length} reviews
                  </button>
                )}
              </div>
            </div>

            {/* Contact & Links */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 12px 0' }}>Get in Touch</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {community.contact_email && (
                  <a href={`mailto:${community.contact_email}`} className="btn btn-outline interactive-press" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '6px', borderRadius: '12px', minWidth: '120px' }}>
                    <Mail size={16} /> Email
                  </a>
                )}
                {community.instagram && (
                  <a href={`https://instagram.com/${community.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="btn btn-outline interactive-press" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '6px', borderRadius: '12px', minWidth: '120px' }}>
                    <Camera size={16} /> Instagram
                  </a>
                )}
                {community.website && (
                  <a href={community.website} target="_blank" rel="noreferrer" className="btn btn-outline interactive-press" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '6px', borderRadius: '12px', minWidth: '120px' }}>
                    <ExternalLink size={16} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* Community Guidelines */}
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowRules(!showRules)}
                className="interactive-press"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px',
                  color: 'var(--white)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                }}
              >
                <span>📋 Community Guidelines</span>
                {showRules ? <ChevronUp size={18} color="var(--slate-400)" /> : <ChevronDown size={18} color="var(--slate-400)" />}
              </button>
              {showRules && (
                <div style={{
                  padding: '16px', marginTop: '8px',
                  background: 'rgba(255,255,255,0.02)', borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.9rem', color: 'var(--slate-300)', lineHeight: 1.6,
                }}>
                  <ol style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <li><strong>Be respectful</strong> and inclusive to all members.</li>
                    <li><strong>No spam</strong>, self-promotion, or irrelevant content.</li>
                    <li><strong>Keep conversations positive</strong> and constructive.</li>
                    <li><strong>Attend events</strong> you RSVP to, or cancel in advance.</li>
                    <li><strong>Follow the leader's guidance</strong> during group activities.</li>
                  </ol>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== EVENTS TAB ===== */}
        {activeTab === 'events' && (
          <>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0' }}>
              Upcoming Events ({communityEvents.length})
            </h3>
            {communityEvents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {communityEvents.map(event => {
                  const rsvps = eventRsvps[event.id] || [];
                  return (
                    <div key={event.id} onClick={() => navigate.push(`/events/${event.id}`)} className="interactive-press" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                      {event.image && (
                        <div style={{ height: '140px', background: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))' }}></div>
                          <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(20,184,166,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--white)' }}>
                            {event.date}
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--white)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {event.title}
                          {event.communityId !== communityId && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'var(--white)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Collab</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {event.time}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {event.location}</span>
                        </div>
                        {event.description && (
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--slate-400)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{event.description}</p>
                        )}
                        {rsvps.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                            <div style={{ display: 'flex' }}>
                              {rsvps.slice(0, 3).map((r, i) => {
                                const ru = users.find(u => u.id === r.userId);
                                return <img key={i} src={ru?.avatar || 'https://i.pravatar.cc/24'} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--slate-950)', marginLeft: i > 0 ? '-6px' : 0, objectFit: 'cover' }} />;
                              })}
                            </div>
                            {rsvps.length} going
                          </div>
                        )}
                        
                        {new Date(event.date) < new Date() ? (
                          isLeader && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleGenerateFomoReel(event); }} 
                              className="btn interactive-press" 
                              style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', gap: '6px', justifyContent: 'center', background: 'linear-gradient(135deg, var(--teal-500), var(--teal-600))', color: 'var(--white)', border: 'none', fontWeight: 600 }}>
                              <Sparkles size={14} /> Generate FOMO Reel
                            </button>
                          )
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); downloadIcs(event, community.name); }} 
                            className="btn btn-outline interactive-press" 
                            style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <Calendar size={14} /> Add to Calendar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📅</div>
                <p style={{ color: 'var(--slate-400)', margin: 0 }}>No events scheduled yet. Check back soon!</p>
              </div>
            )}
          </>
        )}

        {/* ===== PHOTOS TAB ===== */}
        {activeTab === 'photos' && (
          <>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0' }}>
              Photos & Moments
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {galleryPhotos.map((photo, idx) => (
                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: idx === 0 ? '16/12' : '1/1', gridColumn: idx === 0 ? 'span 2' : 'span 1', position: 'relative' }}>
                  <img src={photo.url} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {photo.uploaderId !== 'stock' && (isLeader || photo.uploaderId === user?.id) && (
                    <button 
                      onClick={(e) => handleDeletePhoto(idx, e)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isMember && (
              <>
                <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleUploadPhoto} />
                <button onClick={() => !isUploadingPhoto && fileInputRef.current?.click()} disabled={isUploadingPhoto} className="btn btn-outline interactive-press" style={{ width: '100%', marginTop: '16px', padding: '14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Camera size={18} /> {isUploadingPhoto ? 'Uploading...' : 'Upload a Photo'}
                </button>
              </>
            )}
          </>
        )}

        {/* ===== MEMBERS TAB ===== */}
        {activeTab === 'members' && (
          <MemberDirectory communityId={communityId} />
        )}

        {/* ===== SERVICES TAB ===== */}
        {activeTab === 'services' && (
          <>
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0' }}>
              Services & Perks
            </h3>
            
            {isLeader && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--slate-300)', marginBottom: '12px' }}>Pending Pitches</h4>
                {services.filter(s => s.communityId === communityId && s.status === 'pending').length === 0 ? (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                    No pending pitches to review.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {services.filter(s => s.communityId === communityId && s.status === 'pending').map(srv => {
                      const srvUser = users.find(u => u.id === srv.userId) || { name: 'Member', avatar: 'https://i.pravatar.cc/40' };
                      return (
                        <div key={srv.id} style={{ background: 'var(--slate-800)', border: '1px solid var(--amber-500)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '1rem' }}>{srv.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--amber-400)', marginBottom: '8px' }}>By {srvUser.name} • {srv.category} {srv.isPremium ? '• Requested Premium Placement' : ''}</div>
                              <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--slate-300)' }}>{srv.description}</p>
                              {srv.perk && (
                                <div style={{ background: 'rgba(234,179,8,0.1)', padding: '8px', borderRadius: '8px', color: 'var(--amber-300)', fontSize: '0.85rem', marginBottom: '12px' }}>
                                  🎁 Perk: {srv.perk}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateServiceStatus(srv.id, 'approved')} className="btn interactive-press" style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--teal-500)', color: 'var(--white)', border: 'none', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <Check size={16} /> Approve
                            </button>
                            <button onClick={() => updateServiceStatus(srv.id, 'rejected')} className="btn interactive-press" style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-300)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <X size={16} /> Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {services.filter(s => s.communityId === communityId && s.status === 'approved').length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💼</div>
                  <p style={{ color: 'var(--slate-400)', margin: 0 }}>No services listed yet.</p>
                </div>
              ) : (
                services.filter(s => s.communityId === communityId && s.status === 'approved')
                .sort((a, b) => (b.isPremium === a.isPremium ? 0 : b.isPremium ? 1 : -1))
                .map(srv => {
                  const srvUser = users.find(u => u.id === srv.userId) || { name: 'Member', avatar: 'https://i.pravatar.cc/40' };
                  return (
                    <div key={srv.id} style={{ 
                      background: srv.isPremium ? 'linear-gradient(to bottom right, rgba(234,179,8,0.05), rgba(0,0,0,0))' : 'rgba(255,255,255,0.02)', 
                      border: `1px solid ${srv.isPremium ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.06)'}`, 
                      borderRadius: '16px', 
                      padding: '20px'
                    }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <img src={srvUser.avatar} alt={srvUser.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {srv.title}
                              {srv.isPremium && <span style={{ fontSize: '0.65rem', background: 'var(--amber-500)', color: 'var(--white)', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Featured</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>{srv.category} • {srvUser.name}</div>
                        </div>
                      </div>
                      
                      <p style={{ margin: '0 0 16px 0', color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {srv.description}
                      </p>
                      
                      {srv.perk && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(234,179,8,0.1)', padding: '12px', borderRadius: '12px', color: 'var(--amber-300)', fontSize: '0.9rem', fontWeight: 600 }}>
                          <Sparkles size={16} />
                          {srv.perk}
                        </div>
                      )}
                      
                      <button onClick={() => navigate.push(`/chat/dm/${srvUser.id}`)} className="btn btn-outline interactive-press" style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <MessageCircle size={16} /> Message to Enquire
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {isMember && (
              <button 
                onClick={() => setIsServiceModalOpen(true)}
                className="btn btn-primary interactive-press" 
                style={{ width: '100%', marginTop: '24px', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(20,184,166,0.2)' }}
              >
                <Briefcase size={18} /> Pitch a Service or Perk
              </button>
            )}
          </>
        )}

      </div>
      </div>
      
      {isServiceModalOpen && (
        <CreateServiceModal isOpen={true} communityId={communityId} onClose={() => setIsServiceModalOpen(false)} />
      )}

      <CreateIdeaModal 
        isOpen={showIdeaModal} 
        onClose={() => setShowIdeaModal(false)} 
        communityId={communityId} 
      />
      
      {showReviewForm && (
        <ReviewForm communityId={communityId} onClose={() => setShowReviewForm(false)} />
      )}

      {showLeaveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--slate-900)', borderRadius: '24px', padding: '32px 24px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Heart size={32} color="var(--rose-400)" style={{ animation: 'pulse 2s infinite' }} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>Leaving so soon?</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--slate-400)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              By leaving <strong>{community.name}</strong>, you'll miss out on future events, lively discussions, and real-life connections.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="btn btn-primary interactive-press" 
                style={{ padding: '14px', borderRadius: '14px', fontSize: '1rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(20,184,166,0.2)' }}
              >
                Actually, I'll stay
              </button>
              <button 
                onClick={confirmLeave}
                className="interactive-press" 
                style={{ background: 'transparent', border: 'none', color: 'var(--slate-500)', padding: '14px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' }}
              >
                Yes, leave community
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reel Viewer */}
      {showReelViewer !== null && (
        <ReelViewer 
          highlights={community.highlights || []}
          initialIndex={showReelViewer}
          onClose={() => setShowReelViewer(null)}
          isLeader={isLeader}
          onDeleteHighlight={async (id) => {
            const updated = (community.highlights || []).filter(h => h.id !== id);
            await updateCommunity(communityId, { highlights: updated });
            if (updated.length === 0) setShowReelViewer(null);
          }}
        />
      )}

      {/* Video Uploader */}
      {showUploader && (
        <VideoUploader 
          user={user}
          onCancel={() => setShowUploader(false)}
          onUploadComplete={async (url) => {
            await addCommunityHighlight(communityId, url, 'New Highlight');
            setShowUploader(false);
          }}
        />
      )}
      
    </div>
  );
}
