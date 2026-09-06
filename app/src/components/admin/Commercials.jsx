import React, { useState } from 'react';
import { DollarSign, Download, TrendingUp, Handshake, BarChart3 } from 'lucide-react';
import { useToast } from '../Toast';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Commercials({ platformStats, handleExportCSV, revenueByComm }) {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState('revenue');

  // Generate mock time-series data for the chart based on current monthRevenue
  const chartData = [
    { month: 'Apr', revenue: platformStats.monthRevenue * 0.4 },
    { month: 'May', revenue: platformStats.monthRevenue * 0.6 },
    { month: 'Jun', revenue: platformStats.monthRevenue * 0.55 },
    { month: 'Jul', revenue: platformStats.monthRevenue * 0.8 },
    { month: 'Aug', revenue: platformStats.monthRevenue * 0.9 },
    { month: 'Sep', revenue: platformStats.monthRevenue }, // current
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Commercials & Financials</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Manage platform monetization, sponsorships, and payouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleExportCSV('revenue')} className="btn btn-outline interactive-press" style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Download size={14} /> Export Finances
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <button onClick={() => setActiveSubTab('revenue')} style={{ background: 'none', border: 'none', color: activeSubTab === 'revenue' ? 'var(--white)' : 'var(--slate-400)', fontWeight: activeSubTab === 'revenue' ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={16} /> Ticket Revenue
        </button>
        <button onClick={() => setActiveSubTab('sponsors')} style={{ background: 'none', border: 'none', color: activeSubTab === 'sponsors' ? 'var(--white)' : 'var(--slate-400)', fontWeight: activeSubTab === 'sponsors' ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Handshake size={16} /> Sponsorships
        </button>
      </div>

      {activeSubTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--white)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={18} /> Revenue Growth (6 Months)</h3>
            <div style={{ height: '250px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                  <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#10b981' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {revenueByComm.map(c => (
              <div key={c.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{c.cEvents} events • {c.members} members</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>£{c.cRevenue}</div>
              </div>
            ))}
            {revenueByComm.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
                No revenue generated yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'sponsors' && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <Handshake size={48} color="var(--slate-600)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 8px 0' }}>Sponsor CRM (Coming Soon)</h3>
          <p style={{ color: 'var(--slate-400)', maxWidth: '400px', margin: '0 auto' }}>
            Manage local brand sponsorships, banner ad placements, and track payouts to community leaders.
          </p>
        </div>
      )}
    </div>
  );
}
