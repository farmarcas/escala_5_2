import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import { formatBRLCompact, formatDateTime, formatInt } from '@/lib/formatPtBr';
import { useSavedSimulations } from '../hooks/useSavedSimulations';
import { REGIME_LABELS } from '../regimeLabels';
import type { SimulationSummary } from '../types';

const MIN_COMPARE = 2;
const MAX_COMPARE = 4;

export function SavedSimulationsScreen() {
  const { state, reload, remove } = useSavedSimulations();
  const [selected, setSelected] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<SimulationSummary | null>(null);
  const deletion = useSubmit(async (simulation: SimulationSummary) => {
    await remove(simulation.id);
    setSelected((current) => current.filter((id) => id !== simulation.id));
    setToDelete(null);
  });

  const toggle = (id: string, isChecked: boolean) =>
    setSelected((current) =>
      isChecked ? [...current, id].slice(-MAX_COMPARE) : current.filter((item) => item !== id),
    );

  const canCompare = selected.length >= MIN_COMPARE;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Simulações salvas</h1>
          <p className="text-muted-foreground text-sm">
            Cada simulação guarda uma foto das suas lojas, premissas e ações no dia em que foi
            salva.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCompare ? (
            <Link
              to={`/simulacoes/comparar?ids=${selected.join(',')}`}
              className="border-border hover:bg-muted inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Comparar ({selected.length})
            </Link>
          ) : (
            <Button variant="secondary" disabled>
              Comparar (escolha de {MIN_COMPARE} a {MAX_COMPARE})
            </Button>
          )}
          <Link
            to="/simulacao"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
          >
            Nova simulação
          </Link>
        </div>
      </div>

      {state.status === 'loading' ? (
        <p role="status" className="text-muted-foreground text-sm">
          Carregando suas simulações…
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <FormMessage tone="error">{state.message}</FormMessage>
          <Button onClick={reload}>Tentar de novo</Button>
        </div>
      ) : null}

      {state.status === 'ready' && state.simulations.length === 0 ? (
        <div className="bg-background border-border rounded-lg border p-6 text-center">
          <p className="font-medium">Você ainda não salvou nenhuma simulação.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Faça uma simulação, marque as ações e clique em "Salvar simulação".
          </p>
        </div>
      ) : null}

      {state.status === 'ready' && state.simulations.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {state.simulations.map((simulation) => (
            <li
              key={simulation.id}
              className="bg-background border-border flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/simulacoes/${simulation.id}`}
                      className="text-primary-strong font-semibold underline"
                    >
                      {simulation.name}
                    </Link>
                    <StatusBadge>{REGIME_LABELS[simulation.taxRegime]}</StatusBadge>
                    {simulation.warnings.length > 0 ? (
                      <StatusBadge tone="warning">Redução acima do usual</StatusBadge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(simulation.createdAt)} · {simulation.storeCount} loja(s)
                  </p>
                  <p className="text-sm">
                    Impacto {formatBRLCompact(simulation.totals.grossAnnualImpact)}/ano ·{' '}
                    {formatInt(simulation.totals.peopleToHire)} pessoa(s)
                    {simulation.totals.savings > 0
                      ? ` → após ações ${formatBRLCompact(simulation.totals.residualAnnualImpact)}/ano`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Checkbox
                    label="Comparar"
                    checked={selected.includes(simulation.id)}
                    onChange={(event) => toggle(simulation.id, event.target.checked)}
                  />
                  <Button variant="secondary" size="sm" onClick={() => setToDelete(simulation)}>
                    Apagar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal isOpen={toDelete !== null} title="Apagar simulação?" onClose={() => setToDelete(null)}>
        <p className="text-sm">
          A simulação <strong>{toDelete?.name}</strong> deixa de aparecer na lista. As lojas não são
          afetadas.
        </p>
        {deletion.error ? (
          <div className="mt-3">
            <FormMessage tone="error">{deletion.error}</FormMessage>
          </div>
        ) : null}
        <div className="mt-4 flex gap-3">
          <Button
            disabled={deletion.isSubmitting}
            onClick={() => toDelete && void deletion.submit(toDelete)}
          >
            {deletion.isSubmitting ? 'Apagando…' : 'Apagar'}
          </Button>
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
