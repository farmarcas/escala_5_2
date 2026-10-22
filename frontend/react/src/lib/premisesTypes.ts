// Espelho do contrato de GET /api/v1/premises/defaults (specs/001-calculadora-impacto-escala/contracts/api.md).
export type StoreProfile = 'rua' | 'shopping' | '24h';
export type Maturity = 'nao_comecamos' | 'avaliacao' | 'plano_em_curso';
export type TaxRegime = 'real' | 'presumido' | 'simples';
export type OperatingDays = '7' | '6' | '5';

export type MitigationAction = { id: string; title: string; description: string };

export type Premises = {
  version: string;
  reviewedAt: string;
  provisional: boolean;
  taxation: {
    monthsPerYear: number;
    chargesRealPresumido: number;
    chargesSimples: number;
    irpjCsllRate: number;
    presumidoRevenueLimit: number;
  };
  quick: {
    hoursGap: number;
    defaultPctSixByOne: number;
    profiles: Record<
      StoreProfile,
      { label: string; operatingMargin: number; coverageMin: number; coverageMax: number }
    >;
    daysMultiplier: Record<OperatingDays, { min: number; max: number }>;
    mitigation: {
      floor: number;
      capByMaturity: Record<Maturity, number>;
      actions: MitigationAction[];
    };
  };
  detailed: {
    targetWeeklyHours: number;
    absenceRate: number;
    actions: (MitigationAction & { defaultEffect: number })[];
  };
};
