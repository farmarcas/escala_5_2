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

describe('costs: adicionais', () => {
  it('reflexo no DSR é 1/6 de noturno e horas extras (conferido com a referência: 844 → 141)', () => {
    const c = personCost(
      { salary: 2000, daysPerWeek: 5, additions: { night: 241, overtime: 603 } },
      presumido,
    );
    expect(c.dsr).toBeCloseTo((241 + 603) / 6, 5);
    expect(c.dsr).toBeCloseTo(140.67, 2);
  });

  it('adicionais entram na base de 13º, férias, FGTS e INSS e no custo direto', () => {
    const plain = personCost({ salary: 2000, daysPerWeek: 5 }, presumido);
    const withExtras = personCost(
      { salary: 2000, daysPerWeek: 5, additions: { holidayDouble: 100, indemnifiedBreak: 50 } },
      presumido,
    );
    expect(withExtras.direct - plain.direct).toBeCloseTo(150, 5);
    expect(withExtras.fgts).toBeGreaterThan(plain.fgts);
    expect(withExtras.thirteenth).toBeCloseTo((2000 + 150) / 12, 5);
  });

  it('13º e férias são separados e somam a provisão', () => {
    const c = personCost({ salary: 1950, daysPerWeek: 5 }, presumido);
    expect(c.thirteenth).toBeCloseTo(162.5, 2);
    expect(c.vacation).toBeCloseTo(216.67, 2);
    expect(c.thirteenth + c.vacation).toBeCloseTo(c.provisionsAmount, 8);
  });

  it('a folha soma os componentes de todas as pessoas', () => {
    const p = payroll(
      [
        { salary: 1000, people: 2, daysPerWeek: 5 },
        { salary: 1800, people: 1, daysPerWeek: 5, motorcycle: true },
      ],
      presumido,
    );
    expect(p.components.salary).toBe(3800);
    expect(p.components.hazard).toBe(540);
    expect(
      p.components.fgts +
        p.components.fgtsFine +
        p.components.inss +
        p.components.thirteenth +
        p.components.vacation +
        p.components.transport +
        p.components.otherBenefits,
    ).toBeCloseTo(p.indirect, 6);
    expect(p.components.salary + p.components.hazard).toBeCloseTo(p.direct, 6);
  });
});
