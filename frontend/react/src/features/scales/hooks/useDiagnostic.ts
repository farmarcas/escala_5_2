import { useEffect, useState } from 'react';
import { apiFetch, errorMessage } from '@/lib/api';
import type { Diagnostic } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; diagnostic: Diagnostic };

// Diagnóstico de uma loja salva. Quem usa troca a `key` da tela para recalcular depois de editar.
export type DiagnosticOptions = { regime: 'simples' | 'lucro_presumido_real'; provisions: boolean };

export function useDiagnostic(storeId: string, options: DiagnosticOptions) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ diagnostic: Diagnostic }>(
      `/scales/stores/${storeId}/diagnostic?regime=${options.regime}&provisions=${options.provisions}`,
    )
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', diagnostic: response.diagnostic });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [storeId, options.regime, options.provisions]);

  return state;
}
