import { describe, expect, it } from 'vitest';
import { testPremises } from './__fixtures__/premises';
import { calculateQuickImpact, mitigationFraction, type QuickInput } from './quickImpact';

const baseInput: QuickInput = {
  storeCount: 20,
  employees: 400,
  pctSixByOne: 0.85,
  averageSalary: 2100,
  annualRevenue: 120_000_000,
  profile: 'rua',
  operatingDays: '7',
  regime: 'real',
  maturity: 'nao_comecamos',
  markedActions: 0,
};

describe('calculateQuickImpact', () => {
  it('deve bater com o caso conferido à mão (400 pessoas, 85%, R$ 2.100, Lucro Real)', () => {
    const result = calculateQuickImpact(baseInput, testPremises);

    expect(result.affected).toBe(340);
    expect(result.peopleToReplace).toBeCloseTo(34, 6);
    expect(result.costPerPerson).toBeCloseTo(43389.15, 2);
    expect(result.grossMin).toBeCloseTo(885138.66, 1);
    expect(result.grossMax).toBeCloseTo(1401469.545, 1);
    expect(result.netMin).toBeCloseTo(885138.66 * 0.66, 1);
    expect(result.netMax).toBeCloseTo(1401469.545 * 0.66, 1);
    expect(result.pctRevenueMin).toBeCloseTo(885138.66 / 120_000_000, 8);
    expect(result.operatingResult).toBeCloseTo(6_000_000, 2);
    expect(result.pctOperatingMin).toBeCloseTo(885138.66 / 6_000_000, 8);
    expect(result.peopleMin).toBe(20);
    expect(result.peopleMax).toBe(32);
    expect(result.avgPerStoreMin).toBeCloseTo(885138.66 / 20, 1);
    expect(result.taxBenefitApplies).toBe(true);
    expect(result.hasImpact).toBe(true);
  });

  it('deve reduzir a cobertura quando a loja funciona 6 ou 5 dias', () => {
    const six = calculateQuickImpact({ ...baseInput, operatingDays: '6' }, testPremises);
    const five = calculateQuickImpact({ ...baseInput, operatingDays: '5' }, testPremises);

    expect(six.coverageMin).toBeCloseTo(0.54, 6);
    expect(six.coverageMax).toBeCloseTo(0.874, 6);
    expect(five.coverageMin).toBeCloseTo(0.42, 6);
    expect(five.coverageMax).toBeCloseTo(0.741, 6);
  });

  it('deve limitar a cobertura a 100% na loja 24 horas', () => {
    const result = calculateQuickImpact({ ...baseInput, profile: '24h' }, testPremises);

    expect(result.coverageMin).toBeCloseTo(0.75, 6);
    expect(result.coverageMax).toBe(1);
  });

  it('deve usar encargos menores no Simples Nacional e não abater imposto', () => {
    const result = calculateQuickImpact({ ...baseInput, regime: 'simples' }, testPremises);

    expect(result.costPerPerson).toBeCloseTo(2100 * 13.33 * 1.25, 2);
    expect(result.netMin).toBe(result.grossMin);
    expect(result.taxBenefitApplies).toBe(false);
  });

  it('deve tratar Lucro Presumido com encargos cheios e sem abater imposto', () => {
    const result = calculateQuickImpact({ ...baseInput, regime: 'presumido' }, testPremises);

    expect(result.costPerPerson).toBeCloseTo(2100 * 13.33 * 1.55, 2);
    expect(result.netMax).toBe(result.grossMax);
    expect(result.taxBenefitApplies).toBe(false);
  });

  it('deve zerar o impacto quando ninguém está em 6x1', () => {
    const result = calculateQuickImpact({ ...baseInput, pctSixByOne: 0 }, testPremises);

    expect(result.affected).toBe(0);
    expect(result.grossMax).toBe(0);
    expect(result.hasImpact).toBe(false);
  });

  it('deve devolver nulo no percentual do resultado operacional quando a margem não é positiva', () => {
    const premises = structuredClone(testPremises);
    premises.quick.profiles.rua.operatingMargin = 0;

    const result = calculateQuickImpact(baseInput, premises);

    expect(result.pctOperatingMin).toBeNull();
    expect(result.pctOperatingMax).toBeNull();
  });

  it('deve avisar quando Lucro Presumido passa do limite de faturamento', () => {
    const over = calculateQuickImpact(
      { ...baseInput, regime: 'presumido', annualRevenue: 120_000_000 },
      testPremises,
    );
    const under = calculateQuickImpact(
      { ...baseInput, regime: 'presumido', annualRevenue: 50_000_000 },
      testPremises,
    );
    const real = calculateQuickImpact(baseInput, testPremises);

    expect(over.presumidoOverLimit).toBe(true);
    expect(under.presumidoOverLimit).toBe(false);
    expect(real.presumidoOverLimit).toBe(false);
  });

  it('não deve reduzir nada quando nenhuma ação está marcada', () => {
    const result = calculateQuickImpact(baseInput, testPremises);

    expect(result.mitigation.current).toBe(0);
    expect(result.residualMin).toBeCloseTo(result.grossMin, 6);
    expect(result.savings).toBeCloseTo(0, 6);
  });

  it('deve calcular o residual e a economia com ações marcadas', () => {
    const result = calculateQuickImpact({ ...baseInput, markedActions: 1 }, testPremises);

    expect(result.mitigation.current).toBeCloseTo(0.3, 6);
    expect(result.residualMin).toBeCloseTo(885138.66 * 0.7, 1);
    expect(result.residualMax).toBeCloseTo(1401469.545 * 0.7, 1);
    expect(result.savings).toBeCloseTo(((885138.66 + 1401469.545) / 2) * 0.3, 1);
  });

  it('deve devolver custo por loja nulo quando não há loja informada', () => {
    const result = calculateQuickImpact({ ...baseInput, storeCount: 0 }, testPremises);

    expect(result.avgPerStoreMin).toBeNull();
  });
});

describe('mitigationFraction', () => {
  it('deve ser 0 sem ação, piso com 1 ação e teto com todas', () => {
    expect(mitigationFraction(0, 6, 0.3, 0.4)).toBe(0);
    expect(mitigationFraction(1, 6, 0.3, 0.4)).toBeCloseTo(0.3, 6);
    expect(mitigationFraction(6, 6, 0.3, 0.4)).toBeCloseTo(0.4, 6);
    expect(mitigationFraction(3, 6, 0.3, 0.4)).toBeCloseTo(0.34, 6);
  });

  it('deve manter a redução entre 30% e 50% quando há ação marcada', () => {
    for (let marked = 1; marked <= 6; marked++) {
      const value = mitigationFraction(marked, 6, 0.3, 0.5);
      expect(value).toBeGreaterThanOrEqual(0.3);
      expect(value).toBeLessThanOrEqual(0.5);
    }
  });

  it('não deve deixar o teto abaixo do piso se a pessoa editar os valores', () => {
    expect(mitigationFraction(6, 6, 0.3, 0.2)).toBeCloseTo(0.3, 6);
  });
});
