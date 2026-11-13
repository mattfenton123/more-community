"use client";
import { supabase } from '../lib/supabaseClient';
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Camera, Check, Link as LinkIcon, Calendar, Image as ImageIcon, MessageCircle, ChevronLeft, Plus, X, Search, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { COMMUNITY_TAG_CATEGORIES, ALL_COMMUNITY_TAGS } from '../lib/constants';
import './CommunityOnboardingFlow.css';

import dynamic from 'next/dynamic';
import { cleanLocationName, parseLocationCoords, DEFAULT_TW_CENTER, geocodeLocation } from '../lib/location';

const CommunityRegionPicker = dynamic(() => import('../components/CommunityRegionPicker'), { ssr: false });
const LocationPicker = dynamic(() => import('../components/LocationPicker'), { ssr: false });

const SEGMENT_ICONS = {
  'Sports & Fitness': '⚽',
  'Social & Lifestyle': '☕',
  'Arts & Creative': '🎨',
  'Outdoors & Nature': '🌲',
  'Tech, Games & Learning': '💻'
};

function StepBasics({ name, setName, description, setDescription, parentCommunity }) {
  const nameError = name.length > 0 && name.trim().length < 3;
  const descError = description.length > 0 && description.trim().length < 10;

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">{parentCommunity ? `Launch a Chapter of ${parentCommunity.name}` : 'Start a Community'}</h2>
        <p className="step-subtitle">{parentCommunity ? 'Expand an established community into your local town or village.' : "Let's build something great together."}</p>
      </div>

      {parentCommunity && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1.5px solid rgba(45, 212, 191, 0.35)',
          borderRadius: '16px',
          padding: '16px 18px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={parentCommunity.image || parentCommunity.cover_image || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'}
              alt={parentCommunity.name}
              style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid var(--teal-400)' }}
            />
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--teal-300)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Official Chapter Application
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--white)' }}>
                Affiliated Chapter of {parentCommunity.name}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--slate-300)', lineHeight: 1.5 }}>
            You are applying to launch an official local chapter. As a chapter leader, you run your own local meetups while upholding the proven ethos and verified route standards of the founding community.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal-300)', marginBottom: '3px' }}>
                ⚖️ 1. Approval Gate
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
                Your application goes directly to the Founding Leader of {parentCommunity.name}. Your chapter appears across the public network once approved.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal-300)', marginBottom: '3px' }}>
                💰 2. Payment & Revenue Split
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
                <strong>You keep 90%</strong> of local ticket revenue via Stripe Faster Payments. 5% supports the founding network, and 5% platform fee covers processing.
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal-300)', marginBottom: '3px' }}>
                📍 3. Local Autonomy
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
                Pick your town, set your own meetup dates, and grow your local member base with full organizer authority.
              </div>
            </div>
          </div>
        </div>
      )}

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

function StepDetails({ targetAudience, setTargetAudience, cost, setCost, activityLevel, setActivityLevel, locationName, setLocationName, regionCoords, setRegionCoords, regionRadius, setRegionRadius, allowChapters, setAllowChapters, allowCarpool, setAllowCarpool }) {
  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">The Details</h2>
        <p className="step-subtitle">Help people decide if this community is right for them.</p>
      </div>

      <div className="input-group">
        <label className="input-label">Who is it for?</label>
        <input
          type="text"
          placeholder="e.g. All ages & abilities welcome."
          value={targetAudience}
          onChange={e => setTargetAudience(e.target.value)}
          className="text-input"
        />
      </div>

      <div className="input-group">
        <label className="input-label">Cost</label>
        <input
          type="text"
          placeholder="e.g. Free to join, pay for coffee"
          value={cost}
          onChange={e => setCost(e.target.value)}
          className="text-input"
        />
      </div>

      <div className="input-group">
        <label className="input-label">How Often?</label>
        <select
          value={activityLevel}
          onChange={e => setActivityLevel(e.target.value)}
          className="text-input"
          style={{ appearance: 'none', backgroundColor: 'var(--slate-800)' }}
        >
          <option value="Very Active">Very Active (Weekly)</option>
          <option value="Active">Active (Fortnightly)</option>
          <option value="Casual">Casual (Monthly or less)</option>
          <option value="Flexible">Flexible / Pop-up</option>
        </select>
      </div>

      <div className="input-group">
        <label className="input-label">Community Hub & Regional Area</label>
        <CommunityRegionPicker
          locationName={locationName}
          setLocationName={setLocationName}
          coords={regionCoords}
          onCoordsChange={setRegionCoords}
          radius={regionRadius}
          onRadiusChange={setRegionRadius}
        />
      </div>

      {/* Multi-Town Chapter Network & Carpool Toggles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>
              Multi-Town Chapter Network
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
              Allow leaders in other villages or towns to apply to launch official chapters of your community
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAllowChapters(!allowChapters)}
            style={{
              width: '46px', height: '26px', borderRadius: '99px', border: 'none',
              background: allowChapters ? 'var(--teal-500)' : 'rgba(255,255,255,0.12)',
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px',
              left: allowChapters ? '22px' : '2px', transition: 'left 0.2s'
            }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--white)', marginBottom: '2px' }}>
              Community Carpool & Lift Sharing
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.4 }}>
              Enable the Share a Lift section on your event pages so attendees can coordinate rides
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAllowCarpool(!allowCarpool)}
            style={{
              width: '46px', height: '26px', borderRadius: '99px', border: 'none',
              background: allowCarpool ? 'var(--teal-500)' : 'rgba(255,255,255,0.12)',
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px',
              left: allowCarpool ? '22px' : '2px', transition: 'left 0.2s'
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StepTags({ tags, toggleTag, addCustomTag, removeTag }) {
  const [activeSegment, setActiveSegment] = useState('Sports & Fitness');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  const segments = Object.keys(COMMUNITY_TAG_CATEGORIES);

  const handleAddCustom = (e) => {
    if (e) e.preventDefault();
    if (customTagInput.trim()) {
      addCustomTag(customTagInput);
      setCustomTagInput('');
    }
  };

  const getSelectedCountForCategory = (cat) => {
    const catTags = COMMUNITY_TAG_CATEGORIES[cat] || [];
    return tags.filter(t => catTags.includes(t)).length;
  };

  const filteredTags = searchQuery.trim()
    ? ALL_COMMUNITY_TAGS.filter(t => t.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : COMMUNITY_TAG_CATEGORIES[activeSegment] || [];

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">Choose Your Focus</h2>
        <p className="step-subtitle">Segment your community's tags so local members find you easily.</p>
      </div>

      {/* Selected Tags Summary Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Selected Tags ({tags.length})
          </span>
          {tags.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Tap ✕ to remove</span>
          )}
        </div>
        {tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 12px', background: 'rgba(20,184,166,0.06)', borderRadius: '14px', border: '1px solid rgba(20,184,166,0.2)' }}>
            {tags.map((tag, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: 'rgba(20,184,166,0.18)', color: 'var(--teal-300)', fontSize: '0.8rem', fontWeight: 600 }}>
                {idx === 0 && <span style={{ fontSize: '0.65rem', background: 'var(--teal-500)', color: 'white', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>Primary</span>}
                {tag}
                <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--teal-400)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--slate-400)', fontSize: '0.82rem', textAlign: 'center' }}>
            Select 1 or more tags below. Your first tag sets your group's category.
          </div>
        )}
      </div>

      {/* Quick Search */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
        <input
          type="text"
          placeholder="Search 60+ tags (e.g. running, coffee, chess)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="text-input"
          style={{ padding: '10px 12px 10px 36px', fontSize: '0.85rem', borderRadius: '10px' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Segments (Shown when not actively searching) */}
      {!searchQuery.trim() && (
        <div style={{ marginBottom: '16px' }}>
          <label className="input-label" style={{ marginBottom: '8px', fontWeight: 600 }}>Category Segments</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {segments.map(cat => {
              const count = getSelectedCountForCategory(cat);
              const isActive = activeSegment === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveSegment(cat)}
                  className={`interactive-press segment-pill-btn ${isActive ? 'active' : ''}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: isActive ? '1px solid var(--teal-500)' : undefined,
                    background: isActive ? 'rgba(20,184,166,0.15)' : undefined,
                    color: isActive ? 'var(--teal-200)' : undefined,
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gridColumn: cat === segments[segments.length - 1] && segments.length % 2 !== 0 ? 'span 2' : 'span 1'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span>{SEGMENT_ICONS[cat] || '🏷️'}</span>
                    <span>{cat}</span>
                  </span>
                  {count > 0 && (
                    <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '99px', background: 'var(--teal-500)', color: 'white', fontWeight: 700, marginLeft: '6px' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Segment Tags / Search Results */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontWeight: 600 }}>
            {searchQuery.trim() ? `Search Results (${filteredTags.length})` : `${activeSegment} (${filteredTags.length} tags)`}
          </span>
        </div>

        {filteredTags.length > 0 ? (
          <div className="tags-container" style={{ justifyContent: 'flex-start', gap: '8px' }}>
            {filteredTags.map(tag => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`tag-btn ${selected ? 'selected' : 'unselected'}`}
                >
                  {selected && <Check size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />}
                  {tag}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
            <p style={{ color: 'var(--slate-400)', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
              No standard tag matched "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => { addCustomTag(searchQuery); setSearchQuery(''); }}
              className="btn btn-primary interactive-press"
              style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px' }}
            >
              <Plus size={14} style={{ marginRight: '4px' }} /> Add "{searchQuery}" as Custom Tag
            </button>
          </div>
        )}
      </div>

      {/* Custom Tag Input */}
      <div>
        <label className="input-label" style={{ fontSize: '0.8rem' }}>Don't see your interest? Add a custom tag:</label>
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="e.g. 🏸 Badminton or 🥏 Ultimate Frisbee" 
            value={customTagInput} 
            onChange={e => setCustomTagInput(e.target.value)} 
            className="text-input" 
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          />
          <button 
            type="submit" 
            disabled={!customTagInput.trim()} 
            className="btn btn-outline interactive-press" 
            style={{ padding: '0 16px', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, opacity: customTagInput.trim() ? 1 : 0.4 }}
          >
            <Plus size={16} /> Add
          </button>
        </form>
      </div>
    </div>
  );
}

function StepCoverPhoto({ coverImagePreview, handleImageSelect, fileInputRef }) {
  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">Cover Image</h2>
        <p className="step-subtitle">Upload a photo to give your group an inviting visual identity.</p>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`image-upload-area ${coverImagePreview ? 'image-upload-filled' : 'image-upload-empty'}`}
        style={{
          width: '100%',
          height: '210px',
          borderRadius: '16px',
          backgroundImage: coverImagePreview ? `url(${coverImagePreview})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        {!coverImagePreview ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--slate-400)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={28} color="var(--teal-400)" />
            </div>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--white)' }}>Upload Cover Photo</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>Tap to browse files (JPEG, PNG, HEIC)</span>
          </div>
        ) : (
          <div className="image-upload-overlay" style={{ opacity: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>Tap to change photo</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={18} color="white" />
            </div>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="btn btn-outline interactive-press"
        style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Camera size={16} /> {coverImagePreview ? 'Change Photo' : 'Select Photo'}
      </button>

      <div className="onboarding-tip-box" style={{ marginTop: '20px', padding: '14px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.1rem' }}>💡</span>
        <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--slate-200)', display: 'block', marginBottom: '2px' }}>Pro Tip:</strong>
          Real photos of community gatherings or outdoor spots attract 3x more members. You can always update this later.
        </div>
      </div>
    </div>
  );
}

function StepEvent({ eventTitle, setEventTitle, eventDate, setEventDate, eventTime, setEventTime, eventLocation, setEventLocation }) {
  const [startOnlyTime, setStartOnlyTime] = useState(() => (eventTime || '').match(/^(\d{1,2}:\d{2})/)?.[1] || '');
  const [durationMode, setDurationMode] = useState('none'); // 'none' | 'approx' | 'exact'
  const [approxDuration, setApproxDuration] = useState('~2 hrs');
  const [endTime, setEndTime] = useState('12:00');

  useEffect(() => {
    if (!startOnlyTime) {
      setEventTime('');
      return;
    }
    if (durationMode === 'approx' && approxDuration.trim()) {
      setEventTime(`${startOnlyTime} (${approxDuration.trim()})`);
    } else if (durationMode === 'exact' && endTime) {
      setEventTime(`${startOnlyTime} - ${endTime}`);
    } else {
      setEventTime(startOnlyTime);
    }
  }, [startOnlyTime, durationMode, approxDuration, endTime]);

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
            />
          </div>
          <div className="event-time-col">
            <label className="input-label">Start Time</label>
            <input
              type="time"
              value={startOnlyTime}
              onChange={e => setStartOnlyTime(e.target.value)}
              className="text-input"
            />
          </div>
        </div>

        {startOnlyTime && (
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--slate-200)' }}>
                Duration / Finish Time <span style={{ color: 'var(--slate-400)', fontWeight: 400, fontSize: '0.76rem' }}>(Optional)</span>
              </span>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '8px' }}>
                {[
                  { id: 'none', label: 'Start Only' },
                  { id: 'approx', label: 'Approx Duration' },
                  { id: 'exact', label: 'Exact End Time' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDurationMode(opt.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: durationMode === opt.id ? 'var(--teal-500)' : 'transparent',
                      color: durationMode === opt.id ? '#fff' : 'var(--slate-400)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {durationMode === 'approx' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['~45 mins', '~1 hr', '~1.5 hrs', '~2 hrs', '~2.5 hrs', '~3 hrs', 'Half day'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setApproxDuration(preset)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: approxDuration === preset ? 700 : 500,
                      border: approxDuration === preset ? '1px solid var(--teal-400)' : '1px solid rgba(255,255,255,0.1)',
                      background: approxDuration === preset ? 'rgba(20,184,166,0.18)' : 'rgba(255,255,255,0.03)',
                      color: approxDuration === preset ? 'var(--teal-300)' : 'var(--slate-300)',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            {durationMode === 'exact' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>Finish Time:</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="text-input"
                  style={{ width: '140px', padding: '8px 12px' }}
                />
              </div>
            )}
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Meeting Point / Pinpoint Location</label>
          <LocationPicker
            locationName={eventLocation}
            setLocationName={setEventLocation}
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

      <div style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        marginBottom: '1.25rem',
        background: '#FAF8F5',
        boxShadow: '0 8px 28px rgba(0,0,0,0.22)'
      }}>
        <iframe
          src="/explainer-leader.html"
          title="How more. works for Leaders"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-300)', fontSize: '0.9rem', fontWeight: 600 }}>
            <LinkIcon size={16} /> Instagram Handle <span style={{ color: 'var(--slate-500)', fontWeight: 400 }}>(Optional)</span>
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


function StepPlan({ selectedTier, setSelectedTier, billingInterval, setBillingInterval }) {
  return (
    <div className="step-wrapper">
      <div className="step-header">
        <h2 className="step-title">Choose Your Leader Plan</h2>
        <p className="step-subtitle">Start free or unlock 2% reduced ticket fees & venue compliance tools.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Free Plan */}
        <div 
          onClick={() => setSelectedTier('free')}
          className={`interactive-press ${selectedTier === 'free' ? 'plan-card-selected' : 'plan-card-unselected'}`}
          style={{
            padding: '20px',
            borderRadius: '16px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate-300)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Leader</span>
            {selectedTier === 'free' && <CheckCircle2 size={18} color="var(--teal-400)" />}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--white)', marginBottom: '4px' }}>Free <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)', fontWeight: 500 }}>/ forever</span></div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '14px', lineHeight: 1.4 }}>
            Everything you need to launch and grow a thriving local community.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--slate-300)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Unlimited events & RSVPs</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Member chat & community feed</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ <strong>5% platform fee</strong> on paid tickets</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Standard Stripe card fees apply</li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div 
          onClick={() => setSelectedTier('pro')}
          className={`interactive-press ${selectedTier === 'pro' ? 'plan-card-selected' : 'plan-card-unselected'}`}
          style={{
            padding: '20px',
            borderRadius: '16px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div style={{ position: 'absolute', top: '-10px', right: '16px', background: 'linear-gradient(135deg, #2dd4bf, #0284c7)', color: '#0f172a', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recommended
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leader Pro</span>
            {selectedTier === 'pro' && <CheckCircle2 size={18} color="#2dd4bf" />}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--white)', marginBottom: '4px' }}>
            {billingInterval === 'annual' ? '£165' : '£16.50'}
            <span style={{ fontSize: '0.82rem', color: 'var(--slate-400)', fontWeight: 500 }}>
              /{billingInterval === 'annual' ? 'year (Save 17%)' : 'month'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginBottom: '14px', lineHeight: 1.4 }}>
            Zero ticket fees, instant council & venue safety packs & verified organiser trust shield.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--slate-300)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✨ <strong>2% Reduced ticket fees</strong> (Save 60% vs 5% standard)</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📄 <strong>Council & Venue Safety Packs</strong> (Council-ready PDF)</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🛡️ <strong>Attendee Safety Waivers</strong> on RSVP</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⭐ <strong>Verified Leader Trust Shield</strong></li>
          </ul>

          {selectedTier === 'pro' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBillingInterval('annual'); }}
                style={{
                  flex: 1, padding: '6px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '8px',
                  background: billingInterval === 'annual' ? 'var(--teal-500)' : 'rgba(255,255,255,0.06)',
                  color: billingInterval === 'annual' ? '#0f172a' : 'var(--slate-300)',
                  border: 'none', cursor: 'pointer'
                }}
              >
                Annual (£165/yr)
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBillingInterval('monthly'); }}
                style={{
                  flex: 1, padding: '6px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '8px',
                  background: billingInterval === 'monthly' ? 'var(--teal-500)' : 'rgba(255,255,255,0.06)',
                  color: billingInterval === 'monthly' ? '#0f172a' : 'var(--slate-300)',
                  border: 'none', cursor: 'pointer'
                }}
              >
                Monthly (£16.50/mo)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tier-guidance-card" style={{ padding: '14px 16px', borderRadius: '14px', marginBottom: '14px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--white)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>💡 Which tier does your activity need?</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.75rem', lineHeight: 1.45 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong style={{ color: '#2dd4bf', display: 'block', marginBottom: '3px' }}>✓ Free Tier is 100% fine for:</strong>
            <span style={{ color: 'var(--slate-300)' }}>Book clubs, coffee meetups, casual walking groups, board games, pub socials. Venue insurance covers cafes/pubs, and UK law protects volunteer leaders in public spaces.</span>
          </div>
          <div style={{ background: 'rgba(20,184,166,0.05)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(45,212,191,0.2)' }}>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '3px' }}>⭐ Upgrade to Pro when you:</strong>
            <span style={{ color: 'var(--slate-300)' }}>Hire council community halls or schools (includes safety documents & member check-ins), run paid coaching/fitness, have a local sponsor, or sell £550+/mo in tickets (saves cash at 2% fees).</span>
          </div>
        </div>
      </div>

      <div className="tier-guidance-card" style={{ padding: '12px 16px', borderRadius: '12px', fontSize: '0.78rem', color: 'var(--slate-400)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--slate-200)' }}>Fee Transparency:</strong> MORE Community charges 5% on ticket sales for Free Leaders, or just 2% for Leader Pro. Standard Stripe card processing (~1.5% + 20p UK) is deducted directly by Stripe from payouts. Attendees pay zero extra booking fees.
      </div>
    </div>
  );
}

export default function CommunityOnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState('free'); // 'free' | 'pro'
  const [billingInterval, setBillingInterval] = useState('annual'); // 'annual' | 'monthly'
  
  // Step 1: Basics
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 2: Details
  const [targetAudience, setTargetAudience] = useState('');
  const [cost, setCost] = useState('Free');
  const [activityLevel, setActivityLevel] = useState('Active');
  const [locationName, setLocationName] = useState('');
  const [regionCoords, setRegionCoords] = useState(null);
  const [regionRadius, setRegionRadius] = useState(5);
  const [allowChapters, setAllowChapters] = useState(false);
  const [allowCarpool, setAllowCarpool] = useState(true);
  
  // Step 3: Aesthetics
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
  
  const { createCommunity, createEvent, uploadImage, communities } = useAppContext();
  const searchParams = useSearchParams();
  const chapterOf = searchParams?.get('chapterOf');
  const parentCommunity = chapterOf ? (communities || []).find(c => c.id === chapterOf) : null;
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (parentCommunity) {
      if (!name) {
        const words = parentCommunity.name.split(' ');
        const brandName = words.slice(0, 2).join(' ');
        setName(`${brandName} `);
      }
      if (!description && parentCommunity.description) {
        setDescription(parentCommunity.description);
      }
      if (parentCommunity.tags && (!tags || tags.length === 0)) {
        setTags(parentCommunity.tags);
      }
      if (parentCommunity.target_audience && !targetAudience) {
        setTargetAudience(parentCommunity.target_audience);
      }
      if (parentCommunity.cost && cost === 'Free') {
        setCost(parentCommunity.cost);
      }
      if (parentCommunity.activity_level) {
        setActivityLevel(parentCommunity.activity_level);
      }
      if (parentCommunity.image && !coverImagePreview) {
        setCoverImagePreview(parentCommunity.image);
      }
    }
  }, [parentCommunity]);


  const toggleTag = (tag) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const removeTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const addCustomTag = (tag) => {
    const clean = tag.trim();
    if (clean && !tags.includes(clean)) {
      setTags(prev => [...prev, clean]);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let processedFile = file;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        const heic2any = (await import('heic2any')).default;
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        const jpegBlob = Array.isArray(blob) ? blob[0] : blob;
        processedFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", { type: 'image/jpeg' });
      } catch (err) {
        console.warn("HEIC conversion fallback:", err);
      }
    }

    setCoverImageFile(processedFile);
    const reader = new FileReader();
    reader.onloadend = () => setCoverImagePreview(reader.result);
    reader.readAsDataURL(processedFile);
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

      let formattedWhatsapp = whatsapp.trim();
      if (formattedWhatsapp && !formattedWhatsapp.startsWith('http://') && !formattedWhatsapp.startsWith('https://')) {
        formattedWhatsapp = `https://${formattedWhatsapp}`;
      }

      let formattedInstagram = instagram.trim();
      if (formattedInstagram && !formattedInstagram.startsWith('@') && !formattedInstagram.includes('instagram.com')) {
        formattedInstagram = `@${formattedInstagram}`;
      }

      // Resolve lat & lng for community region
      let finalLat = regionCoords ? Number(regionCoords[0]) : null;
      let finalLng = regionCoords ? Number(regionCoords[1]) : null;

      if (!finalLat || !finalLng) {
        const parsed = parseLocationCoords(locationName);
        if (parsed) {
          finalLat = parsed.lat;
          finalLng = parsed.lng;
        } else if (locationName) {
          try {
            const geo = await geocodeLocation(cleanLocationName(locationName));
            if (geo && geo.lat && geo.lng) {
              finalLat = geo.lat;
              finalLng = geo.lng;
            }
          } catch (e) {}
        }
      }

      if (!finalLat || !finalLng) {
        finalLat = DEFAULT_TW_CENTER[0];
        finalLng = DEFAULT_TW_CENTER[1];
      }

      // Verified is now false by default
      const communityData = {
        name: name.trim(),
        description: description.trim(),
        tags: tags,
        category: tags[0] || 'General',
        image: imageUrl,
        verified: false,
        instagram_handle: formattedInstagram,
        whatsapp_group: formattedWhatsapp,
        activity_level: activityLevel,
        cost: cost.trim(),
        target_audience: targetAudience.trim(),
        location_name: locationName.trim(),
        lat: finalLat,
        lng: finalLng,
        allow_chapters: allowChapters,
        allowChapters: allowChapters,
        allow_carpool: allowCarpool,
        allowCarpool: allowCarpool,
        parent_community_id: parentCommunity?.id || null
      };

      // Create Community
      const newCommunityId = await createCommunity(communityData);

      // Create First Event if provided
      if (eventTitle && eventDate && eventTime && eventLocation) {
        try {
          await createEvent(newCommunityId, {
            title: eventTitle,
            description: parentCommunity ? `Inaugural chapter meetup for ${parentCommunity.name} in our town!` : 'Our inaugural community event!',
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            image: imageUrl
          });
        } catch (eventErr) {
          console.error("Event creation failed:", eventErr);
        }
      }

      if (parentCommunity) {
        toast.success('Chapter Application Submitted! 🏛️', `The founding leader of ${parentCommunity.name} has been notified and will review your chapter.`);
      } else {
        toast.success('Community Created!', 'You are ready to go.');
      }

      if (selectedTier === 'pro') {
        try {
          let authHeader = {};
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) authHeader = { 'Authorization': `Bearer ${session.access_token}` };
          } catch (e) {}

          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({
              type: 'leader_pro',
              communityId: newCommunityId,
              interval: billingInterval,
              price: billingInterval === 'annual' ? 165 : 16.50,
              title: `MORE Leader Pro (${billingInterval === 'annual' ? 'Annual' : 'Monthly'})`
            })
          });
          const checkoutData = await res.json();
          if (res.ok && checkoutData?.url && !checkoutData?.simulated) {
            window.location.href = checkoutData.url;
            return;
          }
        } catch (checkoutErr) {
          console.error('Pro checkout redirect error:', checkoutErr);
        }
      }

      window.location.href = `/community/${newCommunityId}`;
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

  const TOTAL_STEPS = 7;
  const isStep1Valid = name.trim().length >= 3 && description.trim().length >= 10;
  const isStep2Valid = true;
  const isStep3Valid = tags.length > 0;
  const isStep4Valid = true;
  const isStep5Valid = !isPartiallyFilledEvent;
  const isStep6Valid = isValidIg && isValidWa;

  const getCanProceed = () => {
    if (step === 0) return isStep1Valid;
    if (step === 1) return isStep2Valid;
    if (step === 2) return isStep3Valid;
    if (step === 3) return isStep4Valid;
    if (step === 4) return isStep5Valid;
    if (step === 5) return isStep6Valid;
    return true;
  };

  const steps = [
    <StepBasics key="basics" name={name} setName={setName} description={description} setDescription={setDescription} parentCommunity={parentCommunity} />,
    <StepDetails 
      key="details" 
      targetAudience={targetAudience} 
      setTargetAudience={setTargetAudience} 
      cost={cost} 
      setCost={setCost} 
      activityLevel={activityLevel} 
      setActivityLevel={setActivityLevel} 
      locationName={locationName} 
      setLocationName={setLocationName}
      regionCoords={regionCoords}
      setRegionCoords={setRegionCoords}
      regionRadius={regionRadius}
      setRegionRadius={setRegionRadius}
      allowChapters={allowChapters}
      setAllowChapters={setAllowChapters}
      allowCarpool={allowCarpool}
      setAllowCarpool={setAllowCarpool}
    />,
    <StepTags key="tags" tags={tags} toggleTag={toggleTag} addCustomTag={addCustomTag} removeTag={removeTag} />,
    <StepCoverPhoto key="cover" coverImagePreview={coverImagePreview} handleImageSelect={handleImageSelect} fileInputRef={fileInputRef} />,
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
            disabled={!getCanProceed() || isSubmitting}
            className={`btn btn-primary interactive-press btn-continue ${getCanProceed() && !isSubmitting ? '' : 'disabled'}`}
          >
            {isSubmitting ? (parentCommunity ? 'Submitting Application...' : 'Creating...') : step < steps.length - 1 ? (
              <>Continue <ArrowRight size={18} /></>
            ) : parentCommunity ? (
              <>Submit Chapter Application <ArrowRight size={18} /></>
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
