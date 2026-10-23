import { cn } from '@/lib/cn';

// Símbolo do Radar Escala: anel de 5 blocos de turno (dias trabalhados), 2 pontos (as folgas da semana),
// agulha e rastro da varredura (a simulação) e o centro (a loja). Abaixo de 24 px usa-se `simples`, sem agulha.

export type SymbolTone = 'auto' | 'cor' | 'escuro' | 'preto' | 'branco';

type SymbolProps = {
  tone?: SymbolTone;
  simples?: boolean;
  size?: number;
  className?: string;
  title?: string;
};

const BLOCKS = [
  'M37.59 10.72A22 22 0 0 1 45.15 14.36',
  'M52.12 23.1A22 22 0 0 1 53.99 31.29',
  'M51.5 42.18A22 22 0 0 1 46.27 48.75',
  'M36.2 53.6A22 22 0 0 1 27.8 53.6',
  'M17.73 48.75A22 22 0 0 1 12.5 42.18',
];

const INK: Record<SymbolTone, string> = {
  auto: 'var(--fg)',
  cor: '#050505',
  escuro: '#ffffff',
  preto: '#050505',
  branco: '#ffffff',
};

export function Symbol({ tone = 'auto', simples, size, className, title }: SymbolProps) {
  const ink = INK[tone];
  const mono = tone === 'preto' || tone === 'branco';
  const blocks = mono ? ink : '#ff5510';
  const full = !(simples ?? (size !== undefined && size < 24));
  const trail = tone === 'escuro' ? 0.32 : 0.22;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('block shrink-0 overflow-visible', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {full && !mono ? (
        <path d="M32 32L28.38 18.48A14 14 0 0 1 41.9 22.1Z" fill="#ff5510" fillOpacity={trail} />
      ) : null}
      <g fill="none" stroke={blocks} strokeWidth={8} strokeLinecap="round">
        {BLOCKS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx="10.55" cy="27.1" r="4" fill={ink} />
      <circle cx="22.45" cy="12.18" r="4" fill={ink} />
      {full ? (
        <path d="M32 32L41.9 22.1" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />
      ) : null}
      <circle cx="32" cy="32" r="4" fill={ink} />
    </svg>
  );
}
