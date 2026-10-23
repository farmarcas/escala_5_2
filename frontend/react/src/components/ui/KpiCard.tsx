import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ScenarioTag } from './ScenarioTag';

type KpiCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'highlight';
};

// Número único com rótulo (Número KPI do guia: Plex 600, 40/44, tabular).
export function KpiCard({ label, value, detail, tone = 'default' }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        tone === 'highlight' ? 'border-blue-turn bg-selected' : 'border-border bg-surface',
      )}
    >
      <p className="text-secondary-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="mt-1 text-[28px] leading-9 font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {detail ? <p className="text-secondary-foreground mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}

type ComparisonKpiProps = {
  label: string;
  now: ReactNode;
  next: ReactNode;
  // Variação escrita por extenso, com sinal e unidade. Neutra para custo e quadro (planejamento, não problema).
  delta: ReactNode;
  detail?: ReactNode;
  nextLabel?: string;
};

// Antes e depois lado a lado, sempre nesta ordem: atual primeiro, 5x2 em seguida.
export function ComparisonKpi({ label, now, next, delta, detail, nextLabel }: ComparisonKpiProps) {
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <p className="text-secondary-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <ScenarioTag scenario="now" />
          <span className="text-secondary-foreground text-xl font-semibold tabular-nums">
            {now}
          </span>
        </div>
        <span aria-hidden="true" className="text-muted-foreground pb-1">
          →
        </span>
        <div className="flex flex-col gap-1">
          <ScenarioTag scenario="next" label={nextLabel} />
          <span className="text-[28px] leading-8 font-semibold tracking-tight tabular-nums">
            {next}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums">{delta}</p>
      {detail ? <p className="text-secondary-foreground mt-0.5 text-xs">{detail}</p> : null}
    </div>
  );
}
