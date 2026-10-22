import type { Premises } from '@/lib/premisesTypes';
import type { CalcPremisesSnapshot, PremiseOverrides } from './types';

// Campos editáveis na simulação. Percentuais ficam em % (como a pessoa digita) e viram fração ao enviar.
export type SimulationSettings = {
  chargesRealPresumido: number | null;
  chargesSimples: number | null;
  monthsPerYear: number | null;
  irpjCsllRatePct: number | null;
  absenceRatePct: number | null;
};

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

export const settingsFromDefaults = (defaults: Premises): SimulationSettings => ({
  chargesRealPresumido: defaults.taxation.chargesRealPresumido,
  chargesSimples: defaults.taxation.chargesSimples,
  monthsPerYear: defaults.taxation.monthsPerYear,
  irpjCsllRatePct: round(defaults.taxation.irpjCsllRate * 100, 4),
  absenceRatePct: round(defaults.detailed.absenceRate * 100, 4),
});

// Campos editáveis a partir das premissas guardadas numa simulação salva.
export const settingsFromSnapshot = (premises: CalcPremisesSnapshot): SimulationSettings => ({
  chargesRealPresumido: premises.taxation.chargesRealPresumido,
  chargesSimples: premises.taxation.chargesSimples,
  monthsPerYear: premises.taxation.monthsPerYear,
  irpjCsllRatePct: round(premises.taxation.irpjCsllRate * 100, 4),
  absenceRatePct: round(premises.detailed.absenceRate * 100, 4),
});

// Limites aceitos pela API (contracts/api.md); valor fora deles é ignorado em vez de gerar erro a cada tecla.
const within = (value: number | null, min: number, max: number): value is number =>
  value !== null && value >= min && value <= max;

export function buildPremiseOverrides(
  settings: SimulationSettings,
  defaults: Premises,
): PremiseOverrides | undefined {
  const taxation: NonNullable<PremiseOverrides['taxation']> = {};
  const detailed: NonNullable<PremiseOverrides['detailed']> = {};

  const { taxation: base, detailed: baseDetailed } = defaults;
  const { chargesRealPresumido, chargesSimples, monthsPerYear } = settings;

  if (within(chargesRealPresumido, 1, 3) && chargesRealPresumido !== base.chargesRealPresumido)
    taxation.chargesRealPresumido = chargesRealPresumido;
  if (within(chargesSimples, 1, 3) && chargesSimples !== base.chargesSimples)
    taxation.chargesSimples = chargesSimples;
  if (within(monthsPerYear, 12, 14) && monthsPerYear !== base.monthsPerYear)
    taxation.monthsPerYear = monthsPerYear;
  if (within(settings.irpjCsllRatePct, 0, 60)) {
    const rate = round(settings.irpjCsllRatePct / 100, 6);
    if (rate !== base.irpjCsllRate) taxation.irpjCsllRate = rate;
  }
  if (within(settings.absenceRatePct, 0, 50)) {
    const rate = round(settings.absenceRatePct / 100, 6);
    if (rate !== baseDetailed.absenceRate) detailed.absenceRate = rate;
  }

  const overrides: PremiseOverrides = {};
  if (Object.keys(taxation).length > 0) overrides.taxation = taxation;
  if (Object.keys(detailed).length > 0) overrides.detailed = detailed;
  return Object.keys(overrides).length > 0 ? overrides : undefined;
}
