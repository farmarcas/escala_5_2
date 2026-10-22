import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ContactFormModal, type ContactSource } from '@/features/contact';
import { buildQuickReport, downloadReportPdf } from '@/features/reports';
import { useDefaultPremises } from '@/hooks/useDefaultPremises';
import { useQuickCalculator } from '../hooks/useQuickCalculator';
import type { Premises } from '@/lib/premisesTypes';
import { buildQuickSnapshot } from '../quickSnapshot';
import { ExecutiveSummary } from './ExecutiveSummary';
import { ImpactResult } from './ImpactResult';
import { LegalNotice } from './LegalNotice';
import { MitigationChecklist } from './MitigationChecklist';
import { PremisesPanel } from './PremisesPanel';
import { QuickForm } from './QuickForm';

type CalculatorBodyProps = { defaults: Premises };

function CalculatorBody({ defaults }: CalculatorBodyProps) {
  const calc = useQuickCalculator(defaults);
  const [openSource, setOpenSource] = useState<ContactSource | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-6">
        <QuickForm
          values={calc.values}
          errors={calc.errors}
          profile={calc.profile}
          operatingDays={calc.operatingDays}
          regime={calc.regime}
          maturity={calc.maturity}
          profiles={calc.premises.quick.profiles}
          onFieldChange={calc.setField}
          onProfileChange={calc.setProfile}
          onOperatingDaysChange={calc.setOperatingDays}
          onRegimeChange={calc.setRegime}
          onMaturityChange={calc.setMaturity}
        />
        <PremisesPanel
          premises={calc.premises}
          profile={calc.profile}
          maturity={calc.maturity}
          isChanged={calc.arePremisesChanged}
          onChange={calc.setPremises}
          onReset={calc.resetPremises}
        />
      </div>

      <div className="flex flex-col gap-6">
        {calc.result ? (
          <>
            <ImpactResult
              result={calc.result}
              presumidoLimit={calc.premises.taxation.presumidoRevenueLimit}
            />
            <MitigationChecklist
              actions={calc.premises.quick.mitigation.actions}
              markedIds={calc.markedActionIds}
              result={calc.result}
              onToggle={calc.toggleAction}
            />
            <ExecutiveSummary result={calc.result} />
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setOpenSource('consultor')}>Falar com um consultor</Button>
              <Button variant="secondary" onClick={() => setOpenSource('pdf')}>
                Baixar relatório em PDF
              </Button>
            </div>
          </>
        ) : (
          <p role="status" className="bg-background border-border rounded-lg border p-5 text-sm">
            Corrija os campos destacados para ver a estimativa de impacto.
          </p>
        )}
        <LegalNotice />
      </div>

      {calc.input && calc.result ? (
        <ContactFormModal
          isOpen={openSource !== null}
          source={openSource ?? 'consultor'}
          snapshot={buildQuickSnapshot(calc.input, calc.result)}
          onClose={() => setOpenSource(null)}
          onRegistered={
            openSource === 'pdf'
              ? () =>
                  downloadReportPdf(
                    buildQuickReport({
                      values: calc.input as NonNullable<typeof calc.input>,
                      result: calc.result as NonNullable<typeof calc.result>,
                      premises: calc.premises,
                    }),
                  )
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

export function QuickCalculator() {
  const { state, retry } = useDefaultPremises();

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        Carregando a calculadora…
      </p>
    );
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="bg-background border-border rounded-lg border p-5">
        <p className="mb-3 text-sm">Não foi possível carregar a calculadora agora.</p>
        <Button onClick={retry}>Tentar de novo</Button>
      </div>
    );
  }

  return <CalculatorBody defaults={state.premises} />;
}
