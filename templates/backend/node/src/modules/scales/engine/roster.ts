import {
  roleWindows,
  shiftModelFor,
  shiftsPerPost,
  type CoverageRole,
  type WeekHours,
} from './coverage.js';
import { SCHEDULE, SUNDAY_WORK_SHARE, type Scenario, type SundayRule } from './rules.js';
import { MINUTES_PER_DAY, SUNDAY, windowLength } from './time.js';

// Escala de 4 semanas de uma função: quem trabalha em cada dia, com entrada, saída, almoço e lanche.
// Alocação gulosa e determinística (sem sorteio): turnos fixos por pessoa sempre que possível, 11 h de descanso,
// limite de dias por semana do cenário e rodízio de domingos pela regra escolhida.

const GRID = 15; // minutos
const WEEKS = SCHEDULE.weeks;
// Quanto vale, em dias de trabalho, manter a pessoa no mesmo tipo de turno.
const KIND_CHANGE_COST = 2.5;

export type ShiftKind = 'abertura' | 'meio' | 'fechamento' | 'unico';

export type Hole = { start: number; end: number };

export type Shift = {
  post: number;
  kind: ShiftKind;
  start: number;
  end: number;
  lunch: Hole | null;
  snack: Hole | null;
  // Todo o salão fica coberto durante os buracos de almoço e lanche.
  covered: boolean;
};

export type RosterCell = Shift & { workMinutes: number };

export type RosterPerson = {
  index: number;
  isOwner: boolean;
  // Dias de 4 semanas × 7: nulo = folga.
  days: (RosterCell | null)[];
};

export type Roster = {
  ok: boolean;
  people: RosterPerson[];
  // Turnos que ficaram sem ninguém (vazio quando ok).
  unfilled: { week: number; day: number; shift: Shift }[];
};

export type RosterInput = {
  role: CoverageRole;
  week: WeekHours;
  scenario: Scenario;
  lunchMinutes: number;
  snackMinutes: number;
  sundayRule: SundayRule;
  // Pessoas escaladas (o dono farmacêutico, quando atua, entra como a última pessoa).
  people: number;
  hasOwner?: boolean;
  // Quanto vale manter a pessoa no mesmo tipo de turno (padrão: KIND_CHANGE_COST). Zero só equilibra os dias.
  kindChangeCost?: number;
};

const snap = (minutes: number) => Math.round(minutes / GRID) * GRID;

// Quantas pessoas de uma mesma posição estão presentes (e fora do almoço) em cada trecho de 15 min.
// O lanche pago de 15 min é feito no posto e não abre buraco na cobertura.
function presence(shifts: Shift[], from: number, to: number): number[] {
  const slots = Math.ceil((to - from) / GRID);
  const out = new Array<number>(slots).fill(0);
  for (const s of shifts) {
    for (let i = 0; i < slots; i += 1) {
      const t = from + i * GRID;
      if (t >= s.start && t < s.end) {
        const hole = s.lunch !== null && t >= s.lunch.start && t < s.lunch.end;
        if (!hole) out[i]! += 1;
      }
    }
  }
  return out;
}

// Coloca uma pausa onde o resto da posição continua cobrindo. Prefere o meio do turno.
function placeHole(
  shift: Shift,
  chain: Shift[],
  minutes: number,
  key: 'lunch' | 'snack',
  from: number,
  to: number,
) {
  if (minutes <= 0) return;
  const span = shift.end - shift.start;
  const margin = Math.min(180, Math.max(60, Math.floor((span - minutes) / 3 / GRID) * GRID));
  const lo = snap(shift.start + margin);
  const hi = shift.end - margin - minutes;
  const mid = (shift.start + shift.end - minutes) / 2;
  const candidates: number[] = [];
  for (let t = lo; t <= hi; t += GRID) candidates.push(t);
  candidates.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
  if (key === 'snack') {
    const free = candidates.find(
      (t) => !shift.lunch || t + minutes <= shift.lunch.start || t >= shift.lunch.end,
    );
    shift.snack = free === undefined ? null : { start: free, end: free + minutes };
    return;
  }
  let best: { t: number; worst: number } | null = null;
  for (const t of candidates) {
    shift[key] = { start: t, end: t + minutes };
    const p = presence(chain, from, to);
    const first = Math.floor((t - from) / GRID);
    const last = Math.ceil((t + minutes - from) / GRID);
    const worst = Math.min(...p.slice(first, last));
    if (worst >= 1) return;
    if (!best || worst > best.worst) best = { t, worst };
  }
  // Sem posição que cubra: fica na melhor tentativa e a escala avisa.
  shift[key] = best ? { start: best.t, end: best.t + minutes } : null;
}

// Turnos de um dia: por posição, turnos igualmente espaçados cobrindo a janela da função.
export function shiftsOfDay(input: Omit<RosterInput, 'people' | 'hasOwner'>, day: number): Shift[] {
  const window = roleWindows(input.role, input.week)[day];
  const len = windowLength(window ?? null);
  if (!window || len <= 0) return [];
  const model = shiftModelFor(input.scenario, input.role, input.lunchMinutes);
  const k = shiftsPerPost(len, model);
  const needsLunch = model.lunchMinutes > 0 && len > SCHEDULE.lunchRequiredAboveMinutes;
  const posts = Math.max(input.role.minInHall, 0);
  const all: Shift[] = [];
  for (let post = 0; post < posts; post += 1) {
    const span = Math.min(model.dailyMinutes + (needsLunch ? model.lunchMinutes : 0), len);
    const chain: Shift[] = [];
    for (let i = 0; i < k; i += 1) {
      let start = k === 1 ? window.start : snap(window.start + (i * (len - span)) / (k - 1));
      if (i === k - 1) start = window.end - span;
      const kind: ShiftKind =
        k === 1 ? 'unico' : i === 0 ? 'abertura' : i === k - 1 ? 'fechamento' : 'meio';
      chain.push({ post, kind, start, end: start + span, lunch: null, snack: null, covered: true });
    }
    if (needsLunch)
      for (const s of chain)
        placeHole(s, chain, model.lunchMinutes, 'lunch', window.start, window.end);
    const snack = model.lunchMinutes > 0 ? input.snackMinutes : 0;
    if (snack > 0 && span > 4 * 60)
      for (const s of chain) placeHole(s, chain, snack, 'snack', window.start, window.end);
    if (k > 1 || needsLunch) {
      const p = presence(chain, window.start, window.end);
      const ok = p.every((n) => n >= 1);
      for (const s of chain) s.covered = ok;
    }
    all.push(...chain);
  }
  return all;
}

const workMinutes = (s: Shift) => s.end - s.start - (s.lunch ? s.lunch.end - s.lunch.start : 0);

type PersonState = {
  index: number;
  isOwner: boolean;
  days: (RosterCell | null)[];
  homeKind: ShiftKind | null;
  lastKind: ShiftKind | null;
  lastEndAbs: number;
  weekDays: number;
  streak: number;
};

export function buildRoster(input: RosterInput): Roster {
  const twelve = input.role.scaleType === 'doze_x_trinta_e_seis';
  const maxDays = twelve ? 4 : Math.round(input.scenario.daysPerWeek);
  const minRest = twelve ? 36 * 60 : SCHEDULE.minRestBetweenShiftsMinutes;
  const share = SUNDAY_WORK_SHARE[input.sundayRule];
  const kindCost = input.kindChangeCost ?? KIND_CHANGE_COST;

  const dayShifts = Array.from({ length: 7 }, (_, d) => shiftsOfDay(input, d));
  const people: PersonState[] = Array.from({ length: input.people }, (_, index) => ({
    index,
    isOwner: Boolean(input.hasOwner) && index === input.people - 1,
    days: new Array<RosterCell | null>(WEEKS * 7).fill(null),
    homeKind: null,
    lastKind: null,
    lastEndAbs: -Infinity,
    weekDays: 0,
    streak: 0,
  }));
  const sundays = people.map(() => new Array<boolean>(WEEKS).fill(false));
  const unfilled: Roster['unfilled'] = [];

  for (let week = 0; week < WEEKS; week += 1) {
    for (const p of people) p.weekDays = 0;
    for (let day = 0; day < 7; day += 1) {
      const slot = week * 7 + day;
      const dayStart = slot * MINUTES_PER_DAY;
      const assigned = new Set<number>();
      const shifts = [...dayShifts[day]!].sort((a, b) => a.start - b.start || a.post - b.post);
      for (const shift of shifts) {
        const eligible = people.filter((p) => {
          if (assigned.has(p.index)) return false;
          if (p.weekDays >= maxDays) return false;
          if (p.streak >= 6) return false;
          if (dayStart + shift.start - p.lastEndAbs < minRest) return false;
          if (day === SUNDAY) {
            if (share === 0) return false;
            const s = sundays[p.index]!;
            const needOff = input.sundayRule === 'um_em_dois' ? 1 : 2;
            let run = 0;
            for (let w = week - 1; w >= 0 && s[w]; w -= 1) run += 1;
            if (run >= needOff) return false;
          }
          return true;
        });
        const chosen = [...eligible].sort((a, b) => {
          if (day === SUNDAY) {
            const sa = sundays[a.index]!.filter(Boolean).length;
            const sb = sundays[b.index]!.filter(Boolean).length;
            if (sa !== sb) return sa - sb;
          }
          // Equilibra os dias trabalhados, mas favorece quem já faz esse tipo de turno (turno fixo).
          const cost = (p: PersonState) =>
            p.weekDays +
            (p.lastKind === shift.kind || shift.kind === 'unico'
              ? 0
              : p.lastKind === null
                ? 0.5
                : kindCost);
          return cost(a) - cost(b) || a.index - b.index;
        })[0];
        if (!chosen) {
          unfilled.push({ week, day, shift });
          continue;
        }
        assigned.add(chosen.index);
        chosen.days[slot] = { ...shift, workMinutes: workMinutes(shift) };
        chosen.homeKind ??= shift.kind;
        if (shift.kind !== 'unico') chosen.lastKind = shift.kind;
        chosen.lastEndAbs = dayStart + shift.end;
        chosen.weekDays += 1;
        if (day === SUNDAY) sundays[chosen.index]![week] = true;
      }
      for (const p of people) p.streak = assigned.has(p.index) ? p.streak + 1 : 0;
    }
  }

  return {
    ok: unfilled.length === 0,
    people: people.map(({ index, isOwner, days }) => ({ index, isOwner, days })),
    unfilled,
  };
}

// Menor número de pessoas, a partir de `start`, para o qual a escala fecha.
export function rosterWithMinimumPeople(
  input: Omit<RosterInput, 'people'>,
  start: number,
  limit = 12,
): Roster & { count: number } {
  const owner = input.hasOwner ? 1 : 0;
  let last: Roster | null = null;
  for (let extra = 0; extra <= limit; extra += 1) {
    const count = Math.max(start, 0) + extra;
    // Primeiro tenta manter turnos estáveis; se não fechar com esta equipe, só equilibra os dias.
    for (const kindChangeCost of [KIND_CHANGE_COST, 0]) {
      last = buildRoster({ ...input, people: count + owner, kindChangeCost });
      if (last.ok) return { ...last, count };
    }
  }
  return { ...(last as Roster), count: Math.max(start, 0) + limit };
}
