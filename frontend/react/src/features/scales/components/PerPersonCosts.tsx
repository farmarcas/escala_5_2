import { formatBRL } from '@/lib/formatPtBr';
import { ROLE_LABELS, type PersonCostRow } from '../types';

export function PerPersonCosts({ rows }: { rows: PersonCostRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] text-left text-sm">
        <thead className="text-muted-foreground text-xs uppercase">
          <tr>
            <th className="py-2 pr-3">Cargo</th>
            <th className="px-3 py-2 text-right">Salário de registro</th>
            <th className="px-3 py-2 text-right">Adicionais</th>
            <th className="px-3 py-2 text-right">13º + férias</th>
            <th className="px-3 py-2 text-right">FGTS + INSS</th>
            <th className="px-3 py-2 text-right">Benefícios</th>
            <th className="py-2 pl-3 text-right">Custo total</th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((r) => (
            <tr key={r.key}>
              <th scope="row" className="py-2 pr-3 font-medium">
                {ROLE_LABELS[r.key]}
              </th>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(r.salary)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(r.additions)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(r.provisions)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(r.charges)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatBRL(r.benefits)}</td>
              <td className="py-2 pl-3 text-right font-bold tabular-nums">{formatBRL(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
