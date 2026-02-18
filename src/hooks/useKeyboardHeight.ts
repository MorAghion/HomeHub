import { useState, useEffect } from 'react';

/**
 * Returns the current on-screen keyboard height in pixels (0 when closed).
 * Uses the Visual Viewport API which shrinks when the soft keyboard opens.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Keyboard height = total window height minus the visible viewport height and its offset
      const kh = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardHeight(Math.max(0, kh));
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return keyboardHeight;
}
