"use client";
import { useState, useRef } from 'react';
import { ArrowRight, Camera, Check, Users, Calendar, MessageCircle, MapPin, Sparkles, Star, Compass, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

const INTEREST_PILLS = [
  '🏃 Running', '🚶 Walking', '🧘 Wellness', '⛰️ Adventure',
  '🤝 Volunteering', '🎨 Creative', '💼 Business', '🎵 Music',
  '📚 Book Club', '🍳 Cooking', '🌱 Gardening', '👶 Parenting',
  '🎓 Learning', '🎮 Gaming', '🏋️ Fitness', '⚽ Sports'
];

const INTRO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    emoji: '🤝',
    title: 'Real connections,\nnot just likes',
    subtitle: 'more is the app for people who want to meet in person. Find your people locally and do amazing things together.',
    accent: 'var(--teal-500)',
  },
  {
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    emoji: '📍',
    title: 'Discover what\'s\nhappening nearby',
    subtitle: 'Walking groups, book clubs, fitness classes, creative meetups — all happening in your local area right now.',
    accent: '#3b82f6',
  },
  {
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80',
    emoji: '🚀',
    title: 'Start something\namazing',
    subtitle: 'Lead your own community for free. Create events, chat with members, and build something meaningful.',
    accent: '#8b5cf6',
  },
];

const FEATURE_TIPS = [
  { icon: Compass, title: 'Discover', desc: 'Browse local communities and find your tribe', color: 'var(--teal-500)' },
  { icon: Calendar, title: 'Events', desc: 'Join meetups, walks, and activities near you', color: '#3b82f6' },
  { icon: MessageCircle, title: 'Chat', desc: 'Message community members in real-time', color: '#8b5cf6' },
  { icon: MapPin, title: 'Local Map', desc: 'See everything happening around you on a map', color: '#f59e0b' },
  { icon: Star, title: 'Lead', desc: 'Create your own community — completely free', color: '#ec4899' },
];

export default function OnboardingFlow({ onComplete }) {
  const { authUser } = useAuth();
  const { user, updateUser, uploadImage } = useAppContext();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wantsToLead, setWantsToLead] = useState(null);
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const TOTAL_STEPS = 7; // 3 intro + intent + profile + interests + ready

  const toggleInterest = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFinish = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      let avatarUrl;
      if (avatarFile) {
        try {
          avatarUrl = await uploadImage(avatarFile, 'avatars');
        } catch (err) {
          console.error('Avatar upload failed:', err);
        }
      }

      const updates = {
        name: name.trim(),
        bio: bio.trim(),
        interests: interests,
        onboarded: true,
      };
      if (avatarUrl) updates.avatar = avatarUrl;

      await updateUser(authUser.id, updates);

      toast.success('Welcome!', 'Your profile has been created');
      
      if (wantsToLead === true) {
        window.location.href = '/dashboard';
      } else if (wantsToLead === 'cohost') {
        window.location.href = '/notifications';
      } else {
        onComplete();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error', 'Could not save your profile. Try again.');
    }
    setIsSubmitting(false);
  };

  // Intro slides (steps 0-2)
  if (step < 3) {
    const slide = INTRO_SLIDES[step];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--slate-950)', display: 'flex', flexDirection: 'column', maxWidth: '480px', margin: '0 auto' }}>
        {/* Hero Image */}
        <div style={{ height: '55vh', position: 'relative', overflow: 'hidden' }}>
          <img src={slide.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(2,6,23,0.6) 60%, var(--slate-950) 100%)' }} />
          
          {/* Skip button */}
          <button onClick={() => setStep(3)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
            Skip
          </button>

          {/* Slide dots */}
          <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? '24px' : '8px', height: '8px', borderRadius: '99px', background: i === step ? slide.accent : 'rgba(255,255,255,0.3)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '2.4rem', marginBottom: '16px' }}>{slide.emoji}</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', lineHeight: 1.15, margin: '0 0 16px 0', color: 'white', whiteSpace: 'pre-line' }}>
              {slide.title}
            </h1>
            <p style={{ color: 'var(--slate-400)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              {slide.subtitle}
            </p>
          </div>

          <div style={{ paddingBottom: '16px' }}>
            <button
              onClick={() => setStep(step + 1)}
              className="btn btn-primary interactive-press"
              style={{ width: '100%', padding: '16px', borderRadius: '14px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: slide.accent }}
            >
              {step < 2 ? <>Next <ArrowRight size={18} /></> : <>Get Started <ArrowRight size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3 (profileStep 0): Intent (Why are you here?)
  // Step 4 (profileStep 1): Name, Bio & Avatar
  // Step 5 (profileStep 2): Interests
  // Step 6 (profileStep 3): Ready + Start Community prompt
  const profileStep = step - 3; // 0, 1, 2, or 3

  const canProceed = profileStep === 0 ? wantsToLead !== null : profileStep === 1 ? name.trim().length > 0 : profileStep === 2 ? interests.length > 0 : true;

  const profileSteps = [
    // Step 3 (profileStep 0): What brings you here?
    <div key="intent" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: '0 0 8px 0' }}>What brings you to more?</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.95rem', margin: 0 }}>We'll tailor your experience based on what you're looking for.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => setWantsToLead(false)}
          className="interactive-press"
          style={{
            padding: '16px', borderRadius: '16px', border: wantsToLead === false ? '2px solid var(--teal-500)' : '2px solid rgba(255,255,255,0.08)',
            background: wantsToLead === false ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Compass size={24} color="var(--teal-400)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', fontSize: '1.05rem', marginBottom: '4px' }}>I want to join communities</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Find local events and meet new people</div>
          </div>
        </button>

        <button
          onClick={() => setWantsToLead(true)}
          className="interactive-press"
          style={{
            padding: '16px', borderRadius: '16px', border: wantsToLead === true ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.08)',
            background: wantsToLead === true ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={24} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', fontSize: '1.05rem', marginBottom: '4px' }}>I want to start a community</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Create a group, run events, and lead</div>
          </div>
        </button>

        <button
          onClick={() => setWantsToLead('cohost')}
          className="interactive-press"
          style={{
            padding: '16px', borderRadius: '16px', border: wantsToLead === 'cohost' ? '2px solid #ec4899' : '2px solid rgba(255,255,255,0.08)',
            background: wantsToLead === 'cohost' ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="#f472b6" />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'white', fontSize: '1.05rem', marginBottom: '4px' }}>I was invited as a Co-host</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>Join a friend's community to help run it</div>
          </div>
        </button>
      </div>
    </div>,

    // Step 4 (profileStep 1): Name, Bio & Avatar
    <div key="name" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        {/* Avatar upload */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="interactive-press"
          style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: avatarPreview ? `url(${avatarPreview})` : 'rgba(255,255,255,0.04)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            border: avatarPreview ? '3px solid var(--teal-500)' : '2px dashed rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', cursor: 'pointer', transition: 'border-color 0.2s',
            color: 'var(--slate-400)', position: 'relative', overflow: 'hidden',
          }}
        >
          {!avatarPreview && <Camera size={32} />}
          {avatarPreview && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0}
            >
              <Camera size={24} color="white" />
            </div>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} accept="image/*" style={{ display: 'none' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginBottom: '16px' }}>Tap to add a photo</div>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: '0 0 6px 0' }}>What should we call you?</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: '0 0 8px 0' }}>This is how you'll appear in communities</p>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 500 }}>Display Name</label>
        <input
          type="text"
          placeholder="e.g. Sarah Chen"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--slate-800)', border: '1px solid var(--slate-700)',
            borderRadius: '12px', color: 'white', fontSize: '1rem',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '6px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 500 }}>Short Bio <span style={{ color: 'var(--slate-500)' }}>(optional)</span></label>
        <textarea
          placeholder="Tell us a bit about yourself..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--slate-800)', border: '1px solid var(--slate-700)',
            borderRadius: '12px', color: 'white', fontSize: '0.95rem',
            minHeight: '80px', resize: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>,

    // Step 4 (profileStep 1): Interests
    <div key="interests" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', margin: '0 0 6px 0' }}>What are you into?</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: 0 }}>Pick a few interests to personalise your feed</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        {INTEREST_PILLS.map(interest => {
          const selected = interests.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className="interactive-press"
              style={{
                padding: '10px 18px',
                borderRadius: '999px',
                border: selected ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)',
                background: selected ? 'rgba(20,184,166,0.12)' : 'transparent',
                color: selected ? 'var(--teal-300)' : 'var(--slate-300)',
                fontWeight: selected ? 600 : 400,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {interest}
              {selected && <Check size={14} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />}
            </button>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem', margin: 0 }}>
        {interests.length === 0 ? 'Select at least one' : `${interests.length} selected`}
      </p>
    </div>,

    // Step 6 (profileStep 3): You're Ready
    <div key="ready" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
        🎉
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0 }}>
        You're in, {name || 'friend'}!
      </h2>
      <p style={{ color: 'var(--slate-400)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5, maxWidth: '320px' }}>
        Here's a quick look at what you can do
      </p>

      {/* Feature tips */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
        {FEATURE_TIPS.map((tip, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${tip.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <tip.icon size={20} color={tip.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>{tip.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>{tip.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tailored final message based on intent */}
      {wantsToLead === true && (
        <div style={{ width: '100%', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px', padding: '16px', marginTop: '4px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '1.05rem', fontWeight: 700 }}>Ready to lead?</h3>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            We'll take you to the dashboard where you can set up your new community.
          </p>
        </div>
      )}
      
      {wantsToLead === 'cohost' && (
        <div style={{ width: '100%', background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(244,114,182,0.1))', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '16px', padding: '16px', marginTop: '4px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '1.05rem', fontWeight: 700 }}>Check your invites</h3>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            Head to the notifications or alerts tab to accept your co-host invitation.
          </p>
        </div>
      )}
      
      {wantsToLead === false && (
        <div style={{ width: '100%', background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(45,212,191,0.1))', border: '1px solid rgba(20,184,166,0.2)', borderRadius: '16px', padding: '16px', marginTop: '4px' }}>
          <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '1.05rem', fontWeight: 700 }}>Time to explore</h3>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            We'll show you local communities based on your interests. Dive in and say hi!
          </p>
        </div>
      )}
    </div>,
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--slate-950)', maxWidth: '480px', margin: '0 auto' }}>
      {/* Progress bar */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '99px', background: i <= step ? 'var(--teal-500)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
          ))}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '12px' }}>
          Step {step + 1} of {TOTAL_STEPS}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: profileStep === 2 ? 'flex-start' : 'center', overflowY: 'auto' }}>
        {profileSteps[profileStep]}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '16px 24px 32px' }}>
        <button
          onClick={() => {
            if (step < TOTAL_STEPS - 1) setStep(step + 1);
            else handleFinish();
          }}
          disabled={!canProceed || isSubmitting}
          className="btn btn-primary interactive-press"
          style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            fontSize: '1.05rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
            opacity: canProceed && !isSubmitting ? 1 : 0.4,
          }}
        >
          {isSubmitting ? 'Setting up...' : step < TOTAL_STEPS - 1 ? (
            <>Continue <ArrowRight size={18} /></>
          ) : wantsToLead ? (
            <>Start My Community <ArrowRight size={18} /></>
          ) : (
            <>Explore Communities <ArrowRight size={18} /></>
          )}
        </button>

        {step > 3 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              width: '100%', background: 'none', border: 'none',
              color: 'var(--slate-400)', padding: '12px',
              cursor: 'pointer', fontSize: '0.9rem', marginTop: '4px',
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
