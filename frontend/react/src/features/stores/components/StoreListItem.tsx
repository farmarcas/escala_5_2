import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PROFILE_LABELS, ROLE_LABELS } from '../storeForm';
import type { Store } from '../types';

type StoreListItemProps = {
  store: Store;
  onDelete: (store: Store) => void;
};

export function StoreListItem({ store, onDelete }: StoreListItemProps) {
  const people = store.roles.reduce((sum, role) => sum + role.headcount, 0);

  return (
    <li className="bg-background border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{store.name}</h3>
          <StatusBadge>{PROFILE_LABELS[store.profile]}</StatusBadge>
        </div>
        <p className="text-muted-foreground text-sm">
          {store.city} · {store.openingHours.length} dia(s) por semana · {people} pessoa(s)
        </p>
        <p className="text-muted-foreground text-xs">
          {store.roles.map((role) => `${ROLE_LABELS[role.role]}: ${role.headcount}`).join(' · ')}
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/lojas/${store.id}`}
          className="border-border hover:bg-muted inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          Editar
        </Link>
        <Button variant="secondary" size="sm" onClick={() => onDelete(store)}>
          Remover
        </Button>
      </div>
    </li>
  );
}
