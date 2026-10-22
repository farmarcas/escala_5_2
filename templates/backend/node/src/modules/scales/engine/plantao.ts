import { SCHEDULE } from './rules.js';
import { MINUTES_PER_DAY, windowFromHM } from './time.js';

// Plantão noturno: uma noite por semana (semanal) ou a semana inteira de um ciclo de 4 semanas (mensal).
// Coberto pela equipe da escala (folga no dia seguinte, pela regra das 11 h) ou por plantonista intermitente
// (CLT art. 452-A: paga só as horas convocadas).

export type PlantaoRole = 'farmaceutico' | 'balconista' | 'caixa';

export type PlantaoSettings = {
  type: 'none' | 'weekly' | 'monthly';
  // Semanal: dia da semana da noite (0 = segunda).
  weekday: number;
  // Mensal: semana do ciclo (1 a 4) em que o plantão acontece.
  cycleWeek: number;
  start: string;
  end: string;
  people: Record<PlantaoRole, number>;
  cover: 'team' | 'intermittent';
  // Paga o intervalo de 1 h com 50% de acréscimo em vez de descontar do turno.
  indemnifyBreak: boolean;
};

export const DEFAULT_PLANTAO: PlantaoSettings = {
  type: 'none',
  weekday: 4,
  cycleWeek: 2,
  start: '22:00',
  end: '07:00',
  people: { farmaceutico: 1, balconista: 1, caixa: 0 },
  cover: 'team',
  indemnifyBreak: true,
};

export const PLANTAO_BREAK_MINUTES = 60;

export const PLANTAO_ROLES: readonly PlantaoRole[] = ['farmaceutico', 'balconista', 'caixa'];

// Noites com plantão em cada posição (semana × 7 + dia) das 4 semanas.
export function plantaoNights(settings: PlantaoSettings): boolean[] {
  return Array.from({ length: SCHEDULE.weeks * 7 }, (_, slot) => {
    const week = Math.floor(slot / 7);
    const day = slot % 7;
    if (settings.type === 'weekly') return day === settings.weekday;
    if (settings.type === 'monthly') return week === settings.cycleWeek - 1;
    return false;
  });
}

// Turno da noite: começa no dia da posição e termina no dia seguinte (minutos passam de 1440).
export function plantaoShiftTimes(settings: PlantaoSettings) {
  const w = windowFromHM(settings.start, settings.end);
  const lengthMinutes = w.end - w.start;
  const workMinutes = lengthMinutes - (settings.indemnifyBreak ? 0 : PLANTAO_BREAK_MINUTES);
  return { start: w.start % MINUTES_PER_DAY, end: w.end, lengthMinutes, workMinutes };
}

// Noites de plantão por semana, em média (para estimar a equipe antes de montar a escala).
export function plantaoNightsPerWeek(settings: PlantaoSettings): number {
  return plantaoNights(settings).filter(Boolean).length / SCHEDULE.weeks;
}
