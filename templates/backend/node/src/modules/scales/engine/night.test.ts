import { describe, expect, it } from 'vitest';
import { hourlyRate, nightAdditionMonthly, nightMinutes } from './night.js';

describe('night', () => {
  it('turno diurno não tem minutos noturnos', () => {
    expect(nightMinutes({ start: 7 * 60, end: 16 * 60 }, { start: 11 * 60, end: 12 * 60 })).toBe(0);
  });

  it('fechar às 23h dá 60 min noturnos; 22h às 7h dá 7 h', () => {
    expect(nightMinutes({ start: 14 * 60, end: 23 * 60 }, null)).toBe(60);
    expect(nightMinutes({ start: 22 * 60, end: 31 * 60 }, null)).toBe(7 * 60);
  });

  it('o almoço dentro da faixa noturna é descontado', () => {
    expect(nightMinutes({ start: 20 * 60, end: 29 * 60 }, { start: 23 * 60, end: 24 * 60 })).toBe(
      6 * 60,
    );
  });

  it('hora normal usa 220 h para 44 h semanais e 200 h para 40 h', () => {
    expect(hourlyRate(2200, 44)).toBe(10);
    expect(hourlyRate(2000, 40)).toBe(10);
  });

  it('adicional noturno cresce com os minutos e é zero sem trabalho noturno', () => {
    expect(nightAdditionMonthly(10, 0)).toBe(0);
    // 7 h noturnas por semana, hora a R$ 10: (1,2 × 8h + ... − 7h) × 4,34 × 10
    const v = nightAdditionMonthly(10, 7 * 60);
    expect(v).toBeCloseTo(10 * (1.2 * (420 / 52.5) - 7) * 4.34, 5);
    expect(v).toBeGreaterThan(0);
  });
});
