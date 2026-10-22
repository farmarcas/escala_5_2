import { useMemo, useState } from 'react';
import type {
  Maturity,
  OperatingDays,
  Premises,
  StoreProfile,
  TaxRegime,
} from '@/lib/premisesTypes';
import { calculateQuickImpact, type QuickInput } from '@/lib/quickImpact';
import {
  validateQuickInput,
  type QuickFormErrors,
  type QuickFormField,
  type QuickFormValues,
} from '../validateQuickInput';

const INITIAL_VALUES: QuickFormValues = {
  storeCount: 10,
  employees: 200,
  pctSixByOne: 85,
  averageSalary: 2100,
  annualRevenue: 60_000_000,
};

export function useQuickCalculator(defaults: Premises) {
  const [values, setValues] = useState<QuickFormValues>({
    ...INITIAL_VALUES,
    pctSixByOne: Math.round(defaults.quick.defaultPctSixByOne * 100),
  });
  const [touched, setTouched] = useState<Set<QuickFormField>>(new Set());
  const [profile, setProfile] = useState<StoreProfile>('rua');
  const [operatingDays, setOperatingDays] = useState<OperatingDays>('7');
  const [regime, setRegime] = useState<TaxRegime>('real');
  const [maturity, setMaturity] = useState<Maturity>('nao_comecamos');
  const [markedActionIds, setMarkedActionIds] = useState<Set<string>>(new Set());
  const [premises, setPremises] = useState<Premises>(defaults);

  const allErrors = validateQuickInput(values);
  const visibleErrors: QuickFormErrors = {};
  for (const field of touched) {
    const message = allErrors[field];
    if (message) visibleErrors[field] = message;
  }

  const isValid = Object.keys(allErrors).length === 0;

  const input = useMemo<QuickInput | null>(() => {
    if (!isValid) return null;
    return {
      storeCount: values.storeCount ?? 0,
      employees: values.employees ?? 0,
      pctSixByOne: (values.pctSixByOne ?? 0) / 100,
      averageSalary: values.averageSalary ?? 0,
      annualRevenue: values.annualRevenue ?? 0,
      profile,
      operatingDays,
      regime,
      maturity,
      markedActions: markedActionIds.size,
    };
  }, [isValid, values, profile, operatingDays, regime, maturity, markedActionIds]);

  const result = useMemo(
    () => (input ? calculateQuickImpact(input, premises) : null),
    [input, premises],
  );

  const setField = (field: QuickFormField, value: number | null) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => new Set(current).add(field));
  };

  const toggleAction = (id: string) => {
    setMarkedActionIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    values,
    errors: visibleErrors,
    profile,
    operatingDays,
    regime,
    maturity,
    markedActionIds,
    premises,
    input,
    result,
    arePremisesChanged: JSON.stringify(premises) !== JSON.stringify(defaults),
    setField,
    setProfile,
    setOperatingDays,
    setRegime,
    setMaturity,
    toggleAction,
    setPremises,
    resetPremises: () => setPremises(defaults),
  };
}
