import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import { useStores } from '../hooks/useStores';
import type { Store } from '../types';
import { StoreListItem } from './StoreListItem';

export function StoresScreen() {
  const { state, reload, remove } = useStores();
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const deletion = useSubmit(async (store: Store) => {
    await remove(store.id);
    setStoreToDelete(null);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Minhas lojas</h1>
          <p className="text-muted-foreground text-sm">
            Cadastre cada loja com horário e equipe para simular o impacto por unidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/simulacao"
            className="border-border hover:bg-muted inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            Simular impacto
          </Link>
          <Link
            to="/lojas/nova"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
          >
            Cadastrar loja
          </Link>
        </div>
      </div>

      {state.status === 'loading' ? (
        <p role="status" className="text-muted-foreground text-sm">
          Carregando suas lojas…
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <FormMessage tone="error">{state.message}</FormMessage>
          <Button onClick={reload}>Tentar de novo</Button>
        </div>
      ) : null}

      {state.status === 'ready' && state.stores.length === 0 ? (
        <div className="bg-background border-border rounded-lg border p-6 text-center">
          <p className="font-medium">Você ainda não cadastrou nenhuma loja.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Comece pela primeira: informe o horário e a equipe e depois simule o impacto.
          </p>
        </div>
      ) : null}

      {state.status === 'ready' && state.stores.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {state.stores.map((store) => (
            <StoreListItem
              key={store.id}
              store={store}
              onDelete={(target) => {
                deletion.clearError();
                setStoreToDelete(target);
              }}
            />
          ))}
        </ul>
      ) : null}

      <Modal
        isOpen={storeToDelete !== null}
        title="Remover loja?"
        onClose={() => setStoreToDelete(null)}
      >
        <p className="text-sm">
          A loja <strong>{storeToDelete?.name}</strong> deixa de aparecer na lista e nas próximas
          simulações. Simulações já salvas não mudam.
        </p>
        {deletion.error ? (
          <div className="mt-3">
            <FormMessage tone="error">{deletion.error}</FormMessage>
          </div>
        ) : null}
        <div className="mt-4 flex gap-3">
          <Button
            disabled={deletion.isSubmitting}
            onClick={() => storeToDelete && void deletion.submit(storeToDelete)}
          >
            {deletion.isSubmitting ? 'Removendo…' : 'Remover'}
          </Button>
          <Button variant="secondary" onClick={() => setStoreToDelete(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
