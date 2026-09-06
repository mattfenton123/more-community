import React, { useState } from 'react';
import { Mail, Calendar, Plus, Search } from 'lucide-react';

// Mock leads data for the MVP
const INITIAL_LEADS = [
  { id: 'L1', name: 'Sarah Jenkins', niche: 'Yoga & Wellness', handle: '@sarahj_wellness', status: 'In Talks', lastContact: '2026-09-02', email: 'sarah@example.com' },
  { id: 'L2', name: 'Marcus RunClub', niche: 'Urban Running', handle: '@marcus_runs_ldn', status: 'Prospect', lastContact: '2026-08-28', email: 'marcus@example.com' },
  { id: 'L3', name: 'Emma Climbs', niche: 'Bouldering', handle: '@emma_boulders', status: 'Pitched', lastContact: '2026-09-04', email: 'emma@example.com' },
  { id: 'L4', name: 'Tom Hikes', niche: 'Hiking', handle: '@tomhikesuk', status: 'Onboarding', lastContact: '2026-09-05', email: 'tom@example.com' },
];

const STATUS_COLORS = {
  'Prospect': { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' },
  'Pitched': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'In Talks': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Onboarding': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'Active': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
};

export default function LeaderCRM({ toast }) {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredLeads = leads.filter(l => {
    if (filter !== 'all' && l.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (searchTerm && !l.name.toLowerCase().includes(searchTerm.toLowerCase()) && !l.niche.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Calculate follow-up warnings (if last contact > 4 days ago)
  const isActionNeeded = (dateStr) => {
    const d = new Date(dateStr);
    const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
    return diff > 4;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Leader Prospecting (CRM)</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Track and onboard new community leaders.</p>
        </div>
        <button className="btn btn-primary interactive-press" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => toast.success('Added', 'New lead drafted')}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="var(--slate-500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search leads by name or niche..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 10px 10px 36px', color: 'var(--white)', fontSize: '0.9rem' }} 
          />
        </div>
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 16px', color: 'var(--white)', fontSize: '0.9rem', outline: 'none' }}
        >
          <option value="all">All Statuses</option>
          <option value="prospect">Prospect</option>
          <option value="pitched">Pitched</option>
          <option value="in talks">In Talks</option>
          <option value="onboarding">Onboarding</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filteredLeads.map(lead => {
          const warning = isActionNeeded(lead.lastContact);
          const sColor = STATUS_COLORS[lead.status] || STATUS_COLORS['Prospect'];
          
          return (
            <div key={lead.id} className="glass-panel" style={{ padding: '16px', border: warning ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--white)' }}>{lead.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{lead.niche} • {lead.handle}</div>
                </div>
                <span style={{ background: sColor.bg, color: sColor.color, padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600 }}>
                  {lead.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: warning ? '#ef4444' : 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Last contact: {lead.lastContact}
                  {warning && <span style={{ fontWeight: 600, marginLeft: '4px' }}>(Action Needed)</span>}
                </div>
                <a href={`mailto:${lead.email}?subject=Partnership with More Community`} className="btn interactive-press" style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--white)', display: 'inline-flex' }}>
                  <Mail size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
