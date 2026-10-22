import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-muted text-muted-foreground',
  ok: 'bg-su-50 text-su-700',
  warning: 'bg-warning-background text-warning',
  danger: 'bg-wa-50 text-wa-500',
  info: 'bg-accent text-primary-strong',
} as const;

// A cor nunca vai sozinha: o texto diz o estado (acessível para quem não distingue cores).
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
