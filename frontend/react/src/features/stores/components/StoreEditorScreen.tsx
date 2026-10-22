import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useStore } from '../hooks/useStore';
import { emptyStoreForm, storeToForm } from '../storeForm';
import type { StoreRequest } from '../types';
import { StoreForm } from './StoreForm';

type StoreEditorScreenProps = { storeId?: string };

function EditStore({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const state = useStore(storeId);

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Carregando a loja…
      </p>
    );
  }
  if (state.status === 'error') return <FormMessage tone="error">{state.message}</FormMessage>;

  return (
    <StoreForm
      initialValues={storeToForm(state.store)}
      submitLabel="Salvar alterações"
      onSubmit={async (request: StoreRequest) => {
        await apiFetch(`/stores/${storeId}`, { method: 'PATCH', body: request });
        navigate('/lojas');
      }}
      onCancel={() => navigate('/lojas')}
    />
  );
}

function NewStore() {
  const navigate = useNavigate();
  return (
    <StoreForm
      initialValues={emptyStoreForm()}
      submitLabel="Cadastrar loja"
      onSubmit={async (request: StoreRequest) => {
        await apiFetch('/stores', { method: 'POST', body: request });
        navigate('/lojas');
      }}
      onCancel={() => navigate('/lojas')}
    />
  );
}

export function StoreEditorScreen({ storeId }: StoreEditorScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{storeId ? 'Editar loja' : 'Cadastrar loja'}</h1>
      {storeId ? <EditStore key={storeId} storeId={storeId} /> : <NewStore />}
    </div>
  );
}
