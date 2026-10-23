import { Link } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatHours } from '@/lib/formatPtBr';
import type { ScaleStoreSummary } from '../types';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAY_STATE = { open: 'aberta', reduced: 'horário reduzido', closed: 'fechada' } as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase();

// Sete segmentos, um por dia: aberta em Azul Turno, horário reduzido em tom claro e fechada em neutro.
function WeekBar({ days }: { days: ScaleStoreSummary['days'] }) {
  const label = days.map((d, i) => `${DAYS[i]}: ${DAY_STATE[d]}`).join(', ');
  return (
    <div role="img" aria-label={label} className="flex gap-1">
      {days.map((d, i) => (
        <span
          key={DAYS[i]}
          className={cn(
            'h-2 flex-1 rounded-full',
            d === 'open' && 'bg-scenario-5x2',
            d === 'reduced' && 'bg-selected border-scenario-5x2 border',
            d === 'closed' && 'bg-border',
          )}
        />
      ))}
    </div>
  );
}

type StoreCardProps = {
  store: ScaleStoreSummary;
  busy: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function StoreCard({ store, busy, onDuplicate, onDelete }: StoreCardProps) {
  return (
    <li className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-selected text-selected-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
        >
          {initials(store.name)}
        </span>
        <div className="min-w-0">
          <h2 className="font-display truncate text-lg leading-6 font-semibold">{store.name}</h2>
          <p className="text-secondary-foreground text-sm">
            {store.city}/{store.state}
          </p>
        </div>
      </div>
      <WeekBar days={store.days} />
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-secondary-foreground text-xs">Funcionamento</dt>
          <dd className="font-semibold tabular-nums">{formatHours(store.weeklyHours)}/sem</dd>
        </div>
        <div>
          <dt className="text-secondary-foreground text-xs">Colaboradores hoje</dt>
          <dd className="font-semibold tabular-nums">{store.people}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link to={`/painel/lojas/${store.id}/diagnostico`} className={buttonStyles({ size: 'md' })}>
          Ver resultado
        </Link>
        <Button size="md" variant="outline" onClick={onDuplicate} disabled={busy}>
          Duplicar
        </Button>
        <Button size="md" variant="ghost" onClick={onDelete}>
          Excluir
        </Button>
      </div>
    </li>
  );
}
