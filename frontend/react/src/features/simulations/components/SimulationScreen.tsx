import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth';
import { ContactFormModal } from '@/features/contact';
import {
  ReportDownloadButtons,
  buildDetailedReport,
  buildStoresCsv,
  downloadCsv,
  downloadReportPdf,
} from '@/features/reports';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useDefaultPremises } from '@/hooks/useDefaultPremises';
import { apiFetch } from '@/lib/api';
import { LEGAL_NOTICE } from '@/lib/legalNotice';
import type { Premises } from '@/lib/premisesTypes';
import { useSavedSimulation } from '../hooks/useSavedSimulation';
import { useSimulationPreview } from '../hooks/useSimulationPreview';
import {
  applyToAllStores,
  emptyStoreMitigation,
  fromPayload,
  toPayload,
  type MitigationsState,
} from '../mitigationsState';
import {
  buildPremiseOverrides,
  settingsFromDefaults,
  settingsFromSnapshot,
  type SimulationSettings,
} from '../premiseOverrides';
import type { RegimeKind, SavedSimulation } from '../types';
import { MitigationPanel } from './MitigationPanel';
import { SaveSimulationDialog } from './SaveSimulationDialog';
import { SimulationResultView } from './SimulationResultView';
import { SimulationSettingsPanel } from './SimulationSettingsPanel';

type Initial = { regime: RegimeKind; settings: SimulationSettings; mitigations: MitigationsState };

type SimulationBodyProps = { defaults: Premises; groupRegime: RegimeKind; initial: Initial };

function SimulationBody({ defaults, groupRegime, initial }: SimulationBodyProps) {
  const navigate = useNavigate();
  const [regime, setRegime] = useState<RegimeKind>(initial.regime);
  const [settings, setSettings] = useState<SimulationSettings>(initial.settings);
  const [mitigations, setMitigations] = useState<MitigationsState>(initial.mitigations);
  const [isSaving, setIsSaving] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const premiseOverrides = useMemo(
    () => buildPremiseOverrides(settings, defaults),
    [settings, defaults],
  );
  const mitigationPayload = useMemo(() => {
    const payload = toPayload(mitigations);
    return Object.keys(payload).length > 0 ? payload : undefined;
  }, [mitigations]);

  const request = { taxRegime: regime, premiseOverrides, mitigations: mitigationPayload };
  const preview = useSimulationPreview(request);
  const data = preview.data;

  const isChanged = premiseOverrides !== undefined || regime !== groupRegime;
  const reset = () => {
    setRegime(groupRegime);
    setSettings(settingsFromDefaults(defaults));
  };

  const saveSimulation = async (name: string) => {
    const response = await apiFetch<{ simulation: SavedSimulation }>('/simulations', {
      method: 'POST',
      body: { name, ...request },
    });
    navigate(`/simulacoes/${response.simulation.id}`);
  };

  const storeIds = preview.data?.result.stores.map((store) => store.storeId) ?? [];
  const actionTitles = Object.fromEntries(
    defaults.detailed.actions.map((action) => [action.id, action.title]),
  );

  return (
    <div className="flex flex-col gap-6">
      <SimulationSettingsPanel
        regime={regime}
        settings={settings}
        isChanged={isChanged}
        onRegimeChange={setRegime}
        onSettingsChange={setSettings}
        onReset={reset}
      />

      {preview.error ? (
        <div className="flex flex-col items-start gap-3">
          <FormMessage tone="error">{preview.error}</FormMessage>
          <Button onClick={preview.retry}>Tentar de novo</Button>
        </div>
      ) : null}

      {preview.data === null && !preview.error ? (
        <p role="status" className="text-muted-foreground text-sm">
          Calculando o impacto das suas lojas…
        </p>
      ) : null}

      {preview.data && preview.data.result.stores.length === 0 ? (
        <div className="bg-background border-border rounded-lg border p-6 text-center">
          <p className="font-medium">Você ainda não tem lojas cadastradas.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Cadastre ao menos uma loja para calcular o impacto.
          </p>
          <Link
            to="/lojas/nova"
            className="bg-primary text-primary-foreground mt-3 inline-flex rounded-md px-4 py-2 text-sm font-medium"
          >
            Cadastrar loja
          </Link>
        </div>
      ) : null}

      {preview.data && preview.data.result.stores.length > 0 ? (
        <div className={preview.isLoading ? 'opacity-60' : undefined}>
          <SimulationResultView
            result={preview.data.result}
            regime={preview.data.taxRegime}
            renderStoreExtra={(store) => (
              <MitigationPanel
                storeName={store.name}
                actions={defaults.detailed.actions}
                state={mitigations[store.storeId] ?? emptyStoreMitigation()}
                canApplyToAll={storeIds.length > 1}
                onChange={(next) =>
                  setMitigations((current) => ({ ...current, [store.storeId]: next }))
                }
                onApplyToAll={() =>
                  setMitigations((current) => applyToAllStores(current, store.storeId, storeIds))
                }
              />
            )}
          />
        </div>
      ) : null}

      {preview.data && preview.data.result.stores.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setIsSaving(true)}>Salvar simulação</Button>
          <Button variant="secondary" onClick={() => setIsContactOpen(true)}>
            Falar com um consultor
          </Button>
          <Link to="/simulacoes" className="text-primary-strong text-sm font-medium underline">
            Ver simulações salvas
          </Link>
        </div>
      ) : null}

      {data && data.result.stores.length > 0 ? (
        <ReportDownloadButtons
          onDownloadPdf={() =>
            downloadReportPdf(
              buildDetailedReport({
                regime: data.taxRegime,
                result: data.result,
                premises: data.premises,
                mitigations: mitigationPayload ?? {},
                actionTitles,
                version: defaults.version,
              }),
            )
          }
          onDownloadCsv={() => downloadCsv(buildStoresCsv(data.result), 'simulacao-por-loja.csv')}
        />
      ) : null}

      {preview.data ? (
        <ContactFormModal
          isOpen={isContactOpen}
          snapshot={{
            profile: {
              storeCount: preview.data.result.stores.length,
              taxRegime: regime,
              premiseOverrides: premiseOverrides ?? null,
              mitigations: mitigationPayload ?? null,
            },
            result: { ...preview.data.result.totals, warnings: preview.data.result.warnings },
          }}
          onClose={() => setIsContactOpen(false)}
        />
      ) : null}

      <SaveSimulationDialog
        isOpen={isSaving}
        title="Salvar simulação"
        submitLabel="Salvar"
        description="A simulação guarda uma foto das suas lojas, premissas e ações de hoje. Mudanças futuras nas lojas não alteram o que foi salvo."
        onClose={() => setIsSaving(false)}
        onSave={saveSimulation}
      />

      <p className="text-muted-foreground text-xs leading-relaxed">{LEGAL_NOTICE}</p>
    </div>
  );
}

const fromSaved = (saved: SavedSimulation): Initial => ({
  regime: saved.taxRegime,
  settings: settingsFromSnapshot(saved.premises),
  mitigations: fromPayload(saved.mitigations),
});

function ScreenHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Simulação por loja</h1>
        <p className="text-muted-foreground text-sm">
          Quanto custa passar de 44h para 40h semanais, loja a loja, a partir da equipe cadastrada.
        </p>
      </div>
      <Link to="/lojas" className="text-primary-strong text-sm font-medium underline">
        Voltar para minhas lojas
      </Link>
    </div>
  );
}

type WithBaseProps = { baseId: string; defaults: Premises; groupRegime: RegimeKind };

// Abre uma simulação salva como ponto de partida: carrega regime, premissas e ações dela
// sobre as lojas de hoje. Salvar de novo cria uma simulação nova.
function SimulationFromBase({ baseId, defaults, groupRegime }: WithBaseProps) {
  const { state } = useSavedSimulation(baseId);

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
        <Link to="/simulacao" className="text-primary-strong text-sm font-medium underline">
          Começar uma simulação nova
        </Link>
      </div>
    );
  }
  return (
    <SimulationBody
      key={baseId}
      defaults={defaults}
      groupRegime={groupRegime}
      initial={fromSaved(state.simulation)}
    />
  );
}

export function SimulationScreen() {
  const { state: auth } = useAuth();
  const { state: premises, retry } = useDefaultPremises();
  const [params] = useSearchParams();
  const baseId = params.get('base');

  if (auth.status !== 'authenticated' || premises.status === 'loading') {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Carregando…
      </p>
    );
  }

  if (premises.status === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <FormMessage tone="error">Não foi possível carregar as premissas agora.</FormMessage>
        <Button onClick={retry}>Tentar de novo</Button>
      </div>
    );
  }

  const groupRegime = auth.group.taxRegime;
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader />
      {baseId ? (
        <SimulationFromBase
          baseId={baseId}
          defaults={premises.premises}
          groupRegime={groupRegime}
        />
      ) : (
        <SimulationBody
          defaults={premises.premises}
          groupRegime={groupRegime}
          initial={{
            regime: groupRegime,
            settings: settingsFromDefaults(premises.premises),
            mitigations: {},
          }}
        />
      )}
    </div>
  );
}
