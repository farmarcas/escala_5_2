import { describe, expect, it } from 'vitest';
import { DEFAULT_HOLIDAYS, NATIONAL_HOLIDAYS, holidaysByDay } from './holidays.js';

describe('holidays', () => {
  it('tem 10 feriados nacionais por ano, ordenados, de 2026 a 2028', () => {
    expect(NATIONAL_HOLIDAYS).toHaveLength(30);
    const dates = NATIONAL_HOLIDAYS.map((h) => h.date);
    expect([...dates].sort()).toEqual(dates);
    expect(dates).toContain('2026-04-03');
  });

  it('caso de conferência: Natal e Confraternização caem nas 4 semanas de 14/12/2026', () => {
    const days = holidaysByDay('2026-12-14', 28, DEFAULT_HOLIDAYS);
    expect(days.map((h, i) => (h ? i : -1)).filter((i) => i >= 0)).toEqual([11, 18]);
    expect(days[11]!.name).toBe('Natal');
  });

  it('feriados nacionais desligados e feriado da cidade cadastrado', () => {
    const days = holidaysByDay('2026-12-14', 28, {
      ...DEFAULT_HOLIDAYS,
      national: false,
      extra: [{ date: '2026-12-16', name: 'Aniversário da cidade' }],
    });
    expect(days.filter(Boolean)).toHaveLength(1);
    expect(days[2]!.scope).toBe('estadual_municipal');
  });
});
