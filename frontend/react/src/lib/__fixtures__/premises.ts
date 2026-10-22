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
  quick: {
    hoursGap: 0.1,
    defaultPctSixByOne: 0.85,
    profiles: {
      rua: { label: 'Loja de rua', operatingMargin: 0.05, coverageMin: 0.6, coverageMax: 0.95 },
      shopping: {
        label: 'Loja de shopping',
        operatingMargin: 0.05,
        coverageMin: 0.6,
        coverageMax: 0.95,
      },
      '24h': { label: 'Loja 24 horas', operatingMargin: 0.05, coverageMin: 0.75, coverageMax: 1 },
    },
    daysMultiplier: {
      '7': { min: 1, max: 1 },
      '6': { min: 0.9, max: 0.92 },
      '5': { min: 0.7, max: 0.78 },
    },
    mitigation: {
      floor: 0.3,
      capByMaturity: { nao_comecamos: 0.4, avaliacao: 0.45, plano_em_curso: 0.5 },
      actions: [
        { id: 'a1', title: 'Ação 1', description: '' },
        { id: 'a2', title: 'Ação 2', description: '' },
        { id: 'a3', title: 'Ação 3', description: '' },
        { id: 'a4', title: 'Ação 4', description: '' },
        { id: 'a5', title: 'Ação 5', description: '' },
        { id: 'a6', title: 'Ação 6', description: '' },
      ],
    },
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
