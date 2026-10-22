import type { Metric } from '@/lib/describeQuickResult';
import { buildSummaryText } from '@/lib/buildSummaryText';
import { describeQuickResult } from '@/lib/describeQuickResult';
import {
  formatBRL,
  formatBRLCompact,
  formatDateTime,
  formatInt,
  formatPercent,
} from '@/lib/formatPtBr';
import { LEGAL_NOTICE } from '@/lib/legalNotice';
import type { Premises } from '@/lib/premisesTypes';
import type { QuickInput, QuickResult } from '@/lib/quickImpact';
import { DAYS_LABELS, MATURITY_LABELS, REGIME_LABELS } from '@/lib/quickLabels';
import {
  describeStoreRoles,
  describeTotals,
  hoursText,
} from '@/features/simulations/describeResult';
import { REGIME_LABELS as DETAILED_REGIME_LABELS } from '@/features/simulations/regimeLabels';
import type {
  CalcPremisesSnapshot,
  DetailedResult,
  MitigationsPayload,
  RegimeKind,
} from '@/features/simulations/types';

// Modelo do relatório: o PDF só desenha o que está aqui. Os textos vêm das mesmas funções da tela.
export type ReportRow = { label: string; value: string };

// `leftAligned`: índices das colunas de texto (as demais, de números, ficam alinhadas à direita).
export type ReportTable = { columns: string[]; rows: string[][]; leftAligned?: number[] };

export type ReportSection = {
  heading: string;
  rows?: ReportRow[];
  paragraphs?: string[];
  table?: ReportTable;
};

export type Report = {
  title: string;
  subtitle: string;
  generatedAt: string;
  sections: ReportSection[];
  notice: string;
  fileName: string;
};

// O PDF usa fonte padrão: troca espaço "colado" (NBSP) do formato brasileiro por espaço comum.
const clean = (text: string) => text.replace(/\u00a0/g, ' ');
const rows = (metrics: Metric[]): ReportRow[] =>
  metrics.map((metric) => ({ label: metric.label, value: clean(metric.value) }));
const pct = (fraction: number) => formatPercent(fraction, 1).replace(/,0%$/, '%');
const factor = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 4 });

export function buildQuickReport(input: {
  values: QuickInput;
  result: QuickResult;
  premises: Premises;
  now?: Date;
}): Report {
  const { values, result, premises } = input;
  const profile = premises.quick.profiles[values.profile];
  const view = describeQuickResult(result);

  const sections: ReportSection[] = [
    {
      heading: 'Perfil informado',
      rows: [
        { label: 'Número de lojas', value: formatInt(values.storeCount) },
        { label: 'Total de colaboradores', value: formatInt(values.employees) },
        { label: 'Colaboradores em escala 6x1', value: formatPercent(values.pctSixByOne, 0) },
        {
          label: 'Salário médio mensal dos afetados',
          value: clean(formatBRL(values.averageSalary)),
        },
        { label: 'Faturamento anual do grupo', value: clean(formatBRL(values.annualRevenue)) },
        { label: 'Perfil predominante das lojas', value: profile.label },
        { label: 'Dias de funcionamento', value: DAYS_LABELS[values.operatingDays] },
        { label: 'Regime tributário', value: REGIME_LABELS[values.regime] },
        { label: 'Maturidade de adequação', value: MATURITY_LABELS[values.maturity] },
      ],
    },
    {
      heading: 'Impacto anual direto estimado',
      rows: rows([view.headline, ...view.metrics]),
    },
  ];

  if (result.mitigation.current > 0) {
    sections.push({
      heading: 'Redução com ações de mitigação',
      rows: [
        { label: 'Ações marcadas', value: formatInt(values.markedActions) },
        { label: 'Redução estimada', value: formatPercent(result.mitigation.current, 0) },
        { label: 'Economia estimada por ano', value: clean(formatBRLCompact(result.savings)) },
        {
          label: 'Impacto residual por ano',
          value: `${clean(formatBRLCompact(result.residualMin))} a ${clean(formatBRLCompact(result.residualMax))}`,
        },
      ],
    });
  }

  sections.push(
    { heading: 'Síntese para a diretoria', paragraphs: [clean(buildSummaryText(result))] },
    {
      heading: 'Premissas usadas',
      rows: [
        {
          label: 'Encargos (Lucro Real e Presumido)',
          value: factor(premises.taxation.chargesRealPresumido),
        },
        { label: 'Encargos (Simples Nacional)', value: factor(premises.taxation.chargesSimples) },
        { label: 'Meses de remuneração por ano', value: factor(premises.taxation.monthsPerYear) },
        { label: 'Alíquota IRPJ + CSLL (Lucro Real)', value: pct(premises.taxation.irpjCsllRate) },
        { label: `Margem operacional (${profile.label})`, value: pct(profile.operatingMargin) },
        {
          label: `Cobertura (${profile.label})`,
          value: `${pct(profile.coverageMin)} a ${pct(profile.coverageMax)}`,
        },
        { label: 'Redução mínima com ações', value: pct(premises.quick.mitigation.floor) },
        {
          label: 'Redução máxima com ações (maturidade)',
          value: pct(premises.quick.mitigation.capByMaturity[values.maturity]),
        },
        {
          label: 'Versão das premissas',
          value: `${premises.version}${premises.provisional ? ' (provisória)' : ''}`,
        },
      ],
    },
  );

  return {
    title: 'Quanto vale o fim da escala 6x1 para o seu grupo?',
    subtitle: 'Simulação de impacto financeiro da PEC 221/19 · Modo rápido',
    generatedAt: formatDateTime((input.now ?? new Date()).toISOString()),
    sections,
    notice: LEGAL_NOTICE,
    fileName: 'relatorio-impacto-escala-6x1.pdf',
  };
}

export function buildDetailedReport(input: {
  name?: string;
  regime: RegimeKind;
  result: DetailedResult;
  premises: CalcPremisesSnapshot;
  mitigations: MitigationsPayload;
  actionTitles: Record<string, string>;
  version?: string;
  savedAt?: string;
  now?: Date;
}): Report {
  const { result, premises, mitigations, actionTitles } = input;

  const storeSections: ReportSection[] = [...result.stores]
    .sort((a, b) => b.grossAnnualImpact - a.grossAnnualImpact)
    .map((store) => {
      const mitigation = mitigations[store.storeId];
      const actionLines = Object.entries(mitigation?.actions ?? {}).map(
        ([id, effect]) => `${actionTitles[id] ?? id} (${formatPercent(effect, 0)})`,
      );
      const hours = mitigation?.hoursReductionPerWeek;
      const notes = [
        store.hasImpact
          ? `${formatInt(store.peopleToHire)} pessoa(s) a contratar, ${clean(formatBRLCompact(store.grossAnnualImpact))} por ano, com ${hoursText(store.weeklyOpenHours)} de abertura por semana.`
          : `Sem contratação necessária. ${hoursText(store.weeklyOpenHours)} de abertura por semana.`,
      ];
      if (actionLines.length > 0) notes.push(`Ações: ${actionLines.join(', ')}.`);
      if (hours) notes.push(`Ajuste de horário: ${formatInt(hours)} h a menos por semana.`);

      return {
        heading: `Loja: ${store.name}`,
        paragraphs: notes,
        table: {
          columns: [
            'Função',
            'Horas a cobrir',
            'Horas com 40h',
            'Falta nova',
            'Contratar',
            'Após ações',
            'Custo por ano',
          ],
          rows: describeStoreRoles(store).map((row) =>
            [
              row.role,
              row.hoursToCover,
              row.hoursAt40,
              row.newDeficit,
              row.peopleToHire,
              row.residualPeople,
              row.annualCost,
            ].map(clean),
          ),
        },
      };
    });

  const sections: ReportSection[] = [
    { heading: 'Total do grupo', rows: rows(describeTotals(result, input.regime)) },
  ];

  if (result.warnings.includes('MITIGATION_ABOVE_USUAL')) {
    sections.push({
      heading: 'Atenção',
      paragraphs: [
        'A redução combinada das ações em alguma loja passa de 50%, o que costuma ser otimista. Confira se os efeitos informados são realistas.',
      ],
    });
  }

  sections.push(
    {
      heading: 'Lojas mais afetadas',
      table: {
        columns: ['Posição', 'Loja', 'Impacto bruto por ano'],
        leftAligned: [0, 1],
        rows: result.ranking
          .filter((item) => item.grossAnnualImpact > 0)
          .map((item, index) => [
            String(index + 1),
            item.name,
            clean(formatBRLCompact(item.grossAnnualImpact)),
          ]),
      },
    },
    ...storeSections,
    {
      heading: 'Premissas usadas',
      rows: [
        { label: 'Regime tributário', value: DETAILED_REGIME_LABELS[input.regime] },
        {
          label: 'Encargos (Lucro Real e Presumido)',
          value: factor(premises.taxation.chargesRealPresumido),
        },
        { label: 'Encargos (Simples Nacional)', value: factor(premises.taxation.chargesSimples) },
        { label: 'Meses de remuneração por ano', value: factor(premises.taxation.monthsPerYear) },
        { label: 'Alíquota IRPJ + CSLL (Lucro Real)', value: pct(premises.taxation.irpjCsllRate) },
        { label: 'Ausência padrão (férias, faltas)', value: pct(premises.detailed.absenceRate) },
        { label: 'Jornada alvo', value: `${premises.detailed.targetWeeklyHours} horas por semana` },
        ...(input.version ? [{ label: 'Versão das premissas', value: input.version }] : []),
      ],
    },
  );

  return {
    title: input.name ? `Simulação: ${input.name}` : 'Simulação por loja do fim da escala 6x1',
    subtitle: `Simulação de impacto financeiro da PEC 221/19 · Modo detalhado${
      input.savedAt ? ` · Salva em ${formatDateTime(input.savedAt)}` : ''
    }`,
    generatedAt: formatDateTime((input.now ?? new Date()).toISOString()),
    sections,
    notice: LEGAL_NOTICE,
    fileName: 'relatorio-simulacao-por-loja.pdf',
  };
}
