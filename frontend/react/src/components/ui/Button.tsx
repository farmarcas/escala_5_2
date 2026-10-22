import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

const buttonVariant = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-border bg-background text-foreground hover:bg-muted',
  ghost: 'text-primary hover:bg-accent',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
} as const;

const buttonSize = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-sm',
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
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariant[variant],
        buttonSize[size],
        className,
      )}
      {...rest}
    />
  );
}
