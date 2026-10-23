import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import { useScaleStores } from '../hooks/useScaleStores';
import type { ScaleStoreSummary } from '../types';
import { StoreCard } from './StoreCard';

const newStoreLink = buttonStyles({});

export function StoresHome() {
  const navigate = useNavigate();
  const { state, reload, remove, duplicate } = useScaleStores();
  const [toDelete, setToDelete] = useState<ScaleStoreSummary | null>(null);
  const deletion = useSubmit(async (store: ScaleStoreSummary) => {
    await remove(store.id);
    setToDelete(null);
  });
  const copy = useSubmit(async (store: ScaleStoreSummary) => {
    const created = await duplicate(store.id);
    navigate(`/painel/lojas/${created.id}/dados`);
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[32px] leading-10 font-extrabold tracking-tight">
            Suas lojas
          </h1>
          <p className="text-muted-foreground text-sm">
            Veja quantos colaboradores cada loja precisa na escala 5x2 e quanto isso custa por mês.
          </p>
        </div>
        <Link to="/painel/lojas/nova" className={newStoreLink}>
          Nova loja
        </Link>
      </div>

      {state.status === 'loading' ? (
        <div role="status" aria-label="Carregando suas lojas" className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <FormMessage tone="error">{state.message}</FormMessage>
          <Button onClick={reload}>Tentar de novo</Button>
        </div>
      ) : null}

      {copy.error ? <FormMessage tone="error">{copy.error}</FormMessage> : null}

      {state.status === 'ready' && state.stores.length === 0 ? (
        <EmptyState
          title="Cadastre sua primeira loja"
          description="Com o horário e o quadro atual, já dá para ver o resultado na 5x2. Começamos com uma loja de exemplo para você só ajustar."
          action={
            <Link to="/painel/lojas/nova" className={newStoreLink}>
              Cadastrar loja
            </Link>
          }
        />
      ) : null}

      {state.status === 'ready' && state.stores.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {state.stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              busy={copy.isSubmitting}
              onDuplicate={() => void copy.submit(store)}
              onDelete={() => setToDelete(store)}
            />
          ))}
        </ul>
      ) : null}

      <Modal isOpen={toDelete !== null} title="Excluir loja" onClose={() => setToDelete(null)}>
        <p className="text-sm">
          Excluir <strong>{toDelete?.name}</strong>? A loja sai da sua lista e não aparece mais no
          painel.
        </p>
        {deletion.error ? <FormMessage tone="error">{deletion.error}</FormMessage> : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={deletion.isSubmitting}
            onClick={() => toDelete && void deletion.submit(toDelete)}
          >
            Excluir loja
          </Button>
        </div>
      </Modal>
    </div>
  );
}
