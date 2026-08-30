import React, { useState } from 'react';
import { Star, MapPin, Clock, PlusCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ExperiencesCatalog({ onPitchExperience }) {
  const { experiences } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...new Set(experiences.map(e => e.category))];
  const filteredExperiences = activeCategory === 'All' 
    ? experiences 
    : experiences.filter(e => e.category === activeCategory);

  return (
    <div style={{ padding: '12px 0' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredExperiences.map(exp => (
          <div key={exp.id} style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '16px', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ position: 'relative', height: '140px' }}>
              <img src={exp.image} alt={exp.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'white', fontWeight: 600 }}>
                <Star size={12} fill="var(--yellow-400)" color="var(--yellow-400)" /> {exp.rating}
              </div>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--teal-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{exp.provider}</div>
              <h4 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '1.05rem', lineHeight: 1.3 }}>{exp.title}</h4>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {exp.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {exp.duration}</span>
              </div>
              
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--slate-300)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                {exp.description}
              </p>
              
              <button 
                onClick={() => onPitchExperience(exp)}
                className="btn btn-primary interactive-press" 
                style={{ width: '100%', padding: '10px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
              >
                <PlusCircle size={16} /> Pitch to Community
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
