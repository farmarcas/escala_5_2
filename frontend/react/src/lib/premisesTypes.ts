// Espelho do contrato de GET /api/v1/premises/defaults (specs/001-calculadora-impacto-escala/contracts/api.md).
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
  detailed: {
    targetWeeklyHours: number;
    absenceRate: number;
    actions: (MitigationAction & { defaultEffect: number })[];
  };
};
