import { describe, expect, it } from 'vitest';
import { testPremises } from './__fixtures__/premises';
import { describeQuickResult } from './describeQuickResult';
import { calculateQuickImpact, type QuickInput } from './quickImpact';

const input: QuickInput = {
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

const plain = (text: string) => text.replace(/\u00a0/g, ' ');

describe('describeQuickResult', () => {
  it('deve descrever o impacto bruto como faixa e os demais indicadores', () => {
    const view = describeQuickResult(calculateQuickImpact(input, testPremises));

    expect(plain(view.headline.value)).toBe('R$ 885,1 mil a R$ 1,4 mi');
    const byLabel = Object.fromEntries(view.metrics.map((m) => [m.label, plain(m.value)]));
    expect(byLabel['Impacto líquido após efeito fiscal']).toBe('R$ 584,2 mil a R$ 925 mil');
    expect(byLabel['Impacto sobre o faturamento anual']).toBe('0,74% a 1,17%');
    expect(byLabel['Impacto sobre o resultado operacional estimado']).toBe('14,8% a 23,4%');
    expect(byLabel['Pessoas equivalentes a contratar']).toBe('20 a 32');
    expect(byLabel['Impacto médio por loja']).toBe('R$ 44,3 mil a R$ 70,1 mil');
  });

  it('deve omitir o impacto por loja quando não há loja informada', () => {
    const view = describeQuickResult(
      calculateQuickImpact({ ...input, storeCount: 0 }, testPremises),
    );

    expect(view.metrics.some((metric) => metric.label === 'Impacto médio por loja')).toBe(false);
  });

  it('deve dizer n/d no resultado operacional quando a margem não é positiva', () => {
    const premises = structuredClone(testPremises);
    premises.quick.profiles.rua.operatingMargin = 0;

    const view = describeQuickResult(calculateQuickImpact(input, premises));

    const operating = view.metrics.find((metric) => metric.label.includes('resultado operacional'));
    expect(operating?.value).toBe('n/d');
  });
});
