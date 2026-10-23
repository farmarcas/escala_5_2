import { useCallback, useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { ScaleStore, ScaleStoreSummary } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; stores: ScaleStoreSummary[] };

export function useScaleStores() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ data: ScaleStoreSummary[] }>('/scales/stores')
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
    setAttempt((n) => n + 1);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await apiFetch(`/scales/stores/${id}`, { method: 'DELETE' });
      reload();
    },
    [reload],
  );

  const duplicate = useCallback(
    async (id: string) => {
      const { store } = await apiFetch<{ store: ScaleStore }>(`/scales/stores/${id}/duplicate`, {
        method: 'POST',
      });
      reload();
      return store;
    },
    [reload],
  );

  return { state, reload, remove, duplicate };
}
