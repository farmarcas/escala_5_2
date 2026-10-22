import { describe, expect, it } from 'vitest';
import {
  comparePayroll,
  DEFAULT_COST_SETTINGS,
  payroll,
  personCost,
  type CostSettings,
} from './costs.js';

const presumido: CostSettings = {
  ...DEFAULT_COST_SETTINGS,
  taxRegime: 'lucro_presumido_real',
  benefits: 350,
};

describe('costs', () => {
  it('balconista de R$ 1.950 no Lucro Presumido bate com a referência', () => {
    const c = personCost({ salary: 1950, daysPerWeek: 5 }, presumido);
    expect(c.provisionsAmount).toBeCloseTo(379.17, 2);
    expect(c.fgts).toBeCloseTo(186.33, 2);
    expect(c.fgtsFine).toBeCloseTo(74.53, 2);
    expect(c.inss).toBeCloseTo(647.51, 2);
    expect(c.fgts + c.fgtsFine + c.inss).toBeCloseTo(908.38, 2);
    expect(c.transportEmployer).toBeCloseTo(78.3, 2);
    expect(c.benefits).toBeCloseTo(428.3, 2);
    expect(c.total).toBeCloseTo(3665.84, 2);
  });

  it('Simples não tem INSS patronal, mas mantém FGTS e multa', () => {
    const c = personCost({ salary: 1950, daysPerWeek: 5 }, { ...presumido, taxRegime: 'simples' });
    expect(c.inss).toBe(0);
    expect(c.fgts).toBeCloseTo(186.33, 2);
  });

  it('sem provisões: encargos só sobre o salário e sem multa', () => {
    const c = personCost({ salary: 1950, daysPerWeek: 5 }, { ...presumido, provisions: false });
    expect(c.fgts).toBeCloseTo(156, 2);
    expect(c.inss).toBeCloseTo(542.1, 2);
    expect(c.fgtsFine).toBe(0);
    expect(c.provisionsAmount).toBe(0);
  });

  it('entregador de moto: periculosidade de 30% e vale-transporte nunca negativo', () => {
    const c = personCost({ salary: 1800, motorcycle: true, daysPerWeek: 5 }, presumido);
    expect(c.hazard).toBe(540);
    expect(c.provisionsAmount).toBeCloseTo((1800 + 540) * (1 / 12 + 1 / 9), 2);
    const rich = personCost({ salary: 10000, daysPerWeek: 5 }, presumido);
    expect(rich.transportEmployer).toBe(0);
  });

  it('o vale-transporte do 6x1 usa 6 dias por semana', () => {
    const six = personCost({ salary: 1950, daysPerWeek: 6 }, presumido);
    expect(six.transportEmployer).toBeCloseTo(26.04 * 9 - 117, 2);
  });

  it('folha e diferença hoje x nova', () => {
    const today = payroll([{ salary: 2000, people: 2, daysPerWeek: 6 }], presumido);
    const next = payroll([{ salary: 2000, people: 3, daysPerWeek: 5 }], presumido);
    const cmp = comparePayroll(today, next);
    expect(cmp.next.people).toBe(3);
    expect(cmp.monthlyDifference).toBeGreaterThan(0);
    expect(cmp.yearlyDifference).toBeCloseTo(cmp.monthlyDifference * 12, 5);
    expect(comparePayroll(payroll([], presumido), next).percent).toBe(0);
  });
});
