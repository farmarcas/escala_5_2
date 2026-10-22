import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { apiFetch, errorMessage } from '@/lib/api';
import { formatBRLCompact, formatDateTime, formatInt } from '@/lib/formatPtBr';
import { REGIME_LABELS } from '../regimeLabels';
import type { SimulationSummary } from '../types';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: SimulationSummary[] };

type Row = {
  label: string;
  value: (item: SimulationSummary) => string;
  // Linhas de dinheiro destacam o menor valor.
  best?: (item: SimulationSummary) => number;
};

const ROWS: Row[] = [
  { label: 'Salva em', value: (item) => formatDateTime(item.createdAt) },
  { label: 'Regime tributário', value: (item) => REGIME_LABELS[item.taxRegime] },
  { label: 'Lojas', value: (item) => formatInt(item.storeCount) },
  {
    label: 'Impacto bruto por ano',
    value: (item) => formatBRLCompact(item.totals.grossAnnualImpact),
    best: (item) => item.totals.grossAnnualImpact,
  },
  {
    label: 'Impacto líquido por ano',
    value: (item) => formatBRLCompact(item.totals.netAnnualImpact),
    best: (item) => item.totals.netAnnualImpact,
  },
  { label: 'Pessoas a contratar', value: (item) => formatInt(item.totals.peopleToHire) },
  {
    label: 'Impacto residual após ações',
    value: (item) => formatBRLCompact(item.totals.residualAnnualImpact),
    best: (item) => item.totals.residualAnnualImpact,
  },
  {
    label: 'Pessoas após ações',
    value: (item) => formatInt(item.totals.residualPeopleToHire),
  },
  { label: 'Economia estimada por ano', value: (item) => formatBRLCompact(item.totals.savings) },
];

export function CompareScreen() {
  const [params] = useSearchParams();
  const ids = params.get('ids') ?? '';
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    apiFetch<{ items: SimulationSummary[] }>(`/simulations/compare?ids=${encodeURIComponent(ids)}`)
      .then((response) => {
        if (isCurrent) setState({ status: 'ready', items: response.items });
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ status: 'error', message: errorMessage(error) });
      });
    return () => {
      isCurrent = false;
    };
  }, [ids]);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/simulacoes" className="text-primary text-sm font-medium underline">
        Voltar para as simulações salvas
      </Link>
      <h1 className="text-2xl font-bold">Comparar simulações</h1>

      {state.status === 'loading' ? (
        <p role="status" className="text-muted-foreground text-sm">
          Carregando…
        </p>
      ) : null}
      {state.status === 'error' ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      {state.status === 'ready' ? (
        <div className="bg-background border-border overflow-x-auto rounded-lg border p-4">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Comparação lado a lado das simulações escolhidas</caption>
            <thead>
              <tr>
                <th scope="col" className="py-2 pr-3" />
                {state.items.map((item) => (
                  <th key={item.id} scope="col" className="py-2 pr-3 align-top">
                    <Link
                      to={`/simulacoes/${item.id}`}
                      className="text-primary font-semibold underline"
                    >
                      {item.name}
                    </Link>
                    {item.warnings.length > 0 ? (
                      <div className="mt-1">
                        <StatusBadge tone="warning">Redução acima do usual</StatusBadge>
                      </div>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const lowest = row.best ? Math.min(...state.items.map(row.best)) : null;
                return (
                  <tr key={row.label} className="border-border border-t">
                    <th scope="row" className="text-muted-foreground py-2 pr-3 font-medium">
                      {row.label}
                    </th>
                    {state.items.map((item) => {
                      const isBest =
                        row.best !== undefined &&
                        state.items.length > 1 &&
                        row.best(item) === lowest &&
                        state.items.some((other) => row.best?.(other) !== lowest);
                      return (
                        <td key={item.id} className="py-2 pr-3 tabular-nums">
                          <span className={isBest ? 'text-primary font-semibold' : undefined}>
                            {row.value(item)}
                          </span>
                          {isBest ? <span className="ml-2 text-xs">menor</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
