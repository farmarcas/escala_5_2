import { useCallback, useEffect, useState } from 'react';
import type { Premises } from '@/lib/premisesTypes';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; premises: Premises };

export function useDefaultPremises() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/v1/premises/defaults', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Premises>;
      })
      .then((premises) => setState({ status: 'ready', premises }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  return { state, retry };
}
