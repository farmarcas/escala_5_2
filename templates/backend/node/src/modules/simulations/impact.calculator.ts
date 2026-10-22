import type { Premises } from '../../config/premises.js';
import { ABOVE_USUAL_THRESHOLD, actionsForRole, combinedReduction } from './mitigations.js';

// Cálculo do modo detalhado (specs/001-calculadora-impacto-escala/research.md, seção 3).
// Função pura: sem banco, sem relógio, sem HTTP.

export type RoleKind = 'farmaceutico' | 'balconista' | 'caixa' | 'estoquista';
export type RegimeKind = 'real' | 'presumido' | 'simples';

export type CalcOpeningHour = { weekday: number; opensAt: string; closesAt: string };

export type CalcRole = {
  role: RoleKind;
  minPerShift: number;
  headcount: number;
  weeklyHours: number;
  monthlySalary: number;
  absenceRate: number | null;
};

export type CalcStore = {
  id: string;
  name: string;
  openingHours: CalcOpeningHour[];
  roles: CalcRole[];
};

export type StoreMitigation = {
  hoursReductionPerWeek?: number;
  actions?: Partial<Record<string, number>>;
};

// Chave = id da loja.
export type Mitigations = Record<string, StoreMitigation>;

export type CalcPremises = {
  taxation: Pick<
    Premises['taxation'],
    'monthsPerYear' | 'chargesRealPresumido' | 'chargesSimples' | 'irpjCsllRate'
  >;
  detailed: Pick<Premises['detailed'], 'targetWeeklyHours' | 'absenceRate'>;
};

export type RoleImpact = {
  role: RoleKind;
  hoursToCover: number;
  hoursAvailableAt40: number;
  baselineDeficit: number;
  newDeficit: number;
  peopleToHire: number;
  annualCost: number;
  mandatoryPresence: boolean;
  residualNewDeficit: number;
  residualPeopleToHire: number;
  residualAnnualCost: number;
};

export type StoreImpact = {
  storeId: string;
  name: string;
  weeklyOpenHours: number;
  grossAnnualImpact: number;
  peopleToHire: number;
  hasImpact: boolean;
  residualGrossAnnualImpact: number;
  residualPeopleToHire: number;
  savings: number;
  // Redução combinada das ações marcadas na loja (0 a 1); não inclui o ajuste de horário.
  mitigationReduction: number;
  roles: RoleImpact[];
};

export type DetailedResult = {
  totals: {
    grossAnnualImpact: number;
    netAnnualImpact: number;
    peopleToHire: number;
    storesWithImpact: number;
    residualAnnualImpact: number;
    residualPeopleToHire: number;
    savings: number;
  };
  stores: StoreImpact[];
  ranking: { storeId: string; name: string; grossAnnualImpact: number }[];
  warnings: string[];
};

const MINUTES_PER_DAY = 24 * 60;
// Tolerância para não criar uma pessoa a mais por causa de erro de ponto flutuante.
const EPSILON = 1e-9;

const toMinutes = (time: string): number => {
  const [hours = '0', minutes = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
};

// Fechar antes (ou na mesma hora) da abertura quer dizer que a loja passa da meia-noite.
export const openingMinutesPerWeek = (hours: CalcOpeningHour[]): number =>
  hours.reduce((total, day) => {
    const opens = toMinutes(day.opensAt);
    const closes = toMinutes(day.closesAt);
    return total + (closes > opens ? closes - opens : MINUTES_PER_DAY - opens + closes);
  }, 0);

const peopleFor = (deficit: number, hoursPerNewPerson: number): number =>
  deficit > EPSILON ? Math.ceil(deficit / hoursPerNewPerson - EPSILON) : 0;

const roleImpact = (
  role: CalcRole,
  weeklyOpenHours: number,
  chargesFactor: number,
  premises: CalcPremises,
  mitigation: StoreMitigation | undefined,
): RoleImpact => {
  const target = premises.detailed.targetWeeklyHours;
  const availability = 1 - (role.absenceRate ?? premises.detailed.absenceRate);

  // Quem já trabalha 40h ou menos não muda de jornada.
  const hoursNow = role.headcount * role.weeklyHours * availability;
  const hoursAt40 = role.headcount * Math.min(role.weeklyHours, target) * availability;
  const hoursPerNewPerson = target * availability;
  const costPerPerson = role.monthlySalary * premises.taxation.monthsPerYear * chargesFactor;

  // Só conta o que a mudança acrescenta ao que a loja já está devendo hoje.
  const newDeficitFor = (hoursToCover: number) =>
    Math.max(0, Math.max(0, hoursToCover - hoursAt40) - Math.max(0, hoursToCover - hoursNow));

  const hoursToCover = weeklyOpenHours * role.minPerShift;
  const baselineDeficit = Math.max(0, hoursToCover - hoursNow);
  const newDeficit = newDeficitFor(hoursToCover);
  const peopleToHire = peopleFor(newDeficit, hoursPerNewPerson);

  // Mitigação: primeiro o ajuste de horário (menos horas a cobrir), depois os percentuais, depois arredonda.
  const reducedHours = Math.min(
    Math.max(0, mitigation?.hoursReductionPerWeek ?? 0),
    weeklyOpenHours,
  );
  const residualCover = (weeklyOpenHours - reducedHours) * role.minPerShift;
  const effects = actionsForRole(role.role, mitigation?.actions ?? {});
  const residualNewDeficit = newDeficitFor(residualCover) * (1 - combinedReduction(effects));
  const residualPeopleToHire = peopleFor(residualNewDeficit, hoursPerNewPerson);

  return {
    role: role.role,
    hoursToCover,
    hoursAvailableAt40: hoursAt40,
    baselineDeficit,
    newDeficit,
    peopleToHire,
    annualCost: peopleToHire * costPerPerson,
    mandatoryPresence: role.role === 'farmaceutico',
    residualNewDeficit,
    residualPeopleToHire,
    residualAnnualCost: residualPeopleToHire * costPerPerson,
  };
};

export function calculateDetailedImpact(input: {
  stores: CalcStore[];
  regime: RegimeKind;
  premises: CalcPremises;
  mitigations?: Mitigations;
}): DetailedResult {
  const { stores, regime, premises, mitigations = {} } = input;
  const chargesFactor =
    regime === 'simples'
      ? premises.taxation.chargesSimples
      : premises.taxation.chargesRealPresumido;
  const taxFactor = regime === 'real' ? 1 - premises.taxation.irpjCsllRate : 1;

  const storeResults: StoreImpact[] = stores.map((store) => {
    const weeklyOpenHours = openingMinutesPerWeek(store.openingHours) / 60;
    const mitigation = mitigations[store.id];
    const roles = store.roles.map((role) =>
      roleImpact(role, weeklyOpenHours, chargesFactor, premises, mitigation),
    );
    const grossAnnualImpact = roles.reduce((sum, role) => sum + role.annualCost, 0);
    const peopleToHire = roles.reduce((sum, role) => sum + role.peopleToHire, 0);
    const residualGrossAnnualImpact = roles.reduce((sum, role) => sum + role.residualAnnualCost, 0);
    return {
      storeId: store.id,
      name: store.name,
      weeklyOpenHours,
      grossAnnualImpact,
      peopleToHire,
      hasImpact: peopleToHire > 0,
      residualGrossAnnualImpact,
      residualPeopleToHire: roles.reduce((sum, role) => sum + role.residualPeopleToHire, 0),
      savings: grossAnnualImpact - residualGrossAnnualImpact,
      mitigationReduction: combinedReduction(Object.values(mitigation?.actions ?? {}) as number[]),
      roles,
    };
  });

  const grossAnnualImpact = storeResults.reduce((sum, store) => sum + store.grossAnnualImpact, 0);

  return {
    totals: {
      grossAnnualImpact,
      netAnnualImpact: grossAnnualImpact * taxFactor,
      peopleToHire: storeResults.reduce((sum, store) => sum + store.peopleToHire, 0),
      storesWithImpact: storeResults.filter((store) => store.hasImpact).length,
      residualAnnualImpact: storeResults.reduce(
        (sum, store) => sum + store.residualGrossAnnualImpact,
        0,
      ),
      residualPeopleToHire: storeResults.reduce(
        (sum, store) => sum + store.residualPeopleToHire,
        0,
      ),
      savings: storeResults.reduce((sum, store) => sum + store.savings, 0),
    },
    stores: storeResults,
    ranking: [...storeResults]
      .sort((a, b) => b.grossAnnualImpact - a.grossAnnualImpact)
      .map(({ storeId, name, grossAnnualImpact: gross }) => ({
        storeId,
        name,
        grossAnnualImpact: gross,
      })),
    warnings: storeResults.some((store) => store.mitigationReduction > ABOVE_USUAL_THRESHOLD)
      ? ['MITIGATION_ABOVE_USUAL']
      : [],
  };
}
