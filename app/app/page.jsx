"use client";
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../src/context/AppContext';
import { useFeed } from '../src/context/FeedContext';
import { Heart, MessageCircle, Share2, Calendar, MapPin, Clock, Compass, Plus } from 'lucide-react';
import AppHeader from '../src/components/AppHeader';
import { SkeletonList, SkeletonCard } from '../src/components/SkeletonCard';
import InlineComments from '../src/components/InlineComments';
import { useState } from 'react';

export default function HomeFeed() {
  const { user, communities, events, users, eventRsvps, isLoading } = useAppContext();
  const { feedPosts, likeFeedPost } = useFeed();
  const router = useRouter();
  const [expandedComments, setExpandedComments] = useState({});

  const joinedCommunities = communities.filter(c => user.joinedCommunities?.includes(c.id));

  const feedItems = useMemo(() => {
    const items = [];
    if (feedPosts && user.joinedCommunities) {
      feedPosts.forEach(post => {
        if (user.joinedCommunities.includes(post.communityId)) {
          items.push({ type: 'post', id: `post-${post.id}`, data: post, timestamp: new Date(post.timestamp).getTime() });
        }
      });
    }
    if (events && user.joinedCommunities) {
      events.forEach(event => {
        const isMemberOfPrimary = user.joinedCommunities.includes(event.communityId);
        const isMemberOfCollab = event.collabCommunityIds?.some(id => user.joinedCommunities.includes(id));
        
        if (isMemberOfPrimary || isMemberOfCollab) {
          items.push({ type: 'event', id: `event-${event.id}`, data: event, timestamp: new Date(event.createdAt || event.date).getTime() });
        }
      });
    }
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [feedPosts, events, user.joinedCommunities]);

  return (
    <div className="view-home" style={{ paddingBottom: '80px', background: 'var(--slate-950)', minHeight: '100vh' }}>
      <AppHeader title="Home" />

      {/* Stories Carousel */}
      <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', padding: '0 20px', WebkitOverflowScrolling: 'touch' }}>
          <div onClick={() => router.push('/discover')} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '64px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px dashed var(--slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Compass size={24} color="var(--slate-400)" />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600 }}>Discover</span>
          </div>

          {joinedCommunities.map(community => (
            <div key={community.id} onClick={() => router.push(`/community/${community.id}`)} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '64px' }}>
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
                  <img src={community?.image || community?.cover_image} alt={community?.name} loading="lazy" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => router.push(`/community/${community?.id}`)} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => router.push(`/community/${community?.id}`)}>{community?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                      Posted by {author?.name || 'Community Leader'} • {post.timestamp && !isNaN(new Date(post.timestamp).getTime()) ? new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 16px 12px', color: 'var(--slate-200)', fontSize: '0.95rem', lineHeight: 1.5 }}>{post.text}</div>
                {(() => {
                  if (!post.media) return null;
                  
                  let mediaArr = [post.media];
                  try {
                    const parsed = JSON.parse(post.media);
                    if (Array.isArray(parsed)) mediaArr = parsed;
                  } catch (e) {
                    // Not JSON, assume it's a single URL
                  }
                  
                  if (mediaArr.length > 1) {
                    // Render Collage
                    return (
                      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2px', background: 'var(--slate-950)' }}>
                        <div style={{ height: '300px' }}>
                          <img src={mediaArr[0]} alt="Post media 1" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '300px' }}>
                          <img src={mediaArr[1]} alt="Post media 2" loading="lazy" style={{ width: '100%', height: '50%', objectFit: 'cover' }} />
                          {mediaArr[2] ? (
                            <img src={mediaArr[2]} alt="Post media 3" loading="lazy" style={{ width: '100%', height: '50%', objectFit: 'cover' }} />
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
                      <img src={mediaArr[0]} alt="Post media" loading="lazy" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
                    </div>
                  );
                })()}
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                  <button onClick={() => likeFeedPost(post.id)} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <Heart size={16} fill={post.likes > 0 ? "var(--teal-400)" : "none"} color={post.likes > 0 ? "var(--teal-400)" : "var(--slate-400)"} /> {post.likes || 0}
                  </button>
                  <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: expandedComments[post.id] ? 'var(--teal-400)' : 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <MessageCircle size={16} /> {post.comments || 0}
                  </button>
                  <button className="interactive-press" style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', cursor: 'pointer', fontSize: '0.85rem', marginLeft: 'auto' }}>
                    <Share2 size={16} />
                  </button>
                </div>
                {expandedComments[post.id] && (
                  <InlineComments post={post} />
                )}
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
                <div onClick={() => router.push(`/community/${community?.id}`)} className="interactive-press" style={{ cursor: 'pointer' }}>
                  {event.image && (
                    <div style={{ height: '140px', background: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6))' }}></div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(20,184,166,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>
                        {event.date}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {event.title}
                      {event.collabCommunityIds?.length > 0 && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'white', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, textTransform: 'uppercase' }}>Collab</span>}
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
            <button onClick={() => router.push('/discover')} className="btn btn-primary interactive-press">
              Discover Communities
            </button>
            <div style={{ marginTop: '12px' }}>
              <button onClick={() => router.push('/dashboard')} className="btn btn-outline interactive-press" style={{ fontSize: '0.9rem' }}>
                🚀 Start a Community
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
