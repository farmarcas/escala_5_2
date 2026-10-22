import { buildWeekHours, type StoreHoursInput } from './engine/coverage.js';
import {
  comparePayroll,
  payroll,
  personCost,
  type Additions,
  type Components,
  type CostSettings,
  type PayrollLine,
  type TaxRegime,
} from './engine/costs.js';
import { hourlyRate, nightAdditionMonthly, nightMinutes } from './engine/night.js';
import { PAY, SCENARIOS, SCHEDULE, type ScenarioId } from './engine/rules.js';
import { rosterWithMinimumPeople, type Roster } from './engine/roster.js';
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

export type PersonCostRow = {
  key: string;
  label: string;
  salary: number;
  additions: number;
  provisions: number;
  charges: number;
  benefits: number;
  total: number;
};

export type PayrollSummary = {
  direct: number;
  indirect: number;
  total: number;
  components: Components;
};

export type Diagnostic = {
  rows: DiagnosticRow[];
  totals: { today: number; need: Record<ScenarioId, number>; hire: Record<NewScenario, number> };
  payroll: {
    taxRegime: TaxRegime;
    provisions: boolean;
    today: PayrollSummary;
    scenarios: Record<
      NewScenario,
      PayrollSummary & {
        monthlyDifference: number;
        yearlyDifference: number;
        percent: number;
        perPerson: PersonCostRow[];
      }
    >;
  };
  notes: string[];
};

// Mudanças de regime e provisões que o painel simula sem gravar a loja.
export type DiagnosticOverrides = { taxRegime?: TaxRegime; provisions?: boolean };

export function costSettingsOf(
  store: ScaleStoreInput,
  overrides: DiagnosticOverrides = {},
): CostSettings {
  return {
    taxRegime: overrides.taxRegime ?? store.taxRegime,
    provisions: overrides.provisions ?? store.rules.provisions,
    rat: store.rules.rat,
    thirdParty: store.rules.thirdParty,
    transport: store.rules.transport,
    benefits: store.rules.benefits,
  };
}

type GroupScenario = {
  need: number;
  roster: Roster;
  // Médias por pessoa paga (o dono farmacêutico fica de fora).
  nightMinutesPerWeek: number;
  shiftsPerMonth: number;
};

// Pessoas necessárias: parte da fórmula de dimensionamento e sobe até a escala de 4 semanas fechar de verdade.
function planGroup(store: ScaleStoreInput, lead: ScaleRoleInput, id: ScenarioId): GroupScenario {
  const week = buildWeekHours(store.hours as StoreHoursInput);
  const options = { lunchMinutes: store.rules.lunchMinutes, sundayRule: store.rules.sundayRule };
  const formula = requiredPeople({ ...lead, extraPostsPerWeek: 0 }, week, SCENARIOS[id], options);
  const start = formula.ok ? formula.people : 0;
  const empty: Roster = { ok: true, people: [], unfilled: [] };
  if (start === 0) return { need: 0, roster: empty, nightMinutesPerWeek: 0, shiftsPerMonth: 0 };
  const result = rosterWithMinimumPeople(
    {
      role: lead,
      week,
      scenario: SCENARIOS[id],
      lunchMinutes: store.rules.lunchMinutes,
      snackMinutes: store.rules.snackMinutes,
      sundayRule: store.rules.sundayRule,
      hasOwner: lead.ownerIsPharmacist,
    },
    start,
  );
  const paid = result.people.filter((p) => !p.isOwner);
  let night = 0;
  let shifts = 0;
  for (const p of paid) {
    for (const cell of p.days) {
      if (!cell) continue;
      shifts += 1;
      night += nightMinutes(cell, cell.lunch);
    }
  }
  const n = Math.max(paid.length, 1);
  return {
    need: result.count,
    roster: result,
    nightMinutesPerWeek: night / n / SCHEDULE.weeks,
    shiftsPerMonth: (shifts / n / SCHEDULE.weeks) * PAY.weeksPerMonth,
  };
}

// Adicionais mensais de uma pessoa da função, vindos da escala (noturno e intervalo indenizado na 12x36).
function additionsFor(
  store: ScaleStoreInput,
  role: ScaleRoleInput,
  scenario: ScenarioId,
  plan: GroupScenario,
): Additions {
  const rate = hourlyRate(role.monthlySalary, SCENARIOS[scenario].weeklyHours);
  const additions: Additions = {
    night: nightAdditionMonthly(rate, plan.nightMinutesPerWeek),
  };
  if (role.scaleType === 'doze_x_trinta_e_seis' && store.rules.indemnifyBreak) {
    additions.indemnifiedBreak = rate * PAY.indemnifiedBreakPremium * plan.shiftsPerMonth;
  }
  return additions;
}

const summarize = (p: ReturnType<typeof payroll>): PayrollSummary => ({
  direct: p.direct,
  indirect: p.indirect,
  total: p.total,
  components: p.components,
});

export function diagnose(store: ScaleStoreInput, overrides: DiagnosticOverrides = {}): Diagnostic {
  const settings = costSettingsOf(store, overrides);
  const active = store.roles.filter((r) => r.enabled);

  const rows: DiagnosticRow[] = [];
  const todayLines: PayrollLine[] = [];
  const nextLines: Record<NewScenario, PayrollLine[]> = { '5x2_42': [], '5x2_40': [] };
  const perPerson: Record<NewScenario, PersonCostRow[]> = { '5x2_42': [], '5x2_40': [] };

  for (const group of GROUPS) {
    const members = active.filter((r) => group.roles.includes(r.role));
    if (members.length === 0) continue;
    // A cobertura da função vem do primeiro membro com mínimo no salão (gerente e subgerente dividem o posto).
    const lead = members.find((r) => r.minInHall > 0) ?? members[0]!;
    const plans = {} as Record<ScenarioId, GroupScenario>;
    const need = {} as Record<ScenarioId, number>;
    for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
      plans[id] = planGroup(store, lead, id);
      need[id] = plans[id].need;
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
        additions: additionsFor(store, r, '6x1_44', plans['6x1_44']),
      });
    }
    const hire = {} as DiagnosticRow['hire'];
    const reinforcement = {} as DiagnosticRow['reinforcement'];
    for (const id of NEW_SCENARIOS) {
      hire[id] = Math.max(0, need[id] - today);
      reinforcement[id] = Math.max(0, today - need[id]);
      const days = SCENARIOS[id].daysPerWeek;
      for (const r of members) {
        const additions = additionsFor(store, r, id, plans[id]);
        nextLines[id].push({
          salary: r.monthlySalary,
          people: r.headcount,
          motorcycle: r.motorcycle,
          daysPerWeek: days,
          additions,
        });
        const c = personCost(
          { salary: r.monthlySalary, motorcycle: r.motorcycle, daysPerWeek: days, additions },
          settings,
        );
        perPerson[id].push({
          key: r.role,
          label: r.role,
          salary: c.salary,
          additions: c.hazard + c.extras,
          provisions: c.provisionsAmount,
          charges: c.fgts + c.fgtsFine + c.inss,
          benefits: c.benefits,
          total: c.total,
        });
      }
      nextLines[id].push({
        salary: avgSalary,
        people: hire[id],
        motorcycle,
        daysPerWeek: days,
        additions: additionsFor(store, { ...lead, monthlySalary: avgSalary }, id, plans[id]),
      });
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
      ...summarize(next),
      monthlyDifference: cmp.monthlyDifference,
      yearlyDifference: cmp.yearlyDifference,
      percent: cmp.percent,
      perPerson: perPerson[id],
    };
  }

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
      taxRegime: settings.taxRegime,
      provisions: settings.provisions,
      today: summarize(todayPayroll),
      scenarios,
    },
    notes: [
      'Plantão noturno, feriados trabalhados e horas extras entram na próxima etapa; hoje o custo inclui salários, periculosidade, adicional noturno da escala, intervalo indenizado (12x36), provisões, encargos e benefícios.',
    ],
  };
}
