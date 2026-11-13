"use client";
import { useState, useRef, useEffect } from 'react';
import { 
  Share2, Image as ImageIcon, Send, Activity, Users, CheckCircle2, 
  Clock, Copy, MessageCircle, Calendar, UserCheck, Search, Check, 
  AlertCircle, ChevronDown, Sparkles 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { getEventUrl, SITE_ORIGIN } from '../lib/eventLinks';
import { getCommunityPath } from '../lib/communityLinks';
import { resolveUserAvatar } from '../lib/avatar';

const ANNOUNCEMENT_TEMPLATES = [
  {
    label: '📅 Meetup Reminder',
    text: 'Hey everyone! Quick reminder about our upcoming meetup this week. Please check the details and RSVP so we can confirm numbers with the venue!'
  },
  {
    label: '👋 Welcome New Joiners',
    text: 'A warm welcome to all our new community members who joined this week! Feel free to say hello in the chat and check our upcoming schedule.'
  },
  {
    label: '📍 Location & Weather Notice',
    text: 'Important update regarding our meetup point and weather plan for this session. Please check your directions and arrive 10 minutes early.'
  },
  {
    label: '💡 Member Feedback & Ideas',
    text: 'What activities, venues, or workshops would you love to see us organise next month? Drop your thoughts below so we can make it happen!'
  }
];

export default function SocialHub({ communityId }) {
  const { 
    createPost, 
    uploadImage, 
    broadcastHistory, 
    feedPosts, 
    communities, 
    communityMemberships,
    events,
    eventRsvps,
    users 
  } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('composer'); // composer, calendar
  const [previewChannel, setPreviewChannel] = useState('app'); // app, whatsapp
  
  // Composer State
  const [postText, setPostText] = useState('');
  const [postMedia, setPostMedia] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [destinations, setDestinations] = useState({
    app: true,
    whatsapp: true
  });
  const [isPosting, setIsPosting] = useState(false);

  // Audience Targeting State: 'all' | 'event' | 'members'
  const [audienceType, setAudienceType] = useState('all');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const targetCommunity = communities.find(c => c.id === communityId);
  const rawMemberships = communityMemberships[communityId] || [];
  const totalMemberCount = rawMemberships.length;

  // Build resolved member list for this community
  const communityMembers = rawMemberships.map(m => {
    const uid = m.userId || m.user_id;
    const userProfile = (users || []).find(u => u.id === uid) || {};
    return {
      id: uid,
      name: userProfile.name || userProfile.full_name || m.userName || m.user_name || 'Community Member',
      avatar: resolveUserAvatar({ ...userProfile, name: userProfile.name || userProfile.full_name || m.userName || m.user_name, avatar: userProfile.avatar || userProfile.avatar_url || m.userAvatar || m.user_avatar }),
      role: m.role || 'member'
    };
  }).filter(m => Boolean(m.id));

  // Build community events list
  const communityEvents = (events || [])
    .filter(e => e.communityId === communityId && e.status !== 'cancelled')
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  // Auto-select first event when event audience is chosen
  useEffect(() => {
    if (audienceType === 'event' && !selectedEventId && communityEvents.length > 0) {
      setSelectedEventId(communityEvents[0].id);
    }
  }, [audienceType, communityEvents, selectedEventId]);

  // Current selected event object & its attendees
  const selectedEvent = communityEvents.find(e => e.id === selectedEventId) || null;
  const eventAttendees = selectedEventId ? (eventRsvps[selectedEventId] || []).filter(
    r => r.status === 'going' || r.status === 'checked_in' || !r.status
  ) : [];
  const eventAttendeeIds = eventAttendees.map(r => r.userId || r.user_id).filter(Boolean);

  // Filtered members for the search box
  const filteredMembers = communityMembers.filter(m => 
    m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  // Audience summary pill calculations
  const getAudienceSummary = () => {
    if (audienceType === 'event') {
      const count = eventAttendeeIds.length;
      const title = selectedEvent ? selectedEvent.title : 'Selected Event';
      return {
        label: count === 1 ? `1 attendee for "${title}"` : `${count} attendees for "${title}"`,
        sub: count === 0 ? 'No RSVPs yet for this event' : 'Will receive an alert linking directly to this event',
        count
      };
    }
    if (audienceType === 'members') {
      const count = selectedMemberIds.length;
      return {
        label: count === 1 ? '1 member selected' : `${count} members selected`,
        sub: count === 0 ? 'Select members below to receive this broadcast' : 'Will receive a private targeted notification',
        count
      };
    }
    return {
      label: `All ${totalMemberCount || 'community'} members`,
      sub: 'Broadcasts to entire community feed and sends alert to everyone',
      count: totalMemberCount
    };
  };

  const audienceSummary = getAudienceSummary();

  const handleToggleMember = (uid) => {
    setSelectedMemberIds(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAllMembers = () => {
    setSelectedMemberIds(communityMembers.map(m => m.id));
  };

  const handleClearAllMembers = () => {
    setSelectedMemberIds([]);
  };

  const getWhatsAppMessageText = () => {
    const commTitle = targetCommunity?.name || 'Our Community';
    if (audienceType === 'event' && selectedEvent) {
      return `*📢 Update for ${selectedEvent.title} Attendees*

${postText}

👉 Event Details: ${getEventUrl(selectedEvent, { allEvents: events })}`;
    }
    if (audienceType === 'members') {
      return `*📢 Message from ${commTitle}*

${postText}

👉 Community: ${SITE_ORIGIN}${getCommunityPath(targetCommunity || communityId, communities)}`;
    }
    return `*📢 Update from ${commTitle}*

${postText}

👉 View updates: ${SITE_ORIGIN}${getCommunityPath(targetCommunity || communityId, communities)}`;
  };

  const handlePost = async () => {
    if (!postText.trim() && !postMedia) {
      toast.error('Cannot post empty content', 'Please add text or an image.');
      return;
    }
    if (!destinations.app && !destinations.whatsapp) {
      toast.error('No channels selected', 'Please select App Feed or WhatsApp.');
      return;
    }

    // Audience validation
    let targetUserIds = null;
    let audienceTitle = '📢 Community Announcement';
    let audienceLink = `/community/${communityId}`;

    if (audienceType === 'event') {
      if (!selectedEvent) {
        toast.error('No event selected', 'Please select an event to target its attendees.');
        return;
      }
      targetUserIds = eventAttendeeIds;
      audienceTitle = `📢 Update: ${selectedEvent.title}`;
      audienceLink = `/events/${selectedEvent.id}`;
      if (targetUserIds.length === 0) {
        toast.warning('No attendees yet', 'This event currently has 0 RSVPs. The post will still appear on the feed.');
      }
    } else if (audienceType === 'members') {
      if (selectedMemberIds.length === 0) {
        toast.error('No members selected', 'Please choose at least 1 member from the list.');
        return;
      }
      targetUserIds = selectedMemberIds;
      audienceTitle = targetCommunity?.name ? `📢 Note from ${targetCommunity.name}` : '📢 Community Note';
      audienceLink = `/community/${communityId}`;
    }

    setIsPosting(true);
    try {
      if (destinations.app) {
        await createPost(
          communityId, 
          postText, 
          postMedia, 
          { app: true },
          {
            type: audienceType,
            targetUserIds,
            title: audienceTitle,
            link: audienceLink
          }
        );
        toast.success(
          'Broadcast Published!', 
          audienceType === 'event' 
            ? `Published and alerted ${targetUserIds.length} attendee(s) for "${selectedEvent?.title}".`
            : audienceType === 'members'
            ? `Published and alerted ${targetUserIds.length} selected member(s).`
            : 'Published to Community Feed and alerted all members.'
        );
      }
      if (destinations.whatsapp) {
        handleWhatsAppShare();
      }
      setPostText('');
      setPostMedia(null);
      setActiveTab('calendar');
    } catch (err) {
      console.error(err);
      toast.error('Broadcast failed', err.message || 'There was an issue pushing the broadcast.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!postText.trim()) {
      toast.error('Nothing to share', 'Please type a message first.');
      return;
    }
    const msg = getWhatsAppMessageText();
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp opened!', 'Share directly to your group or attendees chat.');
  };

  const handleCopyFormatted = () => {
    if (!postText.trim()) return;
    const msg = getWhatsAppMessageText();
    navigator.clipboard.writeText(msg);
    toast.success('Copied to clipboard!', 'Ready to paste into WhatsApp, email, or chat.');
  };

  // Compile real community broadcasts from history and feed announcement posts
  const communityBroadcasts = [
    ...(broadcastHistory || []).filter(b => b.communityId === communityId),
    ...(feedPosts || [])
      .filter(p => p.communityId === communityId && (p.is_announcement || p.isAnnouncement))
      .filter(p => !(broadcastHistory || []).some(b => b.id === p.id))
      .map(p => ({
        id: p.id,
        communityId: p.communityId,
        text: p.text || p.content,
        media: p.media || p.media_url,
        destinations: { app: true },
        timestamp: p.timestamp || p.createdAt || p.created_at || new Date().toISOString(),
        status: 'published'
      }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Social Hub Header / Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '16px' }}>
        {[
          { key: 'composer', label: 'Broadcast Composer' },
          { key: 'calendar', label: 'Broadcast History' }
        ].map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="interactive-press"
            style={{
              flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none',
              background: activeTab === tab.key ? 'var(--slate-800)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--slate-400)',
              fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: activeTab === tab.key ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'composer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Main Composer Area */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '24px' }}>
            
            {/* Header with Title and Dynamic Audience Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
                  <Share2 size={20} color="var(--teal-400)" /> Community Broadcaster
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                  Send targeted announcements to your whole community, event attendees, or selected members.
                </p>
              </div>
              <div style={{ 
                background: 'rgba(20, 184, 166, 0.12)', 
                border: '1px solid rgba(20, 184, 166, 0.25)', 
                padding: '6px 14px', borderRadius: '99px',
                fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <Users size={14} /> {audienceSummary.label}
              </div>
            </div>

            {/* AUDIENCE SELECTOR SECTION */}
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '16px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '10px' }}>
                Broadcast Audience:
              </div>

              {/* 3 Audience Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {[
                  {
                    key: 'all',
                    title: 'Whole Community',
                    desc: `All ${totalMemberCount} members`,
                    icon: Users
                  },
                  {
                    key: 'event',
                    title: 'Event Attendees',
                    desc: communityEvents.length > 0 ? `${communityEvents.length} active events` : 'No events yet',
                    icon: Calendar
                  },
                  {
                    key: 'members',
                    title: 'Selected Members',
                    desc: selectedMemberIds.length > 0 ? `${selectedMemberIds.length} selected` : 'Pick specific members',
                    icon: UserCheck
                  }
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = audienceType === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAudienceType(opt.key)}
                      className="interactive-press"
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        border: `1.5px solid ${isSelected ? 'var(--teal-400)' : 'rgba(255,255,255,0.08)'}`,
                        background: isSelected ? 'rgba(20, 184, 166, 0.12)' : 'rgba(255,255,255,0.03)',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--teal-500)' : 'rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? '#fff' : 'var(--slate-400)',
                        flexShrink: 0
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: isSelected ? '#fff' : 'var(--slate-200)', fontWeight: 700, fontSize: '0.88rem' }}>
                          {opt.title}
                        </div>
                        <div style={{ color: isSelected ? 'var(--teal-300)' : 'var(--slate-400)', fontSize: '0.72rem', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Audience Sub-Selector: Event Attendees */}
              {audienceType === 'event' && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {communityEvents.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                      No active events found for this community. Create an event first to broadcast to its attendees.
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--slate-400)', fontWeight: 600, marginBottom: '6px' }}>
                        Select the event whose attendees will receive this broadcast:
                      </label>
                      <select
                        value={selectedEventId}
                        onChange={e => setSelectedEventId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'var(--slate-900)',
                          border: '1px solid var(--slate-700)',
                          color: 'var(--white)',
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {communityEvents.map(ev => {
                          const rsvpCount = (eventRsvps[ev.id] || []).filter(
                            r => r.status === 'going' || r.status === 'checked_in' || !r.status
                          ).length;
                          return (
                            <option key={ev.id} value={ev.id}>
                              {ev.title} ({ev.date || 'TBD'} • {rsvpCount} attendee{rsvpCount === 1 ? '' : 's'})
                            </option>
                          );
                        })}
                      </select>
                      {selectedEvent && (
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--teal-300)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} />
                          Targeting {eventAttendeeIds.length} attendee{eventAttendeeIds.length === 1 ? '' : 's'}. Links directly to /events/{selectedEvent.id}.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Audience Sub-Selector: Selected Members Checklist */}
              {audienceType === 'members' && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--slate-500)' }} />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={memberSearchQuery}
                        onChange={e => setMemberSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 30px',
                          borderRadius: '8px',
                          background: 'var(--slate-900)',
                          border: '1px solid var(--slate-700)',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllMembers}
                        style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--slate-300)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllMembers}
                        style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: 'none', color: 'var(--slate-400)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Scrollable member checklist */}
                  <div style={{ 
                    maxHeight: '160px', 
                    overflowY: 'auto', 
                    background: 'var(--slate-900)', 
                    borderRadius: '10px', 
                    border: '1px solid var(--slate-800)',
                    padding: '6px' 
                  }}>
                    {filteredMembers.length === 0 ? (
                      <div style={{ padding: '12px', fontSize: '0.78rem', color: 'var(--slate-500)', textAlign: 'center' }}>
                        No members found matching "{memberSearchQuery}".
                      </div>
                    ) : (
                      filteredMembers.map(m => {
                        const isChecked = selectedMemberIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMember(m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: isChecked ? 'rgba(20, 184, 166, 0.12)' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                background: 'var(--slate-700)', 
                                overflow: 'hidden', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: '#fff',
                                fontWeight: 700
                              }}>
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  m.name?.[0] || 'M'
                                )}
                              </div>
                              <span style={{ fontSize: '0.82rem', color: isChecked ? '#fff' : 'var(--slate-300)', fontWeight: isChecked ? 600 : 400 }}>
                                {m.name}
                              </span>
                              {m.role === 'leader' && (
                                <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(20,184,166,0.2)', color: 'var(--teal-300)', fontWeight: 700 }}>
                                  LEADER
                                </span>
                              )}
                            </div>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: `1.5px solid ${isChecked ? 'var(--teal-400)' : 'var(--slate-600)'}`,
                              background: isChecked ? 'var(--teal-400)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000'
                            }}>
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick 1-Tap Starter Templates */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>
                Quick 1-Tap Message Starters:
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
                {ANNOUNCEMENT_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPostText(tmpl.text)}
                    className="interactive-press"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'var(--slate-200)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active Channels Selection */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ACTIVE CHANNELS:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <PlatformToggle 
                  name="App Feed & In-App Alert" 
                  active={destinations.app} 
                  onChange={() => setDestinations(p => ({ ...p, app: !p.app }))} 
                  color="var(--teal-400)" 
                />
                <PlatformToggle 
                  name="WhatsApp Group Chat" 
                  active={destinations.whatsapp} 
                  onChange={() => setDestinations(p => ({ ...p, whatsapp: !p.whatsapp }))} 
                  color="#25D366" 
                />
              </div>
            </div>

            {/* Text Area */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <textarea 
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="What's happening in your community? (Updates, meetup reminders, venue notices, welcome greetings...)"
                style={{
                  width: '100%', minHeight: '130px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)',
                  borderRadius: '16px', padding: '16px', color: 'var(--white)', fontSize: '1rem', resize: 'vertical',
                  fontFamily: 'inherit', transition: 'border-color 0.2s', lineHeight: 1.5
                }}
                onFocus={e => e.target.style.borderColor = 'var(--teal-400)'}
                onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
              />
              <div style={{ position: 'absolute', bottom: '14px', right: '16px', fontSize: '0.75rem', color: postText.length > 280 ? '#f87171' : 'var(--slate-500)' }}>
                {postText.length} characters
              </div>
            </div>

            {/* Media Preview */}
            {postMedia && (
              <div style={{ position: 'relative', marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--slate-700)' }}>
                <img src={postMedia} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                <button 
                  onClick={() => setPostMedia(null)}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'var(--white)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Actions Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                      toast.info('Uploading media...', 'Please wait');
                      const url = await uploadImage(file);
                      setPostMedia(url);
                      toast.success('Media uploaded!');
                    } catch (err) {
                      toast.error('Upload failed', err.message || 'Could not upload media');
                    } finally {
                      setIsUploading(false);
                      if (e.target) e.target.value = '';
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="interactive-press"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  <ImageIcon size={16} /> {isUploading ? 'Uploading...' : 'Add Photo'}
                </button>

                <button 
                  type="button"
                  onClick={handleWhatsAppShare}
                  disabled={!postText.trim()}
                  className="interactive-press"
                  style={{ 
                    background: 'rgba(37, 211, 102, 0.12)', 
                    border: '1px solid rgba(37, 211, 102, 0.3)', 
                    color: '#25D366', 
                    padding: '10px 14px', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    cursor: postText.trim() ? 'pointer' : 'not-allowed', 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    opacity: postText.trim() ? 1 : 0.5 
                  }}
                  title="Open WhatsApp with this broadcast pre-filled"
                >
                  <MessageCircle size={16} /> Share to WhatsApp
                </button>

                <button 
                  type="button"
                  onClick={handleCopyFormatted}
                  disabled={!postText.trim()}
                  className="interactive-press"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--slate-300)', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '5px', cursor: postText.trim() ? 'pointer' : 'not-allowed', fontSize: '0.82rem', opacity: postText.trim() ? 1 : 0.5 }}
                  title="Copy formatted text to clipboard"
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              
              <button 
                onClick={handlePost}
                disabled={isPosting || isUploading || (!postText.trim() && !postMedia)}
                className="btn btn-primary interactive-press"
                style={{ padding: '11px 28px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700, opacity: (isPosting || isUploading || (!postText.trim() && !postMedia)) ? 0.5 : 1 }}
              >
                {isPosting ? <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }}></span> : <Send size={16} />}
                {isPosting ? 'Broadcasting...' : 'Publish Broadcast'}
              </button>
            </div>
          </div>
          
          {/* Multi-Channel Live Preview Card */}
          <div style={{ background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Activity size={15} color="var(--teal-400)" /> Live Output Preview:
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px' }}>
                {[
                  { key: 'app', label: 'More App Feed' },
                  { key: 'whatsapp', label: 'WhatsApp' }
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPreviewChannel(p.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: previewChannel === p.key ? 'var(--slate-700)' : 'transparent',
                      color: previewChannel === p.key ? '#fff' : 'var(--slate-400)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* App Feed Preview */}
            {previewChannel === 'app' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--teal-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      {targetCommunity?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.88rem' }}>{targetCommunity?.name || 'Your Community'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                        {audienceType === 'event' && selectedEvent 
                          ? `Event Notice • ${selectedEvent.title}`
                          : audienceType === 'members'
                          ? `Direct Note • ${selectedMemberIds.length} recipient(s)`
                          : 'Official Announcement • Just now'}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--teal-400)', fontWeight: 700 }}>
                    {audienceType === 'event' ? 'EVENT NOTICE' : audienceType === 'members' ? 'TARGETED' : 'PINNED'}
                  </span>
                </div>
                <div style={{ color: 'var(--slate-200)', fontSize: '0.9rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                  {postText || "Your text will appear here. Tap a template starter above to begin..."}
                </div>
                {postMedia && (
                  <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={postMedia} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                  </div>
                )}
                {audienceType === 'event' && selectedEvent && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--teal-300)' }}>
                    🔗 Links to event: /events/{selectedEvent.id} ({eventAttendeeIds.length} attendee{eventAttendeeIds.length === 1 ? '' : 's'})
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Chat Preview */}
            {previewChannel === 'whatsapp' && (
              <div style={{ background: '#0b141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px' }}>
                <div style={{ fontSize: '0.72rem', color: '#8696a0', marginBottom: '8px', textAlign: 'center' }}>
                  TODAY
                </div>
                <div style={{ 
                  background: '#005c4b', 
                  borderRadius: '10px', 
                  padding: '10px 14px', 
                  maxWidth: '85%', 
                  color: '#e9edef', 
                  fontSize: '0.88rem', 
                  lineHeight: 1.45,
                  position: 'relative'
                }}>
                  <div style={{ fontWeight: 700, color: '#53bdeb', fontSize: '0.82rem', marginBottom: '4px' }}>
                    {audienceType === 'event' && selectedEvent 
                      ? `📢 Update: ${selectedEvent.title}`
                      : '📢 Announcement'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {postText || "Your broadcast text will appear here formatted with clean WhatsApp styling..."}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#53bdeb', marginTop: '6px' }}>
                    {audienceType === 'event' && selectedEvent 
                      ? getEventUrl(selectedEvent, { allEvents: events })
                      : `${SITE_ORIGIN}${getCommunityPath(targetCommunity || communityId, communities)}`}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(233, 237, 239, 0.6)', textAlign: 'right', marginTop: '4px' }}>
                    Just now ✓✓
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px 0', color: 'var(--white)', fontFamily: 'var(--font-heading)' }}>Broadcast History</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>View your published announcements across the app feed and WhatsApp.</p>
          </div>
          
          <div style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.2)', padding: '14px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <CheckCircle2 color="var(--teal-400)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.9rem' }}>Broadcaster Active</div>
              <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>Announcements automatically push to your Community Feed and dispatch in-app push alerts to members.</div>
            </div>
          </div>
          
          {communityBroadcasts.length === 0 ? (
            <div style={{ color: 'var(--slate-400)', textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <Share2 size={32} style={{ color: 'var(--slate-600)', marginBottom: '10px' }} />
              <div style={{ fontWeight: 600, color: 'var(--slate-300)', fontSize: '0.95rem' }}>No broadcasts published yet</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>Compose your first announcement above to syndicate it to your members.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {communityBroadcasts.map((item, idx) => (
                <div key={item.id || idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '99px', background: 'rgba(20,184,166,0.15)', color: 'var(--teal-300)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Published
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(20,184,166,0.1)', color: 'var(--teal-300)', border: '1px solid rgba(20,184,166,0.2)' }}>
                        App Feed & Alerts
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--slate-200)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {item.text}
                  </div>
                  {item.media && (
                    <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', maxHeight: '180px', maxWidth: '320px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={item.media} alt="Broadcast attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlatformToggle({ name, active, onChange, color }) {
  return (
    <button
      onClick={onChange}
      className="interactive-press"
      style={{
        padding: '8px 16px', borderRadius: '99px', border: `1.5px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        background: active ? `${color}20` : 'transparent', color: active ? 'white' : 'var(--slate-400)',
        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? color : 'var(--slate-600)' }}></div>
      <span>{name}</span>
    </button>
  );
}
