// Hook personalizado para detectar triple click
import { useEffect, useState } from 'react';

export const useTripleClick = (callback, delay = 500) => {
  const [clickCount, setClickCount] = useState(0);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    const handleTripleClick = () => {
      const newCount = clickCount + 1;
      setClickCount(newCount);

      if (timer) clearTimeout(timer);

      if (newCount === 3) {
        callback();
        setClickCount(0);
      } else {
        const newTimer = setTimeout(() => {
          setClickCount(0);
        }, delay);
        setTimer(newTimer);
      }
    };

    window.addEventListener('click', handleTripleClick);
    return () => {
      window.removeEventListener('click', handleTripleClick);
      if (timer) clearTimeout(timer);
    };
  }, [clickCount, timer, callback, delay]);
};