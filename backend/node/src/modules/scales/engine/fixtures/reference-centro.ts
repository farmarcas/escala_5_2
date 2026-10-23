import type { CoverageRole, StoreHoursInput } from '../coverage.js';

// Caso de conferência da spec 004 ("Drogaria Exemplo — Centro", Varginha/MG): números lidos do painel de
// referência como instrumento de medição. Servem de teste dourado, não de regra.
export const centroHours: StoreHoursInput = {
  standard: { start: '07:00', end: '22:00', daysMask: 0b0111111 },
  overrides: { 6: { start: '08:00', end: '14:00' } },
};

type Row = {
  role: CoverageRole & { extraPostsPerWeek?: number };
  today: number;
  // Referência: [necessário 6x1, necessário 5x2 · 42h].
  reference: { '6x1_44': number; '5x2_42': number };
  // Diferença aceita (nosso − referência) por cenário, com a causa quando passa de 0.
  accepted?: { '6x1_44'?: number; '5x2_42'?: number; cause?: string };
};

const full = (extra: Partial<CoverageRole> = {}): CoverageRole => ({
  minInHall: 1,
  coverage: { mode: 'all' },
  daysMask: 0b1111111,
  ...extra,
});

// Plantão mensal (1 semana a cada 4, 7 noites, 1 pessoa por função): em média 7 / 4 postos por semana.
const plantao = { extraPostsPerWeek: 7 / 4 };

export const centroRows: Record<string, Row> = {
  farmaceutico: {
    role: { ...full(), ...plantao },
    today: 2,
    reference: { '6x1_44': 5, '5x2_42': 5 },
  },
  // Gerente e subgerente aparecem somados na referência.
  gerenteSubgerente: { role: full(), today: 2, reference: { '6x1_44': 4, '5x2_42': 3 } },
  balconista: {
    role: { ...full({ minInHall: 2 }), ...plantao },
    today: 5,
    reference: { '6x1_44': 9, '5x2_42': 8 },
    // Diferença explicada: com mínimo 2 no salão, a referência soma uma folga de cobertura extra na 6x1 que não
    // decorre de nenhuma regra legal; o nosso cálculo só conta postos e dias de trabalho por pessoa. A 6x1 aqui
    // é só o "quadro de hoje" para comparação, não muda o custo da nova escala.
    accepted: { '6x1_44': -2, cause: 'reserva de cobertura da referência na 6x1 com mínimo 2' },
  },
  caixa: { role: full(), today: 2, reference: { '6x1_44': 4, '5x2_42': 4 } },
  perfumista: {
    role: full({ coverage: { mode: 'band', start: '09:00', end: '19:00' }, daysMask: 0b1111111 }),
    today: 1,
    reference: { '6x1_44': 3, '5x2_42': 3 },
  },
  servicosGerais: {
    role: full({ coverage: { mode: 'band', start: '07:00', end: '17:00' } }),
    today: 1,
    reference: { '6x1_44': 3, '5x2_42': 3 },
  },
  entregador: {
    role: full({ coverage: { mode: 'band', start: '08:00', end: '20:00' } }),
    today: 1,
    reference: { '6x1_44': 3, '5x2_42': 3 },
  },
};
