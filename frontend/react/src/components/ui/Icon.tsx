import type { LucideIcon } from 'lucide-react';

// Ícones Lucide do guia: traço de 2 px e pontas arredondadas, 16 px em tabela, 20 px na interface e 24 px na
// navegação. Sempre na cor do texto ao lado (currentColor), nunca coloridos sozinhos.
type IconProps = { icon: LucideIcon; size?: 16 | 20 | 24; label?: string; className?: string };

export function Icon({ icon: Glyph, size = 20, label, className }: IconProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      className={className}
    />
  );
}
