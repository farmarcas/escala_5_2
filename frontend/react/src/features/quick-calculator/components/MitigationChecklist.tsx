import { Checkbox } from '@/components/ui/Checkbox';
import { formatBRLCompact, formatPercent } from '@/lib/formatPtBr';
import type { MitigationAction } from '@/lib/premisesTypes';
import type { QuickResult } from '@/lib/quickImpact';

type MitigationChecklistProps = {
  actions: MitigationAction[];
  markedIds: Set<string>;
  result: QuickResult;
  onToggle: (id: string) => void;
};

export function MitigationChecklist({
  actions,
  markedIds,
  result,
  onToggle,
}: MitigationChecklistProps) {
  const { mitigation } = result;
  const residualWidth = Math.round((1 - mitigation.current) * 100);

  return (
    <section
      className="bg-background border-border flex flex-col gap-4 rounded-lg border p-5"
      aria-labelledby="mitigacao-titulo"
    >
      <h2 id="mitigacao-titulo" className="text-lg font-semibold">
        Como reduzir o impacto
      </h2>
      <p className="text-muted-foreground text-sm">
        Marque as ações que o grupo pode adotar. Com ao menos uma ação, a redução estimada fica
        entre {formatPercent(mitigation.floor, 0)} e {formatPercent(mitigation.cap, 0)}, conforme a
        maturidade escolhida.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => (
          <Checkbox
            key={action.id}
            label={action.title}
            description={action.description}
            checked={markedIds.has(action.id)}
            onChange={() => onToggle(action.id)}
          />
        ))}
      </div>

      {result.hasImpact ? (
        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="text-sm">
            {mitigation.current > 0 ? (
              <>
                Redução estimada de <strong>{formatPercent(mitigation.current, 0)}</strong>, com
                economia de <strong>{formatBRLCompact(result.savings)}</strong> por ano. Impacto
                residual: {formatBRLCompact(result.residualMin)} a{' '}
                {formatBRLCompact(result.residualMax)} por ano.
              </>
            ) : (
              'Nenhuma ação marcada: o impacto residual é igual ao impacto bruto.'
            )}
          </p>
          <div
            className="bg-muted h-5 w-full overflow-hidden rounded-full"
            role="img"
            aria-label={`${residualWidth}% do impacto permanece`}
          >
            <div
              className="bg-primary text-primary-foreground flex h-full items-center px-2 text-xs"
              style={{ width: `${residualWidth}%` }}
            >
              {residualWidth >= 25 ? `${residualWidth}% permanece` : ''}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
