import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (v: T | ((prev: T | null) => T | null)) => void;
}

const messageOf = (e: unknown): string => (e instanceof Error ? e.message : 'Có lỗi xảy ra. Thử lại sau.');

/** Runs `fn` on mount and whenever `deps` change; ignores answers from stale runs. */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const run = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const id = ++run.current;
    setLoading(true);
    setError(null);
    fnRef.current().then(
      (v) => {
        if (id !== run.current) return;
        setData(v);
        setLoading(false);
      },
      (e: unknown) => {
        if (id !== run.current) return;
        setError(messageOf(e));
        setLoading(false);
      },
    );
    return () => {
      run.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}

export const errorMessage = messageOf;
