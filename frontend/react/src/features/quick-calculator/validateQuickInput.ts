export type QuickFormValues = {
  storeCount: number | null;
  employees: number | null;
  pctSixByOne: number | null;
  averageSalary: number | null;
  annualRevenue: number | null;
};

export type QuickFormField = keyof QuickFormValues;
export type QuickFormErrors = Partial<Record<QuickFormField, string>>;

const REQUIRED = 'Informe um valor.';

const positive = (value: number | null): string | undefined => {
  if (value === null) return REQUIRED;
  if (value <= 0) return 'Use um valor maior que zero.';
  return undefined;
};

const positiveInteger = (value: number | null): string | undefined => {
  const base = positive(value);
  if (base) return base;
  if (!Number.isInteger(value)) return 'Use um número inteiro.';
  return undefined;
};

export function validateQuickInput(values: QuickFormValues): QuickFormErrors {
  const errors: QuickFormErrors = {};

  const storeCount = positiveInteger(values.storeCount);
  if (storeCount) errors.storeCount = storeCount;

  const employees = positiveInteger(values.employees);
  if (employees) errors.employees = employees;

  if (values.pctSixByOne === null) errors.pctSixByOne = REQUIRED;
  else if (values.pctSixByOne < 0 || values.pctSixByOne > 100)
    errors.pctSixByOne = 'Use um valor entre 0 e 100.';

  const salary = positive(values.averageSalary);
  if (salary) errors.averageSalary = salary;

  const revenue = positive(values.annualRevenue);
  if (revenue) errors.annualRevenue = revenue;

  return errors;
}
