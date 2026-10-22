import { useState } from 'react';
import { BarCompare } from '@/components/ui/BarCompare';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusPill } from '@/components/ui/StatusPill';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { formatBRL, formatInt, formatPercent } from '@/lib/formatPtBr';
import { StackedBar } from '@/components/ui/StackedBar';
import { useDiagnostic } from '../hooks/useDiagnostic';
import { AlertsBlock } from './AlertsBlock';
import { CostComponents } from './CostComponents';
import { HolidaySummary } from './HolidaySummary';
import { SalesSection } from './SalesSection';
import { PerPersonCosts } from './PerPersonCosts';
import { SCENARIO_LABEL, type ScaleStore, type ScenarioKey } from '../types';

export function DiagnosticScreen({ store }: { store: ScaleStore }) {
  const [scenario, setScenario] = useState<ScenarioKey>('5x2_42');
  const [regime, setRegime] = useState(store.taxRegime);
  const [provisions, setProvisions] = useState(store.rules.provisions);
  const state = useDiagnostic(store.id, { regime, provisions });

  if (state.status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Calculando o diagnóstico"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }
  if (state.status === 'error') return <FormMessage tone="error">{state.message}</FormMessage>;

  const d = state.diagnostic;
  const alerts = state.alerts;
  const label = SCENARIO_LABEL[scenario];
  const pay = d.payroll.scenarios[scenario];
  const hireRows = d.rows.filter((r) => r.hire[scenario] > 0);
  const hireText = hireRows.map((r) => `${r.hire[scenario]} ${r.label.toLowerCase()}`).join(', ');
  const hireTotal = d.totals.hire[scenario];
  // Resumo que o consultor recebe, só com o que ajuda a atender (sem a escala completa).
  const snapshot = {
    profile: {
      loja: store.name,
      cidade: `${store.city}/${store.state}`,
      regime: d.payroll.taxRegime,
      pessoasHoje: d.totals.today,
    },
    result: {
      cenario: label,
      contratar: d.totals.hire[scenario],
      folhaHoje: Math.round(d.payroll.today.total),
      folhaNova: Math.round(pay.total),
      diferencaMensal: Math.round(pay.monthlyDifference),
      funcoes: d.rows.map((r) => ({
        funcao: r.label,
        hoje: r.today,
        necessario: r.need[scenario],
      })),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Diagnóstico e custos</h2>
        <SegmentedControl
          label="Cenário"
          value={scenario}
          options={[
            { value: '5x2_42', label: '5x2 · 42h' },
            { value: '5x2_40', label: '5x2 · 40h' },
          ]}
          onValueChange={setScenario}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl
          label="Regime tributário"
          value={regime}
          options={[
            { value: 'simples', label: 'Simples' },
            { value: 'lucro_presumido_real', label: 'Presumido/Real' },
          ]}
          onValueChange={setRegime}
        />
        <SegmentedControl
          label="Provisões"
          value={provisions ? 'com' : 'sem'}
          options={[
            { value: 'com', label: 'Com provisões' },
            { value: 'sem', label: 'Sem provisões' },
          ]}
          onValueChange={(v) => setProvisions(v === 'com')}
        />
      </div>

      <section className="border-primary bg-accent rounded-lg border p-5" aria-live="polite">
        <p className="text-lg font-bold">
          {hireTotal === 0
            ? `Para cumprir a ${label}, esta loja não precisa contratar.`
            : `Para cumprir a ${label}, esta loja precisa contratar ${formatInt(hireTotal)} ${hireTotal === 1 ? 'pessoa' : 'pessoas'}.`}
        </p>
        {hireTotal > 0 ? <p className="text-da-600 mt-1 text-sm">{hireText}.</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Folha mensal hoje (6x1 · 44h)" value={formatBRL(d.payroll.today.total)} />
        <KpiCard label={`Nova arquitetura (${label})`} value={formatBRL(pay.total)} />
        <KpiCard
          tone="highlight"
          label="Diferença por mês"
          value={`${pay.monthlyDifference >= 0 ? '+' : ''}${formatBRL(pay.monthlyDifference)}`}
          detail={`${pay.percent >= 0 ? '+' : ''}${formatPercent(pay.percent / 100)} · ${formatBRL(pay.yearlyDifference)} por ano`}
        />
      </div>

      <section className="border-border bg-background rounded-lg border p-5">
        <h3 className="font-bold">Quadro por função</h3>
        <p className="text-muted-foreground mb-3 text-sm">
          “Necessário” é o menor número de pessoas que cobre todo o horário com o mínimo no salão,
          folgas, intervalos e folga dominical.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-muted-foreground text-xs uppercase">
              <tr>
                <th className="py-2 pr-3">Função</th>
                <th className="px-3 py-2 text-right">Hoje</th>
                <th className="px-3 py-2 text-right">Necessário 6x1</th>
                <th className="px-3 py-2">Situação hoje</th>
                <th className="px-3 py-2 text-right">Necessário {label}</th>
                <th className="py-2 pl-3">Nova lei</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {d.rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="py-3 pr-3 font-medium">
                    {r.label}
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums">{r.today}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.need['6x1_44']}</td>
                  <td className="px-3 py-3">
                    {r.gap6x1 > 0 ? (
                      <StatusPill tone="danger">Falta {r.gap6x1}</StatusPill>
                    ) : (
                      <StatusPill tone="ok">Em dia</StatusPill>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.need[scenario]}</td>
                  <td className="py-3 pl-3">
                    {r.hire[scenario] > 0 ? (
                      <StatusPill tone="warning">Contratar {r.hire[scenario]}</StatusPill>
                    ) : r.reinforcement[scenario] > 0 ? (
                      <StatusPill tone="info">Reforço {r.reinforcement[scenario]}</StatusPill>
                    ) : (
                      <StatusPill tone="ok">Completo</StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <th scope="row" className="py-3 pr-3">
                  Total
                </th>
                <td className="px-3 py-3 text-right tabular-nums">{d.totals.today}</td>
                <td className="px-3 py-3 text-right tabular-nums">{d.totals.need['6x1_44']}</td>
                <td />
                <td className="px-3 py-3 text-right tabular-nums">{d.totals.need[scenario]}</td>
                <td className="py-3 pl-3">Contratar {hireTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          A folha nova inclui quem já existe e as novas contratações. Quando a equipe atual é maior
          que o mínimo, o excedente aparece como reforço.
        </p>
      </section>

      {d.sales ? (
        <SalesSection
          today={d.sales.today}
          next={d.sales.scenarios[scenario]}
          nextLabel={label}
          store={store}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Quer saber quanto a loja precisa vender para pagar a mercadoria e a nova folha? Ative a
          análise de vendas no passo 6 dos dados da loja.
        </p>
      )}

      <HolidaySummary summary={d.holidays[scenario]} store={store} />

      <section className="border-border bg-background rounded-lg border p-5">
        <h3 className="mb-3 font-bold">Custo direto e indireto</h3>
        <BarCompare
          format={formatBRL}
          bars={[
            { label: 'Hoje (6x1 · 44h)', value: d.payroll.today.total, className: 'bg-mi-100' },
            { label: `Nova escala (${label})`, value: pay.total, className: 'bg-primary' },
          ]}
        />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Hoje</p>
            <StackedBar
              format={formatBRL}
              parts={[
                { label: 'Direto', value: d.payroll.today.direct, className: 'bg-rp-500' },
                { label: 'Indireto', value: d.payroll.today.indirect, className: 'bg-da-500' },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Nova escala ({label})</p>
            <StackedBar
              format={formatBRL}
              parts={[
                { label: 'Direto', value: pay.direct, className: 'bg-rp-500' },
                { label: 'Indireto', value: pay.indirect, className: 'bg-da-500' },
              ]}
            />
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Direto: salários e adicionais. Indireto: provisões, encargos e benefícios.
        </p>
      </section>

      <section className="border-border bg-background rounded-lg border p-5">
        <h3 className="mb-3 font-bold">Componentes da folha</h3>
        <CostComponents
          today={d.payroll.today}
          next={pay}
          nextLabel={`Nova escala (${label})`}
          regime={d.payroll.taxRegime}
        />
      </section>

      <section className="border-border bg-background rounded-lg border p-5">
        <h3 className="font-bold">Custo por colaborador</h3>
        <p className="text-muted-foreground mb-3 text-sm">
          A partir do salário de registro informado, na nova escala. Adicionais variam com o turno;
          o valor é a média da função.
        </p>
        <PerPersonCosts rows={pay.perPerson} />
      </section>

      <AlertsBlock alerts={alerts} storeId={store.id} snapshot={snapshot} />

      {d.notes.map((note) => (
        <p key={note} className="text-muted-foreground text-xs">
          {note}
        </p>
      ))}
      <p className="text-muted-foreground text-xs">
        Estimativa para planejamento. Pisos, adicionais por domingo e regras de banco de horas
        dependem da convenção coletiva de cada sindicato. Confirme com seu contador ou advogado.
      </p>
      <div>
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          Imprimir esta página
        </Button>
      </div>
    </div>
  );
}
