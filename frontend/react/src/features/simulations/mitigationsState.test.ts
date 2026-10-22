import { describe, expect, it } from 'vitest';
import {
  applyToAllStores,
  eligibleActionIds,
  emptyStoreMitigation,
  fromPayload,
  toggleAction,
  toPayload,
  type ActionDefault,
  type MitigationsState,
} from './mitigationsState';

const defaults: ActionDefault[] = [
  { id: 'banco-horas', defaultEffect: 0.15 },
  { id: 'multifuncionalidade', defaultEffect: 0.1 },
  { id: 'negociacao-coletiva', defaultEffect: 0.05 },
];

describe('mitigationsState', () => {
  it('deve começar vazio: nenhuma ação ligada e nada enviado', () => {
    const state: MitigationsState = { loja: emptyStoreMitigation() };

    expect(toPayload(state)).toEqual({});
  });

  it('deve ligar uma ação já com o efeito sugerido (em %)', () => {
    const store = toggleAction(emptyStoreMitigation(), 'banco-horas', true, defaults);

    expect(store.actions['banco-horas']).toEqual({ isOn: true, effectPct: 15 });
  });

  it('deve manter o efeito digitado ao desligar e religar', () => {
    let store = toggleAction(emptyStoreMitigation(), 'banco-horas', true, defaults);
    store = {
      ...store,
      actions: { ...store.actions, 'banco-horas': { isOn: true, effectPct: 30 } },
    };
    store = toggleAction(store, 'banco-horas', false, defaults);
    store = toggleAction(store, 'banco-horas', true, defaults);

    expect(store.actions['banco-horas']).toEqual({ isOn: true, effectPct: 30 });
  });

  it('deve montar o pedido só com ações ligadas, convertendo % em fração', () => {
    const state: MitigationsState = {
      loja: {
        hoursReduction: 8,
        actions: {
          'banco-horas': { isOn: true, effectPct: 20 },
          multifuncionalidade: { isOn: false, effectPct: 10 },
        },
      },
      vazia: emptyStoreMitigation(),
    };

    expect(toPayload(state)).toEqual({
      loja: { hoursReductionPerWeek: 8, actions: { 'banco-horas': 0.2 } },
    });
  });

  it('deve ignorar efeito vazio ou fora de 0 a 100 e horas inválidas', () => {
    const state: MitigationsState = {
      loja: {
        hoursReduction: -3,
        actions: {
          'banco-horas': { isOn: true, effectPct: null },
          automacao: { isOn: true, effectPct: 150 },
        },
      },
    };

    expect(toPayload(state)).toEqual({});
  });

  it('deve reconstruir o estado a partir de uma simulação salva', () => {
    const state = fromPayload({
      loja: { hoursReductionPerWeek: 4, actions: { 'banco-horas': 0.15 } },
    });

    expect(state.loja?.hoursReduction).toBe(4);
    expect(state.loja?.actions['banco-horas']).toEqual({ isOn: true, effectPct: 15 });
  });

  it('deve copiar as ações de uma loja para todas as outras', () => {
    const source = toggleAction(emptyStoreMitigation(), 'banco-horas', true, defaults);

    const state = applyToAllStores({ a: source }, 'a', ['a', 'b', 'c']);

    expect(Object.keys(state).sort()).toEqual(['a', 'b', 'c']);
    expect(state.c?.actions['banco-horas']).toEqual({ isOn: true, effectPct: 15 });
  });

  it('deve listar só as ações que valem para o farmacêutico', () => {
    expect(eligibleActionIds('farmaceutico')).toEqual(['negociacao-coletiva']);
    expect(eligibleActionIds('balconista')).toBeNull();
  });
});
