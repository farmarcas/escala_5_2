import { postsPerDay, shiftModelFor, type CoverageRole, type WeekHours } from './coverage.js';
import {
  SCHEDULE,
  SCENARIOS,
  SUNDAY_WORK_SHARE,
  type Scenario,
  type ScenarioId,
  type SundayRule,
} from './rules.js';
import { SUNDAY } from './time.js';

// Dimensionamento: o menor número de pessoas que sustenta os postos da semana.
// Cada pessoa trabalha `daysPerWeek` dias; o domingo só pode ser coberto pela fração de pessoas que
// trabalha naquele domingo (folga dominical). Resultado determinístico.

export type StaffingRole = CoverageRole & {
  ownerIsPharmacist?: boolean;
  // Postos extras por semana (ex.: plantão noturno coberto pela equipe), em média.
  extraPostsPerWeek?: number;
};

export type StaffingOptions = {
  lunchMinutes: number;
  sundayRule: SundayRule;
};

export type StaffingResult =
  | { ok: true; people: number; postsPerDay: number[]; postsPerWeek: number }
  | { ok: false; reason: 'todo_domingo_com_loja_aberta' };

export function requiredPeople(
  role: StaffingRole,
  week: WeekHours,
  scenario: Scenario,
  options: StaffingOptions,
): StaffingResult {
  const shift = shiftModelFor(scenario, role, options.lunchMinutes);
  const posts = postsPerDay(role, week, shift);
  const sundayPosts = posts[SUNDAY] ?? 0;
  const share = SUNDAY_WORK_SHARE[options.sundayRule];
  if (sundayPosts > 0 && share === 0) return { ok: false, reason: 'todo_domingo_com_loja_aberta' };

  const daysPerWeek =
    role.scaleType === 'doze_x_trinta_e_seis'
      ? SCHEDULE.twelveByThirtySix.daysPerWeek
      : scenario.daysPerWeek;
  const postsPerWeek = posts.reduce((sum, n) => sum + n, 0) + (role.extraPostsPerWeek ?? 0);
  if (postsPerWeek === 0) return { ok: true, people: 0, postsPerDay: posts, postsPerWeek };

  const byCapacity = postsPerWeek / daysPerWeek;
  const bySunday = share > 0 ? sundayPosts / share : 0;
  let people = Math.ceil(Math.max(byCapacity, bySunday) - 1e-9);
  // Em um dia, ninguém está em dois turnos: o maior dia da semana também é piso.
  people = Math.max(people, ...posts);
  if (role.ownerIsPharmacist) people = Math.max(people - 1, 1);
  return { ok: true, people, postsPerDay: posts, postsPerWeek };
}

export type ScenarioStaffing = Record<ScenarioId, StaffingResult>;

export function requiredPeopleByScenario(
  role: StaffingRole,
  week: WeekHours,
  options: StaffingOptions,
): ScenarioStaffing {
  return {
    '6x1_44': requiredPeople(role, week, SCENARIOS['6x1_44'], options),
    '5x2_42': requiredPeople(role, week, SCENARIOS['5x2_42'], options),
    '5x2_40': requiredPeople(role, week, SCENARIOS['5x2_40'], options),
  };
}
