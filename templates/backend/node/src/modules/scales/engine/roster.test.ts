import { describe, expect, it } from 'vitest';
import { buildWeekHours, roleWindows, type CoverageRole } from './coverage.js';
import { centroHours, centroRows } from './fixtures/reference-centro.js';
import { buildRoster, rosterWithMinimumPeople, type Roster, type RosterInput } from './roster.js';
import { SCENARIOS, type ScenarioId, type SundayRule } from './rules.js';
import { requiredPeople } from './staffing.js';
import { MINUTES_PER_DAY, SUNDAY } from './time.js';

const week = buildWeekHours(centroHours);
const GRID = 15;

const inputFor = (
  role: CoverageRole,
  scenario: ScenarioId,
  sundayRule: SundayRule = 'um_em_tres',
): Omit<RosterInput, 'people'> => ({
  role,
  week,
  scenario: SCENARIOS[scenario],
  lunchMinutes: 60,
  snackMinutes: 15,
  sundayRule,
});

const build = (role: CoverageRole, scenario: ScenarioId, sundayRule: SundayRule = 'um_em_tres') => {
  const base = inputFor(role, scenario, sundayRule);
  const formula = requiredPeople(role, week, SCENARIOS[scenario], { lunchMinutes: 60, sundayRule });
  if (!formula.ok) throw new Error(formula.reason);
  return { base, formula: formula.people, roster: rosterWithMinimumPeople(base, formula.people) };
};

// Quantas pessoas cobrem cada trecho de 15 min do dia (fora de almoço e lanche).
function presenceAt(roster: Roster, slot: number, t: number) {
  let n = 0;
  for (const p of roster.people) {
    const c = p.days[slot];
    if (!c) continue;
    const inHole = [c.lunch].some((h) => h && t >= h.start && t < h.end);
    if (t >= c.start && t < c.end && !inHole) n += 1;
  }
  return n;
}

function assertValid(roster: Roster, base: Omit<RosterInput, 'people'>) {
  const windows = roleWindows(base.role, base.week);
  const maxDays = Math.round(base.scenario.daysPerWeek);
  expect(roster.ok).toBe(true);
  for (let slot = 0; slot < 28; slot += 1) {
    const w = windows[slot % 7];
    if (!w) continue;
    for (let t = w.start; t < w.end; t += GRID) {
      expect(presenceAt(roster, slot, t), `dia ${slot} ${t}`).toBeGreaterThanOrEqual(
        base.role.minInHall,
      );
    }
  }
  for (const p of roster.people) {
    for (let week = 0; week < 4; week += 1) {
      const worked = p.days.slice(week * 7, week * 7 + 7).filter(Boolean).length;
      expect(worked).toBeLessThanOrEqual(maxDays);
    }
    let lastEnd = -Infinity;
    p.days.forEach((c, slot) => {
      if (!c) return;
      expect(slot * MINUTES_PER_DAY + c.start - lastEnd).toBeGreaterThanOrEqual(11 * 60);
      lastEnd = slot * MINUTES_PER_DAY + c.end;
    });
  }
}

describe('roster', () => {
  for (const [name, row] of Object.entries(centroRows)) {
    for (const id of ['5x2_42', '5x2_40', '6x1_44'] as const) {
      it(`${name} em ${SCENARIOS[id].label}: cobre o horário, descansa 11 h e respeita os dias`, () => {
        const { base, roster } = build(
          { ...row.role, extraPostsPerWeek: undefined } as CoverageRole,
          id,
        );
        assertValid(roster, base);
      });
    }
  }

  it('o farmacêutico está presente em todo o horário da loja', () => {
    const { roster } = build(centroRows['farmaceutico']!.role, '5x2_42');
    for (let slot = 0; slot < 28; slot += 1) {
      const w = week[slot % 7];
      if (!w) continue;
      for (let t = w.start; t < w.end; t += GRID)
        expect(presenceAt(roster, slot, t)).toBeGreaterThanOrEqual(1);
    }
  });

  it('o número de pessoas que fecha a escala fica a até 1 da fórmula de dimensionamento', () => {
    for (const row of Object.values(centroRows)) {
      for (const id of ['5x2_42', '6x1_44'] as const) {
        const { formula, roster } = build(row.role, id);
        expect(roster.count - formula).toBeLessThanOrEqual(1);
      }
    }
  });

  it('rodízio de domingos: ninguém trabalha 3 domingos seguidos (1 em 3) e a regra 1 em 2 alterna', () => {
    const caixa = centroRows['caixa']!.role;
    const three = build(caixa, '5x2_42', 'um_em_tres').roster;
    for (const p of three.people) {
      const s = [0, 1, 2, 3].map((w) => Boolean(p.days[w * 7 + SUNDAY]));
      expect(s.join()).not.toContain('true,true,true');
    }
    const two = build(caixa, '5x2_42', 'um_em_dois').roster;
    for (const p of two.people) {
      const s = [0, 1, 2, 3].map((w) => Boolean(p.days[w * 7 + SUNDAY]));
      expect(s.join()).not.toContain('true,true');
    }
  });

  it('todo domingo de folga não escala ninguém no domingo', () => {
    const closedSunday = buildWeekHours({
      standard: { start: '07:00', end: '22:00', daysMask: 0b0111111 },
    });
    const base = {
      ...inputFor(centroRows['caixa']!.role, '5x2_42', 'todo_domingo'),
      week: closedSunday,
    };
    const roster = buildRoster({ ...base, people: 4 });
    for (const p of roster.people)
      for (let w = 0; w < 4; w += 1) expect(p.days[w * 7 + SUNDAY]).toBeNull();
  });

  it('com gente sobrando, cada pessoa passa a maior parte dos dias (seg a sáb) no mesmo tipo de turno', () => {
    // Na equipe mínima parte do pessoal alterna de turno (sempre com 11 h de descanso); com folga de gente fica estável.
    const roster = buildRoster({ ...inputFor(centroRows['caixa']!.role, '5x2_42'), people: 7 });
    expect(roster.ok).toBe(true);
    for (const p of roster.people) {
      const kinds = p.days.filter((c, slot) => c && slot % 7 !== SUNDAY).map((c) => c!.kind);
      if (kinds.length === 0) continue;
      const top = Math.max(
        ...['abertura', 'meio', 'fechamento'].map((k) => kinds.filter((x) => x === k).length),
      );
      expect(top / kinds.length).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('as horas da semana não passam do limite do cenário', () => {
    const { roster } = build(centroRows['balconista']!.role, '5x2_42');
    for (const p of roster.people) {
      for (let w = 0; w < 4; w += 1) {
        const minutes = p.days
          .slice(w * 7, w * 7 + 7)
          .reduce((n, c) => n + (c?.workMinutes ?? 0), 0);
        expect(minutes).toBeLessThanOrEqual(42 * 60 + 1);
      }
    }
  });

  it('é determinística: mesma entrada, mesma escala', () => {
    const a = build(centroRows['balconista']!.role, '5x2_42').roster;
    const b = build(centroRows['balconista']!.role, '5x2_42').roster;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('o dono farmacêutico entra como uma pessoa extra na escala', () => {
    const base = inputFor(centroRows['farmaceutico']!.role, '5x2_42');
    const r = rosterWithMinimumPeople({ ...base, hasOwner: true }, 3);
    expect(r.people.at(-1)!.isOwner).toBe(true);
    expect(r.people).toHaveLength(r.count + 1);
  });
});
