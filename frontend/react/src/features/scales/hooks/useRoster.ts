import { useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { RosterView, ScenarioId } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; roster: RosterView };

export function useRoster(storeId: string, scenario: ScenarioId) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ roster: RosterView }>(`/scales/stores/${storeId}/roster?scenario=${scenario}`)
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', roster: response.roster });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [storeId, scenario]);

  return state;
}
