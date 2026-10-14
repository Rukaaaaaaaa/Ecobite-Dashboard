import { useCallback, useEffect, useState } from 'react';

/** Counts down whole seconds. `start(n)` (re)starts it. */
export function useCountdown(): { seconds: number; start: (n: number) => void; label: string } {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  const start = useCallback((n: number) => setSeconds(n), []);
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return { seconds, start, label };
}
