import { PAY } from './rules.js';

// Trabalho noturno (CLT art. 73): das 22h às 5h, com hora de 52 min 30 s e adicional de 20%.

const NIGHT_WINDOWS = [
  { start: 0, end: 5 * 60 },
  { start: 22 * 60, end: 29 * 60 },
] as const;

const overlap = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));

// Minutos de um turno (início e fim em minutos desde 00:00, o fim pode passar de 1440) dentro da faixa noturna.
export function nightMinutes(
  shift: { start: number; end: number },
  lunch: { start: number; end: number } | null,
): number {
  const inNight = (w: { start: number; end: number }) =>
    NIGHT_WINDOWS.reduce((n, night) => n + overlap(w, night), 0);
  return inNight(shift) - (lunch ? inNight(lunch) : 0);
}

// Valor da hora normal a partir do salário mensal e da jornada semanal (220 h para 44 h semanais).
export const hourlyRate = (monthlySalary: number, weeklyHours: number) =>
  monthlySalary / (weeklyHours * 5);

// Adicional noturno do mês: a hora noturna reduzida rende mais minutos pagos, com 20% de acréscimo.
export function nightAdditionMonthly(rate: number, nightMinutesPerWeek: number): number {
  const reducedHours = nightMinutesPerWeek / PAY.nightHourMinutes;
  const normalHours = nightMinutesPerWeek / 60;
  return rate * ((1 + PAY.nightAdditional) * reducedHours - normalHours) * PAY.weeksPerMonth;
}
