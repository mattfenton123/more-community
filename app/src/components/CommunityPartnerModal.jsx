"use client";
import React, { useState } from 'react';
import { 
  X, Sparkles, Calendar, DollarSign, Shield, Award, CheckCircle2, 
  Store, Coffee, Paintbrush, Dumbbell, Stethoscope, Briefcase, 
  ArrowRight, Users, ChevronRight, Check, Heart, ExternalLink 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { useRouter } from 'next/navigation';

const BUSINESS_CATEGORIES = [
  { id: 'Food & Drink', icon: Coffee, label: 'Cafe, Food & Hospitality' },
  { id: 'Health & Wellness', icon: Stethoscope, label: 'Physio, Clinic & Wellness' },
  { id: 'Fitness & Sports', icon: Dumbbell, label: 'Fitness, Gym & Sports' },
  { id: 'Pets & Animals', icon: Heart, label: 'Pets, Vets & Grooming' },
  { id: 'Creative & Retail', icon: Paintbrush, label: 'Studio, Art & Retail' },
  { id: 'Professional', icon: Briefcase, label: 'Professional Services' }
];

const SESSION_DISCIPLINES = [
  'Outdoor, Hiking & Navigation',
  'Fitness, Running & Form',
  'Mindfulness, Breathwork & Yoga',
  'Nature, Foraging & Ecology',
  'Photography, Art & Creative Skills',
  'Dog Training, Behaviour & Agility',
  'Food, Coffee & Craft Tasters',
  'Other Workshop or Experience'
];

export default function CommunityPartnerModal({ 
  isOpen, 
  onClose, 
  community,
  initialTab = 'session'
}) {
  const router = useRouter();
  const { user, pitchService, notifyCommunityLeaders } = useAppContext();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState(null);

  // Tab 1: Guest Session State
  const [sessionForm, setSessionForm] = useState({
    hostName: user?.name || '',
    email: user?.email || '',
    discipline: SESSION_DISCIPLINES[0],
    title: '',
    summary: '',
    duration: '2 hours',
    capacity: '12',
    ticketPrice: '20',
    clubCut: '3.50',
    qualifications: '',
    hasInsurance: true,
    insurer: '',
    website: ''
  });

  // Tab 2: Sponsor & Perk State
  const [sponsorForm, setSponsorForm] = useState({
    businessName: '',
    category: BUSINESS_CATEGORIES[0].id,
    pitch: '',
    perk: '',
    tier: 'directory',
    contactEmail: user?.email || '',
    website: ''
  });

  if (!isOpen || !community) return null;

  const handleSessionSubmit = (e) => {
    e.preventDefault();
    if (!sessionForm.title.trim() || !sessionForm.summary.trim()) {
      toast.error('Missing details', 'Please provide a title and short summary for the session.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      pitchService({
        communityId: community.id,
        userId: user?.id,
        type: 'guest_session',
        title: sessionForm.title.trim(),
        description: sessionForm.summary.trim(),
        discipline: sessionForm.discipline,
        duration: sessionForm.duration,
        capacity: sessionForm.capacity,
        ticketPrice: parseFloat(sessionForm.ticketPrice) || 0,
        clubCut: parseFloat(sessionForm.clubCut) || 0,
        qualifications: sessionForm.qualifications,
        hasInsurance: sessionForm.hasInsurance,
        insurer: sessionForm.insurer,
        hostName: sessionForm.hostName,
        status: 'pending'
      });

      if (notifyCommunityLeaders) {
        notifyCommunityLeaders(
          community.id,
          '✨ New Guest Session Proposal',
          `${sessionForm.hostName || 'An instructor'} has proposed a session: ${sessionForm.title}`,
          `/community/${community.id}`
        );
      }

      setIsSubmitting(false);
      setSubmittedType('session');
    }, 600);
  };

  const handleSponsorSubmit = (e) => {
    e.preventDefault();
    if (!sponsorForm.businessName.trim() || !sponsorForm.pitch.trim()) {
      toast.error('Missing details', 'Please provide your business name and pitch.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const isPremium = sponsorForm.tier !== 'free';
      const monthlyAmount = sponsorForm.tier === 'headline' ? 49 : (sponsorForm.tier === 'directory' ? 15 : 0);
      const leaderCut = sponsorForm.tier === 'headline' ? 39 : (sponsorForm.tier === 'directory' ? 12 : 0);

      pitchService({
        communityId: community.id,
        userId: user?.id,
        type: 'business_sponsor',
        category: sponsorForm.category,
        title: sponsorForm.businessName.trim(),
        description: sponsorForm.pitch.trim(),
        perk: sponsorForm.perk.trim(),
        tier: sponsorForm.tier,
        isPremium,
        monthlyAmount,
        leaderCut,
        status: 'pending'
      });

      if (notifyCommunityLeaders) {
        notifyCommunityLeaders(
          community.id,
          '🤝 New Sponsor Pitch',
          `${sponsorForm.businessName} pitched a ${sponsorForm.tier === 'headline' ? 'Headline Partner' : 'Community Perk'} sponsorship.`,
          `/community/${community.id}`
        );
      }

      setIsSubmitting(false);
      setSubmittedType('sponsor');
    }, 600);
  };

  const handleDone = () => {
    setSubmittedType(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      background: 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          borderRadius: '24px',
          padding: '24px',
          position: 'relative',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="interactive-press"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--slate-400)',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        {submittedType ? (
          /* Submission Confirmation View */
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.15)',
              border: '2px solid var(--teal-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--teal-400)'
            }}>
              <Check size={30} strokeWidth={2.5} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>
              Proposal Delivered to {community.name}
            </h3>

            <p style={{ color: 'var(--slate-300)', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: '440px', margin: '0 auto 20px' }}>
              {submittedType === 'session' 
                ? 'Your guest session proposal has been delivered directly to the community leader dashboard inbox. They will review your dates, topic, and ticket split.'
                : 'Your sponsorship and member perk pitch has been delivered directly to the leader. Billing will only begin once the leader reviews and accepts your proposal.'}
            </p>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '14px', 
              padding: '14px 16px', 
              maxWidth: '420px', 
              margin: '0 auto 24px', 
              textAlign: 'left' 
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Anti-Hassle Protection
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: '4px', lineHeight: 1.4 }}>
                Leaders review all pitches privately with single-tap actions. Cold marketing DMs are disabled to protect leader focus.
              </div>
            </div>

            <button
              onClick={handleDone}
              className="btn btn-primary interactive-press"
              style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700 }}
            >
              Done & Return to Community
            </button>
          </div>
        ) : (
          /* Pitch Form View */
          <div>
            {/* Header */}
            <div style={{ marginBottom: '18px', paddingRight: '36px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '99px', background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', color: 'var(--teal-300)', fontSize: '0.74rem', fontWeight: 700, marginBottom: '8px' }}>
                <Sparkles size={12} /> Community Collaboration
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--white)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Partner with {community.name}
              </h2>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.82rem', margin: '4px 0 0', lineHeight: 1.4 }}>
                Connect directly with {community.name} members in real life. Pitches go straight to the leader.
              </p>
            </div>

            {/* Segmented Mode Selector */}
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('session')}
                className="interactive-press"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'session' ? 'var(--teal-500)' : 'transparent',
                  color: activeTab === 'session' ? '#090d16' : 'var(--slate-300)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Calendar size={15} />
                <span>Host a Session / Workshop</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sponsor')}
                className="interactive-press"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === 'sponsor' ? 'var(--teal-500)' : 'transparent',
                  color: activeTab === 'sponsor' ? '#090d16' : 'var(--slate-300)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Store size={15} />
                <span>Sponsor & Offer a Perk</span>
              </button>
            </div>

            {/* TAB 1: GUEST SESSION FORM */}
            {activeTab === 'session' && (
              <form onSubmit={handleSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(45, 212, 191, 0.2)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.78rem', color: 'var(--teal-200)', lineHeight: 1.4 }}>
                  ✨ <strong>For instructors, coaches & guides:</strong> Pitch a guest workshop, navigation walk, yoga session, or technique clinic. Leaders schedule accepted sessions directly into the event calendar.
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Discipline / Category *</label>
                  <select
                    value={sessionForm.discipline}
                    onChange={(e) => setSessionForm({ ...sessionForm, discipline: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--slate-800)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem' }}
                  >
                    {SESSION_DISCIPLINES.map((d, i) => (
                      <option key={i} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Session Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trail Navigation & Map Reading Workshop"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>What will members do / learn? *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the format, practical skills covered, and what makes this great for the group..."
                    value={sessionForm.summary}
                    onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Ticket Price for Members</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>£</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="20 (or 0 for Free)"
                        value={sessionForm.ticketPrice}
                        onChange={(e) => setSessionForm({ ...sessionForm, ticketPrice: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px 10px 26px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Club Fundraising Cut</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#34d399', fontSize: '0.9rem' }}>£</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="3.50/ticket"
                        value={sessionForm.clubCut}
                        onChange={(e) => setSessionForm({ ...sessionForm, clubCut: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px 10px 26px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(45, 212, 191, 0.3)', color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>
                    Qualifications, Experience or Safety Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mountain Leader (Summer), British Athletics Coach, or 6 years guiding..."
                    value={sessionForm.qualifications}
                    onChange={(e) => setSessionForm({ ...sessionForm, qualifications: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    marginTop: '6px'
                  }}
                >
                  {isSubmitting ? 'Sending Proposal...' : 'Submit Session Proposal to Leader'}
                </button>
              </form>
            )}

            {/* TAB 2: SPONSOR & MEMBER PERK FORM */}
            {activeTab === 'sponsor' && (
              <form onSubmit={handleSponsorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.4 }}>
                  ☕ <strong>For local businesses & clinics:</strong> Offer an exclusive member perk. Featured sponsorships fund the club leader fund with transparent Faster Payments.
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Business / Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Pantiles Coffee Roastery or Tunbridge Wells Physio"
                    value={sponsorForm.businessName}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, businessName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Category *</label>
                  <select
                    value={sponsorForm.category}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--slate-800)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem' }}
                  >
                    {BUSINESS_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Exclusive Member Perk *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15% off coffee & pastries on meetup mornings, or £10 off physio"
                    value={sponsorForm.perk}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, perk: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>About Your Business *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Tell members what you offer and why your perk is great for this group..."
                    value={sponsorForm.pitch}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, pitch: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                  />
                </div>

                {/* Sponsorship Tier Selection */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '8px' }}>Placement & Sponsorship Tier</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Free Member Perk */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: sponsorForm.tier === 'free' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                      border: sponsorForm.tier === 'free' ? '1px solid var(--teal-500)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="sponsorTier" 
                        value="free" 
                        checked={sponsorForm.tier === 'free'} 
                        onChange={() => setSponsorForm({ ...sponsorForm, tier: 'free' })}
                        style={{ marginTop: '3px', accentColor: 'var(--teal-500)' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.85rem' }}>Free Member Perk</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--teal-300)', fontWeight: 700 }}>£0 / mo</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                          Listed in the Services & Perks directory for members.
                        </div>
                      </div>
                    </label>

                    {/* Featured Sponsor (£15/mo) */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: sponsorForm.tier === 'directory' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: sponsorForm.tier === 'directory' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="sponsorTier" 
                        value="directory" 
                        checked={sponsorForm.tier === 'directory'} 
                        onChange={() => setSponsorForm({ ...sponsorForm, tier: 'directory' })}
                        style={{ marginTop: '3px', accentColor: '#f59e0b' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.88rem' }}>Featured Community Sponsor</span>
                          <span style={{ fontSize: '0.74rem', background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>£15.00 / mo</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                          Pinned to the top with a gold Featured badge. <strong>£12.00/mo (80%)</strong> goes directly to the club leader fund.
                        </div>
                      </div>
                    </label>

                    {/* Headline Partner (£49/mo) */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: sponsorForm.tier === 'headline' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: sponsorForm.tier === 'headline' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="sponsorTier" 
                        value="headline" 
                        checked={sponsorForm.tier === 'headline'} 
                        onChange={() => setSponsorForm({ ...sponsorForm, tier: 'headline' })}
                        style={{ marginTop: '3px', accentColor: '#38bdf8' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: '0.88rem' }}>Official Headline Partner</span>
                          <span style={{ fontSize: '0.74rem', background: '#38bdf8', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>£49.00 / mo</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                          Top banner branding, inclusion on event reminder emails, and ticket pass placement. <strong>£39.00/mo</strong> goes to the club leader.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary interactive-press"
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    marginTop: '6px'
                  }}
                >
                  {isSubmitting ? 'Sending Proposal...' : (sponsorForm.tier === 'free' ? 'Submit Perk to Leader' : `Pitch Sponsorship (${sponsorForm.tier === 'headline' ? '£49/mo' : '£15/mo'})`)}
                </button>
              </form>
            )}

            {/* Hub Cross-Link */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/partner');
                }}
                className="interactive-press"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal-300)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Looking to collaborate across multiple groups in your town? Explore Town Partner Hub</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
