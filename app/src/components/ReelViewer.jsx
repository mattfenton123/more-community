import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ReelViewer({ highlights, initialIndex = 0, onClose, isLeader, onDeleteHighlight }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef(null);
  
  const currentHighlight = highlights[currentIndex];
  
  // Progress bar timer
  useEffect(() => {
    let interval;
    if (!isPaused && videoRef.current) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          setProgress(percent || 0);
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPaused, currentIndex]);

  const handleNext = () => {
    if (currentIndex < highlights.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  };

  const handleVideoEnded = () => {
    handleNext();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, highlights.length]);

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) videoRef.current.pause();
      else videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
    }
  }, [isPaused, currentIndex]);

  if (!currentHighlight) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Container (Mobile Aspect Ratio) */}
      <div 
        style={{ width: '100%', maxWidth: '450px', height: '100%', position: 'relative', overflow: 'hidden' }}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
      >
        
        {/* Video Player */}
        <video
          ref={videoRef}
          src={currentHighlight.url}
          autoPlay
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnded}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Top Gradient Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }} />

        {/* Progress Bars */}
        <div style={{ position: 'absolute', top: '16px', left: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 10 }}>
          {highlights.map((h, i) => (
            <div key={h.id} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                background: '#fff', 
                width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%',
                transition: i === currentIndex ? 'none' : 'width 0.2s'
              }} />
            </div>
          ))}
        </div>

        {/* Header Info */}
        <div style={{ position: 'absolute', top: '32px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <img src={currentHighlight.uploaderAvatar || 'https://i.pravatar.cc/150'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Uploader" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {currentHighlight.uploaderName || 'Community Member'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {currentHighlight.title || 'Highlight'} • {currentHighlight.timestamp || 'Just now'}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            {isLeader && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteHighlight(currentHighlight.id); }}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >
                <Trash2 size={22} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
            >
              {isMuted ? <VolumeX size={24} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} /> : <Volume2 size={24} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
            >
              <X size={28} style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
            </button>
          </div>
        </div>

        {/* Tap Zones */}
        <div style={{ position: 'absolute', top: '100px', bottom: '100px', left: 0, width: '30%', zIndex: 5 }} onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
        <div style={{ position: 'absolute', top: '100px', bottom: '100px', right: 0, width: '70%', zIndex: 5 }} onClick={(e) => { e.stopPropagation(); handleNext(); }} />

        {/* Bottom Title/Gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none', display: 'flex', alignItems: 'flex-end', padding: '24px' }}>
          <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {currentHighlight.description || ''}
          </p>
        </div>
        
      </div>
    </div>
  );
}
