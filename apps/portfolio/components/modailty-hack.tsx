'use client';
import { useEffect } from 'react';

export function InputModalityTracker() {
  useEffect(() => {
    const root = document.documentElement;

    function setModality(e: Event) {
      if (e.type === 'keydown') root.classList.remove('mouse-mode');
      if (e.type === 'mousedown') root.classList.add('mouse-mode');
    }

    window.addEventListener('mousedown', setModality, true);
    window.addEventListener('keydown', setModality, true);
    return () => {
      window.removeEventListener('mousedown', setModality, true);
      window.removeEventListener('keydown', setModality, true);
    };
  }, []);

  return null;
}
