"use client";
import { useState } from 'react';
import { ChevronLeft, Share2, Users, Calendar, Settings, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, Camera, Mail, Activity, Sparkles, MapPin, Clock, Star, MessageCircle, Heart, BadgeCheck } from 'lucide-react';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { useToast } from '../components/Toast';
import CommentsModal from '../components/CommentsModal';
import PhotoGallery from '../components/PhotoGallery';
import MemberDirectory from '../components/MemberDirectory';
import ShareModal from '../components/ShareModal';
import { useRef } from 'react';

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

// Mock reviews per community type
const MOCK_REVIEWS = [
  { name: 'Sarah C.', avatar: 'https://i.pravatar.cc/40?img=5', text: "Absolutely brilliant group! I've made genuine friendships here and look forward to every meetup.", rating: 5 },
  { name: 'James W.', avatar: 'https://i.pravatar.cc/40?img=11', text: "Well organised with a really welcoming atmosphere. Perfect for newcomers to the area.", rating: 5 },
  { name: 'Emma J.', avatar: 'https://i.pravatar.cc/40?img=26', text: "Joined 3 months ago and it's completely changed my weekends. Highly recommend!", rating: 4 },
];

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
  const { communities, user, joinCommunity, leaveCommunity, events, isLoading, users, communityMemberships, eventRsvps, uploadImage } = useAppContext();
    const { feedPosts, createFeedPost, likeFeedPost } = useFeed();
  const { toast } = useToast();
  const [showRules, setShowRules] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [localPhotos, setLocalPhotos] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const fileInputRef = useRef(null);
  
  const communityId = id || (user.joinedCommunities.length > 0 ? user.joinedCommunities[0] : 'tw-tech-meetup');
  const community = communities.find(c => c.id === communityId);
  const communityFeed = feedPosts?.filter(p => p.communityId === communityId) || [];
  
  // Default to about tab if no feed posts exist
  const [activeTab, setActiveTab] = useState(communityFeed.length === 0 ? 'about' : 'feed');

  if (!community && !isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)' }}>
        <img src={`/images/logo.webp`} alt="more." style={{ height: '24px', opacity: 0.5, marginBottom: '24px', cursor: 'pointer' }} onClick={() => navigate.back()} />
        <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)' }}>Community not found</h2>
        <button onClick={() => navigate.back()} className="btn btn-outline" style={{ marginTop: '16px' }}>Go Home</button>
      </div>
    );
  }

  if (!community) {
    return <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>Loading...</div>;
  }

  const isMember = user.joinedCommunities.includes(communityId);
  const isLeader = user.leaderOf === communityId;
  const communityEvents = events.filter(e => e.communityId === communityId);
  const upcomingEvents = communityEvents.filter(e => {
    try { return new Date(e.date) >= new Date(); } catch { return true; }
  });
  const leaderUser = users.find(u => u.id === community.leader_id);
  const memberList = (communityMemberships[communityId] || []).map(m => users.find(u => u.id === m.userId || u.id === m.user_id)).filter(Boolean);
  const galleryType = getGalleryType(community.tags);
  const galleryPhotos = GALLERY_PHOTOS[galleryType];
  const nextEvent = upcomingEvents[0] || communityEvents[0];

  const handleShare = async () => {
    setShowShareModal(true);
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !newPostImage) return;
    
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
    
    await createFeedPost(communityId, newPostText, mediaUrl);
    setNewPostText('');
    setNewPostImage(null);
    toast.success('Posted!', 'Your update is now live.');
  };

  const handleJoin = async () => {
    await joinCommunity(community.id);
    toast.success('Welcome!', `You're now a member of ${community.name}`);
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      toast.info('Uploading photo...', 'Please wait');
      const url = await uploadImage(file);
      setLocalPhotos(prev => [url, ...prev]);
      toast.success('Photo added!', 'Your photo is now in the gallery.');
    } catch (err) {
      toast.error('Upload failed', 'Could not upload photo');
    }
    setIsUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  return (
    <div className="view-profile" style={{ background: 'var(--slate-950)', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, height: 0, overflow: 'visible' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <button className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate.back()}>
            <ChevronLeft />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15,23,42,0.3)', padding: '4px 12px', borderRadius: '99px', backdropFilter: 'blur(10px)' }}>
            <img src="/logo.png" alt="more." style={{ height: '20px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>

            <button className="interactive-press" onClick={handleShare} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Share2 size={18} />
            </button>
            {isLeader && (
              <button className="interactive-press" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)', backdropFilter: 'blur(10px)', color: 'var(--teal-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate.back()}>
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        title={community.name} 
        text={community.description} 
        url={typeof window !== 'undefined' ? window.location.href : ''} 
      />

      {/* ===== HERO SECTION ===== */}
      <div style={{ 
        height: '380px', 
        background: community.image ? `url(${community.image})` : `linear-gradient(135deg, var(--teal-500), var(--slate-900))`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative' 
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(15,23,42,1) 100%)' }}></div>
        


        {/* Hero Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', zIndex: 10 }}>
          {/* Tags */}
          {community.tags && community.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {community.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 10px', borderRadius: '99px', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px 0' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', color: 'white', margin: 0, lineHeight: 1.1 }}>
              {community.name}
            </h1>
            {community.verified && <BadgeCheck size={28} color="#3b82f6" style={{ flexShrink: 0 }} />}
          </div>
          
          {/* Meta strip */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--slate-300)', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Tunbridge Wells</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {community.members || memberList.length || 1} members</span>
            {community.activity_level && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={14} color="var(--teal-400)" /> {community.activity_level}</span>
            )}
          </div>

          {/* CTA */}
          {(() => {
            const subPrice = community.subscription_price || community.subscriptionPrice || 0;
            const isPaid = subPrice > 0 && !isMember;
            return (
              <>
                {isMember ? (
                  <div style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--slate-300)', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                    ✓ You're a Member
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary interactive-press" 
                    style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '14px', boxShadow: '0 8px 24px rgba(20,184,166,0.3)', cursor: 'pointer' }}
                    onClick={handleJoin}
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
            onClick={() => leaderUser && navigate.back()}
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--teal-500)', cursor: leaderUser ? 'pointer' : 'default' }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organised by</div>
            <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{leaderUser?.name || 'Community Team'}</div>
          </div>
          <button onClick={() => leaderUser && navigate.push(`/chat/dm/${leaderUser.id}`)} disabled={!leaderUser} className="btn btn-outline interactive-press" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center', opacity: leaderUser ? 1 : 0.5 }}>
            <MessageCircle size={14} /> Message
          </button>
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {['feed', 'about', 'events', 'photos', 'members'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none',
                background: activeTab === tab ? 'rgba(20,184,166,0.15)' : 'transparent',
                color: activeTab === tab ? 'var(--teal-300)' : 'var(--slate-400)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
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
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', resize: 'none', outline: 'none', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.95rem' }}
                    />
                    {newPostImage && (
                      <div style={{ position: 'relative', marginTop: '8px', display: 'inline-block' }}>
                        <img src={URL.createObjectURL(newPostImage)} alt="Preview" style={{ height: '80px', borderRadius: '8px' }} />
                        <button onClick={() => setNewPostImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--slate-800)', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <label style={{ cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewPostImage(e.target.files[0])} />
                        <ImageIcon size={16} /> Add Media
                      </label>
                      <button onClick={handleCreatePost} disabled={!newPostText.trim() && !newPostImage} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', borderRadius: '20px' }}>
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {communityFeed.length > 0 ? communityFeed.map(post => {
                const author = users.find(u => u.id === post.authorId) || leaderUser;
                return (
                  <div key={post.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={author?.avatar || 'https://i.pravatar.cc/40'} alt={author?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>{author?.name || 'Community Leader'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          {new Date(post.createdAt || post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0 16px 12px', color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {post.text}
                    </div>

                    {post.media && (
                      <div style={{ width: '100%', background: 'var(--slate-900)' }}>
                        <img src={post.media} alt="Post media" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                      <button onClick={() => likeFeedPost(post.id)} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: post.liked ? 'var(--teal-400)' : 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Heart size={16} fill={post.liked ? "currentColor" : "none"} /> {post.likes || 0}
                      </button>
                      <button onClick={() => setSelectedPostForComments(post)} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <MessageCircle size={16} /> {post.comments || 0}
                      </button>
                    </div>
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

        {/* ===== ABOUT TAB ===== */}
        {activeTab === 'about' && (
          <>
            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0' }}>What we're about</h3>
              <p style={{ lineHeight: 1.8, color: 'var(--slate-200)', fontSize: '1rem', margin: 0 }}>
                {community.description}
              </p>
            </div>

            {/* Key Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>👥</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Who It's For</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>{community.target_audience || 'All ages & abilities welcome.'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>💷</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Cost</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>{community.cost || community.metrics?.cost || 'Free to join'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>📅</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>How Often</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>{community.activity_level === 'Very Active' ? 'Weekly meetups' : community.activity_level === 'Active' ? 'Fortnightly' : 'Monthly'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>📍</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>{community.location_name || 'Tunbridge Wells, Kent'}</div>
              </div>
            </div>

            {/* Next Event CTA */}
            {nextEvent && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--teal-400)" /> Next Event
                </h3>
                <div 
                  onClick={() => navigate.back()} 
                  className="interactive-press"
                  style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(20,184,166,0.2)', background: 'rgba(20,184,166,0.05)', cursor: 'pointer' }}
                >
                  {nextEvent.image && (
                    <div style={{ height: '120px', background: `url(${nextEvent.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))' }}></div>
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--teal-300)', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {nextEvent.date}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {nextEvent.time}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white', marginBottom: '4px' }}>{nextEvent.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {nextEvent.location}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={18} color="var(--amber-400)" /> What members say
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {MOCK_REVIEWS.map((review, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <img src={review.avatar} alt={review.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{review.name}</div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="var(--amber-400)" color="var(--amber-400)" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: 0, color: 'var(--slate-300)', fontSize: '0.9rem', lineHeight: 1.5, fontStyle: 'italic' }}>"{review.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Links */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 12px 0' }}>Get in Touch</h3>
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
                  color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
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
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0' }}>
              Upcoming Events ({communityEvents.length})
            </h3>
            {communityEvents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {communityEvents.map(event => {
                  const rsvps = eventRsvps[event.id] || [];
                  return (
                    <div key={event.id} onClick={() => navigate.back()} className="interactive-press" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                      {event.image && (
                        <div style={{ height: '140px', background: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))' }}></div>
                          <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(20,184,166,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>
                            {event.date}
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', marginBottom: '6px' }}>{event.title}</div>
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
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0' }}>
              Photos & Moments
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[...localPhotos, ...galleryPhotos].map((url, idx) => (
                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: idx === 0 ? '16/12' : '1/1', gridColumn: idx === 0 ? 'span 2' : 'span 1' }}>
                  <img src={url} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      </div>
      <CommentsModal isOpen={!!selectedPostForComments} onClose={() => setSelectedPostForComments(null)} post={selectedPostForComments} />
    </div>
  );
}
