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

// Adicionais mensais por pessoa, calculados a partir da escala (noturno, plantão, feriado, intervalo).
export type Additions = {
  night?: number;
  overtime?: number;
  holidayDouble?: number;
  indemnifiedBreak?: number;
};

export type PersonCostInput = {
  salary: number;
  additions?: Additions;
  motorcycle?: boolean;
  daysPerWeek: number;
};

export type PersonCost = {
  salary: number;
  hazard: number;
  night: number;
  overtime: number;
  // Reflexo no descanso semanal remunerado sobre noturno e horas extras (1/6).
  dsr: number;
  holidayDouble: number;
  indemnifiedBreak: number;
  // Soma de todos os adicionais além da periculosidade.
  extras: number;
  thirteenth: number;
  vacation: number;
  provisionsAmount: number;
  fgts: number;
  fgtsFine: number;
  inss: number;
  transportEmployer: number;
  otherBenefits: number;
  benefits: number;
  direct: number;
  indirect: number;
  total: number;
};

export function personCost(input: PersonCostInput, settings: CostSettings): PersonCost {
  const hazard = input.motorcycle ? input.salary * PAY.hazardPay : 0;
  const night = input.additions?.night ?? 0;
  const overtime = input.additions?.overtime ?? 0;
  const holidayDouble = input.additions?.holidayDouble ?? 0;
  const indemnifiedBreak = input.additions?.indemnifiedBreak ?? 0;
  const dsr = (night + overtime) / 6;
  const extras = night + overtime + dsr + holidayDouble + indemnifiedBreak;
  const base = input.salary + hazard + extras;
  const thirteenth = settings.provisions ? base * CHARGES.thirteenth : 0;
  const vacation = settings.provisions ? base * CHARGES.vacation : 0;
  const provisionsAmount = thirteenth + vacation;
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
    night,
    overtime,
    dsr,
    holidayDouble,
    indemnifiedBreak,
    extras,
    thirteenth,
    vacation,
    provisionsAmount,
    fgts,
    fgtsFine,
    inss,
    transportEmployer,
    otherBenefits: settings.benefits,
    benefits,
    direct,
    indirect,
    total: direct + indirect,
  };
}

export type PayrollLine = PersonCostInput & { people: number };

export type Components = {
  salary: number;
  hazard: number;
  holidayDouble: number;
  night: number;
  overtime: number;
  dsr: number;
  indemnifiedBreak: number;
  thirteenth: number;
  vacation: number;
  fgts: number;
  fgtsFine: number;
  inss: number;
  transport: number;
  otherBenefits: number;
};

export type Payroll = {
  direct: number;
  indirect: number;
  total: number;
  people: number;
  components: Components;
};

const emptyComponents = (): Components => ({
  salary: 0,
  hazard: 0,
  holidayDouble: 0,
  night: 0,
  overtime: 0,
  dsr: 0,
  indemnifiedBreak: 0,
  thirteenth: 0,
  vacation: 0,
  fgts: 0,
  fgtsFine: 0,
  inss: 0,
  transport: 0,
  otherBenefits: 0,
});

export function payroll(lines: readonly PayrollLine[], settings: CostSettings): Payroll {
  let direct = 0;
  let indirect = 0;
  let people = 0;
  const c = emptyComponents();
  for (const line of lines) {
    if (line.people <= 0) continue;
    const p = personCost(line, settings);
    const n = line.people;
    direct += p.direct * n;
    indirect += p.indirect * n;
    people += n;
    c.salary += p.salary * n;
    c.hazard += p.hazard * n;
    c.holidayDouble += p.holidayDouble * n;
    c.night += p.night * n;
    c.overtime += p.overtime * n;
    c.dsr += p.dsr * n;
    c.indemnifiedBreak += p.indemnifiedBreak * n;
    c.thirteenth += p.thirteenth * n;
    c.vacation += p.vacation * n;
    c.fgts += p.fgts * n;
    c.fgtsFine += p.fgtsFine * n;
    c.inss += p.inss * n;
    c.transport += p.transportEmployer * n;
    c.otherBenefits += p.otherBenefits * n;
  }
  return { direct, indirect, total: direct + indirect, people, components: c };
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
