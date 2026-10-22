import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatBRLCompact, formatInt } from '@/lib/formatPtBr';
import type { ReactNode } from 'react';
import { describeStoreRoles, hoursText } from '../describeResult';
import type { StoreImpact } from '../types';
import { MandatoryPresenceNote } from './MandatoryPresenceNote';

type StoreImpactTableProps = {
  stores: StoreImpact[];
  renderExtra?: (store: StoreImpact) => ReactNode;
};

export function StoreImpactTable({ stores, renderExtra }: StoreImpactTableProps) {
  const ordered = [...stores].sort((a, b) => b.grossAnnualImpact - a.grossAnnualImpact);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="lojas-titulo">
      <h2 id="lojas-titulo" className="text-lg font-semibold">
        Impacto por loja e função
      </h2>
      <div className="flex flex-col gap-3">
        {ordered.map((store) => (
          <details
            key={store.storeId}
            className="bg-background border-border rounded-lg border p-4"
          >
            <summary className="flex cursor-pointer flex-wrap items-center gap-3">
              <span className="font-semibold">{store.name}</span>
              {store.hasImpact ? (
                <StatusBadge tone="warning">
                  {formatInt(store.peopleToHire)} pessoa(s) ·{' '}
                  {formatBRLCompact(store.grossAnnualImpact)}
                  /ano
                  {store.savings > 0
                    ? ` → após ações: ${formatInt(store.residualPeopleToHire)} pessoa(s)`
                    : ''}
                </StatusBadge>
              ) : (
                <StatusBadge tone="success">Sem contratação necessária</StatusBadge>
              )}
              <span className="text-muted-foreground text-xs">
                {hoursText(store.weeklyOpenHours)} de abertura por semana
              </span>
            </summary>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <caption className="sr-only">Impacto de {store.name} por função</caption>
                <thead className="text-muted-foreground text-xs">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Função
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Horas a cobrir
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Horas com 40h
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Falta nova
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Contratar
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">
                      Após ações
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Custo por ano
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {describeStoreRoles(store).map((row) => (
                    <tr key={row.role} className="border-border border-t">
                      <th scope="row" className="py-2 pr-3 font-medium">
                        {row.role}
                      </th>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.hoursToCover}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.hoursAt40}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.newDeficit}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.peopleToHire}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.residualPeople}</td>
                      <td className="py-2 text-right tabular-nums">{row.annualCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {store.roles.some((role) => role.mandatoryPresence) ? (
              <div className="mt-3">
                <MandatoryPresenceNote
                  hasDeficit={store.roles.some(
                    (role) => role.mandatoryPresence && role.peopleToHire > 0,
                  )}
                />
              </div>
            ) : null}

            {renderExtra ? renderExtra(store) : null}

            <p className="text-muted-foreground mt-3 text-xs">
              "Falta nova" é só o que a redução para 40h acrescenta: se a loja já estava com a
              equipe curta hoje, essa parte não entra na conta.
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
