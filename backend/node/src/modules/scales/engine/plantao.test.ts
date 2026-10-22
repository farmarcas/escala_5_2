import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLANTAO,
  plantaoNights,
  plantaoNightsPerWeek,
  plantaoShiftTimes,
} from './plantao.js';

describe('plantao', () => {
  it('sem plantão não há noites', () => {
    expect(plantaoNights(DEFAULT_PLANTAO).some(Boolean)).toBe(false);
  });

  it('semanal: uma noite por semana, no dia escolhido', () => {
    const nights = plantaoNights({ ...DEFAULT_PLANTAO, type: 'weekly', weekday: 4 });
    expect(nights.filter(Boolean)).toHaveLength(4);
    expect([4, 11, 18, 25].every((i) => nights[i])).toBe(true);
    expect(plantaoNightsPerWeek({ ...DEFAULT_PLANTAO, type: 'weekly' })).toBe(1);
  });

  it('mensal: 7 noites seguidas na semana do ciclo', () => {
    const nights = plantaoNights({ ...DEFAULT_PLANTAO, type: 'monthly', cycleWeek: 2 });
    expect(nights.filter(Boolean)).toHaveLength(7);
    expect(nights.slice(7, 14).every(Boolean)).toBe(true);
    expect(plantaoNightsPerWeek({ ...DEFAULT_PLANTAO, type: 'monthly' })).toBe(1.75);
  });

  it('o turno passa da meia-noite e o intervalo só desconta se não for indenizado', () => {
    const paid = plantaoShiftTimes({ ...DEFAULT_PLANTAO, indemnifyBreak: true });
    expect(paid).toMatchObject({
      start: 22 * 60,
      end: 31 * 60,
      lengthMinutes: 9 * 60,
      workMinutes: 9 * 60,
    });
    expect(plantaoShiftTimes({ ...DEFAULT_PLANTAO, indemnifyBreak: false }).workMinutes).toBe(
      8 * 60,
    );
  });
});
