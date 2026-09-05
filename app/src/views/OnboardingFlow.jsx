import { useState, useRef } from 'react';
import { ArrowRight, Camera, Check, Users, Calendar, MessageCircle, Eye, Type, Moon, Sun, Monitor, Activity, Heart, X as XIcon, MapPin, Sparkles } from 'lucide-react';
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
  const { authUser, signOut } = useAuth();
  const { user, updateUser, uploadImage, communities, theme, setTheme, highContrast, setHighContrast, largeText, setLargeText, reduceMotion, setReduceMotion } = useAppContext();
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState(user?.gender || '');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // Swipe state for community matching
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [swipedLiked, setSwipedLiked] = useState([]);
  const [swipedPassed, setSwipedPassed] = useState([]);
  const [swipeLeaveDir, setSwipeLeaveDir] = useState(null);

  // Filter communities by selected interests for the swipe step
  const matchingCommunities = communities.filter(c => {
    if (!c.tags || c.tags.length === 0) return false;
    
    if (gender === 'Male') {
      const name = c.name?.toLowerCase() || '';
      const desc = c.description?.toLowerCase() || '';
      if (name.includes('mum') || name.includes('women') || desc.includes('women only') || desc.includes('for mums') || desc.includes('mothers')) {
        return false;
      }
    }

    return c.tags.some(tag => 
      interests.some(interest => interest.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(interest.toLowerCase()))
    );
  }).slice(0, 10);

  const currentSwipeCommunity = matchingCommunities[swipeIndex];

  const handleSwipePointerDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX || (e.touches && e.touches[0].clientX) || 0);
  };

  const handleSwipePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    setSwipeOffset(currentX - dragStartX);
  };

  const handleSwipePointerUp = () => {
    setIsDragging(false);
    if (swipeOffset > 80) {
      doSwipe('right');
    } else if (swipeOffset < -80) {
      doSwipe('left');
    } else {
      setSwipeOffset(0);
    }
  };

  const doSwipe = (direction) => {
    const c = currentSwipeCommunity;
    setSwipeLeaveDir(direction);
    setSwipeOffset(direction === 'right' ? 500 : -500);
    setTimeout(() => {
      if (direction === 'right' && c) {
        setSwipedLiked(prev => [...prev, c]);
      } else if (direction === 'left' && c) {
        setSwipedPassed(prev => [...prev, c]);
      }
      setSwipeIndex(prev => prev + 1);
      setSwipeOffset(0);
      setSwipeLeaveDir(null);
    }, 250);
  };

  // Build affinityProfile from swipe data
  const buildAffinityProfile = () => {
    const tagScores = {};
    swipedLiked.forEach(c => {
      (c.tags || []).forEach(tag => {
        const key = tag.toLowerCase();
        tagScores[key] = (tagScores[key] || 0) + 1;
      });
    });
    swipedPassed.forEach(c => {
      (c.tags || []).forEach(tag => {
        const key = tag.toLowerCase();
        tagScores[key] = (tagScores[key] || 0) - 0.5;
      });
    });
    return {
      tagScores,
      likedCommunityIds: swipedLiked.map(c => c.id),
      passedCommunityIds: swipedPassed.map(c => c.id)
    };
  };

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
          console.error("Avatar upload failed:", err);
          toast.error("Avatar Upload Failed", "Could not upload image, using default");
        }
      }

      const updates = {
        name: name.trim(),
        bio: bio.trim(),
        gender: gender,
        interests: interests,
        affinityProfile: buildAffinityProfile(),
        avatar: avatarUrl || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14b8a6&color=fff`,
        onboarded: true,
      };

      await updateUser(authUser.id, updates);

      toast.success('Welcome!', 'Your profile has been created');
      onComplete?.();
    } catch (err) {
      console.error('Failed to finish onboarding:', err);
      toast.error("Onboarding Failed", "Please try again later");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const steps = [
    // Step 0: Interests
    <div key="interests" className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero video strip */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', height: '120px', marginBottom: '8px', position: 'relative' }}>
        <video src={STEP_VIDEOS[1]} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.8))' }}></div>
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', fontSize: '0.8rem', color: 'var(--teal-300)', fontWeight: 600 }}>We'll match you to the right groups ✨</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: '0 0 8px 0' }}>How do you identify?</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>This helps us tailor your experience</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
          {['Female', 'Male', 'Non-binary', 'Prefer not to say'].map(g => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className="interactive-press"
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: gender === g ? '1px solid var(--teal-500)' : '1px solid rgba(255,255,255,0.1)',
                background: gender === g ? 'rgba(20,184,166,0.12)' : 'var(--slate-800)',
                color: gender === g ? 'var(--teal-300)' : 'var(--slate-400)',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {g}
            </button>
          ))}
        </div>

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

    // Step 1: Community Swipe Matching
    <div key="swipe" className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', margin: '0 0 8px 0' }}>Communities for you</h2>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', margin: 0 }}>Swipe right on groups that look like your vibe</p>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {currentSwipeCommunity ? (
          <>
            {/* Background card (next) */}
            {matchingCommunities[swipeIndex + 1] && (
              <div style={{ position: 'absolute', width: '90%', height: '300px', borderRadius: '20px', background: 'var(--slate-800)', border: '1px solid rgba(255,255,255,0.06)', transform: 'scale(0.95)', opacity: 0.5 }}></div>
            )}
            {/* Active card */}
            <div
              onMouseDown={handleSwipePointerDown}
              onMouseMove={handleSwipePointerMove}
              onMouseUp={handleSwipePointerUp}
              onTouchStart={handleSwipePointerDown}
              onTouchMove={handleSwipePointerMove}
              onTouchEnd={handleSwipePointerUp}
              style={{
                position: 'absolute', width: '90%', height: '300px',
                borderRadius: '20px', overflow: 'hidden',
                background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.03}deg)`,
                transition: isDragging ? 'none' : 'transform 0.25s ease, opacity 0.25s ease',
                cursor: 'grab', userSelect: 'none',
              }}
            >
              <div style={{ height: '55%', background: `url(${currentSwipeCommunity.image || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400'})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9))' }}></div>
                {/* Like/Nope indicators */}
                {swipeOffset > 40 && (
                  <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 20px', border: '3px solid #22c55e', borderRadius: '8px', color: '#22c55e', fontWeight: 800, fontSize: '1.4rem', transform: 'rotate(-15deg)' }}>LIKE</div>
                )}
                {swipeOffset < -40 && (
                  <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 20px', border: '3px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontWeight: 800, fontSize: '1.4rem', transform: 'rotate(15deg)' }}>NOPE</div>
                )}
                <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--white)' }}>{currentSwipeCommunity.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <MapPin size={12} /> {currentSwipeCommunity.location || 'Local community'}
                  </div>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ color: 'var(--slate-300)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{currentSwipeCommunity.description || 'A community near you'}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(currentSwipeCommunity.tags || []).slice(0, 4).map(tag => (
                    <span key={tag} style={{ padding: '3px 10px', borderRadius: '99px', background: 'rgba(20,184,166,0.1)', color: 'var(--teal-300)', fontSize: '0.7rem', fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Swipe buttons */}
            <div style={{ position: 'absolute', bottom: '-10px', display: 'flex', gap: '24px', justifyContent: 'center', width: '100%' }}>
              <button onClick={() => doSwipe('left')} className="interactive-press" style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}>
                <XIcon size={24} />
              </button>
              <button onClick={() => doSwipe('right')} className="interactive-press" style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#22c55e' }}>
                <Heart size={24} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={28} color="var(--teal-400)" />
            </div>
            <h3 style={{ color: 'var(--white)', margin: '0 0 8px 0', fontSize: '1.2rem' }}>All done!</h3>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: 0 }}>
              {swipedLiked.length > 0 ? `You liked ${swipedLiked.length} communities — we'll use this to personalise your feed.` : 'Tap Continue to set up your profile.'}
            </p>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
        {currentSwipeCommunity ? `${swipeIndex + 1} of ${matchingCommunities.length}` : ''}
        {swipedLiked.length > 0 && <span style={{ color: 'var(--teal-400)', marginLeft: '8px' }}>💚 {swipedLiked.length} liked</span>}
      </div>
    </div>,

    // Step 1: Name, Bio & Avatar
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
            borderRadius: '12px', color: 'var(--white)', fontSize: '1rem',
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
            borderRadius: '12px', color: 'var(--white)', fontSize: '0.95rem',
            minHeight: '80px', resize: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(20,184,166,0.4)'}
          onBlur={e => e.target.style.borderColor = 'var(--slate-700)'}
        />
      </div>
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
    <div key="welcome" className="page-wrapper" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      {/* Embedded explainer */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', width: '100%', aspectRatio: '16/9', background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <iframe
          src="/explainer.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="How more. works"
        />
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0, lineHeight: 1.15 }}>
        Welcome, {name || 'friend'}!
      </h2>
      <p style={{ color: 'var(--slate-400)', fontSize: '0.95rem', margin: 0, lineHeight: 1.6, maxWidth: '300px' }}>
        You're all set. We'll now show you communities that match your interests — join the ones you like and start connecting.
      </p>
    </div>,
  ];

  const canProceed = step === 0 ? (interests.length > 0 && gender !== '') : step === 1 ? true : step === 2 ? name.trim().length > 0 : true;

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--slate-950)',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Progress bar and header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <img src={`/images/logo.webp`} alt="more." style={{ height: '24px', opacity: 0.9, filter: 'brightness(0) invert(1)' }} />
          <button 
            onClick={handleSignOut}
            className="interactive-press"
            style={{ 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
              color: 'var(--white)', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' 
            }}
          >
            Sign Out
          </button>
        </div>
        <div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2, 3, 4].map(i => (
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
            Step {step + 1} of 5
          </div>
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
            if (step < 4) setStep(step + 1);
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
          {isSubmitting ? 'Setting up...' : step < 4 ? (
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
