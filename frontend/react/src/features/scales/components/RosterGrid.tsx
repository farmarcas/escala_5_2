import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';
import type { RosterGroup, RosterPerson } from '../types';
import {
  KIND_CLASS,
  KIND_LABEL,
  WEEKDAYS,
  cellSummary,
  formatDayMonth,
  formatMinutes,
} from './rosterFormat';

type Props = {
  group: RosterGroup;
  week: number;
  dates: string[];
  holidays: (string | null)[];
  day: number;
};

const TAG: Record<
  RosterPerson['tags'][number],
  { label: string; tone: 'warning' | 'info' | 'neutral' }
> = {
  contratar: { label: 'Contratar', tone: 'warning' },
  reforco: { label: 'Reforço', tone: 'info' },
  dono: { label: 'Dono farmacêutico', tone: 'neutral' },
};

function PersonName({ person }: { person: RosterPerson }) {
  return (
    <span className="flex flex-col items-start gap-1">
      <span className="font-medium">{person.label}</span>
      {person.tags.map((t) => (
        <StatusPill key={t} tone={TAG[t].tone}>
          {TAG[t].label}
        </StatusPill>
      ))}
    </span>
  );
}

export function RosterGrid({ group, week, dates, holidays, day }: Props) {
  const slots = (i: number) => week * 7 + i;
  return (
    <section aria-label={group.label} className="border-border bg-surface rounded-lg border">
      <header className="border-border flex flex-wrap items-center justify-between gap-2 border-b p-4">
        <h3 className="font-display text-lg font-semibold">{group.label}</h3>
        {group.covered ? (
          <StatusPill tone="ok">Coberto</StatusPill>
        ) : (
          <StatusPill tone="danger">Salão descoberto em algum horário</StatusPill>
        )}
      </header>

      {/* Tela larga: semana inteira, com a primeira coluna fixa ao rolar */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="bg-surface sticky left-0 z-10 px-4 py-2 font-medium">Pessoa</th>
              {WEEKDAYS.map((d, i) => (
                <th key={d} className="px-2 py-2 text-center font-medium">
                  {d}
                  <span className="block font-normal">{formatDayMonth(dates[slots(i)]!)}</span>
                  {holidays[slots(i)] ? (
                    <span className="text-warning block text-[0.65rem] leading-tight font-bold">
                      {holidays[slots(i)]}
                    </span>
                  ) : null}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Horas</th>
            </tr>
          </thead>
          <tbody>
            {group.people.map((p) => (
              <tr key={p.id}>
                <th
                  scope="row"
                  className="bg-surface border-border sticky left-0 z-10 border-t px-4 py-2 font-normal"
                >
                  <PersonName person={p} />
                </th>
                {WEEKDAYS.map((d, i) => {
                  const cell = p.days[slots(i)];
                  return (
                    <td key={d} className="border-border border-t p-1">
                      {cell ? (
                        <div
                          className={cn(
                            'rounded-md px-2 py-1.5 text-xs leading-tight',
                            KIND_CLASS[cell.kind],
                          )}
                        >
                          <strong className="block tabular-nums">
                            {cell.start}–{cell.end}
                          </strong>
                          {cell.lunch ? (
                            <span className="block">almoço {cell.lunch.start}</span>
                          ) : null}
                          {cell.snack ? (
                            <span className="block">lanche {cell.snack.start}</span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-muted-foreground bg-muted rounded-md px-2 py-3 text-center text-xs">
                          Folga
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="border-border border-t px-3 py-2 text-right font-bold tabular-nums">
                  {formatMinutes(p.weekMinutes[week] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: um dia por vez */}
      <ul className="divide-border divide-y md:hidden">
        {group.people.map((p) => {
          const cell = p.days[slots(day)];
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <PersonName person={p} />
              {cell ? (
                <div
                  className={cn('rounded-md px-3 py-2 text-right text-xs', KIND_CLASS[cell.kind])}
                >
                  <strong className="block tabular-nums">
                    {cell.start}–{cell.end}
                  </strong>
                  <span>{cellSummary(cell).split('· ')[1] ?? KIND_LABEL[cell.kind]}</span>
                </div>
              ) : (
                <span className="text-muted-foreground bg-muted rounded-md px-3 py-2 text-xs">
                  Folga
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
