"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '../../src/context/AppContext';
import { useToast } from '../../src/components/Toast';
import {
  Building2, Users, Calendar, Activity,
  MapPin, HeartPulse, Link as LinkIcon,
  Download, ShieldCheck, BarChart3, Stethoscope,
  Copy, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { isEventUpcoming, parseEventDateTime } from '../../src/lib/calendar';
import { isCommunityPubliclyListed } from '../../src/lib/communityVisibility';

export default function CouncilDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { communities = [], events = [], communityMemberships = {}, eventRsvps = {}, prescribingLinks = [], setPrescribingLinks } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [newLinkName, setNewLinkName] = useState('');

  // Publicly listed communities only
  const publicCommunities = useMemo(
    () => (communities || []).filter(c => isCommunityPubliclyListed(c) && c.id !== 'more-leaders-network'),
    [communities]
  );

  const publicCommunityIds = useMemo(
    () => new Set(publicCommunities.map(c => c.id)),
    [publicCommunities]
  );

  const publicEvents = useMemo(
    () => (events || []).filter(e => e.status !== 'cancelled' && e.status !== 'proposed' && (!e.communityId || publicCommunityIds.has(e.communityId))),
    [events, publicCommunityIds]
  );

  // Live unique member count across public communities
  const { uniqueMemberCount, totalMemberships } = useMemo(() => {
    const uniqueIds = new Set();
    let total = 0;
    publicCommunities.forEach((comm) => {
      const mems = communityMemberships?.[comm.id] || [];
      total += mems.length;
      mems.forEach((m) => {
        const uid = m.userId || m.user_id;
        if (uid) uniqueIds.add(uid);
      });
    });
    return {
      uniqueMemberCount: uniqueIds.size || total,
      totalMemberships: total,
    };
  }, [publicCommunities, communityMemberships]);

  // Live confirmed RSVPs & verified check-ins across public events
  const { totalConfirmedRsvps, totalVerifiedCheckIns } = useMemo(() => {
    let rsvps = 0;
    let checkedIn = 0;
    publicEvents.forEach((ev) => {
      const list = eventRsvps?.[ev.id] || [];
      list.forEach((r) => {
        if (r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in) {
          rsvps += 1;
        }
        if (r.status === 'checked_in' || r.checkedIn || r.checked_in) {
          checkedIn += 1;
        }
      });
    });
    return { totalConfirmedRsvps: rsvps, totalVerifiedCheckIns: checkedIn };
  }, [publicEvents, eventRsvps]);

  const upcomingEvents = useMemo(
    () => publicEvents.filter(e => isEventUpcoming(e)).length,
    [publicEvents]
  );

  const totalRedemptions = useMemo(
    () => (prescribingLinks || []).reduce((acc, curr) => acc + (Number(curr.uses) || 0), 0),
    [prescribingLinks]
  );

  // Real 6-month activity trend derived directly from live events & RSVPs
  const monthlyActivity = useMemo(() => {
    const now = new Date();
    const buckets = [];
    const bucketMap = new Map();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const entry = { key, name: label, eventsHosted: 0, rsvps: 0 };
      buckets.push(entry);
      bucketMap.set(key, entry);
    }

    publicEvents.forEach((ev) => {
      const dt = parseEventDateTime(ev.date, ev.time) || (ev.createdAt ? new Date(ev.createdAt) : null);
      if (!dt || isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = bucketMap.get(key);
      if (!bucket) return;

      bucket.eventsHosted += 1;
      const list = eventRsvps?.[ev.id] || [];
      const activeRsvps = list.filter(
        r => r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in
      ).length;
      bucket.rsvps += activeRsvps;
    });

    return buckets;
  }, [publicEvents, eventRsvps]);

  const generateLink = () => {
    if (!newLinkName.trim()) {
      toast.info('Enter a cohort name', 'Give this social prescribing link a short name first.');
      return;
    }
    const created = {
      id: `lnk-${Date.now()}`,
      name: newLinkName.trim(),
      created: new Date().toISOString().split('T')[0],
      uses: 0
    };
    setPrescribingLinks([created, ...(prescribingLinks || [])]);
    setNewLinkName('');
    toast.success('Prescription link created!', 'Ready to copy and share with patients.');
  };

  const handleExportReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const rows = [
      ['MORE Community - Anonymised Council & Social Prescribing Report'],
      ['Generated Date', today],
      [],
      ['Summary Metric', 'Live Value'],
      ['Unique Active Local Members', String(uniqueMemberCount)],
      ['Total Community Memberships', String(totalMemberships)],
      ['Active Public Communities', String(publicCommunities.length)],
      ['Total Public Events Hosted', String(publicEvents.length)],
      ['Upcoming Scheduled Events', String(upcomingEvents)],
      ['Confirmed Event RSVPs', String(totalConfirmedRsvps)],
      ['Verified In-Person Check-Ins', String(totalVerifiedCheckIns)],
      ['Social Prescribing Link Redemptions', String(totalRedemptions)],
      [],
      ['6-Month Activity Trend', 'Events Hosted', 'Confirmed RSVPs'],
      ...monthlyActivity.map(m => [m.name, String(m.eventsHosted), String(m.rsvps)]),
      [],
      ['Community', 'Category', 'Members', 'Upcoming Events'],
      ...publicCommunities.map((c) => {
        const mCount = (communityMemberships?.[c.id] || []).length || c.members || 1;
        const uCount = publicEvents.filter(e => e.communityId === c.id && isEventUpcoming(e)).length;
        return [
          `"${String(c.name || '').replace(/"/g, '""')}"`,
          `"${String(c.category || 'Community').replace(/"/g, '""')}"`,
          String(mCount),
          String(uCount),
        ];
      }),
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `more-community-council-impact-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report Downloaded', 'Exported live anonymised CSV report.');
  };

  const handleCopyPrescriptionLink = async (linkId) => {
    const url = `${window.location.origin}/invite?code=${linkId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link Copied!', 'Share this referral link directly with patients.');
    } catch {
      toast.info('Copy Link', url);
    }
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: '100dvh', background: 'var(--surface-canvas)', color: 'var(--ink-primary)' }}>
      {/* ─── SIDEBAR (Desktop Only) ─── */}
      <div className="dashboard-sidebar desktop-only">
        <div className="dashboard-sidebar-header">
          <button
            type="button"
            onClick={() => router.push('/app')}
            className="interactive-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--ink-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              marginBottom: '14px',
            }}
          >
            <ArrowLeft size={14} /> Back to More Community
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={22} color="#FFFFFF" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-primary)' }}>Council Portal</h1>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Civic &amp; NHS Insights</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button onClick={() => setActiveTab('overview')} className={`dashboard-nav-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <BarChart3 size={18} />
            Community Overview
          </button>

          <button onClick={() => setActiveTab('prescribing')} className={`dashboard-nav-item ${activeTab === 'prescribing' ? 'active' : ''}`}>
            <Stethoscope size={18} />
            Social Prescribing (NHS)
          </button>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid var(--hairline-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ink-secondary)', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            Data is strictly anonymised
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="dashboard-main">
        {/* Mobile Header */}
        <div className="mobile-only" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--surface-card)', borderBottom: '1px solid var(--hairline-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => router.push('/app')}
              aria-label="Back to app"
              style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border)', color: 'var(--ink-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#FFFFFF" />
            </div>
            <div>
              <h1 style={{ fontSize: '0.98rem', margin: 0, fontWeight: 700, color: 'var(--ink-primary)' }}>Council Portal</h1>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Live Anonymised Insights</div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <button
              type="button"
              onClick={handleExportReport}
              className="interactive-press"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--hairline-border-strong)', background: 'var(--surface-elevated)', color: 'var(--ink-primary)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <Download size={14} /> CSV
            </button>
          )}
        </div>

        {/* Mobile Tabs */}
        <div className="mobile-only" style={{ padding: '10px 16px', borderBottom: '1px solid var(--hairline-border)', display: 'flex', gap: '8px', background: 'var(--surface-card)' }}>
          <button onClick={() => setActiveTab('overview')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: activeTab === 'overview' ? 'var(--brand-accent)' : 'var(--surface-elevated)', color: activeTab === 'overview' ? '#FFFFFF' : 'var(--ink-secondary)' }}>Overview</button>
          <button onClick={() => setActiveTab('prescribing')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: activeTab === 'prescribing' ? '#3b82f6' : 'var(--surface-elevated)', color: activeTab === 'prescribing' ? '#FFFFFF' : 'var(--ink-secondary)' }}>Social Prescribing</button>
        </div>

        <div className="dashboard-content-scroll" style={{ padding: '24px 20px 80px' }}>
          <header className="desktop-only" style={{ padding: '0 0 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, marginBottom: '10px' }}>
                <CheckCircle2 size={12} /> Live Anonymised Platform Data
              </div>
              <h2 style={{ fontSize: '1.85rem', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: 'var(--ink-primary)' }}>
                {activeTab === 'overview' ? 'Regional Health & Community Activity' : 'Social Prescribing Portal'}
              </h2>
              <p style={{ color: 'var(--ink-secondary)', margin: 0, fontSize: '0.92rem' }}>
                {activeTab === 'overview' ? 'Live aggregated metrics across public grassroots groups and real-world meetups.' : 'Generate trackable invite links to prescribe welcoming local groups to patients.'}
              </p>
            </div>

            {activeTab === 'overview' && (
              <button
                type="button"
                onClick={handleExportReport}
                className="btn btn-outline interactive-press"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--hairline-border-strong)', background: 'var(--surface-card)', color: 'var(--ink-primary)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Download size={16} /> Export CSV Report
              </button>
            )}
          </header>

          <div>
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--brand-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={18} color="var(--brand-accent)" />
                      </div>
                      <span style={{ color: 'var(--ink-secondary)', fontSize: '0.86rem', fontWeight: 600 }}>Active Local Members</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                      {uniqueMemberCount.toLocaleString()}
                    </div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', marginTop: '6px' }}>
                      {totalMemberships.toLocaleString()} total group memberships
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={18} color="#3b82f6" />
                      </div>
                      <span style={{ color: 'var(--ink-secondary)', fontSize: '0.86rem', fontWeight: 600 }}>Active Communities</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                      {publicCommunities.length}
                    </div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', marginTop: '6px' }}>
                      Publicly open local groups
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={18} color="#a855f7" />
                      </div>
                      <span style={{ color: 'var(--ink-secondary)', fontSize: '0.86rem', fontWeight: 600 }}>Upcoming Events</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                      {upcomingEvents}
                    </div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', marginTop: '6px' }}>
                      {publicEvents.length} total hosted · {totalConfirmedRsvps} RSVPs
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HeartPulse size={18} color="#f43f5e" />
                      </div>
                      <span style={{ color: 'var(--ink-secondary)', fontSize: '0.86rem', fontWeight: 600 }}>NHS Prescriptions</span>
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--ink-primary)' }}>
                      {totalRedemptions}
                    </div>
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', marginTop: '6px' }}>
                      {totalVerifiedCheckIns} verified in-person check-ins
                    </div>
                  </div>
                </div>

                {/* Live 6-Month Chart */}
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink-primary)', fontFamily: 'var(--font-heading)' }}>
                        6-Month Activity Trend
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                        Calculated live from scheduled community events and confirmed member RSVPs
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--ink-secondary)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EB5738' }} /> Confirmed RSVPs
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--ink-secondary)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} /> Events Hosted
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '280px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRsvpsLive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EB5738" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#EB5738" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorEventsLive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline-border)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--ink-muted)" axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} stroke="var(--ink-muted)" axisLine={false} tickLine={false} />
                        <RechartsTooltip
                          contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', borderRadius: '10px', color: 'var(--ink-primary)' }}
                          itemStyle={{ color: 'var(--ink-primary)' }}
                        />
                        <Area type="monotone" dataKey="rsvps" stroke="#EB5738" strokeWidth={3} fillOpacity={1} fill="url(#colorRsvpsLive)" name="Confirmed RSVPs" />
                        <Area type="monotone" dataKey="eventsHosted" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEventsLive)" name="Events Hosted" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRESCRIBING */}
            {activeTab === 'prescribing' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LinkIcon size={22} color="#3b82f6" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-primary)' }}>Generate Prescription Link</h3>
                      <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--ink-secondary)' }}>Create anonymised referral links for NHS Link Workers.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', color: 'var(--ink-secondary)', fontSize: '0.84rem', fontWeight: 600 }}>Campaign / Patient Cohort Name</label>
                      <input
                        type="text"
                        value={newLinkName}
                        onChange={(e) => setNewLinkName(e.target.value)}
                        placeholder="e.g. Type-2 Diabetes Walking Group"
                        style={{ width: '100%', padding: '12px 14px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '10px', color: 'var(--ink-primary)', fontSize: '0.94rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generateLink}
                      className="interactive-press"
                      style={{ padding: '12px', background: '#3b82f6', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer' }}
                    >
                      Generate Referral Link
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-primary)' }}>
                    <Activity size={18} color="var(--brand-accent)" /> Active Referral Links ({(prescribingLinks || []).length})
                  </h3>

                  {(prescribingLinks || []).length === 0 ? (
                    <div style={{ background: 'var(--surface-card)', border: '1px dashed var(--hairline-border-strong)', borderRadius: '14px', padding: '24px', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '0.85rem' }}>
                      No active referral links yet. Create one on the left to start tracking social prescriptions.
                    </div>
                  ) : (
                    prescribingLinks.map(link => (
                      <div key={link.id} style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ink-primary)', marginBottom: '4px' }}>{link.name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <span>Created: {link.created}</span>
                            <span>Ref: {link.id}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code style={{ background: 'var(--surface-elevated)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.76rem', color: 'var(--brand-accent)', border: '1px solid var(--hairline-border)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite?code=${link.id}`}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyPrescriptionLink(link.id)}
                              className="interactive-press"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)', borderRadius: '7px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}
                            >
                              <Copy size={12} /> Copy
                            </button>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-accent)', lineHeight: 1 }}>{link.uses}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '4px' }}>Redemptions</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
