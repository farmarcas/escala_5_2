import { describe, expect, it } from 'vitest';
import { LEGAL_RULES, SCENARIOS, SUNDAY_WORK_SHARE } from './rules.js';

describe('rules', () => {
  it('toda regra tem fonte, texto e vigência', () => {
    expect(LEGAL_RULES.length).toBeGreaterThan(0);
    for (const rule of LEGAL_RULES) {
      expect(rule.source.length, rule.id).toBeGreaterThan(3);
      expect(rule.text.length, rule.id).toBeGreaterThan(20);
      expect(rule.effectiveFrom, rule.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(new Set(LEGAL_RULES.map((r) => r.id)).size).toBe(LEGAL_RULES.length);
  });

  it('os cenários batem com a EC 141/2026', () => {
    expect(SCENARIOS['6x1_44'].daysPerWeek).toBe(6);
    expect(SCENARIOS['5x2_42'].dailyHours).toBeCloseTo(8.4, 5);
    expect(SCENARIOS['5x2_40'].dailyHours).toBe(8);
    for (const s of Object.values(SCENARIOS)) {
      expect(s.dailyHours * s.daysPerWeek).toBeCloseTo(s.weeklyHours, 5);
    }
  });

  it('a fração de domingos trabalhados segue a regra escolhida', () => {
    expect(SUNDAY_WORK_SHARE.um_em_tres).toBeCloseTo(2 / 3, 5);
    expect(SUNDAY_WORK_SHARE.todo_domingo).toBe(0);
  });
});
