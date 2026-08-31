import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, X as XIcon, MapPin, Calendar, Sparkles, Info } from 'lucide-react';
import { useToast } from './Toast';

export default function SwipeDiscovery({ events, communities, onClose, onSave }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [leaveDirection, setLeaveDirection] = useState(null); // 'left' | 'right'
  const [showInfo, setShowInfo] = useState(false);
  const cardRef = useRef(null);
  const { toast } = useToast();

  const currentEvent = events[currentIndex];

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || (e.touches && e.touches[0].clientX) || 0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diffX = currentX - startX;
    setOffset(diffX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (offset > 100) {
      handleSwipe('right');
    } else if (offset < -100) {
      handleSwipe('left');
    } else {
      setOffset(0); // Snap back
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) handlePointerUp();
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, offset]);

  const handleSwipe = (direction) => {
    setLeaveDirection(direction);
    setOffset(direction === 'right' ? window.innerWidth : -window.innerWidth);
    
    setTimeout(() => {
      if (direction === 'right') {
        onSave(currentEvent);
        toast.success('Saved!', 'Added to your interested list.');
      }
      
      setCurrentIndex(prev => prev + 1);
      setOffset(0);
      setLeaveDirection(null);
    }, 300); // Wait for animation
  };

  if (!currentEvent) {
    return (
      <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', zIndex: 2000 }}>
        <div style={{ height: 'calc(100vh - 120px)', width: '100%', maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--slate-950)', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <button onClick={onClose} className="interactive-press" style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer', zIndex: 100 }}>
            <X size={20} />
          </button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Sparkles size={40} color="var(--teal-400)" />
            </div>
            <h2 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '16px' }}>You're all caught up!</h2>
            <p style={{ color: 'var(--slate-400)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>We've run out of new events to show you right now. Check back later for more.</p>
            <button onClick={onClose} className="btn btn-primary interactive-press" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>Back to Discover</button>
          </div>
        </div>
      </div>
    );
  }

  const community = communities.find(c => c.id === currentEvent.communityId);
  const rotation = (offset / window.innerWidth) * 30; // Max 30 deg rotation

  return (
    <div className="modal-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', zIndex: 2000 }}>
      <div style={{ height: 'calc(100vh - 120px)', width: '100%', maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--slate-950)', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        
        <button onClick={onClose} className="interactive-press" style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer', zIndex: 100 }}>
          <X size={20} />
        </button>

        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflow: 'hidden' }}>
          
          {/* Next Card Background (Preview) */}
          {events[currentIndex + 1] && (
            <div style={{ 
              position: 'absolute', 
              width: 'calc(100% - 40px)', 
              height: 'calc(100% - 40px)', 
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px', 
              transform: 'scale(0.95) translateY(20px)', 
              opacity: 0.5,
              zIndex: 1,
              pointerEvents: 'none',
              border: '1px solid rgba(255,255,255,0.1)'
            }}></div>
          )}

          {/* Current Draggable Card */}
          <div 
            ref={cardRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            style={{
              position: 'absolute',
              width: 'calc(100% - 40px)',
              height: 'calc(100% - 40px)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
              zIndex: 10,
              transform: `translateX(${offset}px) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out',
              cursor: isDragging ? 'grabbing' : 'grab',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {/* Action overlays based on drag offset */}
            <div style={{ position: 'absolute', top: '40px', right: '40px', opacity: offset < -20 ? Math.min(1, Math.abs(offset) / 100) : 0, zIndex: 20, transform: 'rotate(15deg)' }}>
              <div style={{ border: '4px solid #ef4444', color: '#ef4444', fontSize: '2rem', fontWeight: 800, padding: '8px 16px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Pass</div>
            </div>
            <div style={{ position: 'absolute', top: '40px', left: '40px', opacity: offset > 20 ? Math.min(1, offset / 100) : 0, zIndex: 20, transform: 'rotate(-15deg)' }}>
              <div style={{ border: '4px solid #22c55e', color: '#22c55e', fontSize: '2rem', fontWeight: 800, padding: '8px 16px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Save</div>
            </div>

            <div style={{ 
              height: '55%', 
              background: `url(${currentEvent.image || community?.image || '/images/communities/parkrun.webp'})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              position: 'relative',
              pointerEvents: 'none'
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(15, 23, 42, 0.95) 100%)' }}></div>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: 'var(--white)', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700 }}>
                {currentEvent.ticketPrice > 0 ? `£${currentEvent.ticketPrice}` : 'FREE'}
              </div>
            </div>
            
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ color: 'var(--teal-400)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {community?.name}
                </div>
                <button 
                  onPointerDown={(e) => e.stopPropagation()} 
                  onMouseDown={(e) => e.stopPropagation()} 
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={() => setShowInfo(true)}
                  style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer' }}
                >
                  <Info size={16} />
                </button>
              </div>
              <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', color: 'var(--white)', margin: '0 0 16px 0', lineHeight: 1.1 }}>
                {currentEvent.title}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--slate-300)' }}>
                  <Calendar size={18} color="var(--slate-400)" />
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{currentEvent.date} at {currentEvent.time}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--slate-300)' }}>
                  <MapPin size={18} color="var(--slate-400)" />
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{currentEvent.location}</span>
                </div>
              </div>

              <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {currentEvent.description || `Join us for an incredible experience with ${community?.name}. Meet like-minded people and make memories!`}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 40px 40px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
          <button 
            onClick={() => handleSwipe('left')}
            className="interactive-press"
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--slate-800)', border: '2px solid var(--slate-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            <XIcon size={32} />
          </button>
          
          <button 
            onClick={() => handleSwipe('right')}
            className="interactive-press"
            style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--teal-500)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', cursor: 'pointer', boxShadow: '0 8px 32px rgba(20,184,166,0.4)' }}
          >
            <Heart size={36} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
