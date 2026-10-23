import { KpiCard } from '@/components/ui/KpiCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatBRL, formatPercent } from '@/lib/formatPtBr';
import type { SalesAnalysis, ScaleStore } from '../types';

type Props = { today: SalesAnalysis; next: SalesAnalysis; nextLabel: string; store: ScaleStore };

const money = (v: number | null) => (v === null ? 'sem venda que pague' : formatBRL(v));

export function SalesSection({ today, next, nextLabel, store }: Props) {
  const target = store.sales.payrollTargetRate;
  const reaches = next.payrollShare <= target;
  return (
    <section className="border-border bg-surface @container rounded-lg border p-5">
      <h3 className="font-display text-lg font-semibold">Vendas, CMV e folha</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Vendas informadas de {formatBRL(next.monthlySales)} por mês, CMV de{' '}
        {formatPercent(store.sales.cmvRate, 0)} e meta de folha de {formatPercent(target, 1)} das
        vendas.
      </p>
      <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-3">
        <KpiCard
          label="Folha sobre as vendas hoje"
          value={formatPercent(today.payrollShare)}
          detail={`Folha de ${formatBRL(today.payroll)}`}
        />
        <KpiCard
          label={`Folha sobre as vendas (${nextLabel})`}
          value={formatPercent(next.payrollShare)}
          detail={reaches ? 'Dentro da meta' : 'Acima da meta'}
          tone="highlight"
        />
        <KpiCard
          label="Sobra após mercadoria e folha"
          value={formatBRL(next.margin)}
          detail={`Hoje: ${formatBRL(today.margin)} (antes de aluguel, impostos e outras despesas)`}
        />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-xs">
            Venda mensal para pagar mercadoria e folha nova
          </dt>
          <dd className="font-bold tabular-nums">{money(next.breakEvenSales)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Venda mensal para a folha caber na meta</dt>
          <dd className="font-bold tabular-nums">
            {money(next.targetSales)}{' '}
            {next.growthToTarget !== null && next.growthToTarget > 0 ? (
              <StatusPill tone="warning">
                {formatPercent(next.growthToTarget, 0)} a mais que hoje
              </StatusPill>
            ) : (
              <StatusPill tone="ok">Já atinge</StatusPill>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
