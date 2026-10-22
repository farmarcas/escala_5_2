// Espelho dos contratos da API do Painel de Escalas (backend/node/src/modules/scales).

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
    rat: number;
    thirdParty: number;
    transport: { tripsPerDay: number; fare: number };
    benefits: number;
  };
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
};

export type ScenarioKey = '5x2_42' | '5x2_40';

export type DiagnosticRow = {
  key: string;
  label: string;
  today: number;
  need: Record<'6x1_44' | ScenarioKey, number>;
  gap6x1: number;
  hire: Record<ScenarioKey, number>;
  reinforcement: Record<ScenarioKey, number>;
};

export type Diagnostic = {
  rows: DiagnosticRow[];
  totals: {
    today: number;
    need: Record<'6x1_44' | ScenarioKey, number>;
    hire: Record<ScenarioKey, number>;
  };
  payroll: {
    today: { direct: number; indirect: number; total: number };
    scenarios: Record<
      ScenarioKey,
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
