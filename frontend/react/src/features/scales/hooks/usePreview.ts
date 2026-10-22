import { useEffect, useState } from 'react';
import { ApiError, apiFetch, errorMessage } from '@/lib/api';
import type { Diagnostic, ScaleStoreDraft } from '../types';

export type FieldErrors = Record<string, string>;

export type PreviewState =
  | { status: 'loading' }
  | { status: 'ready'; diagnostic: Diagnostic }
  | { status: 'invalid'; errors: FieldErrors }
  | { status: 'error'; message: string };

const DEBOUNCE_MS = 400;

export const fieldErrorsOf = (error: unknown): FieldErrors => {
  const out: FieldErrors = {};
  if (error instanceof ApiError) {
    for (const detail of error.details) {
      if (detail.path !== undefined && detail.message && !(detail.path in out)) {
        out[detail.path] = detail.message;
      }
    }
  }
  return out;
};

// Recalcula o diagnóstico enquanto a pessoa digita (espera 400 ms de pausa). Dados incompletos viram erros por campo.
export function usePreview(draft: ScaleStoreDraft | null): PreviewState {
  const [state, setState] = useState<PreviewState>({ status: 'loading' });

  useEffect(() => {
    if (!draft) return;
    let isCurrent = true;
    const timer = setTimeout(() => {
      apiFetch<{ diagnostic: Diagnostic }>('/scales/preview', { method: 'POST', body: draft })
        .then((response) => {
          if (isCurrent) setState({ status: 'ready', diagnostic: response.diagnostic });
        })
        .catch((error: unknown) => {
          if (!isCurrent) return;
          if (error instanceof ApiError && error.status === 400) {
            setState({ status: 'invalid', errors: fieldErrorsOf(error) });
          } else {
            setState({ status: 'error', message: errorMessage(error) });
          }
        });
    }, DEBOUNCE_MS);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [draft]);

  return state;
}
