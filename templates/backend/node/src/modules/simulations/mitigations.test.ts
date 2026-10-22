import { describe, expect, it } from 'vitest';
import {
  ABOVE_USUAL_THRESHOLD,
  actionsForRole,
  combinedReduction,
  PHARMACIST_ACTIONS,
} from './mitigations.js';

describe('combinedReduction', () => {
  it('deve combinar efeitos de forma multiplicativa', () => {
    // 1 − (0,9 × 0,85) = 0,235
    expect(combinedReduction([0.1, 0.15])).toBeCloseTo(0.235, 9);
  });

  it('deve ser zero sem ações', () => {
    expect(combinedReduction([])).toBe(0);
  });

  it('nunca deve passar de 100%', () => {
    expect(combinedReduction([1, 0.5])).toBe(1);
  });

  it('deve ignorar efeitos inválidos (negativos, acima de 1 ou não numéricos)', () => {
    expect(combinedReduction([-0.2, 2, Number.NaN, 0.1])).toBeCloseTo(0.1, 9);
  });
});

describe('actionsForRole', () => {
  const actions = { 'banco-horas': 0.15, multifuncionalidade: 0.1, 'negociacao-coletiva': 0.05 };

  it('deve aplicar todas as ações às funções comuns', () => {
    expect(actionsForRole('balconista', actions).sort()).toEqual([0.05, 0.1, 0.15]);
  });

  it('deve limitar o farmacêutico às ações permitidas', () => {
    expect(PHARMACIST_ACTIONS).toEqual(['negociacao-coletiva']);
    expect(actionsForRole('farmaceutico', actions)).toEqual([0.05]);
  });

  it('deve ignorar ações desconhecidas', () => {
    expect(actionsForRole('caixa', { 'acao-inventada': 0.5, 'banco-horas': 0.1 })).toEqual([0.1]);
  });
});

describe('ABOVE_USUAL_THRESHOLD', () => {
  it('deve ser 50%', () => {
    expect(ABOVE_USUAL_THRESHOLD).toBe(0.5);
  });
});
