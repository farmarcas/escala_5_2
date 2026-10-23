// Regras legais e valores do painel, em um lugar só. Toda regra traz a base legal e a vigência;
// a página "Regras aplicadas" lê esta lista. Os valores são premissas de planejamento: o jurídico e a
// contabilidade da Farmarcas precisam validar antes de uso real (specs/004-painel-de-escalas/plan.md).

export type ScenarioId = '6x1_44' | '5x2_42' | '5x2_40';

export type Scenario = {
  id: ScenarioId;
  label: string;
  daysPerWeek: number;
  weeklyHours: number;
  // Jornada diária trabalhada (sem o almoço).
  dailyHours: number;
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  '6x1_44': {
    id: '6x1_44',
    label: '6x1 · 44h',
    daysPerWeek: 6,
    weeklyHours: 44,
    dailyHours: 44 / 6,
  },
  '5x2_42': {
    id: '5x2_42',
    label: '5x2 · 42h',
    daysPerWeek: 5,
    weeklyHours: 42,
    dailyHours: 42 / 5,
  },
  '5x2_40': {
    id: '5x2_40',
    label: '5x2 · 40h',
    daysPerWeek: 5,
    weeklyHours: 40,
    dailyHours: 40 / 5,
  },
};

export const REFERENCE_DATE = '2026-10-16'; // promulgação da EC 141/2026 (vigência das regras abaixo)

export const SCHEDULE = {
  // CLT art. 71: acima de 6 h de trabalho, intervalo de 1 h a 2 h.
  lunchRequiredAboveMinutes: 6 * 60,
  defaultLunchMinutes: 60,
  maxLunchMinutes: 120,
  // Lanche de 15 min entre 4 h e 6 h é tempo pago.
  defaultSnackMinutes: 15,
  // CLT art. 66: 11 h de descanso entre jornadas.
  minRestBetweenShiftsMinutes: 11 * 60,
  // Semanas simuladas na escala.
  weeks: 4,
  // 12x36 trabalha em média 3,5 dias por semana, 12 h por dia.
  twelveByThirtySix: { dailyHours: 12, daysPerWeek: 3.5 },
} as const;

// Lei 10.101/2000, art. 6º: repouso no domingo ao menos 1 vez a cada 3 semanas no comércio.
export type SundayRule = 'um_em_tres' | 'um_em_dois' | 'todo_domingo';

// Fração das semanas em que cada pessoa trabalha no domingo.
export const SUNDAY_WORK_SHARE: Record<SundayRule, number> = {
  um_em_tres: 2 / 3,
  um_em_dois: 1 / 2,
  todo_domingo: 0,
};

export const PAY = {
  // CLT art. 73.
  nightAdditional: 0.2,
  nightHourMinutes: 52.5,
  nightWindow: { start: 22 * 60, end: 5 * 60 },
  // CLT art. 71 §4º: intervalo suprimido é pago com acréscimo de 50%.
  indemnifiedBreakPremium: 0.5,
  // CLT art. 193 §4º: entregador de moto.
  hazardPay: 0.3,
  // Domingo e feriado trabalhado sem folga: pago em dobro (Lei 605/1949, art. 9º).
  holidayDoublePay: 2,
  weeksPerMonth: 4.34,
  overtimePremium: 0.5,
} as const;

export const CHARGES = {
  fgts: 0.08,
  fgtsFine: 0.4,
  // INSS patronal 20% + RAT 2% + terceiros 5,8% (Lucro Presumido/Real); no Simples vai dentro do DAS.
  inssEmployer: 0.2,
  defaultRat: 0.02,
  defaultThirdParty: 0.058,
  // 13º (1/12) e férias com 1/3 (1/9).
  thirteenth: 1 / 12,
  vacation: 1 / 9,
  // Lei 7.418/85: o empregado arca com até 6% do salário no vale-transporte.
  transportEmployeeShare: 0.06,
} as const;

export type LegalRule = {
  id: string;
  title: string;
  text: string;
  source: string;
  effectiveFrom: string;
};

export const LEGAL_RULES: readonly LegalRule[] = [
  {
    id: 'fim-6x1',
    title: 'Fim da 6x1 e escala 5x2',
    text: 'Dois dias de repouso semanal remunerado, um preferencialmente aos domingos, sem redução de salário.',
    source: 'EC 141/2026',
    effectiveFrom: '2026-12-15',
  },
  {
    id: 'transicao-42-40',
    title: '42 h agora, 40 h depois',
    text: 'Na transição a jornada máxima é de 42 h (8h24 por dia em 5 dias); depois da transição, 40 h e 8 h por dia.',
    source: 'EC 141/2026 · transição',
    effectiveFrom: '2026-12-15',
  },
  {
    id: 'doze-por-trinta-e-seis',
    title: '12x36 só com convenção ou acordo coletivo',
    text: 'Regime compensatório diferente da 5x2 é admitido excepcionalmente por convenção ou acordo coletivo. Na 12x36 o intervalo pode ser indenizado.',
    source: 'EC 141/2026 · CLT art. 59-A',
    effectiveFrom: '2026-12-15',
  },
  {
    id: 'folga-dominical',
    title: 'Folga dominical no comércio',
    text: 'O repouso deve coincidir com o domingo pelo menos uma vez a cada três semanas, salvo regra mais favorável na convenção coletiva.',
    source: 'Lei 10.101/2000, art. 6º',
    effectiveFrom: '2000-12-19',
  },
  {
    id: 'farmaceutico',
    title: 'Farmacêutico em todo o horário',
    text: 'A farmácia precisa de farmacêutico presente durante todo o funcionamento, inclusive no plantão. O painel nunca deixa essa função descoberta.',
    source: 'Lei 13.021/2014',
    effectiveFrom: '2014-08-08',
  },
  {
    id: 'descanso-11h',
    title: '11 h entre jornadas',
    text: 'Quem fecha a loja não pode abrir no dia seguinte se o descanso ficar abaixo de 11 h. O painel mantém turnos fixos e respeita esse limite.',
    source: 'CLT art. 66',
    effectiveFrom: '1943-05-01',
  },
  {
    id: 'intervalos',
    title: 'Intervalos',
    text: 'Acima de 6 h de trabalho, intervalo de 1 h a 2 h. Entre 4 h e 6 h, 15 min. Intervalo suprimido é pago com acréscimo de 50%. O lanche de 15 min é tratado como tempo pago.',
    source: 'CLT art. 71',
    effectiveFrom: '1943-05-01',
  },
  {
    id: 'noturno',
    title: 'Trabalho noturno',
    text: 'Entre 22 h e 5 h, adicional de 20% e hora noturna de 52 min 30 s.',
    source: 'CLT art. 73',
    effectiveFrom: '1943-05-01',
  },
  {
    id: 'entregador-moto',
    title: 'Entregador de moto',
    text: 'Adicional de periculosidade de 30% sobre o salário. A aplicação depende da regulamentação do Ministério do Trabalho; confirme com o contador.',
    source: 'CLT art. 193, §4º (Lei 12.997/2014)',
    effectiveFrom: '2014-06-18',
  },
  {
    id: 'intermitente',
    title: 'Plantonista intermitente',
    text: 'Para plantões esporádicos, o contrato intermitente paga apenas as horas convocadas, com férias, 13º, FGTS e INSS proporcionais.',
    source: 'CLT art. 452-A',
    effectiveFrom: '2017-11-11',
  },
  {
    id: 'feriados',
    title: 'Feriados',
    text: 'Feriado é descanso remunerado. Quem trabalha no feriado tem direito a folga compensatória em outro dia ou ao pagamento em dobro. A folga que coincide com o feriado não gera outra folga pela lei; convenções podem prever o contrário. Na 12x36 os feriados já estão compensados.',
    source: 'Lei 605/1949, art. 9º · Súmula 146 TST · CLT art. 59-A · Lei 10.101/2000, art. 6º-A',
    effectiveFrom: '1949-01-05',
  },
  {
    id: 'encargos',
    title: 'Encargos por regime',
    text: 'Simples Nacional (Anexo I): INSS patronal dentro do DAS; FGTS 8%. Lucro Presumido/Real: INSS 20% + RAT/FAP + terceiros 5,8% + FGTS 8%. Provisões de 13º (1/12) e férias + 1/3 (1/9).',
    source: 'Lei 8.212/91 · LC 123/2006',
    effectiveFrom: '1991-07-24',
  },
];
