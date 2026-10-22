import { ROLE_LABELS } from '@/features/stores/storeForm';
import type { DetailedResult } from '@/features/simulations/types';

const SEPARATOR = ';';
const BOM = '﻿';

// Células que começam com = + - @ viram texto: a planilha as executaria como fórmula.
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Número com vírgula decimal e 2 casas, para o Excel brasileiro reconhecer como número.
const number = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });

const HEADER = [
  'loja',
  'funcao',
  'horas_a_cobrir_por_semana',
  'horas_disponiveis_com_40h',
  'falta_nova_em_horas',
  'pessoas_a_contratar',
  'custo_anual_reais',
  'pessoas_apos_acoes',
  'custo_apos_acoes_reais',
];

export const buildStoresCsv = (result: DetailedResult): string => {
  const lines = result.stores.flatMap((store) =>
    store.roles.map((role) =>
      [
        csvCell(store.name),
        ROLE_LABELS[role.role],
        number(role.hoursToCover),
        number(role.hoursAvailableAt40),
        number(role.newDeficit),
        String(role.peopleToHire),
        number(role.annualCost),
        String(role.residualPeopleToHire),
        number(role.residualAnnualCost),
      ].join(SEPARATOR),
    ),
  );
  return BOM + [HEADER.join(SEPARATOR), ...lines].join('\r\n') + '\r\n';
};
