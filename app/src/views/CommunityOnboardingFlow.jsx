"use client";
import React, { useState, useRef } from 'react';
import { ArrowRight, Camera, Check, Link as LinkIcon, Calendar, Image as ImageIcon, MessageCircle, ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import './CommunityOnboardingFlow.css';

const PREDEFINED_TAGS = [
  '🏃 Running', '🚶 Walking', '🧘 Wellness', '⛰️ Adventure',
  '🤝 Volunteering', '🎨 Creative', '💼 Business', '🎵 Music',
  '📚 Book Club', '🍳 Cooking', '🌱 Gardening', '👶 Parenting',
  '🎓 Learning', '🎮 Gaming', '⚽ Sports'
];

function StepBasics({ name, setName, description, setDescription }) {
  const nameError = name.length > 0 && name.trim().length < 3;
  const descError = description.length > 0 && description.trim().length < 10;

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">Start a Community</h2>
        <p className="step-subtitle">Let's build something great together.</p>
      </div>

      <div className="input-group">
        <label className="input-label">Community Name</label>
        <input
          type="text"
          placeholder="e.g. Tunbridge Wells Run Club"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          className={`text-input ${nameError ? 'has-error' : ''}`}
        />
        {nameError ? (
          <span className="helper-text error">Name must be at least 3 characters.</span>
        ) : (
          <span className="helper-text">This will be your community's public name.</span>
        )}
      </div>

      <div className="input-group">
        <label className="input-label">Description & Vibe</label>
        <textarea
          placeholder="What is this community about? Who is it for?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className={`textarea-input ${descError ? 'has-error' : ''}`}
        />
        {descError ? (
          <span className="helper-text error">Description must be at least 10 characters.</span>
        ) : (
          <span className="helper-text">Briefly explain what members can expect.</span>
        )}
      </div>
    </div>
  );
}

function StepAesthetics({ tags, toggleTag, coverImagePreview, handleImageSelect, fileInputRef }) {
  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">Stand Out</h2>
        <p className="step-subtitle">Add a visual identity to attract members.</p>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`image-upload-area ${coverImagePreview ? 'image-upload-filled' : 'image-upload-empty'}`}
        style={coverImagePreview ? { backgroundImage: `url(${coverImagePreview})` } : {}}
      >
        {!coverImagePreview && (
          <>
            <ImageIcon size={32} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '0.9rem' }}>Upload Cover Image</span>
          </>
        )}
        {coverImagePreview && (
          <div className="image-upload-overlay">
            <Camera size={28} color="white" />
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: 'none' }} />

      <div>
        <label className="input-label" style={{ textAlign: 'center', marginBottom: '12px' }}>Select up to 3 Categories</label>
        <div className="tags-container">
          {PREDEFINED_TAGS.map(tag => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`tag-btn ${selected ? 'selected' : 'unselected'}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepEvent({ eventTitle, setEventTitle, eventDate, setEventDate, eventTime, setEventTime, eventLocation, setEventLocation }) {
  const isPartiallyFilled = (eventTitle || eventDate || eventTime || eventLocation) && 
                            !(eventTitle && eventDate && eventTime && eventLocation);

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">First Meetup</h2>
        <p className="step-subtitle">Communities thrive on events. Add your first one! (Optional)</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group">
          <label className="input-label">Event Title</label>
          <input
            type="text"
            placeholder="e.g. Inaugural Coffee Meetup"
            value={eventTitle}
            onChange={e => setEventTitle(e.target.value)}
            className="text-input"
          />
        </div>
        
        <div className="event-time-row">
          <div className="event-time-col">
            <label className="input-label">Date</label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="text-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="event-time-col">
            <label className="input-label">Time</label>
            <input
              type="time"
              value={eventTime}
              onChange={e => setEventTime(e.target.value)}
              className="text-input"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Location</label>
          <input
            type="text"
            placeholder="e.g. The Pantiles Cafe"
            value={eventLocation}
            onChange={e => setEventLocation(e.target.value)}
            className="text-input"
          />
        </div>
        
        {isPartiallyFilled && (
          <span className="helper-text error">Please fill out all event fields, or clear them to skip.</span>
        )}
      </div>
    </div>
  );
}

function StepVerification({ instagram, setInstagram, whatsapp, setWhatsapp }) {
  const isValidIg = instagram.trim() === '' || /^[@a-zA-Z0-9._]+$/.test(instagram.trim()) || instagram.includes('instagram.com');
  const isValidWa = whatsapp.trim() === '' || whatsapp.includes('chat.whatsapp.com') || whatsapp.includes('wa.me');

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">Link Socials</h2>
        <p className="step-subtitle">Connect your platforms to help members find you.</p>
      </div>

      <div className="info-box">
        <Check size={24} color="var(--teal-400)" className="info-box-icon" />
        <div className="info-box-text">
          Adding your social accounts allows our admins to verify your community, giving you a blue checkmark.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group">
          <label className="input-label input-label-icon">
            <LinkIcon size={16} /> Instagram Handle
          </label>
          <input
            type="text"
            placeholder="@your.community"
            value={instagram}
            onChange={e => setInstagram(e.target.value)}
            className={`text-input ${!isValidIg ? 'has-error' : ''}`}
          />
          {!isValidIg && <span className="helper-text error">Please enter a valid Instagram handle or URL.</span>}
        </div>
        <div className="input-group">
          <label className="input-label input-label-icon">
            <MessageCircle size={16} /> WhatsApp Group Link (Optional)
          </label>
          <input
            type="url"
            placeholder="chat.whatsapp.com/..."
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            className={`text-input ${!isValidWa ? 'has-error' : ''}`}
          />
          {!isValidWa && <span className="helper-text error">Please enter a valid WhatsApp invite link.</span>}
        </div>
      </div>
    </div>
  );
}

export default function CommunityOnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  
  // Step 1: Basics
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 2: Aesthetics
  const [tags, setTags] = useState([]);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  
  // Step 3: First Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  
  // Step 4: Verification / Socials
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createCommunity, createEvent, uploadImage } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const toggleTag = (tag) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : prev.length < 3 ? [...prev, tag] : prev
    );
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      if (coverImageFile) {
        try {
          imageUrl = await uploadImage(coverImageFile, 'community_covers');
        } catch (err) {
          console.error("Cover image upload failed:", err);
          toast.error("Image Upload Failed", "We couldn't upload your cover image, but your community will still be created.");
        }
      }

      // Verified is now false by default
      const communityData = {
        name: name.trim(),
        description: description.trim(),
        tags: tags,
        image: imageUrl,
        verified: false,
        instagram_handle: instagram.trim(),
        whatsapp_group: whatsapp.trim(),
        activity_level: 'Active',
        cost: 'Free'
      };

      // Create Community
      const newCommunityId = await createCommunity(communityData);

      // Create First Event if provided
      if (eventTitle && eventDate && eventTime && eventLocation) {
        try {
          await createEvent(newCommunityId, {
            title: eventTitle,
            description: 'Our inaugural community event!',
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            image: imageUrl
          });
          toast.success('Community & Event Created!', 'You are ready to go.');
        } catch (eventErr) {
          console.error("Event creation failed:", eventErr);
          toast.success('Community Created!', 'However, we failed to create the first event. You can add it later from your dashboard.');
        }
      } else {
        toast.success('Community Created!', 'You are ready to go.');
      }

      onComplete();
    } catch (err) {
      console.error(err);
      toast.error('Could not create community', err.message || 'Please try again.');
    }
    
    setIsSubmitting(false);
  };

  const isPartiallyFilledEvent = (eventTitle || eventDate || eventTime || eventLocation) && 
                                 !(eventTitle && eventDate && eventTime && eventLocation);

  const isValidIg = instagram.trim() === '' || /^[@a-zA-Z0-9._]+$/.test(instagram.trim()) || instagram.includes('instagram.com');
  const isValidWa = whatsapp.trim() === '' || whatsapp.includes('chat.whatsapp.com') || whatsapp.includes('wa.me');

  const canProceed = step === 0 
    ? (name.trim().length >= 3 && description.trim().length >= 10) 
    : step === 1 
      ? (tags.length > 0) 
      : step === 2 
        ? !isPartiallyFilledEvent
        : (isValidIg && isValidWa);

  const steps = [
    <StepBasics key="basics" name={name} setName={setName} description={description} setDescription={setDescription} />,
    <StepAesthetics key="aesthetics" tags={tags} toggleTag={toggleTag} coverImagePreview={coverImagePreview} handleImageSelect={handleImageSelect} fileInputRef={fileInputRef} />,
    <StepEvent key="event" eventTitle={eventTitle} setEventTitle={setEventTitle} eventDate={eventDate} setEventDate={setEventDate} eventTime={eventTime} setEventTime={setEventTime} eventLocation={eventLocation} setEventLocation={setEventLocation} />,
    <StepVerification key="verify" instagram={instagram} setInstagram={setInstagram} whatsapp={whatsapp} setWhatsapp={setWhatsapp} />
  ];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress bar */}
        <div className="progress-header">
          <div className="progress-bar-container">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`progress-bar-segment ${i <= step ? 'active' : 'inactive'}`}
              />
            ))}
          </div>
          <div className="progress-info">
            <div className="step-indicator">
              Step {step + 1} of {steps.length}
            </div>
            <button onClick={onComplete} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content-area">
          {steps[step]}
        </div>

        {/* Bottom buttons */}
        <div className="footer-actions">
          <button
            onClick={() => {
              if (step < steps.length - 1) setStep(step + 1);
              else handleFinish();
            }}
            disabled={!canProceed || isSubmitting}
            className={`btn btn-primary interactive-press btn-continue ${canProceed && !isSubmitting ? '' : 'disabled'}`}
          >
            {isSubmitting ? 'Creating...' : step < steps.length - 1 ? (
              <>Continue <ArrowRight size={18} /></>
            ) : (
              <>Launch Community <ArrowRight size={18} /></>
            )}
          </button>

          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-back">
              Back
            </button>
          ) : (
            <button onClick={onComplete} className="btn-back">
              <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
