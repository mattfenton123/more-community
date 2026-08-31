"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../src/context/AppContext';
import { useFeed } from '../src/context/FeedContext';
import { Heart, MessageCircle, Share2, Calendar, MapPin, Clock, Compass, Plus, Bell, Megaphone, Edit3, Briefcase } from 'lucide-react';
import { SkeletonList, SkeletonCard } from '../src/components/SkeletonCard';
import InlineComments from '../src/components/InlineComments';

export default function HomeFeed() {
  const { user, communities, events, users, eventRsvps, isLoading, notifications } = useAppContext();
  const { feedPosts, likeFeedPost } = useFeed();
  const router = useRouter();
  const [expandedComments, setExpandedComments] = useState({});
  const [activeFeedTab, setActiveFeedTab] = useState('All');

  const unreadCount = notifications ? notifications.filter(n => !n.is_read).length : 0;
  const joinedCommunities = communities.filter(c => user.joinedCommunities?.includes(c.id));

  // Determine Daily Briefing
  const todayEvents = events?.filter(e => {
    if (!user.joinedCommunities?.includes(e.communityId)) return false;
    // Check if event is today
    const eventDate = new Date(e.createdAt || e.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }) || [];
  
  const recentPosts = feedPosts?.filter(p => {
    if (!user.joinedCommunities?.includes(p.communityId)) return false;
    const postDate = new Date(p.timestamp);
    const today = new Date();
    return postDate > new Date(today.getTime() - 24 * 60 * 60 * 1000);
  }) || [];

  const feedItems = useMemo(() => {
    let items = [];
    if (feedPosts && user.joinedCommunities) {
      feedPosts.forEach(post => {
        if (user.joinedCommunities.includes(post.communityId)) {
          if (activeFeedTab === 'All' || activeFeedTab === 'Discussions') {
            items.push({ type: 'post', id: `post-${post.id}`, data: post, timestamp: new Date(post.timestamp).getTime() });
          }
        }
      });
    }
    if (events && user.joinedCommunities) {
      events.forEach(event => {
        const isMemberOfPrimary = user.joinedCommunities.includes(event.communityId);
        const isMemberOfCollab = event.collabCommunityIds?.some(id => user.joinedCommunities.includes(id));
        
        if (isMemberOfPrimary || isMemberOfCollab) {
          if (activeFeedTab === 'All' || activeFeedTab === 'Events') {
            items.push({ type: 'event', id: `event-${event.id}`, data: event, timestamp: new Date(event.createdAt || event.date).getTime() });
          }
        }
      });
    }
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [feedPosts, events, user.joinedCommunities, activeFeedTab]);

  return (
    <div className="view-home" style={{ paddingBottom: '80px', background: 'var(--slate-950)', minHeight: '100vh' }}>
      
      {/* Personalized Dynamic Header */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, var(--slate-900), var(--slate-950))' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'white', margin: '0 0 4px 0' }}>
            Good morning, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: 0 }}>
            {todayEvents.length > 0 
              ? `You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today.`
              : recentPosts.length > 0 
                ? `${recentPosts.length} new post${recentPosts.length > 1 ? 's' : ''} in your communities.`
                : "You're all caught up for today."}
          </p>
        </div>
        <div 
          className="interactive-press" 
          onClick={() => router.push('/notifications')}
          style={{ position: 'relative', cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}
        >
          <Bell size={22} color="var(--slate-300)" />
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute', top: '0px', right: '0px',
              background: 'var(--rose-500)', color: 'white',
              fontSize: '0.65rem', fontWeight: 700,
              width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--slate-900)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Stories Carousel */}
      <div style={{ padding: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '0 20px', WebkitOverflowScrolling: 'touch' }}>
          
          <div onClick={() => router.push('/discover')} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '72px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px dashed var(--slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <Compass size={28} color="var(--slate-400)" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600 }}>Discover</span>
          </div>

          {joinedCommunities.map((community, index) => {
            // Mock random unread status for the demo (first 2 communities have "new stories")
            const hasUnread = index < 2;
            
            return (
              <div key={community.id} onClick={() => router.push(`/community/${community.id}`)} className="interactive-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '72px' }}>
                <div style={{ 
                  width: '72px', height: '72px', borderRadius: '50%', padding: '3px', 
                  background: hasUnread ? 'linear-gradient(45deg, var(--teal-500), #3b82f6)' : 'var(--slate-700)',
                  boxShadow: hasUnread ? '0 4px 12px rgba(20,184,166,0.3)' : 'none'
                }}>
                  <img src={community.image || community.cover_image} alt={community.name} loading="lazy" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--slate-950)' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: hasUnread ? 'white' : 'var(--slate-300)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '72px', textAlign: 'center' }}>
                  {community.name.substring(0, 12)}{community.name.length > 12 ? '...' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div style={{ padding: '20px', display: 'flex', gap: '12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {user?.isAdmin || user?.leaderOf ? (
          <>
            <button onClick={() => router.push(user?.isAdmin ? '/admin?tab=users' : '/dashboard?tab=members')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'white' }}>
              <Edit3 size={18} color="var(--teal-400)" /> Update Members
            </button>
            <button onClick={() => router.push(user?.isAdmin ? '/admin?tab=events' : '/dashboard?tab=events')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'white' }}>
              <Calendar size={18} color="var(--teal-400)" /> Host Event
            </button>
            <button onClick={() => router.push(user?.isAdmin ? '/admin?tab=communications' : '/dashboard?tab=crm')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'white' }}>
              <Megaphone size={18} color="var(--teal-400)" /> Broadcast
            </button>
          </>
        ) : (
          <>
            <button onClick={() => router.push('/discover')} className="btn interactive-press" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'white' }}>
              <Compass size={18} color="var(--teal-400)" /> Find Groups
            </button>
            <button onClick={() => router.push('/chat')} className="btn interactive-press" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'white' }}>
              <MessageCircle size={18} color="var(--teal-400)" /> Messages
            </button>
          </>
        )}
      </div>

      {/* Segmented Feed Control */}
      <div style={{ padding: '0 20px' }}>
        <div className="segmented-control">
          {['All', 'Discussions', 'Events'].map(tab => (
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

      {/* Feed */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {isLoading ? (
          <SkeletonList count={4} Component={SkeletonCard} />
        ) : feedItems.length > 0 ? feedItems.map(item => {
          if (item.type === 'post') {
            const post = item.data;
            const author = users.find(u => u.id === post.authorId);
            const community = communities.find(c => c.id === post.communityId);
            return (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={community?.image || community?.cover_image} alt={community?.name} loading="lazy" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => router.push(`/community/${community?.id}`)} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem', cursor: 'pointer' }} onClick={() => router.push(`/community/${community?.id}`)}>{community?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                      {author?.name || 'Community Leader'} • {post.timestamp && !isNaN(new Date(post.timestamp).getTime()) ? new Date(post.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 16px 16px', color: 'var(--slate-200)', fontSize: '1rem', lineHeight: 1.6 }}>{post.text}</div>
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
                          <img src={mediaArr[0]} alt="Post media 1" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '2px', height: '300px' }}>
                          <img src={mediaArr[1]} alt="Post media 2" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <img src={mediaArr[2]} alt="Post media 3" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <img src={mediaArr[3]} alt="Post media 4" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {mediaArr[4] ? (
                            <img src={mediaArr[4]} alt="Post media 5" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '20px' }}>
                  <button onClick={() => likeFeedPost(post.id)} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Heart size={18} fill={post.likes > 0 ? "var(--teal-400)" : "none"} color={post.likes > 0 ? "var(--teal-400)" : "white"} /> {post.likes || 0}
                  </button>
                  <button onClick={() => setExpandedComments(prev => ({...prev, [post.id]: !prev[post.id]}))} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: expandedComments[post.id] ? 'var(--teal-400)' : 'white', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                    <MessageCircle size={18} /> {post.comments || 0}
                  </button>
                  <button className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', width: '38px', height: '38px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', marginLeft: 'auto' }}>
                    <Share2 size={18} />
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
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(20,184,166,0.4)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '12px 16px', background: 'linear-gradient(to right, rgba(20,184,166,0.15), transparent)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Calendar size={16} /> Upcoming in {community?.name}
                </div>
                <div onClick={() => router.push(`/community/${community?.id}`)} className="interactive-press" style={{ cursor: 'pointer' }}>
                  {event.image && (
                    <div style={{ height: '160px', background: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.9))' }}></div>
                      <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(20,184,166,1)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        {event.date}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '20px 16px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {event.title}
                      {event.collabCommunityIds?.length > 0 && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase' }}>Collab</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--slate-300)', marginBottom: '12px', fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="var(--slate-400)" /> {event.time}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} color="var(--slate-400)" /> {event.location}</span>
                    </div>
                    {event.description && (
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'var(--slate-400)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>{event.description}</p>
                    )}
                    {rsvps.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--slate-300)', fontWeight: 600 }}>
                        <div style={{ display: 'flex' }}>
                          {rsvps.slice(0, 3).map((r, i) => {
                            const ru = users.find(u => u.id === r.userId);
                            return <img key={i} src={ru?.avatar || 'https://i.pravatar.cc/24'} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--slate-900)', marginLeft: i > 0 ? '-8px' : 0, objectFit: 'cover' }} />;
                          })}
                        </div>
                        {rsvps.length} members attending
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        }) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
            <h3 style={{ margin: '0 0 12px 0', color: 'white', fontFamily: 'var(--font-heading)', fontSize: '1.4rem' }}>Nothing to show yet</h3>
            <p style={{ color: 'var(--slate-400)', margin: '0 0 24px 0', fontSize: '0.95rem', lineHeight: 1.6 }}>
              {activeFeedTab === 'All' 
                ? "Your feed is empty. Join some communities to see their updates and events here."
                : activeFeedTab === 'Events' 
                  ? "There are no upcoming events in your communities right now."
                  : "No recent discussions. Be the first to post something!"}
            </p>
            {activeFeedTab === 'All' && (
              <button onClick={() => router.push('/discover')} className="btn btn-primary interactive-press" style={{ padding: '14px 24px', borderRadius: '12px', fontSize: '1rem' }}>
                Discover Communities
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
