import { cn } from '@/lib/cn';

type FormMessageProps = { tone: 'error' | 'success'; children: string };

export function FormMessage({ tone, children }: FormMessageProps) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md p-3 text-sm font-medium',
        tone === 'error' ? 'bg-critical-bg text-critical' : 'bg-positive-bg text-positive',
      )}
    >
      {children}
    </p>
  );
}
