"use client";
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../context/AppContext';
import { useFeed } from '../context/FeedContext';
import { Heart, MessageCircle, Share2, Calendar, MapPin, Clock, Compass, Plus, Megaphone, Edit3, Briefcase, ChevronUp } from 'lucide-react';
import { SkeletonList, SkeletonCard } from '../components/SkeletonCard';
import InlineComments from '../components/InlineComments';
import AppHeader from '../components/AppHeader';

export default function HomeFeed() {
  const { user, communities, events, users, eventRsvps, isLoading, notifications, sponsors, sponsorshipAssignments } = useAppContext();
  const { feedPosts, likeFeedPost } = useFeed();
  const router = useRouter();
  const [expandedComments, setExpandedComments] = useState({});
  const [activeFeedTab, setActiveFeedTab] = useState('Feed');

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
          let isIdea = false;
          let ideaData = null;
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
             if (activeFeedTab === 'Feed' || activeFeedTab === 'Ideas') {
                items.push({ type: 'idea', id: `idea-${post.id}`, data: post, ideaData, timestamp: new Date(post.timestamp || post.createdAt).getTime() });
             }
          } else {
             if (activeFeedTab === 'Feed') {
                items.push({ type: 'post', id: `post-${post.id}`, data: post, timestamp: new Date(post.timestamp || post.createdAt).getTime() });
             }
          }
        }
      });
    }
    if (events && user.joinedCommunities) {
      events.forEach(event => {
        const isMemberOfPrimary = user.joinedCommunities.includes(event.communityId);
        const isMemberOfCollab = event.collabCommunityIds?.some(id => user.joinedCommunities.includes(id));
        
        if (isMemberOfPrimary || isMemberOfCollab) {
          if (activeFeedTab === 'Feed' || activeFeedTab === 'Events') {
            items.push({ type: 'event', id: `event-${event.id}`, data: event, timestamp: new Date(event.createdAt || event.date).getTime() });
          }
        }
      });
    }
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [feedPosts, events, user.joinedCommunities, activeFeedTab]);

  return (
    <div className="view-home" style={{ paddingBottom: '80px', background: 'var(--slate-950)', minHeight: '100dvh' }}>
      <AppHeader title="Home" />
      
      {/* Personalized Dynamic Header */}
      <div style={{ padding: '16px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, var(--slate-900), var(--slate-950))' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 4px 0' }}>
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
      </div>

      {/* Quick Action Hub */}
      <div style={{ padding: '20px', display: 'flex', gap: '12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {user?.leaderOf ? (
          <>
            <button onClick={() => router.push('/dashboard?tab=members')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--white)' }}>
              <Edit3 size={18} color="var(--teal-400)" /> Update Members
            </button>
            <button onClick={() => router.push('/dashboard?tab=events')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--white)' }}>
              <Calendar size={18} color="var(--teal-400)" /> Host Event
            </button>
            <button onClick={() => router.push('/dashboard?tab=crm')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--white)' }}>
              <Megaphone size={18} color="var(--teal-400)" /> Broadcast
            </button>
            {user?.isAdmin && (
              <button onClick={() => router.push('/admin')} className="btn interactive-press" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--teal-400)' }}>
                <Compass size={18} color="var(--teal-400)" /> Admin
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => router.push('/discover')} className="btn interactive-press" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--white)' }}>
              <Compass size={18} color="var(--teal-400)" /> Find Groups
            </button>
            <button onClick={() => router.push('/chat')} className="btn interactive-press" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--white)' }}>
              <MessageCircle size={18} color="var(--teal-400)" /> Messages
            </button>
            {user?.isAdmin && (
              <button onClick={() => router.push('/admin')} className="btn interactive-press" style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--teal-400)' }}>
                <Compass size={18} color="var(--teal-400)" /> Admin
              </button>
            )}
          </>
        )}
      </div>

      {/* Joined Communities */}
      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--white)', margin: 0 }}>Your Communities</h2>
        {joinedCommunities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.95rem', marginBottom: '16px' }}>You haven't joined any communities yet.</p>
            <button onClick={() => router.push('/discover')} className="btn btn-primary interactive-press" style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem' }}>
              Discover Communities
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {joinedCommunities.map((comm) => (
              <div 
                key={comm.id}
                onClick={() => router.push(`/community/${comm.id}`)}
                className="glass-panel interactive-press"
                style={{ overflow: 'hidden', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ height: '120px', background: `url(${comm.image || comm.cover_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--white)' }}>{comm.name}</h3>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--slate-400)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {comm.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsored Spotlight */}
      {(() => {
        // Pick a random Community Supporter or Headline Sponsor to spotlight
        const spotlightSponsor = sponsors && sponsors.length > 0 
          ? sponsors[Math.floor(Math.random() * sponsors.length)] 
          : null;
          
        if (spotlightSponsor) {
          return (
            <div style={{ padding: '0 20px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sponsored Spotlight</div>
              </div>
              <div onClick={() => router.push(`/sponsors/${spotlightSponsor.id}`)} className="interactive-press" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'white', padding: '4px', flexShrink: 0 }}>
                    <img src={spotlightSponsor.logo} alt={spotlightSponsor.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--white)' }}>{spotlightSponsor.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-400)' }}>Supporting local communities</p>
                  </div>
                </div>
                <p style={{ color: 'var(--slate-200)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  {spotlightSponsor.bio}
                </p>
                <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--teal-400)', fontWeight: 600 }}>
                  Read their community story &rarr;
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      </div>
    </div>
  );
}
