import { useCallback, useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { SavedSimulation } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; simulation: SavedSimulation };

export function useSavedSimulation(id: string) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ simulation: SavedSimulation }>(`/simulations/${id}`)
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', simulation: response.simulation });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [id, attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  return { state, reload };
}
