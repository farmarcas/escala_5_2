import { StatusBadge } from '@/components/ui/StatusBadge';
import { describeQuickResult, type Metric } from '@/lib/describeQuickResult';
import { formatBRL } from '@/lib/formatPtBr';
import type { QuickResult } from '@/lib/quickImpact';

type ImpactResultProps = {
  result: QuickResult;
  presumidoLimit: number;
};

function MetricCard({ label, value, caption }: Metric) {
  return (
    <div className="bg-muted rounded-md p-4">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
      {caption ? <p className="text-muted-foreground mt-1 text-xs">{caption}</p> : null}
    </div>
  );
}

export function ImpactResult({ result, presumidoLimit }: ImpactResultProps) {
  const view = describeQuickResult(result);

  return (
    <section
      className="bg-background border-border flex flex-col gap-4 rounded-lg border p-5"
      aria-labelledby="resultado-titulo"
    >
      <h2 id="resultado-titulo" className="text-lg font-semibold">
        Impacto anual direto estimado
      </h2>

      {result.presumidoOverLimit ? (
        <p role="alert" className="bg-warning-background text-warning rounded-md p-3 text-sm">
          O Lucro Presumido só é permitido até {formatBRL(presumidoLimit)} de receita anual. Confira
          o enquadramento fiscal real do grupo antes de usar este regime.
        </p>
      ) : null}

      {!result.hasImpact ? (
        <p role="status" className="bg-accent text-primary-strong rounded-md p-4 text-sm">
          Nenhum colaborador está em escala 6x1 com os dados informados, então não há impacto
          estimado. Ajuste o percentual para simular outro cenário.
        </p>
      ) : (
        <div aria-live="polite" className="flex flex-col gap-4">
          <div className="bg-accent rounded-md p-4">
            <p className="text-muted-foreground text-xs font-medium">{view.headline.label}</p>
            <p className="text-primary-strong mt-1 text-2xl font-bold">{view.headline.value}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Faixa entre o cenário mais leve e o mais pesado, conforme a cobertura de equipe.
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {view.metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </dl>

          <p className="text-muted-foreground text-xs">
            {view.headline.caption} <StatusBadge tone="neutral">Estimativa</StatusBadge>
          </p>
        </div>
      )}
    </section>
  );
}
