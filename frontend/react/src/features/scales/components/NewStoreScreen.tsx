import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { apiFetch, errorMessage } from '@/lib/api';
import type { ScaleStore, ScaleStoreDraft } from '../types';
import { StoreForm } from './StoreForm';

export function NewStoreScreen() {
  const navigate = useNavigate();
  const [defaults, setDefaults] = useState<ScaleStoreDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ store: ScaleStoreDraft }>('/scales/defaults')
      .then((r) => isCurrent && setDefaults(r.store))
      .catch((e: unknown) => isCurrent && setError(errorMessage(e)));
    return () => {
      isCurrent = false;
    };
  }, [attempt]);

  const save = async (draft: ScaleStoreDraft) => {
    const { store } = await apiFetch<{ store: ScaleStore }>('/scales/stores', {
      method: 'POST',
      body: draft,
    });
    navigate(`/painel/lojas/${store.id}/diagnostico`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link to="/painel" className="text-primary-strong text-sm underline underline-offset-2">
          ← Minhas lojas
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nova loja</h1>
      </div>
      {error ? (
        <div className="flex flex-col items-start gap-3">
          <FormMessage tone="error">{error}</FormMessage>
          <Button
            onClick={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
          >
            Tentar de novo
          </Button>
        </div>
      ) : defaults ? (
        <StoreForm initial={defaults} isNew onSave={save} />
      ) : (
        <Skeleton className="h-64" />
      )}
    </div>
  );
}
