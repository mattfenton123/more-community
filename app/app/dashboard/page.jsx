"use client";
import { useState, useRef, useMemo } from 'react';
import { Users, Calendar, MessageCircle, TrendingUp, Search, Plus, MapPin, Image as ImageIcon, CreditCard, ChevronRight, Download, Activity, Globe, Heart, Crown, Info, X, Map, Zap, Mail, Trash2, UserCheck, Ban, ChevronDown, ChevronUp, Settings, Megaphone, QrCode, BarChart3, Ticket, ScanLine, UserPlus, DollarSign, Clock, Edit3, Check, Eye, EyeOff, Shield, Star } from 'lucide-react';
import AppHeader from '../../src/components/AppHeader';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useChat } from '../../src/context/ChatContext';
import { useToast } from '../../src/components/Toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import SocialHub from '../../src/components/SocialHub';
import MemberCRM from '../../src/components/MemberCRM';
import DigitalTicket from '../../src/components/DigitalTicket';
import QRScanner from '../../src/components/QRScanner';
import CommunityOnboardingFlow from '../../src/views/CommunityOnboardingFlow';
import EventFlyerGenerator from '../../src/components/EventFlyerGenerator';
import dynamic from 'next/dynamic';
const LocationPicker = dynamic(() => import('../../src/components/LocationPicker'), { ssr: false });

// ─── Stat Card Component ──────────────────────────────────
const StatCard = ({ value, label, color, icon: Icon, accent }) => (
  <div className="glass-panel stagger-item interactive-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', ...(accent ? { border: `1px solid ${accent}30`, background: `linear-gradient(135deg, ${accent}10 0%, ${accent}02 100%)` } : {}) }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: color || 'white' }}>{value}</div>
      {Icon && <Icon size={18} color={color || 'var(--slate-500)'} />}
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
  </div>
);

// ─── Utilities ──────────────────────────────────────────────────
function parseDateParts(dateStr) {
  if (!dateStr) return { day: '—', month: '' };
  if (dateStr.includes('-')) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!isNaN(d)) return { day: d.getDate().toString(), month: d.toLocaleDateString('en-GB', { month: 'short' }) };
  }
  const parts = dateStr.split(' ');
  if (parts.length >= 3) return { day: parts[1], month: parts[2] };
  if (parts.length === 2) return { day: parts[0], month: parts[1] };
  return { day: dateStr, month: '' };
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const d = new Date(dateStr + 'T00:00:00');
    if (!isNaN(d)) return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return dateStr;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = dateStr.includes('-') ? new Date(dateStr + 'T00:00:00') : null;
  if (!d || isNaN(d)) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

// ─── Engagement Score (shared with CRM) ─────────────────────────
function getEngagementScore(member, events, eventRsvps, messages, communityId) {
  let score = 0;
  const communityEvents = events.filter(e => e.communityId === communityId);
  communityEvents.forEach(event => {
    if ((eventRsvps[event.id] || []).some(r => r.userId === member.userId)) score += 20;
  });
  const memberMessages = messages.filter(m => m.authorId === member.userId && m.communityId === communityId);
  score += Math.min(memberMessages.length * 5, 40);
  score += 10;
  return Math.min(score, 100);
}

// ─── Component ──────────────────────────────────────────────────
export default function LeaderDashboard() {
  const { user, communities, events, updateCommunity, users, communityMemberships, createEvent, updateEvent, cancelEvent, uploadImage, eventRsvps, whatsappSettings, setWhatsappSettings, promoteMember, removeMember, checkInMember, broadcastNotification, experiences } = useAppContext();
    const { messages } = useChat();
  const { toast } = useToast();
  const router = useRouter();
  
  // ─── State ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', tags: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [waConfig, setWaConfig] = useState({ businessConnected: false, groupLink: '' });
  
  const emptyEventForm = { title: '', description: '', date: '', time: '', location: '', maxCapacity: '', ticketPrice: '' };
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editingEventId, setEditingEventId] = useState(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [flyerEvent, setFlyerEvent] = useState(null);
  const [coLeaderSearch, setCoLeaderSearch] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [communityVisibility, setCommunityVisibility] = useState('public');
  const [requireApproval, setRequireApproval] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [eventStep, setEventStep] = useState(0);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [discoverySearchTerm, setDiscoverySearchTerm] = useState('');
  const [discoveryProvider, setDiscoveryProvider] = useState('viator');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);

  const fileInputRef = useRef(null);

  // ─── Derived Data ─────────────────────────────────────────
  const communityIdLed = user?.leaderOf;
  const community = communities.find(c => c.id === communityIdLed);
  const memberList = community ? (communityMemberships[community.id] || []) : [];
  const communityEvents = community ? events.filter(e => e.communityId === community.id).sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
  const publishedEvents = communityEvents.filter(e => e.status !== 'cancelled');
  const communityMessages = community ? messages.filter(m => m.communityId === community.id) : [];

  // ─── Computed Stats ───────────────────────────────────────
  const stats = useMemo(() => {
    if (!community) return {};
    const totalMembers = memberList.length;
    const activeMembers = memberList.filter(m => 
      getEngagementScore(m, events, eventRsvps, communityMessages, community.id) >= 30
    ).length;
    
    // Revenue: sum ticket prices for all going RSVPs
    let totalRevenue = 0;
    let monthRevenue = 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    communityEvents.forEach(event => {
      const price = event.ticketPrice || 0;
      const rsvps = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
      const eventRevenue = price * rsvps.length;
      totalRevenue += eventRevenue;
      
      if (event.date) {
        const eventDate = new Date(event.date + 'T00:00:00');
        if (eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear) {
          monthRevenue += eventRevenue;
        }
      }
    });
    
    // Events this month
    const eventsThisMonth = publishedEvents.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
    
    // Check-in rate
    let totalRsvps = 0;
    let totalCheckins = 0;
    communityEvents.forEach(event => {
      const rsvps = eventRsvps[event.id] || [];
      totalRsvps += rsvps.filter(r => r.status === 'going').length;
      totalCheckins += rsvps.filter(r => r.checkedIn).length;
    });
    const checkinRate = totalRsvps > 0 ? Math.round((totalCheckins / totalRsvps) * 100) : 0;
    
    // Next event countdown
    const upcoming = publishedEvents.filter(e => daysUntil(e.date) !== null);
    const nextEvent = upcoming.length > 0 ? upcoming[0] : null;
    const daysToNext = nextEvent ? daysUntil(nextEvent.date) : null;
    
    return { totalMembers, activeMembers, totalRevenue, monthRevenue, eventsThisMonth, checkinRate, daysToNext, nextEvent };
  }, [community, memberList, communityEvents, publishedEvents, eventRsvps, communityMessages, events]);

  // ─── Per-event revenue helper ─────────────────────────────
  const getEventRevenue = (event) => {
    const price = event.ticketPrice || 0;
    const rsvps = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
    return { price, rsvpCount: rsvps.length, revenue: price * rsvps.length, checkedIn: rsvps.filter(r => r.checkedIn).length };
  };

  // ─── Member growth data (last 7 weeks) ────────────────────
  const growthData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      // Count members who "joined" in this week window (simulate from index)
      const count = Math.max(1, Math.floor(memberList.length * (7 - i) / 7) + (i % 3));
      weeks.push({ count, label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    }
    const max = Math.max(...weeks.map(w => w.count), 1);
    return { weeks, max };
  }, [memberList]);

  // ─── Recent Activity ──────────────────────────────────────
  const recentActivity = useMemo(() => {
    const activities = [];
    // Recent messages
    communityMessages.slice(-3).forEach(m => {
      const author = users.find(u => u.id === m.authorId);
      activities.push({ type: 'message', text: `${author?.name || 'Someone'} sent a message`, icon: MessageCircle, color: '#3b82f6', time: 'Recently' });
    });
    // Recent RSVPs
    communityEvents.slice(0, 2).forEach(event => {
      const rsvps = eventRsvps[event.id] || [];
      rsvps.slice(-2).forEach(r => {
        const rUser = users.find(u => u.id === r.userId);
        activities.push({ type: 'rsvp', text: `${rUser?.name || 'Someone'} RSVP'd to ${event.title}`, icon: Ticket, color: '#14b8a6', time: 'Recently' });
      });
    });
    // Member joins
    memberList.slice(-2).forEach(m => {
      const mUser = users.find(u => u.id === m.userId);
      activities.push({ type: 'join', text: `${mUser?.name || 'Someone'} joined the community`, icon: UserPlus, color: '#a78bfa', time: 'Recently' });
    });
    return activities.slice(0, 5);
  }, [communityMessages, communityEvents, eventRsvps, memberList, users]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleEditClick = () => {
    if (community) {
      setEditForm({ description: community.description || '', tags: community.tags ? community.tags.join(', ') : '' });
      setSubscriptionPrice(community.subscriptionPrice || community.subscription_price || '');
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateCommunity(community.id, {
      description: editForm.description,
      tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    toast.success('Profile updated!', 'Your community microsite has been saved');
    setIsEditing(false);
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location) return;
    setIsUploading(true);
    let imageUrl = '';
    
    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'events');
      }
      
      await createEvent(community.id, {
        ...eventForm,
        maxCapacity: eventForm.maxCapacity ? parseInt(eventForm.maxCapacity, 10) : null,
        ticketPrice: eventForm.ticketPrice ? parseFloat(eventForm.ticketPrice) : 0,
        image: imageUrl
      });
      
      setModalType(null);
      setEventStep(0);
      setEventForm(emptyEventForm);
      setImageFile(null);
      toast.success('Event created!', `${eventForm.title} has been published`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create event', e.message || 'An error occurred while publishing.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEventId(event.id);
    setEventForm({
      title: event.title || '', description: event.description || '',
      date: event.date || '', time: event.time || '',
      location: event.location || '',
      maxCapacity: event.maxCapacity ? event.maxCapacity.toString() : '',
      ticketPrice: event.ticketPrice ? event.ticketPrice.toString() : ''
    });
    setImageFile(null);
    setModalType('edit-event');
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time || !eventForm.location) return;
    setIsUploading(true);
    let imageUrl;
    if (imageFile) {
      try { imageUrl = await uploadImage(imageFile, 'events'); } catch (e) {
        toast.error('Upload failed', 'Could not upload event image');
      }
    }
    const updates = {
      title: eventForm.title, description: eventForm.description,
      date: eventForm.date, time: eventForm.time, location: eventForm.location,
      maxCapacity: eventForm.maxCapacity ? parseInt(eventForm.maxCapacity, 10) : null,
      ticketPrice: eventForm.ticketPrice ? parseFloat(eventForm.ticketPrice) : 0,
    };
    if (imageUrl) updates.image = imageUrl;
    await updateEvent(editingEventId, updates);
    setIsUploading(false);
    setModalType(null);
    setEditingEventId(null);
    setEventForm(emptyEventForm);
    setImageFile(null);
    toast.success('Event updated!', `${eventForm.title} has been saved`);
  };

  const handleCancelEvent = async (eventId) => {
    await cancelEvent(eventId);
    setCancelConfirmId(null);
    toast.info('Event cancelled', 'This event has been marked as cancelled');
  };

  const handlePromote = async (memberUser) => {
    await promoteMember(community.id, memberUser.id, 'Co-Leader');
  };
  const handleRemove = async (memberUser) => {
    await removeMember(community.id, memberUser.id);
    toast.info('Member removed', `${memberUser.name} has been removed from the community`);
  };



  const handleAIGenerateEvent = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate LLM latency
    setTimeout(() => {
      const lowerPrompt = aiPrompt.toLowerCase();
      let generated = {
        title: "Weekend Community Meetup",
        description: "Join us for a fantastic community meetup. We'll connect, share stories, and enjoy a great time together. Don't forget to bring your positive energy!",
        date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        time: "10:00",
        location: "City Park Main Entrance",
        maxCapacity: "50",
        ticketPrice: "0",
        image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80"
      };

      if (lowerPrompt.includes('hike') || lowerPrompt.includes('walk')) {
        generated = {
          title: "Sunset Ridge Trail Hike",
          description: "Disconnect and recharge with a guided sunset hike along the beautiful Ridge Trail. Perfect for all fitness levels. Bring water, sturdy shoes, and your camera for the incredible views at the summit!",
          date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          time: "17:30",
          location: "Ridge Trailhead Parking Lot",
          maxCapacity: "20",
          ticketPrice: "0",
          image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80"
        };
      } else if (lowerPrompt.includes('dinner') || lowerPrompt.includes('drink')) {
        generated = {
          title: "Community Dinner & Networking",
          description: "A relaxed evening of great food and even better company. We have reserved a private area at the Local Bistro. Your ticket covers a welcome drink and shared appetizers.",
          date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
          time: "19:00",
          location: "The Local Bistro, Main St",
          maxCapacity: "15",
          ticketPrice: "25",
          image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
        };
      }

      setEventForm(generated);
      setIsGenerating(false);
      setAiPrompt('');
      toast.success('Event Generated!', 'AI successfully drafted your event.');
    }, 1500);
  };

  const handleSimulateApiSearch = async () => {
    if (!discoverySearchTerm.trim()) return;
    setIsDiscovering(true);
    setDiscoveryResults(null);
    try {
      const res = await fetch(`/api/experiences/discover?q=${encodeURIComponent(discoverySearchTerm)}&provider=${discoveryProvider}`);
      const result = await res.json();
      
      if (result.status === 'success') {
        if (result.isTestMode) toast('Using Test Mode (API Keys missing)', { icon: '⚠️' });
        setDiscoveryResults(result.data);
      } else {
        toast.error('API Error: ' + result.message);
      }
    } catch (err) {
      toast.error('Failed to query provider API.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleImportExperience = (exp) => {
    const newExp = {
      ...exp,
      communityId: community.id,
      leaderMarkup: 15,
    };
    
    // In this local state demo, push to the array and force re-render if needed
    if (!experiences.find(e => e.id === exp.id)) {
      experiences.push(newExp);
      toast.success(`${exp.title} added to your marketplace!`);
    } else {
      toast.error('Experience already imported.');
    }
    
    setIsDiscoveryModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Engagement Score'];
    const rows = memberList.map(m => {
      const u = users.find(usr => usr.id === m.userId);
      const score = getEngagementScore(m, events, eventRsvps, communityMessages, community.id);
      return [u?.name || 'Unknown', m.role || 'Member', score];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${community.name}-members.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!', 'Member data downloaded as CSV');
  };

  const handleSaveSubscriptionPrice = () => {
    const price = parseFloat(subscriptionPrice) || 0;
    updateCommunity(community.id, { subscription_price: price });
    toast.success('Pricing updated!', price > 0 ? `Community subscription set to £${price}/month` : 'Community set to free');
  };

  // ─── Event Wizard Steps ────────────────────────────────────
  const eventSteps = [
    { label: 'Details', icon: Edit3, desc: 'Name & describe your event' },
    { label: 'When & Where', icon: MapPin, desc: 'Set the date, time & location' },
    { label: 'Extras', icon: Settings, desc: 'Capacity, pricing & image' },
  ];

  const canAdvanceStep = () => {
    if (eventStep === 0) return eventForm.title.trim().length > 0;
    if (eventStep === 1) return eventForm.date && eventForm.time && eventForm.location.trim().length > 0;
    return true;
  };

  const openEventWizard = (editing = false, event = null) => {
    setEventStep(0);
    if (editing && event) {
      handleEditEvent(event);
    } else {
      setEditingEventId(null);
      setEventForm(emptyEventForm);
      setImageFile(null);
      setModalType('event');
    }
  };

  const renderEventForm = () => (
    <>
      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        {eventSteps.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer', opacity: i <= eventStep ? 1 : 0.4 }} onClick={() => { if (i < eventStep || (i === eventStep + 1 && canAdvanceStep())) setEventStep(i); }}>
            <div style={{ height: '3px', borderRadius: '99px', background: i <= eventStep ? 'var(--teal-500)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <s.icon size={12} color={i <= eventStep ? 'var(--teal-400)' : 'var(--slate-600)'} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: i <= eventStep ? 'var(--teal-300)' : 'var(--slate-600)' }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 0: Details */}
      {eventStep === 0 && (
        <>
          <div style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              <span style={{ fontWeight: 600, color: '#c4b5fd', fontSize: '0.9rem' }}>Auto-Generate with AI</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="e.g. Sunset hike this friday followed by drinks" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAIGenerateEvent()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem' }}
              />
              <button 
                onClick={handleAIGenerateEvent}
                disabled={isGenerating || !aiPrompt.trim()}
                style={{ padding: '0 16px', borderRadius: '8px', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.5)', color: '#c4b5fd', fontWeight: 600, cursor: isGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '90px' }}
                className="interactive-press"
              >
                {isGenerating ? <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(196,181,253,0.3)', borderTopColor: '#c4b5fd', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : 'Generate'}
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={16} color="var(--teal-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--teal-300)', lineHeight: 1.4 }}>Or create manually. A clear title and description help members decide whether to attend. Keep it friendly!</span>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="var(--teal-400)" /> Event Title <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span></label>
            <input className="form-input" placeholder="e.g. Saturday Morning Walk" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} autoFocus style={{ fontSize: '1.05rem', padding: '14px 16px' }} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={14} color="var(--slate-400)" /> Description</label>
            <textarea className="form-input" placeholder="Tell people what to expect, what to bring, who it's for..." value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} rows={4} style={{ minHeight: '100px', lineHeight: 1.5 }} />
          </div>
        </>
      )}

      {/* Step 1: When & Where */}
      {eventStep === 1 && (
        <>
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MapPin size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#93c5fd', lineHeight: 1.4 }}>Pick a date, time, and place. Members will see this in their calendar and on the map.</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} color="#3b82f6" /> Date <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span></label>
              <input type="date" className="form-input" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} style={{ colorScheme: 'dark', padding: '14px 16px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} color="#3b82f6" /> Time <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span></label>
              <input type="time" className="form-input" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} style={{ colorScheme: 'dark', padding: '14px 16px' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="#3b82f6" /> Location <span style={{ color: 'var(--rose-400)', fontSize: '0.7rem' }}>*</span></label>
            <LocationPicker locationName={eventForm.location} setLocationName={(loc) => setEventForm({...eventForm, location: loc})} />
          </div>
        </>
      )}

      {/* Step 2: Extras */}
      {eventStep === 2 && (
        <>
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#fcd34d', lineHeight: 1.4 }}>These are optional — you can always edit them later.</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} color="#f59e0b" /> Max Capacity</label>
              <input type="number" className="form-input" placeholder="Unlimited" value={eventForm.maxCapacity} onChange={e => setEventForm({...eventForm, maxCapacity: e.target.value})} min="1" style={{ padding: '14px 16px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14} color="#f59e0b" /> Ticket Price (£)</label>
              <input type="number" className="form-input" placeholder="0 = Free" value={eventForm.ticketPrice} onChange={e => setEventForm({...eventForm, ticketPrice: e.target.value})} min="0" step="0.50" style={{ padding: '14px 16px' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={14} color="#f59e0b" /> Cover Image</label>
            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setImageFile(e.target.files[0])} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', width: '100%', justifyContent: 'center', borderStyle: 'dashed', borderRadius: '12px' }}>
                <ImageIcon size={18} /> {imageFile ? imageFile.name : 'Choose Image (optional)'}
              </button>
            </div>
          </div>
          {/* Preview card */}
          {eventForm.title && (
            <div style={{ marginTop: '4px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Preview</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '48px', background: 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{eventForm.date ? new Date(eventForm.date + 'T00:00:00').getDate() : '—'}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{eventForm.date ? new Date(eventForm.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }) : ''}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem', marginBottom: '2px' }}>{eventForm.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {eventForm.time && <span>🕐 {eventForm.time}</span>}
                    {eventForm.location && <span>📍 {eventForm.location}</span>}
                    {eventForm.ticketPrice && parseFloat(eventForm.ticketPrice) > 0 ? <span>💷 £{eventForm.ticketPrice}</span> : <span>🎟️ Free</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        {eventStep > 0 && (
          <button onClick={() => setEventStep(eventStep - 1)} className="btn btn-outline interactive-press" style={{ padding: '14px', flex: 1, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            ← Back
          </button>
        )}
        {eventStep < 2 ? (
          <button 
            onClick={() => setEventStep(eventStep + 1)} 
            disabled={!canAdvanceStep()}
            className="btn btn-primary interactive-press" 
            style={{ padding: '14px', flex: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: canAdvanceStep() ? 1 : 0.4 }}
          >
            Next: {eventSteps[eventStep + 1].label} →
          </button>
        ) : (
          <button 
            onClick={() => { if (editingEventId) handleSaveEvent(); else handleCreateEvent(); }}
            disabled={isUploading || !canAdvanceStep()}
            className="btn btn-primary interactive-press" 
            style={{ padding: '14px', flex: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, var(--teal-500), #3b82f6)', opacity: isUploading ? 0.7 : 1 }}
          >
            <Check size={18} /> {isUploading ? 'Publishing...' : editingEventId ? 'Save Changes' : 'Publish Event'}
          </button>
        )}
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="view-dashboard dashboard-layout" style={{ position: 'relative', minHeight: '100vh', display: 'flex' }}>
      {/* Desktop Sidebar */}
      {community && (
        <div className="dashboard-sidebar desktop-only">
          <div className="dashboard-sidebar-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'white', margin: '0 0 4px' }}>{community.name}</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Leader View</div>
          </div>
          <div style={{ flex: 1 }}>
            {[
              { id: 'overview', icon: Activity, label: 'Overview' },
              { id: 'events', icon: Calendar, label: 'Events' },
              { id: 'monetisation', icon: DollarSign, label: 'Monetisation' },
              { id: 'experiences', icon: Globe, label: 'Experiences' },
              { id: 'experiences', icon: Globe, label: 'Experiences' },
              { id: 'social hub', icon: Heart, label: 'Social Hub' },
              { id: 'crm', icon: BarChart3, label: 'CRM' },
              { id: 'members', icon: Users, label: 'Members' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`dashboard-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={18} />
                <span style={{ textTransform: 'capitalize' }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
      {!community ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'white', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '16px' }}>Lead a Community</h2>
          <p style={{ color: 'var(--slate-400)', marginBottom: '32px' }}>You do not lead any communities yet. Start one today!</p>
          <button onClick={() => setModalType('community')} className="btn btn-primary interactive-press" style={{ padding: '16px 32px', borderRadius: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Create Community
          </button>
          {modalType === 'community' && <CommunityOnboardingFlow onComplete={() => setModalType(null)} />}
        </div>
      ) : (
        <>
          <div className="mobile-only">
            <AppHeader title="Dashboard" />
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>{community.name} • Leader View</div>
            </div>
          </div>

          <div className="dashboard-content-scroll">
          {/* Tab Navigation (Mobile) */}
          <div className="mobile-only" style={{ padding: '0 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {['overview', 'events', 'monetisation', 'experiences', 'experiences', 'social hub', 'crm', 'members', 'settings'].map(tab => (
                <button 
                  key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: '10px', border: 'none',
                    background: activeTab === tab ? 'rgba(20,184,166,0.15)' : 'transparent',
                    color: activeTab === tab ? 'var(--teal-300)' : 'var(--slate-400)',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize',
                    whiteSpace: 'nowrap', transition: 'all 0.2s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: OVERVIEW — Command Centre                       */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid 2×3 */}
              <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                <StatCard value={stats.totalMembers || 0} label="Total Members" icon={Users} color="white" />
                <StatCard value={stats.activeMembers || 0} label="Active Members" icon={Activity} color="#22c55e" accent="#22c55e" />
                <StatCard value={`£${stats.totalRevenue || 0}`} label="Total Revenue" icon={DollarSign} color="#f59e0b" accent="#f59e0b" />
                <StatCard value={stats.eventsThisMonth || 0} label="Events This Month" icon={Calendar} color="var(--teal-400)" />
                <StatCard value={`${stats.checkinRate || 0}%`} label="Check-in Rate" icon={ScanLine} color="#3b82f6" accent="#3b82f6" />
                <StatCard 
                  value={stats.daysToNext !== null ? (stats.daysToNext === 0 ? 'Today!' : `${stats.daysToNext}d`) : '—'} 
                  label="Next Event" icon={Zap} color="#a78bfa" accent="#a78bfa" 
                />
              </div>

              {/* Member Growth Chart */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div className="glass-panel stagger-item" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-300)' }}>Member Growth</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Last 7 weeks</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', height: '80px' }}>
                    {growthData.weeks.map((w, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ 
                          width: '100%', 
                          height: `${Math.max(10, (w.count / growthData.max) * 100)}%`, 
                          background: i === growthData.weeks.length - 1 ? 'var(--teal-500)' : 'rgba(20,184,166,0.25)', 
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s ease'
                        }}></div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>{w.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Event Hero Card */}
              {stats.nextEvent && (
                <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                  <div 
                    onClick={() => setActiveTab('events')}
                    className="interactive-press stagger-item"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(59,130,246,0.08) 100%)',
                      border: '1px solid rgba(20,184,166,0.2)',
                      borderRadius: '16px', padding: '18px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '14px',
                    }}
                  >
                    <div style={{ width: '56px', height: '60px', background: 'rgba(20,184,166,0.15)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{parseDateParts(stats.nextEvent.date).day}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{parseDateParts(stats.nextEvent.date).month}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--teal-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        {stats.daysToNext === 0 ? '🔴 Happening Today' : stats.daysToNext === 1 ? '⏰ Tomorrow' : `Coming up in ${stats.daysToNext} days`}
                      </div>
                      <div style={{ fontWeight: 600, color: 'white', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.nextEvent.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> {stats.nextEvent.time}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} /> {stats.nextEvent.location}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--teal-400)" />
                  </div>
                </div>
              )}

              {/* Create Event — Prominent CTA when no upcoming events */}
              {!stats.nextEvent && (
                <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                  <div 
                    onClick={() => openEventWizard()}
                    className="interactive-press"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.06) 100%)',
                      border: '1px dashed rgba(20,184,166,0.3)',
                      borderRadius: '16px', padding: '28px 20px', cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal-500), #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Plus size={24} color="white" />
                    </div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem', marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>Create Your First Event</div>
                    <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem', lineHeight: 1.5 }}>Events bring your community together. Set up one in under a minute.</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'New Event', icon: Plus, color: '#14b8a6', action: () => openEventWizard() },
                    { label: 'Broadcast', icon: Megaphone, color: '#f59e0b', action: () => setActiveTab('crm') },
                    { label: 'Scan QR', icon: QrCode, color: '#3b82f6', action: () => setShowScanner(true) },
                    { label: 'CRM', icon: BarChart3, color: '#a78bfa', action: () => setActiveTab('crm') },
                    { label: 'Microsite', icon: Globe, color: '#f43f5e', action: () => router.push(`/community/${community.id}`) },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} className="interactive-press" style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 8px',
                      background: `${a.color}08`, border: `1px solid ${a.color}20`, borderRadius: '12px',
                      color: a.color, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                    }}>
                      <a.icon size={20} />
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Recent Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                    <div key={i} className="stagger-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <a.icon size={14} color={a.color} />
                      </div>
                      <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--slate-300)' }}>{a.text}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-600)', whiteSpace: 'nowrap' }}>{a.time}</div>
                    </div>
                  )) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No recent activity yet — create your first event!</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: EVENTS                                          */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'events' && (
            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--teal-400)" /> My Events
                </h2>
                <button onClick={() => openEventWizard()} className="btn btn-primary interactive-press" style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> New Event
                </button>
              </div>

              {communityEvents.length === 0 ? (
                <div 
                  onClick={() => openEventWizard()}
                  className="interactive-press"
                  style={{ padding: '40px 24px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(20,184,166,0.06) 0%, rgba(59,130,246,0.04) 100%)', borderRadius: '20px', border: '1px dashed rgba(20,184,166,0.25)', cursor: 'pointer' }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(59,130,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px dashed rgba(20,184,166,0.3)' }}>
                    <Calendar size={28} color="var(--teal-400)" />
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'white', margin: '0 0 8px', fontSize: '1.15rem' }}>Create Your First Event</h3>
                  <p style={{ color: 'var(--slate-400)', margin: '0 0 20px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Events are the heartbeat of your community. Set one up in under a minute with our guided wizard.
                  </p>
                  <div className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Plus size={18} /> Get Started
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {communityEvents.map(event => {
                    const { day, month } = parseDateParts(event.date);
                    const ev = getEventRevenue(event);
                    const isCancelled = event.status === 'cancelled';
                    const isExpanded = expandedEventId === event.id;
                    const attendees = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
                    
                    return (
                      <div key={event.id} className="stagger-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', ...(isCancelled ? { opacity: 0.5 } : {}) }}>
                        <div style={{ display: 'flex', gap: '14px', padding: '14px' }}>
                          {/* Date block */}
                          <div style={{ width: '48px', height: '54px', background: 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{day}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{month}</div>
                          </div>
                          
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, flex: 1, fontSize: '0.95rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h4>
                              <span className={`status-badge ${event.status || 'published'}`}>{event.status || 'live'}</span>
                            </div>
                            
                            {/* Meta row */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} /> {event.time}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} /> {event.location}</span>
                            </div>
                            
                            {/* Stats row */}
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                              <span style={{ color: 'var(--teal-400)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <UserCheck size={12} /> {ev.rsvpCount}{event.maxCapacity ? `/${event.maxCapacity}` : ''} going
                              </span>
                              {ev.price > 0 && (
                                <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <DollarSign size={12} /> £{ev.revenue} revenue
                                </span>
                              )}
                              <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <ScanLine size={12} /> {ev.checkedIn} checked in
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        {!isCancelled && (
                          <div style={{ display: 'flex', gap: '6px', padding: '0 14px 10px', flexWrap: 'wrap' }}>
                            <button onClick={() => setShowScanner(true)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--teal-400)', borderColor: 'rgba(20,184,166,0.3)' }}>
                              <QrCode size={12} style={{ marginRight: '4px' }} /> Scan
                            </button>
                            <button onClick={() => setFlyerEvent(event)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}>
                              <ImageIcon size={12} style={{ marginRight: '4px' }} /> Flyer
                            </button>
                            <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                              {isExpanded ? <ChevronUp size={12} style={{ marginRight: '4px' }} /> : <ChevronDown size={12} style={{ marginRight: '4px' }} />}
                              {isExpanded ? 'Hide' : 'Attendees'}
                            </button>
                            <button onClick={() => handleEditEvent(event)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                              <Edit3 size={12} style={{ marginRight: '4px' }} /> Edit
                            </button>
                            {cancelConfirmId === event.id ? (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Cancel?</span>
                                <button onClick={() => handleCancelEvent(event.id)} className="btn btn-danger interactive-press" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>Yes</button>
                                <button onClick={() => setCancelConfirmId(null)} className="btn btn-outline interactive-press" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>No</button>
                              </div>
                            ) : (
                              <button onClick={() => setCancelConfirmId(event.id)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                                <Ban size={12} style={{ marginRight: '4px' }} /> Cancel
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Expandable Attendee List */}
                        {isExpanded && attendees.length > 0 && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '4px' }}>Attendees ({attendees.length})</div>
                            {attendees.map((rsvp, idx) => {
                              const attendee = users.find(u => u.id === rsvp.userId);
                              if (!attendee) return null;
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                                  <img src={attendee.avatar} alt={attendee.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                  <span style={{ flex: 1, fontSize: '0.85rem', color: 'white' }}>{attendee.name}</span>
                                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 600, ...(rsvp.checkedIn ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--slate-500)' }) }}>
                                    {rsvp.checkedIn ? '✓ Checked In' : 'Pending'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {isExpanded && attendees.length === 0 && (
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px 14px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem' }}>No attendees yet</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: MONETISATION                                    */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'monetisation' && (
            <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
              {/* Revenue Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                <StatCard value={`£${stats.totalRevenue || 0}`} label="All-Time Revenue" icon={DollarSign} color="#f59e0b" accent="#f59e0b" />
                <StatCard value={`£${stats.monthRevenue || 0}`} label="This Month" icon={TrendingUp} color="#22c55e" accent="#22c55e" />
              </div>

              {/* Community Subscription Pricing */}
              <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Crown size={18} color="#f59e0b" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-heading)' }}>Community Subscription</h3>
                </div>
                <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  Set a monthly price for your community. New members will be asked to pay before joining. Existing members are not affected.
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--slate-300)', fontSize: '1.2rem', fontWeight: 700 }}>£</span>
                  <input 
                    type="number" value={subscriptionPrice} onChange={e => setSubscriptionPrice(e.target.value)}
                    placeholder="0" min="0" step="1"
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px', color: 'white', fontSize: '1.1rem', fontWeight: 600 }}
                  />
                  <span style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>/ month</span>
                </div>
                <button onClick={handleSaveSubscriptionPrice} className="btn btn-primary interactive-press" style={{ width: '100%', padding: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={16} /> Save Pricing
                </button>
              </div>

              {/* Revenue Per Event */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Revenue by Event</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {publishedEvents.length > 0 ? publishedEvents.map(event => {
                    const ev = getEventRevenue(event);
                    return (
                      <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white', marginBottom: '2px' }}>{event.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{ev.rsvpCount} tickets × £{ev.price}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: ev.revenue > 0 ? '#f59e0b' : 'var(--slate-500)', fontSize: '1rem' }}>£{ev.revenue}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{ev.price > 0 ? 'Paid' : 'Free'}</div>

                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '12px' }}>
                        <Calendar size={24} />
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--white)' }}>No upcoming events</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--slate-400)', maxWidth: '250px' }}>Create your first event to start engaging with your community.</p>
                      <button className="btn btn-outline" style={{ marginTop: '16px', borderRadius: '20px', padding: '8px 20px' }} onClick={() => openEventWizard()}>Create Event</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Simulated Payout Summary */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={18} color="var(--teal-400)" />
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--white)' }}>Stripe Payouts</span>
                  </div>
                  <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600 }}>Connected</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>In Transit</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal-400)' }}>£450.00</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '4px' }}>Expected Nov 12</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Lifetime Revenue</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--white)' }}>£3,240.00</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '4px' }}>Since Mar 2026</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal-500)' }}></div>
                   <span style={{ fontSize: '0.85rem', color: 'var(--slate-300)' }}>Payouts arrive daily on a 7-day rolling basis.</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: SOCIAL HUB                                      */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'social hub' && (
            <div style={{ padding: '0 20px', paddingBottom: '40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <SocialHub communityId={community.id} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: CRM                                             */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'crm' && (
            <div style={{ padding: '0 20px', paddingBottom: '40px' }}>
              <MemberCRM communityId={community.id} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: MEMBERS                                         */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'members' && (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '40px' }}>
              <button onClick={() => setModalType('members')} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <Users size={20} />
                </div>
                <span style={{ flex: 1, fontWeight: 500 }}>Manage Members</span>
                <span style={{ color: 'var(--slate-500)' }}>→</span>
              </button>

              <button onClick={() => setModalType('coleader')} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <UserPlus size={20} />
                </div>
                <span style={{ flex: 1, fontWeight: 500 }}>Promote Co-Leaders</span>
                <span style={{ color: 'var(--slate-500)' }}>→</span>
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB: SETTINGS — Full Config                          */}
          {/* ══════════════════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '40px' }}>
              {/* Edit Profile */}
              <button onClick={handleEditClick} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                  <Edit3 size={20} />
                </div>
                <span style={{ flex: 1, fontWeight: 500 }}>Edit Microsite Profile</span>
                <ChevronRight size={16} color="var(--slate-500)" />
              </button>

              {/* WhatsApp */}
              <button onClick={() => { setWaConfig(whatsappSettings[community.id] || { businessConnected: false, groupLink: '' }); setModalType('whatsapp'); }} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <MessageCircle size={20} />
                </div>
                <span style={{ flex: 1, fontWeight: 500 }}>WhatsApp Integration</span>
                <ChevronRight size={16} color="var(--slate-500)" />
              </button>

              {/* Community Visibility */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    {communityVisibility === 'public' ? <Eye size={20} /> : <EyeOff size={20} />}
                  </div>
                  <span style={{ fontWeight: 500, color: 'white' }}>Community Visibility</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['public', 'private', 'invite-only'].map(v => (
                    <button key={v} onClick={() => { 
                      setCommunityVisibility(v);
                      updateCommunity(community.id, { visibility: v });
                      toast.info('Visibility updated', `Community is now ${v}`);
                    }} className="interactive-press" style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                      background: communityVisibility === v ? 'rgba(20,184,166,0.15)' : 'rgba(255,255,255,0.03)',
                      color: communityVisibility === v ? 'var(--teal-300)' : 'var(--slate-400)',
                      fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer'
                    }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Member Approval */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <Shield size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'white', marginBottom: '2px' }}>Require Approval</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>New members must be approved</div>
                </div>
                <button onClick={() => { 
                    const newVal = !requireApproval;
                    setRequireApproval(newVal); 
                    updateCommunity(community.id, { require_approval: newVal });
                    toast.info(newVal ? 'Approval required' : 'Auto-approve enabled', newVal ? 'You\'ll review join requests' : 'Members join instantly'); 
                  }} style={{
                  width: '44px', height: '24px', borderRadius: '99px', border: 'none',
                  background: requireApproval ? 'var(--teal-500)' : 'rgba(255,255,255,0.1)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: requireApproval ? '22px' : '2px', transition: 'left 0.2s' }}></div>
                </button>
              </div>

              {/* Export Data */}
              <button onClick={handleExportCSV} className="interactive-press" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)' }}>
                  <Download size={20} />
                </div>
                <span style={{ flex: 1, fontWeight: 500 }}>Export Member Data (CSV)</span>
                <ChevronRight size={16} color="var(--slate-500)" />
              </button>

              {/* Danger Zone */}
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Danger Zone</div>
                {!deleteConfirm ? (
                  <button onClick={() => setDeleteConfirm(true)} className="btn btn-danger interactive-press" style={{ width: '100%', padding: '14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Trash2 size={16} /> Delete Community
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>This cannot be undone. All data, events, and members will be permanently removed.</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { toast.error('Not yet available', 'Community deletion requires admin approval'); setDeleteConfirm(false); }} className="btn btn-danger interactive-press" style={{ flex: 1, padding: '12px' }}>Confirm Delete</button>
                      <button onClick={() => setDeleteConfirm(false)} className="btn btn-outline interactive-press" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div> {/* closes dashboard-content-scroll */}
        </>
      )}
      </div> {/* closes dashboard-main */}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {(isEditing || (modalType && modalType !== 'community')) && (
        <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'white' }}>
              {isEditing ? 'Edit Profile' : 
               modalType === 'event' ? 'Create Event' : 
               modalType === 'edit-event' ? 'Edit Event' :
               modalType === 'members' ? 'Manage Members' : 
               modalType === 'whatsapp' ? 'WhatsApp Integration' : 'Promote Co-Leader'}
            </h2>
            <button onClick={() => { setIsEditing(false); setModalType(null); setEditingEventId(null); setCoLeaderSearch(''); }} className="interactive-press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Edit Profile */}
            {isEditing && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem' }}>Community Description</label>
                  <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white', minHeight: '120px', fontFamily: 'inherit', resize: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem' }}>Vibe & Values Tags (comma separated)</label>
                  <input type="text" value={editForm.tags} onChange={(e) => setEditForm({...editForm, tags: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white' }} />
                </div>
              </>
            )}

            {/* Event Forms */}
            {(modalType === 'event' || modalType === 'edit-event') && renderEventForm()}

            {/* Members Modal */}
            {modalType === 'members' && (
              <div style={{ color: 'white' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{memberList.length} Members</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {memberList.map(membership => {
                    const memberUser = users.find(u => u.id === membership.userId);
                    if (!memberUser) return null;
                    return (
                      <div key={memberUser.id} className="stagger-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={memberUser.avatar} alt={memberUser.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {memberUser.name}
                              {membership.role === 'Leader' && <span style={{ fontSize: '0.7rem', background: 'var(--teal-500)', padding: '2px 6px', borderRadius: '4px' }}>Leader</span>}
                              {membership.role === 'Co-Leader' && <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.3)', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px' }}>Co-Leader</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Joined {memberUser.joinedDate || memberUser.joined}</div>
                          </div>
                        </div>
                        {membership.role !== 'Leader' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handlePromote(memberUser)} className="btn btn-outline interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Promote</button>
                            <button onClick={() => handleRemove(memberUser)} className="btn btn-danger interactive-press" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Remove</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Co-Leader Promotion — FIXED */}
            {modalType === 'coleader' && (
              <div style={{ color: 'white' }}>
                <p style={{ color: 'var(--slate-400)', marginBottom: '12px' }}>Search for a member to promote to Co-Leader.</p>
                <input 
                  placeholder="Search members by name..." 
                  value={coLeaderSearch}
                  onChange={e => setCoLeaderSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white', marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {memberList
                    .filter(m => m.role !== 'Leader' && m.role !== 'Co-Leader')
                    .filter(m => {
                      const u = users.find(usr => usr.id === m.userId);
                      return coLeaderSearch ? u?.name?.toLowerCase().includes(coLeaderSearch.toLowerCase()) : true;
                    })
                    .map(membership => {
                      const memberUser = users.find(u => u.id === membership.userId);
                      if (!memberUser) return null;
                      return (
                        <div key={memberUser.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={memberUser.avatar} alt={memberUser.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                            <span style={{ fontWeight: 500 }}>{memberUser.name}</span>
                          </div>
                          <button onClick={() => { handlePromote(memberUser); setModalType(null); setCoLeaderSearch(''); }} className="btn btn-primary interactive-press" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}>
                            <Crown size={12} style={{ marginRight: '4px' }} /> Promote
                          </button>
                        </div>
                      );
                    })}
                  {memberList.filter(m => m.role !== 'Leader' && m.role !== 'Co-Leader').length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)' }}>No eligible members to promote.</div>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp Settings */}
            {modalType === 'whatsapp' && (
              <div style={{ color: 'white' }}>
                <p style={{ color: 'var(--slate-400)', marginBottom: '24px', fontSize: '0.9rem' }}>Bridge your community with WhatsApp. Enable the Business API for native chat sync, or provide a group link as a fallback.</p>
                <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600 }}>Business API Sync (CRM)</div>
                    <button onClick={() => setWaConfig({...waConfig, businessConnected: !waConfig.businessConnected})} style={{ background: waConfig.businessConnected ? 'var(--teal-500)' : 'var(--slate-700)', border: 'none', borderRadius: '16px', width: '40px', height: '24px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: '2px', left: waConfig.businessConnected ? '18px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }}></div>
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', margin: 0 }}>Syncs app chat with members' personal WhatsApp numbers.</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>Fallback Group Link</label>
                  <input placeholder="https://chat.whatsapp.com/..." value={waConfig.groupLink} onChange={e => setWaConfig({...waConfig, groupLink: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'white' }} />
                </div>
              </div>
            )}
          </div>

          {/* Modal Action Button — skip for event forms (wizard has its own buttons) */}
          {(isEditing || (modalType && modalType !== 'community' && modalType !== 'coleader' && modalType !== 'event' && modalType !== 'edit-event')) && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button 
                onClick={() => { 
                  if(isEditing) handleSave(); 
                  else if (modalType === 'whatsapp') {
                    setWhatsappSettings(prev => ({...prev, [community.id]: waConfig}));
                    toast.success('WhatsApp Settings Saved', 'Your community chat integration has been updated.');
                    setModalType(null);
                  }
                  else { toast.success('Done!', 'Action completed'); setModalType(null); }
                }} 
                disabled={isUploading}
                className="btn btn-primary interactive-press" 
                style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%', padding: '16px', borderRadius: '12px', opacity: isUploading ? 0.7 : 1 }}>
                <Check size={20} /> 
                {isUploading ? 'Uploading...' : isEditing ? 'Save Changes' : modalType === 'whatsapp' ? 'Save Settings' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Event Flyer Generator Modal */}
      {flyerEvent && (
        <EventFlyerGenerator
          event={flyerEvent}
          community={community}
          onClose={() => setFlyerEvent(null)}
          uploadImage={uploadImage}
        />
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner 
          onScan={(data) => {
            if (data.eventId && data.userId) {
              checkInMember(data.eventId, data.userId);
              toast.success('Checked in!', `${data.userName} has been checked in.`);
            }
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Discovery Modal */}
      {isDiscoveryModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe color="var(--teal-400)" size={20} /> Third-Party Discovery
            </h2>
            <button onClick={() => setIsDiscoveryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}><X size={24} /></button>
          </div>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Search for premium experiences from our partners to offer your community members.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <select 
                value={discoveryProvider} 
                onChange={e => setDiscoveryProvider(e.target.value)}
                style={{ width: '150px', padding: '12px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)', color: 'white', borderRadius: '12px' }}
              >
                <option value="viator">Viator Partner</option>
                <option value="google">Google Places</option>
              </select>
              <input 
                type="text" 
                placeholder="Search destination (e.g. Tunbridge Wells)" 
                value={discoverySearchTerm} 
                onChange={e => setDiscoverySearchTerm(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSimulateApiSearch()}
                style={{ flex: 1, padding: '12px', background: 'var(--slate-900)', border: '1px solid var(--slate-700)', color: 'white', borderRadius: '12px' }} 
              />
              <button 
                onClick={handleSimulateApiSearch}
                disabled={isDiscovering || !discoverySearchTerm.trim()}
                className="btn btn-primary interactive-press" 
                style={{ padding: '0 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', opacity: (isDiscovering || !discoverySearchTerm.trim()) ? 0.7 : 1 }}
              >
                {isDiscovering ? <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span> : <Search size={16} />}
                Search
              </button>
            </div>

            {isDiscovering && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate-400)' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--teal-400)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                Querying {discoveryProvider === 'viator' ? 'Viator Partner API' : 'Google Places API'}...
              </div>
            )}

            {!isDiscovering && discoveryResults && (
              <div>
                <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '16px' }}>Results ({discoveryResults.length})</h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {discoveryResults.map(exp => (
                    <div key={exp.id} style={{ display: 'flex', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                      <img src={exp.image} alt={exp.title} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.category} • {exp.source}</div>
                        <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1rem' }}>{exp.title}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', marginBottom: '8px' }}>{exp.description}</div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                          <span>{exp.duration}</span>
                          <span>⭐ {exp.rating}</span>
                          <span style={{ color: 'white', fontWeight: 600 }}>£{exp.basePrice} base</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => handleImportExperience(exp)} className="btn btn-outline interactive-press" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          Import to Community
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
