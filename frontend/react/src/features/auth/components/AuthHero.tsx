import type { ReactNode } from 'react';

// Entrada no formato do guia: painel escuro com a promessa do produto (só no computador) e o formulário ao lado.
export function AuthHero({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 lg:grid-cols-2">
      <aside
        aria-hidden="true"
        className="bg-n-900 hidden flex-col justify-end gap-5 rounded-lg p-10 text-white lg:flex"
      >
        <h2 className="font-display text-[44px] leading-[1.06] font-extrabold tracking-tight">
          A escala muda. <span className="text-brand">O controle continua seu.</span>
        </h2>
        <p className="text-n-300 max-w-sm text-base leading-relaxed">
          Veja, loja por loja, quantos colaboradores, quais turnos e qual custo a escala 5x2 vai
          exigir. Antes da mudança chegar.
        </p>
      </aside>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
