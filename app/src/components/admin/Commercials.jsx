"use client";
import React, { useState, useMemo } from 'react';
import { Download, TrendingUp, Handshake, BarChart3, Plus, CheckCircle2, Clock, Building2, X, Trash2 } from 'lucide-react';
import { useToast } from '../Toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { parseEventDateTime } from '../../lib/calendar';

export default function Commercials({
  platformStats,
  handleExportCSV,
  revenueByComm = [],
  events = [],
  eventRsvps = {},
  sponsors: dbSponsors = [],
  sponsorshipAssignments = [],
  communities = [],
}) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('revenue');
  const [loggedSponsors, setLoggedSponsors] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('more_admin_logged_sponsors_v2');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  const [isAddSponsorOpen, setIsAddSponsorOpen] = useState(false);
  const [newSponsor, setNewSponsor] = useState({
    brandName: '',
    communityName: revenueByComm[0]?.name || '',
    tier: 'Community Partner',
    monthlyFee: 250,
    status: 'Active',
    renewalDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contactEmail: '',
    deliverables: ''
  });

  const [payoutStatuses, setPayoutStatuses] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('more_admin_payout_statuses');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });

  const saveLoggedSponsors = (updated) => {
    setLoggedSponsors(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('more_admin_logged_sponsors_v2', JSON.stringify(updated));
    }
  };

  // Merge real database sponsors with manually logged deals
  const allSponsorDeals = useMemo(() => {
    const fromDb = (dbSponsors || []).map((sp) => {
      const assignment = (sponsorshipAssignments || []).find(a => a.sponsor_id === sp.id);
      const comm = assignment?.target_id ? (communities || []).find(c => c.id === assignment.target_id) : null;
      return {
        id: sp.id,
        source: 'database',
        brandName: sp.name || sp.companyName || 'Local Sponsor',
        communityName: assignment?.target_type === 'global' ? 'Platform Wide' : (comm?.name || 'Local Community'),
        tier: sp.tier || 'Community Sponsor',
        monthlyFee: Number(sp.monthlyFee || sp.monthly_fee || 0),
        status: sp.status || 'Active',
        renewalDate: sp.renewalDate || sp.created_at || new Date().toISOString(),
        contactEmail: sp.email || sp.contactEmail || '',
        deliverables: sp.perk || sp.description || 'Community sponsor placement & member perks',
      };
    });
    return [...fromDb, ...loggedSponsors];
  }, [dbSponsors, sponsorshipAssignments, communities, loggedSponsors]);

  const handleAddSponsor = (e) => {
    e.preventDefault();
    if (!newSponsor.brandName.trim()) {
      toast.error('Missing Details', 'Please provide a brand or partner name.');
      return;
    }
    const created = {
      id: `sp-${Date.now()}`,
      source: 'local',
      brandName: newSponsor.brandName.trim(),
      communityName: newSponsor.communityName || 'Platform Wide',
      tier: newSponsor.tier,
      monthlyFee: Number(newSponsor.monthlyFee) || 0,
      status: newSponsor.status,
      renewalDate: newSponsor.renewalDate,
      contactEmail: newSponsor.contactEmail.trim(),
      deliverables: newSponsor.deliverables.trim() || 'Community sponsorship activation'
    };
    saveLoggedSponsors([created, ...loggedSponsors]);
    setIsAddSponsorOpen(false);
    setNewSponsor({
      brandName: '',
      communityName: revenueByComm[0]?.name || '',
      tier: 'Community Partner',
      monthlyFee: 250,
      status: 'Active',
      renewalDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contactEmail: '',
      deliverables: ''
    });
    toast.success('Sponsor Logged', `${created.brandName} added to commercials tracker.`);
  };

  const togglePayoutStatus = (commId) => {
    const nextStatus = payoutStatuses[commId] === 'Paid' ? 'Pending' : 'Paid';
    const updated = { ...payoutStatuses, [commId]: nextStatus };
    setPayoutStatuses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('more_admin_payout_statuses', JSON.stringify(updated));
    }
    toast.success('Payout Status Updated', `Marked as ${nextStatus}`);
  };

  // Accurate per-community take-rate calculation (5% Standard / 2% Leader Pro)
  const { totalGrossTicketRevenue, platformGrossCut, leaderGrossPayouts } = useMemo(() => {
    let gross = 0;
    let platform = 0;
    let leader = 0;
    revenueByComm.forEach((c) => {
      const rev = Number(c.cRevenue) || 0;
      const isPro = Boolean(c.is_insured || c.insurance_tier === 'pro');
      const feeRate = isPro ? 0.02 : 0.05;
      const cut = rev * feeRate;
      gross += rev;
      platform += cut;
      leader += rev - cut;
    });
    if (gross === 0 && platformStats?.totalRevenue > 0) {
      gross = Number(platformStats.totalRevenue) || 0;
      platform = gross * 0.05;
      leader = gross - platform;
    }
    return {
      totalGrossTicketRevenue: Math.round(gross * 100) / 100,
      platformGrossCut: Math.round(platform * 100) / 100,
      leaderGrossPayouts: Math.round(leader * 100) / 100,
    };
  }, [revenueByComm, platformStats?.totalRevenue]);

  const totalSponsorMRR = allSponsorDeals
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);

  // Live 6-month ticket sales trend from actual events & confirmed RSVPs
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    const map = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const row = { key, month: label, ticketRevenue: 0 };
      buckets.push(row);
      map.set(key, row);
    }
    (events || []).forEach((ev) => {
      if (ev.status === 'cancelled' || ev.status === 'proposed') return;
      const price = Number(ev.ticketPrice) || 0;
      if (price <= 0) return;
      const dt = parseEventDateTime(ev.date, ev.time) || (ev.createdAt ? new Date(ev.createdAt) : null);
      if (!dt || isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = map.get(key);
      if (!bucket) return;
      const activeRsvps = (eventRsvps?.[ev.id] || []).filter(
        r => r.status === 'going' || r.status === 'checked_in' || r.checkedIn || r.checked_in
      ).length;
      bucket.ticketRevenue += price * activeRsvps;
    });
    return buckets;
  }, [events, eventRsvps]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--ink-primary)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
            Commercials &amp; Financial Operations
          </h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.84rem', margin: 0 }}>
            Live ticket volume, 5% standard / 2% Pro take-rate calculations, brand sponsorships, and leader remittances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleExportCSV('revenue')}
            className="interactive-press"
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', color: 'var(--ink-primary)' }}
          >
            <Download size={14} color="var(--brand-accent)" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setIsAddSponsorOpen(true)}
            className="btn btn-primary interactive-press"
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', color: '#FFFFFF', fontWeight: 700 }}
          >
            <Plus size={14} /> Log Sponsor Deal
          </button>
        </div>
      </div>

      {/* Executive Financial Snapshot Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(235, 87, 56, 0.25)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Gross Ticket Volume</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--brand-accent)', fontFamily: 'var(--font-heading)' }}>£{totalGrossTicketRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', marginTop: '4px' }}>Live across paid community events</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Platform Take (5% / 2% Pro)</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#2563eb', fontFamily: 'var(--font-heading)' }}>£{platformGrossCut.toFixed(2)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', marginTop: '4px' }}>Net platform fee revenue</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Leader Earnings (95% / 98% Pro)</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-heading)' }}>£{leaderGrossPayouts.toFixed(2)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', marginTop: '4px' }}>Earned by local group leaders</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Active Sponsorship MRR</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#d97706', fontFamily: 'var(--font-heading)' }}>£{totalSponsorMRR}/mo</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', marginTop: '4px' }}>{allSponsorDeals.filter(s => s.status === 'Active').length} active sponsor contracts</div>
        </div>
      </div>

      {/* Commercial Subtabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--hairline-border)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'revenue', label: 'Ticket Revenue', icon: TrendingUp },
          { id: 'sponsors', label: `Brand Sponsorships (${allSponsorDeals.length})`, icon: Handshake },
          { id: 'payouts', label: 'Leader Remittances', icon: Building2 },
        ].map((tab) => {
          const active = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className="interactive-press"
              style={{
                background: active ? 'var(--ink-primary)' : 'var(--surface-card)',
                border: active ? '1px solid var(--ink-primary)' : '1px solid var(--hairline-border-strong)',
                borderRadius: '99px',
                padding: '8px 15px',
                color: active ? 'var(--surface-canvas)' : 'var(--ink-secondary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TICKET REVENUE */}
      {activeSubTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.96rem', color: 'var(--ink-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
                <BarChart3 size={17} color="var(--brand-accent)" /> Live Ticket Sales Trajectory (Last 6 Months)
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>Live event &amp; RSVP records</span>
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTicketsLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EB5738" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EB5738" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--ink-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ink-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', borderRadius: '10px', color: 'var(--ink-primary)' }}
                    itemStyle={{ color: 'var(--brand-accent)', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="ticketRevenue" stroke="#EB5738" strokeWidth={3} fillOpacity={1} fill="url(#colorTicketsLive)" name="Ticket Sales (£)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              Revenue Performance By Community
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '12px' }}>
              {revenueByComm.map(c => {
                const isPro = Boolean(c.is_insured || c.insurance_tier === 'pro');
                const rate = isPro ? 0.02 : 0.05;
                const leaderPct = isPro ? 98 : 95;
                const commPlatformTake = (c.cRevenue * rate).toFixed(2);
                const commLeaderNet = (c.cRevenue * (1 - rate)).toFixed(2);
                return (
                  <div key={c.id} className="glass-panel interactive-hover" style={{ padding: '16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                        {c.cEvents} events · {c.members} members · {isPro ? 'Leader Pro (2%)' : 'Standard (5%)'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.72rem', fontWeight: 600, marginTop: '6px' }}>
                        <span style={{ color: '#2563eb' }}>Platform: £{commPlatformTake}</span>
                        <span style={{ color: '#16a34a' }}>Leader ({leaderPct}%): £{commLeaderNet}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-accent)' }}>£{c.cRevenue}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gross</div>
                    </div>
                  </div>
                );
              })}
              {revenueByComm.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--ink-secondary)', background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px' }}>
                  No paid community ticket revenue recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPONSORSHIPS */}
      {activeSubTab === 'sponsors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Tier 1 · Headline Partner</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0' }}>£500 <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 500 }}>/ month</span></div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>Top banner inclusion, event co-branding, monthly pinned leader announcement.</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(37, 99, 235, 0.25)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Tier 2 · Community Partner</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0' }}>£250 <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 500 }}>/ month</span></div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>Product sampling at monthly events, in-chat sponsor badge, newsletter shoutout.</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(235, 87, 56, 0.25)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand-accent)', textTransform: 'uppercase' }}>Tier 3 · Event Supporter</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ink-primary)', margin: '4px 0' }}>£150 <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 500 }}>/ activation</span></div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>Per-event refreshment/merch sponsor, ticket raffle perks for attendees.</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                Live &amp; Logged Sponsor Deals ({allSponsorDeals.length})
              </span>
              <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 700 }}>
                Annualised Run-Rate: £{(totalSponsorMRR * 12).toLocaleString()}/yr
              </span>
            </div>

            {allSponsorDeals.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface-card)', border: '1px dashed var(--hairline-border-strong)', borderRadius: '16px' }}>
                <p style={{ margin: '0 0 14px 0', color: 'var(--ink-secondary)', fontSize: '0.86rem' }}>
                  No active brand sponsorship contracts logged yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddSponsorOpen(true)}
                  className="btn btn-primary interactive-press"
                  style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Log First Sponsor Deal
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allSponsorDeals.map(sp => (
                  <div key={sp.id} className="glass-panel" style={{ padding: '16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--ink-primary)' }}>{sp.brandName}</h4>
                        <span style={{
                          fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                          background: sp.status === 'Active' ? 'rgba(22, 163, 74, 0.14)' : 'rgba(217, 119, 6, 0.14)',
                          color: sp.status === 'Active' ? '#16a34a' : '#d97706'
                        }}>
                          {sp.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                        Attached to: <strong style={{ color: 'var(--ink-primary)' }}>{sp.communityName}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{sp.deliverables}</div>
                      {sp.contactEmail && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                          Contact: <a href={`mailto:${sp.contactEmail}`} style={{ color: 'var(--brand-accent)', textDecoration: 'none' }}>{sp.contactEmail}</a>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>
                        £{sp.monthlyFee}<span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 500 }}>/mo</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                        Renewal: {new Date(sp.renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {sp.source === 'local' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = sp.status === 'Active' ? 'Pending Renewal' : 'Active';
                              saveLoggedSponsors(loggedSponsors.map(s => s.id === sp.id ? { ...s, status: nextStatus } : s));
                              toast.success('Status Updated', `${sp.brandName} marked as ${nextStatus}`);
                            }}
                            className="interactive-press"
                            style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '7px', border: '1px solid var(--hairline-border-strong)', background: 'var(--surface-elevated)', color: 'var(--ink-primary)', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Toggle Status
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              saveLoggedSponsors(loggedSponsors.filter(s => s.id !== sp.id));
                              toast.info('Removed', `${sp.brandName} removed.`);
                            }}
                            aria-label="Remove deal"
                            style={{ padding: '4px 7px', borderRadius: '7px', border: '1px solid rgba(220, 38, 38, 0.25)', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', cursor: 'pointer' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LEADER REMITTANCES */}
      {activeSubTab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--ink-primary)', fontFamily: 'var(--font-heading)' }}>Leader Remittance Schedule</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Automated via Stripe Connect</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              Leaders keep <strong>95%</strong> of paid ticket sales on Free Tier (<strong>5%</strong> platform fee) or <strong>98%</strong> on Leader Pro (<strong>2%</strong> platform fee), minus standard Stripe card processing fees.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {revenueByComm.map(c => {
              const gross = c.cRevenue;
              const isPro = Boolean(c.is_insured || c.insurance_tier === 'pro');
              const leaderShare = (gross * (isPro ? 0.98 : 0.95)).toFixed(2);
              const isPaid = payoutStatuses[c.id] === 'Paid';
              return (
                <div key={c.id} className="glass-panel" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink-primary)', fontSize: '0.92rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                      Gross ticket volume: £{gross} · {c.cEvents} events · {isPro ? 'Pro 98%' : 'Standard 95%'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>£{leaderShare}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Net Remittance</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePayoutStatus(c.id)}
                      className="interactive-press"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '9px',
                        border: isPaid ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(217, 119, 6, 0.3)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isPaid ? 'rgba(22, 163, 74, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                        color: isPaid ? '#16a34a' : '#d97706'
                      }}
                    >
                      {isPaid ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      {isPaid ? 'Paid' : 'Mark as Paid'}
                    </button>
                  </div>
                </div>
              );
            })}
            {revenueByComm.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-secondary)', background: 'var(--surface-card)', border: '1px solid var(--hairline-border)', borderRadius: '14px' }}>
                No community payouts currently pending.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Log New Sponsor Deal */}
      {isAddSponsorOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(18, 18, 18, 0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '18px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink-primary)', fontFamily: 'var(--font-heading)' }}>Log Sponsorship Deal</h3>
              <button type="button" onClick={() => setIsAddSponsorOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '4px' }}>Brand / Partner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Local Coffee Roastery, Outdoor Gear Shop"
                  value={newSponsor.brandName}
                  onChange={e => setNewSponsor({ ...newSponsor, brandName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', color: 'var(--ink-primary)', fontSize: '0.86rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '4px' }}>Package Tier</label>
                  <select
                    value={newSponsor.tier}
                    onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value, monthlyFee: e.target.value === 'Headline Partner' ? 500 : e.target.value === 'Community Partner' ? 250 : 150 })}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', color: 'var(--ink-primary)', fontSize: '0.86rem' }}
                  >
                    <option value="Headline Partner">Headline Partner (£500/mo)</option>
                    <option value="Community Partner">Community Partner (£250/mo)</option>
                    <option value="Event Supporter">Event Supporter (£150/mo)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '4px' }}>Monthly Fee (£)</label>
                  <input
                    type="number"
                    value={newSponsor.monthlyFee}
                    onChange={e => setNewSponsor({ ...newSponsor, monthlyFee: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', color: 'var(--ink-primary)', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '4px' }}>Target Community Allocation</label>
                <input
                  type="text"
                  placeholder="e.g. More Community Walks or Platform Wide"
                  value={newSponsor.communityName}
                  onChange={e => setNewSponsor({ ...newSponsor, communityName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', color: 'var(--ink-primary)', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '4px' }}>Partner Contact Email</label>
                <input
                  type="email"
                  placeholder="partnerships@brand.co.uk"
                  value={newSponsor.contactEmail}
                  onChange={e => setNewSponsor({ ...newSponsor, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', color: 'var(--ink-primary)', fontSize: '0.86rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '4px' }}>Deliverables &amp; Perks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Logo on flyer, member discount perk, pinned community post"
                  value={newSponsor.deliverables}
                  onChange={e => setNewSponsor({ ...newSponsor, deliverables: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', color: 'var(--ink-primary)', fontSize: '0.86rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddSponsorOpen(false)}
                  className="interactive-press"
                  style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid var(--hairline-border-strong)', background: 'transparent', color: 'var(--ink-secondary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary interactive-press"
                  style={{ flex: 1, padding: '10px', borderRadius: '9px', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Partner Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
