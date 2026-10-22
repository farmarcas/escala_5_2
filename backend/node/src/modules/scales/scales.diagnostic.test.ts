import { describe, expect, it } from 'vitest';
import { diagnose } from './scales.diagnostic.js';
import { defaultStore } from './scales.defaults.js';

describe('diagnose', () => {
  const result = diagnose({
    ...defaultStore('2026-12-14'),
    name: 'Centro',
    city: 'Varginha',
    state: 'MG',
  });

  it('mostra o quadro por função com hoje, necessário e contratar', () => {
    const balconista = result.rows.find((r) => r.key === 'balconista')!;
    expect(balconista.today).toBe(5);
    // Com feriados e compensações ligados a equipe necessária passa da conta simples de postos (8).
    expect(balconista.need['5x2_42']).toBeGreaterThanOrEqual(7);
    expect(balconista.hire['5x2_42']).toBe(balconista.need['5x2_42'] - 5);
    expect(result.rows.map((r) => r.key)).not.toContain('comprador');
  });

  it('gerente e subgerente aparecem juntos', () => {
    const g = result.rows.find((r) => r.key === 'gerencia')!;
    expect(g.today).toBe(2);
  });

  it('a folha nova é maior que a de hoje e a diferença anual é 12 meses', () => {
    const s = result.payroll.scenarios['5x2_42'];
    expect(s.total).toBeGreaterThan(result.payroll.today.total);
    expect(s.yearlyDifference).toBeCloseTo(s.monthlyDifference * 12, 4);
    expect(result.totals.hire['5x2_42']).toBeGreaterThan(0);
  });

  it('excedente vira reforço e não contratação', () => {
    const store = defaultStore('2026-12-14');
    const big = {
      ...store,
      roles: store.roles.map((r) => (r.role === 'caixa' ? { ...r, headcount: 9 } : r)),
    };
    const caixa = diagnose(big).rows.find((r) => r.key === 'caixa')!;
    expect(caixa.hire['5x2_42']).toBe(0);
    expect(caixa.reinforcement['5x2_42']).toBe(9 - caixa.need['5x2_42']);
  });

  it('os componentes somam o custo direto e o indireto', () => {
    const c = result.payroll.scenarios['5x2_42'];
    const k = c.components;
    expect(
      k.salary + k.hazard + k.night + k.overtime + k.dsr + k.holidayDouble + k.indemnifiedBreak,
    ).toBeCloseTo(c.direct, 4);
    expect(
      k.thirteenth + k.vacation + k.fgts + k.fgtsFine + k.inss + k.transport + k.otherBenefits,
    ).toBeCloseTo(c.indirect, 4);
    expect(k.hazard).toBeGreaterThan(0);
  });

  it('trocar o regime para Presumido/Real cria INSS patronal; sem provisões some 13º e férias', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    const simples = diagnose(base).payroll.scenarios['5x2_42'].components;
    const presumido = diagnose(base, { taxRegime: 'lucro_presumido_real' }).payroll.scenarios[
      '5x2_42'
    ].components;
    const semProvisoes = diagnose(base, { provisions: false }).payroll.scenarios['5x2_42']
      .components;
    expect(simples.inss).toBe(0);
    expect(presumido.inss).toBeGreaterThan(0);
    expect(semProvisoes.thirteenth + semProvisoes.vacation + semProvisoes.fgtsFine).toBe(0);
  });

  it('loja 24 horas gera adicional noturno; loja diurna não', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    const day = diagnose(base).payroll.scenarios['5x2_42'].components.night;
    const night = diagnose({ ...base, hours: { ...base.hours, always24h: true } }).payroll
      .scenarios['5x2_42'].components.night;
    expect(day).toBe(0);
    expect(night).toBeGreaterThan(0);
  });

  it('a hora de intervalo da 12x36 vira hora extra (150%), só com a regra ligada', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    const twelve = {
      ...base,
      roles: base.roles.map((r) =>
        r.role === 'caixa' ? { ...r, scaleType: 'doze_x_trinta_e_seis' as const } : r,
      ),
    };
    expect(diagnose(base).payroll.scenarios['5x2_42'].components.overtime).toBe(0);
    expect(diagnose(twelve).payroll.scenarios['5x2_42'].components.overtime).toBeGreaterThan(0);
    const off = { ...twelve, rules: { ...twelve.rules, indemnifyBreak: false } };
    expect(diagnose(off).payroll.scenarios['5x2_42'].components.overtime).toBe(0);
  });

  it('o custo por colaborador soma as partes', () => {
    for (const row of result.payroll.scenarios['5x2_42'].perPerson) {
      expect(row.salary + row.additions + row.provisions + row.charges + row.benefits).toBeCloseTo(
        row.total,
        4,
      );
    }
  });

  const withPlantao = (type: 'weekly' | 'monthly', cover: 'team' | 'intermittent' = 'team') => ({
    ...defaultStore('2026-12-14'),
    name: 'Centro',
    city: 'Varginha',
    state: 'MG',
    plantao: { ...defaultStore('2026-12-14').plantao, type, cover },
  });

  it('plantão coberto pela equipe gera adicional noturno, horas extras e intervalo indenizado e pede mais gente', () => {
    const none = diagnose(defaultStore('2026-12-14'));
    const d = diagnose(withPlantao('monthly'));
    const c = d.payroll.scenarios['5x2_42'].components;
    expect(c.night).toBeGreaterThan(0);
    expect(c.overtime).toBeGreaterThan(0);
    expect(c.dsr).toBeGreaterThan(0);
    expect(c.indemnifiedBreak).toBeGreaterThan(0);
    expect(d.totals.need['5x2_42']).toBeGreaterThanOrEqual(none.totals.need['5x2_42']);
  });

  it('plantonista intermitente: não pesa na equipe e paga só as horas convocadas', () => {
    const none = diagnose(defaultStore('2026-12-14'));
    const d = diagnose(withPlantao('weekly', 'intermittent'));
    expect(d.totals.need['5x2_42']).toBe(none.totals.need['5x2_42']);
    expect(d.payroll.scenarios['5x2_42'].total).toBeGreaterThan(
      none.payroll.scenarios['5x2_42'].total,
    );
    expect(d.payroll.scenarios['5x2_42'].components.overtime).toBe(0);
  });

  it('resumo dos feriados: Natal e Confraternização entram nas 4 semanas e a soma fecha com a equipe', () => {
    const d = diagnose({
      ...defaultStore('2026-12-14'),
      name: 'Centro',
      city: 'Varginha',
      state: 'MG',
    });
    const h = d.holidays['5x2_42'];
    expect(h.rows.map((r) => r.date)).toEqual(['2026-12-25', '2027-01-01']);
    for (const row of h.rows) expect(row.working + row.off).toBe(d.totals.need['5x2_42']);
    expect(h.compensatoryDays).toBe(h.rows.reduce((n, r) => n + r.working, 0));
  });

  it('feriado em dobro cria custo de feriado e nenhuma folga compensatória', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    const d = diagnose({ ...base, holidays: { ...base.holidays, compensation: 'dobro' } });
    expect(d.payroll.scenarios['5x2_42'].components.holidayDouble).toBeGreaterThan(0);
    expect(d.holidays['5x2_42'].compensatoryDays).toBe(0);
  });

  it('com feriados desligados não há resumo nem custo de feriado', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    const d = diagnose({
      ...base,
      holidays: { ...base.holidays, national: false, compensation: 'dobro' },
    });
    expect(d.holidays['5x2_42'].rows).toEqual([]);
    expect(d.payroll.scenarios['5x2_42'].components.holidayDouble).toBe(0);
  });

  it('vendas e CMV: desligado não gera análise; ligado compara hoje e nova folha', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    expect(diagnose(base).sales).toBeNull();
    const d = diagnose({
      ...base,
      sales: { enabled: true, monthlySales: 1_000_000, cmvRate: 0.7, payrollTargetRate: 0.12 },
    });
    const s = d.sales!;
    expect(s.today.payroll).toBeCloseTo(d.payroll.today.total, 4);
    expect(s.scenarios['5x2_42'].payroll).toBeCloseTo(d.payroll.scenarios['5x2_42'].total, 4);
    expect(s.scenarios['5x2_42'].payrollShare).toBeGreaterThan(s.today.payrollShare);
    expect(s.scenarios['5x2_42'].breakEvenSales).toBeCloseTo(
      d.payroll.scenarios['5x2_42'].total / 0.3,
      4,
    );
  });
});
