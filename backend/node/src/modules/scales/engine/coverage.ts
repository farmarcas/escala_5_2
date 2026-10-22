import { SCHEDULE, type Scenario } from './rules.js';
import {
  ALL_DAYS_MASK,
  MINUTES_PER_DAY,
  intersect,
  isDayInMask,
  windowFromHM,
  windowLength,
  type Window,
} from './time.js';

// Cobertura: quantos "postos" (turnos de uma pessoa) cada função precisa por dia da semana.

// Horário da loja por dia da semana (0 = segunda); nulo = fechada.
export type WeekHours = readonly (Window | null)[];

export function allDayHours(): WeekHours {
  return Array.from({ length: 7 }, () => ({ start: 0, end: MINUTES_PER_DAY }));
}

export type StoreHoursInput = {
  always24h?: boolean;
  standard: { start: string; end: string; daysMask: number };
  // Ajuste por dia: fechado ou outro horário.
  overrides?: Partial<Record<number, { closed: true } | { start: string; end: string }>>;
};

export function buildWeekHours(input: StoreHoursInput): WeekHours {
  if (input.always24h) return allDayHours();
  const base = windowFromHM(input.standard.start, input.standard.end);
  return Array.from({ length: 7 }, (_, day) => {
    const override = input.overrides?.[day];
    if (override) return 'closed' in override ? null : windowFromHM(override.start, override.end);
    return isDayInMask(input.standard.daysMask, day) ? base : null;
  });
}

export type CoverageRole = {
  minInHall: number;
  coverage: { mode: 'all' } | { mode: 'band'; start: string; end: string };
  daysMask: number;
  // Regime da função: a 12x36 não depende do cenário.
  scaleType?: 'normal' | 'doze_x_trinta_e_seis';
};

export type ShiftModel = {
  // Jornada trabalhada por dia, em minutos (sem o almoço).
  dailyMinutes: number;
  lunchMinutes: number;
};

export function shiftModelFor(
  scenario: Scenario,
  role: Pick<CoverageRole, 'scaleType'>,
  lunchMinutes: number,
): ShiftModel {
  if (role.scaleType === 'doze_x_trinta_e_seis') {
    // 12x36: o intervalo é indenizado, então não abre buraco na cobertura.
    return { dailyMinutes: SCHEDULE.twelveByThirtySix.dailyHours * 60, lunchMinutes: 0 };
  }
  return { dailyMinutes: Math.round(scenario.dailyHours * 60), lunchMinutes };
}

// Janela que a função precisa cobrir em cada dia (loja aberta ∩ faixa da função ∩ dias da função).
export function roleWindows(role: CoverageRole, week: WeekHours): (Window | null)[] {
  const band =
    role.coverage.mode === 'band' ? windowFromHM(role.coverage.start, role.coverage.end) : null;
  return week.map((open, day) => {
    if (!open || !isDayInMask(role.daysMask, day)) return null;
    if (!band) return open;
    // A faixa vale no mesmo dia; se passa da meia-noite, também recorta a madrugada do dia seguinte.
    return (
      intersect(open, band) ??
      intersect(open, { start: band.start - MINUTES_PER_DAY, end: band.end - MINUTES_PER_DAY })
    );
  });
}

// Turnos de uma pessoa necessários por posto para cobrir `windowMin` sem deixar o salão descoberto
// no almoço: cada turno cobre a jornada menos o intervalo, porque o turno seguinte precisa estar presente
// enquanto o anterior almoça. Janela de até 6 h não exige almoço.
export function shiftsPerPost(windowMin: number, shift: ShiftModel): number {
  if (windowMin <= 0) return 0;
  const needsLunch = shift.lunchMinutes > 0 && windowMin > SCHEDULE.lunchRequiredAboveMinutes;
  const usefulPerShift = shift.dailyMinutes - (needsLunch ? shift.lunchMinutes : 0);
  return Math.ceil(windowMin / Math.max(usefulPerShift, 1));
}

// Postos por dia da semana (7 posições): mínimo no salão × turnos por posto.
export function postsPerDay(role: CoverageRole, week: WeekHours, shift: ShiftModel): number[] {
  return roleWindows(role, week).map((w) => role.minInHall * shiftsPerPost(windowLength(w), shift));
}

export { ALL_DAYS_MASK };
