import type { Shift } from './engine/roster.js';
import type { RosterEvents } from './engine/roster.js';
import { holidaysByDay, type Holiday } from './engine/holidays.js';
import {
  PLANTAO_BREAK_MINUTES,
  PLANTAO_ROLES,
  plantaoNights,
  plantaoNightsPerWeek,
  plantaoShiftTimes,
  type PlantaoRole,
} from './engine/plantao.js';
import { SCHEDULE } from './engine/rules.js';
import type { ScaleStoreInput } from './scales.schemas.js';

// Feriados e plantão da loja, traduzidos para o que o gerador de escala entende.

export const holidayDays = (store: ScaleStoreInput): (Holiday | null)[] =>
  holidaysByDay(store.scaleStartDate, SCHEDULE.weeks * 7, store.holidays);

export const plantaoRoleOf = (role: string): PlantaoRole | null =>
  (PLANTAO_ROLES as readonly string[]).includes(role) ? (role as PlantaoRole) : null;

// Turnos de plantão de uma função em cada noite (vazio quando não há plantão ou quem cobre é intermitente).
function plantaoShiftsFor(
  store: ScaleStoreInput,
  role: PlantaoRole,
): ((slot: number) => Shift[]) | undefined {
  const { plantao } = store;
  const people = plantao.people[role];
  if (plantao.type === 'none' || plantao.cover !== 'team' || people <= 0) return undefined;
  const nights = plantaoNights(plantao);
  const times = plantaoShiftTimes(plantao);
  return (slot) =>
    nights[slot]
      ? Array.from({ length: people }, (_, post) => ({
          post,
          kind: 'plantao' as const,
          start: times.start,
          end: times.end,
          // Sem indenizar, o intervalo de 1 h é descontado do turno.
          lunch: plantao.indemnifyBreak
            ? null
            : { start: times.start + 4 * 60, end: times.start + 4 * 60 + PLANTAO_BREAK_MINUTES },
          snack: null,
          covered: true,
        }))
      : [];
}

export function eventsFor(store: ScaleStoreInput, roleName: string): RosterEvents {
  const days = holidayDays(store);
  const role = plantaoRoleOf(roleName);
  const plantaoShifts = role ? plantaoShiftsFor(store, role) : undefined;
  return {
    holidaySlots: days.map(Boolean),
    closedSlots: days.map((h) => h !== null && !store.holidays.openOnHolidays),
    compensation: store.holidays.compensation,
    rotation: store.holidays.rotation,
    offOnHolidayCounts: store.holidays.offOnHolidayCounts,
    ...(plantaoShifts && { plantaoShifts }),
  };
}

// Postos extras por semana que o plantão coberto pela equipe pede da função (para estimar a equipe).
export function plantaoExtraPostsPerWeek(store: ScaleStoreInput, roleName: string): number {
  const role = plantaoRoleOf(roleName);
  if (!role || store.plantao.type === 'none' || store.plantao.cover !== 'team') return 0;
  return plantaoNightsPerWeek(store.plantao) * store.plantao.people[role];
}
