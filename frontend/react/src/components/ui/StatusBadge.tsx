import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const badgeTone = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-accent text-primary',
  warning: 'bg-warning-background text-warning',
} as const;

type StatusBadgeProps = {
  tone?: keyof typeof badgeTone;
  children: ReactNode;
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeTone[tone],
      )}
    >
      {children}
    </span>
  );
}
