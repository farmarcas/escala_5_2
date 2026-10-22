import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import { useScaleStores } from '../hooks/useScaleStores';
import type { ScaleStoreSummary } from '../types';

const newStoreLink =
  'bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-bold';

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
          <h1 className="text-2xl font-bold">Painel de Escalas 5x2</h1>
          <p className="text-muted-foreground text-sm">
            Veja quantas pessoas cada loja precisa e quanto custa a nova escala.
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
          title="Você ainda não cadastrou nenhuma loja"
          description="Cadastre a primeira loja com horário e equipe. Começamos com uma loja de exemplo para você só ajustar."
          action={
            <Link to="/painel/lojas/nova" className={newStoreLink}>
              Cadastrar a primeira loja
            </Link>
          }
        />
      ) : null}

      {state.status === 'ready' && state.stores.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {state.stores.map((store) => (
            <li
              key={store.id}
              className="border-border bg-background flex flex-col gap-3 rounded-lg border p-4"
            >
              <div>
                <h2 className="font-bold">{store.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {store.city}/{store.state} · {store.people}{' '}
                  {store.people === 1 ? 'pessoa' : 'pessoas'} hoje
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/painel/lojas/${store.id}/diagnostico`}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex items-center rounded-md px-3 py-2 text-xs font-bold"
                >
                  Abrir
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void copy.submit(store)}
                  disabled={copy.isSubmitting}
                >
                  Duplicar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setToDelete(store)}>
                  Excluir
                </Button>
              </div>
            </li>
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
