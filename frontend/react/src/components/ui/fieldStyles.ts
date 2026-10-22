import { cn } from '@/lib/cn';

// Desenho do campo do Alquimia: borda cinza, cantos arredondados, texto pequeno e borda azul no foco.
export const fieldControlClass = (hasError: boolean) =>
  cn(
    'border-input bg-background text-foreground w-full rounded-lg border p-3 text-sm transition-all',
    'placeholder:text-muted-foreground',
    'focus-visible:border-primary focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none',
    'disabled:border-mi-70 disabled:bg-muted disabled:text-mi-70',
    'aria-invalid:border-destructive',
    hasError && 'border-destructive',
  );
