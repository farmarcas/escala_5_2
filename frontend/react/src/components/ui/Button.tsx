import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

// Desenho do botão do Alquimia: azul sólido (primary), azul claro (secondary) e texto (ghost).
const buttonVariant = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled',
  secondary:
    'bg-accent text-primary-strong hover:bg-rp-50 active:bg-rp-100 disabled:bg-muted disabled:text-mi-70',
  ghost: 'text-primary-strong hover:bg-accent active:bg-rp-50 disabled:text-primary-disabled',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-wa-200',
} as const;

const buttonSize = {
  md: 'px-4 py-3 text-sm',
  sm: 'px-3 py-2 text-xs',
} as const;

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-bold transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none',
        buttonVariant[variant],
        buttonSize[size],
        className,
      )}
      {...rest}
    />
  );
}
