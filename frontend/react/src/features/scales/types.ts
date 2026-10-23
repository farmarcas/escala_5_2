// Espelho dos contratos da API do Radar Escala (backend/node/src/modules/scales).

export type RoleName =
  | 'farmaceutico'
  | 'gerente'
  | 'subgerente'
  | 'balconista'
  | 'caixa'
  | 'perfumista'
  | 'servicos_gerais'
  | 'entregador'
  | 'comprador'
  | 'conferente'
  | 'atendente_digital'
  | 'expedicao';

export type ScaleRole = {
  role: RoleName;
  enabled: boolean;
  headcount: number;
  monthlySalary: number;
  scaleType: 'normal' | 'doze_x_trinta_e_seis';
  minInHall: number;
  coverage: { mode: 'all' } | { mode: 'band'; start: string; end: string };
  daysMask: number;
  ownerIsPharmacist: boolean;
  motorcycle: boolean;
};

export type DayOverride = { closed: true } | { start: string; end: string };

export type PlantaoRole = 'farmaceutico' | 'balconista' | 'caixa';

export type PlantaoSettings = {
  type: 'none' | 'weekly' | 'monthly';
  weekday: number;
  cycleWeek: number;
  start: string;
  end: string;
  people: Record<PlantaoRole, number>;
  cover: 'team' | 'intermittent';
  indemnifyBreak: boolean;
};

export type HolidaySettings = {
  national: boolean;
  extra: { date: string; name: string }[];
  rotation: 'rotativa' | 'fixa';
  compensation: 'folga' | 'dobro';
  offOnHolidayCounts: boolean;
  openOnHolidays: boolean;
};

export type SalesSettings = {
  enabled: boolean;
  monthlySales: number;
  cmvRate: number;
  payrollTargetRate: number;
};

// Números infinitos chegam como nulos pelo JSON (CMV de 100% ou meta zero: nenhuma venda paga).
export type SalesAnalysis = {
  monthlySales: number;
  cmv: number;
  payroll: number;
  payrollShare: number;
  margin: number;
  breakEvenSales: number | null;
  targetSales: number | null;
  growthToTarget: number | null;
};

export type ScaleStoreDraft = {
  name: string;
  city: string;
  state: string;
  scaleStartDate: string;
  taxRegime: 'simples' | 'lucro_presumido_real';
  hours: {
    always24h: boolean;
    standard: { start: string; end: string; daysMask: number };
    overrides: Partial<Record<string, DayOverride>>;
  };
  rules: {
    sundayRule: 'um_em_tres' | 'um_em_dois' | 'todo_domingo';
    lunchMinutes: number;
    snackMinutes: number;
    provisions: boolean;
    indemnifyBreak: boolean;
    cct: string;
    rat: number;
    thirdParty: number;
    transport: { tripsPerDay: number; fare: number };
    benefits: number;
  };
  plantao: PlantaoSettings;
  holidays: HolidaySettings;
  sales: SalesSettings;
  roles: ScaleRole[];
};

export type ScaleStore = ScaleStoreDraft & { id: string; createdAt: string; updatedAt: string };

export type ScaleStoreSummary = {
  id: string;
  name: string;
  city: string;
  state: string;
  people: number;
  updatedAt: string;
  // Horas de funcionamento por semana e situação de cada dia (segunda a domingo).
  weeklyHours: number;
  days: ('open' | 'reduced' | 'closed')[];
};

export type ScenarioKey = '5x2_42' | '5x2_40';

export type DiagnosticRow = {
  key: string;
  label: string;
  today: number;
  need: Record<'6x1_44' | ScenarioKey, number>;
  gap6x1: number;
  // Falta para cobrir o horário hoje (6x1) e efeito só da nova escala; fill + effect = hire.
  fill: number;
  effect: Record<ScenarioKey, number>;
  hire: Record<ScenarioKey, number>;
  reinforcement: Record<ScenarioKey, number>;
  cost: { today: number } & Record<ScenarioKey, number>;
};

export type Components = {
  salary: number;
  hazard: number;
  holidayDouble: number;
  night: number;
  overtime: number;
  dsr: number;
  indemnifiedBreak: number;
  thirteenth: number;
  vacation: number;
  fgts: number;
  fgtsFine: number;
  inss: number;
  transport: number;
  otherBenefits: number;
};

export type PayrollSummary = {
  direct: number;
  indirect: number;
  total: number;
  components: Components;
};

export type PersonCostRow = {
  key: RoleName;
  label: string;
  salary: number;
  additions: number;
  provisions: number;
  charges: number;
  benefits: number;
  total: number;
};

export type Alert = { id: string; severity: 'danger' | 'warning' | 'info'; message: string };

export type LegalRule = {
  id: string;
  title: string;
  text: string;
  source: string;
  effectiveFrom: string;
};

export type Diagnostic = {
  rows: DiagnosticRow[];
  totals: {
    today: number;
    need: Record<'6x1_44' | ScenarioKey, number>;
    hire: Record<ScenarioKey, number>;
    fill: number;
    effect: Record<ScenarioKey, number>;
  };
  payroll: {
    taxRegime: 'simples' | 'lucro_presumido_real';
    provisions: boolean;
    today: PayrollSummary;
    covered: PayrollSummary;
    fillMonthly: number;
    scenarios: Record<
      ScenarioKey,
      PayrollSummary & {
        monthlyDifference: number;
        effectMonthly: number;
        yearlyDifference: number;
        percent: number;
        perPerson: PersonCostRow[];
      }
    >;
  };
  holidays: Record<ScenarioKey, HolidaySummary>;
  sales: { today: SalesAnalysis; scenarios: Record<ScenarioKey, SalesAnalysis> } | null;
  notes: string[];
};

export type HolidayRow = {
  date: string;
  name: string;
  scope: 'nacional' | 'estadual_municipal';
  open: boolean;
  working: number;
  off: number;
};

export type HolidaySummary = { rows: HolidayRow[]; compensatoryDays: number };

export const ROLE_LABELS: Record<RoleName, string> = {
  farmaceutico: 'Farmacêutico(a)',
  gerente: 'Gerente',
  subgerente: 'Subgerente',
  balconista: 'Balconista',
  caixa: 'Caixa',
  perfumista: 'Perfumista',
  servicos_gerais: 'Serviços gerais',
  entregador: 'Entregador',
  comprador: 'Comprador(a)',
  conferente: 'Conferente de mercadoria',
  atendente_digital: 'Atendente digital',
  expedicao: 'Expedição de pedidos',
};

export const OPTIONAL_ROLES: RoleName[] = [
  'comprador',
  'conferente',
  'atendente_digital',
  'expedicao',
];

export const SCENARIO_LABEL: Record<ScenarioKey, string> = {
  '5x2_42': '5x2 · 42h',
  '5x2_40': '5x2 · 40h',
};

export type ScenarioId = '6x1_44' | ScenarioKey;

export const ALL_SCENARIO_LABEL: Record<ScenarioId, string> = {
  '6x1_44': '6x1 · 44h',
  ...SCENARIO_LABEL,
};

export type ShiftKind = 'abertura' | 'meio' | 'fechamento' | 'unico' | 'plantao';

export type RosterCell = {
  start: string;
  end: string;
  lunch: { start: string; end: string } | null;
  snack: { start: string; end: string } | null;
  kind: ShiftKind;
  workMinutes: number;
  holiday: boolean;
};

export type RosterPerson = {
  id: string;
  label: string;
  tags: ('contratar' | 'reforco' | 'dono')[];
  days: (RosterCell | null)[];
  weekMinutes: number[];
};

export type RosterGroup = { key: string; label: string; covered: boolean; people: RosterPerson[] };

export type RosterView = {
  scenario: ScenarioId;
  startDate: string;
  dates: string[];
  holidays: (string | null)[];
  groups: RosterGroup[];
};
