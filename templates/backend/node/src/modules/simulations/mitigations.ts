// Ações de mitigação do modo detalhado (research.md, seção 3).
// Cada ação tem um efeito entre 0 e 1 sobre o déficit novo de horas; os efeitos se combinam por multiplicação.

export const ACTION_IDS = [
  'ajuste-quadro',
  'escalas-demanda',
  'banco-horas',
  'multifuncionalidade',
  'automacao',
  'negociacao-coletiva',
] as const;

export type ActionId = (typeof ACTION_IDS)[number];

// O farmacêutico é presença obrigatória: só a negociação coletiva (e o ajuste de horário da loja) o alcança.
export const PHARMACIST_ACTIONS: ActionId[] = ['negociacao-coletiva'];

// Acima disso a redução combinada é considerada otimista e a tela avisa.
export const ABOVE_USUAL_THRESHOLD = 0.5;

const isValidEffect = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1;

export const combinedReduction = (effects: number[]): number => {
  const remaining = effects
    .filter(isValidEffect)
    .reduce((product, effect) => product * (1 - effect), 1);
  return 1 - remaining;
};

export const actionsForRole = (
  role: string,
  actions: Partial<Record<string, number>>,
): number[] => {
  const known = Object.entries(actions).filter(([id]) =>
    (ACTION_IDS as readonly string[]).includes(id),
  );
  const allowed =
    role === 'farmaceutico'
      ? known.filter(([id]) => PHARMACIST_ACTIONS.includes(id as ActionId))
      : known;
  return allowed.map(([, effect]) => effect as number);
};
