import { describe, expect, it } from 'vitest';
import type { DetailedResult } from '@/features/simulations/types';
import { buildStoresCsv, csvCell } from './storesCsv';

const role = {
  role: 'balconista' as const,
  hoursToCover: 168,
  hoursAvailableAt40: 174,
  baselineDeficit: 0,
  newDeficit: 13.92,
  peopleToHire: 1,
  annualCost: 43389.15,
  mandatoryPresence: false,
  residualNewDeficit: 0,
  residualPeopleToHire: 0,
  residualAnnualCost: 0,
};

const result = (name: string): DetailedResult => ({
  totals: {
    grossAnnualImpact: 0,
    netAnnualImpact: 0,
    peopleToHire: 0,
    storesWithImpact: 0,
    residualAnnualImpact: 0,
    residualPeopleToHire: 0,
    savings: 0,
  },
  stores: [
    {
      storeId: 'a',
      name,
      weeklyOpenHours: 84,
      grossAnnualImpact: 0,
      peopleToHire: 0,
      hasImpact: false,
      residualGrossAnnualImpact: 0,
      residualPeopleToHire: 0,
      savings: 0,
      mitigationReduction: 0,
      roles: [role],
    },
  ],
  ranking: [],
  warnings: [],
});

describe('csvCell', () => {
  it('deve proteger separador, aspas e quebras de linha', () => {
    expect(csvCell('Rede; Saúde')).toBe('"Rede; Saúde"');
    expect(csvCell('a "b"')).toBe('"a ""b"""');
  });

  it('deve neutralizar fórmulas de planilha', () => {
    expect(csvCell('=SOMA(A1)')).toBe("'=SOMA(A1)");
    expect(csvCell('@x')).toBe("'@x");
  });
});

describe('buildStoresCsv', () => {
  it('deve começar com BOM, usar ; e vírgula decimal', () => {
    const csv = buildStoresCsv(result('Centro'));

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [header, line] = csv.slice(1).split('\r\n');
    expect(header?.split(';')).toHaveLength(9);
    expect(line).toBe('Centro;Balconista;168,00;174,00;13,92;1;43389,15;0;0,00');
  });

  it('deve neutralizar nome de loja que parece fórmula', () => {
    const csv = buildStoresCsv(result('=1+1'));

    expect(csv).toContain("\r\n'=1+1;Balconista");
  });

  it('deve gerar só o cabeçalho sem lojas', () => {
    const empty = { ...result('x'), stores: [] };

    expect(buildStoresCsv(empty).slice(1).split('\r\n').filter(Boolean)).toHaveLength(1);
  });
});
