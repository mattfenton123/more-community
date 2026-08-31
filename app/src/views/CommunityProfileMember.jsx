"use client";
import { useState } from 'react';
import { ChevronLeft, Share2, Users, Calendar, Settings, ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, Camera, Mail, Activity, Sparkles, MapPin, Clock, Star, MessageCircle, Heart, BadgeCheck, Briefcase, Check, X, Lightbulb, PieChart, BarChart3 } from 'lucide-react';
import { useRouter as useNavigate, useParams } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { useToast } from '../components/Toast';
import CommentsModal from '../components/CommentsModal';
import PhotoGallery from '../components/PhotoGallery';
import MemberDirectory from '../components/MemberDirectory';
import ShareModal from '../components/ShareModal';
import CreateServiceModal from '../components/CreateServiceModal';
import CreateIdeaModal from '../components/CreateIdeaModal';
import { useRef } from 'react';
import AppHeader from '../components/AppHeader';

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
  const { communities, user, joinCommunity, leaveCommunity, events, isLoading, users, communityMemberships, eventRsvps, uploadImage, services, updateServiceStatus, updateCommunity, polls, votePollAction } = useAppContext();
    const { feedPosts, createFeedPost, likeFeedPost } = useFeed();
  const { toast } = useToast();
  const [showRules, setShowRules] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [selectedPostForComments, setSelectedPostForComments] = useState(null);
  const [localPhotos, setLocalPhotos] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  
  const communityId = id || (user.joinedCommunities.length > 0 ? user.joinedCommunities[0] : 'tw-tech-meetup');
  const community = communities.find(c => c.id === communityId);
  const communityFeed = feedPosts?.filter(p => p.communityId === communityId) || [];
  const communityPolls = polls ? polls.filter(p => p.communityId === communityId) : [];
  
  const handleVote = async (pollId, optionIndex) => {
    try {
      await votePollAction(pollId, optionIndex);
      toast.success('Vote recorded!');
    } catch (err) {
      toast.error('Failed to vote', 'Please try again.');
    }
  };
  
  // Default to about tab if no feed posts exist
  const [activeTab, setActiveTab] = useState('home');

  if (!community && !isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-950)' }}>
        <img src={`/images/logo.webp`} alt="more." style={{ height: '24px', opacity: 0.5, marginBottom: '24px', cursor: 'pointer' }} onClick={() => navigate.back()} />
        <h2 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>Community not found</h2>
        <button onClick={() => navigate.back()} className="btn btn-outline" style={{ marginTop: '16px' }}>Go Home</button>
      </div>
    );
  }

  if (!community) {
    return <div style={{ padding: '40px', color: 'var(--white)', textAlign: 'center' }}>Loading...</div>;
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
      
      // Update community in the database
      const existingPhotos = community.photos || [];
      await updateCommunity(community.id, { photos: [url, ...existingPhotos] });
      
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
      
      <AppHeader title={community.name} showBack={true} />
      
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
                {isLeader ? (
                  <button 
                    onClick={() => navigate.push(`/community/${communityId}/admin`)} 
                    className="btn btn-primary interactive-press" 
                    style={{ width: '100%', padding: '16px', fontSize: '1.05rem', background: 'var(--slate-800)', border: '1px solid var(--slate-600)', color: 'var(--white)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
                  >
                    <Settings size={20} /> Manage Community
                  </button>
                ) : isMember ? (
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
            onClick={() => leaderUser && navigate.back()}
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--teal-500)', cursor: leaderUser ? 'pointer' : 'default' }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organised by</div>
            <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '1rem' }}>{leaderUser?.name || 'Community Team'}</div>
          </div>
          <button onClick={() => leaderUser && navigate.push(`/chat/dm/${leaderUser.id}`)} disabled={!leaderUser} className="btn btn-outline interactive-press" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center', opacity: leaderUser ? 1 : 0.5 }}>
            <MessageCircle size={14} /> Message
          </button>
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {['home', 'feed', 'events', 'marketplace', 'directory', 'polls'].map(tab => (
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

        {/* ===== HOME TAB ===== */}
        {activeTab === 'home' && (
          <>
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 8px 0' }}>Community Info</h3>
              <p style={{ color: 'var(--slate-300)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{community.description}</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: 0 }}>
                Discussion
              </h3>
              <button onClick={() => setIsIdeaModalOpen(true)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber-400)', borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}>
                <Lightbulb size={16} /> Suggest Idea
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} style={{ marginBottom: '24px', position: 'relative' }}>
              <textarea 
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                placeholder="Share an update or ask a question..."
                style={{ width: '100%', minHeight: '100px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--white)', fontSize: '1rem', resize: 'none', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ cursor: 'pointer', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewPostImage(e.target.files[0])} />
                  <ImageIcon size={16} /> Add Media
                </label>
                <button type="submit" disabled={!newPostText.trim() && !newPostImage} className="btn btn-primary interactive-press" style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>Post</button>
              </div>
            </form>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {communityFeed.length > 0 ? communityFeed.map(post => {
                const author = users.find(u => u.id === post.authorId) || leaderUser;
                let isIdea = false;
                let ideaData = {};
                if (post.media) {
                  try {
                    const parsed = JSON.parse(post.media);
                    if (parsed.type === 'idea') {
                      isIdea = true;
                      ideaData = parsed;
                    }
                  } catch (e) {}
                }

                if (isIdea) {
                  return (
                    <div key={post.id} style={{ background: 'linear-gradient(to bottom right, rgba(20,184,166,0.05), rgba(255,255,255,0.02))', backdropFilter: 'blur(10px)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex' }}>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.05)', minWidth: '70px' }}>
                        <button onClick={() => likeFeedPost(post.id)} className="interactive-press" style={{ background: post.liked ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)', width: '40px', height: '40px', borderRadius: '12px', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: post.liked ? 'white' : 'var(--slate-300)', cursor: 'pointer', fontWeight: 800 }}>
                          <ChevronUp size={20} strokeWidth={3} />
                        </button>
                        <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--white)' }}>{post.likes || 0}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>Votes</div>
                      </div>
                      <div style={{ flex: 1, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                           <span style={{ fontSize: '0.7rem', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestion</span>
                           <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>by {author?.name || 'Member'}</span>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--white)', fontSize: '1.2rem', marginBottom: '8px', lineHeight: 1.3 }}>{ideaData.title || post.text}</div>
                        {ideaData.location && (
                           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px' }}>
                             <MapPin size={14} /> {ideaData.location}
                           </div>
                        )}
                        {ideaData.title && post.text !== ideaData.title && (
                          <div style={{ color: 'var(--slate-300)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '16px' }}>{post.text}</div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                          <button onClick={() => setSelectedPostForComments(post)} className="btn btn-outline interactive-press" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <MessageCircle size={16} /> Discuss ({post.comments || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={post.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={author?.avatar || 'https://i.pravatar.cc/40'} alt={author?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.95rem' }}>{author?.name || 'Community Leader'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                          {new Date(post.createdAt || post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0 16px 12px', color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {post.text}
                    </div>

                    {post.media && !post.media.startsWith('{') && !post.media.startsWith('[') && (
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
                  <p style={{ color: 'var(--slate-400)', margin: 0 }}>No updates yet. Be the first to post!</p>
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
                    <div key={event.id} onClick={() => navigate.back()} className="interactive-press" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                      {event.image && (
                        <div style={{ height: '140px', background: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))' }}></div>
                          <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(20,184,166,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--white)' }}>
                            {event.date}
                          </div>
                        </div>
                      )}
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--white)', marginBottom: '6px' }}>{event.title}</div>
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

        {/* ===== DIRECTORY TAB ===== */}
        {activeTab === 'directory' && (
          <>
            <MemberDirectory communityId={communityId} />
            
            <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '24px 0 16px 0' }}>
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

        {/* ===== MARKETPLACE TAB ===== */}
        {activeTab === 'marketplace' && (
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
          </div>
        )}

        {/* ===== POLLS TAB ===== */}
        {activeTab === 'polls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} color="var(--teal-400)" /> Community Polls
            </h3>
            
            {communityPolls.length > 0 ? communityPolls.map(poll => {
              // Calculate total votes for percentages
              const totalVotes = poll.options.reduce((sum, _, idx) => sum + (poll.votes?.[idx] || 0), 0);
              // Check if current user has voted
              const userVoted = Object.values(poll.voters || {}).includes(user.id) || !!(poll.voters && poll.voters[user.id]);
              
              return (
                <div key={poll.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '16px', fontSize: '1.1rem' }}>{poll.question}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {poll.options.map((opt, idx) => {
                      const optionVotes = poll.votes?.[idx] || 0;
                      const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                      
                      return (
                        <div key={idx} style={{ position: 'relative' }}>
                          <button 
                            onClick={() => !userVoted && handleVote(poll.id, idx)}
                            disabled={userVoted}
                            style={{ 
                              width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
                              background: 'transparent', color: 'var(--white)', textAlign: 'left', cursor: userVoted ? 'default' : 'pointer',
                              position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', zIndex: 2
                            }}
                            className={userVoted ? '' : 'interactive-hover'}
                          >
                            <span style={{ zIndex: 2, fontWeight: 500 }}>{opt}</span>
                            {userVoted && <span style={{ zIndex: 2, fontWeight: 600, color: 'var(--teal-300)' }}>{percentage}%</span>}
                          </button>
                          {userVoted && (
                            <div style={{ 
                              position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, 
                              background: 'rgba(20,184,166,0.15)', borderRadius: '12px', zIndex: 1 
                            }}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart3 size={14} /> {totalVotes} votes {userVoted && '• You voted'}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <PieChart size={32} color="var(--slate-500)" style={{ marginBottom: '12px' }} />
                <p style={{ color: 'var(--slate-400)', margin: 0 }}>No active polls right now.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {showShareModal && <ShareModal title={community.name} text={community.description} url={`https://more.community/${community.id}`} onClose={() => setShowShareModal(false)} />}
      <CommentsModal isOpen={!!selectedPostForComments} onClose={() => setSelectedPostForComments(null)} post={selectedPostForComments} />
      
      <CreateServiceModal 
        isOpen={isServiceModalOpen} 
        onClose={() => setIsServiceModalOpen(false)} 
        communityId={communityId} 
      />

      <CreateIdeaModal 
        isOpen={isIdeaModalOpen} 
        onClose={() => setIsIdeaModalOpen(false)} 
        communityId={communityId} 
      />
    </div>
  );
}
