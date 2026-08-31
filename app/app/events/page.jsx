"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalIcon, MapPin, Search, X, CheckCircle2, CreditCard, Check, Ticket, Users, QrCode, Share } from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { SkeletonList, SkeletonEvent } from '../../src/components/SkeletonCard';
import { useToast } from '../../src/components/Toast';
import DigitalTicket from '../../src/components/DigitalTicket';
import AppHeader from '../../src/components/AppHeader';
import SwipeDiscovery from '../../src/components/SwipeDiscovery';

export default function EventsHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('My Schedule');
  const { events, communities, user, users, eventRsvps, rsvpToEvent, isLoading, saveItem } = useAppContext();
  const { toast } = useToast();
  
  const [checkoutState, setCheckoutState] = useState('idle');
  const [showTicket, setShowTicket] = useState(null);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);
  const [showSwipe, setShowSwipe] = useState(false);

  const myRsvpEventIds = Object.keys(eventRsvps).filter(eventId => 
    eventRsvps[eventId]?.some(r => r.userId === user.id)
  );
  const userEvents = events.filter(e => myRsvpEventIds.includes(e.id) || user.joinedCommunities.includes(e.communityId));
  const exploreEvents = events.filter(e => !user.joinedCommunities.includes(e.communityId));
  
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');
  const [exploreDateFilter, setExploreDateFilter] = useState('');
  
  const filteredExploreEvents = exploreEvents.filter(e => {
    let matchesSearch = true;
    let matchesDate = true;
    if (exploreSearchQuery) {
      const q = exploreSearchQuery.toLowerCase();
      matchesSearch = e.title.toLowerCase().includes(q) || (e.location && e.location.toLowerCase().includes(q));
    }
    if (exploreDateFilter) {
      matchesDate = e.date === exploreDateFilter;
    }
    return matchesSearch && matchesDate;
  });

  const recommendedEvents = exploreEvents.filter(e => {
    if (!user || !user.interests) return false;
    const community = communities.find(c => c.id === e.communityId);
    if (!community || !community.tags) return false;
    return community.tags.some(tag => user.interests.includes(tag));
  });

  const [selectedEvent, setSelectedEvent] = useState(null);

  const getEventPrice = (event) => {
    if (event.ticketPrice && event.ticketPrice > 0) return event.ticketPrice;
    return 0;
  };

  const handleRSVP = async (isPaid) => {
    if (isPaid) {
      setCheckoutState('processing');
      setTimeout(() => {
        setCheckoutState('success');
        rsvpToEvent(selectedEvent.id, 'going', 'paid');
        toast.success('Ticket Purchased!', 'Check your email for the receipt.');
      }, 2000);
    } else {
      rsvpToEvent(selectedEvent.id, 'going', 'free');
      toast.success('RSVP Confirmed!', 'Added to your schedule');
      setCheckoutState('success');
    }
  };

  const handleCancelRSVP = () => {
    rsvpToEvent(selectedEvent.id, 'not_going');
    toast.info('RSVP Cancelled', 'Removed from your schedule');
    setSelectedEvent(null);
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setCheckoutState('idle');
    setCardForm({ number: '', expiry: '', cvc: '', name: '' });
  };

  const handlePromote = () => {
    const shareData = {
      title: `Event: ${selectedEvent.title}`,
      text: `Join us for ${selectedEvent.title} hosted by ${selectedEvent.communityName}!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      toast.success('Link copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleAddToCalendar = (type) => {
    if (!selectedEvent) return;
    
    let startDate = new Date();
    if (selectedEvent.date) {
      const parsed = new Date(selectedEvent.date);
      if (!isNaN(parsed)) startDate = parsed;
    }
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const title = encodeURIComponent(selectedEvent.title);
    const location = encodeURIComponent(selectedEvent.location || 'TBA');
    const description = encodeURIComponent(`Hosted by ${selectedEvent.communityName || 'more.'}\n\nJoin us at ${window.location.href}`);

    if (type === 'google') {
      const startIso = startDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${description}&location=${location}`;
      window.open(url, '_blank');
    } else if (type === 'ics') {
      const formatIcsDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const icsData = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `DTSTART:${formatIcsDate(startDate)}`,
        `DTEND:${formatIcsDate(endDate)}`,
        `SUMMARY:${selectedEvent.title}`,
        `DESCRIPTION:Hosted by ${selectedEvent.communityName}.`,
        `LOCATION:${selectedEvent.location || ''}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join('\\n');
      
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEvent.title.replace(/\\s+/g, '_')}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Calendar file downloaded');
    }
    setShowCalendarDropdown(false);
  };

  const formatCardNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 3) return cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    return cleaned;
  };

  const renderEvent = (event, index) => {
    const community = communities.find(c => c.id === event.communityId);
    const eventImage = event.image || community?.image;
    const price = getEventPrice(event);
    const hasRsvp = eventRsvps[event.id]?.some(r => r.userId === user.id);
    return (
      <div 
        key={event.id} 
        onClick={() => router.push(`/events/${event.id}`)}
        className="interactive-press stagger-item" 
        style={{ cursor: 'pointer', marginBottom: '20px', borderRadius: '20px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
      >
        {eventImage && (
          <div style={{ height: '140px', background: `url(${eventImage})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8))' }}></div>
            
            {/* Calendar Leaf Overlay */}
            <div style={{ 
              position: 'absolute', top: '12px', left: '12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', 
              borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '42px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <div style={{ background: 'var(--teal-500)', color: 'white', width: '100%', textAlign: 'center', fontSize: '0.65rem', fontWeight: 800, padding: '2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {event.date ? (isNaN(new Date(event.date)) ? event.date.substring(0,3) : new Date(event.date).toLocaleDateString('en-GB', { month: 'short' })) : 'TBA'}
              </div>
              <div style={{ padding: '4px 8px', color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>
                {event.date ? (isNaN(new Date(event.date)) ? (event.date.match(/\d+/) ? event.date.match(/\d+/)[0] : '—') : new Date(event.date).getDate()) : '—'}
              </div>
            </div>

            <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.75rem', fontWeight: 700, color: price > 0 ? 'var(--amber-400)' : 'var(--teal-300)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', padding: '6px 12px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              {price > 0 ? `£${price}` : 'FREE'}
            </div>
            {hasRsvp && (
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal-300)', background: 'rgba(20,184,166,0.2)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: '99px', border: '1px solid rgba(20,184,166,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> Going
              </div>
            )}
          </div>
        )}
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>{community?.name}</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700 }}>{event.title}</h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalIcon size={14} /> {event.date}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {event.location}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="view-events" style={{ paddingBottom: '80px' }}>
      <AppHeader title="Events" />

      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
          {['My Schedule', 'Recommended', 'Explore'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="interactive-press" style={{
              flex: 1, background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent', 
              border: '1px solid ' + (activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent'),
              borderRadius: '8px', padding: '8px 0', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
              color: activeTab === tab ? 'var(--white)' : 'var(--slate-400)',
              transition: 'all 0.2s', boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 20px' }}>
        {activeTab === 'My Schedule' ? (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>UPCOMING THIS WEEK</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : userEvents.length > 0 ? userEvents.map((e, i) => renderEvent(e, i)) : (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '20px' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(20,184,166,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--teal-400)' }}>
                  <CalIcon size={36} />
                </div>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: 'var(--white)' }}>No Upcoming Events</h3>
                <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5, maxWidth: '280px', margin: '0 auto 24px' }}>
                  Your schedule is looking empty. Join some communities or explore events to fill it up!
                </p>
                <button 
                  onClick={() => setActiveTab('Explore')}
                  className="interactive-press"
                  style={{ background: 'var(--teal-500)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(20,184,166,0.3)' }}
                >
                  Explore Events
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'Recommended' ? (
          <>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '12px', fontWeight: 600 }}>MATCHING YOUR INTERESTS</div>
            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : recommendedEvents.length > 0 ? recommendedEvents.map((e, i) => renderEvent(e, i)) : (
              <p style={{ color: 'var(--slate-400)' }}>No recommended events right now based on your interests.</p>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', fontWeight: 600 }}>DISCOVER EVENTS</div>
              <button 
                onClick={() => setShowSwipe(true)}
                className="interactive-press"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  background: 'var(--teal-500)', color: 'white', border: 'none', 
                  padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', 
                  fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(20,184,166,0.3)' 
                }}
              >
                <Sparkles size={14} /> Swipe Events
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search events or locations..." 
                  value={exploreSearchQuery}
                  onChange={(e) => setExploreSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem' }}
                />
              </div>
              <input 
                type="date"
                value={exploreDateFilter}
                onChange={(e) => setExploreDateFilter(e.target.value)}
                style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>

            {isLoading ? (
              <SkeletonList count={3} Component={SkeletonEvent} />
            ) : filteredExploreEvents.length > 0 ? filteredExploreEvents.map((e, i) => renderEvent(e, i)) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-400)' }}>
                No events found matching your search.
              </div>
            )}
          </>
        )}
      </div>

      {/* Digital Ticket Modal */}
      {showTicket && (
        <DigitalTicket event={showTicket} user={user} onClose={() => setShowTicket(null)} />
      )}

      {showSwipe && (
        <SwipeDiscovery 
          events={exploreEvents} 
          communities={communities} 
          onClose={() => setShowSwipe(false)} 
          onSave={(item) => {
            saveItem(item.id);
          }}
        />
      )}
    </div>
  );
}
