import { useCallback, useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Store, StoreListResponse } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; stores: Store[] };

export function useStores() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    apiFetch<StoreListResponse>('/stores?page=1&pageSize=100')
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', stores: response.data });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await apiFetch(`/stores/${id}`, { method: 'DELETE' });
      reload();
    },
    [reload],
  );

  return { state, reload, remove };
}
