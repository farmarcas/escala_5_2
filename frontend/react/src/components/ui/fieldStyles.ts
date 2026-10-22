import { cn } from '@/lib/cn';

export const fieldControlClass = (hasError: boolean) =>
  cn(
    'border-border bg-background text-foreground w-full rounded-md border px-3 py-2 text-base',
    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
    'aria-invalid:border-destructive',
    hasError && 'border-destructive',
  );
