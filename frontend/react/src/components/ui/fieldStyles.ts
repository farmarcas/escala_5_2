import { cn } from '@/lib/cn';

// Campo do guia: borda de 1 px, raio de 8 px, foco com contorno laranja e halo Laranja 100.
export const fieldControlClass = (hasError: boolean) =>
  cn(
    'border-input bg-surface text-foreground min-h-11 w-full rounded-md border px-3 py-2 text-sm transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:border-ring focus-visible:ring-halo focus-visible:ring-4 focus-visible:outline-none',
    'disabled:bg-muted disabled:text-muted-foreground',
    'aria-invalid:border-critical',
    hasError && 'border-critical',
  );
