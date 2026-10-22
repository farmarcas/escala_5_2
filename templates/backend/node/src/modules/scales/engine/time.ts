// Tempo e calendário do motor de escalas. Funções puras: sem relógio, sem banco.
// Dias da semana: 0 = segunda … 6 = domingo. Horas viram minutos desde 00:00.

export const MINUTES_PER_DAY = 1440;
export const SUNDAY = 6;
export const ALL_DAYS_MASK = 0b1111111;

const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseHM(value: string): number {
  const match = HM.exec(value);
  if (!match) throw new Error(`Horário inválido: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatHM(minutes: number): string {
  const day = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(day / 60);
  const m = day % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Janela [start, end) em minutos. Se o fim não é depois do início, a janela passa da meia-noite.
export type Window = { start: number; end: number };

export function windowFromHM(start: string, end: string): Window {
  const s = parseHM(start);
  let e = parseHM(end);
  if (e <= s) e += MINUTES_PER_DAY;
  return { start: s, end: e };
}

export function windowLength(w: Window | null): number {
  return w ? Math.max(0, w.end - w.start) : 0;
}

export function intersect(a: Window | null, b: Window | null): Window | null {
  if (!a || !b) return null;
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return end > start ? { start, end } : null;
}

export function daysFromMask(mask: number): number[] {
  const days: number[] = [];
  for (let d = 0; d < 7; d += 1) if (mask & (1 << d)) days.push(d);
  return days;
}

export function maskFromDays(days: readonly number[]): number {
  return days.reduce((mask, d) => mask | (1 << d), 0);
}

export function isDayInMask(mask: number, day: number): boolean {
  return (mask & (1 << day)) !== 0;
}

// "AAAA-MM-DD" → 0 (segunda) … 6 (domingo), em UTC (sem fuso).
export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  const js = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay(); // 0 = domingo
  return (js + 6) % 7;
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + days));
  return date.toISOString().slice(0, 10);
}

// Segunda-feira da semana que contém a data.
export function mondayOf(isoDate: string): string {
  return addDays(isoDate, -weekdayOf(isoDate));
}
