import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type KpiCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'highlight';
};

export function KpiCard({ label, value, detail, tone = 'default' }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        tone === 'highlight' ? 'border-primary bg-accent' : 'border-border bg-background',
      )}
    >
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {detail ? <p className="text-muted-foreground mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}
