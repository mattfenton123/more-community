"use client";
import { useMemo, useState, useEffect } from 'react';
import { useRouter as useNavigate } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { Heart, MessageCircle, Share2, Calendar, MapPin, Clock, Compass, Trash2, Flag } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import { SkeletonList, SkeletonCard } from '../components/SkeletonCard';
import CommentsModal from '../components/CommentsModal';

export default function HomeFeed() {
  const { user, communities, events, users, eventRsvps, isLoading, subscribeToPushNotifications } = useAppContext();
  const { feedPosts, likeFeedPost, deleteFeedPost } = useFeed();
  const navigate = useNavigate();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [activePostForComments, setActivePostForComments] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowPushPrompt(true);
      }
    }
  }, []);

  const handleEnablePush = async () => {
    const success = await subscribeToPushNotifications();
    if (success) setShowPushPrompt(false);
  };

  const joinedCommunities = communities.filter(c => user.joinedCommunities?.includes(c.id));

  const feedItems = useMemo(() => {
    const items = [];
    
    // Add Posts
    if (feedPosts && user.joinedCommunities) {
      feedPosts.forEach(post => {
        if (user.joinedCommunities.includes(post.communityId)) {
          items.push({
            type: 'post',
            id: `post-${post.id}`,
            data: post,
            timestamp: new Date(post.createdAt || new Date()).getTime()
          });
        }
      });
    }

    // Add Events
    if (events && user.joinedCommunities) {
      events.forEach(event => {
        if (user.joinedCommunities.includes(event.communityId)) {
          // Only add events that are in the future or recently created
          items.push({
            type: 'event',
            id: `event-${event.id}`,
            data: event,
            timestamp: new Date(event.createdAt || event.date).getTime()
          });
        }
      });
    }

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [feedPosts, events, user.joinedCommunities]);

  return (
    <div className="view-home" style={{ paddingBottom: '80px', background: 'var(--slate-950)', minHeight: '100vh' }}>
      {/* Header */}
      <AppHeader title="Home" />

      {/* Push Notification Banner */}
      {showPushPrompt && (
        <div style={{ margin: '16px 20px', padding: '16px', background: 'rgba(20,184,166,0.1)', border: '1px solid var(--teal-500)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>Enable Notifications</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--teal-200)', marginTop: '2px' }}>Get alerts for DMs and replies.</div>
          </div>
          <button onClick={handleEnablePush} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}>
            Enable
          </button>
        </div>
      )}

      {/* Stories Carousel */}
      <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '0 20px', WebkitOverflowScrolling: 'touch' }}>
          
          <div onClick={() => navigate.back()} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '64px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px dashed var(--slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Compass size={24} color="var(--slate-400)" />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Discover</span>
          </div>

          {joinedCommunities.map(community => (
            <div key={community.id} onClick={() => navigate.back()} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '64px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', padding: '3px', background: 'linear-gradient(45deg, var(--teal-500), #3b82f6)' }}>
                <img src={community.image || community.cover_image} alt={community.name} loading="lazy" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--slate-950)' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70px', textAlign: 'center' }}>
                {community.name.substring(0, 12)}{community.name.length > 12 ? '...' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {isLoading ? (
          <SkeletonList count={4} Component={SkeletonCard} />
        ) : feedItems.length > 0 ? feedItems.map(item => {
          if (item.type === 'post') {
            const post = item.data;
            const author = users.find(u => u.id === post.authorId);
            const community = communities.find(c => c.id === post.communityId);
            return (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={community?.image || community?.cover_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(community?.name || 'C')}&background=0D8B93&color=fff`} alt={community?.name} loading="lazy" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => navigate.back()} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => navigate.back()}>{community?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                      Posted by {author?.name || 'Community Leader'} • {new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(community?.leaderId === user?.id || post.authorId === user?.id) && (
                      <button onClick={() => deleteFeedPost(post.id)} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--rose-400)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                    {post.authorId !== user?.id && (
                      <button onClick={() => {}} className="interactive-press" style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}>
                        <Flag size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ padding: '0 16px 12px', color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {post.text}
                </div>

                {post.media && (
                  <div style={{ width: '100%', background: 'var(--slate-900)' }}>
                    <img src={post.media} alt="Post media" loading="lazy" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                  <button onClick={() => likeFeedPost(post.id)} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Heart size={16} fill={post.likes > 0 ? "var(--teal-400)" : "none"} color={post.likes > 0 ? "var(--teal-400)" : "var(--slate-400)"} /> {post.likes || 0}
                  </button>
                  <button onClick={() => setActivePostForComments(post)} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <MessageCircle size={16} /> {post.comments}
                  </button>
                </div>
              </div>
            );
          }

          if (item.type === 'event') {
            const event = item.data;
            const rsvps = eventRsvps[event.id] || [];
            const community = communities.find(c => c.id === event.communityId);
            return (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--teal-300)', fontWeight: 600 }}>
                  <Calendar size={14} /> New Event in {community?.name}
                </div>
                <div onClick={() => navigate.back()} className="interactive-press" style={{ cursor: 'pointer' }}>
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
              </div>
            );
          }
          return null;
        }) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👋</div>
            <h3 style={{ margin: '0 0 8px 0', color: 'white', fontFamily: 'var(--font-heading)' }}>Welcome to more!</h3>
            <p style={{ color: 'var(--slate-400)', margin: '0 0 16px 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Your feed is empty. Join some communities to see their updates and events here.
            </p>
            <button onClick={() => navigate.back()} className="btn btn-primary interactive-press">
              Discover Communities
            </button>
          </div>
        )}
      </div>

      <CommentsModal 
        isOpen={!!activePostForComments}
        onClose={() => setActivePostForComments(null)}
        post={activePostForComments}
      />
    </div>
  );
}
