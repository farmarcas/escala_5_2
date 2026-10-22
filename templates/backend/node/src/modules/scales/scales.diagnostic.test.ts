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
    expect(balconista.need['5x2_42']).toBe(8);
    expect(balconista.hire['5x2_42']).toBe(3);
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

  it('intervalo indenizado só existe para função em 12x36 e com a regra ligada', () => {
    const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
    const twelve = {
      ...base,
      roles: base.roles.map((r) =>
        r.role === 'caixa' ? { ...r, scaleType: 'doze_x_trinta_e_seis' as const } : r,
      ),
    };
    expect(diagnose(base).payroll.scenarios['5x2_42'].components.indemnifiedBreak).toBe(0);
    expect(
      diagnose(twelve).payroll.scenarios['5x2_42'].components.indemnifiedBreak,
    ).toBeGreaterThan(0);
    const off = { ...twelve, rules: { ...twelve.rules, indemnifyBreak: false } };
    expect(diagnose(off).payroll.scenarios['5x2_42'].components.indemnifiedBreak).toBe(0);
  });

  it('o custo por colaborador soma as partes', () => {
    for (const row of result.payroll.scenarios['5x2_42'].perPerson) {
      expect(row.salary + row.additions + row.provisions + row.charges + row.benefits).toBeCloseTo(
        row.total,
        4,
      );
    }
  });
});
