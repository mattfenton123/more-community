"use client";
import React, { useState } from 'react';
import { DollarSign, Download, TrendingUp, Handshake, BarChart3, Plus, CheckCircle2, Clock, Sparkles, Building2, ExternalLink, X, ArrowUpRight } from 'lucide-react';
import { useToast } from '../Toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const INITIAL_SPONSORS = [
  {
    id: 'sp-1',
    brandName: 'Finisterre UK',
    communityName: 'North Coast Dippers & Hikers',
    tier: 'Headline Partner',
    monthlyFee: 500,
    status: 'Active',
    renewalDate: '2026-12-15',
    contactEmail: 'partnerships@finisterre.com',
    deliverables: 'Logo on banner, 1x pinned community post/mo, prize donation'
  },
  {
    id: 'sp-2',
    brandName: 'Oatly Barista',
    communityName: 'London Coffee Run Club',
    tier: 'Community Partner',
    monthlyFee: 250,
    status: 'Active',
    renewalDate: '2026-11-30',
    contactEmail: 'uk-events@oatly.com',
    deliverables: 'Post-run coffee sampling, branded finish-line flags'
  },
  {
    id: 'sp-3',
    brandName: 'Red Bull UK',
    communityName: 'Bouldering & Brews Collective',
    tier: 'Event Supporter',
    monthlyFee: 150,
    status: 'Pending Renewal',
    renewalDate: '2026-10-31',
    contactEmail: 'grassroots@redbull.co.uk',
    deliverables: 'Cooler drops at bi-weekly climbing social'
  }
];

export default function Commercials({ platformStats, handleExportCSV, revenueByComm }) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('revenue');
  const [sponsors, setSponsors] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('more_admin_sponsors');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return INITIAL_SPONSORS;
  });

  const [isAddSponsorOpen, setIsAddSponsorOpen] = useState(false);
  const [newSponsor, setNewSponsor] = useState({
    brandName: '',
    communityName: revenueByComm[0]?.name || '',
    tier: 'Headline Partner',
    monthlyFee: 500,
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
      } catch (e) {}
    }
    return {};
  });

  // Save sponsors to localStorage
  const saveSponsors = (updated) => {
    setSponsors(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('more_admin_sponsors', JSON.stringify(updated));
    }
  };

  const handleAddSponsor = (e) => {
    e.preventDefault();
    if (!newSponsor.brandName.trim()) {
      toast.error('Missing Details', 'Please provide a brand or partner name.');
      return;
    }
    const created = {
      id: `sp-${Date.now()}`,
      brandName: newSponsor.brandName.trim(),
      communityName: newSponsor.communityName || 'Platform Wide',
      tier: newSponsor.tier,
      monthlyFee: Number(newSponsor.monthlyFee) || 250,
      status: newSponsor.status,
      renewalDate: newSponsor.renewalDate,
      contactEmail: newSponsor.contactEmail.trim(),
      deliverables: newSponsor.deliverables.trim() || 'Community sponsorship activation'
    };
    const updated = [created, ...sponsors];
    saveSponsors(updated);
    setIsAddSponsorOpen(false);
    setNewSponsor({
      brandName: '',
      communityName: revenueByComm[0]?.name || '',
      tier: 'Headline Partner',
      monthlyFee: 500,
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

  const totalSponsorMRR = sponsors
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + (Number(s.monthlyFee) || 0), 0);

  const platformTakeRate = 0.15; // 15% platform fee
  const leaderTakeRate = 0.85;   // 85% to leaders

  const totalGrossTicketRevenue = platformStats.totalRevenue || 0;
  const platformGrossCut = Math.round(totalGrossTicketRevenue * platformTakeRate);
  const leaderGrossPayouts = Math.round(totalGrossTicketRevenue * leaderTakeRate);

  // Time-series chart
  const currentMonthRev = platformStats.monthRevenue || 0;
  const chartData = [
    { month: 'Apr', ticketRevenue: Math.round(currentMonthRev * 0.4), sponsorRevenue: 400 },
    { month: 'May', ticketRevenue: Math.round(currentMonthRev * 0.55), sponsorRevenue: 550 },
    { month: 'Jun', ticketRevenue: Math.round(currentMonthRev * 0.7), sponsorRevenue: 650 },
    { month: 'Jul', ticketRevenue: Math.round(currentMonthRev * 0.85), sponsorRevenue: 750 },
    { month: 'Aug', ticketRevenue: Math.round(currentMonthRev * 0.95), sponsorRevenue: 850 },
    { month: 'Sep', ticketRevenue: currentMonthRev, sponsorRevenue: totalSponsorMRR },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ─── Top Header & Controls ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Commercials & Financial Operations</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Ticket sales, brand sponsorships, take-rate monetization, and leader remittances.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => handleExportCSV('revenue')} 
            className="btn btn-outline interactive-press" 
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--white)' }}
          >
            <Download size={14} color="var(--teal-400)" /> Export CSV
          </button>
          <button 
            onClick={() => setIsAddSponsorOpen(true)}
            className="btn btn-primary interactive-press" 
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', background: 'var(--teal-500)', border: 'none', color: '#fff', fontWeight: 600 }}
          >
            <Plus size={14} /> Log Sponsor Deal
          </button>
        </div>
      </div>

      {/* ─── Executive Financial Snapshot Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(20,184,166,0.2)', background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.01) 100%)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Gross Platform Volume</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#2dd4bf', fontFamily: 'var(--font-heading)' }}>£{totalGrossTicketRevenue}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '4px' }}>Across all community events</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(59,130,246,0.2)', background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.01) 100%)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Platform Take (15%)</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-heading)' }}>£{platformGrossCut}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '4px' }}>Net fee revenue retained</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(34,197,94,0.2)', background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.01) 100%)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Leader Earnings (85%)</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#4ade80', fontFamily: 'var(--font-heading)' }}>£{leaderGrossPayouts}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '4px' }}>Earned by community creators</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(245,158,11,0.2)', background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.01) 100%)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Active Sponsorship MRR</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>£{totalSponsorMRR}/mo</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '4px' }}>{sponsors.filter(s => s.status === 'Active').length} brand contracts active</div>
        </div>
      </div>

      {/* ─── Commercial Subtabs ─── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        <button 
          onClick={() => setActiveSubTab('revenue')} 
          className="interactive-press"
          style={{ 
            background: activeSubTab === 'revenue' ? 'white' : 'transparent', 
            border: 'none', 
            borderRadius: '99px',
            padding: '8px 16px',
            color: activeSubTab === 'revenue' ? 'black' : 'var(--slate-400)', 
            fontWeight: 600, 
            fontSize: '0.82rem', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
        >
          <TrendingUp size={15} /> Ticket Revenue
        </button>
        <button 
          onClick={() => setActiveSubTab('sponsors')} 
          className="interactive-press"
          style={{ 
            background: activeSubTab === 'sponsors' ? 'white' : 'transparent', 
            border: 'none', 
            borderRadius: '99px',
            padding: '8px 16px',
            color: activeSubTab === 'sponsors' ? 'black' : 'var(--slate-400)', 
            fontWeight: 600, 
            fontSize: '0.82rem', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
        >
          <Handshake size={15} /> Brand Sponsorships ({sponsors.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('payouts')} 
          className="interactive-press"
          style={{ 
            background: activeSubTab === 'payouts' ? 'white' : 'transparent', 
            border: 'none', 
            borderRadius: '99px',
            padding: '8px 16px',
            color: activeSubTab === 'payouts' ? 'black' : 'var(--slate-400)', 
            fontWeight: 600, 
            fontSize: '0.82rem', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
        >
          <Building2 size={15} /> Leader Remittances
        </button>
      </div>

      {/* ─── TAB 1: TICKET REVENUE ─── */}
      {activeSubTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={17} color="var(--teal-400)" /> Revenue Breakdown & Trajectory (6 Months)
            </h3>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                  <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#2dd4bf' }} />
                  <Area type="monotone" dataKey="ticketRevenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" name="Ticket Sales" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
              Revenue Performance By Community
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {revenueByComm.map(c => {
                const commPlatformTake = Math.round(c.cRevenue * platformTakeRate);
                const commLeaderNet = Math.round(c.cRevenue * leaderTakeRate);
                return (
                  <div key={c.id} className="glass-panel interactive-hover" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                        {c.cEvents} events • {c.members} members
                      </div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', marginTop: '6px' }}>
                        <span style={{ color: '#60a5fa' }}>Take (15%): £{commPlatformTake}</span>
                        <span style={{ color: '#4ade80' }}>Leader (85%): £{commLeaderNet}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2dd4bf' }}>£{c.cRevenue}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Gross</div>
                    </div>
                  </div>
                );
              })}
              {revenueByComm.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                  No community ticket revenue recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SPONSORSHIPS ─── */}
      {activeSubTab === 'sponsors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sponsorship packages banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Tier 1 • Headline Partner</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)', margin: '4px 0' }}>£500 <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 400 }}>/ month</span></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>Top banner inclusion, event co-branding, monthly pinned leader announcement.</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Tier 2 • Community Partner</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)', margin: '4px 0' }}>£250 <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 400 }}>/ month</span></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>Product sampling at 2x monthly events, in-chat sponsor badge, newsletter shoutout.</div>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(20,184,166,0.2)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#14b8a6', textTransform: 'uppercase' }}>Tier 3 • Event Supporter</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--white)', margin: '4px 0' }}>£150 <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 400 }}>/ activation</span></div>
              <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>Per-event refreshment/merch sponsor, ticket raffle perks for community attendees.</div>
            </div>
          </div>

          {/* Active Deals Table / Cards */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                Active Deals & Allocations ({sponsors.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
                Total Run-Rate: £{totalSponsorMRR * 12}/yr
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sponsors.map(sp => (
                <div key={sp.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--white)' }}>{sp.brandName}</h4>
                      <span style={{ 
                        fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                        background: sp.status === 'Active' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: sp.status === 'Active' ? '#22c55e' : '#f59e0b'
                      }}>
                        {sp.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginBottom: '4px' }}>
                      Attached to: <span style={{ color: 'var(--white)', fontWeight: 500 }}>{sp.communityName}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                      {sp.deliverables}
                    </div>
                    {sp.contactEmail && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                        Contact: <a href={`mailto:${sp.contactEmail}`} style={{ color: 'var(--teal-400)', textDecoration: 'none' }}>{sp.contactEmail}</a>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
                      £{sp.monthlyFee}<span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 400 }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                      Renewal: {new Date(sp.renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <button 
                      onClick={() => {
                        const nextStatus = sp.status === 'Active' ? 'Pending Renewal' : 'Active';
                        saveSponsors(sponsors.map(s => s.id === sp.id ? { ...s, status: nextStatus } : s));
                        toast.success('Status Toggled', `${sp.brandName} status updated to ${nextStatus}`);
                      }}
                      className="interactive-press"
                      style={{ marginTop: '4px', padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--slate-300)', cursor: 'pointer' }}
                    >
                      Toggle Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: LEADER REMITTANCES ─── */}
      {activeSubTab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--white)' }}>Monthly Leader Remittance Schedule</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Next automated payout batch: 1st of month</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>
              Creators receive 85% of gross ticket sales directly to their registered bank accounts via Stripe Connect.
              Platform fee (15%) covers payment processing, infrastructure, and organizer support.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {revenueByComm.map(c => {
              const gross = c.cRevenue;
              const leaderShare = Math.round(gross * leaderTakeRate);
              const isPaid = payoutStatuses[c.id] === 'Paid';
              return (
                <div key={c.id} className="glass-panel" style={{ padding: '14px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                      Gross ticket volume: £{gross} • Events: {c.cEvents}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>£{leaderShare}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Net Remittance</div>
                    </div>

                    <button 
                      onClick={() => togglePayoutStatus(c.id)}
                      className="interactive-press"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isPaid ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color: isPaid ? '#22c55e' : '#f59e0b'
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
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-500)' }}>
                No community payouts currently pending.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: Log New Sponsor Deal ─── */}
      {isAddSponsorOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--white)' }}>Log Sponsorship Deal</h3>
              <button onClick={() => setIsAddSponsorOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSponsor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Brand / Partner Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Red Bull UK, Gymshark, Oatly"
                  value={newSponsor.brandName}
                  onChange={e => setNewSponsor({ ...newSponsor, brandName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Package Tier</label>
                  <select 
                    value={newSponsor.tier}
                    onChange={e => setNewSponsor({ ...newSponsor, tier: e.target.value, monthlyFee: e.target.value === 'Headline Partner' ? 500 : e.target.value === 'Community Partner' ? 250 : 150 })}
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="Headline Partner">Headline Partner (£500/mo)</option>
                    <option value="Community Partner">Community Partner (£250/mo)</option>
                    <option value="Event Supporter">Event Supporter (£150/mo)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Monthly Fee (£)</label>
                  <input 
                    type="number"
                    value={newSponsor.monthlyFee}
                    onChange={e => setNewSponsor({ ...newSponsor, monthlyFee: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Target Community Allocation</label>
                <input 
                  type="text" 
                  placeholder="e.g. North Coast Dippers or Platform Wide"
                  value={newSponsor.communityName}
                  onChange={e => setNewSponsor({ ...newSponsor, communityName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Partner Contact Email</label>
                <input 
                  type="email" 
                  placeholder="partnerships@brand.com"
                  value={newSponsor.contactEmail}
                  onChange={e => setNewSponsor({ ...newSponsor, contactEmail: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '4px' }}>Deliverables & Perks</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Logo on flyer, 2x product drops, promo link in community description"
                  value={newSponsor.deliverables}
                  onChange={e => setNewSponsor({ ...newSponsor, deliverables: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setIsAddSponsorOpen(false)}
                  className="interactive-press"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--slate-300)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="interactive-press"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--teal-500)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
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
