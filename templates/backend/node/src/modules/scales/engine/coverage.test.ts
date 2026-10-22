import { describe, expect, it } from 'vitest';
import {
  buildWeekHours,
  postsPerDay,
  shiftModelFor,
  shiftsPerPost,
  type CoverageRole,
} from './coverage.js';
import { SCENARIOS } from './rules.js';

const week = buildWeekHours({
  standard: { start: '07:00', end: '22:00', daysMask: 0b0111111 },
  overrides: { 6: { start: '08:00', end: '14:00' } },
});
const all: CoverageRole = { minInHall: 1, coverage: { mode: 'all' }, daysMask: 0b1111111 };
const shift42 = shiftModelFor(SCENARIOS['5x2_42'], all, 60);

describe('coverage', () => {
  it('janela de 15 h dá 3 turnos na 5x2 de 42 h', () => {
    expect(shiftsPerPost(15 * 60, shift42)).toBe(3);
  });

  it('janela de 10 h dá 2 turnos e janela de 6 h dá 1 (sem almoço)', () => {
    expect(shiftsPerPost(10 * 60, shift42)).toBe(2);
    expect(shiftsPerPost(6 * 60, shift42)).toBe(1);
    // 7 h pedem almoço: um turno só deixaria o salão descoberto.
    expect(shiftsPerPost(7 * 60, shift42)).toBe(2);
    expect(shiftsPerPost(0, shift42)).toBe(0);
  });

  it('domingo curto dá 1 posto e mínimo 2 duplica', () => {
    expect(postsPerDay(all, week, shift42)).toEqual([3, 3, 3, 3, 3, 3, 1]);
    expect(postsPerDay({ ...all, minInHall: 2 }, week, shift42)).toEqual([6, 6, 6, 6, 6, 6, 2]);
  });

  it('faixa da função recorta o horário da loja e respeita os dias', () => {
    const perfumista: CoverageRole = {
      minInHall: 1,
      coverage: { mode: 'band', start: '09:00', end: '19:00' },
      daysMask: 0b0111111,
    };
    expect(postsPerDay(perfumista, week, shift42)).toEqual([2, 2, 2, 2, 2, 2, 0]);
  });

  it('12x36 usa turnos de 12 h sem buraco de almoço', () => {
    const doze = shiftModelFor(SCENARIOS['5x2_42'], { scaleType: 'doze_x_trinta_e_seis' }, 60);
    expect(shiftsPerPost(15 * 60, doze)).toBe(2);
  });
});
