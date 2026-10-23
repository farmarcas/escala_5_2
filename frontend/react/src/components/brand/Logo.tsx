import farmarcas from '@/assets/brand/farmarcas-logo.svg';
import farmarcasWhite from '@/assets/brand/farmarcas-logo-white.svg';
import { cn } from '@/lib/cn';
import { Symbol, type SymbolTone } from './Symbol';

type LogoProps = {
  // Cor do texto e do símbolo: `auto` segue o tema; `branco` e `preto` são monocromáticos.
  tone?: SymbolTone;
  // Altura do símbolo em px; o texto acompanha (altura do símbolo × 0,62).
  size?: number;
  // Versão endossada: logotipo mais "uma solução" e o logotipo da Farmarcas (entrada e materiais externos).
  endorsed?: boolean;
  className?: string;
};

// "Radar" em Rubik Medium e o nome do produto em ExtraBold, com espaço de 0,24 em entre as palavras.
export function Logo({ tone = 'auto', size = 28, endorsed, className }: LogoProps) {
  const color =
    tone === 'branco' || tone === 'escuro' ? '#ffffff' : tone === 'auto' ? 'var(--fg)' : '#050505';
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2.5" style={{ color }}>
        <Symbol tone={tone} size={size} />
        <span
          className="flex font-display leading-none"
          style={{ fontSize: size * 0.64, gap: '0.24em', letterSpacing: '-0.02em' }}
        >
          <span className="font-medium">Radar</span>
          <span className="font-extrabold">Escala</span>
        </span>
      </div>
      {endorsed ? (
        <>
          <span aria-hidden="true" className="h-8 w-px bg-input" />
          <span className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px]">uma solução</span>
            {tone === 'auto' ? (
              <>
                <img src={farmarcas} alt="Farmarcas" className="-ml-1.5 h-5 w-auto dark:hidden" />
                <img
                  src={farmarcasWhite}
                  alt="Farmarcas"
                  className="-ml-1.5 hidden h-5 w-auto dark:block"
                />
              </>
            ) : (
              <img
                src={tone === 'branco' || tone === 'escuro' ? farmarcasWhite : farmarcas}
                alt="Farmarcas"
                className="-ml-1.5 h-5 w-auto"
              />
            )}
          </span>
        </>
      ) : null}
    </div>
  );
}
