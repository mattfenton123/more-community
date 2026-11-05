"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Image as ImageIcon, Sparkles, Check, Tag, Loader2 } from 'lucide-react';

const CURATED_UNSPLASH = [
  // Outdoor & Hiking
  { id: 'out-1', category: 'Outdoor & Hiking', label: 'Ben Nevis & Scottish Highlands', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80', source: 'Unsplash' },
  { id: 'out-2', category: 'Outdoor & Hiking', label: 'Misty Mountain Trail', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80', source: 'Unsplash' },
  { id: 'out-3', category: 'Outdoor & Hiking', label: 'Golden Hour Ridgeline', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', source: 'Unsplash' },
  { id: 'out-4', category: 'Outdoor & Hiking', label: 'Forest Trail Gathering', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80', source: 'Unsplash' },
  { id: 'out-5', category: 'Outdoor & Hiking', label: 'Scenic Coastal Path', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', source: 'Unsplash' },
  
  // Running & Fitness
  { id: 'run-1', category: 'Running & Fitness', label: 'Morning Trail Runners', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&q=80', source: 'Unsplash' },
  { id: 'run-2', category: 'Running & Fitness', label: 'Group Track Session', url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80', source: 'Unsplash' },
  { id: 'run-3', category: 'Running & Fitness', label: 'Outdoor Bootcamp', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80', source: 'Unsplash' },

  // Wellness & Yoga
  { id: 'well-1', category: 'Wellness & Yoga', label: 'Sunrise Yoga Outdoors', url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80', source: 'Unsplash' },
  { id: 'well-2', category: 'Wellness & Yoga', label: 'Breathwork & Meditation', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80', source: 'Unsplash' },
  { id: 'well-3', category: 'Wellness & Yoga', label: 'Serene Nature Relaxation', url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1200&q=80', source: 'Unsplash' },

  // Dogs & Pets
  { id: 'dog-1', category: 'Dogs & Pets', label: 'Social Dog Walk in Meadow', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80', source: 'Unsplash' },
  { id: 'dog-2', category: 'Dogs & Pets', label: 'Golden Retriever Park Meetup', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80', source: 'Unsplash' },
  { id: 'dog-3', category: 'Dogs & Pets', label: 'Woodland Puppy Adventure', url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1200&q=80', source: 'Unsplash' },

  // Cafe, Food & Social
  { id: 'food-1', category: 'Cafe & Social', label: 'Artisan Coffee & Brunch', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80', source: 'Unsplash' },
  { id: 'food-2', category: 'Cafe & Social', label: 'Community Table Gathering', url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=80', source: 'Unsplash' },
  { id: 'food-3', category: 'Cafe & Social', label: 'Fresh Bakery Treats', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=80', source: 'Unsplash' },

  // Creative & Craft
  { id: 'art-1', category: 'Creative & Craft', label: 'Pottery & Ceramics Workshop', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&q=80', source: 'Unsplash' },
  { id: 'art-2', category: 'Creative & Craft', label: 'Painting & Illustration Class', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80', source: 'Unsplash' },
  { id: 'art-3', category: 'Creative & Craft', label: 'Makers Workshop Studio', url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&q=80', source: 'Unsplash' },

  // Books & Culture
  { id: 'book-1', category: 'Books & Culture', label: 'Cosy Book Club Discussion', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80', source: 'Unsplash' },
  { id: 'book-2', category: 'Books & Culture', label: 'Acoustic Music & Poetry', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80', source: 'Unsplash' }
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
  const [apiPhotos, setApiPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Live query debouncing across millions of photos
  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setApiPhotos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/photos/search?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(activeCategory)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos)) {
            setApiPhotos(data.photos);
          }
        }
      } catch (err) {
        console.warn('Live photo search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, activeCategory, isOpen]);

  // Combined photo list (Live API results or Curated Local)
  const displayPhotos = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return apiPhotos;
    }

    let list = CURATED_UNSPLASH;
    if (activeCategory !== 'All') {
      list = list.filter(item => item.category === activeCategory);
    }
    return list;
  }, [searchQuery, apiPhotos, activeCategory]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110000,
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
          maxWidth: '720px',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1.5px solid rgba(45, 212, 191, 0.35)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 40px rgba(20, 184, 166, 0.12)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-400)', border: '1px solid rgba(45, 212, 191, 0.3)' }}>
              <ImageIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                {title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                Search millions of free high-res photos for your flyers, sessions, and community covers
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
              width: '34px',
              height: '34px',
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
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search anything: 'ben nevis', 'snowdon', 'trail run', 'coffee shop'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '11px 40px 11px 40px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(45, 212, 191, 0.35)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--slate-400)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (cat !== 'All' && !searchQuery) {
                    // Quick-filter category
                  }
                }}
                className="interactive-press"
                style={{
                  padding: '6px 12px',
                  borderRadius: '99px',
                  border: 'none',
                  background: activeCategory === cat ? 'var(--teal-500)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeCategory === cat ? '#0f172a' : 'var(--slate-300)',
                  fontSize: '0.74rem',
                  fontWeight: activeCategory === cat ? 800 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Photos */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} style={{ height: '140px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={24} className="spin" color="var(--teal-400)" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {displayPhotos.map(img => (
                <div 
                  key={img.id}
                  onClick={() => {
                    onSelect(img.url);
                    onClose();
                  }}
                  className="interactive-press interactive-hover"
                  style={{
                    height: '140px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    backgroundImage: `url(${img.thumb || img.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    transition: 'transform 0.18s ease, border-color 0.18s ease'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '10px 12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)', color: 'var(--teal-300)', border: '1px solid rgba(45,212,191,0.3)' }}>
                        {img.source || 'Free'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {img.label}
                      </span>
                      {img.author && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)', display: 'block', marginTop: '2px' }}>
                          by {img.author}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && displayPhotos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--slate-400)', fontSize: '0.88rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Search size={22} color="var(--slate-500)" />
              </div>
              <p style={{ margin: '0 0 6px', color: 'var(--white)', fontWeight: 700 }}>
                No photos found matching "{searchQuery}"
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--slate-400)' }}>
                Try searching for broader keywords like "mountain", "scotland", "nature", or click one of the categories above.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
            Free for commercial and community use via Unsplash and Wikimedia Commons.
          </span>
          <button 
            onClick={onClose}
            className="btn btn-secondary interactive-press"
            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
