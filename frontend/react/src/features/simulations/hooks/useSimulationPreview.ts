import { useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { PreviewRequest, PreviewResponse } from '../types';

const DEBOUNCE_MS = 300;

type State = { key: string; data: PreviewResponse | null; error: string | null };

// Recalcula na API ~300 ms depois da última mudança e mantém o resultado anterior na tela enquanto espera.
export function useSimulationPreview(request: PreviewRequest) {
  const key = JSON.stringify(request);
  const [state, setState] = useState<State>({ key: '', data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      apiFetch<PreviewResponse>('/simulations/preview', {
        method: 'POST',
        body: JSON.parse(key) as PreviewRequest,
      })
        .then((data) => {
          if (isCurrent) setState({ key, data, error: null });
        })
        .catch((error: unknown) => {
          if (isCurrent)
            setState((current) => ({ key, data: current.data, error: errorMessage(error) }));
        });
    }, DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [key, attempt]);

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    isLoading: state.key !== key,
    retry: () => setAttempt((current) => current + 1),
  };
}
