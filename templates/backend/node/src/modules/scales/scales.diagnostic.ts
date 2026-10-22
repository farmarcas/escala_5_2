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
import { hourlyRate, nightMinutes } from './engine/night.js';
import { PAY, SCENARIOS, SCHEDULE, type ScenarioId } from './engine/rules.js';
import { analyzeSales, type SalesAnalysis } from './engine/sales.js';
import { plantaoNightsPerWeek, plantaoShiftTimes } from './engine/plantao.js';
import {
  eventsFor,
  holidayDays,
  plantaoExtraPostsPerWeek,
  plantaoRoleOf,
  coverageRole,
} from './scales.events.js';
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
  // Folha mensal da função: hoje e em cada cenário.
  cost: { today: number } & Record<NewScenario, number>;
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

export type HolidayRow = {
  date: string;
  name: string;
  scope: 'nacional' | 'estadual_municipal';
  open: boolean;
  working: number;
  off: number;
};

export type HolidaySummary = {
  rows: HolidayRow[];
  // Folgas compensatórias geradas no período (zero quando o feriado é pago em dobro).
  compensatoryDays: number;
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
  holidays: Record<NewScenario, HolidaySummary>;
  // Análise de vendas, CMV e meta da folha (nulo quando desligada): hoje e em cada cenário.
  sales: { today: SalesAnalysis; scenarios: Record<NewScenario, SalesAnalysis> } | null;
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

// Pessoas entre as quais o plantão gira no custo de hoje.
const PLANTAO_ROTATION = 4;

type GroupScenario = {
  need: number;
  roster: Roster;
  // Médias por pessoa paga e por mês (o dono farmacêutico fica de fora).
  // Horas noturnas reduzidas (22h às 5h, 52 min 30 s por hora) que cada pessoa trabalha.
  nightReducedHoursPerMonth: number;
  shiftsPerMonth: number;
  // Horas além da jornada diária (já com a hora noturna reduzida) e turnos de plantão.
  overtimeHoursPerMonth: number;
  plantaoShiftsPerMonth: number;
  // Horas trabalhadas em feriado, por mês.
  holidayHoursPerMonth: number;
};

// Pessoas necessárias: parte da fórmula de dimensionamento e sobe até a escala de 4 semanas fechar de verdade.
function planGroup(
  store: ScaleStoreInput,
  lead: ScaleRoleInput,
  id: ScenarioId,
  today: number,
): GroupScenario {
  const week = buildWeekHours(store.hours as StoreHoursInput);
  const options = { lunchMinutes: store.rules.lunchMinutes, sundayRule: store.rules.sundayRule };
  const formula = requiredPeople(
    { ...coverageRole(lead), extraPostsPerWeek: plantaoExtraPostsPerWeek(store, lead.role) },
    week,
    SCENARIOS[id],
    options,
  );
  const start = formula.ok ? formula.people : 0;
  const empty: Roster = { ok: true, people: [], unfilled: [] };
  const none = {
    need: 0,
    roster: empty,
    nightReducedHoursPerMonth: 0,
    shiftsPerMonth: 0,
    overtimeHoursPerMonth: 0,
    plantaoShiftsPerMonth: 0,
    holidayHoursPerMonth: 0,
  };
  if (start === 0) return none;
  const result = rosterWithMinimumPeople(
    {
      role: coverageRole(lead),
      week,
      scenario: SCENARIOS[id],
      lunchMinutes: store.rules.lunchMinutes,
      snackMinutes: store.rules.snackMinutes,
      sundayRule: store.rules.sundayRule,
      hasOwner: lead.ownerIsPharmacist,
      events: eventsFor(store, lead.role),
    },
    start,
  );
  // Se a loja já tem mais gente que o necessário, os adicionais se espalham por todos (o excedente é reforço).
  const costed =
    today > result.count
      ? rosterWithMinimumPeople(
          {
            role: coverageRole(lead),
            week,
            scenario: SCENARIOS[id],
            lunchMinutes: store.rules.lunchMinutes,
            snackMinutes: store.rules.snackMinutes,
            sundayRule: store.rules.sundayRule,
            hasOwner: lead.ownerIsPharmacist,
            events: eventsFor(store, lead.role),
          },
          today,
        )
      : result;
  const paid = costed.people.filter((p) => !p.isOwner);
  // Na 12x36 o dia normal já é de 12 h: só o que passa disso é hora extra.
  const dailyHours =
    lead.scaleType === 'doze_x_trinta_e_seis'
      ? SCHEDULE.twelveByThirtySix.dailyHours
      : SCENARIOS[id].dailyHours;
  let nightReduced = 0;
  let nightReducedPlantao = 0;
  let shifts = 0;
  let plantaoShifts = 0;
  let overtime = 0;
  let overtimePlantao = 0;
  let holidayMinutes = 0;
  for (const p of paid) {
    for (const cell of p.days) {
      if (!cell) continue;
      shifts += 1;
      const night = nightMinutes(cell, cell.lunch);
      const reduced = night / PAY.nightHourMinutes;
      // Horas pagas (a noturna conta menos minutos) acima da jornada do dia viram hora extra.
      const extra = Math.max(0, (cell.workMinutes - night) / 60 + reduced - dailyHours);
      if (cell.kind === 'plantao') {
        plantaoShifts += 1;
        nightReducedPlantao += reduced;
        overtimePlantao += extra;
      } else {
        nightReduced += reduced;
        overtime += extra;
        if (cell.holiday) holidayMinutes += cell.workMinutes;
      }
    }
  }
  const n = Math.max(paid.length, 1);
  const perMonth = PAY.weeksPerMonth / SCHEDULE.weeks / n;
  // Hoje (6x1): o plantão gira entre até 4 pessoas (uma noite a cada 4 semanas cada uma); com menos de 4
  // pessoas, as noites sem ninguém não entram no custo. Conferido com o painel de referência.
  const perMonthPlantao =
    id === '6x1_44' && today > 0
      ? ((PAY.weeksPerMonth / SCHEDULE.weeks) *
          (Math.min(today, PLANTAO_ROTATION) / PLANTAO_ROTATION)) /
        today
      : perMonth;
  return {
    need: result.count,
    roster: result,
    nightReducedHoursPerMonth: nightReduced * perMonth + nightReducedPlantao * perMonthPlantao,
    shiftsPerMonth: shifts * perMonth,
    overtimeHoursPerMonth: overtime * perMonth + overtimePlantao * perMonthPlantao,
    plantaoShiftsPerMonth: plantaoShifts * perMonthPlantao,
    holidayHoursPerMonth: (holidayMinutes / 60) * perMonth,
  };
}

// Adicionais mensais de uma pessoa da função, vindos da escala (noturno e intervalo indenizado na 12x36).
// A 12x36 trabalha 42 h por semana em média (3,5 dias de 12 h): a hora vale salário ÷ 210.
const rateWeeklyHours = (role: ScaleRoleInput, scenario: ScenarioId) =>
  role.scaleType === 'doze_x_trinta_e_seis' ? 42 : SCENARIOS[scenario].weeklyHours;

const daysPerWeekOf = (role: ScaleRoleInput, scenario: ScenarioId) =>
  role.scaleType === 'doze_x_trinta_e_seis'
    ? SCHEDULE.twelveByThirtySix.daysPerWeek
    : SCENARIOS[scenario].daysPerWeek;

function additionsFor(
  store: ScaleStoreInput,
  role: ScaleRoleInput,
  scenario: ScenarioId,
  plan: GroupScenario,
): Additions {
  const rate = hourlyRate(role.monthlySalary, rateWeeklyHours(role, scenario));
  const additions: Additions = {
    // Adicional de 20% sobre as horas noturnas reduzidas; as horas a mais da hora reduzida entram como extra.
    night: rate * PAY.nightAdditional * plan.nightReducedHoursPerMonth,
    overtime: rate * (1 + PAY.overtimePremium) * plan.overtimeHoursPerMonth,
    indemnifiedBreak: 0,
  };
  if (role.scaleType === 'doze_x_trinta_e_seis' && store.rules.indemnifyBreak) {
    // 12x36: a hora de intervalo não gozada entra como hora extra a 150% (conferido com a referência).
    additions.overtime =
      (additions.overtime ?? 0) + rate * (1 + PAY.overtimePremium) * plan.shiftsPerMonth;
  }
  if (store.plantao.indemnifyBreak) {
    additions.indemnifiedBreak =
      (additions.indemnifiedBreak ?? 0) +
      // Intervalo de 1 h do plantão pago a 150% da hora normal (conferido com a referência).
      rate * (1 + PAY.indemnifiedBreakPremium) * plan.plantaoShiftsPerMonth;
  }
  if (store.holidays.compensation === 'dobro') {
    additions.holidayDouble = rate * plan.holidayHoursPerMonth;
  }
  return additions;
}

// Plantonista intermitente (CLT art. 452-A): paga só as horas convocadas, com adicional noturno e a hora
// noturna reduzida; só existe na nova escala (o painel de referência não cobra isso de hoje).
function intermittentLines(store: ScaleStoreInput, scenario: ScenarioId): PayrollLine[] {
  const { plantao } = store;
  if (plantao.type === 'none' || plantao.cover !== 'intermittent') return [];
  const times = plantaoShiftTimes(plantao);
  const breakHole = plantao.indemnifyBreak
    ? null
    : { start: times.start + 240, end: times.start + 300 };
  const night = nightMinutes({ start: times.start, end: times.end }, breakHole);
  const reducedNight = night / PAY.nightHourMinutes;
  // Horas pagas por noite: dia + noite reduzida + 20% de adicional noturno sobre a noite reduzida.
  const paidHours =
    (times.workMinutes - night) / 60 + reducedNight + PAY.nightAdditional * reducedNight;
  const nightsPerMonth = plantaoNightsPerWeek(plantao) * PAY.weeksPerMonth;
  const lines: PayrollLine[] = [];
  for (const role of store.roles) {
    const key = plantaoRoleOf(role.role);
    if (!key || !role.enabled || plantao.people[key] <= 0) continue;
    const rate = hourlyRate(role.monthlySalary, SCENARIOS[scenario].weeklyHours);
    lines.push({
      salary: rate * paidHours * nightsPerMonth,
      people: plantao.people[key],
      daysPerWeek: 0,
      intermittent: true,
    });
  }
  return lines;
}

const summarize = (p: ReturnType<typeof payroll>): PayrollSummary => ({
  direct: p.direct,
  indirect: p.indirect,
  total: p.total,
  components: p.components,
});

// Quantos trabalham e quantos folgam em cada feriado do período, somando todas as funções.
function holidaySummary(store: ScaleStoreInput, plans: GroupScenario[]): HolidaySummary {
  const days = holidayDays(store);
  const rows: HolidayRow[] = [];
  let compensatory = 0;
  days.forEach((holiday, slot) => {
    if (!holiday) return;
    let working = 0;
    let off = 0;
    for (const plan of plans) {
      for (const p of plan.roster.people) {
        if (p.isOwner) continue;
        const cell = p.days[slot];
        if (cell && cell.kind !== 'plantao') working += 1;
        else off += 1;
      }
    }
    const open = store.holidays.openOnHolidays;
    if (open && store.holidays.compensation === 'folga') compensatory += working;
    rows.push({ date: holiday.date, name: holiday.name, scope: holiday.scope, open, working, off });
  });
  return { rows, compensatoryDays: compensatory };
}

function salesFor(
  store: ScaleStoreInput,
  today: number,
  next: Record<NewScenario, number>,
): Diagnostic['sales'] {
  const now = analyzeSales(store.sales, today);
  const a = analyzeSales(store.sales, next['5x2_42']);
  const b = analyzeSales(store.sales, next['5x2_40']);
  return now && a && b ? { today: now, scenarios: { '5x2_42': a, '5x2_40': b } } : null;
}

export function diagnose(store: ScaleStoreInput, overrides: DiagnosticOverrides = {}): Diagnostic {
  const settings = costSettingsOf(store, overrides);
  const active = store.roles.filter((r) => r.enabled);

  const rows: DiagnosticRow[] = [];
  const todayLines: PayrollLine[] = [];
  const nextLines: Record<NewScenario, PayrollLine[]> = { '5x2_42': [], '5x2_40': [] };
  const perPerson: Record<NewScenario, PersonCostRow[]> = { '5x2_42': [], '5x2_40': [] };
  const allPlans: Record<NewScenario, GroupScenario[]> = { '5x2_42': [], '5x2_40': [] };

  for (const group of GROUPS) {
    const members = active.filter((r) => group.roles.includes(r.role));
    if (members.length === 0) continue;
    // A cobertura da função vem do primeiro membro com mínimo no salão (gerente e subgerente dividem o posto).
    const lead = members.find((r) => r.minInHall > 0) ?? members[0]!;
    const todayHeadcount = members.reduce((n, r) => n + r.headcount, 0);
    const plans = {} as Record<ScenarioId, GroupScenario>;
    const need = {} as Record<ScenarioId, number>;
    for (const id of Object.keys(SCENARIOS) as ScenarioId[]) {
      plans[id] = planGroup(store, lead, id, todayHeadcount);
      need[id] = plans[id].need;
    }
    for (const id of NEW_SCENARIOS) allPlans[id].push(plans[id]);
    const marks = {
      today: todayLines.length,
      '5x2_42': nextLines['5x2_42'].length,
      '5x2_40': nextLines['5x2_40'].length,
    };
    const today = members.reduce((n, r) => n + r.headcount, 0);
    // Quem entra por contratação recebe o menor salário da função (o painel de referência faz o mesmo na gerência).
    const avgSalary = Math.min(...members.map((r) => r.monthlySalary));
    const motorcycle = members.some((r) => r.motorcycle);

    for (const r of members) {
      todayLines.push({
        salary: r.monthlySalary,
        people: r.headcount,
        motorcycle: r.motorcycle,
        daysPerWeek: daysPerWeekOf(r, '6x1_44'),
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
        const memberDays = daysPerWeekOf(r, id);
        const additions = additionsFor(store, r, id, plans[id]);
        nextLines[id].push({
          salary: r.monthlySalary,
          people: r.headcount,
          motorcycle: r.motorcycle,
          daysPerWeek: memberDays,
          additions,
        });
        const c = personCost(
          { salary: r.monthlySalary, motorcycle: r.motorcycle, daysPerWeek: memberDays, additions },
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
      cost: {
        today: payroll(todayLines.slice(marks.today), settings).total,
        '5x2_42': payroll(nextLines['5x2_42'].slice(marks['5x2_42']), settings).total,
        '5x2_40': payroll(nextLines['5x2_40'].slice(marks['5x2_40']), settings).total,
      },
    });
  }

  const sum = (f: (row: DiagnosticRow) => number) => rows.reduce((n, row) => n + f(row), 0);
  for (const id of NEW_SCENARIOS) nextLines[id].push(...intermittentLines(store, id));
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
    holidays: {
      '5x2_42': holidaySummary(store, allPlans['5x2_42']),
      '5x2_40': holidaySummary(store, allPlans['5x2_40']),
    },
    sales: salesFor(store, todayPayroll.total, {
      '5x2_42': scenarios['5x2_42'].total,
      '5x2_40': scenarios['5x2_40'].total,
    }),
    notes: [
      'O custo inclui salários, periculosidade, adicional noturno da escala, horas extras e intervalo indenizado do plantão, feriado em dobro (quando escolhido), provisões, encargos e benefícios.',
    ],
  };
}
