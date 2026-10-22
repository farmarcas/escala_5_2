import { describe, expect, it } from 'vitest';
import { testPremises } from './__fixtures__/premises';
import { buildSummaryText } from './buildSummaryText';
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

describe('buildSummaryText', () => {
  it('deve resumir impacto bruto, percentual e pessoas', () => {
    const text = plain(buildSummaryText(calculateQuickImpact(input, testPremises)));

    expect(text).toContain('R$ 885.139 a R$ 1.401.470');
    expect(text).toContain('0,74% a 1,17% do faturamento');
    expect(text).toContain('de 20 a 32 pessoas');
  });

  it('deve mencionar o efeito fiscal só no Lucro Real', () => {
    const real = plain(buildSummaryText(calculateQuickImpact(input, testPremises)));
    const simples = plain(
      buildSummaryText(calculateQuickImpact({ ...input, regime: 'simples' }, testPremises)),
    );

    expect(real).toContain('IRPJ/CSLL');
    expect(simples).not.toContain('IRPJ/CSLL');
  });

  it('deve mencionar as ações só quando há ação marcada', () => {
    const semAcao = plain(buildSummaryText(calculateQuickImpact(input, testPremises)));
    const comAcao = plain(
      buildSummaryText(calculateQuickImpact({ ...input, markedActions: 2 }, testPremises)),
    );

    expect(semAcao).not.toContain('ações marcadas');
    expect(comAcao).toContain('ações marcadas');
  });

  it('deve dizer que não há impacto quando ninguém está em 6x1', () => {
    const text = buildSummaryText(calculateQuickImpact({ ...input, pctSixByOne: 0 }, testPremises));

    expect(text).toContain('não há impacto');
  });
});
