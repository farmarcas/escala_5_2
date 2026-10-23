import { cn } from '@/lib/cn';

export type BarPart = { label: string; value: number; className: string };

// Barra empilhada só com CSS. A legenda e o texto alternativo trazem os números.
export function StackedBar({ parts, format }: { parts: BarPart[]; format: (n: number) => string }) {
  const total = parts.reduce((n, p) => n + p.value, 0);
  const description = parts.map((p) => `${p.label}: ${format(p.value)}`).join('; ');
  return (
    <div>
      <div
        role="img"
        aria-label={description}
        className="bg-border flex h-3 overflow-hidden rounded-full"
      >
        {parts.map((p) => (
          <div
            key={p.label}
            className={p.className}
            style={{ width: `${total > 0 ? (p.value / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <ul className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-sm', p.className)} />
            {p.label}: <strong className="text-foreground tabular-nums">{format(p.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
