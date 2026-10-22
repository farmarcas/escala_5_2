import type { ReactNode } from 'react';
import type { DetailedResult, RegimeKind, StoreImpact } from '../types';
import { GroupTotals } from './GroupTotals';
import { StoreImpactTable } from './StoreImpactTable';
import { StoreRanking } from './StoreRanking';

type SimulationResultViewProps = {
  result: DetailedResult;
  regime: RegimeKind;
  renderStoreExtra?: (store: StoreImpact) => ReactNode;
};

export function SimulationResultView({
  result,
  regime,
  renderStoreExtra,
}: SimulationResultViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {result.warnings.includes('MITIGATION_ABOVE_USUAL') ? (
        <p role="alert" className="bg-warning-background text-warning rounded-md p-3 text-sm">
          A redução combinada das ações em alguma loja passa de 50%, o que costuma ser otimista.
          Confira se os efeitos informados são realistas antes de apresentar o resultado.
        </p>
      ) : null}
      <GroupTotals result={result} regime={regime} />
      <StoreRanking ranking={result.ranking} />
      <StoreImpactTable stores={result.stores} renderExtra={renderStoreExtra} />
    </div>
  );
}
