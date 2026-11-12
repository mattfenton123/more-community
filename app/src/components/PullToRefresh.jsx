"use client";
import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isPulling = useRef(false);
  const { theme } = useAppContext();
  const isLight = theme === 'light';

  const PULL_THRESHOLD = 55;
  const MAX_PULL = 85;

  const handleTouchStart = (e) => {
    if (typeof window === 'undefined') return;
    if (window.scrollY <= 2 && !isRefreshing) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - touchStartY.current;
    const diffX = currentX - touchStartX.current;

    // Only engage if pulling downwards and vertical motion is dominant
    if (diffY > 0 && Math.abs(diffY) > Math.abs(diffX) && (typeof window !== 'undefined' && window.scrollY <= 2)) {
      const dampened = Math.min(diffY * 0.45, MAX_PULL);
      setPullY(dampened);
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || isRefreshing) return;
    isPulling.current = false;
    if (pullY >= PULL_THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      setPullY(48);
      try {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) {
          try { window.navigator.vibrate(25); } catch (err) {}
        }
        await onRefresh();
      } catch (e) {
        console.error('Refresh error:', e);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 350);
      }
    } else {
      setPullY(0);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', minHeight: '100%' }}
    >
      {/* Pull Indicator Banner */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${pullY}px`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          pointerEvents: 'none',
          transition: isPulling.current ? 'none' : 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)',
          borderBottom: pullY > 0 ? (isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)') : 'none'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: isLight ? '#0d9488' : 'var(--teal-400)',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          <RefreshCw 
            size={16} 
            className={isRefreshing ? 'animate-spin' : ''}
            style={{ 
              transform: isRefreshing ? 'none' : `rotate(${pullY * 4.5}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s linear'
            }} 
          />
          <span>{isRefreshing ? 'Refreshing feed...' : pullY >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}</span>
        </div>
      </div>

      <div style={{
        transform: `translateY(${pullY}px)`,
        transition: isPulling.current ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {children}
      </div>
    </div>
  );
}
