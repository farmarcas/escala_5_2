import { Skeleton } from '@/components/ui/Skeleton';
import { formatBRL, formatDelta, formatInt } from '@/lib/formatPtBr';
import type { PreviewState } from '../hooks/usePreview';

// Resumo que recalcula enquanto a pessoa preenche (aparece ao lado do cadastro).
export function LivePreview({ preview }: { preview: PreviewState }) {
  return (
    <aside
      aria-label="Resumo ao vivo"
      className="border-border bg-surface rounded-lg border p-4 lg:sticky lg:top-4"
    >
      <h2 className="text-sm font-bold">Resumo ao vivo</h2>
      {preview.status === 'loading' ? (
        <div className="mt-3 space-y-2" role="status" aria-label="Calculando">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      ) : null}
      {preview.status === 'invalid' ? (
        <p className="text-muted-foreground mt-2 text-sm">
          Complete os campos destacados para ver o resultado.
        </p>
      ) : null}
      {preview.status === 'error' ? (
        <p role="alert" className="text-critical mt-2 text-sm">
          {preview.message}
        </p>
      ) : null}
      {preview.status === 'ready' ? (
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Pessoas a contratar na 5x2 · 42h</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {formatInt(preview.diagnostic.totals.hire['5x2_42'])}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Falta para cobrir o horário hoje</dt>
            <dd className="font-bold tabular-nums">{formatInt(preview.diagnostic.totals.fill)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Efeito só da escala 5x2 · 42h</dt>
            <dd className="font-bold tabular-nums">
              {formatDelta(preview.diagnostic.totals.effect['5x2_42'])}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Folha mensal hoje</dt>
            <dd className="font-bold tabular-nums">
              {formatBRL(preview.diagnostic.payroll.today.total)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Folha mensal na 5x2 · 42h</dt>
            <dd className="font-bold tabular-nums">
              {formatBRL(preview.diagnostic.payroll.scenarios['5x2_42'].total)}
            </dd>
          </div>
        </dl>
      ) : null}
    </aside>
  );
}
