"use client";
import React, { useState, useMemo } from 'react';
import { Search, X, Image as ImageIcon, Sparkles, Check, Tag } from 'lucide-react';

const CURATED_UNSPLASH = [
  // Outdoor & Hiking
  { id: 'out-1', category: 'Outdoor & Hiking', label: 'Misty Mountain Trail', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80' },
  { id: 'out-2', category: 'Outdoor & Hiking', label: 'Golden Hour Ridgeline', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80' },
  { id: 'out-3', category: 'Outdoor & Hiking', label: 'Forest Trail Gathering', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80' },
  { id: 'out-4', category: 'Outdoor & Hiking', label: 'Scenic Coastal Path', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80' },
  
  // Running & Fitness
  { id: 'run-1', category: 'Running & Fitness', label: 'Morning Trail Runners', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=80' },
  { id: 'run-2', category: 'Running & Fitness', label: 'Group Track Session', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80' },
  { id: 'run-3', category: 'Running & Fitness', label: 'Outdoor Bootcamp', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80' },

  // Wellness & Yoga
  { id: 'well-1', category: 'Wellness & Yoga', label: 'Sunrise Yoga Outdoors', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80' },
  { id: 'well-2', category: 'Wellness & Yoga', label: 'Breathwork & Meditation', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80' },
  { id: 'well-3', category: 'Wellness & Yoga', label: 'Serene Nature Relaxation', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1200&q=80' },

  // Dogs & Pets
  { id: 'dog-1', category: 'Dogs & Pets', label: 'Social Dog Walk in Meadow', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80' },
  { id: 'dog-2', category: 'Dogs & Pets', label: 'Golden Retriever Park Meetup', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80' },
  { id: 'dog-3', category: 'Dogs & Pets', label: 'Woodland Puppy Adventure', url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1200&q=80' },

  // Cafe, Food & Social
  { id: 'food-1', category: 'Cafe & Social', label: 'Artisan Coffee & Brunch', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80' },
  { id: 'food-2', category: 'Cafe & Social', label: 'Community Table Gathering', url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=80' },
  { id: 'food-3', category: 'Cafe & Social', label: 'Fresh Bakery Treats', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80' },

  // Creative & Craft
  { id: 'art-1', category: 'Creative & Craft', label: 'Pottery & Ceramics Workshop', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&q=80' },
  { id: 'art-2', category: 'Creative & Craft', label: 'Painting & Illustration Class', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80' },
  { id: 'art-3', category: 'Creative & Craft', label: 'Makers Workshop Studio', url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&q=80' },

  // Books & Culture
  { id: 'book-1', category: 'Books & Culture', label: 'Cosy Book Club Discussion', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80' },
  { id: 'book-2', category: 'Books & Culture', label: 'Acoustic Music & Poetry', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80' }
];

const CATEGORIES = ['All', 'Outdoor & Hiking', 'Running & Fitness', 'Wellness & Yoga', 'Dogs & Pets', 'Cafe & Social', 'Creative & Craft', 'Books & Culture'];

export default function UnsplashImagePicker({
  isOpen,
  onClose,
  onSelect,
  title = "Select Free High-Res Photo"
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredImages = useMemo(() => {
    let list = CURATED_UNSPLASH;
    if (activeCategory !== 'All') {
      list = list.filter(item => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.label.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110000,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          borderRadius: '22px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)' }}>
              <ImageIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                {title}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                High-quality free photos for communities, sessions & sponsors
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="interactive-press"
            style={{
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
        </div>

        {/* Search & Category Chips */}
        <div style={{ padding: '14px 22px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search running, yoga, dogs, coffee, ceramics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="interactive-press"
                style={{
                  padding: '5px 10px',
                  borderRadius: '99px',
                  border: 'none',
                  background: activeCategory === cat ? 'var(--teal-500)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeCategory === cat ? '#000' : 'var(--slate-300)',
                  fontSize: '0.72rem',
                  fontWeight: activeCategory === cat ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Photos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {filteredImages.map(img => (
              <div 
                key={img.id}
                onClick={() => {
                  onSelect(img.url);
                  onClose();
                }}
                className="interactive-press interactive-hover"
                style={{
                  height: '130px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  backgroundImage: `url(${img.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '8px 10px'
                }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                    {img.label}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: 'var(--teal-300)', marginTop: '2px' }}>
                    {img.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--slate-400)', fontSize: '0.85rem' }}>
              No photos found matching "{searchQuery}". Try selecting a category above.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
            Free for commercial and community use via Unsplash.
          </span>
          <button 
            onClick={onClose}
            className="btn btn-secondary interactive-press"
            style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '8px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}