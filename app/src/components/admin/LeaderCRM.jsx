import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Plus, Search, X, Trash2, CheckCircle2 } from 'lucide-react';

const STATUS_COLORS = {
  'Prospect': { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' },
  'Pitched': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
  'In Talks': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  'Onboarding': { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' },
  'Active': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
};

const DEFAULT_LEADS = [
  {
    id: 'lead-1',
    name: 'Sarah Jenkins',
    niche: 'Trail Running & Wild Swimming',
    handle: '@sarahruns_uk',
    email: 'sarah.j@example.com',
    status: 'In Talks',
    lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    id: 'lead-2',
    name: 'Marcus Bell',
    niche: 'Men\'s Mental Health & Coffee Walks',
    handle: '@marcusbell_walks',
    email: 'marcus@example.com',
    status: 'Prospect',
    lastContact: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

export default function LeaderCRM({ toast }) {
  const [leads, setLeads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('more_leader_crm_leads');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return DEFAULT_LEADS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    niche: '',
    handle: '',
    email: '',
    status: 'Prospect'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('more_leader_crm_leads', JSON.stringify(leads));
    }
  }, [leads]);

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

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.name.trim()) return;

    const lead = {
      id: `lead-${Date.now()}`,
      name: newLead.name.trim(),
      niche: newLead.niche.trim() || 'Community Organizer',
      handle: newLead.handle.trim() || '@leader',
      email: newLead.email.trim(),
      status: newLead.status,
      lastContact: new Date().toISOString().split('T')[0]
    };

    setLeads(prev => [lead, ...prev]);
    setIsModalOpen(false);
    setNewLead({ name: '', niche: '', handle: '', email: '', status: 'Prospect' });
    toast?.success('Lead Added', `${lead.name} added to pipeline`);
  };

  const handleStatusChange = (id, newStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, lastContact: new Date().toISOString().split('T')[0] } : l));
    toast?.success('Status Updated', `Lead status updated to ${newStatus}`);
  };

  const handleDeleteLead = (id, name) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    toast?.success('Lead Removed', `${name} removed from CRM`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--white)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Leader Prospecting (CRM)</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>Track and onboard new community leaders.</p>
        </div>
        <button 
          className="btn btn-primary interactive-press" 
          style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }} 
          onClick={() => setIsModalOpen(true)}
        >
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
          <option value="active">Active</option>
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
                <select 
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                  style={{ background: sColor.bg, color: sColor.color, border: 'none', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Pitched">Pitched</option>
                  <option value="In Talks">In Talks</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: warning ? '#ef4444' : 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Last contact: {lead.lastContact}
                  {warning && <span style={{ fontWeight: 600, marginLeft: '4px' }}>(Action Needed)</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {lead.email && (
                    <a href={`mailto:${lead.email}?subject=Partnership with More Community`} className="btn interactive-press" style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--white)', display: 'inline-flex' }} title="Send Email">
                      <Mail size={14} />
                    </a>
                  )}
                  <button onClick={() => handleDeleteLead(lead.id, lead.name)} className="btn interactive-press" style={{ padding: '6px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Delete Lead">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredLeads.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>
            No leads found matching your criteria.
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '16px', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: 600 }}>Add Leader Lead</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>Leader Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newLead.name}
                  onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>Niche / Category</label>
                <input 
                  type="text" 
                  placeholder="e.g. Run Club / Book Club / Photography"
                  value={newLead.niche}
                  onChange={e => setNewLead({ ...newLead, niche: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>Social Handle</label>
                <input 
                  type="text" 
                  placeholder="e.g. @alexruns"
                  value={newLead.handle}
                  onChange={e => setNewLead({ ...newLead, handle: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>Email</label>
                <input 
                  type="email" 
                  placeholder="alex@example.com"
                  value={newLead.email}
                  onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '6px' }}>Pipeline Status</label>
                <select 
                  value={newLead.status}
                  onChange={e => setNewLead({ ...newLead, status: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: 'white', fontSize: '0.9rem' }}
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Pitched">Pitched</option>
                  <option value="In Talks">In Talks</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px' }}>
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
