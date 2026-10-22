import { buildWeekHours, type StoreHoursInput } from './engine/coverage.js';
import { comparePayroll, payroll, type CostSettings, type PayrollLine } from './engine/costs.js';
import { SCENARIOS, type ScenarioId } from './engine/rules.js';
import { requiredPeople } from './engine/staffing.js';
import type { ScaleRoleInput, ScaleStoreInput } from './scales.schemas.js';

// Diagnóstico: quadro por função (hoje, necessário 6x1, 5x2 · 42h, 5x2 · 40h) e folha hoje x nova.
// Função pura sobre a configuração da loja.

export const GROUPS: { key: string; label: string; roles: ScaleRoleInput['role'][] }[] = [
  { key: 'farmaceutico', label: 'Farmacêutico(a)', roles: ['farmaceutico'] },
  { key: 'gerencia', label: 'Gerente / Subgerente', roles: ['gerente', 'subgerente'] },
  { key: 'balconista', label: 'Balconista', roles: ['balconista'] },
  { key: 'caixa', label: 'Caixa', roles: ['caixa'] },
  { key: 'perfumista', label: 'Perfumista', roles: ['perfumista'] },
  { key: 'servicos_gerais', label: 'Serviços gerais', roles: ['servicos_gerais'] },
  { key: 'entregador', label: 'Entregador', roles: ['entregador'] },
  { key: 'comprador', label: 'Comprador(a)', roles: ['comprador'] },
  { key: 'conferente', label: 'Conferente', roles: ['conferente'] },
  { key: 'atendente_digital', label: 'Atendente digital', roles: ['atendente_digital'] },
  { key: 'expedicao', label: 'Expedição', roles: ['expedicao'] },
];

const NEW_SCENARIOS = ['5x2_42', '5x2_40'] as const satisfies readonly ScenarioId[];
type NewScenario = (typeof NEW_SCENARIOS)[number];

export type DiagnosticRow = {
  key: string;
  label: string;
  today: number;
  need: Record<ScenarioId, number>;
  // Hoje x necessário na 6x1: positivo = falta gente.
  gap6x1: number;
  hire: Record<NewScenario, number>;
  reinforcement: Record<NewScenario, number>;
};

export type Diagnostic = {
  rows: DiagnosticRow[];
  totals: { today: number; need: Record<ScenarioId, number>; hire: Record<NewScenario, number> };
  payroll: {
    today: { direct: number; indirect: number; total: number };
    scenarios: Record<
      NewScenario,
      {
        direct: number;
        indirect: number;
        total: number;
        monthlyDifference: number;
        yearlyDifference: number;
        percent: number;
      }
    >;
  };
  notes: string[];
};

export function costSettingsOf(store: ScaleStoreInput): CostSettings {
  return {
    taxRegime: store.taxRegime,
    provisions: store.rules.provisions,
    rat: store.rules.rat,
    thirdParty: store.rules.thirdParty,
    transport: store.rules.transport,
    benefits: store.rules.benefits,
  };
}

export function diagnose(store: ScaleStoreInput): Diagnostic {
  const week = buildWeekHours(store.hours as StoreHoursInput);
  const options = { lunchMinutes: store.rules.lunchMinutes, sundayRule: store.rules.sundayRule };
  const settings = costSettingsOf(store);
  const active = store.roles.filter((r) => r.enabled);

  const rows: DiagnosticRow[] = [];
  const todayLines: PayrollLine[] = [];
  const nextLines: Record<NewScenario, PayrollLine[]> = { '5x2_42': [], '5x2_40': [] };
  const notes: string[] = [];

  for (const group of GROUPS) {
    const members = active.filter((r) => group.roles.includes(r.role));
    if (members.length === 0) continue;
    // A cobertura da função vem do primeiro membro com mínimo no salão (gerente e subgerente dividem o posto).
    const lead = members.find((r) => r.minInHall > 0) ?? members[0]!;
    const need = {} as Record<ScenarioId, number>;
    for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
      const result = requiredPeople(
        { ...lead, coverage: lead.coverage, extraPostsPerWeek: 0 },
        week,
        SCENARIOS[id],
        options,
      );
      need[id] = result.ok ? result.people : 0;
    }
    const today = members.reduce((n, r) => n + r.headcount, 0);
    const avgSalary =
      members.reduce((s, r) => s + r.monthlySalary * r.headcount, 0) / Math.max(today, 1) ||
      lead.monthlySalary;
    const motorcycle = members.some((r) => r.motorcycle);

    for (const r of members) {
      todayLines.push({
        salary: r.monthlySalary,
        people: r.headcount,
        motorcycle: r.motorcycle,
        daysPerWeek: SCENARIOS['6x1_44'].daysPerWeek,
      });
    }
    const hire = {} as DiagnosticRow['hire'];
    const reinforcement = {} as DiagnosticRow['reinforcement'];
    for (const id of NEW_SCENARIOS) {
      hire[id] = Math.max(0, need[id] - today);
      reinforcement[id] = Math.max(0, today - need[id]);
      const days = SCENARIOS[id].daysPerWeek;
      for (const r of members) {
        nextLines[id].push({
          salary: r.monthlySalary,
          people: r.headcount,
          motorcycle: r.motorcycle,
          daysPerWeek: days,
        });
      }
      nextLines[id].push({ salary: avgSalary, people: hire[id], motorcycle, daysPerWeek: days });
    }
    rows.push({
      key: group.key,
      label: group.label,
      today,
      need,
      gap6x1: need['6x1_44'] - today,
      hire,
      reinforcement,
    });
  }

  const sum = (f: (row: DiagnosticRow) => number) => rows.reduce((n, row) => n + f(row), 0);
  const todayPayroll = payroll(todayLines, settings);
  const scenarios = {} as Diagnostic['payroll']['scenarios'];
  for (const id of NEW_SCENARIOS) {
    const next = payroll(nextLines[id], settings);
    const cmp = comparePayroll(todayPayroll, next);
    scenarios[id] = {
      direct: next.direct,
      indirect: next.indirect,
      total: next.total,
      monthlyDifference: cmp.monthlyDifference,
      yearlyDifference: cmp.yearlyDifference,
      percent: cmp.percent,
    };
  }

  notes.push(
    'Nesta versão a folha inclui salários, periculosidade, provisões, encargos e benefícios; adicionais de plantão e feriados entram nas próximas etapas.',
  );
  return {
    rows,
    totals: {
      today: sum((r) => r.today),
      need: {
        '6x1_44': sum((r) => r.need['6x1_44']),
        '5x2_42': sum((r) => r.need['5x2_42']),
        '5x2_40': sum((r) => r.need['5x2_40']),
      },
      hire: { '5x2_42': sum((r) => r.hire['5x2_42']), '5x2_40': sum((r) => r.hire['5x2_40']) },
    },
    payroll: {
      today: {
        direct: todayPayroll.direct,
        indirect: todayPayroll.indirect,
        total: todayPayroll.total,
      },
      scenarios,
    },
    notes,
  };
}
