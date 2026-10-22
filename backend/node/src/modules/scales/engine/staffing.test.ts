import { describe, expect, it } from 'vitest';
import { buildWeekHours, type CoverageRole } from './coverage.js';
import { SCENARIOS } from './rules.js';
import { requiredPeople, type StaffingOptions } from './staffing.js';

const base = buildWeekHours({
  standard: { start: '07:00', end: '22:00', daysMask: 0b0111111 },
  overrides: { 6: { start: '08:00', end: '14:00' } },
});
const all: CoverageRole = { minInHall: 1, coverage: { mode: 'all' }, daysMask: 0b1111111 };
const opts: StaffingOptions = { lunchMinutes: 60, sundayRule: 'um_em_tres' };
const people = (
  role: Parameters<typeof requiredPeople>[0],
  scenario: keyof typeof SCENARIOS,
  week = base,
  o = opts,
) => {
  const r = requiredPeople(role, week, SCENARIOS[scenario], o);
  if (!r.ok) throw new Error(r.reason);
  return r.people;
};

describe('staffing', () => {
  it('caixa de segunda a sábado 07–22 + domingo curto: 4 pessoas nos dois regimes', () => {
    expect(people(all, '6x1_44')).toBe(4);
    expect(people(all, '5x2_42')).toBe(4);
  });

  it('a 5x2 de 40 h nunca precisa de menos pessoas que a de 42 h na mesma loja', () => {
    expect(people(all, '5x2_40')).toBeGreaterThanOrEqual(people(all, '5x2_42'));
  });

  it('mínimo 2 no salão pede mais gente', () => {
    expect(people({ ...all, minInHall: 2 }, '5x2_42')).toBeGreaterThan(people(all, '5x2_42'));
  });

  it('faixa curta usa menos pessoas', () => {
    const faixa: CoverageRole = {
      ...all,
      coverage: { mode: 'band', start: '10:00', end: '14:00' },
    };
    expect(people(faixa, '5x2_42')).toBeLessThan(people(all, '5x2_42'));
  });

  it('dono farmacêutico atuando tira uma pessoa, mas nunca zera', () => {
    expect(people({ ...all, ownerIsPharmacist: true }, '5x2_42')).toBe(people(all, '5x2_42') - 1);
    const closed = buildWeekHours({
      standard: { start: '08:00', end: '12:00', daysMask: 0b0000001 },
    });
    expect(people({ ...all, ownerIsPharmacist: true }, '5x2_42', closed)).toBe(1);
  });

  it('todo domingo de folga com loja aberta no domingo é recusado', () => {
    const r = requiredPeople(all, base, SCENARIOS['5x2_42'], {
      ...opts,
      sundayRule: 'todo_domingo',
    });
    expect(r).toEqual({ ok: false, reason: 'todo_domingo_com_loja_aberta' });
  });

  it('folga 1 em 2 domingos exige pelo menos o dobro dos postos de domingo', () => {
    const sunBig = { ...all, minInHall: 3 };
    expect(
      people(sunBig, '5x2_42', base, { ...opts, sundayRule: 'um_em_dois' }),
    ).toBeGreaterThanOrEqual(6);
  });

  it('loja fechada não precisa de ninguém', () => {
    const closed = buildWeekHours({ standard: { start: '08:00', end: '12:00', daysMask: 0 } });
    expect(people(all, '5x2_42', closed)).toBe(0);
  });
});
