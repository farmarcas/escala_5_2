import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

// Botões do guia: primário (um por tela), secundário, contorno, discreto e perigo.
// Alturas de 44 (padrão), 36 e 32 px; raio de 8 px; foco com contorno laranja e halo.
const buttonVariant = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground',
  secondary:
    'bg-accent text-primary-strong hover:bg-halo active:bg-halo disabled:bg-muted disabled:text-muted-foreground',
  outline:
    'border border-input bg-transparent text-foreground hover:bg-muted active:bg-muted disabled:text-muted-foreground',
  ghost: 'text-primary-strong hover:bg-accent active:bg-accent disabled:text-muted-foreground',
  danger:
    'bg-danger text-primary-foreground hover:bg-danger-hover active:bg-danger-hover disabled:bg-danger-disabled',
} as const;

const buttonSize = {
  lg: 'h-11 px-5 text-sm',
  md: 'h-9 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof buttonVariant;
  size?: keyof typeof buttonSize;
};

type ButtonProps = ComponentPropsWithoutRef<'button'> & ButtonStyleProps;

// Mesmo desenho para botão e para link com cara de botão (rota ou arquivo para baixar).
export const buttonStyles = (
  { variant = 'primary', size = 'lg' }: ButtonStyleProps,
  className?: string,
) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors',
    'focus-visible:ring-halo focus-visible:ring-4 focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none',
    buttonVariant[variant],
    buttonSize[size],
    className,
  );

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size }, className)} {...rest} />;
}
