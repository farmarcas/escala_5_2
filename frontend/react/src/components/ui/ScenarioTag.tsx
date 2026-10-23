import { cn } from '@/lib/cn';

// Etiqueta quadrada do cenário, na mesma cor do gráfico: atual em grafite, 5x2 em Azul Turno.
const SCENARIO = {
  now: { label: 'Atual', swatch: 'bg-scenario-now' },
  next: { label: '5x2', swatch: 'bg-scenario-5x2' },
} as const;

type ScenarioTagProps = { scenario: keyof typeof SCENARIO; label?: string; className?: string };

export function ScenarioTag({ scenario, label, className }: ScenarioTagProps) {
  const s = SCENARIO[scenario];
  return (
    <span
      className={cn(
        'text-secondary-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-[2px]', s.swatch)} />
      {label ?? s.label}
    </span>
  );
}
