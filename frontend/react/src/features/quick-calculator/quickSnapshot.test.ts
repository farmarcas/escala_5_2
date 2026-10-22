import { describe, expect, it } from 'vitest';
import { testPremises } from '@/lib/__fixtures__/premises';
import { calculateQuickImpact, type QuickInput } from '@/lib/quickImpact';
import { buildQuickSnapshot } from './quickSnapshot';

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
  markedActions: 1,
};

describe('buildQuickSnapshot', () => {
  it('deve levar o perfil informado e os números principais do resultado', () => {
    const result = calculateQuickImpact(input, testPremises);

    const snapshot = buildQuickSnapshot(input, result);

    expect(snapshot.mode).toBe('rapido');
    expect(snapshot.profile).toMatchObject({
      storeCount: 20,
      employees: 400,
      pctSixByOne: 0.85,
      regime: 'real',
      markedActions: 1,
    });
    expect(snapshot.result).toMatchObject({
      grossMin: result.grossMin,
      grossMax: result.grossMax,
      netMin: result.netMin,
      peopleMax: 32,
      savings: result.savings,
    });
  });
});
