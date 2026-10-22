import { formatBRL, formatInt, formatPercent } from './formatPtBr';
import type { QuickResult } from './quickImpact';

// Síntese para a diretoria, montada só com os números já calculados (a tela e o PDF mostram o mesmo texto).
export function buildSummaryText(result: QuickResult): string {
  if (!result.hasImpact) {
    return 'Com as informações dadas, não há impacto estimado: nenhum colaborador está em escala 6x1.';
  }

  const parts = [
    `Grupos com este perfil podem ter um impacto de ${formatBRL(result.grossMin)} a ${formatBRL(result.grossMax)} por ano ` +
      `(${formatPercent(result.pctRevenueMin, 2)} a ${formatPercent(result.pctRevenueMax, 2)} do faturamento) com o fim da escala 6x1, ` +
      `o equivalente a contratar de ${formatInt(result.peopleMin)} a ${formatInt(result.peopleMax)} pessoas ao salário médio informado.`,
  ];

  if (result.mitigation.current > 0) {
    parts.push(
      `Com as ações marcadas, o impacto pode cair ${formatPercent(result.mitigation.current, 0)}, ` +
        `para um residual de ${formatBRL(result.residualMin)} a ${formatBRL(result.residualMax)} por ano.`,
    );
  }

  if (result.taxBenefitApplies) {
    parts.push(
      `No Lucro Real, por ser dedutível de IRPJ/CSLL, o impacto líquido fica entre ${formatBRL(result.netMin)} e ${formatBRL(result.netMax)} por ano.`,
    );
  }

  return parts.join(' ');
}
