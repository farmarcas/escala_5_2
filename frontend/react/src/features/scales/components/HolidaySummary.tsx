import { StatusPill } from '@/components/ui/StatusPill';
import type { HolidaySummary as Summary, ScaleStore } from '../types';
import { formatDayMonth } from './rosterFormat';

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const weekdayOf = (iso: string) => WEEKDAY[new Date(`${iso}T12:00:00Z`).getUTCDay()]!;

export function HolidaySummary({ summary, store }: { summary: Summary; store: ScaleStore }) {
  const { holidays } = store;
  return (
    <section className="border-border bg-background rounded-lg border p-5">
      <h3 className="font-bold">Feriados no período</h3>
      <p className="text-muted-foreground mb-3 text-sm">
        {holidays.rotation === 'rotativa'
          ? 'Escala rotativa nos feriados'
          : 'Escala fixa nos feriados'}{' '}
        ·{' '}
        {holidays.compensation === 'folga'
          ? 'quem trabalha recebe folga compensatória na semana seguinte'
          : 'quem trabalha recebe em dobro'}{' '}
        ·{' '}
        {holidays.offOnHolidayCounts
          ? 'folga que cai no feriado conta como folga da semana'
          : 'folga que cai no feriado não conta como folga da semana'}
        .
      </p>
      {summary.rows.length === 0 ? (
        <p className="text-sm">Nenhum feriado nas 4 semanas da escala.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-muted-foreground text-xs uppercase">
              <tr>
                <th className="py-2 pr-3">Data</th>
                <th className="px-3 py-2">Feriado</th>
                <th className="px-3 py-2">Loja</th>
                <th className="px-3 py-2 text-right">Trabalham</th>
                <th className="py-2 pl-3 text-right">De folga</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {summary.rows.map((r) => (
                <tr key={r.date}>
                  <td className="py-2 pr-3 tabular-nums">
                    {formatDayMonth(r.date)} · {weekdayOf(r.date)}
                  </td>
                  <td className="px-3 py-2">
                    {r.name}{' '}
                    <span className="text-muted-foreground text-xs">
                      ({r.scope === 'nacional' ? 'nacional' : 'cidade/estado'})
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {r.open ? 'Horário normal' : <StatusPill tone="neutral">Fechada</StatusPill>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.working}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">{r.off}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {holidays.compensation === 'folga' && summary.rows.length > 0 ? (
        <p className="mt-3 text-sm">
          Folgas compensatórias distribuídas no período: <strong>{summary.compensatoryDays}</strong>
          .
        </p>
      ) : null}
      <p className="text-muted-foreground mt-2 text-xs">
        Confira a convenção coletiva: muitas fixam adicional, vale-refeição ou limite de feriados
        trabalhados.
      </p>
    </section>
  );
}
