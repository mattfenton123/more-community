"use client";
import React, { useState } from 'react';
import { Shield, CheckCircle2, Award, FileText, Calendar, Clock, MapPin, User, Mail, Globe, Phone, ExternalLink, X, AlertCircle, Sparkles, DollarSign, ChevronRight, UploadCloud, Check } from 'lucide-react';
import { saveSpecialistApplication } from '../lib/specialists';

export default function SpecialistVaultModal({ isOpen, onClose, specialist, mode = 'inspect', onProposalSubmitted }) {
  if (!isOpen) return null;

  // Form State for 'apply' mode
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    tradingName: '',
    email: '',
    phone: '',
    region: '',
    bio: '',
    website: '',
    category: 'Outdoor & Adventure',
    qualifications: '',
    hasInsurance: true,
    insurer: '',
    policyNumber: '',
    safetyNotes: '',
    pitchTitle: '',
    pitchCategory: 'Outdoor Skills & Hiking',
    pitchSummary: '',
    duration: '2 hours',
    maxCapacity: '15',
    standardRrp: '30',
    communityPrice: '20',
    communityCut: '3.50',
    equipmentProvided: '',
    memberNeeds: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleApplySubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      saveSpecialistApplication(formData);
      setIsSubmitting(false);
      setSubmitted(true);
      if (onProposalSubmitted) {
        onProposalSubmitted(formData);
      }
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: mode === 'inspect' ? '680px' : '760px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          border: '1px solid rgba(45, 212, 191, 0.25)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 16, 30, 0.98) 100%)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(20, 184, 166, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)',
              border: '1px solid rgba(45, 212, 191, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--teal-400)'
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontFamily: 'var(--font-heading)' }}>
                  {mode === 'inspect' ? 'Verified Specialist Credential Vault' : 'Specialist & Guide Partner Portal'}
                </h3>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(20, 184, 166, 0.15)',
                  color: 'var(--teal-300)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {mode === 'inspect' ? 'Verified Pro' : 'Phase 2 Marketplace'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                {mode === 'inspect' 
                  ? 'Official NGB qualifications, £5M PLI insurance, and First Aid registry' 
                  : 'Pitch accredited workshops & retreats to 500+ local clubs across the UK'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="interactive-press"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--slate-400)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {mode === 'inspect' && specialist && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Specialist Bio Strip */}
              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <img 
                  src={specialist.avatar} 
                  alt={specialist.name} 
                  style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--teal-500)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>{specialist.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      ★ {specialist.rating} ({specialist.reviewsCount} reviews)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--teal-400)', marginTop: '2px', fontWeight: 600 }}>
                    {specialist.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '4px' }}>
                    {specialist.bio}
                  </div>
                </div>
              </div>

              {/* Verified Credentials Checklist */}
              <div>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--slate-300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Verified Compliance Dossier
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Item 1: NGB */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(20, 184, 166, 0.05)',
                    border: '1px solid rgba(45, 212, 191, 0.2)',
                    borderRadius: '12px'
                  }}>
                    <Award size={18} color="var(--teal-400)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>National Governing Body (NGB) Accreditation</span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(20, 184, 166, 0.2)', color: 'var(--teal-300)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          Checked Active
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                        {specialist.credentials?.ngb || 'Verified NGB Professional Member'}
                      </div>
                    </div>
                  </div>

                  {/* Item 2: PLI Insurance */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(20, 184, 166, 0.05)',
                    border: '1px solid rgba(45, 212, 191, 0.2)',
                    borderRadius: '12px'
                  }}>
                    <Shield size={18} color="var(--teal-400)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Commercial Public Liability & Professional Indemnity</span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(20, 184, 166, 0.2)', color: 'var(--teal-300)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          {specialist.credentials?.insuranceCover?.split(' ')[0] || '£5M'} Cover
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                        {specialist.credentials?.insurancePolicy}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--teal-300)', marginTop: '2px' }}>
                        {specialist.credentials?.insuranceCover} · Valid to {specialist.credentials?.insuranceExpiry}
                      </div>
                    </div>
                  </div>

                  {/* Item 3: First Aid */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px'
                  }}>
                    <CheckCircle2 size={18} color="var(--teal-400)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Emergency & Wilderness First Aid</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Certified</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                        {specialist.credentials?.firstAid}
                      </div>
                    </div>
                  </div>

                  {/* Item 4: DBS & RAMS */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px'
                  }}>
                    <FileText size={18} color="var(--teal-400)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>DBS Clearance & Activity RAMS</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Archived</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                        {specialist.credentials?.dbs}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                        {specialist.credentials?.rams}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Shield Callout */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(15, 23, 42, 0.4) 100%)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                display: 'flex',
                gap: '12px'
              }}>
                <Shield size={24} color="var(--teal-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--teal-200)', marginBottom: '4px' }}>
                    Leader Shield Protection Guarantee
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
                    Under UK common law and the Social Action, Responsibility and Heroism Act 2015, technical instruction, safety briefings, and on-hill supervision are the sole legal duty of care of the accredited specialist. The community leader operates solely as a community host and has zero personal liability.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode: Apply / Pitch for Guides & Instructors */}
          {mode === 'apply' && (
            <div>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(20, 184, 166, 0.2)',
                    border: '2px solid var(--teal-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'var(--teal-400)'
                  }}>
                    <Check size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', fontFamily: 'var(--font-heading)', margin: '0 0 8px 0' }}>
                    Application &amp; Pitch Received!
                  </h3>
                  <p style={{ color: 'var(--slate-300)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
                    Thank you, {formData.fullName}. Your proposed session has been delivered directly to the community leader's dashboard inbox. They will review your pitch and date proposal.
                  </p>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '16px', maxWidth: '440px', margin: '0 auto 24px auto', textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--teal-400)', fontWeight: 600, textTransform: 'uppercase' }}>Queued Pitch</div>
                    <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: '4px 0' }}>{formData.pitchTitle || 'Workshop Session'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                      Club Price: £{formData.communityPrice} (Public RRP £{formData.standardRrp}) · £{formData.communityCut} club fundraising cut
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="btn btn-primary"
                    style={{ padding: '10px 24px', borderRadius: '12px' }}
                  >
                    Done &amp; Return to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Step indicators */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
                    {[
                      { num: 1, title: 'Profile & Links' },
                      { num: 2, title: 'Background & Safety' },
                      { num: 3, title: 'Session & Economics' }
                    ].map(s => (
                      <button
                        type="button"
                        key={s.num}
                        onClick={() => setStep(s.num)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: step === s.num ? '1px solid var(--teal-500)' : '1px solid rgba(255, 255, 255, 0.05)',
                          background: step === s.num ? 'rgba(20, 184, 166, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                          color: step === s.num ? 'var(--teal-300)' : 'var(--slate-400)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: step === s.num ? 'var(--teal-500)' : 'rgba(255, 255, 255, 0.1)',
                          color: step === s.num ? '#000' : 'var(--slate-400)',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>{s.num}</span>
                        {s.title}
                      </button>
                    ))}
                  </div>

                  {/* Step 1: Profile & Region */}
                  {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Full Name *</label>
                          <input 
                            required
                            type="text"
                            placeholder="e.g. David MacLeod"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Business or Trading Name</label>
                          <input 
                            type="text"
                            placeholder="e.g. Peak Navigation Guides"
                            value={formData.tradingName}
                            onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Contact Email *</label>
                          <input 
                            required
                            type="email"
                            placeholder="dave@peaknavigation.co.uk"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Operating Region / Town *</label>
                          <input 
                            required
                            type="text"
                            placeholder="e.g. Tunbridge Wells / Kent / Peak District"
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Short Guiding / Coaching Bio</label>
                        <textarea 
                          rows={3}
                          placeholder="Tell local leaders about your qualifications and style of sessions..."
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setStep(2)}
                          className="btn btn-primary"
                          style={{ padding: '8px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          Next: Background &amp; Safety <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Background, Qualifications & Safety */}
                  {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(45, 212, 191, 0.2)', padding: '12px 14px', borderRadius: '12px', fontSize: '0.82rem', color: 'var(--teal-200)', lineHeight: 1.4 }}>
                        ✨ <strong>Leader Autonomy:</strong> Community leaders review all proposals directly. Tell them about your background, any qualifications or experience you hold, and how you keep sessions safe.
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Session Discipline / Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--slate-800)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                        >
                          <option value="Outdoor &amp; Adventure">Outdoor, Hiking &amp; Navigation</option>
                          <option value="Fitness &amp; Movement">Fitness, Running &amp; Movement</option>
                          <option value="Mind &amp; Breathwork">Mindfulness, Breathwork &amp; Yoga</option>
                          <option value="Nature &amp; Foraging">Nature, Foraging &amp; Ecology</option>
                          <option value="Creative &amp; Photography">Photography, Art &amp; Creative Skills</option>
                          <option value="Dog Training &amp; Agility">Dog Training, Behaviour &amp; Agility</option>
                          <option value="Food &amp; Craft">Food, Coffee &amp; Craft Tasters</option>
                          <option value="Other Experience">Other Local Workshop or Experience</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>
                          Qualifications, Certifications or Practical Experience (Optional)
                        </label>
                        <textarea 
                          rows={2}
                          placeholder="e.g. Mountain Leader (Summer ML), British Athletics Coach, Yoga Alliance 200hr, or 8 years self-taught foraging experience..."
                          value={formData.qualifications}
                          onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                        />
                      </div>

                      {/* Flexible Insurance & Safety */}
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: formData.hasInsurance ? '12px' : '0' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.hasInsurance} 
                            onChange={(e) => setFormData({ ...formData, hasInsurance: e.target.checked })}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--teal-500)' }}
                          />
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                            I hold active Public Liability Insurance or professional cover
                          </span>
                        </label>

                        {formData.hasInsurance && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                            <input 
                              type="text"
                              placeholder="Insurer name (e.g. Hiscox, Balens)"
                              value={formData.insurer}
                              onChange={(e) => setFormData({ ...formData, insurer: e.target.value })}
                              style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem' }}
                            />
                            <input 
                              type="text"
                              placeholder="Policy number / ref (optional)"
                              value={formData.policyNumber}
                              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                              style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem' }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setStep(1)}
                          className="btn btn-outline"
                          style={{ padding: '8px 18px', borderRadius: '10px' }}
                        >
                          Back
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setStep(3)}
                          className="btn btn-primary"
                          style={{ padding: '8px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          Next: Session Pitch <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Activity Pitch & Economics */}
                  {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Workshop / Activity Title *</label>
                        <input 
                          required
                          type="text"
                          placeholder="e.g. Twilight Navigation & Hill Safety Masterclass"
                          value={formData.pitchTitle}
                          onChange={(e) => setFormData({ ...formData, pitchTitle: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Activity Summary for Members *</label>
                        <textarea 
                          rows={2}
                          placeholder="What will members learn or experience? Keep it engaging and welcoming..."
                          value={formData.pitchSummary}
                          onChange={(e) => setFormData({ ...formData, pitchSummary: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Public RRP (£)</label>
                          <input 
                            type="number"
                            value={formData.standardRrp}
                            onChange={(e) => setFormData({ ...formData, standardRrp: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Club Member Price (£) *</label>
                          <input 
                            required
                            type="number"
                            value={formData.communityPrice}
                            onChange={(e) => setFormData({ ...formData, communityPrice: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid var(--teal-500)', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '6px' }}>Club Fund Cut (£/ticket)</label>
                          <input 
                            type="number"
                            step="0.5"
                            value={formData.communityCut}
                            onChange={(e) => setFormData({ ...formData, communityCut: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--teal-300)', fontSize: '0.9rem', fontWeight: 600 }}
                          />
                        </div>
                      </div>

                      {/* Economics preview */}
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px', fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                        💡 <strong>Partner Economics:</strong> At £{formData.communityPrice} per ticket with 12 attendees, the community earns <strong>£{(parseFloat(formData.communityCut || 0) * 12).toFixed(2)}</strong> for their club kitty, and you take home <strong>£{((parseFloat(formData.communityPrice || 0) - parseFloat(formData.communityCut || 0) - 2.00) * 12).toFixed(2)}</strong>.
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setStep(2)}
                          className="btn btn-outline"
                          style={{ padding: '8px 18px', borderRadius: '10px' }}
                        >
                          Back
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="btn btn-primary"
                          style={{ padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {isSubmitting ? 'Verifying & Dispatching...' : 'Submit Pitch to Community Leaders'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
