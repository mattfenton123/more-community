"use client";
import React, { useState } from 'react';
import { 
  X, Sparkles, Calendar, DollarSign, Shield, Award, CheckCircle2, 
  Store, Coffee, Paintbrush, Dumbbell, Stethoscope, Briefcase, 
  ArrowRight, ArrowLeft, Users, ChevronRight, Check, Heart, ExternalLink,
  Eye, Image as ImageIcon, Sliders, UserCheck, HelpCircle, Compass,
  Layers, Clock, MapPin, Tag, CheckCircle, Info
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

const JOURNEY_STEPS = [
  { id: 0, label: 'Overview', desc: 'The Opportunity' },
  { id: 1, label: 'Community', desc: 'Target Audience' },
  { id: 2, label: 'Details', desc: 'Your Offer' },
  { id: 3, label: 'Design', desc: 'Creative Studio' },
  { id: 4, label: 'Review', desc: 'Trust & Submit' }
];

export default function CommunityPartnerModal({
  isOpen,
  onClose,
  community,
  initialTab = 'session'
}) {
  const router = useRouter();
  const { user, pitchService, notifyCommunityLeaders, communities } = useAppContext();
  const { toast } = useToast();

  const [partnerMode, setPartnerMode] = useState(initialTab === 'sponsor' ? 'sponsor' : 'session');
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedType, setSubmittedType] = useState(null);
  const [unsplashTarget, setUnsplashTarget] = useState(null);

  const [selectedCommunityId, setSelectedCommunityId] = useState(community?.id || (communities?.[0]?.id || null));
  const [communitySearch, setCommunitySearch] = useState('');

  const targetCommunity = (communities && communities.find(c => c.id === selectedCommunityId)) || community || (communities && communities[0]);

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

  const [sponsorForm, setSponsorForm] = useState({
    businessName: '',
    tagline: 'Proud local partner of ' + (community?.name || 'the community'),
    category: BUSINESS_CATEGORIES[0].id,
    pitch: '',
    perk: '',
    tier: 'directory',
    contactEmail: user?.email || '',
    website: '',
    bannerUrl: SPONSOR_PRESET_IMAGES[0].url,
    accentColor: COLOR_THEMES[0].hex,
    fontStyle: 'modern',
    ctaText: 'Redeem Member Perk'
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!targetCommunity) {
        toast.error('Select Community', 'Please choose a target community to proceed.');
        return;
      }
    }
    if (currentStep === 2) {
      if (partnerMode === 'session') {
        if (!sessionForm.title.trim() || !sessionForm.summary.trim()) {
          toast.error('Missing details', 'Please enter a title and summary for the guest session.');
          return;
        }
      } else {
        if (!sponsorForm.businessName.trim()) {
          toast.error('Missing details', 'Please enter your business name.');
          return;
        }
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, JOURNEY_STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const commId = targetCommunity?.id;
    if (!commId) {
      toast.error('Error', 'No community selected.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (partnerMode === 'session') {
        pitchService({
          communityId: commId,
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
            commId,
            'New Guest Session Proposal',
            (sessionForm.hostName || 'An instructor') + ' proposed: ' + sessionForm.title + ' (Min ' + sessionForm.minCapacity + ' - Max ' + sessionForm.maxCapacity + ')',
            '/community/' + commId
          );
        }
        setSubmittedType('session');
      } else {
        const isPremium = sponsorForm.tier !== 'free';
        const monthlyAmount = sponsorForm.tier === 'headline' ? 49 : (sponsorForm.tier === 'directory' ? 15 : 0);
        const leaderCut = sponsorForm.tier === 'headline' ? 39 : (sponsorForm.tier === 'directory' ? 12 : 0);

        pitchService({
          communityId: commId,
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
            commId,
            sponsorForm.perk ? 'New Sponsor & Perk Offer' : 'New Community Sponsor',
            sponsorForm.businessName + (sponsorForm.perk ? ' offered perk: "' + sponsorForm.perk + '"' : ' joined as a brand supporter') + ' (' + (sponsorForm.tier === 'headline' ? '£49 Headline Sponsor' : '£15 Directory Sponsor') + ')',
            '/community/' + commId
          );
        }
        setSubmittedType('sponsor');
      }
      setIsSubmitting(false);
    }, 600);
  };

  const handleDone = () => {
    setSubmittedType(null);
    setCurrentStep(0);
    onClose();
  };

  const selectedFontConfig = FONT_STYLES.find(f => f.id === sponsorForm.fontStyle) || FONT_STYLES[0];

  const filteredCommunities = (communities || []).filter(c => {
    if (!communitySearch.trim()) return true;
    const q = communitySearch.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.location_name?.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
  });

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
      }} onClick={onClose}>
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            background: '#0d1527',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '780px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Top Header & Close */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(45, 212, 191, 0.15)',
                  color: '#2dd4bf',
                  padding: '3px 9px',
                  borderRadius: '99px'
                }}>
                  Partner & Sponsor Journey
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  Step {currentStep + 1} of {JOURNEY_STEPS.length}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--white)', margin: '4px 0 0' }}>
                {JOURNEY_STEPS[currentStep].label}: {JOURNEY_STEPS[currentStep].desc}
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: 'var(--slate-300)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(' + JOURNEY_STEPS.length + ', 1fr)',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '8px 24px'
          }}>
            {JOURNEY_STEPS.map((s, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div 
                  key={s.id}
                  onClick={() => {
                    if (idx < currentStep) setCurrentStep(idx);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderBottom: isCurrent ? '2px solid #2dd4bf' : (isPast ? '2px solid rgba(45, 212, 191, 0.4)' : '2px solid transparent'),
                    cursor: isPast ? 'pointer' : 'default',
                    opacity: isCurrent ? 1 : (isPast ? 0.85 : 0.45)
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isCurrent ? '#2dd4bf' : (isPast ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
                    color: isCurrent ? '#0f172a' : (isPast ? '#2dd4bf' : '#94a3b8'),
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isPast ? <Check size={11} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isCurrent ? '#fff' : 'var(--slate-300)', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Modal Body */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px'
          }}>
            {/* SUCCESS / DONE SCREEN */}
            {submittedType ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(45, 212, 191, 0.15)',
                  color: '#2dd4bf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)', marginBottom: '8px' }}>
                  Proposal Submitted!
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--slate-300)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                  Your {submittedType === 'session' ? 'guest session proposal' : 'local sponsorship pitch'} has been delivered directly to the leader of <strong>{targetCommunity?.name}</strong>.
                </p>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  maxWidth: '480px',
                  margin: '0 auto 24px',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  color: 'var(--slate-300)',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--white)', display: 'block', marginBottom: '6px' }}>What happens next:</strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>The community leader reviews your pitch in their dashboard.</li>
                    <li>You will receive an email confirmation once reviewed.</li>
                    <li>{submittedType === 'session' ? 'Tickets are protected by post-event escrow (payouts release 24-48h after the session).' : '80% of your sponsor fee funds community activities.'}</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleDone}
                  style={{
                    background: 'linear-gradient(135deg, #2dd4bf, #0284c7)',
                    color: '#0f172a',
                    fontWeight: 700,
                    padding: '12px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Done & Return
                </button>
              </div>
            ) : (
              <>
                {/* STEP 0: THE OPPORTUNITY (EXPLANATION & INTENT) */}
                {currentStep === 0 && (
                  <div>
                    {/* Hero Value Banner */}
                    <div style={{
                      padding: '20px 24px',
                      background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(14, 165, 233, 0.06) 100%)',
                      border: '1px solid rgba(45, 212, 191, 0.25)',
                      borderRadius: '18px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2dd4bf', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        <Sparkles size={16} /> Partnering on More Community
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 8px' }}>
                        Direct reach to engaged local people. 80% goes to the club fund.
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'var(--slate-300)', lineHeight: 1.5, margin: 0 }}>
                        Local clubs need trustworthy local partners. More provides a clean, scam-free bridge between community leaders, local businesses, and skilled instructors.
                      </p>
                    </div>

                    {/* 3 Core Guarantees */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '14px' }}>
                        <DollarSign size={20} color="#2dd4bf" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>80% Directly to Clubs</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>Your sponsorship directly finances grassroots equipment, kits, and group socials.</div>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '14px' }}>
                        <Shield size={20} color="#38bdf8" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>Post-Event Escrow</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>For ticketed sessions, ticket revenue is held safely in escrow and releases 24-48h after the event.</div>
                      </div>
                      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '14px', padding: '14px' }}>
                        <UserCheck size={20} color="#a855f7" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', marginBottom: '4px' }}>Leader Vetted</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>Every offer is hand-reviewed by the community leader before going live in the feed.</div>
                      </div>
                    </div>

                    {/* The Intent Decision */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)', marginBottom: '12px' }}>
                        Choose what you want to propose:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {/* Option 1: Sponsor & Perk */}
                        <div
                          onClick={() => setPartnerMode('sponsor')}
                          style={{
                            padding: '18px 20px',
                            borderRadius: '16px',
                            background: partnerMode === 'sponsor' ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: partnerMode === 'sponsor' ? '2px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(45, 212, 191, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Store size={20} color="#2dd4bf" />
                            </div>
                            {partnerMode === 'sponsor' && <CheckCircle size={20} color="#2dd4bf" />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--white)' }}>Local Business Sponsor</div>
                            <div style={{ fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, marginTop: '2px' }}>From £15/mo • 80% to club fund</div>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.4, margin: 0 }}>
                            Feature your brand ad in the club feed and offer an exclusive perk to members on meetup days (cafes, physios, gear shops).
                          </p>
                        </div>

                        {/* Option 2: Guest Session Host */}
                        <div
                          onClick={() => setPartnerMode('session')}
                          style={{
                            padding: '18px 20px',
                            borderRadius: '16px',
                            background: partnerMode === 'session' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                            border: partnerMode === 'session' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Calendar size={20} color="#38bdf8" />
                            </div>
                            {partnerMode === 'session' && <CheckCircle size={20} color="#38bdf8" />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--white)' }}>Guest Session or Masterclass</div>
                            <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>Ticketed Experience • Escrow protected</div>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.4, margin: 0 }}>
                            Pitch a co-hosted masterclass, coaching clinic, or special outdoor workshop with set min/max capacities and safe post-event payouts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: TARGET COMMUNITY (AUDIENCE & REACH) */}
                {currentStep === 1 && (
                  <div>
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 6px' }}>
                        Select Target Community
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', margin: 0 }}>
                        Choose which local club will receive your pitch and host your placement.
                      </p>
                    </div>

                    {/* Pre-selected or Currently Chosen Card */}
                    {targetCommunity && (
                      <div style={{
                        padding: '16px 20px',
                        background: 'rgba(45, 212, 191, 0.08)',
                        border: '1px solid rgba(45, 212, 191, 0.3)',
                        borderRadius: '16px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: '#1e293b',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {targetCommunity.cover_image || targetCommunity.image ? (
                              <img src={targetCommunity.cover_image || targetCommunity.image} alt={targetCommunity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Users size={22} color="#2dd4bf" />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--white)' }}>{targetCommunity.name}</span>
                              <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '99px', color: '#2dd4bf' }}>
                                {targetCommunity.category || 'Local Club'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#2dd4bf" /> {targetCommunity.location_name || 'Local Town'}</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Users size={12} color="#2dd4bf" /> {targetCommunity.member_count || '50+'} active members</span>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={16} /> Selected
                        </span>
                      </div>
                    )}

                    {/* For Sponsors: Tier Option (Single Club vs Town Bundle) */}
                    {partnerMode === 'sponsor' && (
                      <div style={{ marginBottom: '22px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)', marginBottom: '10px' }}>
                          Choose Sponsorship Tier:
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div
                            onClick={() => setSponsorForm({ ...sponsorForm, tier: 'directory' })}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: sponsorForm.tier === 'directory' ? 'rgba(45, 212, 191, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                              border: sponsorForm.tier === 'directory' ? '2px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.08)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--white)', fontSize: '0.88rem' }}>Club Directory Sponsor</span>
                              <span style={{ fontWeight: 800, color: '#2dd4bf', fontSize: '0.9rem' }}>£15<span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/mo</span></span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', margin: 0, lineHeight: 1.4 }}>
                              Placement inside {targetCommunity?.name || 'this club'}'s feed. £12/mo goes straight to the club fund.
                            </p>
                          </div>

                          <div
                            onClick={() => setSponsorForm({ ...sponsorForm, tier: 'headline' })}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '14px',
                              background: sponsorForm.tier === 'headline' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                              border: sponsorForm.tier === 'headline' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 800, color: 'var(--white)', fontSize: '0.88rem' }}>Town Bundle Headline Sponsor</span>
                              <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.9rem' }}>£49<span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/mo</span></span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', margin: 0, lineHeight: 1.4 }}>
                              Top banner placement cross-promoted across all local clubs in this town. £39/mo goes to clubs.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Switch or Search Other Communities */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>
                          Or switch to another local community:
                        </label>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          {filteredCommunities.length} communities available
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by club name, town, or sport..."
                        value={communitySearch}
                        onChange={e => setCommunitySearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: 'var(--white)',
                          fontSize: '0.84rem',
                          marginBottom: '10px'
                        }}
                      />
                      <div style={{
                        maxHeight: '160px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingRight: '4px'
                      }}>
                        {filteredCommunities.map(c => {
                          const isSelected = c.id === selectedCommunityId;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCommunityId(c.id)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: isSelected ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? '#fff' : 'var(--slate-200)' }}>{c.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} color="var(--slate-400)" /> {c.location_name || 'UK'}</span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: isSelected ? '#2dd4bf' : 'var(--slate-400)' }}>
                                {isSelected ? 'Selected' : 'Select'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: THE DETAILS & QUESTIONS */}
                {currentStep === 2 && (
                  <div>
                    {partnerMode === 'sponsor' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Business Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. The Bakehouse & Espresso Bar"
                            value={sponsorForm.businessName}
                            onChange={e => setSponsorForm({ ...sponsorForm, businessName: e.target.value })}
                            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Category *</label>
                            <select
                              value={sponsorForm.category}
                              onChange={e => setSponsorForm({ ...sponsorForm, category: e.target.value })}
                              style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                            >
                              {BUSINESS_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Website or Instagram</label>
                            <input
                              type="text"
                              placeholder="https:// or @handle"
                              value={sponsorForm.website}
                              onChange={e => setSponsorForm({ ...sponsorForm, website: e.target.value })}
                              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>
                              Exclusive Member Perk (Optional)
                            </label>
                            <span style={{ fontSize: '0.7rem', color: '#2dd4bf', background: 'rgba(45,212,191,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Optional</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. 15% off hot drinks & brunch (or leave blank if supporting without a discount)"
                            value={sponsorForm.perk}
                            onChange={e => setSponsorForm({ ...sponsorForm, perk: e.target.value })}
                            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                          />
                          <span style={{ fontSize: '0.74rem', color: 'var(--slate-400)', marginTop: '4px', display: 'block' }}>
                            Optional: If offered, this perk is highlighted on your ad badge and inside the member perks directory. Leave blank if sponsoring purely as a local brand supporter.
                          </span>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Short About / Pitch</label>
                          <textarea
                            rows={3}
                            placeholder="Tell the community leader why your business is a great fit for their group..."
                            value={sponsorForm.pitch}
                            onChange={e => setSponsorForm({ ...sponsorForm, pitch: e.target.value })}
                            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem', resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Session Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. Trail Navigation & Map Reading Masterclass"
                            value={sessionForm.title}
                            onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })}
                            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Discipline</label>
                            <select
                              value={sessionForm.discipline}
                              onChange={e => setSessionForm({ ...sessionForm, discipline: e.target.value })}
                              style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                            >
                              {SESSION_DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Duration</label>
                            <input
                              type="text"
                              placeholder="e.g. 2 hours"
                              value={sessionForm.duration}
                              onChange={e => setSessionForm({ ...sessionForm, duration: e.target.value })}
                              style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Summary & What Members Learn *</label>
                          <textarea
                            rows={3}
                            placeholder="Describe what will happen, route or venue details, and key takeaways..."
                            value={sessionForm.summary}
                            onChange={e => setSessionForm({ ...sessionForm, summary: e.target.value })}
                            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem', resize: 'vertical' }}
                          />
                        </div>

                        {/* Capacity limits (Min and Max) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '4px' }}>Min Attendees</label>
                            <input
                              type="number"
                              min="1"
                              value={sessionForm.minCapacity}
                              onChange={e => setSessionForm({ ...sessionForm, minCapacity: e.target.value })}
                              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '4px' }}>Max Attendees</label>
                            <input
                              type="number"
                              min="1"
                              value={sessionForm.maxCapacity}
                              onChange={e => setSessionForm({ ...sessionForm, maxCapacity: e.target.value })}
                              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '4px' }}>Ticket Price (?)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={sessionForm.ticketPrice}
                              onChange={e => setSessionForm({ ...sessionForm, ticketPrice: e.target.value })}
                              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '4px' }}>Club Share (?)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={sessionForm.clubCut}
                              onChange={e => setSessionForm({ ...sessionForm, clubCut: e.target.value })}
                              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.85rem' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Host Bio & Credentials</label>
                          <input
                            type="text"
                            placeholder="e.g. Certified Mountain Leader & Outdoor First Aider (8 yrs exp)"
                            value={sessionForm.qualifications}
                            onChange={e => setSessionForm({ ...sessionForm, qualifications: e.target.value })}
                            style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--white)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: CREATIVE STUDIO (AD & PITCH CUSTOMIZER) */}
                {currentStep === 3 && (
                  <div>
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 6px' }}>
                        Creative Studio & Live Feed Preview
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', margin: 0 }}>
                        Customize your colors, imagery, and typography. See exactly how it appears to members.
                      </p>
                    </div>

                    {partnerMode === 'sponsor' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
                        {/* Left: Design Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Banner Image Picker */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Banner Image</label>
                              <button
                                type="button"
                                onClick={() => setUnsplashTarget('sponsor')}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ImageIcon size={14} /> Search Unsplash
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '8px' }}>
                              {SPONSOR_PRESET_IMAGES.map((img, i) => (
                                <img
                                  key={i}
                                  src={img.url}
                                  alt={img.label}
                                  onClick={() => setSponsorForm({ ...sponsorForm, bannerUrl: img.url })}
                                  style={{
                                    width: '100%',
                                    height: '42px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: sponsorForm.bannerUrl === img.url ? '2px solid #2dd4bf' : '1px solid rgba(255,255,255,0.1)'
                                  }}
                                />
                              ))}
                            </div>
                            <input
                              type="text"
                              placeholder="Or paste custom image URL..."
                              value={sponsorForm.bannerUrl}
                              onChange={e => setSponsorForm({ ...sponsorForm, bannerUrl: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.78rem' }}
                            />
                          </div>

                          {/* Accent Color Picker */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Brand Accent Color</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {COLOR_THEMES.map(theme => (
                                <div
                                  key={theme.hex}
                                  onClick={() => setSponsorForm({ ...sponsorForm, accentColor: theme.hex })}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: theme.hex,
                                    cursor: 'pointer',
                                    border: sponsorForm.accentColor === theme.hex ? '3px solid #fff' : '2px solid transparent',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Font Style */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>Typography Style</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                              {FONT_STYLES.map(font => (
                                <button
                                  key={font.id}
                                  type="button"
                                  onClick={() => setSponsorForm({ ...sponsorForm, fontStyle: font.id })}
                                  style={{
                                    padding: '8px 6px',
                                    borderRadius: '10px',
                                    background: sponsorForm.fontStyle === font.id ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: sponsorForm.fontStyle === font.id ? '1px solid #2dd4bf' : '1px solid rgba(255,255,255,0.08)',
                                    color: 'var(--white)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {font.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CTA Button Text */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>CTA Button Label</label>
                            <input
                              type="text"
                              value={sponsorForm.ctaText}
                              onChange={e => setSponsorForm({ ...sponsorForm, ctaText: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.82rem' }}
                            />
                          </div>
                        </div>

                        {/* Right: Real-time Live Ad Card Preview */}
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={14} /> Live Feed Placement Preview
                          </div>
                          <div style={{
                            background: '#131d33',
                            borderRadius: '18px',
                            border: '1px solid ' + sponsorForm.accentColor + '40',
                            overflow: 'hidden',
                            boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)'
                          }}>
                            {/* Card Banner */}
                            <div style={{ height: '110px', width: '100%', position: 'relative' }}>
                              <img
                                src={sponsorForm.bannerUrl}
                                alt="Sponsor Banner"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div style={{ position: 'absolute', top: '10px', right: '10px', background: sponsorForm.accentColor, color: '#0f172a', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase' }}>
                                Verified Partner
                              </div>
                            </div>
                            <div style={{ padding: '16px' }}>
                              <div style={{ ...selectedFontConfig.style, fontSize: '1.05rem', color: 'var(--white)', marginBottom: '4px' }}>
                                {sponsorForm.businessName || 'Your Business Name'}
                              </div>
                              <p style={{ fontSize: '0.76rem', color: 'var(--slate-400)', margin: '0 0 10px' }}>
                                {sponsorForm.tagline}
                              </p>
                              {/* Member Perk Badge (or Brand Supporter Badge) */}
                              {sponsorForm.perk ? (
                                <div style={{
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  background: sponsorForm.accentColor + '18',
                                  border: '1px dashed ' + sponsorForm.accentColor,
                                  fontSize: '0.78rem',
                                  color: sponsorForm.accentColor,
                                  fontWeight: 700,
                                  marginBottom: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <Tag size={13} color="#2dd4bf" /> {sponsorForm.perk}
                                </div>
                              ) : (
                                <div style={{
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  fontSize: '0.76rem',
                                  color: 'var(--slate-400)',
                                  fontWeight: 600,
                                  marginBottom: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  <Store size={13} color="#2dd4bf" /> Official Community Business Sponsor
                                </div>
                              )}
                              <button
                                type="button"
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  borderRadius: '10px',
                                  background: sponsorForm.accentColor,
                                  color: '#0f172a',
                                  fontWeight: 800,
                                  fontSize: '0.82rem',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                {sponsorForm.ctaText}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Session Live Preview */
                      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-300)' }}>Cover Photo</label>
                            <button
                              type="button"
                              onClick={() => setUnsplashTarget('session')}
                              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ImageIcon size={14} /> Search Unsplash
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '8px' }}>
                            {SESSION_PRESET_IMAGES.map((img, i) => (
                              <img
                                key={i}
                                src={img.url}
                                alt={img.label}
                                onClick={() => setSessionForm({ ...sessionForm, sessionPhoto: img.url })}
                                style={{
                                  width: '100%',
                                  height: '42px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  border: sessionForm.sessionPhoto === img.url ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)'
                                }}
                              />
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Or paste custom photo URL..."
                            value={sessionForm.sessionPhoto}
                            onChange={e => setSessionForm({ ...sessionForm, sessionPhoto: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'var(--white)', fontSize: '0.78rem' }}
                          />
                        </div>

                        {/* Live Session Card Preview */}
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={14} /> Session Feed Card Preview
                          </div>
                          <div style={{
                            background: '#131d33',
                            borderRadius: '18px',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            overflow: 'hidden',
                            boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)'
                          }}>
                            <div style={{ height: '110px', width: '100%', position: 'relative' }}>
                              <img
                                src={sessionForm.sessionPhoto}
                                alt="Session Cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#38bdf8', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px' }}>
                                £{sessionForm.ticketPrice} / person
                              </div>
                            </div>
                            <div style={{ padding: '16px' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--white)', marginBottom: '4px' }}>
                                {sessionForm.title || 'Your Session Title'}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '10px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} color="#38bdf8" /> {sessionForm.duration}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Users size={12} color="#38bdf8" /> Min {sessionForm.minCapacity} • Max {sessionForm.maxCapacity}</span>
                              </div>
                              <p style={{ fontSize: '0.76rem', color: 'var(--slate-400)', margin: '0 0 12px', lineHeight: 1.4 }}>
                                {sessionForm.summary || 'Summary of what members will learn...'}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#2dd4bf' }}>
                                <Shield size={14} /> Protected by Post-Event Escrow
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: REVIEW & SUBMIT */}
                {currentStep === 4 && (
                  <div>
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--white)', margin: '0 0 6px' }}>
                        Review & Submit Proposal
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)', margin: 0 }}>
                        Review your terms and submit directly for leader approval.
                      </p>
                    </div>

                    {/* Summary Card */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.82rem' }}>
                        <div>
                          <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.74rem' }}>Target Community</span>
                          <strong style={{ color: 'var(--white)', fontSize: '0.95rem' }}>{targetCommunity?.name}</strong>
                          <span style={{ color: '#2dd4bf', display: 'block', fontSize: '0.74rem', marginTop: '2px' }}>
                            {targetCommunity?.location_name || 'Local Town'} • {targetCommunity?.member_count || '50+'} members
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--slate-400)', display: 'block', fontSize: '0.74rem' }}>Partnership Type</span>
                          <strong style={{ color: 'var(--white)', fontSize: '0.95rem' }}>
                            {partnerMode === 'sponsor' ? (sponsorForm.tier === 'headline' ? 'Town Bundle Headline Sponsor' : 'Club Directory Sponsor') : 'Guest Session / Masterclass'}
                          </strong>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '14px 0', paddingTop: '14px', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        {partnerMode === 'sponsor' ? (
                          <div>
                            <div style={{ color: 'var(--slate-300)', marginBottom: '4px' }}>
                              <strong style={{ color: 'var(--white)' }}>Business:</strong> {sponsorForm.businessName} ({sponsorForm.category})
                            </div>
                            {sponsorForm.perk ? (
                              <div style={{ color: '#2dd4bf' }}>
                                <strong>Member Perk:</strong> {sponsorForm.perk}
                              </div>
                            ) : (
                              <div style={{ color: 'var(--slate-400)' }}>
                                <strong>Sponsorship:</strong> Brand Supporter (No Member Perk)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ color: 'var(--slate-300)', marginBottom: '4px' }}>
                              <strong style={{ color: 'var(--white)' }}>Session:</strong> {sessionForm.title} ({sessionForm.duration})
                            </div>
                            <div style={{ color: 'var(--slate-400)' }}>
                              Capacity: Min {sessionForm.minCapacity} to Max {sessionForm.maxCapacity} participants • Ticket: £{sessionForm.ticketPrice}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Financial / Escrow Breakdown */}
                      <div style={{
                        background: 'rgba(45, 212, 191, 0.08)',
                        border: '1px solid rgba(45, 212, 191, 0.2)',
                        borderRadius: '12px',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--slate-300)', fontSize: '0.78rem' }}>
                            {partnerMode === 'sponsor' ? 'Monthly Investment:' : 'Post-Event Escrow Terms:'}
                          </span>
                          <span style={{ fontWeight: 800, color: '#2dd4bf', fontSize: '0.95rem' }}>
                            {partnerMode === 'sponsor' ? (sponsorForm.tier === 'headline' ? '£49/month' : '£15/month') : 'Stripe 24-48h Hold'}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
                          {partnerMode === 'sponsor' 
                            ? '80% goes directly to the club bank fund. Renews monthly, cancel anytime in one click.'
                            : 'Attendee ticket revenue is held securely in escrow and released 24 to 48 hours after the event takes place to protect both host and community.'}
                        </p>
                      </div>
                    </div>

                    {/* Trust & Safety Checklist */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      color: 'var(--slate-300)'
                    }}>
                      <Shield size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Vetting Guarantee:</strong> The community leader has full veto power. If accepted, your placement goes live immediately.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Footer (Back / Next / Submit) */}
          {!submittedType && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      padding: '10px 18px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    Cancel anytime
                  </span>
                )}
              </div>

              <div>
                {currentStep < JOURNEY_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      background: 'linear-gradient(135deg, #2dd4bf, #0284c7)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#0f172a',
                      padding: '10px 24px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    Next: {JOURNEY_STEPS[currentStep + 1].label} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'var(--white)',
                      padding: '10px 26px',
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal to Leader'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Unsplash Image Picker Modal */}
      {unsplashTarget && (
        <UnsplashImagePicker
          isOpen={Boolean(unsplashTarget)}
          onClose={() => setUnsplashTarget(null)}
          onSelect={(url) => {
            if (unsplashTarget === 'sponsor') {
              setSponsorForm(prev => ({ ...prev, bannerUrl: url }));
            } else if (unsplashTarget === 'session') {
              setSessionForm(prev => ({ ...prev, sessionPhoto: url }));
            }
            setUnsplashTarget(null);
            toast.success('Image selected', 'Applied Unsplash photo to your placement');
          }}
          defaultQuery={partnerMode === 'sponsor' ? (sponsorForm.category || 'cafe') : (sessionForm.discipline || 'outdoor')}
        />
      )}
    </>
  );
}
