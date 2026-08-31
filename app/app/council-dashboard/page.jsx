"use client";
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../src/context/AppContext';
import { 
  Building2, Users, Calendar, Activity, 
  MapPin, HeartPulse, Link as LinkIcon, 
  Download, ArrowUpRight, ShieldCheck,
  TrendingUp, BarChart3, Stethoscope
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function CouncilDashboard() {
  const { communities, events, users, communityMemberships, eventRsvps, prescribingLinks, setPrescribingLinks } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  
  // ─── DEMO DATA CALCS ──────────────────────────────────────────────────
  const totalCommunities = communities.length;
  
  // Calculate total members across all communities
  let totalMembers = 0;
  Object.values(communityMemberships).forEach(mems => {
    totalMembers += mems.length;
  });

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;
  
  // Mock monthly data for the chart
  const monthlyActivity = [
    { name: 'Jan', active: 1200, rsvps: 800 },
    { name: 'Feb', active: 1350, rsvps: 920 },
    { name: 'Mar', active: 1600, rsvps: 1100 },
    { name: 'Apr', active: 1900, rsvps: 1450 },
    { name: 'May', active: 2400, rsvps: 1800 },
    { name: 'Jun', active: 3100, rsvps: 2600 }
  ];

  const [newLinkName, setNewLinkName] = useState('');

  const generateLink = () => {
    if (!newLinkName.trim()) return;
    setPrescribingLinks([{ 
      id: `lnk-${Date.now()}`, 
      name: newLinkName, 
      created: new Date().toISOString().split('T')[0], 
      uses: 0 
    }, ...prescribingLinks]);
    setNewLinkName('');
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', background: 'var(--slate-950)', color: 'var(--white)' }}>
      
      {/* ─── SIDEBAR (Desktop Only) ─── */}
      <div className="dashboard-sidebar desktop-only">
        <div className="dashboard-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>Enterprise</h1>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Kent County Council</div>
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

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="var(--teal-500)" />
            Data is strictly anonymised
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="dashboard-main">
        {/* Mobile Header */}
        <div className="mobile-only" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--slate-900)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Enterprise</h1>
            <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>Kent County Council</div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="mobile-only" style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'overview' ? 'var(--teal-500)' : 'transparent', color: activeTab === 'overview' ? 'white' : 'var(--slate-400)' }}>Overview</button>
          <button onClick={() => setActiveTab('prescribing')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: activeTab === 'prescribing' ? 'rgba(59,130,246,0.1)' : 'transparent', color: activeTab === 'prescribing' ? '#3b82f6' : 'var(--slate-400)' }}>Prescribing</button>
        </div>

        <div className="dashboard-content-scroll" style={{ padding: '24px' }}>
        <header className="desktop-only" style={{ padding: '0 0 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '2rem', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
              {activeTab === 'overview' ? 'Regional Health & Activity' : 'Social Prescribing Portal'}
            </h2>
            <p style={{ color: 'var(--slate-400)', margin: 0 }}>
              {activeTab === 'overview' ? 'Aggregated metrics for grassroots community engagement.' : 'Generate secure invite links to prescribe active communities to patients.'}
            </p>
          </div>
          
          {activeTab === 'overview' && (
            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--slate-700)', background: 'var(--slate-800)', color: 'var(--white)', cursor: 'pointer' }}>
              <Download size={16} /> Export Report
            </button>
          )}
        </header>

        <div>
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={18} color="var(--teal-400)" />
                    </div>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem', fontWeight: 500 }}>Active Citizens</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>
                    {totalMembers.toLocaleString()}
                  </div>
                  <div style={{ color: 'var(--teal-400)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    <ArrowUpRight size={14} /> +24% this month
                  </div>
                </div>

                <div style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={18} color="#3b82f6" />
                    </div>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem', fontWeight: 500 }}>Communities</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>
                    {totalCommunities}
                  </div>
                </div>

                <div style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} color="#a855f7" />
                    </div>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem', fontWeight: 500 }}>Upcoming Events</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>
                    {upcomingEvents}
                  </div>
                </div>

                <div style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HeartPulse size={18} color="#f43f5e" />
                    </div>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.9rem', fontWeight: 500 }}>NHS Prescriptions</span>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--white)' }}>
                    {prescribingLinks.reduce((acc, curr) => acc + curr.uses, 0)}
                  </div>
                  <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem', marginTop: '8px' }}>
                    Successful redemptions
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '16px', padding: '32px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', fontWeight: 600 }}>Engagement Trends</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--teal-400)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--teal-400)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRsvps" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-800)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--slate-500)" axisLine={false} tickLine={false} />
                      <YAxis stroke="var(--slate-500)" axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ background: 'var(--slate-800)', border: '1px solid var(--slate-700)', borderRadius: '8px', color: 'var(--white)' }}
                        itemStyle={{ color: 'var(--white)' }}
                      />
                      <Area type="monotone" dataKey="active" stroke="var(--teal-400)" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
                      <Area type="monotone" dataKey="rsvps" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRsvps)" name="Event RSVPs" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRESCRIBING */}
          {activeTab === 'prescribing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              
              <div style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '16px', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LinkIcon size={24} color="#3b82f6" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Generate Prescription Link</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--slate-400)' }}>Create trackable invite links for patients.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem' }}>Campaign / Patient Cohort Name</label>
                    <input 
                      type="text" 
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                      placeholder="e.g. Type-2 Diabetes Walking Group"
                      style={{ width: '100%', padding: '14px', background: 'var(--slate-950)', border: '1px solid var(--slate-700)', borderRadius: '12px', color: 'var(--white)', fontSize: '1rem' }}
                    />
                  </div>
                  <button 
                    onClick={generateLink}
                    style={{ padding: '14px', background: '#3b82f6', color: 'var(--white)', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginTop: '8px' }}
                  >
                    Generate Link
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} color="var(--teal-400)" /> Active Links
                </h3>
                
                {prescribingLinks.map(link => (
                  <div key={link.id} style={{ background: 'var(--slate-900)', border: '1px solid var(--slate-800)', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, marginRight: '20px' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{link.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <span>Created: {link.created}</span>
                        <span>ID: {link.id}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ background: 'var(--slate-950)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--teal-300)', border: '1px solid var(--slate-800)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {`${typeof window !== 'undefined' ? window.location.origin : ''}/invite?code=${link.id}`}
                        </code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite?code=${link.id}`);
                            alert('Copied to clipboard!');
                          }}
                          style={{ padding: '6px 12px', background: 'var(--slate-800)', border: '1px solid var(--slate-700)', color: 'var(--white)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal-400)', lineHeight: 1 }}>{link.uses}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '4px' }}>Redemptions</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
