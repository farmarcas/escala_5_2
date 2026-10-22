import { addDays } from './time.js';

// Feriados nacionais de 2026 a 2028 (Sexta-feira Santa é o único móvel). Estaduais e municipais o dono cadastra.
// Lei 605/1949, art. 9º; Súmula 146 do TST.

export type Holiday = { date: string; name: string; scope: 'nacional' | 'estadual_municipal' };

const fixed = (year: number): Holiday[] =>
  [
    ['01-01', 'Confraternização Universal'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia do Trabalho'],
    ['09-07', 'Independência do Brasil'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Dia da Consciência Negra'],
    ['12-25', 'Natal'],
  ].map(([md, name]) => ({ date: `${year}-${md}`, name: name!, scope: 'nacional' as const }));

const GOOD_FRIDAY: Record<number, string> = {
  2026: '2026-04-03',
  2027: '2027-03-26',
  2028: '2028-04-14',
};

export const NATIONAL_HOLIDAYS: readonly Holiday[] = [2026, 2027, 2028]
  .flatMap((year) => [
    ...fixed(year),
    { date: GOOD_FRIDAY[year]!, name: 'Sexta-feira Santa', scope: 'nacional' as const },
  ])
  .sort((a, b) => a.date.localeCompare(b.date));

export type HolidaySettings = {
  national: boolean;
  extra: { date: string; name: string }[];
  // Rotativa: quem trabalha no feriado muda; fixa: sempre as mesmas pessoas.
  rotation: 'rotativa' | 'fixa';
  // Folga compensatória na semana seguinte ou pagamento em dobro.
  compensation: 'folga' | 'dobro';
  // A folga que cai no feriado conta como a folga da semana (a lei não exige outra).
  offOnHolidayCounts: boolean;
  openOnHolidays: boolean;
};

export const DEFAULT_HOLIDAYS: HolidaySettings = {
  national: true,
  extra: [],
  rotation: 'rotativa',
  compensation: 'folga',
  offOnHolidayCounts: true,
  openOnHolidays: true,
};

// Feriados que caem em cada um dos `days` dias a partir de `startDate`; índice = posição no período.
export function holidaysByDay(
  startDate: string,
  days: number,
  settings: HolidaySettings,
): (Holiday | null)[] {
  const all = new Map<string, Holiday>();
  if (settings.national) for (const h of NATIONAL_HOLIDAYS) all.set(h.date, h);
  for (const h of settings.extra) all.set(h.date, { ...h, scope: 'estadual_municipal' });
  return Array.from({ length: days }, (_, i) => all.get(addDays(startDate, i)) ?? null);
}
