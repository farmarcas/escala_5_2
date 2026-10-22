import { useOutletContext } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import type { ScaleStore, ScaleStoreDraft } from '../types';
import { StoreForm } from './StoreForm';

export type PanelContext = { store: ScaleStore; reload: () => void };

export function StoreDataTab() {
  const { store, reload } = useOutletContext<PanelContext>();
  const { id: _id, createdAt: _c, updatedAt: _u, ...draft } = store;

  const save = async (next: ScaleStoreDraft) => {
    await apiFetch(`/scales/stores/${store.id}`, { method: 'PUT', body: next });
    reload();
  };

  return <StoreForm key={store.updatedAt} initial={draft} isNew={false} onSave={save} />;
}
