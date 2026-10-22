import { useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Store } from '../types';

type State =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; store: Store };

export function useStore(id: string) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ store: Store }>(`/stores/${id}`)
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', store: response.store });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [id]);

  return state;
}
