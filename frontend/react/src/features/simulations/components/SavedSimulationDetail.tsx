import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormMessage } from '@/features/auth/components/FormMessage';
import {
  ReportDownloadButtons,
  buildDetailedReport,
  buildStoresCsv,
  downloadCsv,
  downloadReportPdf,
} from '@/features/reports';
import { useDefaultPremises } from '@/hooks/useDefaultPremises';
import { useSubmit } from '@/hooks/useSubmit';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/formatPtBr';
import { useSavedSimulation } from '../hooks/useSavedSimulation';
import { REGIME_LABELS } from '../regimeLabels';
import type { SavedSimulation } from '../types';
import { SaveSimulationDialog } from './SaveSimulationDialog';
import { SimulationResultView } from './SimulationResultView';

type DialogKind = 'rename' | 'duplicate' | 'recalculate' | 'delete' | null;

type SavedSimulationDetailProps = { id: string };

type LoadedProps = { simulation: SavedSimulation; onChanged: () => void };

function Loaded({ simulation, onChanged }: LoadedProps) {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const { state: defaults } = useDefaultPremises();
  const actionTitles =
    defaults.status === 'ready'
      ? Object.fromEntries(
          defaults.premises.detailed.actions.map((action) => [action.id, action.title]),
        )
      : {};
  const deletion = useSubmit(async () => {
    await apiFetch(`/simulations/${simulation.id}`, { method: 'DELETE' });
    navigate('/simulacoes');
  });

  const copyThen = (path: 'duplicate' | 'recalculate') => async (name: string) => {
    const response = await apiFetch<{ simulation: SavedSimulation }>(
      `/simulations/${simulation.id}/${path}`,
      { method: 'POST', body: { name } },
    );
    setDialog(null);
    navigate(`/simulacoes/${response.simulation.id}`);
  };

  const rename = async (name: string) => {
    await apiFetch(`/simulations/${simulation.id}`, { method: 'PATCH', body: { name } });
    setDialog(null);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link to="/simulacoes" className="text-primary-strong text-sm font-medium underline">
          Voltar para as simulações salvas
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{simulation.name}</h1>
          <StatusBadge>{REGIME_LABELS[simulation.taxRegime]}</StatusBadge>
        </div>
        <p className="text-muted-foreground text-sm">
          Salva em {formatDateTime(simulation.createdAt)} · {simulation.stores.length} loja(s) ·
          premissas da Farmarcas versão {simulation.premisesVersion}. É uma foto: mudar uma loja
          depois não altera estes números.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/simulacao?base=${simulation.id}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
          >
            Usar como ponto de partida
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setDialog('rename')}>
            Renomear
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setDialog('duplicate')}>
            Duplicar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setDialog('recalculate')}>
            Recalcular com dados atuais
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setDialog('delete')}>
            Apagar
          </Button>
        </div>
      </div>

      <ReportDownloadButtons
        onDownloadPdf={() =>
          downloadReportPdf(
            buildDetailedReport({
              name: simulation.name,
              regime: simulation.taxRegime,
              result: simulation.result,
              premises: simulation.premises,
              mitigations: simulation.mitigations,
              actionTitles,
              version: simulation.premisesVersion,
              savedAt: simulation.createdAt,
            }),
          )
        }
        onDownloadCsv={() =>
          downloadCsv(buildStoresCsv(simulation.result), 'simulacao-por-loja.csv')
        }
      />

      <SimulationResultView result={simulation.result} regime={simulation.taxRegime} />

      <SaveSimulationDialog
        isOpen={dialog === 'rename'}
        title="Renomear simulação"
        submitLabel="Renomear"
        initialName={simulation.name}
        onClose={() => setDialog(null)}
        onSave={rename}
      />
      <SaveSimulationDialog
        isOpen={dialog === 'duplicate'}
        title="Duplicar simulação"
        submitLabel="Duplicar"
        description="Cria uma cópia idêntica, com os mesmos números."
        initialName={`${simulation.name} (cópia)`}
        onClose={() => setDialog(null)}
        onSave={copyThen('duplicate')}
      />
      <SaveSimulationDialog
        isOpen={dialog === 'recalculate'}
        title="Recalcular com dados atuais"
        submitLabel="Recalcular"
        description="Cria uma nova simulação com as lojas como estão hoje, mantendo o regime, as premissas e as ações desta. A simulação atual não muda."
        initialName={`${simulation.name} (atualizada)`}
        onClose={() => setDialog(null)}
        onSave={copyThen('recalculate')}
      />

      <Modal isOpen={dialog === 'delete'} title="Apagar simulação?" onClose={() => setDialog(null)}>
        <p className="text-sm">
          A simulação <strong>{simulation.name}</strong> deixa de aparecer na lista.
        </p>
        {deletion.error ? (
          <div className="mt-3">
            <FormMessage tone="error">{deletion.error}</FormMessage>
          </div>
        ) : null}
        <div className="mt-4 flex gap-3">
          <Button disabled={deletion.isSubmitting} onClick={() => void deletion.submit(undefined)}>
            {deletion.isSubmitting ? 'Apagando…' : 'Apagar'}
          </Button>
          <Button variant="secondary" onClick={() => setDialog(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function SavedSimulationDetail({ id }: SavedSimulationDetailProps) {
  const { state, reload } = useSavedSimulation(id);

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Carregando a simulação…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <FormMessage tone="error">{state.message}</FormMessage>
        <Link to="/simulacoes" className="text-primary-strong text-sm font-medium underline">
          Voltar para as simulações salvas
        </Link>
      </div>
    );
  }
  return <Loaded simulation={state.simulation} onChanged={reload} />;
}
