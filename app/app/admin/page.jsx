"use client";
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, Shield, Activity, Users, Map, CheckCircle, XCircle, Search, BadgeCheck, Check, X,
  TrendingUp, DollarSign, Calendar, Eye, Ban, Crown, ChevronDown, ChevronUp, 
  MessageCircle, Bell, Download, Settings, Database, Megaphone, Flag,
  BarChart3, UserCheck, Zap, Star, Globe, Lock, Mail, Clock, AlertTriangle,
  ChevronRight, ScanLine, Ticket, Copy, Store, Sparkles, Coffee, Compass, ExternalLink, RefreshCw, Radio, Trash2
} from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { useFeed } from '../../src/context/FeedContext';
import { useChat } from '../../src/context/ChatContext';
import { useToast } from '../../src/components/Toast';
import { useRouter as useNavigate, useSearchParams } from 'next/navigation';
import LeaderCRM from '../../src/components/admin/LeaderCRM';
import dynamic from 'next/dynamic';
const OperationsMap = dynamic(() => import('../../src/components/admin/OperationsMap'), { ssr: false });
import Commercials from '../../src/components/admin/Commercials';
import ModerationQueue from '../../src/components/admin/ModerationQueue';
import InvestorAnalytics from '../../src/components/admin/InvestorAnalytics';
import { resolveUserAvatar } from '../../src/lib/avatar';
import { isCommunityPendingChapter } from '../../src/lib/communityVisibility';
import { supabase } from '../../src/lib/supabaseClient';
import { getAdminUserEmailsAction } from '../../src/lib/actions';

// ─── Shared Components ────────────────────────────────────
const StatCard = ({ value, label, icon: Icon, color, accent, onClick, description }) => (
  <div 
    onClick={onClick}
    className="glass-panel stagger-item interactive-hover" 
    style={{ 
      padding: '16px', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.18s ease',
      borderRadius: '14px',
      ...(accent ? { border: `1px solid ${accent}30`, background: `linear-gradient(135deg, ${accent}12 0%, ${accent}02 100%)` } : {}) 
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
      <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: color || 'var(--ink-primary)' }}>{value}</div>
      {Icon && (
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color || 'var(--slate-500)'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color || 'var(--slate-500)'} />
        </div>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {onClick && <ChevronRight size={13} color="var(--slate-500)" />}
    </div>
    {description && (
      <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginTop: '4px' }}>{description}</div>
    )}
  </div>
);

const SearchBar = ({ placeholder, value, onChange }) => (
  <div style={{ position: 'relative', marginBottom: '16px' }}>
    <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange}
      style={{ 
        width: '100%', 
        background: 'var(--surface-card)', 
        border: '1px solid var(--hairline-border-strong)', 
        borderRadius: '12px', 
        padding: '12px 12px 12px 42px', 
        color: 'var(--ink-primary)', 
        fontSize: '0.88rem' 
      }} 
    />
  </div>
);

const FilterPills = ({ options, active, onChange }) => (
  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
    {options.map(opt => (
      <button 
        key={opt.value} 
        onClick={() => onChange(opt.value)} 
        className="interactive-press"
        style={{ 
          padding: '7px 14px', 
          borderRadius: '99px', 
          border: active === opt.value ? '1px solid var(--ink-primary)' : '1px solid var(--hairline-border-strong)', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          background: active === opt.value ? 'var(--ink-primary)' : 'var(--surface-card)',
          color: active === opt.value ? 'var(--surface-canvas)' : 'var(--ink-secondary)',
          transition: 'all 0.15s ease'
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const HealthBadge = ({ health }) => {
  const config = { 
    active: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: '● Active' },
    moderate: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: '● Moderate' },
    dormant: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: '● Dormant' } 
  };
  const c = config[health] || config.moderate;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: '12px', background: c.bg, color: c.color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    user, 
    realUser,
    simulatedPersona,
    setSimulatedPersona,
    impersonatedUserId,
    setImpersonatedUserId,
    exitSimulator,
    isSimulating,
    communities, 
    users, 
    events, 
    communityMemberships, 
    eventRsvps, 
    sponsors,
    sponsorshipAssignments,
    adminVerifyCommunity, 
    approveChapter,
    declineChapter,
    updateUser, 
    adminDeleteUser,
    notifications, 
    broadcastNotification, 
    platformBroadcast, 
    toggleUserRole, 
    updateCommunity, 
    updateEvent,
    cancelEvent,
    checkInMember,
    sendEventReminder,
    isLoading 
  } = useAppContext();

  const { feedPosts } = useFeed();
  const { messages } = useChat();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [communityFilter, setCommunityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [broadcastText, setBroadcastText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [verifyingCommunityId, setVerifyingCommunityId] = useState(null);
  const [updatingEventId, setUpdatingEventId] = useState(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [simulatedCommunityId, setSimulatedCommunityId] = useState(null);
  const [authEmailMap, setAuthEmailMap] = useState({});

  React.useEffect(() => {
    const hasAdminAccess = realUser?.isAdmin || user?.isAdmin;
    if (!isLoading && !hasAdminAccess) {
      navigate.push('/app');
    }
  }, [user, realUser, isLoading, navigate]);

  React.useEffect(() => {
    const hasAdminAccess = realUser?.isAdmin || user?.isAdmin;
    if (isLoading || !hasAdminAccess) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await getAdminUserEmailsAction(session.access_token);
        if (!cancelled && res?.emails) {
          setAuthEmailMap(res.emails);
        }
      } catch (e) {
        console.warn('Could not fetch auth user emails:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.isAdmin, realUser?.isAdmin, isLoading]);

  
function extractUserEmail(u) {
  if (!u) return '';
  if (u.id && authEmailMap[u.id]) return authEmailMap[u.id];
  if (u.email) return u.email;
  const match = (u.bio || '').match(/\[Email:\s*([^\]]+)\]/i);
  if (match) return match[1].trim();
  const intMatch = (u.interests || []).find(i => typeof i === 'string' && i.startsWith('email:'));
  if (intMatch) return intMatch.replace('email:', '').trim();
  return '';
}

const ADMIN_EMAILS = [
    'msf199@hotmail.com',
    'mattfenton123@gmail.com',
    'matthewfenton123@gmail.com',
    'matt@inspiredventures.co.uk',
    'alex@maorecommunity.co.uk',
    'alex@morecommunity.co.uk',
    'matt@morecommunity.app',
    'alex@morecommunity.app'
  ];

  // ─── Platform-wide computed stats ─────────────────────────
  const platformStats = useMemo(() => {
    const totalUsers = users.length;
    const totalCommunities = communities.length;
    const verifiedCommunities = communities.filter(c => c.verified).length;
    const publishedEventsList = events.filter(e => e.status !== 'proposed');
    const totalEvents = publishedEventsList.length;
    const activeEvents = publishedEventsList.filter(e => e.status !== 'cancelled').length;

    const isGoingOrCheckedIn = (r) => r && (r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in);
    const isCheckedInRsvp = (r) => r && (r.checkedIn || r.checked_in || r.status === 'checked_in');

    // Revenue (exclude cancelled & proposed events)
    let totalRevenue = 0;
    let monthRevenue = 0;
    const now = new Date();
    publishedEventsList.filter(e => e.status !== 'cancelled').forEach(event => {
      const price = event.ticketPrice || 0;
      const rsvps = (eventRsvps[event.id] || []).filter(isGoingOrCheckedIn);
      const rev = price * rsvps.length;
      totalRevenue += rev;
      if (event.date) {
        const d = new Date(event.date + 'T00:00:00');
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthRevenue += rev;
      }
    });

    // Total RSVPs and check-ins
    let totalRsvps = 0, totalCheckins = 0;
    Object.values(eventRsvps).forEach(rsvps => {
      totalRsvps += (rsvps || []).filter(isGoingOrCheckedIn).length;
      totalCheckins += (rsvps || []).filter(isCheckedInRsvp).length;
    });
    const avgAttendance = activeEvents > 0 ? Math.round(totalRsvps / activeEvents) : 0;

    // Community health
    const communityHealth = communities.map(c => {
      const members = (communityMemberships[c.id] || []).length;
      const cEventsList = events.filter(e => e.communityId === c.id && e.status !== 'cancelled' && e.status !== 'proposed');
      const cEvents = cEventsList.length;
      const cMessages = messages.filter(m => m.communityId === c.id).length;
      const activityScore = members * 2 + cEvents * 10 + cMessages;
      const health = activityScore >= 30 ? 'active' : activityScore >= 10 ? 'moderate' : 'dormant';
      
      let cRevenue = 0;
      cEventsList.forEach(e => {
        cRevenue += (e.ticketPrice || 0) * (eventRsvps[e.id] || []).filter(isGoingOrCheckedIn).length;
      });
      
      return { ...c, members, cEvents, cMessages, activityScore, health, cRevenue };
    });

    return { totalUsers, totalCommunities, verifiedCommunities, totalEvents, activeEvents, 
             totalRevenue, monthRevenue, totalRsvps, totalCheckins, avgAttendance, communityHealth };
  }, [users, communities, events, messages, communityMemberships, eventRsvps]);

  // ─── Filtered lists ───────────────────────────────────────
  const filteredCommunities = useMemo(() => {
    let list = platformStats.communityHealth;
    if (communityFilter === 'verified') list = list.filter(c => c.verified);
    if (communityFilter === 'unverified') list = list.filter(c => !c.verified);
    if (communityFilter === 'active') list = list.filter(c => c.health === 'active');
    if (communityFilter === 'dormant') list = list.filter(c => c.health === 'dormant');
    if (searchTerm) list = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [platformStats.communityHealth, communityFilter, searchTerm]);

  const filteredUsers = useMemo(() => {
    let list = users.map(u => {
      const resolvedEmail = extractUserEmail(u);
      const isAdmin = ADMIN_EMAILS.includes(resolvedEmail?.toLowerCase()) || !!u.is_admin;
      const ledCommunity = communities.find(c => {
        const mems = communityMemberships[c.id] || [];
        return mems.some(m => m.userId === u.id && m.role === 'Leader');
      });
      const joinedCount = Object.values(communityMemberships).filter(mems => mems.some(m => m.userId === u.id)).length;
      return { ...u, email: resolvedEmail, isAdmin, isLeader: !!ledCommunity, ledCommunityName: ledCommunity?.name, joinedCount };
    });
    if (userFilter === 'admins') list = list.filter(u => u.isAdmin);
    if (userFilter === 'leaders') list = list.filter(u => u.isLeader);
    if (userFilter === 'members') list = list.filter(u => !u.isAdmin && !u.isLeader);
    if (userFilter === 'suspended') list = list.filter(u => Boolean(u.is_suspended));
    if (searchTerm) list = list.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [users, communities, communityMemberships, userFilter, searchTerm, authEmailMap]);

  const filteredEvents = useMemo(() => {
    let list = events.map(e => {
      const community = communities.find(c => c.id === e.communityId);
      const rsvps = (eventRsvps[e.id] || []).filter(r => r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in);
      const checkins = rsvps.filter(r => r.checkedIn || r.checked_in || r.status === 'checked_in').length;
      const revenue = (e.ticketPrice || 0) * rsvps.length;
      return { ...e, communityName: community?.name || 'Unknown', rsvpCount: rsvps.length, checkins, revenue, rsvpsList: rsvps };
    });
    if (eventFilter === 'upcoming') list = list.filter(e => e.status !== 'cancelled' && e.status !== 'proposed' && new Date(e.date + 'T00:00:00') >= new Date());
    if (eventFilter === 'past') list = list.filter(e => new Date(e.date + 'T00:00:00') < new Date());
    if (eventFilter === 'cancelled') list = list.filter(e => e.status === 'cancelled');
    if (searchTerm) list = list.filter(e => e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.communityName?.toLowerCase().includes(searchTerm.toLowerCase()));
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [events, communities, eventRsvps, eventFilter, searchTerm]);

  // ─── Revenue by community ────────────────────────────────
  const revenueByComm = useMemo(() => {
    return platformStats.communityHealth
      .filter(c => c.cRevenue > 0)
      .sort((a, b) => b.cRevenue - a.cRevenue);
  }, [platformStats.communityHealth]);

  // ─── Recent Activity ─────────────────────────────────────
  const formatActivityDateTime = (timestamp, fallbackDate, fallbackTime) => {
    let d = timestamp ? new Date(timestamp) : null;
    if (!d || isNaN(d.getTime())) {
      if (fallbackDate) {
        d = new Date(`${fallbackDate}T${fallbackTime || '12:00'}`);
      }
    }
    if (!d || isNaN(d.getTime())) return 'Recently';

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const isCurrentYear = d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    if (isCurrentYear) {
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    }
    const fullDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fullDateStr}, ${timeStr}`;
  };

  const recentActivity = useMemo(() => {
    const acts = [];
    users.forEach(u => {
      const ts = u.created_at || u.createdAt;
      acts.push({ 
        id: u.id,
        text: `${u.name} joined the platform`, 
        icon: UserCheck, 
        color: '#22c55e', 
        timestamp: ts ? new Date(ts).getTime() : 0,
        time: formatActivityDateTime(ts), 
        link: `/profile/${u.id}` 
      });
    });
    communities.forEach(c => {
      const ts = c.created_at || c.createdAt;
      acts.push({ 
        id: c.id,
        text: `${c.name} community created`, 
        icon: Globe, 
        color: '#3b82f6', 
        timestamp: ts ? new Date(ts).getTime() : 0,
        time: formatActivityDateTime(ts), 
        link: `/community/${c.id}` 
      });
    });
    events.forEach(e => {
      const comm = communities.find(c => c.id === e.communityId);
      const ts = e.created_at || e.createdAt;
      acts.push({ 
        id: e.id,
        text: `${e.title} scheduled in ${comm?.name || 'Community'}`, 
        icon: Calendar, 
        color: '#EB5738', 
        timestamp: ts ? new Date(ts).getTime() : (e.date ? new Date(`${e.date}T${e.time || '10:00'}`).getTime() : 0),
        time: formatActivityDateTime(ts, e.date, e.time), 
        link: `/events/${e.id}` 
      });
    });
    acts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return acts.slice(0, 10);
  }, [users, communities, events]);

  // ─── Growth data (8 weeks, deterministic from user timestamps) ───
  const growthData = useMemo(() => {
    const weeks = [];
    const nowMs = Date.now();
    for (let i = 7; i >= 0; i--) {
      const cutoffMs = nowMs - i * 7 * 24 * 60 * 60 * 1000;
      const datedCount = users.filter(u => {
        const ts = u.created_at || u.createdAt || u.joined;
        if (!ts) return false;
        const ms = new Date(ts).getTime();
        return !Number.isNaN(ms) && ms <= cutoffMs;
      }).length;
      const undatedCount = users.filter(u => !(u.created_at || u.createdAt || u.joined)).length;
      const baseline = Math.floor(undatedCount * (8 - i) / 8);
      const count = Math.max(1, datedCount + baseline);
      const d = new Date(cutoffMs);
      weeks.push({ count, label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) });
    }
    const max = Math.max(...weeks.map(w => w.count), 1);
    return { weeks, max };
  }, [users]);

  // ─── Handlers ─────────────────────────────────────────────
  const handlePlatformBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsSending(true);
    try {
      await platformBroadcast('📢 Platform Announcement', broadcastText);
      toast.success('Broadcast sent!', `Pushed announcement to ${users.length} users`);
      setBroadcastText('');
    } catch (err) {
      toast.error('Broadcast failed', err.message);
    }
    setIsSending(false);
  };

  const handleExportCSV = (type) => {
    let csv = '';
    if (type === 'users') {
      csv = 'Name,Email,Role,Status,Communities Joined\n' + users.map(u => {
        const email = extractUserEmail(u);
        const joined = Object.values(communityMemberships).filter(m => m.some(mem => mem.userId === u.id)).length;
        return `"${u.name}","${email}","${ADMIN_EMAILS.includes(email?.toLowerCase()) ? 'Admin' : 'Member'}","${u.is_suspended ? 'Suspended' : 'Active'}",${joined}`;
      }).join('\n');
    } else if (type === 'communities') {
      csv = 'Name,Category,Members,Events,Revenue,Verified\n' + platformStats.communityHealth.map(c =>
        `"${c.name}","${c.category || 'General'}",${c.members},${c.cEvents},${c.cRevenue},${c.verified ? 'Yes' : 'No'}`
      ).join('\n');
    } else if (type === 'events') {
      csv = 'Title,Community,Date,RSVPs,Check-ins,Revenue\n' + filteredEvents.map(e =>
        `"${e.title}","${e.communityName}","${e.date}",${e.rsvpCount},${e.checkins},${e.revenue}`
      ).join('\n');
    } else if (type === 'revenue') {
      csv = 'Community,Plan,Events,Members,Gross Revenue,Platform Take,Leader Net\n' + revenueByComm.map(c => {
        const isPro = Boolean(c.is_insured || c.insurance_tier === 'pro');
        const rate = isPro ? 0.02 : 0.05;
        return `"${c.name}","${isPro ? 'Leader Pro (2%)' : 'Standard (5%)'}",${c.cEvents},${c.members},${c.cRevenue},${(c.cRevenue * rate).toFixed(2)},${(c.cRevenue * (1 - rate)).toFixed(2)}`;
      }).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `more-${type}-export.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!', `${type} data downloaded successfully`);
  };

  const handleExportAudienceCSV = () => {
    const rows = [];
    const seen = new Set();
    users.forEach(u => {
      const email = extractUserEmail(u).trim().toLowerCase();
      if (!email || seen.has(email)) return;
      seen.add(email);
      rows.push(`"${(u.name || '').replace(/"/g, '""')}","${email}","Member"`);
    });
    Object.values(eventRsvps || {}).forEach(list => {
      (Array.isArray(list) ? list : []).forEach(r => {
        const email = (r.guestEmail || r.email || '').trim().toLowerCase();
        if (!email || seen.has(email)) return;
        seen.add(email);
        rows.push(`"${(r.guestName || 'Guest').replace(/"/g, '""')}","${email}","Guest"`);
      });
    });
    const csv = 'Name,Email,Type\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'more-audience-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!', `${rows.length} audience emails downloaded`);
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied!', `${label} copied to clipboard`);
  };

  // ═════════════════════════════════════════════════════════
  // TABS CONFIG (Grouped for crisp sidebar navigation)
  // ═════════════════════════════════════════════════════════
  const moderationCount = useMemo(() => {
    const pendingChapters = (communities || []).filter(c => isCommunityPendingChapter(c)).length;
    const suspendedCount = (users || []).filter(u => Boolean(u.is_suspended)).length;
    const proposedCount = (events || []).filter(e => e.status === 'proposed').length;
    return pendingChapters + suspendedCount + proposedCount;
  }, [communities, users, events]);

  const tabGroups = [
    {
      heading: 'Operations',
      items: [
        { key: 'overview', label: 'Overview', icon: BarChart3, subtitle: 'Live platform health, engagement, and community pulse' },
        { key: 'communities', label: 'Communities', icon: Globe, subtitle: 'Directory, verification, featured placement, and payouts' },
        { key: 'users', label: 'Users', icon: Users, subtitle: 'Member directory, role management, and account moderation' },
        { key: 'events', label: 'Events & Attendees', icon: Calendar, subtitle: 'Scheduled meetups, rosters, check-ins, and reminders' },
      ],
    },
    {
      heading: 'Growth & Revenue',
      items: [
        { key: 'analytics', label: 'Investor Analytics', icon: TrendingUp, subtitle: 'Live signups, DAU/MAU stickiness, and retention cohorts' },
        { key: 'crm', label: 'Leader CRM', icon: UserCheck, subtitle: 'Track and onboard prospective local community organisers' },
        { key: 'revenue', label: 'Commercials', icon: DollarSign, subtitle: 'Ticket volume, 5%/2% take-rate, sponsors, and remittances' },
        { key: 'map', label: 'Ops Map', icon: Map, subtitle: 'Regional footprint across active communities and hubs' },
      ],
    },
    {
      heading: 'Trust & System',
      items: [
        { key: 'moderation', label: 'Moderation', icon: Shield, badge: moderationCount, subtitle: 'Pending chapter sign-offs, suspended accounts, and proposals' },
        { key: 'content', label: 'Content & Push', icon: MessageCircle, subtitle: 'Global platform announcements and recent feed posts' },
        { key: 'config', label: 'Config & Exports', icon: Settings, subtitle: 'Admin access, live database counts, and audit exports' },
      ],
    },
  ];

  const tabs = tabGroups.flatMap(g => g.items);
  const currentTabMeta = tabs.find(t => t.key === activeTab) || tabs[0];

  const hasAdminAccess = Boolean(realUser?.isAdmin || user?.isAdmin);

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="view-admin dashboard-layout" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', background: 'var(--surface-canvas)' }}>
      {/* Desktop Sidebar (PC Only) */}
      <div className="dashboard-sidebar desktop-only">
        <div className="dashboard-sidebar-header">
          <button 
            onClick={() => navigate.push('/app')}
            style={{ background: 'none', border: 'none', color: 'var(--brand-accent)', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 0 12px 0', fontWeight: 700 }}
            className="interactive-press"
          >
            <ChevronLeft size={15} /> Back to App
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'rgba(37, 99, 235, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.28)', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--ink-primary)', fontSize: '1.04rem', fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>Platform Admin</div>
              <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '0.62rem', fontWeight: 800, padding: '1px 7px', borderRadius: '99px', background: 'rgba(22, 163, 74, 0.14)', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.28)', letterSpacing: '0.04em' }}>
                ● LIVE OPS
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              onClick={() => {
                setSimulatedPersona('member');
                navigate.push('/app');
              }}
              className="interactive-press"
              style={{ 
                flex: 1, padding: '7px 8px', borderRadius: '8px', fontSize: '0.72rem', 
                background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.28)', 
                color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' 
              }}
              title="Open Member User View (/app)"
            >
              <Users size={12} /> Member →
            </button>
            <button 
              onClick={() => navigate.push('/dashboard')}
              className="interactive-press"
              style={{ 
                flex: 1, padding: '7px 8px', borderRadius: '8px', fontSize: '0.72rem', 
                background: 'var(--brand-accent-soft)', border: '1px solid rgba(235, 87, 56, 0.3)', 
                color: 'var(--brand-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' 
              }}
            >
              <Crown size={12} /> Leader →
            </button>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          {tabGroups.map(group => (
            <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700, padding: '0 10px 4px', letterSpacing: '0.06em' }}>
                {group.heading}
              </div>
              {group.items.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button 
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                    className={`dashboard-nav-item ${isActive ? 'active' : ''}`}
                    style={{ padding: '9px 12px', fontSize: '0.84rem', justifyContent: 'space-between', marginBottom: '2px' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <tab.icon size={15} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.label}</span>
                    </span>
                    {tab.badge > 0 && (
                      <span style={{ fontSize: '0.64rem', fontWeight: 800, background: 'var(--brand-accent)', color: '#FFFFFF', padding: '1px 7px', borderRadius: '99px', flexShrink: 0 }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Quick Perspective Simulator in Sidebar Footer */}
        <div style={{ paddingTop: '14px', marginTop: '12px', borderTop: '1px solid var(--hairline-border)' }}>
          <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 700, padding: '0 4px 8px', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Eye size={11} color="var(--brand-accent)" /> Preview As Role
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { key: 'admin', label: 'Admin', icon: Shield, color: '#2563eb' },
              { key: 'leader', label: 'Leader', icon: Crown, color: '#d97706' },
              { key: 'member', label: 'Member', icon: Users, color: '#16a34a' },
              { key: 'sponsor', label: 'Sponsor', icon: Store, color: '#ea580c' },
              { key: 'partner', label: 'Host', icon: Calendar, color: '#0d9488' }
            ].map(p => {
              const active = simulatedPersona === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSimulatedPersona(p.key)}
                  className="interactive-press"
                  style={{
                    padding: '6px 8px', borderRadius: '8px',
                    border: active ? `1.5px solid ${p.color}` : '1px solid var(--hairline-border)',
                    background: active ? `${p.color}18` : 'var(--surface-elevated)',
                    color: active ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                    fontSize: '0.72rem', fontWeight: active ? 700 : 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  <p.icon size={11} color={p.color} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-main" style={{ flex: 1, minWidth: 0, paddingBottom: '110px' }}>
        {/* Desktop Editorial Header (clean, single-line, zero duplication with sidebar) */}
        <div className="desktop-only" style={{ paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid var(--hairline-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--ink-primary)', margin: 0, fontFamily: 'var(--font-heading)', lineHeight: 1.15 }}>
                {currentTabMeta.label}
              </h1>
              <p style={{ color: 'var(--ink-secondary)', margin: '4px 0 0', fontSize: '0.86rem' }}>
                {currentTabMeta.subtitle}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {simulatedPersona !== 'admin' && (
                <>
                  <button
                    onClick={() => {
                      if (simulatedPersona === 'leader') navigate.push('/dashboard');
                      else if (simulatedPersona === 'member') navigate.push('/discover');
                      else if (simulatedPersona === 'sponsor' || simulatedPersona === 'partner') navigate.push('/partner');
                    }}
                    className="btn btn-primary interactive-press"
                    style={{ borderRadius: '9px', padding: '8px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={13} /> Open Full App as {simulatedPersona === 'leader' ? 'Leader' : simulatedPersona === 'member' ? 'Member' : simulatedPersona === 'sponsor' ? 'Sponsor' : 'Host'} →
                  </button>
                  <button
                    onClick={() => {
                      exitSimulator();
                      setSimulatedPersona('admin');
                    }}
                    className="interactive-press"
                    style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', borderRadius: '9px', padding: '8px 12px', color: 'var(--ink-secondary)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={13} /> Exit Preview
                  </button>
                </>
              )}
              <button 
                onClick={() => handleExportCSV(activeTab === 'users' ? 'users' : activeTab === 'communities' ? 'communities' : activeTab === 'events' ? 'events' : 'revenue')}
                className="interactive-press"
                style={{ padding: '8px 14px', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)' }}
              >
                <Download size={14} color="var(--brand-accent)" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header (compact, Light + Dark mode crisp) */}
        <div className="mobile-only" style={{ padding: '16px 18px 14px', background: 'var(--surface-card)', borderBottom: '1px solid var(--hairline-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate.push('/app')}
                aria-label="Back to App"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border)', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ChevronLeft size={17} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>Platform Admin</h1>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', background: 'rgba(22, 163, 74, 0.14)', color: '#16a34a' }}>LIVE</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => navigate.push('/dashboard')}
                className="interactive-press"
                style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, background: 'var(--brand-accent-soft)', border: '1px solid rgba(235, 87, 56, 0.3)', color: 'var(--brand-accent)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Crown size={12} /> Leader
              </button>
              <button
                onClick={() => handleExportCSV('revenue')}
                aria-label="Export CSV"
                className="interactive-press"
                style={{ padding: '6px 9px', borderRadius: '8px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Mobile Compact Perspective Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>View:</span>
            {[
              { key: 'admin', label: 'Admin', icon: Shield, color: '#2563eb' },
              { key: 'leader', label: 'Leader', icon: Crown, color: '#d97706' },
              { key: 'member', label: 'Member', icon: Users, color: '#16a34a' },
              { key: 'sponsor', label: 'Sponsor', icon: Store, color: '#ea580c' },
              { key: 'partner', label: 'Host', icon: Calendar, color: '#0d9488' }
            ].map(p => {
              const active = simulatedPersona === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSimulatedPersona(p.key)}
                  className="interactive-press"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '99px',
                    border: active ? `1.5px solid ${p.color}` : '1px solid var(--hairline-border)',
                    background: active ? `${p.color}18` : 'var(--surface-elevated)',
                    color: active ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <p.icon size={11} color={p.color} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Tab Strip */}
        <div className="mobile-only" style={{ display: 'flex', gap: '6px', padding: '12px 18px', overflowX: 'auto', borderBottom: '1px solid var(--hairline-border)', background: 'var(--surface-canvas)', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button 
                key={tab.key} 
                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                className="interactive-press"
                style={{
                  padding: '7px 14px', borderRadius: '99px',
                  background: active ? 'var(--brand-accent)' : 'var(--surface-card)',
                  color: active ? '#FFFFFF' : 'var(--ink-secondary)',
                  border: active ? '1px solid var(--brand-accent)' : '1px solid var(--hairline-border)',
                  fontWeight: 700, fontSize: '0.76rem', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                }}
              >
                <tab.icon size={13} />
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: active ? '#FFFFFF' : 'var(--brand-accent)', color: active ? 'var(--brand-accent)' : '#FFFFFF', padding: '0 5px', borderRadius: '99px' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="admin-inner-body">

        {/* SIMULATED PERSPECTIVE VIEWS */}
        {simulatedPersona === 'leader' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              borderLeft: '4px solid #d97706',
              borderRadius: '16px',
              padding: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Leader Perspective Preview
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0 0', fontFamily: 'var(--font-heading)' }}>
                    Leading More Shades of Golden
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--slate-300)', margin: '4px 0 0' }}>
                    How community organizers experience event RSVPs, the club fund, and guest pitches.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSimulatedPersona('leader');
                    navigate.push('/dashboard');
                  }}
                  className="btn btn-primary interactive-press"
                  style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Simulate Whole App as Leader →
                </button>
              </div>

              {/* Leader KPI Snapshot */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Active Members</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)', marginTop: '2px' }}>248</div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '4px' }}>+12 this week</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Club Fund Balance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>£180.00</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '4px' }}>Ready for bank transfer</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Collaborations & Pitches</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>2 Pending</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '4px' }}>1 session, 1 sponsor perk</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Leader Pro Tier</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>2% Reduced Ticket Fees</div>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '4px' }}>Venue Safety Packs (RAMS) &amp; Waivers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {simulatedPersona === 'member' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid rgba(22, 163, 74, 0.35)',
              borderLeft: '4px solid #16a34a',
              borderRadius: '16px',
              padding: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Community Member Perspective Preview
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0 0', fontFamily: 'var(--font-heading)' }}>
                    Attendee & Discover Experience
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--slate-300)', margin: '4px 0 0' }}>
                    How everyday community members find events, RSVP with passes, and enjoy local sponsor perks.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSimulatedPersona('member');
                      navigate.push('/app');
                    }}
                    className="btn btn-primary interactive-press"
                    style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Users size={15} /> Open Member Home Feed (/app) →
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedPersona('member');
                      navigate.push('/discover');
                    }}
                    className="btn btn-outline interactive-press"
                    style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Globe size={15} color="var(--teal-400)" /> Browse Discover (/discover) →
                  </button>
                </div>
              </div>

              {/* Member Perks & RSVP Passes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>✓ Your Active Event Ticket Pass</div>
                  <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.98rem' }}>Saturday Morning Ridge Walk & Coffee</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '4px' }}>Tomorrow at 09:30 • Dunorlan Park</div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>Confirmed RSVP</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Waiver signed digitally</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>★ Unlocked Member Perks in Tunbridge Wells</div>
                  <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.95rem' }}>15% off at The Pantiles Coffee Roastery</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '4px' }}>Exclusive discount on meetup mornings for group members</div>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 }}>Show Pass in Shop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {simulatedPersona === 'sponsor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid rgba(234, 88, 12, 0.35)',
              borderLeft: '4px solid #ea580c',
              borderRadius: '16px',
              padding: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Local Business Sponsor Perspective Preview
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0 0', fontFamily: 'var(--font-heading)' }}>
                    The Pantiles Coffee Roastery
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--slate-300)', margin: '4px 0 0' }}>
                    Partnered with More Shades of Golden • £15.00/mo Featured Tier
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSimulatedPersona('sponsor');
                    navigate.push('/partner');
                  }}
                  className="btn btn-primary interactive-press"
                  style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Simulate Whole App as Sponsor →
                </button>
              </div>

              {/* Sponsor Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Community Impressions</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)', marginTop: '2px' }}>186</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '4px' }}>Seen in group feed & header</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>In-Store Perk Redemptions</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>24</div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '4px' }}>Real customer footfall</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Club Fund Support</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>£12.00 / mo</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '4px' }}>Directly funding local club equipment</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Monthly Receipt</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--white)', marginTop: '4px' }}>Paid • £15.00</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--teal-300)', marginTop: '4px' }}>VAT receipt available</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {simulatedPersona === 'partner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              background: 'var(--surface-card)',
              border: '1px solid rgba(13, 148, 136, 0.35)',
              borderLeft: '4px solid #0d9488',
              borderRadius: '16px',
              padding: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4FA88E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Experience Host / Specialist Perspective Preview
                  </span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0 0', fontFamily: 'var(--font-heading)' }}>
                    Peak & Trail Navigation Skills
                  </h2>
                  <p style={{ fontSize: '0.84rem', color: 'var(--slate-300)', margin: '4px 0 0' }}>
                    Session: Trail Navigation & Mountain Mastery • Min: 6 / Max: 14 Attendees
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSimulatedPersona('partner');
                    navigate.push('/partner');
                  }}
                  className="btn btn-primary interactive-press"
                  style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Simulate Whole App as Host →
                </button>
              </div>

              {/* Host Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Bookings & Capacity</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4FA88E', marginTop: '2px' }}>9 / 14</div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '4px' }}>Min threshold reached (Session Confirmed)</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Your Payout (After Club Cut)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>£144.00</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '4px' }}>£36.00 raised for club fund</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Escrow Status</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>Held in Escrow</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '4px' }}>Releases 24h after session completes</div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW                                    */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KPI Grid - Clickable jump-links to respective functional tabs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Core Platform Metrics (Click to inspect)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                  Auto-synced with Supabase
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <StatCard 
                  value={platformStats.totalUsers} 
                  label="Total Users" 
                  icon={Users} 
                  color="var(--ink-primary)" 
                  onClick={() => setActiveTab('users')}
                  description="Registered community members"
                />
                <StatCard 
                  value={platformStats.totalCommunities} 
                  label="Communities" 
                  icon={Globe} 
                  color="#3b82f6" 
                  accent="#3b82f6" 
                  onClick={() => setActiveTab('communities')}
                  description="Active groups & networks"
                />
                <StatCard 
                  value={platformStats.verifiedCommunities} 
                  label="Verified Groups" 
                  icon={BadgeCheck} 
                  color="#22c55e" 
                  accent="#22c55e" 
                  onClick={() => { setActiveTab('communities'); setCommunityFilter('verified'); }}
                  description="Vetted with verified badge"
                />
                <StatCard 
                  value={platformStats.totalEvents} 
                  label="Events Hosted" 
                  icon={Calendar} 
                  color="var(--teal-400)" 
                  onClick={() => setActiveTab('events')}
                  description="Active & scheduled sessions"
                />
                <StatCard 
                  value={`£${platformStats.totalRevenue}`} 
                  label="Gross Revenue" 
                  icon={DollarSign} 
                  color="#f59e0b" 
                  accent="#f59e0b" 
                  onClick={() => setActiveTab('revenue')}
                  description="5% standard / 2% Pro take-rate"
                />
                <StatCard 
                  value={platformStats.avgAttendance} 
                  label="Avg Attendance" 
                  icon={UserCheck} 
                  color="#a78bfa" 
                  accent="#a78bfa" 
                  onClick={() => { setActiveTab('events'); setEventFilter('past'); }}
                  description="Per hosted community event"
                />
              </div>
            </div>

            {/* Growth Chart */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#3b82f6" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--slate-200)' }}>Platform Membership Trajectory</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>8-week cohort curve</span>
                </div>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="interactive-press"
                  style={{ background: 'none', border: 'none', color: '#3A8E76', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <TrendingUp size={13} /> Full Investor Grade Analytics →
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '90px' }}>
                {growthData.weeks.map((w, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '100%', height: `${Math.max(10, (w.count / growthData.max) * 100)}%`, background: i === growthData.weeks.length - 1 ? '#3b82f6' : 'rgba(59,130,246,0.3)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)' }}>{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-Column Operations Layout: Community Health & Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
              
              {/* Community Health */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Top Communities by Engagement
                  </span>
                  <button 
                    onClick={() => setActiveTab('communities')}
                    style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View All ({communities.length}) →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {platformStats.communityHealth.slice(0, 6).map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => navigate.push(`/community/${c.id}`)}
                      className="interactive-hover"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px 14px', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--slate-800)', overflow: 'hidden', flexShrink: 0 }}>
                        {c.image ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={16} color="var(--slate-600)" /></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', color: 'var(--white)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>{c.members} members • {c.cEvents} events</div>
                      </div>
                      <HealthBadge health={c.health} />
                      <ChevronRight size={14} color="var(--slate-600)" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Stream */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Live Activity Stream
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Real-time updates</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentActivity.map((a, i) => (
                    <div 
                      key={i} 
                      onClick={() => a.link && navigate.push(a.link)}
                      className="interactive-hover"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '10px 12px', 
                        background: 'rgba(255,255,255,0.015)', 
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${a.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <a.icon size={15} color={a.color} />
                      </div>
                      <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--slate-300)' }}>{a.text}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)', whiteSpace: 'nowrap', fontWeight: 500 }}>{a.time}</span>
                      <ExternalLink size={12} color="var(--slate-600)" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Health Interventions: Dormant Communities Action Required */}
            {platformStats.communityHealth.filter(c => c.health === 'dormant').length > 0 && (
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} /> Action Required: Dormant Communities Need Outreach
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '10px' }}>
                  {platformStats.communityHealth.filter(c => c.health === 'dormant').map(c => {
                    const leaderMem = (communityMemberships[c.id] || []).find(m => m.role === 'Leader' || m.role === 'Co-Leader');
                    const leaderUser = leaderMem ? users.find(u => u.id === leaderMem.userId) : null;
                    const leaderEmail = leaderUser?.email || '';

                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 14px', background: 'rgba(239,68,68,0.06)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.88rem', color: 'var(--white)', fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                            Leader: {leaderUser?.name || 'Unassigned'} {leaderEmail ? `(${leaderEmail})` : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          {leaderUser && (
                            <button 
                              onClick={() => navigate.push(`/chat/dm/${leaderUser.id}`)}
                              className="interactive-press"
                              style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.08)', color: 'var(--white)', border: 'none', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <MessageCircle size={12} /> DM
                            </button>
                          )}
                          <a 
                            href={`mailto:${leaderEmail}?subject=Support and ideas for your ${encodeURIComponent(c.name)} community&body=Hi ${leaderUser?.name || 'there'},%0D%0A%0D%0AWe noticed there hasn't been a recent event in ${encodeURIComponent(c.name)}. We'd love to help you plan your next meetup or co-host with another group!`}
                            className="interactive-press" 
                            style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Mail size={12} /> Email Leader
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 2: COMMUNITIES                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'communities' && (
          <div>
            <SearchBar placeholder="Search communities by name, topic, or tags..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <FilterPills active={communityFilter} onChange={setCommunityFilter} options={[
              { value: 'all', label: `All (${communities.length})` }, 
              { value: 'verified', label: `✓ Verified (${communities.filter(c => c.verified).length})` },
              { value: 'unverified', label: 'Unverified' }, 
              { value: 'active', label: '🟢 Active' },
              { value: 'dormant', label: '🔴 Dormant' }
            ]} />
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Showing {filteredCommunities.length} communities</span>
              <button 
                onClick={() => handleExportCSV('communities')}
                style={{ background: 'none', border: 'none', color: 'var(--teal-400)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Download size={13} /> Export List
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredCommunities.map(c => {
                const isExpanded = expandedId === c.id;
                const leaderMem = (communityMemberships[c.id] || []).find(m => m.role === 'Leader' || m.role === 'Co-Leader');
                const leaderUser = leaderMem ? users.find(u => u.id === leaderMem.userId) : null;

                return (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.15s ease' }}>
                    {/* Entire header row is clickable */}
                    <div 
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="interactive-hover"
                      style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--slate-800)', overflow: 'hidden', flexShrink: 0 }}>
                        {c.image ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={20} color="var(--slate-600)" /></div>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <h3 style={{ margin: 0, color: 'var(--white)', fontSize: '0.98rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h3>
                          {c.verified && <BadgeCheck size={16} color="#3b82f6" />}
                          {c.featured && <Star size={14} color="#f59e0b" fill="#f59e0b" />}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--slate-400)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>{c.members} members</span>
                          <span>{c.cEvents} events</span>
                          {c.cRevenue > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>£{c.cRevenue} Gross</span>}
                          {Boolean(c.is_insured || c.insurance_tier === 'pro') ? (
                            <span style={{ background: 'rgba(235, 87, 56,0.15)', border: '1px solid rgba(235, 87, 56,0.3)', color: '#F27257', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>LEADER PRO</span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--slate-400)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem' }}>FREE TIER</span>
                          )}
                          {(c.stripe_account_id && !String(c.stripe_account_id).startsWith('acct_payout_')) ? (
                            <span style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>STRIPE LINKED</span>
                          ) : (c.cRevenue > 0 || (events.filter(e => e.communityId === c.id && (e.ticketPrice || 0) > 0).length > 0)) ? (
                            <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>⚠️ PAYOUT BANK NEEDED</span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--slate-400)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem' }}>FREE GROUP (NO BANK NEEDED)</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <HealthBadge health={c.health} />
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detail & Admin Management Panel */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--hairline-border)', padding: '18px', background: 'var(--surface-elevated)' }}>
                        {/* Leader card */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={resolveUserAvatar(leaderUser)} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {leaderUser?.name || 'Unassigned Organizer'}
                                <Crown size={13} color="#f59e0b" />
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                                {leaderUser?.email || 'No email registered'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {leaderUser && (
                              <button 
                                onClick={() => navigate.push(`/chat/dm/${leaderUser.id}`)}
                                className="btn interactive-press"
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', background: 'rgba(235, 87, 56,0.15)', color: 'var(--teal-300)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <MessageCircle size={13} /> Message Leader
                              </button>
                            )}
                            <button 
                              onClick={() => copyToClipboard(c.id, 'Community ID')}
                              className="interactive-press"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-300)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Copy size={12} /> ID
                            </button>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)' }}>{c.members}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Members</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--teal-400)' }}>{c.cEvents}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Events</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>£{c.cRevenue}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Gross Sales</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>
                              £{(c.cRevenue * (Boolean(c.is_insured || c.insurance_tier === 'pro') ? 0.02 : 0.05)).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                              Take ({Boolean(c.is_insured || c.insurance_tier === 'pro') ? '2% Pro' : '5%'})
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => navigate.push(`/community/${c.id}`)}
                            className="btn btn-outline interactive-press"
                            style={{ flex: 1, minWidth: '150px', padding: '10px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
                          >
                            <Eye size={14} /> View Community Page
                          </button>

                          <button 
                            disabled={verifyingCommunityId === c.id}
                            onClick={async () => {
                              setVerifyingCommunityId(c.id);
                              try {
                                await adminVerifyCommunity(c.id, !c.verified);
                                toast.success(
                                  c.verified ? 'Verification Revoked' : 'Community Verified',
                                  `${c.name} is now ${c.verified ? 'unverified' : 'verified'}.`
                                );
                              } catch (err) {
                                toast.error('Action Failed', err.message || 'Could not update verification.');
                              } finally {
                                setVerifyingCommunityId(null);
                              }
                            }} 
                            className="btn interactive-press"
                            style={{ 
                              flex: 1, minWidth: '150px', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '0.78rem', fontWeight: 600,
                              background: c.verified ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.15)',
                              color: c.verified ? '#ef4444' : '#3b82f6', 
                              cursor: verifyingCommunityId === c.id ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                          >
                            <BadgeCheck size={14} />
                            {verifyingCommunityId === c.id ? 'Updating...' : (c.verified ? 'Revoke Verification' : 'Verify Community')}
                          </button>

                          <button 
                            onClick={async () => {
                              try {
                                await updateCommunity(c.id, { featured: !c.featured });
                                toast.success('Updated', `${c.name} ${!c.featured ? 'is now featured on explore' : 'unfeatured'}`);
                              } catch (err) {
                                toast.error('Failed to toggle featured', err.message);
                              }
                            }}
                            className="btn interactive-press"
                            style={{ 
                              padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
                              background: c.featured ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                              color: c.featured ? '#f59e0b' : 'var(--slate-400)',
                              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            <Star size={14} /> {c.featured ? 'Featured' : 'Feature Group'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredCommunities.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>No communities match your filters.</div>}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 3: USERS  -  User Directory & Roles              */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <SearchBar placeholder="Search members by name or email address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <FilterPills active={userFilter} onChange={setUserFilter} options={[
                { value: 'all', label: `All (${users.length})` },
                { value: 'admins', label: '🛡 Admins' },
                { value: 'leaders', label: '👑 Leaders' },
                { value: 'members', label: 'Members' },
                { value: 'active', label: '🟢 Active' },
                { value: 'dormant', label: '💤 Dormant' },
                { value: 'suspended', label: `🚫 Suspended (${users.filter(u => Boolean(u.is_suspended)).length})` }
              ]} />
              <button 
                type="button"
                onClick={handleExportAudienceCSV}
                className="btn btn-outline interactive-press"
                style={{ padding: '6px 14px', fontSize: '0.78rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '8px' }}
                title="Export all member & guest emails for Mailchimp or Brevo"
              >
                <Download size={14} /> Export Audience CSV
              </button>
            </div>

            {/* User Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              {[
                { value: users.length, label: 'Total', color: 'var(--white)' },
                { value: users.filter(u => ADMIN_EMAILS.includes(u.email?.toLowerCase()) || !!u.is_admin).length, label: 'Admins', color: '#3b82f6' },
                { value: (() => { let c = 0; Object.values(communityMemberships).forEach(mems => { mems.forEach(m => { if (m.role === 'Leader') c++; }); }); return c; })(), label: 'Leaders', color: '#f59e0b' },
                { value: (() => { let active = 0; users.forEach(u => { const msgs = messages.filter(m => m.authorId === u.id).length; let evts = 0; Object.values(eventRsvps).forEach(r => { if (r.some(rv => rv.userId === u.id)) evts++; }); if (msgs + evts > 2) active++; }); return active; })(), label: 'Active', color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUsers
                .map(u => {
                  const userMessages = messages.filter(m => m.authorId === u.id).length;
                  let userEvents = 0;
                  let userCheckins = 0;
                  Object.values(eventRsvps).forEach(rsvps => {
                    const match = (rsvps || []).find(r => r.userId === u.id && (r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in));
                    if (match) { userEvents++; if (match.checkedIn || match.checked_in || match.status === 'checked_in') userCheckins++; }
                  });
                  const engagementScore = Math.min(100, u.joinedCount * 15 + userEvents * 20 + userMessages * 5);
                  const engagementLevel = engagementScore >= 60 ? 'high' : engagementScore >= 25 ? 'medium' : 'low';
                  const joinDate = u.joined || u.created_at;
                  return { ...u, userMessages, userEvents, userCheckins, engagementScore, engagementLevel, joinDate };
                })
                .filter(u => {
                  if (userFilter === 'active') return u.engagementLevel === 'high' || u.engagementLevel === 'medium';
                  if (userFilter === 'dormant') return u.engagementLevel === 'low';
                  return true;
                })
                .sort((a, b) => b.engagementScore - a.engagementScore)
                .map(u => {
                  const isExpanded = expandedId === `user-${u.id}`;
                  const engColor = u.engagementLevel === 'high' ? '#22c55e' : u.engagementLevel === 'medium' ? '#f59e0b' : '#ef4444';
                  
                  const userCommunities = [];
                  Object.entries(communityMemberships).forEach(([cId, mems]) => {
                    const mem = mems.find(m => m.userId === u.id);
                    if (mem) {
                      const comm = communities.find(c => c.id === cId);
                      if (comm) userCommunities.push({ ...comm, role: mem.role });
                    }
                  });

                  return (
                    <div key={u.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                      {/* Main Row */}
                      <div 
                        onClick={() => setExpandedId(isExpanded ? null : `user-${u.id}`)}
                        className="interactive-hover"
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                      >
                        <div style={{ position: 'relative' }}>
                          <img src={resolveUserAvatar(u)} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: '12px', height: '12px', borderRadius: '50%', background: engColor, border: '2px solid var(--slate-950)' }}></div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.92rem' }}>{u.name}</span>
                            {u.isAdmin && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>ADMIN</span>}
                            {u.isLeader && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>LEADER</span>}
                            {u.is_suspended && <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>SUSPENDED</span>}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.email || 'No email registered'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${u.engagementScore}%`, background: engColor, borderRadius: '99px' }}></div>
                          </div>
                          <span style={{ fontSize: '0.62rem', color: engColor, fontWeight: 600 }}>{u.engagementScore}%</span>
                        </div>
                        <ChevronDown size={15} color="var(--slate-500)" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid var(--hairline-border)', padding: '16px', background: 'var(--surface-elevated)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '6px', marginBottom: '14px' }}>
                            {[
                              { label: 'Communities', value: u.joinedCount, color: '#3b82f6' },
                              { label: 'Events', value: u.userEvents, color: 'var(--teal-400)' },
                              { label: 'Messages', value: u.userMessages, color: '#22c55e' },
                              { label: 'Check-ins', value: u.userCheckins, color: '#a78bfa' },
                            ].map(s => (
                              <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.58rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {userCommunities.length > 0 && (
                            <div style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '6px' }}>Communities ({userCommunities.length})</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {userCommunities.map(c => (
                                  <span key={c.id} style={{ 
                                    fontSize: '0.72rem', padding: '4px 10px', borderRadius: '99px',
                                    background: c.role === 'Leader' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', 
                                    color: c.role === 'Leader' ? '#fbbf24' : 'var(--slate-300)',
                                    border: `1px solid ${c.role === 'Leader' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    fontWeight: 500
                                  }}>
                                    {c.role === 'Leader' ? '👑 ' : ''}{c.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--slate-400)', marginBottom: '14px' }}>
                            <span>Joined {u.joinDate ? new Date(u.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}</span>
                            <span style={{ color: engColor, fontWeight: 600 }}>
                              {u.engagementLevel === 'high' ? '🟢 Highly Active' : u.engagementLevel === 'medium' ? '🟡 Moderately Active' : '🔴 Low Activity'}
                            </span>
                          </div>

                          {/* Actions Bar */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setImpersonatedUserId(u.id);
                                navigate.push('/discover'); 
                              }} 
                              className="interactive-press" 
                              style={{ 
                                padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', 
                                background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', 
                                color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 
                              }}
                              title={`View the entire app as ${u.name}`}
                            >
                              <Eye size={13} /> View App as {u.name ? u.name.split(' ')[0] : 'User'}
                            </button>

                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate.push(`/profile/${u.id}`); }} 
                              className="btn btn-outline interactive-press" 
                              style={{ flex: 1, minWidth: '120px', padding: '8px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
                            >
                              <Eye size={13} /> View Profile
                            </button>

                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate.push(`/chat/dm/${u.id}`); }} 
                              className="btn btn-primary interactive-press" 
                              style={{ flex: 1, minWidth: '120px', padding: '8px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--teal-500)', border: 'none', color: '#fff', cursor: 'pointer' }}
                            >
                              <MessageCircle size={13} /> Message User
                            </button>

                            {u.email && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(u.email, 'Email address'); }} 
                                className="interactive-press" 
                                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', color: 'var(--slate-300)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Copy size={13} /> Copy Email
                              </button>
                            )}

                            {!ADMIN_EMAILS.includes(u.email?.toLowerCase()) && (
                              <>
                                <button 
                                  onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    try {
                                      const nextSuspended = !u.is_suspended;
                                      await updateUser(u.id, { is_suspended: nextSuspended });
                                      toast.success(
                                        nextSuspended ? 'User Suspended' : 'User Unsuspended',
                                        `${u.name} is now ${nextSuspended ? 'suspended from platform activity' : 'active again'}.`
                                      );
                                    } catch (err) {
                                      toast.error('Action Failed', err.message || 'Could not update user status.');
                                    }
                                  }} 
                                  className="interactive-press" 
                                  style={{ 
                                    padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', 
                                    background: u.is_suspended ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                                    border: `1px solid ${u.is_suspended ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, 
                                    color: u.is_suspended ? '#22c55e' : '#ef4444', 
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                                  }}
                                >
                                  {u.is_suspended ? <CheckCircle size={13} /> : <Ban size={13} />} {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                                </button>

                                {confirmDeleteUserId === u.id ? (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      background: 'rgba(239, 68, 68, 0.16)',
                                      border: '1px solid rgba(239, 68, 68, 0.4)'
                                    }}
                                  >
                                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ef4444' }}>
                                      Remove permanently?
                                    </span>
                                    <button
                                      type="button"
                                      disabled={deletingUserId === u.id}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setDeletingUserId(u.id);
                                        try {
                                          await adminDeleteUser(u.id);
                                          setConfirmDeleteUserId(null);
                                          setExpandedId(null);
                                          toast.success('User Removed', `${u.name} has been permanently removed from the platform.`);
                                        } catch (err) {
                                          toast.error('Remove Failed', err?.message || 'Could not remove user.');
                                        } finally {
                                          setDeletingUserId(null);
                                        }
                                      }}
                                      className="interactive-press"
                                      style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontSize: '0.73rem',
                                        fontWeight: 800,
                                        cursor: deletingUserId === u.id ? 'wait' : 'pointer'
                                      }}
                                    >
                                      {deletingUserId === u.id ? 'Removing...' : 'Confirm Remove'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeleteUserId(null);
                                      }}
                                      className="interactive-press"
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.08)',
                                        color: 'var(--slate-300)',
                                        border: 'none',
                                        fontSize: '0.73rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteUserId(u.id);
                                    }}
                                    className="interactive-press"
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      fontSize: '0.78rem',
                                      background: 'rgba(239, 68, 68, 0.14)',
                                      border: '1px solid rgba(239, 68, 68, 0.32)',
                                      color: '#f87171',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontWeight: 700
                                    }}
                                    title="Permanently remove this user account and their memberships/RSVPs"
                                  >
                                    <Trash2 size={13} /> Remove User
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>No users match your search.</div>}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 4: EVENTS & ATTENDEE ROSTERS                   */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div>
            <SearchBar placeholder="Search events by title or hosting community..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <FilterPills active={eventFilter} onChange={setEventFilter} options={[
              { value: 'all', label: `All (${events.length})` },
              { value: 'upcoming', label: '📅 Upcoming' },
              { value: 'past', label: 'Past Sessions' },
              { value: 'cancelled', label: '❌ Cancelled' }
            ]} />

            {/* Event Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)' }}>{platformStats.totalEvents}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Total Events</div>
              </div>
              <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--teal-400)' }}>{platformStats.avgAttendance}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Avg Attendees</div>
              </div>
              <div style={{ textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>£{platformStats.totalRevenue}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Total Ticket Gross</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredEvents.map(e => {
                const isExpanded = expandedEventId === e.id;
                const rsvps = e.rsvpsList || [];

                return (
                  <div key={e.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden', ...(e.status === 'cancelled' ? { opacity: 0.65 } : {}) }}>
                    {/* Event Row Header - Clickable */}
                    <div 
                      onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                      className="interactive-hover"
                      style={{ display: 'flex', gap: '14px', padding: '14px 16px', cursor: 'pointer', alignItems: 'center' }}
                    >
                      <div style={{ width: '46px', height: '50px', background: 'rgba(235, 87, 56,0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(235, 87, 56,0.2)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>{e.date ? new Date(e.date + 'T00:00:00').getDate() : ' - '}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>{e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }) : ''}</div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.94rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                          {e.status === 'cancelled' && <span style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.15)', padding: '2px 6px', borderRadius: '4px' }}>CANCELLED</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginBottom: '4px' }}>
                          {e.communityName} • {e.location || 'Location TBC'}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem' }}>
                          <span style={{ color: 'var(--teal-400)', fontWeight: 600 }}>{e.rsvpCount} RSVPs</span>
                          <span style={{ color: '#3b82f6' }}>{e.checkins} check-ins</span>
                          {e.revenue > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>£{e.revenue} Gross</span>}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded Event Operations & Attendee Roster */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--hairline-border)', padding: '16px', background: 'var(--surface-elevated)' }}>
                        {/* Event Quick Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', fontSize: '0.76rem', color: 'var(--slate-400)' }}>
                          <div>Time: <strong style={{ color: 'var(--white)' }}>{e.time || 'All day'}</strong></div>
                          <div>Ticket Price: <strong style={{ color: e.ticketPrice ? '#f59e0b' : '#22c55e' }}>{e.ticketPrice ? `£${e.ticketPrice}` : 'Free'}</strong></div>
                          <div>Capacity: <strong style={{ color: 'var(--white)' }}>{e.maxCapacity || 'Unlimited'}</strong></div>
                        </div>

                        {/* Attendee Roster */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Attendee Roster ({rsvps.length})</span>
                            <span>{e.checkins} Verified On-Site</span>
                          </div>

                          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                            {rsvps.map((r, rIdx) => {
                              const attendeeUser = users.find(u => u.id === r.userId);
                              return (
                                <div key={rIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={resolveUserAvatar(attendeeUser)} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
                                    <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--white)' }}>{attendeeUser?.name || 'Guest'}</div>
                                      <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>{attendeeUser?.email || ''}</div>
                                    </div>
                                  </div>

                                  <button 
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      try {
                                        await checkInMember(e.id, r.userId);
                                        toast.success('Check-in Updated', `Updated check-in for ${attendeeUser?.name || 'Attendee'}`);
                                      } catch (err) {
                                        toast.error('Check-in failed', err.message);
                                      }
                                    }}
                                    className="interactive-press"
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: r.checkedIn ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                                      color: r.checkedIn ? '#22c55e' : 'var(--slate-400)'
                                    }}
                                  >
                                    {r.checkedIn ? <CheckCircle size={12} /> : <ScanLine size={12} />}
                                    {r.checkedIn ? 'Checked In' : 'Check In'}
                                  </button>
                                </div>
                              );
                            })}
                            {rsvps.length === 0 && (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.78rem' }}>
                                No RSVPs registered yet.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => navigate.push(`/events/${e.id}`)}
                            className="btn btn-outline interactive-press"
                            style={{ flex: 1, minWidth: '140px', padding: '9px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
                          >
                            <ExternalLink size={13} /> View Event Page
                          </button>

                          <button 
                            onClick={async () => {
                              try {
                                await sendEventReminder(e.id);
                                toast.success('Reminder Dispatched', `Broadcast reminder sent to ${rsvps.length} attendees.`);
                              } catch (err) {
                                toast.error('Reminder Failed', err.message || 'Could not send reminder.');
                              }
                            }}
                            className="btn interactive-press"
                            style={{ flex: 1, minWidth: '140px', padding: '9px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(235, 87, 56,0.15)', border: 'none', color: 'var(--teal-300)', fontWeight: 600 }}
                          >
                            <Bell size={13} /> Send Reminder ({rsvps.length})
                          </button>

                          <button 
                            onClick={async () => {
                              const newStatus = e.status === 'cancelled' ? 'published' : 'cancelled';
                              try {
                                await updateEvent(e.id, { status: newStatus });
                                toast.success(newStatus === 'cancelled' ? 'Event Cancelled' : 'Event Reinstated', `${e.title} is now marked ${newStatus}.`);
                              } catch (err) {
                                toast.error('Action Failed', err.message);
                              }
                            }}
                            className="interactive-press"
                            style={{ 
                              padding: '9px 14px', borderRadius: '8px', fontSize: '0.78rem', 
                              background: e.status === 'cancelled' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)', 
                              color: e.status === 'cancelled' ? '#22c55e' : '#ef4444', 
                              border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' 
                            }}
                          >
                            {e.status === 'cancelled' ? <RefreshCw size={13} /> : <XCircle size={13} />}
                            {e.status === 'cancelled' ? 'Reinstate' : 'Cancel Event'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredEvents.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>No events match your filters.</div>}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB: INVESTOR ANALYTICS                             */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <InvestorAnalytics
            users={users}
            events={events}
            eventRsvps={eventRsvps}
            messages={messages}
            communityMemberships={communityMemberships}
            communities={communities}
            toast={toast}
          />
        )}

        {activeTab === 'crm' && <LeaderCRM toast={toast} />}
        {activeTab === 'map' && <OperationsMap platformStats={platformStats} />}
        {activeTab === 'revenue' && (
          <Commercials
            platformStats={platformStats}
            handleExportCSV={handleExportCSV}
            revenueByComm={revenueByComm}
            events={events}
            eventRsvps={eventRsvps}
            sponsors={sponsors}
            sponsorshipAssignments={sponsorshipAssignments}
            communities={communities}
          />
        )}
        {activeTab === 'moderation' && (
          <ModerationQueue
            users={users}
            communities={communities}
            events={events}
            updateUser={updateUser}
            approveChapter={approveChapter}
            declineChapter={declineChapter}
            navigate={navigate}
          />
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 6: CONTENT & BROADCASTS                         */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'content' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Platform Broadcast */}
            <div className="glass-panel" style={{ padding: '22px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Megaphone size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, fontWeight: 600, color: 'var(--white)', fontSize: '1rem' }}>Global Platform Push Announcement</h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', marginBottom: '14px' }}>
                Dispatch a real-time notification alert to all registered users across all {communities.length} communities on web & mobile.
              </p>
              <textarea 
                placeholder="Write your platform-wide announcement..." 
                value={broadcastText} 
                onChange={e => setBroadcastText(e.target.value)}
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--white)', minHeight: '110px', fontFamily: 'inherit', resize: 'none', marginBottom: '12px', fontSize: '0.88rem' }} 
              />
              <button 
                onClick={handlePlatformBroadcast} 
                disabled={isSending || !broadcastText.trim()} 
                className="btn btn-primary interactive-press"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isSending || !broadcastText.trim() ? 'not-allowed' : 'pointer', background: 'var(--teal-500)', border: 'none', color: '#fff', fontWeight: 600, opacity: isSending || !broadcastText.trim() ? 0.5 : 1 }}
              >
                <Megaphone size={16} /> {isSending ? 'Sending Announcement...' : `Push Announcement to ${users.length} Users`}
              </button>
            </div>

            {/* Recent Feed Posts */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Recent Social Hub Feed Activity ({feedPosts.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feedPosts.slice(-8).reverse().map((post, i) => {
                  const author = users.find(u => u.id === post.authorId);
                  const comm = communities.find(c => c.id === post.communityId);
                  return (
                    <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={resolveUserAvatar(author)} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white)' }}>{author?.name || 'Community Member'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>in <strong style={{ color: 'var(--slate-300)' }}>{comm?.name || 'General'}</strong></span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)' }}>
                          {post.timestamp ? new Date(post.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Recently'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>
                        {post.content || post.text}
                      </div>
                    </div>
                  );
                })}
                {feedPosts.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.82rem' }}>No feed posts found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 7: CONFIG & PLATFORM HEALTH                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Admin Team */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Platform Administrators ({ADMIN_EMAILS.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                {ADMIN_EMAILS.map(email => {
                  const adminUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                  return (
                    <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={16} color="#3b82f6" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.88rem' }}>{adminUser?.name || 'Authorized Admin'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{email}</div>
                      </div>
                      <BadgeCheck size={16} color="#3b82f6" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Database Health Live Counters */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Live Database Records
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden' }}>
                {[
                  { table: 'users', count: users.length, icon: Users },
                  { table: 'communities', count: communities.length, icon: Globe },
                  { table: 'events', count: events.length, icon: Calendar },
                  { table: 'messages', count: messages.length, icon: MessageCircle },
                  { table: 'feed_posts', count: feedPosts.length, icon: Activity },
                  { table: 'notifications', count: notifications.length, icon: Bell },
                ].map((row, i) => (
                  <div key={row.table} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <row.icon size={15} color="var(--slate-400)" />
                    <span style={{ flex: 1, fontSize: '0.84rem', color: 'var(--slate-300)', fontFamily: 'monospace' }}>public.{row.table}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--white)' }}>{row.count} records</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Exports */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                Audit & Financial Exports
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {[
                  { type: 'users', label: 'Export Users Directory' },
                  { type: 'communities', label: 'Export Communities List' },
                  { type: 'events', label: 'Export Events Attendance' },
                  { type: 'revenue', label: 'Export Financial Remittance' },
                ].map(item => (
                  <button 
                    key={item.type} 
                    onClick={() => handleExportCSV(item.type)} 
                    className="interactive-press"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--white)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Download size={16} color="var(--teal-400)" />
                    <span style={{ flex: 1, fontWeight: 500, fontSize: '0.85rem' }}>{item.label}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>CSV</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Infrastructure Details */}
            <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '12px' }}>
                Application Runtime & Build
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.72rem' }}>Application</span>
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>More Community Operating System</span>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.72rem' }}>Build Target</span>
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>Next.js 15 App Router (Hybrid SSR/PWA)</span>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.72rem' }}>Database & Auth</span>
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>Supabase Postgres + Realtime RLS</span>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.72rem' }}>System Health</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>● All Systems Operational</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      </div>
    </div>
  );
}
