import { useState, useEffect } from 'react';

/**
 * Returns the current on-screen keyboard height in pixels (0 when closed).
 * Uses the Visual Viewport API resize event only — scroll events are excluded
 * because they fire during page/carousel scrolling and cause excessive re-renders.
 * A 120px threshold filters out iOS toolbar show/hide fluctuations.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kh = window.innerHeight - vv.height - vv.offsetTop;
      // Only report keyboard if it's substantial — ignores iOS toolbar noise (<120px)
      setKeyboardHeight(kh > 120 ? kh : 0);
    };

    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, []);

  return keyboardHeight;
}
