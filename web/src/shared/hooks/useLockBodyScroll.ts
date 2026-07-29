import { useEffect } from 'react';

export const useLockBodyScroll = (locked = true): void => {
  useEffect(() => {
    if (!locked) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [locked]);
};
