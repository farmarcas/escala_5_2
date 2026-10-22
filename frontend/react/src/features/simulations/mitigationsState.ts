import type { MitigationsPayload } from './types';

// Estado dos campos de ação por loja. O efeito fica em % (como a pessoa digita) e vira fração ao enviar.
export type ActionState = { isOn: boolean; effectPct: number | null };

export type StoreMitigationState = {
  hoursReduction: number | null;
  actions: Record<string, ActionState>;
};

export type MitigationsState = Record<string, StoreMitigationState>;

export type ActionDefault = { id: string; defaultEffect: number };

// Espelho de PHARMACIST_ACTIONS da API: o farmacêutico é presença obrigatória.
export const PHARMACIST_ACTION_IDS = ['negociacao-coletiva'];

export const eligibleActionIds = (role: string): string[] | null =>
  role === 'farmaceutico' ? PHARMACIST_ACTION_IDS : null;

export const emptyStoreMitigation = (): StoreMitigationState => ({
  hoursReduction: null,
  actions: {},
});

export const toggleAction = (
  store: StoreMitigationState,
  id: string,
  isOn: boolean,
  defaults: ActionDefault[],
): StoreMitigationState => {
  const previous = store.actions[id];
  const suggested = defaults.find((item) => item.id === id)?.defaultEffect ?? 0;
  const effectPct = previous?.effectPct ?? Math.round(suggested * 1000) / 10;
  return { ...store, actions: { ...store.actions, [id]: { isOn, effectPct } } };
};

const validEffect = (pct: number | null): pct is number => pct !== null && pct >= 0 && pct <= 100;

export function toPayload(state: MitigationsState): MitigationsPayload {
  const payload: MitigationsPayload = {};
  for (const [storeId, store] of Object.entries(state)) {
    const actions: Record<string, number> = {};
    for (const [id, action] of Object.entries(store.actions)) {
      if (action.isOn && validEffect(action.effectPct)) {
        actions[id] = Math.round(action.effectPct * 10) / 1000;
      }
    }
    const hours =
      store.hoursReduction !== null && store.hoursReduction > 0 && store.hoursReduction <= 168
        ? store.hoursReduction
        : undefined;

    if (Object.keys(actions).length === 0 && hours === undefined) continue;
    payload[storeId] = {
      ...(hours !== undefined && { hoursReductionPerWeek: hours }),
      ...(Object.keys(actions).length > 0 && { actions }),
    };
  }
  return payload;
}

export function fromPayload(payload: MitigationsPayload): MitigationsState {
  const state: MitigationsState = {};
  for (const [storeId, store] of Object.entries(payload)) {
    state[storeId] = {
      hoursReduction: store.hoursReductionPerWeek ?? null,
      actions: Object.fromEntries(
        Object.entries(store.actions ?? {}).map(([id, effect]) => [
          id,
          { isOn: true, effectPct: Math.round(effect * 1000) / 10 },
        ]),
      ),
    };
  }
  return state;
}

export function applyToAllStores(
  state: MitigationsState,
  sourceId: string,
  storeIds: string[],
): MitigationsState {
  const source = state[sourceId] ?? emptyStoreMitigation();
  return Object.fromEntries(
    storeIds.map((id) => [id, structuredClone(source)]),
  ) as MitigationsState;
}
