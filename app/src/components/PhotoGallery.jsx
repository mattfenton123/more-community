"use client";
import { useState, useRef } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from '../context/AppContext';
import { useToast } from './Toast';

/**
 * Community Photo Gallery with masonry-style grid and lightbox.
 * Props:
 *  - photos: [{ id, url, caption, uploaded_by }]
 *  - communityId: string
 *  - canUpload: boolean
 */
export default function PhotoGallery({ photos = [], communityId, canUpload = true }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { uploadImage, user } = useAppContext();
  const { toast } = useToast();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      
      // Save photo reference to DB
      const { error } = await supabase.from('community_photos').insert([{
        community_id: communityId,
        url,
        caption: '',
        uploaded_by: user.id
      }]);
      
      if (error) throw error;

      toast.success('Photo uploaded!', 'Added to the gallery');
    } catch (err) {
      toast.error('Upload failed', 'Could not upload photo');
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showLightbox = lightboxIndex !== null && photos[lightboxIndex];

  return (
    <div>
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            onClick={() => setLightboxIndex(i)}
            className="stagger-item"
            style={{
              aspectRatio: '1',
              background: `url(${photo.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          />
        ))}

        {/* Upload tile */}
        {canUpload && (
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              aspectRatio: '1',
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: isUploading ? 'wait' : 'pointer',
              color: 'var(--slate-400)',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            {isUploading ? (
              <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            ) : (
              <>
                <Plus size={20} color="var(--teal-400)" />
                <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>Add</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      {photos.length === 0 && !canUpload && (
        <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
          No photos yet.
        </p>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="modal-overlay"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="interactive-press"
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(0,0,0,0.5)', border: 'none',
              color: 'var(--white)', width: '40px', height: '40px',
              borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
            }}
          >
            <X size={20} />
          </button>

          <img
            src={photos[lightboxIndex].url}
            alt={photos[lightboxIndex].caption || 'Community photo'}
            onClick={e => e.stopPropagation()}
            className="modal-content"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              borderRadius: '12px',
              objectFit: 'contain',
            }}
          />

          {photos[lightboxIndex].caption && (
            <div style={{
              position: 'absolute', bottom: '40px',
              background: 'rgba(0,0,0,0.7)',
              padding: '8px 16px', borderRadius: '8px',
              color: 'var(--white)', fontSize: '0.9rem',
            }}>
              {photos[lightboxIndex].caption}
            </div>
          )}

          {/* Navigation arrows */}
          {lightboxIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--white)',
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1.2rem',
              }}
            >←</button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--white)',
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1.2rem',
              }}
            >→</button>
          )}
        </div>
      )}
    </div>
  );
}
