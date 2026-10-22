import type { RoleKind } from '@/features/stores/types';

export type RegimeKind = 'real' | 'presumido' | 'simples';

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

export type StoreMitigationPayload = {
  hoursReductionPerWeek?: number;
  actions?: Record<string, number>;
};

export type MitigationsPayload = Record<string, StoreMitigationPayload>;

export type PremiseOverrides = {
  taxation?: {
    monthsPerYear?: number;
    chargesRealPresumido?: number;
    chargesSimples?: number;
    irpjCsllRate?: number;
  };
  detailed?: { absenceRate?: number };
};

export type PreviewRequest = {
  taxRegime: RegimeKind;
  premiseOverrides?: PremiseOverrides;
  mitigations?: MitigationsPayload;
};

export type CalcPremisesSnapshot = {
  taxation: {
    monthsPerYear: number;
    chargesRealPresumido: number;
    chargesSimples: number;
    irpjCsllRate: number;
  };
  detailed: { targetWeeklyHours: number; absenceRate: number };
};

export type SavedSimulation = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  taxRegime: RegimeKind;
  premises: CalcPremisesSnapshot;
  premisesVersion: string;
  stores: { id: string; name: string; city: string }[];
  mitigations: MitigationsPayload;
  result: DetailedResult;
};

export type SimulationSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  taxRegime: RegimeKind;
  storeCount: number;
  totals: DetailedResult['totals'];
  warnings: string[];
};

export type PreviewResponse = {
  result: DetailedResult;
  taxRegime: RegimeKind;
  premises: CalcPremisesSnapshot;
};
