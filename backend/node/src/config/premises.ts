// Premissas padrão da calculadora. É o ÚNICO lugar para ajustar os números: mudou aqui,
// a tela e a API passam a usar o novo valor (reinicie a API). Atualize `version` e `reviewedAt`.
// ATENÇÃO: valores PROVISÓRIOS, a validar com finanças/RH da Farmarcas antes do lançamento.

export type StoreProfile = 'rua' | 'shopping' | '24h';
export type Maturity = 'nao_comecamos' | 'avaliacao' | 'plano_em_curso';

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
    daysMultiplier: Record<'7' | '6' | '5', { min: number; max: number }>;
    mitigation: {
      floor: number;
      capByMaturity: Record<Maturity, number>;
      actions: { id: string; title: string; description: string }[];
    };
  };
  detailed: {
    targetWeeklyHours: number;
    absenceRate: number;
    // Ações de mitigação do modo detalhado: `defaultEffect` é a sugestão de redução do déficit novo.
    actions: { id: string; title: string; description: string; defaultEffect: number }[];
  };
};

export const premises: Premises = {
  version: '2026-10-22-provisoria',
  reviewedAt: '2026-10-22',
  provisional: true,
  taxation: {
    monthsPerYear: 13.33,
    chargesRealPresumido: 1.55,
    chargesSimples: 1.25,
    irpjCsllRate: 0.34,
    presumidoRevenueLimit: 78_000_000,
  },
  quick: {
    hoursGap: 44 / 40 - 1,
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
        {
          id: 'ajuste-quadro',
          title: 'Ajuste de quadro',
          description: 'Rever funções e turnos para eliminar sobreposição de equipe.',
        },
        {
          id: 'escalas-demanda',
          title: 'Escalas por demanda',
          description: 'Dimensionar a equipe pelo movimento da loja ao longo do dia e da semana.',
        },
        {
          id: 'banco-horas',
          title: 'Banco de horas',
          description: 'Compensar horas entre dias e semanas de maior e menor movimento.',
        },
        {
          id: 'multifuncionalidade',
          title: 'Multifuncionalidade',
          description: 'Treinar a equipe para cobrir mais de uma função (exceto farmacêutico).',
        },
        {
          id: 'automacao',
          title: 'Automação',
          description: 'Autoatendimento, reposição assistida e rotinas digitais no balcão.',
        },
        {
          id: 'negociacao-coletiva',
          title: 'Negociação coletiva',
          description: 'Acordo com o sindicato para transição gradual e regras da farmácia.',
        },
      ],
    },
  },
  detailed: {
    targetWeeklyHours: 40,
    absenceRate: 0.13,
    actions: [
      {
        id: 'ajuste-quadro',
        title: 'Ajuste de quadro',
        description: 'Rever funções e turnos para eliminar sobreposição de equipe.',
        defaultEffect: 0.1,
      },
      {
        id: 'escalas-demanda',
        title: 'Escalas por demanda',
        description: 'Dimensionar a equipe pelo movimento da loja ao longo do dia e da semana.',
        defaultEffect: 0.15,
      },
      {
        id: 'banco-horas',
        title: 'Banco de horas',
        description: 'Compensar horas entre dias e semanas de maior e menor movimento.',
        defaultEffect: 0.15,
      },
      {
        id: 'multifuncionalidade',
        title: 'Multifuncionalidade',
        description: 'Treinar a equipe para cobrir mais de uma função (exceto farmacêutico).',
        defaultEffect: 0.1,
      },
      {
        id: 'automacao',
        title: 'Automação',
        description: 'Autoatendimento, reposição assistida e rotinas digitais no balcão.',
        defaultEffect: 0.1,
      },
      {
        id: 'negociacao-coletiva',
        title: 'Negociação coletiva',
        description: 'Acordo com o sindicato para transição gradual e regras da farmácia.',
        defaultEffect: 0.05,
      },
    ],
  },
};
