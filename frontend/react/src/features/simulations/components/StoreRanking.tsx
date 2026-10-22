import { formatBRLCompact } from '@/lib/formatPtBr';
import type { DetailedResult } from '../types';

type StoreRankingProps = { ranking: DetailedResult['ranking'] };

export function StoreRanking({ ranking }: StoreRankingProps) {
  const withImpact = ranking.filter((item) => item.grossAnnualImpact > 0);
  const top = withImpact[0]?.grossAnnualImpact ?? 0;

  return (
    <section
      className="bg-background border-border flex flex-col gap-3 rounded-lg border p-5"
      aria-labelledby="ranking-titulo"
    >
      <h2 id="ranking-titulo" className="text-lg font-semibold">
        Lojas mais afetadas
      </h2>
      {withImpact.length === 0 ? (
        <p className="text-sm">Nenhuma loja precisa contratar com os dados informados.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {withImpact.map((item, index) => (
            <li key={item.storeId} className="flex flex-col gap-1">
              <div className="flex justify-between gap-3 text-sm">
                <span>
                  {index + 1}. {item.name}
                </span>
                <span className="font-medium tabular-nums">
                  {formatBRLCompact(item.grossAnnualImpact)}/ano
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full" aria-hidden="true">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.max(2, (item.grossAnnualImpact / top) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
