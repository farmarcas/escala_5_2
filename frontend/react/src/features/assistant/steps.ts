import type { ChangeStepId } from './types';

// Passo do cadastro onde a pessoa muda o que o cenário simulou.
export const STEP_LABEL: Record<ChangeStepId, string> = {
  horario: 'Horário de funcionamento',
  plantao: 'Plantão noturno',
  equipe: 'Equipe por função',
  regras: 'Regras, benefícios e encargos',
  vendas: 'Vendas, CMV e meta da folha',
  feriados: 'Feriados',
};

export const STEP_IDS = Object.keys(STEP_LABEL) as ChangeStepId[];

export const isStepId = (value: string | null): value is ChangeStepId =>
  value !== null && (STEP_IDS as string[]).includes(value);

export const stepLink = (storeId: string, step: ChangeStepId) =>
  `/painel/lojas/${storeId}/dados?passo=${step}`;
