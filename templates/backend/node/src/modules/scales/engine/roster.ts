import {
  roleWindows,
  shiftModelFor,
  shiftsPerPost,
  shiftsPerPostMin,
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

export type ShiftKind = 'abertura' | 'meio' | 'fechamento' | 'unico' | 'plantao';

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
  // Turno de apoio do meio do dia: entra quando há gente; sem ele, abertura e fechamento se cobrem.
  soft?: boolean;
};

export type RosterCell = Shift & { workMinutes: number; holiday: boolean };

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
  // Reservar quem trabalha no domingo no começo da semana (padrão: sim).
  holdSunday?: boolean;
  // Nos dias úteis, dá preferência a quem não poderia trabalhar no próximo domingo (guarda a capacidade de quem pode).
  saveSundayPeople?: boolean;
  // Gira a ordem de desempate entre as pessoas (variação determinística para a escala fechar).
  tieOffset?: number;
  events?: RosterEvents;
};

// Feriados, fechamentos e plantão sobre as 4 semanas (posição = semana × 7 + dia).
export type RosterEvents = {
  // Dias em que a loja fica fechada (feriado fechado).
  closedSlots?: boolean[];
  holidaySlots?: boolean[];
  compensation?: 'folga' | 'dobro';
  rotation?: 'rotativa' | 'fixa';
  // Falso: a folga que cai no feriado não conta e gera outra folga na semana seguinte.
  offOnHolidayCounts?: boolean;
  // Turnos de plantão noturno cobertos pela equipe, por posição.
  plantaoShifts?: (slot: number) => Shift[];
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
  relaxed = false,
) {
  if (minutes <= 0) return;
  const span = shift.end - shift.start;
  // Preferido: no miolo do turno. Relaxado: a partir de 2 h do começo, para o almoço caber na sobreposição.
  const margin = relaxed
    ? 120
    : Math.min(180, Math.max(60, Math.floor((span - minutes) / 3 / GRID) * GRID));
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

// Almoço (coberto pelos outros turnos da posição) e lanche de cada turno; recalcula quando a cadeia muda.
function placeChainHoles(
  chain: Shift[],
  lunchMinutes: number,
  needsLunch: boolean,
  snackMinutes: number,
  span: number,
  window: { start: number; end: number },
) {
  const run = (relaxed: boolean) => {
    for (const s of chain) {
      s.lunch = null;
      s.snack = null;
    }
    if (needsLunch)
      for (const s of chain)
        placeHole(s, chain, lunchMinutes, 'lunch', window.start, window.end, relaxed);
    const snack = lunchMinutes > 0 ? snackMinutes : 0;
    if (snack > 0 && span > 4 * 60)
      for (const s of chain) placeHole(s, chain, snack, 'snack', window.start, window.end, relaxed);
    const ok = presence(chain, window.start, window.end).every((n) => n >= 1);
    for (const s of chain) s.covered = ok;
    return ok;
  };
  if (chain.length > 1 || needsLunch) {
    if (!run(false)) run(true);
  } else run(false);
}

// Turnos de um dia: por posição, turnos igualmente espaçados cobrindo a janela da função.
export function shiftsOfDay(input: Omit<RosterInput, 'people' | 'hasOwner'>, day: number): Shift[] {
  const window = roleWindows(input.role, input.week)[day];
  const len = windowLength(window ?? null);
  if (!window || len <= 0) return [];
  const model = shiftModelFor(input.scenario, input.role, input.lunchMinutes);
  const kFull =
    input.role.leadership && model.pooled
      ? shiftsPerPostMin(len, model)
      : shiftsPerPost(len, model);
  const k = kFull;
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
      chain.push({
        post,
        kind,
        start,
        end: start + span,
        lunch: null,
        snack: null,
        covered: true,
      });
    }
    placeChainHoles(chain, model.lunchMinutes, needsLunch, input.snackMinutes, span, window);
    all.push(...chain);
  }
  // O turno de apoio (meio do dia) é opcional: sem ele, abertura e fechamento se cobrem. O dimensionamento
  // conta os turnos obrigatórios; o apoio entra quando sobra gente.
  // Na 6x1 o desenho completo de cada posto é obrigatório.
  if (model.pooled) for (const sh of all) if (sh.kind === 'meio') sh.soft = true;
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
  holidays: number;
  // Folgas compensatórias ainda por gozar (uma por semana, a partir da semana seguinte) e a desta semana.
  pending: number;
  weekOff: number;
  // Última noite de plantão da pessoa (posição na escala).
  lastPlantaoSlot: number;
  // Reservada no começo da semana para o domingo (a semana guarda gente para o dia mais difícil).
  sundayHold: boolean;
};

export function buildRoster(input: RosterInput): Roster {
  const twelve = input.role.scaleType === 'doze_x_trinta_e_seis';
  const maxDays = twelve ? 4 : Math.round(input.scenario.daysPerWeek);
  const minRest = twelve ? 36 * 60 : SCHEDULE.minRestBetweenShiftsMinutes;
  const share = SUNDAY_WORK_SHARE[input.sundayRule];
  const kindCost = input.kindChangeCost ?? KIND_CHANGE_COST;
  // Desempate fixo e determinístico, que rotaciona com `tieOffset` para variar a ordem das pessoas.
  const rotate = (index: number) => (index + (input.tieOffset ?? 0)) % Math.max(input.people, 1);

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
    holidays: 0,
    pending: 0,
    weekOff: 0,
    lastPlantaoSlot: -10,
    sundayHold: false,
  }));
  const sundays = people.map(() => new Array<boolean>(WEEKS).fill(false));
  const unfilled: Roster['unfilled'] = [];

  for (let week = 0; week < WEEKS; week += 1) {
    for (const p of people) {
      p.weekDays = 0;
      p.weekOff = Math.min(1, p.pending);
      p.pending -= p.weekOff;
    }
    const events = input.events;
    // Reserva quem trabalha no domingo antes de a semana gastar a capacidade de todos.
    const sundaySlot = week * 7 + SUNDAY;
    const sundayRequired =
      (events?.closedSlots?.[sundaySlot] ?? false) ? [] : dayShifts[SUNDAY]!.filter((x) => !x.soft);
    for (const p of people) p.sundayHold = false;
    if (input.holdSunday !== false && share > 0 && sundayRequired.length > 0) {
      const needOff = input.sundayRule === 'um_em_dois' ? 1 : 2;
      const free = people
        .filter((p) => {
          let run = 0;
          for (let w = week - 1; w >= 0 && sundays[p.index]![w]; w -= 1) run += 1;
          return run < needOff && p.weekDays < maxDays - p.weekOff;
        })
        .sort(
          (a, b) =>
            sundays[a.index]!.filter(Boolean).length - sundays[b.index]!.filter(Boolean).length ||
            rotate(a.index) - rotate(b.index),
        );
      for (const p of free.slice(0, sundayRequired.length)) p.sundayHold = true;
    }
    const sundayStart = Math.min(...sundayRequired.map((x) => x.start), Number.POSITIVE_INFINITY);
    for (let day = 0; day < 7; day += 1) {
      const slot = week * 7 + day;
      const dayStart = slot * MINUTES_PER_DAY;
      const assigned = new Set<number>();
      const closed = events?.closedSlots?.[slot] ?? false;
      const isHoliday = events?.holidaySlots?.[slot] ?? false;
      const shifts = [
        ...(closed ? [] : dayShifts[day]!),
        ...(events?.plantaoShifts?.(slot) ?? []),
      ].sort(
        (a, b) =>
          Number(Boolean(a.soft)) - Number(Boolean(b.soft)) || a.start - b.start || a.post - b.post,
      );
      // Quem ficou com cada turno do dia, e as posições que perderam o turno de apoio.
      const given: { person: PersonState; shift: Shift }[] = [];
      const droppedPosts = new Set<number>();
      // Turno de apoio só entra se sobrar capacidade da semana depois de garantir os turnos obrigatórios dos próximos dias.
      const requiredAhead = () => {
        let n = 0;
        for (let d = day + 1; d < 7; d += 1) {
          const sl = week * 7 + d;
          if (!(events?.closedSlots?.[sl] ?? false))
            n += dayShifts[d]!.filter((x) => !x.soft).length;
          n += events?.plantaoShifts?.(sl).length ?? 0;
        }
        return n;
      };
      const spareCapacity = () =>
        people.reduce((n, p) => n + Math.max(0, maxDays - p.weekOff - p.weekDays), 0);
      for (const shift of shifts) {
        if (shift.soft && spareCapacity() - 1 < requiredAhead()) {
          droppedPosts.add(shift.post);
          continue;
        }
        const eligible = people.filter((p) => {
          if (assigned.has(p.index)) return false;
          const held = p.sundayHold && day < SUNDAY && shift.kind !== 'plantao' ? 1 : 0;
          if (p.weekDays + held >= maxDays - p.weekOff) return false;
          // Quem está reservada para o domingo não pode fechar a loja no sábado (11 h de descanso).
          if (
            p.sundayHold &&
            day === SUNDAY - 1 &&
            dayStart + shift.end + minRest >
              (SUNDAY - day) * MINUTES_PER_DAY + dayStart + sundayStart
          )
            return false;
          if (p.streak >= 6) return false;
          if (dayStart + shift.start - p.lastEndAbs < minRest) return false;
          if (day === SUNDAY && shift.kind !== 'plantao') {
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
          if (day === SUNDAY && shift.kind !== 'plantao' && a.sundayHold !== b.sundayHold)
            return a.sundayHold ? -1 : 1;
          if (shift.kind === 'plantao') {
            // Noites seguidas ficam com a mesma pessoa: só ela perde o dia seguinte (descanso de 11 h).
            const ca = slot - a.lastPlantaoSlot === 1 ? 0 : 1;
            const cb = slot - b.lastPlantaoSlot === 1 ? 0 : 1;
            if (ca !== cb) return ca - cb;
          }
          if (isHoliday && shift.kind !== 'plantao' && a.holidays !== b.holidays) {
            // Rotativa: quem trabalhou menos feriados vai primeiro; fixa: sempre o mesmo grupo.
            return events?.rotation === 'fixa' ? b.holidays - a.holidays : a.holidays - b.holidays;
          }
          if (day === SUNDAY) {
            const sa = sundays[a.index]!.filter(Boolean).length;
            const sb = sundays[b.index]!.filter(Boolean).length;
            if (sa !== sb) return sa - sb;
          }
          // Equilibra os dias trabalhados, mas favorece quem já faz esse tipo de turno (turno fixo).
          const saves = (p: PersonState) => {
            if (!input.saveSundayPeople || day === SUNDAY || share === 0) return 0;
            const needOff = input.sundayRule === 'um_em_dois' ? 1 : 2;
            let run = 0;
            for (let w = week - 1; w >= 0 && sundays[p.index]![w]; w -= 1) run += 1;
            return run < needOff ? 1 : 0;
          };
          const cost = (p: PersonState) =>
            saves(p) +
            p.weekDays +
            (p.lastKind === shift.kind || shift.kind === 'unico' || shift.kind === 'plantao'
              ? 0
              : p.lastKind === null
                ? 0.5
                : kindCost);
          return cost(a) - cost(b) || rotate(a.index) - rotate(b.index);
        })[0];
        if (!chosen) {
          // O turno de apoio é opcional: sem gente, abertura e fechamento seguem se cobrindo.
          if (shift.soft) droppedPosts.add(shift.post);
          else unfilled.push({ week, day, shift });
          continue;
        }
        assigned.add(chosen.index);
        given.push({ person: chosen, shift });
        chosen.days[slot] = { ...shift, workMinutes: workMinutes(shift), holiday: isHoliday };
        if (shift.kind === 'plantao') chosen.lastPlantaoSlot = slot;
        else chosen.homeKind ??= shift.kind;
        if (shift.kind !== 'unico' && shift.kind !== 'plantao') chosen.lastKind = shift.kind;
        if (isHoliday && shift.kind !== 'plantao') {
          chosen.holidays += 1;
          if (events?.compensation !== 'dobro') chosen.pending += 1;
        }
        chosen.lastEndAbs = dayStart + shift.end;
        chosen.weekDays += 1;
        if (day === SUNDAY && shift.kind !== 'plantao') sundays[chosen.index]![week] = true;
      }
      if (
        isHoliday &&
        !closed &&
        events?.offOnHolidayCounts === false &&
        events.compensation !== 'dobro'
      ) {
        for (const p of people) if (!assigned.has(p.index)) p.pending += 1;
      }
      // Posições sem o turno de apoio: refaz almoço e lanche só com os turnos que sobraram.
      for (const post of droppedPosts) {
        const mine = given.filter((g) => g.shift.post === post && g.shift.kind !== 'plantao');
        const window = roleWindows(input.role, input.week)[day];
        if (!window || mine.length === 0) continue;
        const model = shiftModelFor(input.scenario, input.role, input.lunchMinutes);
        const clones = mine.map((g) => ({ ...g.shift, soft: false }));
        const span = clones[0]!.end - clones[0]!.start;
        const needsLunch =
          model.lunchMinutes > 0 && windowLength(window) > SCHEDULE.lunchRequiredAboveMinutes;
        placeChainHoles(clones, model.lunchMinutes, needsLunch, input.snackMinutes, span, window);
        mine.forEach((g, i) => {
          g.person.days[slot] = {
            ...clones[i]!,
            workMinutes: workMinutes(clones[i]!),
            holiday: isHoliday,
          };
        });
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
    // Tenta, nesta ordem, variações do mesmo método até a escala fechar com esta equipe.
    for (let tieOffset = 0; tieOffset < Math.max(count + owner, 1); tieOffset += 1) {
      for (const [holdSunday, saveSundayPeople] of [
        [true, false],
        [false, true],
        [false, false],
      ] as const) {
        for (const kindChangeCost of [KIND_CHANGE_COST, 0]) {
          last = buildRoster({
            ...input,
            people: count + owner,
            kindChangeCost,
            holdSunday,
            saveSundayPeople,
            tieOffset,
          });
          if (last.ok) return { ...last, count };
        }
      }
    }
  }
  return { ...(last as Roster), count: Math.max(start, 0) + limit };
}
