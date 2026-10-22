import { formatBRL, formatBRLCompact, formatInt, formatPercent } from './formatPtBr';
import type { QuickResult } from './quickImpact';

export type Metric = { label: string; value: string; caption?: string };

// Textos do resultado do modo rápido. A tela e o PDF usam esta mesma função: os números nunca divergem.
export function describeQuickResult(result: QuickResult): { headline: Metric; metrics: Metric[] } {
  const metrics: Metric[] = [
    {
      label: 'Impacto líquido após efeito fiscal',
      value: `${formatBRLCompact(result.netMin)} a ${formatBRLCompact(result.netMax)}`,
      caption: result.taxBenefitApplies
        ? 'Lucro Real: o custo é dedutível de IRPJ/CSLL.'
        : 'Neste regime não há abatimento: igual ao impacto bruto.',
    },
    {
      label: 'Impacto sobre o faturamento anual',
      value: `${formatPercent(result.pctRevenueMin, 2)} a ${formatPercent(result.pctRevenueMax, 2)}`,
    },
    {
      label: 'Impacto sobre o resultado operacional estimado',
      value:
        result.pctOperatingMin === null || result.pctOperatingMax === null
          ? 'n/d'
          : `${formatPercent(result.pctOperatingMin)} a ${formatPercent(result.pctOperatingMax)}`,
      caption: `Resultado operacional estimado: ${formatBRLCompact(result.operatingResult)} por ano.`,
    },
    {
      label: 'Pessoas equivalentes a contratar',
      value: `${formatInt(result.peopleMin)} a ${formatInt(result.peopleMax)}`,
      caption: `Para recompor as horas perdidas de ${formatInt(result.affected)} colaboradores afetados. Este é o custo do impacto bruto acima.`,
    },
  ];

  if (result.avgPerStoreMin !== null && result.avgPerStoreMax !== null) {
    metrics.push({
      label: 'Impacto médio por loja',
      value: `${formatBRLCompact(result.avgPerStoreMin)} a ${formatBRLCompact(result.avgPerStoreMax)}`,
      caption: 'Por ano, dividindo igualmente entre as lojas informadas.',
    });
  }

  return {
    headline: {
      label: 'Impacto bruto de folha por ano',
      value: `${formatBRLCompact(result.grossMin)} a ${formatBRLCompact(result.grossMax)}`,
      caption: `Custo anual por pessoa contratada: ${formatBRL(result.costPerPerson)}.`,
    },
    metrics,
  };
}
