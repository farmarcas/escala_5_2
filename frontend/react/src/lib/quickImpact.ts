import type { Maturity, OperatingDays, Premises, StoreProfile, TaxRegime } from './premisesTypes';

export type QuickInput = {
  storeCount: number;
  employees: number;
  pctSixByOne: number;
  averageSalary: number;
  annualRevenue: number;
  profile: StoreProfile;
  operatingDays: OperatingDays;
  regime: TaxRegime;
  maturity: Maturity;
  markedActions: number;
};

export type QuickResult = {
  affected: number;
  peopleToReplace: number;
  costPerPerson: number;
  coverageMin: number;
  coverageMax: number;
  grossMin: number;
  grossMax: number;
  netMin: number;
  netMax: number;
  taxBenefitApplies: boolean;
  pctRevenueMin: number;
  pctRevenueMax: number;
  operatingResult: number;
  pctOperatingMin: number | null;
  pctOperatingMax: number | null;
  peopleMin: number;
  peopleMax: number;
  avgPerStoreMin: number | null;
  avgPerStoreMax: number | null;
  presumidoOverLimit: boolean;
  hasImpact: boolean;
  mitigation: { floor: number; cap: number; current: number };
  residualMin: number;
  residualMax: number;
  savings: number;
};

// 0 ações = sem redução. Com 1 ação a redução é o piso; com todas, o teto da maturidade.
export const mitigationFraction = (
  marked: number,
  totalActions: number,
  floor: number,
  cap: number,
): number => {
  if (marked <= 0 || totalActions <= 0) return 0;
  const top = Math.max(cap, floor);
  if (totalActions === 1) return floor;
  const progress = (Math.min(marked, totalActions) - 1) / (totalActions - 1);
  return floor + (top - floor) * progress;
};

export function calculateQuickImpact(input: QuickInput, premises: Premises): QuickResult {
  const { taxation, quick } = premises;
  const profile = quick.profiles[input.profile];
  const days = quick.daysMultiplier[input.operatingDays];

  const charges =
    input.regime === 'simples' ? taxation.chargesSimples : taxation.chargesRealPresumido;
  const taxBenefitApplies = input.regime === 'real';
  const taxFactor = taxBenefitApplies ? 1 - taxation.irpjCsllRate : 1;

  const affected = Math.round(input.employees * input.pctSixByOne);
  const peopleToReplace = affected * quick.hoursGap;
  const costPerPerson = input.averageSalary * taxation.monthsPerYear * charges;

  const coverageMin = Math.min(1, profile.coverageMin * days.min);
  const coverageMax = Math.min(1, profile.coverageMax * days.max);

  const grossMin = peopleToReplace * costPerPerson * coverageMin;
  const grossMax = peopleToReplace * costPerPerson * coverageMax;

  const operatingResult = input.annualRevenue * profile.operatingMargin;
  const ratio = (value: number, base: number) => (base > 0 ? value / base : null);

  const totalActions = quick.mitigation.actions.length;
  const cap = quick.mitigation.capByMaturity[input.maturity];
  const floor = quick.mitigation.floor;
  const current = mitigationFraction(input.markedActions, totalActions, floor, cap);

  return {
    affected,
    peopleToReplace,
    costPerPerson,
    coverageMin,
    coverageMax,
    grossMin,
    grossMax,
    netMin: grossMin * taxFactor,
    netMax: grossMax * taxFactor,
    taxBenefitApplies,
    pctRevenueMin: input.annualRevenue > 0 ? grossMin / input.annualRevenue : 0,
    pctRevenueMax: input.annualRevenue > 0 ? grossMax / input.annualRevenue : 0,
    operatingResult,
    pctOperatingMin: ratio(grossMin, operatingResult),
    pctOperatingMax: ratio(grossMax, operatingResult),
    peopleMin: Math.round(peopleToReplace * coverageMin),
    peopleMax: Math.round(peopleToReplace * coverageMax),
    avgPerStoreMin: input.storeCount > 0 ? grossMin / input.storeCount : null,
    avgPerStoreMax: input.storeCount > 0 ? grossMax / input.storeCount : null,
    presumidoOverLimit:
      input.regime === 'presumido' && input.annualRevenue > taxation.presumidoRevenueLimit,
    hasImpact: grossMax > 0,
    mitigation: { floor, cap: Math.max(cap, floor), current },
    residualMin: grossMin * (1 - current),
    residualMax: grossMax * (1 - current),
    savings: ((grossMin + grossMax) / 2) * current,
  };
}
