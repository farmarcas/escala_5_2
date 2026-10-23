import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

// Status em pílula, nos quatro tons semânticos do guia. A cor nunca vai sozinha: o texto diz o estado.
const tones = {
  neutral: 'bg-muted text-muted-foreground',
  ok: 'bg-positive-bg text-positive',
  warning: 'bg-warning-background text-warning',
  danger: 'bg-critical-bg text-critical',
  info: 'bg-info-bg text-info',
} as const;

export function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
