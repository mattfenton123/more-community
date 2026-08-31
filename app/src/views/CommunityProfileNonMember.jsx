import React from 'react';
import { ChevronLeft, Share2, Users, Calendar, MapPin, Activity, BadgeCheck, Star, Clock, Heart } from 'lucide-react';
import AppHeader from '../components/AppHeader';

// Category-specific gallery photos
const IMG = '/images/communities';
const GALLERY_PHOTOS = {
  running: [`${IMG}/parkrun.webp`, `${IMG}/gallery-running-1.webp`, `${IMG}/gallery-running-2.webp`],
  walking: [`${IMG}/ramblers.webp`, `${IMG}/gallery-walking-1.webp`, `${IMG}/az-challenge.webp`],
  wellness: [`${IMG}/mindful-miles.webp`, `${IMG}/yoga-collective.webp`, `${IMG}/gallery-yoga-1.webp`],
  business: [`${IMG}/entrepreneurs.webp`, `${IMG}/gallery-running-2.webp`, `${IMG}/interfaith.webp`],
  creative: [`${IMG}/creative-collective.webp`, `${IMG}/gallery-creative-1.webp`, `${IMG}/good-neighbours.webp`],
  volunteering: [`${IMG}/good-neighbours.webp`, `${IMG}/interfaith.webp`, `${IMG}/gallery-walking-1.webp`],
  default: [`${IMG}/parkrun.webp`, `${IMG}/good-neighbours.webp`, `${IMG}/gallery-adventure-1.webp`]
};

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

export default function CommunityProfileNonMember({ 
  community, leaderUser, memberList, communityEvents, navigate, handleJoin, handleShare, isPaid
}) {
  const upcomingEvents = communityEvents.filter(e => {
    try { return new Date(e.date) >= new Date(); } catch { return true; }
  });
  
  const galleryType = getGalleryType(community.tags);
  const galleryPhotos = GALLERY_PHOTOS[galleryType];
  const nextEvent = upcomingEvents[0] || communityEvents[0];
  const subPrice = community.subscription_price || community.subscriptionPrice || 0;

  return (
    <div style={{ background: 'var(--slate-950)', minHeight: '100vh', paddingBottom: '100px' }}>
      <AppHeader title={community.name} showBack={true} />

      {/* Hero Section */}
      <div style={{ height: '500px', background: community.image ? `url(${community.image})` : `linear-gradient(135deg, var(--teal-500), var(--slate-900))`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, var(--slate-950) 100%)' }}></div>
        
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 20px', zIndex: 10 }}>
          {community.tags && community.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {community.tags.map(tag => (
                <span key={tag} style={{ fontSize: '0.75rem', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', padding: '6px 12px', borderRadius: '99px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag}</span>
              ))}
            </div>
          )}
          
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.8rem', color: 'white', margin: '0 0 16px 0', lineHeight: 1.1 }}>
            {community.name} {community.verified && <BadgeCheck size={28} color="#3b82f6" style={{ display: 'inline', verticalAlign: 'middle' }} />}
          </h1>
          
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--slate-300)', marginBottom: '24px', flexWrap: 'wrap', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} color="var(--slate-400)" /> {community.location_name || 'Tunbridge Wells'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={16} color="var(--slate-400)" /> {community.members || memberList.length || 1} members</span>
          </div>
        </div>
      </div>

      {/* Continuous Content Scroll */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '24px' }}>
        
        {/* About */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0' }}>About us</h2>
          <p style={{ color: 'var(--slate-300)', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
            {community.description}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👥</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>For Who</div>
              <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 500 }}>{community.target_audience || 'Everyone welcome'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📅</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>How Often</div>
              <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 500 }}>{community.activity_level || 'Active weekly'}</div>
            </div>
          </div>
        </div>

        {/* Gallery Preview */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0' }}>The Vibe</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {galleryPhotos.map((url, idx) => (
              <div key={idx} style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: idx === 0 ? '16/12' : '1/1', gridColumn: idx === 0 ? 'span 2' : 'span 1' }}>
                <img src={url} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Organizer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'linear-gradient(to right, rgba(20,184,166,0.1), rgba(255,255,255,0.02))', borderRadius: '20px', border: '1px solid rgba(20,184,166,0.2)' }}>
          <img src={leaderUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=0D8B93&color=fff`} alt="Organiser" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--teal-500)' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Organised by</div>
            <div style={{ fontWeight: 800, color: 'white', fontSize: '1.1rem' }}>{leaderUser?.name || 'Community Team'}</div>
          </div>
        </div>

        {/* Next Event */}
        {nextEvent && (
          <div>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0' }}>Join us at</h2>
            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              {nextEvent.image && (
                <div style={{ height: '160px', background: `url(${nextEvent.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))' }}></div>
                  <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'var(--teal-500)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>
                    {nextEvent.date}
                  </div>
                </div>
              )}
              <div style={{ padding: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: '8px' }}>{nextEvent.title}</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--slate-400)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16} /> {nextEvent.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={16} /> {nextEvent.location}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={22} color="var(--amber-400)" fill="var(--amber-400)" /> What members say
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MOCK_REVIEWS.map((review, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img src={review.avatar} alt={review.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{review.name}</div>
                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={12} fill="var(--amber-400)" color="var(--amber-400)" />
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, color: 'var(--slate-300)', fontSize: '1rem', lineHeight: 1.6, fontStyle: 'italic' }}>"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sticky Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top, var(--slate-950) 60%, transparent)', zIndex: 100, display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary interactive-press" 
          style={{ width: '100%', maxWidth: '400px', padding: '18px', fontSize: '1.15rem', fontWeight: 800, borderRadius: '16px', boxShadow: '0 8px 32px rgba(20,184,166,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleJoin}
        >
          {isPaid ? `Join — £${subPrice}/month` : 'Join Community For Free'}
        </button>
      </div>
    </div>
  );
}
