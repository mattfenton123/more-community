"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Calendar, Plus, Search, X, Trash2, UserPlus } from 'lucide-react';

const STATUS_COLORS = {
  'Prospect': { bg: 'var(--surface-elevated)', color: 'var(--ink-secondary)' },
  'Pitched': { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' },
  'In Talks': { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706' },
  'Onboarding': { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed' },
  'Active': { bg: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' },
};

export default function LeaderCRM({ toast }) {
  const [leads, setLeads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('more_leader_crm_leads_v2');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [];
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
      localStorage.setItem('more_leader_crm_leads_v2', JSON.stringify(leads));
    }
  }, [leads]);

  const filteredLeads = leads.filter(l => {
    if (filter !== 'all' && l.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (searchTerm && !l.name.toLowerCase().includes(searchTerm.toLowerCase()) && !l.niche.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
      handle: newLead.handle.trim() || '',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--ink-primary)', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>Leader Prospecting CRM</h2>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '0.84rem', margin: 0 }}>Track prospective local group organisers from first outreach to active launch.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary interactive-press"
          style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', display: 'flex', gap: '6px', alignItems: 'center' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={15} /> Add Leader Lead
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} color="var(--ink-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search leads by name or niche..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', borderRadius: '10px', padding: '10px 10px 10px 36px', color: 'var(--ink-primary)', fontSize: '0.88rem' }}
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', borderRadius: '10px', padding: '10px 14px', color: 'var(--ink-primary)', fontSize: '0.86rem', outline: 'none' }}
        >
          <option value="all">All Statuses</option>
          <option value="prospect">Prospect</option>
          <option value="pitched">Pitched</option>
          <option value="in talks">In Talks</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
        </select>
      </div>

      {filteredLeads.length === 0 ? (
        <div style={{ padding: '44px 20px', textAlign: 'center', background: 'var(--surface-card)', border: '1px dashed var(--hairline-border-strong)', borderRadius: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-accent-soft)', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <UserPlus size={22} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', color: 'var(--ink-primary)', fontFamily: 'var(--font-heading)' }}>
            {leads.length === 0 ? 'Your Leader Pipeline Is Ready' : 'No matching leads'}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
            {leads.length === 0 ? 'Add local club organisers, run leaders, or workshop hosts you want to onboard.' : 'Try clearing your search or status filter.'}
          </p>
          {leads.length === 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary interactive-press"
              style={{ padding: '9px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Add First Prospect
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: '14px' }}>
          {filteredLeads.map(lead => {
            const warning = isActionNeeded(lead.lastContact);
            const sColor = STATUS_COLORS[lead.status] || STATUS_COLORS['Prospect'];

            return (
              <div key={lead.id} className="glass-panel" style={{ padding: '16px', border: warning ? '1px solid rgba(220, 38, 38, 0.35)' : '1px solid var(--hairline-border)', borderRadius: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', color: 'var(--ink-primary)' }}>{lead.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>
                      {lead.niche}{lead.handle ? ` · ${lead.handle}` : ''}
                    </div>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    style={{ background: sColor.bg, color: sColor.color, border: '1px solid var(--hairline-border)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Pitched">Pitched</option>
                    <option value="In Talks">In Talks</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--hairline-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: warning ? '#dc2626' : 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: warning ? 600 : 500 }}>
                    <Calendar size={12} /> Last contact: {lead.lastContact}
                    {warning && <span>(Follow up)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {lead.email && (
                      <a href={`mailto:${lead.email}?subject=Partnership with More Community`} className="interactive-press" style={{ padding: '6px', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border)', borderRadius: '8px', color: 'var(--ink-primary)', display: 'inline-flex' }} title="Send Email">
                        <Mail size={14} />
                      </a>
                    )}
                    <button type="button" onClick={() => handleDeleteLead(lead.id, lead.name)} className="interactive-press" style={{ padding: '6px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.25)', borderRadius: '8px', color: '#dc2626', cursor: 'pointer', display: 'inline-flex' }} title="Delete Lead">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(18, 18, 18, 0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '18px', background: 'var(--surface-card)', border: '1px solid var(--hairline-border-strong)', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink-primary)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Add Leader Prospect</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '6px' }}>Leader Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newLead.name}
                  onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', padding: '10px', color: 'var(--ink-primary)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '6px' }}>Niche / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Run Club / Book Club / Photography"
                  value={newLead.niche}
                  onChange={e => setNewLead({ ...newLead, niche: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', padding: '10px', color: 'var(--ink-primary)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '6px' }}>Social Handle</label>
                <input
                  type="text"
                  placeholder="e.g. @alexruns"
                  value={newLead.handle}
                  onChange={e => setNewLead({ ...newLead, handle: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', padding: '10px', color: 'var(--ink-primary)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '6px' }}>Email</label>
                <input
                  type="email"
                  placeholder="alex@domain.co.uk"
                  value={newLead.email}
                  onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', padding: '10px', color: 'var(--ink-primary)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--ink-secondary)', fontWeight: 600, marginBottom: '6px' }}>Pipeline Status</label>
                <select
                  value={newLead.status}
                  onChange={e => setNewLead({ ...newLead, status: e.target.value })}
                  style={{ width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--hairline-border-strong)', borderRadius: '8px', padding: '10px', color: 'var(--ink-primary)', fontSize: '0.9rem' }}
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Pitched">Pitched</option>
                  <option value="In Talks">In Talks</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Active">Active</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="interactive-press" style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid var(--hairline-border-strong)', background: 'transparent', color: 'var(--ink-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary interactive-press" style={{ flex: 1, padding: '10px', borderRadius: '9px', color: '#FFFFFF', fontWeight: 700 }}>
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
