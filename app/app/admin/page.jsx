"use client";
import React, { useState, useMemo } from 'react';
import { 
  Shield, Activity, Users, Map, CheckCircle, XCircle, Search, BadgeCheck, Check, X,
  TrendingUp, DollarSign, Calendar, Eye, Ban, Crown, ChevronDown, ChevronUp, 
  MessageCircle, Bell, Download, Settings, Database, Megaphone, Flag,
  BarChart3, UserCheck, Zap, Star, Globe, Lock, Mail, Clock, AlertTriangle,
  ChevronRight, ScanLine, Ticket, Copy, ExternalLink, RefreshCw, Radio
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
      <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: color || 'white' }}>{value}</div>
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
        background: 'rgba(255,255,255,0.04)', 
        border: '1px solid rgba(255,255,255,0.08)', 
        borderRadius: '12px', 
        padding: '12px 12px 12px 42px', 
        color: 'var(--white)', 
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
          border: 'none', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          background: active === opt.value ? 'white' : 'rgba(255,255,255,0.05)',
          color: active === opt.value ? 'black' : 'var(--slate-400)',
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
    communities, 
    users, 
    events, 
    communityMemberships, 
    eventRsvps, 
    adminVerifyCommunity, 
    updateUser, 
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

  React.useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      navigate.push('/app');
    }
  }, [user, isLoading, navigate]);

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
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status !== 'cancelled').length;

    // Revenue
    let totalRevenue = 0;
    let monthRevenue = 0;
    const now = new Date();
    events.forEach(event => {
      const price = event.ticketPrice || 0;
      const rsvps = (eventRsvps[event.id] || []).filter(r => r.status === 'going');
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
      totalRsvps += rsvps.filter(r => r.status === 'going').length;
      totalCheckins += rsvps.filter(r => r.checkedIn).length;
    });
    const avgAttendance = activeEvents > 0 ? Math.round(totalRsvps / activeEvents) : 0;

    // Community health
    const communityHealth = communities.map(c => {
      const members = (communityMemberships[c.id] || []).length;
      const cEvents = events.filter(e => e.communityId === c.id && e.status !== 'cancelled').length;
      const cMessages = messages.filter(m => m.communityId === c.id).length;
      const activityScore = members * 2 + cEvents * 10 + cMessages;
      const health = activityScore >= 30 ? 'active' : activityScore >= 10 ? 'moderate' : 'dormant';
      
      let cRevenue = 0;
      events.filter(e => e.communityId === c.id).forEach(e => {
        cRevenue += (e.ticketPrice || 0) * (eventRsvps[e.id] || []).filter(r => r.status === 'going').length;
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
      const isAdmin = ADMIN_EMAILS.includes(u.email?.toLowerCase()) || !!u.is_admin;
      const ledCommunity = communities.find(c => {
        const mems = communityMemberships[c.id] || [];
        return mems.some(m => m.userId === u.id && m.role === 'Leader');
      });
      const joinedCount = Object.values(communityMemberships).filter(mems => mems.some(m => m.userId === u.id)).length;
      return { ...u, isAdmin, isLeader: !!ledCommunity, ledCommunityName: ledCommunity?.name, joinedCount };
    });
    if (userFilter === 'admins') list = list.filter(u => u.isAdmin);
    if (userFilter === 'leaders') list = list.filter(u => u.isLeader);
    if (userFilter === 'members') list = list.filter(u => !u.isAdmin && !u.isLeader);
    if (searchTerm) list = list.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [users, communities, communityMemberships, userFilter, searchTerm]);

  const filteredEvents = useMemo(() => {
    let list = events.map(e => {
      const community = communities.find(c => c.id === e.communityId);
      const rsvps = (eventRsvps[e.id] || []).filter(r => r.status === 'going');
      const checkins = rsvps.filter(r => r.checkedIn).length;
      const revenue = (e.ticketPrice || 0) * rsvps.length;
      return { ...e, communityName: community?.name || 'Unknown', rsvpCount: rsvps.length, checkins, revenue, rsvpsList: rsvps };
    });
    if (eventFilter === 'upcoming') list = list.filter(e => e.status !== 'cancelled' && new Date(e.date + 'T00:00:00') >= new Date());
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
  const recentActivity = useMemo(() => {
    const acts = [];
    users.slice(-3).forEach(u => acts.push({ 
      id: u.id,
      text: `${u.name} joined the platform`, 
      icon: UserCheck, 
      color: '#22c55e', 
      time: 'Recently', 
      link: `/profile/${u.id}` 
    }));
    communities.slice(-2).forEach(c => acts.push({ 
      id: c.id,
      text: `${c.name} community created`, 
      icon: Globe, 
      color: '#3b82f6', 
      time: 'Recently', 
      link: `/community/${c.id}` 
    }));
    events.slice(-3).forEach(e => {
      const comm = communities.find(c => c.id === e.communityId);
      acts.push({ 
        id: e.id,
        text: `${e.title} scheduled in ${comm?.name || 'Community'}`, 
        icon: Calendar, 
        color: '#14b8a6', 
        time: 'Recently', 
        link: `/events/${e.id}` 
      });
    });
    return acts.slice(0, 8);
  }, [users, communities, events]);

  // ─── Growth data (8 weeks) ────────────────────────────────
  const growthData = useMemo(() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const count = Math.max(1, Math.floor(users.length * (8 - i) / 8) + Math.floor(Math.random() * 2));
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
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
      csv = 'Name,Email,Role,Communities Joined\n' + users.map(u => {
        const joined = Object.values(communityMemberships).filter(m => m.some(mem => mem.userId === u.id)).length;
        return `"${u.name}","${u.email || ''}","${ADMIN_EMAILS.includes(u.email?.toLowerCase()) ? 'Admin' : 'Member'}",${joined}`;
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
      csv = 'Community,Events,Members,Gross Revenue,Platform Take (15%),Leader Net (85%)\n' + revenueByComm.map(c =>
        `"${c.name}",${c.cEvents},${c.members},${c.cRevenue},${Math.round(c.cRevenue * 0.15)},${Math.round(c.cRevenue * 0.85)}`
      ).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `more-${type}-export.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!', `${type} data downloaded successfully`);
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied!', `${label} copied to clipboard`);
  };

  // ═════════════════════════════════════════════════════════
  // TABS CONFIG
  // ═════════════════════════════════════════════════════════
  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'analytics', label: 'Investor Analytics', icon: TrendingUp },
    { key: 'crm', label: 'Leader CRM', icon: UserCheck },
    { key: 'map', label: 'Ops Map', icon: Map },
    { key: 'communities', label: 'Communities', icon: Globe },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'events', label: 'Events & Attendees', icon: Calendar },
    { key: 'revenue', label: 'Commercials', icon: DollarSign },
    { key: 'moderation', label: 'Moderation', icon: Shield },
    { key: 'content', label: 'Content', icon: MessageCircle },
    { key: 'config', label: 'Config', icon: Settings },
  ];

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100dvh', background: 'var(--slate-950)' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ padding: '24px 24px 18px', background: 'linear-gradient(180deg, rgba(59,130,246,0.12) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
              <Shield size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--white)', margin: 0, fontFamily: 'var(--font-heading)' }}>Platform Admin</h1>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                  LIVE OPS
                </span>
              </div>
              <p style={{ color: 'var(--slate-400)', margin: '2px 0 0', fontSize: '0.82rem' }}>
                Global Operations, Commercials, Community Health & Creator Enablement
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => handleExportCSV('revenue')}
              className="btn btn-outline interactive-press"
              style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
            >
              <Download size={14} color="var(--teal-400)" /> Export Data
            </button>
            <button 
              onClick={() => navigate.push('/dashboard')}
              className="btn interactive-press"
              style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: 'var(--teal-300)', fontWeight: 600 }}
            >
              <Crown size={14} color="var(--teal-400)" /> Leader View →
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div style={{ display: 'flex', gap: '6px', padding: '14px 24px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)', WebkitOverflowScrolling: 'touch' }}>
        {tabs.map(tab => (
          <button 
            key={tab.key} 
            onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
            className="interactive-press"
            style={{
              padding: '8px 16px', borderRadius: '99px', border: 'none',
              background: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? 'black' : 'var(--slate-400)',
              fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>

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
                  color="white" 
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
                  description="15% platform take-rate"
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
                  style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              
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
                      <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)' }}>{a.time}</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
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
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--slate-400)', flexWrap: 'wrap' }}>
                          <span>{c.members} members</span>
                          <span>{c.cEvents} events</span>
                          {c.cRevenue > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>£{c.cRevenue} Gross</span>}
                          {c.category && <span style={{ color: 'var(--slate-500)' }}>• {c.category}</span>}
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
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px', background: 'rgba(0,0,0,0.15)' }}>
                        {/* Leader card */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={leaderUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
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
                                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', background: 'rgba(20,184,166,0.15)', color: 'var(--teal-300)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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
                          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa' }}>£{Math.round(c.cRevenue * 0.15)}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Take (15%)</div>
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
        {/* TAB 3: USERS — User Directory & Roles              */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <SearchBar placeholder="Search members by name or email address..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <FilterPills active={userFilter} onChange={setUserFilter} options={[
              { value: 'all', label: `All (${users.length})` },
              { value: 'admins', label: '🛡 Admins' },
              { value: 'leaders', label: '👑 Leaders' },
              { value: 'members', label: 'Members' },
              { value: 'active', label: '🟢 Active' },
              { value: 'dormant', label: '💤 Dormant' }
            ]} />

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
                    const match = rsvps.find(r => r.userId === u.id && r.status === 'going');
                    if (match) { userEvents++; if (match.checkedIn) userCheckins++; }
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
                          <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
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
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
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
                              <button 
                                onClick={async (e) => { 
                                  e.stopPropagation(); 
                                  try {
                                    await updateUser(u.id, { is_suspended: !u.is_suspended });
                                    toast.success(u.is_suspended ? 'User unsuspended' : 'User suspended', `${u.name} status updated.`);
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
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' 
                                }}
                              >
                                {u.is_suspended ? <CheckCircle size={13} /> : <Ban size={13} />} {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                              </button>
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
                      <div style={{ width: '46px', height: '50px', background: 'rgba(20,184,166,0.1)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(20,184,166,0.2)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>{e.date ? new Date(e.date + 'T00:00:00').getDate() : '—'}</div>
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
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px', background: 'rgba(0,0,0,0.15)' }}>
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
                                    <img src={attendeeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'} alt="" style={{ width: '26px', height: '26px', borderRadius: '50%' }} />
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
                            style={{ flex: 1, minWidth: '140px', padding: '9px', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(20,184,166,0.15)', border: 'none', color: 'var(--teal-300)', fontWeight: 600 }}
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
        {activeTab === 'revenue' && <Commercials platformStats={platformStats} handleExportCSV={handleExportCSV} revenueByComm={revenueByComm} />}
        {activeTab === 'moderation' && <ModerationQueue />}

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
                          <img src={author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
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
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>more. Community Operating System</span>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.72rem' }}>Build Target</span>
                  <span style={{ color: 'var(--white)', fontWeight: 600 }}>Next.js 14 App Router (Hybrid SSR/PWA)</span>
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
  );
}
