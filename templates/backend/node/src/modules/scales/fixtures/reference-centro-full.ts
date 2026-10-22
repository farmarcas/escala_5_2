import { defaultStore } from '../scales.defaults.js';
import type { ScaleStoreInput } from '../scales.schemas.js';

// "Drogaria Exemplo — Centro" completo, lido do painel de referência (configuração da loja de exemplo e os
// resultados que ele mostra em 22–23/10/2026, regime Simples e plantão mensal coberto pela equipe).
export function centroFullStore(): ScaleStoreInput {
  const s = defaultStore('2026-12-14');
  const mon6 = 0b0111111;
  return {
    ...s,
    name: 'Drogaria Exemplo — Centro',
    city: 'Varginha',
    state: 'MG',
    plantao: {
      ...s.plantao,
      type: 'monthly',
      cycleWeek: 2,
      people: { farmaceutico: 1, balconista: 1, caixa: 0 },
    },
    roles: s.roles.map((r) => {
      if (r.role === 'gerente' || r.role === 'subgerente')
        return { ...r, coverage: { mode: 'all' as const }, daysMask: mon6 };
      if (r.role === 'perfumista' || r.role === 'servicos_gerais' || r.role === 'entregador')
        return { ...r, daysMask: mon6 };
      return r;
    }),
  };
}

// Resultado da referência por função: [necessário 6x1, necessário 5x2 · 42h, custo hoje, custo 5x2 · 42h] no Simples.
export const REFERENCE_SIMPLES = {
  farmaceutico: { need: [5, 5], cost: [15559, 37733] },
  gerencia: { need: [4, 3], cost: [9665, 13844] },
  balconista: { need: [9, 8], cost: [15775, 24690] },
  caixa: { need: [4, 4], cost: [5860, 11566] },
  perfumista: { need: [3, 3], cost: [3057, 9055] },
  servicos_gerais: { need: [3, 3], cost: [2740, 8104] },
  entregador: { need: [3, 3], cost: [3584, 10636] },
} as const;

export const REFERENCE_TOTALS_SIMPLES = { today: 56241, next42: 115628, hire42: 15 };

// Totais da referência no Lucro Presumido/Real (PDF "Painel de Escalas Rede Inova"): folha de hoje e da 5x2 · 42h.
export const REFERENCE_TOTALS_PRESUMIDO = { today: 68701, next42: 141455 };

// Mesma loja sem plantão (feriados ligados), lida do painel de referência: [necessário 6x1, 5x2 · 42h, folha hoje, folha 5x2 · 42h].
export const REFERENCE_SEM_PLANTAO = {
  farmaceutico: [4, 4, 14514, 29027],
  gerencia: [4, 3, 9665, 13844],
  balconista: [8, 7, 15285, 21128],
  caixa: [4, 4, 5860, 11566],
  perfumista: [3, 3, 3057, 9055],
  servicos_gerais: [3, 3, 2740, 8104],
  entregador: [3, 3, 3584, 10636],
} as const;

export const REFERENCE_SEM_PLANTAO_TOTALS = { today: 54705, next42: 103360, hire42: 13 };
