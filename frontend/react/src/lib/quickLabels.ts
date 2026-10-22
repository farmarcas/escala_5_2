import type { Maturity, OperatingDays, TaxRegime } from './premisesTypes';

export const DAYS_LABELS: Record<OperatingDays, string> = {
  '7': '7 dias por semana',
  '6': '6 dias por semana',
  '5': '5 dias por semana',
};

export const REGIME_LABELS: Record<TaxRegime, string> = {
  real: 'Lucro Real',
  presumido: 'Lucro Presumido',
  simples: 'Simples Nacional',
};

export const MATURITY_LABELS: Record<Maturity, string> = {
  nao_comecamos: 'Ainda não começamos',
  avaliacao: 'Em avaliação inicial',
  plano_em_curso: 'Já temos plano em curso',
};
