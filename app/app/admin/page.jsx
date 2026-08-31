"use client";
import React, { useState, useMemo } from 'react';
import { Shield, Activity, Users, Map, CheckCircle, XCircle, Search, BadgeCheck, Check, X,
  TrendingUp, DollarSign, Calendar, Eye, Ban, Crown, ChevronDown, ChevronUp, 
  MessageCircle, Bell, Download, Settings, Database, Megaphone, Flag,
  BarChart3, UserCheck, Zap, Star, Globe, Lock, Mail, Clock, AlertTriangle,
  ChevronRight, ScanLine, Ticket } from 'lucide-react';
import { useAppContext } from '../../src/context/AppContext';
import { useFeed } from '../../src/context/FeedContext';
import { useChat } from '../../src/context/ChatContext';
import { useToast } from '../../src/components/Toast';
import { useRouter as useNavigate, useSearchParams } from 'next/navigation';

// ─── Shared Components ────────────────────────────────────
const StatCard = ({ value, label, icon: Icon, color, accent }) => (
  <div className="glass-panel stagger-item interactive-hover" style={{ padding: '16px', ...(accent ? { border: `1px solid ${accent}30`, background: `linear-gradient(135deg, ${accent}10 0%, ${accent}02 100%)` } : {}) }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
      <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: color || 'white' }}>{value}</div>
      {Icon && <Icon size={18} color={color || 'var(--slate-500)'} />}
    </div>
    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
  </div>
);

const SearchBar = ({ placeholder, value, onChange }) => (
  <div style={{ position: 'relative', marginBottom: '16px' }}>
    <Search size={16} color="var(--slate-500)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
    <input type="text" placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 12px 12px 40px', color: 'white', fontSize: '0.9rem' }} />
  </div>
);

const FilterPills = ({ options, active, onChange }) => (
  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
    {options.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)} className="interactive-press"
        style={{ padding: '6px 14px', borderRadius: '99px', border: 'none', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
          background: active === opt.value ? 'white' : 'rgba(255,255,255,0.05)',
          color: active === opt.value ? 'black' : 'var(--slate-400)' }}>
        {opt.label}
      </button>
    ))}
  </div>
);

const HealthBadge = ({ health }) => {
  const config = { active: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: '● Active' },
    moderate: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: '● Moderate' },
    dormant: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: '● Dormant' } };
  const c = config[health] || config.moderate;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '12px', background: c.bg, color: c.color, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  );
};

// ─── Engagement Score (reused) ──────────────────────────────
function getEngagementScore(member, events, eventRsvps, messages, communityId) {
  let score = 0;
  events.filter(e => e.communityId === communityId).forEach(event => {
    if ((eventRsvps[event.id] || []).some(r => r.userId === member.userId)) score += 20;
  });
  score += Math.min((messages.filter(m => m.authorId === member.userId && m.communityId === communityId).length) * 5, 40);
  return Math.min(score + 10, 100);
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, communities, users, events, communityMemberships, eventRsvps, adminVerifyCommunity, notifications, broadcastNotification, toggleUserRole, updateCommunity } = useAppContext();
    const { feedPosts } = useFeed();
    const { messages } = useChat();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [communityFilter, setCommunityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');
  const [broadcastText, setBroadcastText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!user || !user.isAdmin) {
    if (typeof window !== 'undefined') navigate.push('/');
    return null;
  }

  const ADMIN_EMAILS = ['msf199@hotmail.com', 'alex@maorecommunity.co.uk', 'alex@morecommunity.co.uk'];

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
      const isAdmin = ADMIN_EMAILS.includes(u.email?.toLowerCase());
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
      return { ...e, communityName: community?.name || 'Unknown', rsvpCount: rsvps.length, checkins, revenue };
    });
    if (eventFilter === 'upcoming') list = list.filter(e => e.status !== 'cancelled' && new Date(e.date + 'T00:00:00') >= new Date());
    if (eventFilter === 'past') list = list.filter(e => new Date(e.date + 'T00:00:00') < new Date());
    if (eventFilter === 'cancelled') list = list.filter(e => e.status === 'cancelled');
    if (searchTerm) list = list.filter(e => e.title?.toLowerCase().includes(searchTerm.toLowerCase()));
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
    users.slice(-3).forEach(u => acts.push({ text: `${u.name} joined the platform`, icon: UserCheck, color: '#22c55e', time: 'Recently' }));
    communities.slice(-2).forEach(c => acts.push({ text: `${c.name} community created`, icon: Globe, color: '#3b82f6', time: 'Recently' }));
    events.slice(-3).forEach(e => {
      const comm = communities.find(c => c.id === e.communityId);
      acts.push({ text: `${e.title} event in ${comm?.name || 'Unknown'}`, icon: Calendar, color: '#14b8a6', time: 'Recently' });
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
      // Broadcast to every community
      for (const c of communities) {
        await broadcastNotification(c.id, '📢 Platform Announcement', broadcastText);
      }
      toast.success('Broadcast sent!', `Pushed to ${users.length} users across ${communities.length} communities`);
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
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `more-${type}-export.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!', `${type} data downloaded`);
  };


  // ═════════════════════════════════════════════════════════
  // TABS CONFIG
  // ═════════════════════════════════════════════════════════
  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'communities', label: 'Communities', icon: Globe },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'events', label: 'Events', icon: Calendar },
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
    { key: 'content', label: 'Content', icon: MessageCircle },
    { key: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh', background: 'var(--slate-950)' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ padding: '28px 20px 20px', background: 'linear-gradient(180deg, rgba(59,130,246,0.12) 0%, transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0, fontFamily: 'var(--font-heading)' }}>Platform Admin</h1>
            <p style={{ color: 'var(--slate-500)', margin: 0, fontSize: '0.8rem' }}>Global Oversight & Control Centre</p>
          </div>
        </div>
      </div>

      {/* ═══ TAB NAVIGATION ═══ */}
      <div style={{ display: 'flex', gap: '6px', padding: '0 20px', overflowX: 'auto', marginBottom: '20px', WebkitOverflowScrolling: 'touch' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
            className="interactive-press"
            style={{
              padding: '8px 14px', borderRadius: '99px', border: 'none',
              background: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? 'black' : 'var(--slate-400)',
              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW                                    */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <StatCard value={platformStats.totalUsers} label="Total Users" icon={Users} color="white" />
              <StatCard value={platformStats.totalCommunities} label="Communities" icon={Globe} color="#3b82f6" accent="#3b82f6" />
              <StatCard value={platformStats.verifiedCommunities} label="Verified" icon={BadgeCheck} color="#22c55e" accent="#22c55e" />
              <StatCard value={platformStats.totalEvents} label="Total Events" icon={Calendar} color="var(--teal-400)" />
              <StatCard value={`£${platformStats.totalRevenue}`} label="Revenue" icon={DollarSign} color="#f59e0b" accent="#f59e0b" />
              <StatCard value={platformStats.avgAttendance} label="Avg Attendance" icon={UserCheck} color="#a78bfa" accent="#a78bfa" />
            </div>

            {/* Growth Chart */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>User Growth</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Last 8 weeks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '70px' }}>
                {growthData.weeks.map((w, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', height: `${Math.max(8, (w.count / growthData.max) * 100)}%`, background: i === growthData.weeks.length - 1 ? '#3b82f6' : 'rgba(59,130,246,0.25)', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }}></div>
                    <span style={{ fontSize: '0.5rem', color: 'var(--slate-600)' }}>{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Health */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Community Health</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {platformStats.communityHealth.slice(0, 6).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--slate-800)', overflow: 'hidden', flexShrink: 0 }}>
                      {c.image ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={14} color="var(--slate-600)" /></div>}
                    </div>
                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'white', fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{c.members} members</span>
                    <HealthBadge health={c.health} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Recent Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recentActivity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.015)', borderRadius: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${a.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <a.icon size={13} color={a.color} />
                    </div>
                    <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--slate-300)' }}>{a.text}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--slate-600)' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 2: COMMUNITIES                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'communities' && (
          <div>
            <SearchBar placeholder="Search communities..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <FilterPills active={communityFilter} onChange={setCommunityFilter} options={[
              { value: 'all', label: 'All' }, { value: 'verified', label: '✓ Verified' },
              { value: 'unverified', label: 'Unverified' }, { value: 'active', label: '🟢 Active' },
              { value: 'dormant', label: '🔴 Dormant' }
            ]} />
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '12px' }}>{filteredCommunities.length} communities</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredCommunities.map(c => {
                const isExpanded = expandedId === c.id;
                const leader = Object.entries(communityMemberships).find(([cId, mems]) => cId === c.id && mems.some(m => m.role === 'Leader'));
                const leaderUser = leader ? users.find(u => u.id === (communityMemberships[c.id] || []).find(m => m.role === 'Leader')?.userId) : null;

                return (
                  <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--slate-800)', overflow: 'hidden', flexShrink: 0 }}>
                        {c.image ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={18} color="var(--slate-600)" /></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <h3 style={{ margin: 0, color: 'white', fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h3>
                          {c.verified && <BadgeCheck size={14} color="#3b82f6" />}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                          <span>{c.members} members</span>
                          <span>{c.cEvents} events</span>
                          {c.cRevenue > 0 && <span style={{ color: '#f59e0b' }}>£{c.cRevenue}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <HealthBadge health={c.health} />
                        <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="interactive-press"
                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '6px', color: 'var(--slate-400)', cursor: 'pointer' }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '14px' }}>
                        {leaderUser && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <img src={leaderUser.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{leaderUser.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{leaderUser.email} • Leader</div>
                            </div>
                            <Crown size={14} color="#f59e0b" />
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{c.members}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Members</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--teal-400)' }}>{c.cEvents}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Events</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>£{c.cRevenue}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Revenue</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => adminVerifyCommunity(c.id, !c.verified)} className="btn interactive-press"
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 600,
                              background: c.verified ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                              color: c.verified ? '#ef4444' : '#3b82f6', cursor: 'pointer' }}>
                            {c.verified ? '✕ Revoke Verification' : '✓ Verify Community'}
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
        {/* TAB 3: USERS — Full User Intelligence                */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div>
            <SearchBar placeholder="Search members by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <FilterPills active={userFilter} onChange={setUserFilter} options={[
              { value: 'all', label: `All (${users.length})` },
              { value: 'admins', label: '🛡 Admins' },
              { value: 'leaders', label: '👑 Leaders' },
              { value: 'members', label: 'Members' },
              { value: 'active', label: '🟢 Active' },
              { value: 'dormant', label: '💤 Dormant' }
            ]} />

            {/* User Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[
                { value: users.length, label: 'Total', color: 'white' },
                { value: users.filter(u => ADMIN_EMAILS.includes(u.email?.toLowerCase())).length, label: 'Admins', color: '#3b82f6' },
                { value: (() => { let c = 0; Object.values(communityMemberships).forEach(mems => { mems.forEach(m => { if (m.role === 'Leader') c++; }); }); return c; })(), label: 'Leaders', color: '#f59e0b' },
                { value: (() => { let active = 0; users.forEach(u => { const msgs = messages.filter(m => m.authorId === u.id).length; let evts = 0; Object.values(eventRsvps).forEach(r => { if (r.some(rv => rv.userId === u.id)) evts++; }); if (msgs + evts > 2) active++; }); return active; })(), label: 'Active', color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUsers
                .map(u => {
                  // Calculate engagement metrics
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
                  
                  // Find their communities
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', cursor: 'pointer' }}
                        onClick={() => setExpandedId(isExpanded ? null : `user-${u.id}`)}>
                        <div style={{ position: 'relative' }}>
                          <img src={u.avatar} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                          {/* Engagement dot */}
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: '12px', height: '12px', borderRadius: '50%', background: engColor, border: '2px solid var(--slate-950)' }}></div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{u.name}</span>
                            {u.isAdmin && <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>ADMIN</span>}
                            {u.isLeader && <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>LEADER</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email || 'No email'}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          {/* Engagement bar */}
                          <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${u.engagementScore}%`, background: engColor, borderRadius: '99px' }}></div>
                          </div>
                          <span style={{ fontSize: '0.6rem', color: engColor, fontWeight: 600 }}>{u.engagementScore}%</span>
                        </div>
                        <ChevronDown size={14} color="var(--slate-500)" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '14px' }}>
                          {/* Stats Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                            {[
                              { label: 'Communities', value: u.joinedCount, color: '#3b82f6' },
                              { label: 'Events', value: u.userEvents, color: 'var(--teal-400)' },
                              { label: 'Messages', value: u.userMessages, color: '#22c55e' },
                              { label: 'Check-ins', value: u.userCheckins, color: '#a78bfa' },
                            ].map(s => (
                              <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.55rem', color: 'var(--slate-600)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                              </div>
                            ))}
                          </div>

                          {/* Communities List */}
                          {userCommunities.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--slate-600)', textTransform: 'uppercase', marginBottom: '6px' }}>Communities ({userCommunities.length})</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {userCommunities.map(c => (
                                  <span key={c.id} style={{ 
                                    fontSize: '0.7rem', padding: '4px 10px', borderRadius: '99px',
                                    background: c.role === 'Leader' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', 
                                    color: c.role === 'Leader' ? '#f59e0b' : 'var(--slate-300)',
                                    border: `1px solid ${c.role === 'Leader' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                    fontWeight: 500
                                  }}>
                                    {c.role === 'Leader' ? '👑 ' : ''}{c.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Join Date + Engagement Level */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--slate-500)', marginBottom: '12px' }}>
                            <span>Joined {u.joinDate ? new Date(u.joinDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}</span>
                            <span style={{ color: engColor, fontWeight: 600 }}>
                              {u.engagementLevel === 'high' ? '🟢 Highly Active' : u.engagementLevel === 'medium' ? '🟡 Moderately Active' : '🔴 Low Activity'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={(e) => { e.stopPropagation(); navigate.push('/'); }} className="btn btn-outline interactive-press" style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <Eye size={12} /> View Profile
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate.push('/'); }} className="btn btn-primary interactive-press" style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--teal-500)', border: 'none' }}>
                              <MessageCircle size={12} /> Message
                            </button>
                            {!u.isAdmin && (
                              <button onClick={(e) => { 
                                e.stopPropagation(); 
                                updateUser(u.id, { is_suspended: !u.is_suspended });
                                toast.success(u.is_suspended ? 'User unsuspended' : 'User suspended', `${u.name} has been ${u.is_suspended ? 'unsuspended' : 'suspended'}.`);
                              }} className="btn interactive-press" style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', background: u.is_suspended ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${u.is_suspended ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`, color: u.is_suspended ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {u.is_suspended ? <CheckCircle size={12} /> : <Ban size={12} />} {u.is_suspended ? 'Unsuspend' : 'Suspend'}
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
        {/* TAB 4: EVENTS                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div>
            <SearchBar placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <FilterPills active={eventFilter} onChange={setEventFilter} options={[
              { value: 'all', label: `All (${events.length})` },
              { value: 'upcoming', label: '📅 Upcoming' },
              { value: 'past', label: 'Past' },
              { value: 'cancelled', label: '❌ Cancelled' }
            ]} />

            {/* Event Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>{platformStats.totalEvents}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Total Events</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--teal-400)' }}>{platformStats.avgAttendance}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Avg Attendance</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f59e0b' }}>£{platformStats.totalRevenue}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>Event Revenue</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEvents.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', ...(e.status === 'cancelled' ? { opacity: 0.5 } : {}) }}>
                  <div style={{ width: '42px', height: '46px', background: 'rgba(20,184,166,0.08)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>{e.date ? new Date(e.date + 'T00:00:00').getDate() : '—'}</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>{e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }) : ''}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem', marginBottom: '2px' }}>{e.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginBottom: '4px' }}>{e.communityName}</div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--teal-400)' }}>{e.rsvpCount} RSVPs</span>
                      <span style={{ color: '#3b82f6' }}>{e.checkins} check-ins</span>
                      {e.revenue > 0 && <span style={{ color: '#f59e0b' }}>£{e.revenue}</span>}
                    </div>
                  </div>
                  {e.status === 'cancelled' && <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600, alignSelf: 'center' }}>Cancelled</span>}
                </div>
              ))}
              {filteredEvents.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>No events match your filters.</div>}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 5: REVENUE                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <StatCard value={`£${platformStats.totalRevenue}`} label="All-Time Revenue" icon={DollarSign} color="#f59e0b" accent="#f59e0b" />
              <StatCard value={`£${platformStats.monthRevenue}`} label="This Month" icon={TrendingUp} color="#22c55e" accent="#22c55e" />
            </div>

            {/* Revenue by Community */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Revenue by Community</div>
              {revenueByComm.length > 0 ? revenueByComm.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{c.cEvents} events • {c.members} members</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1.1rem' }}>£{c.cRevenue}</div>
                </div>
              )) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem' }}>No revenue recorded yet. Communities need paid events to generate revenue.</div>
              )}
            </div>

            {/* Subscription Communities */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Paid Subscriptions</div>
              {communities.filter(c => (c.subscription_price || c.subscriptionPrice || 0) > 0).length > 0 ? (
                communities.filter(c => (c.subscription_price || c.subscriptionPrice || 0) > 0).map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(245,158,11,0.04)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.1)', marginBottom: '8px' }}>
                    <Crown size={16} color="#f59e0b" />
                    <span style={{ flex: 1, fontWeight: 500, color: 'white', fontSize: '0.9rem' }}>{c.name}</span>
                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>£{c.subscription_price || c.subscriptionPrice}/mo</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.08)' }}>No communities have subscriptions set up yet.</div>
              )}
            </div>

            {/* Payout Placeholder */}
            <div className="glass-panel" style={{ padding: '18px', borderStyle: 'dashed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <DollarSign size={14} color="var(--slate-500)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-400)' }}>Stripe Payouts</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', margin: 0, lineHeight: 1.5 }}>Connect your Stripe account to manage payouts. Revenue from event tickets and subscriptions will be processed automatically.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 6: CONTENT                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'content' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Platform Broadcast */}
            <div className="glass-panel" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Megaphone size={16} color="#f59e0b" />
                <span style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>Platform Broadcast</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '12px' }}>Send an announcement to every user across all {communities.length} communities.</p>
              <textarea placeholder="Write your platform-wide announcement..." value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', minHeight: '100px', fontFamily: 'inherit', resize: 'none', marginBottom: '10px' }} />
              <button onClick={handlePlatformBroadcast} disabled={isSending || !broadcastText.trim()} className="btn btn-primary interactive-press"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSending || !broadcastText.trim() ? 0.5 : 1 }}>
                <Megaphone size={16} /> {isSending ? 'Sending...' : `Broadcast to ${users.length} Users`}
              </button>
            </div>

            {/* Content Moderation Queue */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Moderation Queue</div>
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <Flag size={24} color="var(--slate-600)" style={{ marginBottom: '8px' }} />
                <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem', fontWeight: 500 }}>No flagged content</div>
                <div style={{ color: 'var(--slate-600)', fontSize: '0.75rem', marginTop: '4px' }}>Reported posts and messages will appear here for review.</div>
              </div>
            </div>

            {/* Recent Feed Posts */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Recent Social Hub Posts ({feedPosts.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {feedPosts.slice(-6).reverse().map((post, i) => {
                  const author = users.find(u => u.id === post.authorId);
                  const comm = communities.find(c => c.id === post.communityId);
                  return (
                    <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {author?.avatar && <img src={author.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{author?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--slate-600)' }}>in {comm?.name || 'Unknown'}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.4 }}>{post.content?.substring(0, 120)}{post.content?.length > 120 ? '...' : ''}</div>
                    </div>
                  );
                })}
                {feedPosts.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem' }}>No social hub posts yet.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 7: CONFIG                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Admin List */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Platform Administrators</div>
              {ADMIN_EMAILS.map(email => {
                const adminUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
                return (
                  <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '10px', marginBottom: '8px' }}>
                    {adminUser?.avatar && <img src={adminUser.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                    {!adminUser?.avatar && <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={14} color="#3b82f6" /></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'white', fontSize: '0.85rem' }}>{adminUser?.name || 'Not registered'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>{email}</div>
                    </div>
                    <Shield size={14} color="#3b82f6" />
                  </div>
                );
              })}
            </div>

            {/* Database Health */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Database Health</div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                {[
                  { table: 'users', count: users.length, icon: Users },
                  { table: 'communities', count: communities.length, icon: Globe },
                  { table: 'events', count: events.length, icon: Calendar },
                  { table: 'messages', count: messages.length, icon: MessageCircle },
                  { table: 'feed_posts', count: feedPosts.length, icon: Activity },
                  { table: 'notifications', count: notifications.length, icon: Bell },
                ].map((row, i) => (
                  <div key={row.table} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <row.icon size={14} color="var(--slate-500)" />
                    <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--slate-300)', fontFamily: 'monospace' }}>{row.table}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{row.count} rows</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Data */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Export Data</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['users', 'communities', 'events'].map(type => (
                  <button key={type} onClick={() => handleExportCSV(type)} className="interactive-press"
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', color: 'white', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <Download size={16} color="var(--teal-400)" />
                    <span style={{ flex: 1, fontWeight: 500, fontSize: '0.85rem', textTransform: 'capitalize' }}>Export {type}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>CSV</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Info */}
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '10px' }}>Platform Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--slate-400)' }}>App Name</span>
                  <img src="/logo.png" alt="more." style={{ height: '16px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--slate-400)' }}>Version</span>
                  <span style={{ color: 'white' }}>1.0.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--slate-400)' }}>Environment</span>
                  <span style={{ color: '#22c55e' }}>Production</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--slate-400)' }}>Backend</span>
                  <span style={{ color: 'white' }}>Supabase</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
