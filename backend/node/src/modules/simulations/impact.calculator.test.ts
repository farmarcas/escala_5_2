import { describe, expect, it } from 'vitest';
import {
  calculateDetailedImpact,
  openingMinutesPerWeek,
  type CalcPremises,
  type CalcRole,
  type CalcStore,
} from './impact.calculator.js';

const premises: CalcPremises = {
  taxation: {
    monthsPerYear: 13.33,
    chargesRealPresumido: 1.55,
    chargesSimples: 1.25,
    irpjCsllRate: 0.34,
  },
  detailed: { targetWeeklyHours: 40, absenceRate: 0.13 },
};

const everyDay = (opensAt: string, closesAt: string) =>
  [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opensAt, closesAt }));

const pharmacist: CalcRole = {
  role: 'farmaceutico',
  minPerShift: 1,
  headcount: 2,
  weeklyHours: 44,
  monthlySalary: 8500,
  absenceRate: null,
};

const clerk: CalcRole = {
  role: 'balconista',
  minPerShift: 2,
  headcount: 5,
  weeklyHours: 44,
  monthlySalary: 2100,
  absenceRate: null,
};

const store = (overrides: Partial<CalcStore> = {}): CalcStore => ({
  id: 's1',
  name: 'Centro',
  openingHours: everyDay('08:00', '20:00'),
  roles: [pharmacist, clerk],
  ...overrides,
});

const calc = (stores: CalcStore[], regime: 'real' | 'presumido' | 'simples' = 'real') =>
  calculateDetailedImpact({ stores, regime, premises });

const roleOf = (result: ReturnType<typeof calc>, role: string, storeIndex = 0) =>
  result.stores[storeIndex]?.roles.find((item) => item.role === role);

describe('openingMinutesPerWeek', () => {
  it('deve somar as horas de cada dia aberto', () => {
    expect(openingMinutesPerWeek(everyDay('08:00', '20:00'))).toBe(7 * 12 * 60);
  });

  it('deve contar 24 horas por dia de 00:00 até 24:00', () => {
    expect(openingMinutesPerWeek(everyDay('00:00', '24:00'))).toBe(7 * 24 * 60);
  });

  it('deve virar o dia quando fecha depois da meia-noite', () => {
    expect(openingMinutesPerWeek([{ weekday: 5, opensAt: '18:00', closesAt: '02:00' }])).toBe(
      8 * 60,
    );
  });

  it('deve contar só os dias informados', () => {
    expect(
      openingMinutesPerWeek([
        { weekday: 1, opensAt: '09:00', closesAt: '18:00' },
        { weekday: 2, opensAt: '09:00', closesAt: '18:00' },
      ]),
    ).toBe(2 * 9 * 60);
  });
});

describe('calculateDetailedImpact', () => {
  it('deve bater com o caso do quickstart: balconista sem déficit e farmacêutico com 1 contratação', () => {
    const result = calc([store()]);
    const clerkResult = roleOf(result, 'balconista');
    const pharmacistResult = roleOf(result, 'farmaceutico');

    // 12h × 7 dias = 84 h/semana. Balconista: 168 h a cobrir; 5 × 40 × 0,87 = 174 h.
    expect(clerkResult?.hoursToCover).toBeCloseTo(168, 6);
    expect(clerkResult?.hoursAvailableAt40).toBeCloseTo(174, 6);
    expect(clerkResult?.newDeficit).toBe(0);
    expect(clerkResult?.peopleToHire).toBe(0);
    expect(clerkResult?.annualCost).toBe(0);

    // Farmacêutico: 84 h; a 44h: 76,56 h (déficit 7,44); a 40h: 69,6 h (déficit 14,4); novo = 6,96 h.
    expect(pharmacistResult?.hoursToCover).toBeCloseTo(84, 6);
    expect(pharmacistResult?.hoursAvailableAt40).toBeCloseTo(69.6, 6);
    expect(pharmacistResult?.baselineDeficit).toBeCloseTo(7.44, 6);
    expect(pharmacistResult?.newDeficit).toBeCloseTo(6.96, 6);
    expect(pharmacistResult?.peopleToHire).toBe(1);
    expect(pharmacistResult?.mandatoryPresence).toBe(true);
    expect(pharmacistResult?.annualCost).toBeCloseTo(8500 * 13.33 * 1.55, 2);
  });

  it('deve contar só o déficit que a mudança acrescenta quando a loja já está curta hoje', () => {
    const understaffed = store({ roles: [{ ...clerk, headcount: 4 }] });

    const result = calc([understaffed]);
    const clerkResult = roleOf(result, 'balconista');

    // 168 h a cobrir; a 44h: 4 × 44 × 0,87 = 153,12 (déficit 14,88); a 40h: 139,2 (déficit 28,8).
    expect(clerkResult?.baselineDeficit).toBeCloseTo(14.88, 6);
    expect(clerkResult?.newDeficit).toBeCloseTo(13.92, 6);
    expect(clerkResult?.peopleToHire).toBe(1);
  });

  it('não deve acrescentar custo a quem já trabalha 40h ou menos', () => {
    const partTime = store({ roles: [{ ...clerk, headcount: 4, weeklyHours: 30 }] });

    const clerkResult = roleOf(calc([partTime]), 'balconista');

    expect(clerkResult?.newDeficit).toBe(0);
    expect(clerkResult?.peopleToHire).toBe(0);
  });

  it('deve tratar a loja 24 horas (168 h por semana)', () => {
    const open24 = store({ openingHours: everyDay('00:00', '24:00'), roles: [clerk] });

    const clerkResult = roleOf(calc([open24]), 'balconista');

    // 168 × 2 = 336 h a cobrir; a 40h: 174 h; a 44h: 191,4 h. Déficit novo = 162 − 144,6 = 17,4 h.
    expect(clerkResult?.hoursToCover).toBeCloseTo(336, 6);
    expect(clerkResult?.newDeficit).toBeCloseTo(17.4, 6);
    expect(clerkResult?.peopleToHire).toBe(1);
  });

  it('deve usar a ausência da função quando informada e o padrão quando não', () => {
    const custom = store({ roles: [{ ...clerk, headcount: 4, absenceRate: 0 }] });
    const standard = store({ roles: [{ ...clerk, headcount: 4 }] });

    const customRole = roleOf(calc([custom]), 'balconista');
    const standardRole = roleOf(calc([standard]), 'balconista');

    // Sem ausência: 4 × 40 = 160 h (déficit 8 h) — a 44h: 176 h (sem déficit).
    expect(customRole?.hoursAvailableAt40).toBeCloseTo(160, 6);
    expect(customRole?.newDeficit).toBeCloseTo(8, 6);
    expect(standardRole?.newDeficit).toBeCloseTo(13.92, 6);
  });

  it('deve arredondar pessoas para cima, sem criar pessoa a mais em múltiplo exato', () => {
    // Sem ausência: cada pessoa nova entrega 40 h. Déficit novo exato de 40 h = 1 pessoa; de 40,5 h = 2.
    const exact = store({
      openingHours: [{ weekday: 1, opensAt: '00:00', closesAt: '24:00' }],
      roles: [{ ...clerk, minPerShift: 2, headcount: 1, weeklyHours: 44, absenceRate: 0 }],
    });
    // 48 h a cobrir; 1 pessoa: a 44h = 44 h (déficit 4); a 40h = 40 h (déficit 8); novo = 4 h → 1 pessoa.
    expect(roleOf(calc([exact]), 'balconista')?.peopleToHire).toBe(1);

    // Déficit novo de exatamente 40 h (10 pessoas × 4 h) = 1 pessoa, não 2 (cuidado com decimais).
    const multiple = store({
      openingHours: [{ weekday: 1, opensAt: '00:00', closesAt: '24:00' }],
      roles: [{ ...clerk, minPerShift: 20, headcount: 10, weeklyHours: 44, absenceRate: 0 }],
    });
    const multipleRole = roleOf(calc([multiple]), 'balconista');
    expect(multipleRole?.newDeficit).toBeCloseTo(40, 9);
    expect(multipleRole?.peopleToHire).toBe(1);
  });

  it('deve aplicar o efeito fiscal só no Lucro Real', () => {
    const stores = [store()];

    const real = calc(stores, 'real');
    const presumido = calc(stores, 'presumido');
    const simples = calc(stores, 'simples');

    expect(real.totals.grossAnnualImpact).toBeCloseTo(8500 * 13.33 * 1.55, 2);
    expect(real.totals.netAnnualImpact).toBeCloseTo(real.totals.grossAnnualImpact * 0.66, 2);
    expect(presumido.totals.netAnnualImpact).toBe(presumido.totals.grossAnnualImpact);
    expect(presumido.totals.grossAnnualImpact).toBeCloseTo(real.totals.grossAnnualImpact, 2);
    expect(simples.totals.grossAnnualImpact).toBeCloseTo(8500 * 13.33 * 1.25, 2);
    expect(simples.totals.netAnnualImpact).toBe(simples.totals.grossAnnualImpact);
  });

  it('deve dizer que não há contratação quando nenhuma loja tem déficit novo', () => {
    const easy = store({
      roles: [
        { ...pharmacist, headcount: 4 },
        { ...clerk, headcount: 8 },
      ],
    });

    const result = calc([easy]);

    expect(result.totals.peopleToHire).toBe(0);
    expect(result.totals.grossAnnualImpact).toBe(0);
    expect(result.stores[0]?.hasImpact).toBe(false);
  });

  it('deve somar o grupo e ordenar o ranking do maior para o menor impacto', () => {
    const big = store({
      id: 'big',
      name: 'Grande',
      roles: [{ ...pharmacist }, { ...clerk, headcount: 4 }],
    });
    const small = store({ id: 'small', name: 'Pequena', roles: [{ ...pharmacist }, { ...clerk }] });
    const none = store({
      id: 'none',
      name: 'Folgada',
      roles: [{ ...pharmacist, headcount: 4 }, { ...clerk }],
    });

    const result = calc([none, small, big]);

    expect(result.ranking.map((item) => item.storeId)).toEqual(['big', 'small', 'none']);
    const sum = result.stores.reduce((total, item) => total + item.grossAnnualImpact, 0);
    expect(result.totals.grossAnnualImpact).toBeCloseTo(sum, 6);
    expect(result.totals.peopleToHire).toBe(
      result.stores.reduce((total, item) => total + item.peopleToHire, 0),
    );
    expect(result.totals.storesWithImpact).toBe(2);
  });

  it('deve manter a ordem das lojas informada e devolver o total de horas de abertura', () => {
    const result = calc([store({ id: 'a', name: 'A' }), store({ id: 'b', name: 'B' })]);

    expect(result.stores.map((item) => item.storeId)).toEqual(['a', 'b']);
    expect(result.stores[0]?.weeklyOpenHours).toBeCloseTo(84, 6);
  });

  it('deve devolver tudo zerado para um grupo sem lojas', () => {
    const result = calc([]);

    expect(result.stores).toEqual([]);
    expect(result.totals).toMatchObject({
      grossAnnualImpact: 0,
      peopleToHire: 0,
      storesWithImpact: 0,
    });
  });

  it('deve calcular 200 lojas em muito menos de 1 segundo', () => {
    const stores = Array.from({ length: 200 }, (_, index) =>
      store({
        id: `s${index}`,
        name: `Loja ${index}`,
        roles: [pharmacist, clerk, { ...clerk, role: 'caixa' }],
      }),
    );

    const started = performance.now();
    const result = calc(stores);
    const elapsed = performance.now() - started;

    expect(result.stores).toHaveLength(200);
    expect(elapsed).toBeLessThan(200);
  });
});

describe('calculateDetailedImpact com mitigação', () => {
  const withMitigation = (
    mitigation: Parameters<typeof calculateDetailedImpact>[0]['mitigations'],
  ) =>
    calculateDetailedImpact({
      stores: [store({ roles: [{ ...clerk, headcount: 4 }, pharmacist] })],
      regime: 'real',
      premises,
      mitigations: mitigation,
    });

  it('sem ações, o residual é igual ao impacto e a economia é zero', () => {
    const result = withMitigation(undefined);

    expect(result.totals.residualAnnualImpact).toBeCloseTo(result.totals.grossAnnualImpact, 6);
    expect(result.totals.savings).toBe(0);
    expect(result.totals.residualPeopleToHire).toBe(result.totals.peopleToHire);
    expect(result.warnings).toEqual([]);
  });

  it('deve reduzir o déficit novo da função pelo efeito combinado das ações', () => {
    // Balconista (4 pessoas): déficit novo 13,92 h. Banco de horas 15% + escalas 15%: 13,92 × 0,85 × 0,85 = 10,0572 h → 1 pessoa.
    // Para ver a redução em horas usamos 4 ações que juntas passam de 50% do déficit.
    const result = withMitigation({
      s1: {
        actions: { 'banco-horas': 0.5, 'escalas-demanda': 0.5, multifuncionalidade: 0.5 },
      },
    });
    const clerkResult = result.stores[0]?.roles.find((role) => role.role === 'balconista');

    // 13,92 × 0,5 × 0,5 × 0,5 = 1,74 h → ainda precisa de 1 pessoa (arredonda para cima).
    expect(clerkResult?.residualNewDeficit).toBeCloseTo(1.74, 6);
    expect(clerkResult?.residualPeopleToHire).toBe(1);
  });

  it('deve eliminar a contratação quando o déficit residual chega a zero', () => {
    const result = withMitigation({ s1: { actions: { 'banco-horas': 1 } } });
    const clerkResult = result.stores[0]?.roles.find((role) => role.role === 'balconista');

    expect(clerkResult?.residualNewDeficit).toBe(0);
    expect(clerkResult?.residualPeopleToHire).toBe(0);
    expect(clerkResult?.residualAnnualCost).toBe(0);
  });

  it('não deve aplicar multifuncionalidade nem banco de horas ao farmacêutico', () => {
    const result = withMitigation({
      s1: { actions: { multifuncionalidade: 1, 'banco-horas': 1, automacao: 1 } },
    });
    const pharmacistResult = result.stores[0]?.roles.find((role) => role.role === 'farmaceutico');

    expect(pharmacistResult?.residualPeopleToHire).toBe(pharmacistResult?.peopleToHire);
    expect(pharmacistResult?.residualPeopleToHire).toBe(1);
  });

  it('deve permitir negociação coletiva para o farmacêutico', () => {
    const result = withMitigation({ s1: { actions: { 'negociacao-coletiva': 1 } } });
    const pharmacistResult = result.stores[0]?.roles.find((role) => role.role === 'farmaceutico');

    expect(pharmacistResult?.residualPeopleToHire).toBe(0);
  });

  it('deve aplicar o ajuste de horário antes dos percentuais (menos horas a cobrir)', () => {
    // Farmacêutico: 84 h de abertura. Fechar 14 h por semana → 70 h a cobrir.
    // 2 pessoas: a 44h = 76,56 h (sem déficit); a 40h = 69,6 h → déficit 0,4 h; novo = 0,4 h → 1 pessoa (arredonda).
    const result = withMitigation({ s1: { hoursReductionPerWeek: 14 } });
    const pharmacistResult = result.stores[0]?.roles.find((role) => role.role === 'farmaceutico');

    expect(pharmacistResult?.hoursToCover).toBeCloseTo(84, 6);
    expect(pharmacistResult?.residualNewDeficit).toBeCloseTo(0.4, 6);
    expect(pharmacistResult?.residualPeopleToHire).toBe(1);

    // Fechar 16 h por semana → 68 h: cabe nas 69,6 h de 2 pessoas a 40h.
    const more = withMitigation({ s1: { hoursReductionPerWeek: 16 } });
    expect(
      more.stores[0]?.roles.find((role) => role.role === 'farmaceutico')?.residualPeopleToHire,
    ).toBe(0);
  });

  it('não deve aceitar ajuste de horário maior que a abertura da loja', () => {
    const result = withMitigation({ s1: { hoursReductionPerWeek: 500 } });

    expect(result.totals.residualAnnualImpact).toBe(0);
  });

  it('deve calcular a economia como impacto menos residual e somar o grupo', () => {
    const result = withMitigation({
      s1: { actions: { 'banco-horas': 1, 'negociacao-coletiva': 1 } },
    });

    expect(result.totals.savings).toBeCloseTo(
      result.totals.grossAnnualImpact - result.totals.residualAnnualImpact,
      6,
    );
    expect(result.totals.residualAnnualImpact).toBe(0);
    expect(result.stores[0]?.savings).toBeCloseTo(result.totals.savings, 6);
  });

  it('deve avisar quando a redução combinada passa de 50%', () => {
    const above = withMitigation({
      s1: { actions: { 'banco-horas': 0.4, 'escalas-demanda': 0.4, automacao: 0.2 } },
    });
    const normal = withMitigation({
      s1: { actions: { 'banco-horas': 0.15, 'escalas-demanda': 0.15 } },
    });

    expect(above.warnings).toEqual(['MITIGATION_ABOVE_USUAL']);
    expect(above.stores[0]?.mitigationReduction).toBeGreaterThan(0.5);
    expect(normal.warnings).toEqual([]);
  });

  it('deve ignorar mitigação de lojas que não existem', () => {
    const result = withMitigation({ 'outra-loja': { actions: { 'banco-horas': 1 } } });

    expect(result.totals.savings).toBe(0);
  });
});
