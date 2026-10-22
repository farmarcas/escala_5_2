import type { QuickInput, QuickResult } from '@/lib/quickImpact';
import type { ContactSnapshot } from '@/features/contact';

// O que acompanha um pedido de contato: o perfil informado e os números que a pessoa viu.
export function buildQuickSnapshot(input: QuickInput, result: QuickResult): ContactSnapshot {
  return {
    mode: 'rapido',
    profile: { ...input },
    result: {
      grossMin: result.grossMin,
      grossMax: result.grossMax,
      netMin: result.netMin,
      netMax: result.netMax,
      pctRevenueMin: result.pctRevenueMin,
      pctRevenueMax: result.pctRevenueMax,
      peopleMin: result.peopleMin,
      peopleMax: result.peopleMax,
      residualMin: result.residualMin,
      residualMax: result.residualMax,
      savings: result.savings,
    },
  };
}
