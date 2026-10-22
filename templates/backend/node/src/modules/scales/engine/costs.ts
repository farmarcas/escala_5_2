import { CHARGES, PAY } from './rules.js';

// Custo mensal por colaborador. Fórmulas conferidas com exemplos da referência (specs/004-painel-de-escalas/
// calibration-observations.md, seção 1). Valores em reais; arredondamos só na apresentação.

export type TaxRegime = 'simples' | 'lucro_presumido_real';

export type CostSettings = {
  taxRegime: TaxRegime;
  provisions: boolean;
  rat: number;
  thirdParty: number;
  transport: { tripsPerDay: number; fare: number };
  // Vale-alimentação e outros benefícios fixos por colaborador.
  benefits: number;
};

export const DEFAULT_COST_SETTINGS: CostSettings = {
  taxRegime: 'simples',
  provisions: true,
  rat: CHARGES.defaultRat,
  thirdParty: CHARGES.defaultThirdParty,
  transport: { tripsPerDay: 2, fare: 4.5 },
  benefits: 0,
};

export type PersonCostInput = {
  salary: number;
  // Adicionais mensais além do periculoso (noturno, horas extras etc.), somados ao salário nos encargos.
  extras?: number;
  motorcycle?: boolean;
  daysPerWeek: number;
};

export type PersonCost = {
  salary: number;
  hazard: number;
  extras: number;
  // 13º e férias + 1/3 provisionados.
  provisionsAmount: number;
  fgts: number;
  fgtsFine: number;
  inss: number;
  transportEmployer: number;
  benefits: number;
  direct: number;
  indirect: number;
  total: number;
};

export function personCost(input: PersonCostInput, settings: CostSettings): PersonCost {
  const hazard = input.motorcycle ? input.salary * PAY.hazardPay : 0;
  const extras = input.extras ?? 0;
  const base = input.salary + hazard + extras;
  const provisionsAmount = settings.provisions ? base * (CHARGES.thirteenth + CHARGES.vacation) : 0;
  const chargeBase = base + provisionsAmount;
  const fgts = chargeBase * CHARGES.fgts;
  const fgtsFine = settings.provisions ? fgts * CHARGES.fgtsFine : 0;
  const inssRate =
    settings.taxRegime === 'simples'
      ? 0
      : CHARGES.inssEmployer + settings.rat + settings.thirdParty;
  const inss = chargeBase * inssRate;
  const daysPerMonth = input.daysPerWeek * PAY.weeksPerMonth;
  const transportEmployer = Math.max(
    0,
    daysPerMonth * settings.transport.tripsPerDay * settings.transport.fare -
      CHARGES.transportEmployeeShare * input.salary,
  );
  const benefits = settings.benefits + transportEmployer;
  const direct = base;
  const indirect = provisionsAmount + fgts + fgtsFine + inss + benefits;
  return {
    salary: input.salary,
    hazard,
    extras,
    provisionsAmount,
    fgts,
    fgtsFine,
    inss,
    transportEmployer,
    benefits,
    direct,
    indirect,
    total: direct + indirect,
  };
}

export type PayrollLine = PersonCostInput & { people: number };

export type Payroll = {
  direct: number;
  indirect: number;
  total: number;
  people: number;
};

export function payroll(lines: readonly PayrollLine[], settings: CostSettings): Payroll {
  let direct = 0;
  let indirect = 0;
  let people = 0;
  for (const line of lines) {
    if (line.people <= 0) continue;
    const c = personCost(line, settings);
    direct += c.direct * line.people;
    indirect += c.indirect * line.people;
    people += line.people;
  }
  return { direct, indirect, total: direct + indirect, people };
}

export type PayrollComparison = {
  today: Payroll;
  next: Payroll;
  monthlyDifference: number;
  yearlyDifference: number;
  percent: number;
};

// Folha hoje (equipe e dias da escala atual) contra a nova escala (equipe necessária e dias da nova).
export function comparePayroll(today: Payroll, next: Payroll): PayrollComparison {
  const monthlyDifference = next.total - today.total;
  return {
    today,
    next,
    monthlyDifference,
    yearlyDifference: monthlyDifference * 12,
    percent: today.total > 0 ? (monthlyDifference / today.total) * 100 : 0,
  };
}
