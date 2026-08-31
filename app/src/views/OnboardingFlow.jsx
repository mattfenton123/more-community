import { useState, useRef } from 'react';
import { ArrowRight, Camera, Check, Users, Calendar, MessageCircle, Eye, Type, Moon, Sun, Monitor, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

const INTEREST_PILLS = [
  '🏃 Fitness', '🚶 Walking', '🧘 Wellness', '⛰️ Outdoors',
  '🤝 Volunteering', '🎨 Creative', '💼 Professional', '🎵 Music',
  '📚 Book Club', '🍳 Cooking', '🌱 Gardening', '👶 Parenting',
  '🎓 Learning', '🎮 Gaming'
];

// Background videos for each step
const STEP_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // TODO: Replace with your actual community video 1
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', // TODO: Replace with your actual community video 2
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', // TODO: Replace with your actual community video 3
];

export default function OnboardingFlow({ onComplete }) {
  const { authUser } = useAuth();
  const { user, updateUser, uploadImage, theme, setTheme, highContrast, setHighContrast, largeText, setLargeText, reduceMotion, setReduceMotion } = useAppContext();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef(null);

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
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error('Error', 'Could not save your profile. Try again.');
    }
    setIsSubmitting(false);
  };

  const steps = [
    // Step 0: Name, Bio & Avatar
    <div key="name" className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero video strip */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', height: '120px', marginBottom: '8px', position: 'relative' }}>
        <video src={STEP_VIDEOS[0]} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.8))' }}></div>
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '0.8rem', color: 'var(--teal-300)', fontWeight: 600 }}>Join your local community 🤝</div>
      </div>

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
            margin: '0 auto 16px', cursor: 'pointer', transition: 'border-color 0.2s',
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
        
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: '0 0 8px 0' }}>What should we call you?</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: 0 }}>This is how you'll appear in communities</p>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 500 }}>Display Name</label>
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
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(20,184,166,0.4)'}
          onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 500 }}>Short Bio <span style={{ color: 'var(--slate-500)' }}>(optional)</span></label>
        <textarea
          placeholder="Tell us a bit about yourself..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          style={{
            width: '100%', padding: '14px 16px',
            background: 'var(--slate-800)', border: '1px solid var(--slate-700)',
            borderRadius: '12px', color: 'white', fontSize: '0.95rem',
            minHeight: '80px', resize: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(20,184,166,0.4)'}
          onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
        />
      </div>
    </div>,

    // Step 1: Interests
    <div key="interests" className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero video strip */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', height: '120px', marginBottom: '8px', position: 'relative' }}>
        <video src={STEP_VIDEOS[1]} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.8))' }}></div>
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '0.8rem', color: 'var(--teal-300)', fontWeight: 600 }}>We'll match you to the right groups ✨</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: '0 0 8px 0' }}>What are you into?</h2>
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

      <p style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
        {interests.length === 0 ? 'Select at least one' : `${interests.length} selected`}
      </p>
    </div>,

    // Step 2: App Experience
    <div key="experience" className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: '0 0 8px 0' }}>App Experience</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: 0 }}>Customize how more. looks and feels for you.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 500 }}>Theme</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setTheme('light')} className="interactive-press" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: theme === 'light' ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)', background: theme === 'light' ? 'rgba(20,184,166,0.12)' : 'var(--slate-800)', color: theme === 'light' ? 'var(--teal-300)' : 'var(--slate-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Sun size={20} /> <span style={{ fontSize: '0.8rem' }}>Light</span>
            </button>
            <button onClick={() => setTheme('dark')} className="interactive-press" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: theme === 'dark' ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)', background: theme === 'dark' ? 'rgba(20,184,166,0.12)' : 'var(--slate-800)', color: theme === 'dark' ? 'var(--teal-300)' : 'var(--slate-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Moon size={20} /> <span style={{ fontSize: '0.8rem' }}>Dark</span>
            </button>
            <button onClick={() => setTheme('system')} className="interactive-press" style={{ flex: 1, padding: '12px', borderRadius: '12px', border: theme === 'system' ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)', background: theme === 'system' ? 'rgba(20,184,166,0.12)' : 'var(--slate-800)', color: theme === 'system' ? 'var(--teal-300)' : 'var(--slate-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Monitor size={20} /> <span style={{ fontSize: '0.8rem' }}>Auto</span>
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.85rem', fontWeight: 500 }}>Accessibility</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div onClick={() => setHighContrast(!highContrast)} className="interactive-press" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--slate-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Eye size={18} color="var(--teal-400)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--slate-200)' }}>High Contrast</span>
              </div>
              <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: highContrast ? 'var(--teal-500)' : 'var(--slate-700)', position: 'relative', transition: '0.2s' }}>
                <div style={{ position: 'absolute', top: '2px', left: highContrast ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }}></div>
              </div>
            </div>
            
            <div onClick={() => setLargeText(!largeText)} className="interactive-press" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--slate-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Type size={18} color="var(--teal-400)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--slate-200)' }}>Large Text</span>
              </div>
              <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: largeText ? 'var(--teal-500)' : 'var(--slate-700)', position: 'relative', transition: '0.2s' }}>
                <div style={{ position: 'absolute', top: '2px', left: largeText ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }}></div>
              </div>
            </div>
            
            <div onClick={() => setReduceMotion(!reduceMotion)} className="interactive-press" style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--slate-800)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity size={18} color="var(--teal-400)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--slate-200)' }}>Reduce Motion</span>
              </div>
              <div style={{ width: '40px', height: '22px', borderRadius: '11px', background: reduceMotion ? 'var(--teal-500)' : 'var(--slate-700)', position: 'relative', transition: '0.2s' }}>
                <div style={{ position: 'absolute', top: '2px', left: reduceMotion ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Step 3: Welcome
    <div key="welcome" className="page-wrapper" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      {/* Hero video strip */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', height: '160px', width: '100%', position: 'relative' }}>
        <video src={STEP_VIDEOS[2]} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.8))' }}></div>
      </div>

      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem',
      }}>
        🎉
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: 0 }}>
        Welcome, {name || 'friend'}!
      </h2>
      <p style={{ color: 'var(--slate-400)', fontSize: '1rem', margin: 0, lineHeight: 1.5, maxWidth: '300px' }}>
        You're all set. Let's discover communities in Tunbridge Wells that match your vibe.
      </p>

      {/* Preview of what's coming */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
        <div style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
          <Users size={24} color="var(--teal-400)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', fontWeight: 500 }}>Discover Groups</div>
        </div>
        <div style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
          <Calendar size={24} color="var(--teal-400)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', fontWeight: 500 }}>Find Events</div>
        </div>
        <div style={{ flex: 1, padding: '8px', textAlign: 'center' }}>
          <MessageCircle size={24} color="var(--teal-400)" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', fontWeight: 500 }}>Chat Locally</div>
        </div>
      </div>
    </div>,
  ];

  const canProceed = step === 0 ? name.trim().length > 0 : step === 1 ? interests.length > 0 : true;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--slate-950)',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Progress bar */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '99px',
                background: i <= step ? 'var(--teal-500)' : 'rgba(255,255,255,0.08)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '12px' }}>
          Step {step + 1} of 4
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {steps[step]}
      </div>

      {/* Bottom button */}
      <div style={{ padding: '16px 24px 32px' }}>
        <button
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else handleFinish();
          }}
          disabled={!canProceed || isSubmitting}
          className="btn btn-primary interactive-press"
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            fontSize: '1.05rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: canProceed && !isSubmitting ? 1 : 0.4,
          }}
        >
          {isSubmitting ? 'Setting up...' : step < 3 ? (
            <>Continue <ArrowRight size={18} /></>
          ) : (
            <>Let's Go! <ArrowRight size={18} /></>
          )}
        </button>

        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'var(--slate-400)',
              padding: '12px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginTop: '4px',
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
