"use client";

import React, { useRef, useEffect, useState } from 'react';

/**
 * Wraps route content with a fade-in-up animation on route change.
 * Uses a key-based approach to re-trigger the animation.
 */
export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      // Start exit, then swap
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransitionStage('exit');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('enter');
      }, 150); // Fast exit
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={transitionStage === 'enter' ? 'page-wrapper' : 'page-exit'}
      key={displayLocation.pathname}
    >
      {React.cloneElement(children, { location: displayLocation })}
    </div>
  );
}
