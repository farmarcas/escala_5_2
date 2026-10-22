import { describe, expect, it } from 'vitest';
import { validateQuickInput, type QuickFormValues } from './validateQuickInput';

const valid: QuickFormValues = {
  storeCount: 20,
  employees: 400,
  pctSixByOne: 85,
  averageSalary: 2100,
  annualRevenue: 120_000_000,
};

describe('validateQuickInput', () => {
  it('não deve apontar erro para valores válidos', () => {
    expect(validateQuickInput(valid)).toEqual({});
  });

  it('deve pedir campos vazios', () => {
    const errors = validateQuickInput({ ...valid, employees: null, averageSalary: null });

    expect(errors.employees).toBe('Informe um valor.');
    expect(errors.averageSalary).toBe('Informe um valor.');
  });

  it('deve recusar zero e negativos onde não faz sentido', () => {
    const errors = validateQuickInput({
      ...valid,
      storeCount: 0,
      employees: -3,
      averageSalary: 0,
      annualRevenue: 0,
    });

    expect(errors.storeCount).toBeDefined();
    expect(errors.employees).toBeDefined();
    expect(errors.averageSalary).toBeDefined();
    expect(errors.annualRevenue).toBeDefined();
  });

  it('deve recusar quantidade de pessoas fracionada', () => {
    expect(validateQuickInput({ ...valid, employees: 10.5 }).employees).toBe(
      'Use um número inteiro.',
    );
  });

  it('deve recusar percentual fora de 0 a 100', () => {
    expect(validateQuickInput({ ...valid, pctSixByOne: 101 }).pctSixByOne).toBe(
      'Use um valor entre 0 e 100.',
    );
    expect(validateQuickInput({ ...valid, pctSixByOne: -1 }).pctSixByOne).toBeDefined();
  });

  it('deve aceitar 0% em 6x1', () => {
    expect(validateQuickInput({ ...valid, pctSixByOne: 0 })).toEqual({});
  });
});
