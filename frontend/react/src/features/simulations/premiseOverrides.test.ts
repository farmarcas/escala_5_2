import { describe, expect, it } from 'vitest';
import { testPremises } from '@/lib/__fixtures__/premises';
import {
  buildPremiseOverrides,
  settingsFromDefaults,
  settingsFromSnapshot,
  type SimulationSettings,
} from './premiseOverrides';

describe('premiseOverrides', () => {
  it('deve começar com os valores padrão e a ausência em %', () => {
    expect(settingsFromDefaults(testPremises)).toEqual({
      chargesRealPresumido: 1.55,
      chargesSimples: 1.25,
      monthsPerYear: 13.33,
      irpjCsllRatePct: 34,
      absenceRatePct: 13,
    });
  });

  it('não deve mandar nada quando nada mudou', () => {
    expect(buildPremiseOverrides(settingsFromDefaults(testPremises), testPremises)).toBeUndefined();
  });

  it('deve mandar só o que mudou, convertendo percentuais para fração', () => {
    const settings: SimulationSettings = {
      ...settingsFromDefaults(testPremises),
      chargesRealPresumido: 1.7,
      absenceRatePct: 8,
      irpjCsllRatePct: 25,
    };

    expect(buildPremiseOverrides(settings, testPremises)).toEqual({
      taxation: { chargesRealPresumido: 1.7, irpjCsllRate: 0.25 },
      detailed: { absenceRate: 0.08 },
    });
  });

  it('deve ignorar campos vazios (usa o padrão)', () => {
    const settings: SimulationSettings = {
      ...settingsFromDefaults(testPremises),
      chargesSimples: null,
      absenceRatePct: null,
    };

    expect(buildPremiseOverrides(settings, testPremises)).toBeUndefined();
  });

  it('deve ignorar valores fora do limite aceito pela API', () => {
    const settings: SimulationSettings = {
      ...settingsFromDefaults(testPremises),
      absenceRatePct: 80,
      chargesRealPresumido: 9,
    };

    expect(buildPremiseOverrides(settings, testPremises)).toBeUndefined();
  });

  it('deve reconstruir os campos a partir das premissas de uma simulação salva', () => {
    expect(
      settingsFromSnapshot({
        taxation: {
          monthsPerYear: 13,
          chargesRealPresumido: 1.7,
          chargesSimples: 1.25,
          irpjCsllRate: 0.34,
        },
        detailed: { targetWeeklyHours: 40, absenceRate: 0.1 },
      }),
    ).toEqual({
      chargesRealPresumido: 1.7,
      chargesSimples: 1.25,
      monthsPerYear: 13,
      irpjCsllRatePct: 34,
      absenceRatePct: 10,
    });
  });
});
