import { cn } from '@/lib/cn';

export type CompareBar = { label: string; value: number; className: string };

// Barras horizontais com a mesma escala para comparar valores (ex.: folha hoje x nova).
export function BarCompare({
  bars,
  format,
}: {
  bars: CompareBar[];
  format: (n: number) => string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <ul className="space-y-3">
      {bars.map((bar) => (
        <li key={bar.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span>{bar.label}</span>
            <strong className="tabular-nums">{format(bar.value)}</strong>
          </div>
          <div className="bg-li-30 h-3 overflow-hidden rounded-full" aria-hidden="true">
            <div
              className={cn('h-full rounded-full', bar.className)}
              style={{ width: `${(bar.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
