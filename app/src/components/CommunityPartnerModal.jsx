"use client";
import React, { useState } from 'react';
import { 
  X, Sparkles, Calendar, DollarSign, Shield, Award, CheckCircle2, 
  Store, Coffee, Paintbrush, Dumbbell, Stethoscope, Briefcase, 
  ArrowRight, Users, ChevronRight, Check, Heart, ExternalLink,
  Eye, Image as ImageIcon, Sliders, UserCheck, HelpCircle, Compass
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';
import { useRouter } from 'next/navigation';
import UnsplashImagePicker from './UnsplashImagePicker';

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

const SESSION_PRESET_IMAGES = [
  { label: 'Outdoor Trail', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80' },
  { label: 'Yoga & Breath', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80' },
  { label: 'Running & Sport', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80' },
  { label: 'Creative Studio', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80' },
  { label: 'Dog Agility', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80' },
  { label: 'Coffee & Food', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80' }
];

const SPONSOR_PRESET_IMAGES = [
  { label: 'Cafe & Brunch', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80' },
  { label: 'Clinic & Wellness', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80' },
  { label: 'Outdoor & Gear', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80' },
  { label: 'Pet Spa & Care', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80' },
  { label: 'Craft & Design', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80' }
];

const COLOR_THEMES = [
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Fresh Emerald', hex: '#10b981' },
  { name: 'Sky Cyan', hex: '#0ea5e9' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Royal Violet', hex: '#8b5cf6' }
];

const FONT_STYLES = [
  { id: 'modern', label: 'Modern Sans', style: { fontFamily: 'inherit', fontWeight: 700 } },
  { id: 'serif', label: 'Editorial Serif', style: { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '0.02em' } },
  { id: 'punchy', label: 'Bold Punchy', style: { fontFamily: 'inherit', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' } }
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
  const [unsplashTarget, setUnsplashTarget] = useState(null);

  // Tab 1: Guest Session State
  const [sessionForm, setSessionForm] = useState({
    hostName: user?.name || '',
    hostBio: '',
    hostSocial: '',
    email: user?.email || '',
    discipline: SESSION_DISCIPLINES[0],
    title: '',
    summary: '',
    sessionPhoto: SESSION_PRESET_IMAGES[0].url,
    duration: '2 hours',
    minCapacity: '6',
    maxCapacity: '14',
    ticketPrice: '20',
    clubCut: '4.00',
    qualifications: '',
    hasInsurance: true,
    website: ''
  });

  // Tab 2: Sponsor & Perk State with Custom Ad Designer
  const [sponsorForm, setSponsorForm] = useState({
    businessName: '',
    tagline: 'Proud local partner of ' + (community?.name || 'the community'),
    category: BUSINESS_CATEGORIES[0].id,
    pitch: '',
    perk: '15% off for all group members on meetup days',
    tier: 'directory',
    contactEmail: user?.email || '',
    website: '',
    bannerUrl: SPONSOR_PRESET_IMAGES[0].url,
    accentColor: COLOR_THEMES[0].hex,
    fontStyle: 'modern',
    ctaText: 'Redeem Member Perk'
  });

  if (!isOpen || !community) return null;

  const handleSessionSubmit = (e) => {
    e.preventDefault();
    if (!sessionForm.title.trim() || !sessionForm.summary.trim()) {
      toast.error('Missing details', 'Please provide a title and summary for the session.');
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
        sessionPhoto: sessionForm.sessionPhoto,
        minCapacity: parseInt(sessionForm.minCapacity) || 4,
        maxCapacity: parseInt(sessionForm.maxCapacity) || 12,
        capacity: sessionForm.maxCapacity,
        ticketPrice: parseFloat(sessionForm.ticketPrice) || 0,
        clubCut: parseFloat(sessionForm.clubCut) || 0,
        qualifications: sessionForm.qualifications,
        hostBio: sessionForm.hostBio,
        hostSocial: sessionForm.hostSocial,
        hasInsurance: sessionForm.hasInsurance,
        hostName: sessionForm.hostName,
        status: 'pending'
      });

      if (notifyCommunityLeaders) {
        notifyCommunityLeaders(
          community.id,
          'New Guest Session Proposal',
          `${sessionForm.hostName || 'An instructor'} proposed: ${sessionForm.title} (Min ${sessionForm.minCapacity} / Max ${sessionForm.maxCapacity})`,
          `/community/${community.id}`
        );
      }

      setIsSubmitting(false);
      setSubmittedType('session');
    }, 600);
  };

  const handleSponsorSubmit = (e) => {
    e.preventDefault();
    if (!sponsorForm.businessName.trim() || !sponsorForm.perk.trim()) {
      toast.error('Missing details', 'Please provide your business name and member perk.');
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
        tagline: sponsorForm.tagline.trim(),
        description: sponsorForm.pitch.trim() || sponsorForm.tagline.trim(),
        perk: sponsorForm.perk.trim(),
        tier: sponsorForm.tier,
        isPremium,
        monthlyAmount,
        leaderCut,
        bannerUrl: sponsorForm.bannerUrl,
        accentColor: sponsorForm.accentColor,
        fontStyle: sponsorForm.fontStyle,
        ctaText: sponsorForm.ctaText,
        website: sponsorForm.website,
        status: 'pending'
      });

      if (notifyCommunityLeaders) {
        notifyCommunityLeaders(
          community.id,
          'New Sponsor & Perk Offer',
          `${sponsorForm.businessName} offered: "${sponsorForm.perk}" (${sponsorForm.tier === 'headline' ? '?49/mo Headline' : (sponsorForm.tier === 'directory' ? '?15/mo Featured' : 'Free Perk')})`,
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

  const selectedFontConfig = FONT_STYLES.find(f => f.id === sponsorForm.fontStyle) || FONT_STYLES[0];

  return (
    <>
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
            maxWidth: '620px',
            maxHeight: '94vh',
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
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={16} />
          </button>

          {submittedType ? (
            /* Confirmation View */
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(20, 184, 166, 0.15)',
                border: '2px solid var(--teal-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--teal-400)'
              }}>
                <Check size={32} strokeWidth={2.5} />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>
                Delivered to {community.name}
              </h3>

              <p style={{ color: 'var(--slate-300)', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: '460px', margin: '0 auto 20px' }}>
                {submittedType === 'session' 
                  ? 'Your guest session proposal has been delivered directly to the leader dashboard inbox with your cover photo, capacity limits, and credentials.'
                  : 'Your ad design and member perk offer have been submitted. Leaders review all pitches quietly. Billing will only activate once the leader accepts.'}
              </p>

              <div style={{ 
                background: 'rgba(20, 184, 166, 0.06)', 
                border: '1px solid rgba(45, 212, 191, 0.25)', 
                borderRadius: '14px', 
                padding: '14px 16px', 
                maxWidth: '440px', 
                margin: '0 auto 24px', 
                textAlign: 'left' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--teal-300)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Shield size={14} /> Bidirectional Escrow & Anti-Scam Protection
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: '4px', lineHeight: 1.45 }}>
                  All ticket revenues are held in Stripe escrow until 24 hours after the session completes. If an event is cancelled or misrepresented, attendees receive 100% automatic refunds.
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
            /* Main Pitch Form View */
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
                  Choose your intent: pitch an in-person guest session or design a local sponsor ad.
                </p>
              </div>

              {/* Segmented Mode Selector */}
              <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '4px',
                marginBottom: '20px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('session')}
                  className="interactive-press"
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'session' ? 'var(--teal-500)' : 'transparent',
                    color: activeTab === 'session' ? '#090d16' : 'var(--slate-300)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Calendar size={15} />
                  <span>Pitch a Guest Session</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('sponsor')}
                  className="interactive-press"
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'sponsor' ? 'var(--amber-500)' : 'transparent',
                    color: activeTab === 'sponsor' ? '#090d16' : 'var(--slate-300)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Store size={15} />
                  <span>Sponsor & Ad Designer</span>
                </button>
              </div>

              {/* TAB 1: GUEST SESSION FORM */}
              {activeTab === 'session' && (
                <form onSubmit={handleSessionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'rgba(20, 184, 166, 0.06)', border: '1px solid rgba(45, 212, 191, 0.25)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.78rem', color: 'var(--teal-200)', lineHeight: 1.45 }}>
                    ?? <strong>For instructors, guides & coaches:</strong> Propose an in-person workshop or clinic. Leaders vet your qualifications, participant capacity, and imagery before adding to the group calendar.
                  </div>

                  {/* Session Title & Discipline */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Session Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Trail Navigation & Compass Mastery Workshop"
                        value={sessionForm.title}
                        onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Discipline *</label>
                      <select
                        value={sessionForm.discipline}
                        onChange={(e) => setSessionForm({ ...sessionForm, discipline: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--slate-800)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.84rem' }}
                      >
                        {SESSION_DISCIPLINES.map((d, i) => (
                          <option key={i} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 2.5 hours"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  {/* Session Photo Selector with Unsplash Button */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>Session Cover Photo *</label>
                      <button
                        type="button"
                        onClick={() => setUnsplashTarget('session')}
                        className="interactive-press"
                        style={{
                          background: 'rgba(20, 184, 166, 0.15)',
                          border: '1px solid rgba(45, 212, 191, 0.3)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          color: 'var(--teal-300)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ImageIcon size={12} /> Browse Unsplash Library
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                      {SESSION_PRESET_IMAGES.map((img, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSessionForm({ ...sessionForm, sessionPhoto: img.url })}
                          style={{
                            height: '62px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            border: sessionForm.sessionPhoto === img.url ? '2px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.1)',
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            padding: '4px 6px'
                          }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#fff' }}>{img.label}</span>
                          </div>
                          {sessionForm.sessionPhoto === img.url && (
                            <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--teal-500)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={11} color="#000" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste your own custom image URL..."
                      value={sessionForm.sessionPhoto}
                      onChange={(e) => setSessionForm({ ...sessionForm, sessionPhoto: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--slate-300)', fontSize: '0.78rem' }}
                    />
                  </div>

                  {/* Min & Max Capacity Numbers */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Users size={15} color="var(--teal-400)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)' }}>Attendee Capacity Limits</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>(Critical for leader vetting)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'block', marginBottom: '4px' }}>Min Attendees (To Run)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          required
                          value={sessionForm.minCapacity}
                          onChange={(e) => setSessionForm({ ...sessionForm, minCapacity: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'block', marginBottom: '4px' }}>Max Capacity (Safety Cap)</label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          required
                          value={sessionForm.maxCapacity}
                          onChange={(e) => setSessionForm({ ...sessionForm, maxCapacity: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Session Description */}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>What will members do / learn? *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe what happens, equipment needed, and practical skills covered..."
                      value={sessionForm.summary}
                      onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                    />
                  </div>

                  {/* Pricing & Leader Cut */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Ticket Price (Per Person)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--slate-400)', fontSize: '0.9rem' }}>?</span>
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
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Club Fund Cut (Per Ticket)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#34d399', fontSize: '0.9rem' }}>?</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="4.00"
                          value={sessionForm.clubCut}
                          onChange={(e) => setSessionForm({ ...sessionForm, clubCut: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px 10px 26px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(45, 212, 191, 0.3)', color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instructor Profile & Qualifications */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <UserCheck size={15} color="var(--teal-400)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)' }}>Instructor Profile & Trust</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Your full name or instructor brand..."
                        value={sessionForm.hostName}
                        onChange={(e) => setSessionForm({ ...sessionForm, hostName: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Qualifications (e.g. Summer Mountain Leader, UK Athletics Coach, 200hr RYT Yoga)..."
                        value={sessionForm.qualifications}
                        onChange={(e) => setSessionForm({ ...sessionForm, qualifications: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Instagram profile or website link (e.g. @peak.mountain.skills)..."
                        value={sessionForm.hostSocial}
                        onChange={(e) => setSessionForm({ ...sessionForm, hostSocial: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
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
                      fontSize: '0.96rem',
                      marginTop: '4px'
                    }}
                  >
                    {isSubmitting ? 'Delivering Session Proposal...' : 'Submit Session Proposal to Leader'}
                  </button>
                </form>
              )}

              {/* TAB 2: SPONSOR & AD DESIGNER */}
              {activeTab === 'sponsor' && (
                <form onSubmit={handleSponsorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.45 }}>
                    ?? <strong>Sponsor Ad Designer:</strong> Customise your brand advertisement with your own photo banner, color theme, and typography. See the live interactive preview below before submitting.
                  </div>

                  {/* Business Name & Tagline */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
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
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--slate-800)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      >
                        {BUSINESS_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Website or Social Link</label>
                      <input
                        type="text"
                        placeholder="e.g. https://pantilesroastery.com"
                        value={sponsorForm.website}
                        onChange={(e) => setSponsorForm({ ...sponsorForm, website: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Exclusive Member Perk Offer */}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'block', marginBottom: '5px' }}>Exclusive Member Perk (High-Impact Hook) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15% off coffee & breakfast on meetup mornings, or ?10 off first consultation"
                      value={sponsorForm.perk}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, perk: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fbbf24', fontSize: '0.9rem', fontWeight: 600 }}
                    />
                  </div>

                  {/* Ad Visuals: Banner Photo with Unsplash Button */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>Ad Header Image / Photo Banner</label>
                      <button
                        type="button"
                        onClick={() => setUnsplashTarget('sponsor')}
                        className="interactive-press"
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          color: '#fbbf24',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ImageIcon size={12} /> Browse Unsplash Library
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                      {SPONSOR_PRESET_IMAGES.map((img, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSponsorForm({ ...sponsorForm, bannerUrl: img.url })}
                          style={{
                            height: '48px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            border: sponsorForm.bannerUrl === img.url ? `2px solid ${sponsorForm.accentColor}` : '1px solid rgba(255,255,255,0.1)',
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {sponsorForm.bannerUrl === img.url && (
                            <div style={{ position: 'absolute', top: '2px', right: '2px', background: sponsorForm.accentColor, borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={9} color="#000" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste custom image URL..."
                      value={sponsorForm.bannerUrl}
                      onChange={(e) => setSponsorForm({ ...sponsorForm, bannerUrl: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--slate-300)', fontSize: '0.78rem' }}
                    />
                  </div>

                  {/* Ad Custom Styling: Colors & Font */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <Sliders size={14} color="var(--amber-400)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)' }}>Ad Customization (Fonts & Color Palette)</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {/* Color Swatches */}
                      <div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block', marginBottom: '6px' }}>Brand Accent Color</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {COLOR_THEMES.map((theme, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSponsorForm({ ...sponsorForm, accentColor: theme.hex })}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: theme.hex,
                                border: sponsorForm.accentColor === theme.hex ? '2px solid #fff' : '2px solid transparent',
                                cursor: 'pointer',
                                transform: sponsorForm.accentColor === theme.hex ? 'scale(1.15)' : 'scale(1)',
                                transition: 'transform 0.15s ease'
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Font Style */}
                      <div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', display: 'block', marginBottom: '6px' }}>Typography Style</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {FONT_STYLES.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setSponsorForm({ ...sponsorForm, fontStyle: f.id })}
                              style={{
                                flex: 1,
                                padding: '5px 4px',
                                borderRadius: '6px',
                                border: sponsorForm.fontStyle === f.id ? `1px solid ${sponsorForm.accentColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                                background: sponsorForm.fontStyle === f.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: sponsorForm.fontStyle === f.id ? '#fff' : 'var(--slate-400)',
                                fontSize: '0.7rem',
                                fontWeight: sponsorForm.fontStyle === f.id ? 700 : 500,
                                cursor: 'pointer'
                              }}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LIVE AD CARD PREVIEW */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Eye size={14} color="var(--amber-400)" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--white)' }}>Live Ad Preview (How Members See It)</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: sponsorForm.accentColor, fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '99px' }}>
                        {sponsorForm.tier === 'headline' ? 'Headline Partner' : (sponsorForm.tier === 'directory' ? 'Featured Sponsor' : 'Member Perk')}
                      </span>
                    </div>

                    {/* Rendered Ad Card */}
                    <div style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--slate-900)',
                      border: `1.5px solid ${sponsorForm.accentColor}55`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}>
                      {/* Banner Image */}
                      <div style={{
                        height: '90px',
                        backgroundImage: `url(${sponsorForm.bannerUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 80%)' }} />
                        <div style={{ position: 'absolute', bottom: '8px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: sponsorForm.accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: 800,
                            fontSize: '1rem'
                          }}>
                            {sponsorForm.businessName ? sponsorForm.businessName.charAt(0).toUpperCase() : 'B'}
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: '0.92rem', 
                              color: '#fff', 
                              lineHeight: 1.2,
                              ...selectedFontConfig.style
                            }}>
                              {sponsorForm.businessName || 'Your Business Name'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--slate-300)' }}>
                              {community.name} Partner
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content & Perk */}
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: `${sponsorForm.accentColor}18`,
                          border: `1px solid ${sponsorForm.accentColor}44`,
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sponsorForm.accentColor }}>
                            ?? {sponsorForm.perk || 'Special Member Perk Offer'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>Verified Local Partner</span>
                          <div style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: sponsorForm.accentColor,
                            color: '#000',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}>
                            {sponsorForm.ctaText} ?
                          </div>
                        </div>
                      </div>
                    </div>
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
                            <span style={{ fontSize: '0.72rem', color: 'var(--teal-300)', fontWeight: 700 }}>?0 / mo</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                            Listed in the Services & Perks directory for members.
                          </div>
                        </div>
                      </label>

                      {/* Featured Sponsor (?15/mo) */}
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
                            <span style={{ fontSize: '0.74rem', background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>?15.00 / mo</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                            Pinned with a gold Featured badge. <strong>?12.00/mo (80%)</strong> goes directly to the club leader fund.
                          </div>
                        </div>
                      </label>

                      {/* Headline Partner (?49/mo) */}
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
                            <span style={{ fontSize: '0.74rem', background: '#38bdf8', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>?49.00 / mo</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--slate-300)', marginTop: '2px' }}>
                            Top banner branding, event email inclusion, and ticket pass placement. <strong>?39.00/mo</strong> goes to the leader.
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
                    {isSubmitting ? 'Delivering Proposal...' : (sponsorForm.tier === 'free' ? 'Submit Perk to Leader' : `Submit Sponsorship Proposal (${sponsorForm.tier === 'headline' ? '?49/mo' : '?15/mo'})`)}
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

      {/* Unsplash Image Picker Modal */}
      <UnsplashImagePicker
        isOpen={Boolean(unsplashTarget)}
        onClose={() => setUnsplashTarget(null)}
        title={unsplashTarget === 'session' ? 'Select Session Cover Photo' : 'Select Sponsor Banner Photo'}
        onSelect={(url) => {
          if (unsplashTarget === 'session') {
            setSessionForm(prev => ({ ...prev, sessionPhoto: url }));
          } else if (unsplashTarget === 'sponsor') {
            setSponsorForm(prev => ({ ...prev, bannerUrl: url }));
          }
          setUnsplashTarget(null);
        }}
      />
    </>
  );
}
