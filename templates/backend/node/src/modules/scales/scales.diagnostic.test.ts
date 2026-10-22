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
});
