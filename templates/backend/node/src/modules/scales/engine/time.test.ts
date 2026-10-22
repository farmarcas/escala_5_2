import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysFromMask,
  formatHM,
  intersect,
  maskFromDays,
  mondayOf,
  parseHM,
  weekdayOf,
  windowFromHM,
  windowLength,
} from './time.js';

describe('time', () => {
  it('converte horário em minutos e volta', () => {
    expect(parseHM('07:30')).toBe(450);
    expect(formatHM(450)).toBe('07:30');
    expect(formatHM(1500)).toBe('01:00');
    expect(() => parseHM('24:00')).toThrow();
    expect(() => parseHM('7:3')).toThrow();
  });

  it('janela que passa da meia-noite', () => {
    expect(windowLength(windowFromHM('22:00', '07:00'))).toBe(9 * 60);
    expect(windowLength(windowFromHM('07:00', '22:00'))).toBe(15 * 60);
  });

  it('interseção de janelas', () => {
    const loja = windowFromHM('07:00', '22:00');
    const faixa = windowFromHM('09:00', '19:00');
    expect(windowLength(intersect(loja, faixa))).toBe(10 * 60);
    expect(intersect(windowFromHM('08:00', '10:00'), windowFromHM('12:00', '14:00'))).toBeNull();
    expect(intersect(null, faixa)).toBeNull();
  });

  it('máscara de dias', () => {
    expect(daysFromMask(0b1000001)).toEqual([0, 6]);
    expect(maskFromDays([0, 1, 2, 3, 4, 5])).toBe(0b0111111);
  });

  it('dia da semana e segunda-feira da semana', () => {
    expect(weekdayOf('2026-12-14')).toBe(0); // segunda
    expect(weekdayOf('2026-12-20')).toBe(6); // domingo
    expect(mondayOf('2026-12-17')).toBe('2026-12-14');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
  });
});
