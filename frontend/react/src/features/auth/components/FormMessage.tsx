import { cn } from '@/lib/cn';

type FormMessageProps = { tone: 'error' | 'success'; children: string };

export function FormMessage({ tone, children }: FormMessageProps) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md p-3 text-sm',
        tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-primary',
      )}
    >
      {children}
    </p>
  );
}
