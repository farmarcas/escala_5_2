import { formatDelta, formatInt, formatSignedBRL } from '@/lib/formatPtBr';

type Props = {
  fill: number;
  effect: number;
  fillMonthly: number;
  effectMonthly: number;
  label: string;
};

const people = (n: number) => formatDelta(n, Math.abs(n) === 1 ? 'pessoa' : 'pessoas');

// Separa o que a loja já precisa para cobrir o horário hoje do que a mudança para a 5x2 acrescenta.
export function SplitSummary({ fill, effect, fillMonthly, effectMonthly, label }: Props) {
  return (
    <section
      aria-label="De onde vem o resultado"
      className="border-border bg-surface rounded-lg border p-5"
    >
      <h3 className="font-display text-lg font-semibold">De onde vem esse resultado</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-secondary-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            Para cobrir o horário hoje
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {people(fill)}{' '}
            <span className="text-secondary-foreground text-base">
              · {formatSignedBRL(fillMonthly)}/mês
            </span>
          </p>
          <p className="text-secondary-foreground mt-1 text-sm">
            {fill > 0
              ? 'Falta gente para manter o mínimo no salão em todo o horário, mesmo na escala atual (6x1). Esse custo existe com ou sem a nova escala.'
              : 'A equipe de hoje já cobre o horário e o mínimo no salão na escala atual.'}
          </p>
        </div>
        <div>
          <p className="text-secondary-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
            Efeito só da nova escala ({label})
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {people(effect)}{' '}
            <span className="text-secondary-foreground text-base">
              · {formatSignedBRL(effectMonthly)}/mês
            </span>
          </p>
          <p className="text-secondary-foreground mt-1 text-sm">
            {effect === 0
              ? 'Mudar de 6x1 para 5x2 não muda o número de pessoas para esta loja.'
              : effect > 0
                ? 'Gente a mais que a mudança de 6x1 para 5x2 exige.'
                : 'A 5x2 pede menos gente que a escala atual para cobrir o mesmo horário.'}
          </p>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        As duas partes somam o total de {formatInt(fill + effect)}{' '}
        {fill + effect === 1 ? 'pessoa' : 'pessoas'} a contratar.
      </p>
    </section>
  );
}
