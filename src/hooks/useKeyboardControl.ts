import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardControl() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useStore.getState();
      if (state.stacker.mode !== 'manual' || state.stacker.isBusy) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          e.preventDefault();
          useStore.getState().moveStackerManual('up');
          break;
        case 's':
        case 'arrowdown':
          e.preventDefault();
          useStore.getState().moveStackerManual('down');
          break;
        case 'a':
        case 'arrowleft':
          e.preventDefault();
          useStore.getState().moveStackerManual('left');
          break;
        case 'd':
        case 'arrowright':
          e.preventDefault();
          useStore.getState().moveStackerManual('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
