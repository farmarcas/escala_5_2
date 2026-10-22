import { describeTotals, type Metric } from '../describeResult';
import type { DetailedResult, RegimeKind } from '../types';

type GroupTotalsProps = { result: DetailedResult; regime: RegimeKind };

function MetricCard({ label, value, caption }: Metric) {
  return (
    <div className="bg-muted rounded-md p-4">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
      {caption ? <p className="text-muted-foreground mt-1 text-xs">{caption}</p> : null}
    </div>
  );
}

export function GroupTotals({ result, regime }: GroupTotalsProps) {
  return (
    <section
      className="bg-background border-border flex flex-col gap-3 rounded-lg border p-5"
      aria-labelledby="totais-titulo"
    >
      <h2 id="totais-titulo" className="text-lg font-semibold">
        Total do grupo
      </h2>
      <dl aria-live="polite" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {describeTotals(result, regime).map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </dl>
      <p className="text-muted-foreground text-xs">
        Como não se contrata uma fração de pessoa, o total do grupo pode diferir da estimativa do
        modo rápido, que trabalha com médias.
      </p>
    </section>
  );
}
