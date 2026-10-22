import type { Premises } from '../premisesTypes';

// Cópia fixa das premissas para os testes não mudarem quando a Farmarcas ajustar os valores reais.
export const testPremises: Premises = {
  version: 'teste',
  reviewedAt: '2026-01-01',
  provisional: true,
  taxation: {
    monthsPerYear: 13.33,
    chargesRealPresumido: 1.55,
    chargesSimples: 1.25,
    irpjCsllRate: 0.34,
    presumidoRevenueLimit: 78_000_000,
  },
  detailed: {
    targetWeeklyHours: 40,
    absenceRate: 0.13,
    actions: [
      { id: 'banco-horas', title: 'Banco de horas', description: '', defaultEffect: 0.15 },
      {
        id: 'negociacao-coletiva',
        title: 'Negociação coletiva',
        description: '',
        defaultEffect: 0.05,
      },
    ],
  },
};
