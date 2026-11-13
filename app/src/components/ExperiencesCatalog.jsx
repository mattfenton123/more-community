import React, { useState } from 'react';
import { Star, MapPin, Clock, PlusCircle, Info, ExternalLink, X, Eye, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isAffiliateExperience } from '../lib/experiencePricing';

export default function ExperiencesCatalog({ onPitchExperience }) {
  const { experiences } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedExp, setSelectedExp] = useState(null);

  const categories = ['All', ...new Set(experiences.map(e => e.category))];
  const filteredExperiences = activeCategory === 'All' 
    ? experiences 
    : experiences.filter(e => e.category === activeCategory);

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="interactive-press"
            style={{ 
              background: activeCategory === cat ? 'var(--teal-500)' : 'rgba(255,255,255,0.05)',
              border: '1px solid',
              borderColor: activeCategory === cat ? 'var(--teal-400)' : 'rgba(255,255,255,0.1)',
              color: activeCategory === cat ? 'white' : 'var(--slate-300)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Experiences Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredExperiences.map(exp => (
          <div 
            key={exp.id} 
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '16px', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.18s ease, border-color 0.18s ease'
            }}
          >
            {/* Clickable Image Banner */}
            <div 
              onClick={() => setSelectedExp(exp)}
              style={{ position: 'relative', height: '150px', cursor: 'pointer', overflow: 'hidden' }}
              title="Click to view full details"
            >
              <img 
                src={exp.image} 
                alt={exp.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
              />
              <div style={{ 
                position: 'absolute', top: '10px', right: '10px', 
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', 
                padding: '4px 8px', borderRadius: '8px', 
                display: 'flex', alignItems: 'center', gap: '4px', 
                fontSize: '0.75rem', color: '#fff', fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Star size={12} fill="#f59e0b" color="#f59e0b" /> {exp.rating || '4.8'}
              </div>
              {exp.category && (
                <div style={{
                  position: 'absolute', top: '10px', left: '10px',
                  background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
                  padding: '3px 8px', borderRadius: '6px',
                  fontSize: '0.68rem', color: '#2dd4bf', fontWeight: 700,
                  border: '1px solid rgba(45, 212, 191, 0.3)'
                }}>
                  {exp.category}
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: '8px', right: '10px',
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                padding: '2px 8px', borderRadius: '20px',
                fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Eye size={11} /> Tap to read details
              </div>
            </div>
            
            {/* Card Content */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.03em' }}>
                {exp.provider || 'Viator Experience'}
              </div>

              {/* Clickable Title */}
              <h4 
                onClick={() => setSelectedExp(exp)}
                style={{ 
                  margin: '0 0 8px 0', 
                  color: 'var(--white)', 
                  fontSize: '1.05rem', 
                  lineHeight: 1.3,
                  cursor: 'pointer'
                }}
                className="interactive-hover"
                title="Click to view full details"
              >
                {exp.title}
              </h4>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#2dd4bf" /> {exp.location || 'Tunbridge Wells'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} color="#2dd4bf" /> {exp.duration || 'Flexible'}</span>
              </div>
              
              {/* Truncated preview with View More link */}
              <p 
                onClick={() => setSelectedExp(exp)}
                style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '0.84rem', 
                  color: 'var(--slate-300)', 
                  lineHeight: 1.5, 
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden', 
                  flex: 1,
                  cursor: 'pointer'
                }}
                title="Click to expand description"
              >
                {exp.description}
              </p>
              
              {/* Dual Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button 
                  onClick={() => setSelectedExp(exp)}
                  type="button"
                  className="btn btn-outline interactive-press" 
                  style={{ 
                    flex: '0 0 auto', 
                    padding: '9px 12px', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '0.82rem',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: 'var(--slate-200)'
                  }}
                  title="View complete description and details"
                >
                  <Info size={14} /> Details
                </button>
                <button 
                  onClick={() => onPitchExperience(exp)}
                  type="button"
                  className="btn btn-primary interactive-press" 
                  style={{ 
                    flex: 1, 
                    padding: '9px 12px', 
                    borderRadius: '10px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  <PlusCircle size={15} /> Pitch to Community
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Experience Details Modal */}
      {selectedExp && (
        <div 
          onClick={() => setSelectedExp(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Modal Image Header */}
            <div style={{ position: 'relative', height: '220px', background: '#020617', flexShrink: 0 }}>
              <img 
                src={selectedExp.image} 
                alt={selectedExp.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <button 
                onClick={() => setSelectedExp(null)}
                className="interactive-press"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <X size={18} />
              </button>

              {/* Provider Badge */}
              <div style={{
                position: 'absolute', bottom: '12px', left: '16px',
                background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(45, 212, 191, 0.3)',
                padding: '4px 10px', borderRadius: '99px',
                fontSize: '0.72rem', color: '#2dd4bf', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '5px'
              }}>
                <Sparkles size={12} /> {selectedExp.provider || 'Viator Partner'}
              </div>

              {/* Rating */}
              <div style={{
                position: 'absolute', bottom: '12px', right: '16px',
                background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '4px 10px', borderRadius: '99px',
                fontSize: '0.74rem', color: '#fff', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" /> {selectedExp.rating || '4.8'}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {selectedExp.category || 'Local Experience'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '4px 0 0', lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                  {selectedExp.title}
                </h3>
              </div>

              {/* Key metadata grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Location</div>
                  <div style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#2dd4bf" /> {selectedExp.location || 'Tunbridge Wells'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
                  <div style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="#2dd4bf" /> {selectedExp.duration || '1-2 hours'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {isAffiliateExperience(selectedExp) ? '2-Step Guide Price' : 'Indicative Price'}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
                    {isAffiliateExperience(selectedExp)
                      ? (selectedExp.basePrice ? `~£${selectedExp.basePrice}pp direct + Host Pass` : 'From £35pp + Host Pass')
                      : (selectedExp.basePrice ? `£${selectedExp.basePrice} per person` : 'From £35pp')}
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h5 style={{ fontSize: '0.82rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px 0', fontWeight: 700 }}>
                  About this experience
                </h5>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--slate-200)', 
                  lineHeight: 1.6, 
                  whiteSpace: 'pre-line',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}>
                  {selectedExp.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const expToPitch = selectedExp;
                    setSelectedExp(null);
                    onPitchExperience(expToPitch);
                  }}
                  className="btn btn-primary interactive-press"
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <PlusCircle size={17} /> Pitch to Community
                </button>
                <a
                  href={`/experiences/${selectedExp.id || selectedExp.productCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline interactive-press"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'rgba(255,255,255,0.18)',
                    color: 'var(--slate-200)',
                    textDecoration: 'none'
                  }}
                >
                  <span>Open Full Page</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
