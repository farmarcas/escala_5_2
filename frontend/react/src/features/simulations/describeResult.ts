import { ROLE_LABELS } from '@/features/stores/storeForm';
import type { Metric } from '@/lib/describeQuickResult';
import { formatBRL, formatBRLCompact, formatInt, formatPlainNumber } from '@/lib/formatPtBr';
import type { DetailedResult, RegimeKind, StoreImpact } from './types';

export const hoursText = (value: number) => `${formatPlainNumber(Math.round(value * 10) / 10)} h`;

// Textos do total do grupo. A tela e o PDF usam estas funções: os números nunca divergem.
export function describeTotals(result: DetailedResult, regime: RegimeKind): Metric[] {
  const { totals, stores } = result;
  const metrics: Metric[] = [
    {
      label: 'Impacto bruto por ano',
      value: formatBRLCompact(totals.grossAnnualImpact),
      caption: 'Custo das contratações necessárias.',
    },
    {
      label: 'Impacto líquido por ano',
      value: formatBRLCompact(totals.netAnnualImpact),
      caption:
        regime === 'real'
          ? 'Lucro Real: o custo é dedutível de IRPJ/CSLL.'
          : 'Neste regime não há abatimento.',
    },
    {
      label: 'Pessoas a contratar',
      value: formatInt(totals.peopleToHire),
      caption: 'Contadas por loja e função, em números inteiros.',
    },
    { label: 'Lojas com impacto', value: `${totals.storesWithImpact} de ${stores.length}` },
  ];

  if (totals.savings > 0) {
    metrics.push(
      {
        label: 'Impacto residual após as ações',
        value: formatBRLCompact(totals.residualAnnualImpact),
        caption: `${formatInt(totals.residualPeopleToHire)} pessoa(s) a contratar.`,
      },
      {
        label: 'Economia estimada por ano',
        value: formatBRLCompact(totals.savings),
        caption: 'Diferença entre o impacto bruto e o residual.',
      },
    );
  }
  return metrics;
}

export type RoleRow = {
  role: string;
  hoursToCover: string;
  hoursAt40: string;
  newDeficit: string;
  peopleToHire: string;
  residualPeople: string;
  annualCost: string;
};

export const describeStoreRoles = (store: StoreImpact): RoleRow[] =>
  store.roles.map((role) => ({
    role: ROLE_LABELS[role.role],
    hoursToCover: hoursText(role.hoursToCover),
    hoursAt40: hoursText(role.hoursAvailableAt40),
    newDeficit: hoursText(role.newDeficit),
    peopleToHire: formatInt(role.peopleToHire),
    residualPeople: formatInt(role.residualPeopleToHire),
    annualCost: formatBRL(role.annualCost),
  }));
