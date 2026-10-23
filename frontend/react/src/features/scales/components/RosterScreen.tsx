import { useState } from 'react';
import { DaySelector } from '@/components/ui/DaySelector';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useRoster } from '../hooks/useRoster';
import { ALL_SCENARIO_LABEL, type ScaleStore, type ScenarioId } from '../types';
import { RosterGrid } from './RosterGrid';
import { KIND_CLASS, KIND_LABEL, formatDayMonth } from './rosterFormat';
import { cn } from '@/lib/cn';

export function RosterScreen({ store }: { store: ScaleStore }) {
  const [scenario, setScenario] = useState<ScenarioId>('5x2_42');
  const [groupKey, setGroupKey] = useState('todas');
  const [week, setWeek] = useState(0);
  const [dayMask, setDayMask] = useState(1);
  const state = useRoster(store.id, scenario);
  const day = Math.max(0, Math.log2(dayMask));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Escala de 4 semanas</h2>
        <SegmentedControl
          label="Cenário"
          value={scenario}
          options={(Object.keys(ALL_SCENARIO_LABEL) as ScenarioId[]).map((value) => ({
            value,
            label: ALL_SCENARIO_LABEL[value],
          }))}
          onValueChange={setScenario}
        />
      </div>

      {state.status === 'loading' ? (
        <div role="status" aria-label="Montando a escala" className="flex flex-col gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-64" />
        </div>
      ) : null}
      {state.status === 'error' ? <FormMessage tone="error">{state.message}</FormMessage> : null}

      {state.status === 'ready' ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="roster-group" className="text-muted-foreground text-xs">
                Função
              </label>
              <select
                id="roster-group"
                value={groupKey}
                onChange={(e) => setGroupKey(e.target.value)}
                className="border-input bg-surface rounded-lg border p-2 text-sm"
              >
                <option value="todas">Todas as funções</option>
                {state.roster.groups.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div role="tablist" aria-label="Semana" className="flex flex-wrap gap-1">
              {[0, 1, 2, 3].map((w) => (
                <button
                  key={w}
                  type="button"
                  role="tab"
                  aria-selected={week === w}
                  onClick={() => setWeek(w)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-medium',
                    week === w
                      ? 'border-blue-turn bg-selected text-selected-foreground font-semibold'
                      : 'border-input bg-surface hover:bg-muted',
                  )}
                >
                  Semana {w + 1}
                  <span className="text-muted-foreground block font-normal">
                    {formatDayMonth(state.roster.dates[w * 7]!)}–
                    {formatDayMonth(state.roster.dates[w * 7 + 6]!)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:hidden">
            <DaySelector
              label="Dia da semana"
              mask={dayMask}
              onMaskChange={(m) => {
                const picked = m & ~dayMask;
                setDayMask(picked || dayMask);
              }}
            />
          </div>

          <ul className="text-muted-foreground flex flex-wrap gap-3 text-xs" aria-label="Legenda">
            {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn('border-border h-3.5 w-3.5 rounded-sm border', KIND_CLASS[k])}
                />
                {KIND_LABEL[k]}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="bg-muted border-border h-3.5 w-3.5 rounded-sm border"
              />
              Folga
            </li>
          </ul>

          {state.roster.groups
            .filter((g) => groupKey === 'todas' || g.key === groupKey)
            .map((g) => (
              <RosterGrid
                key={g.key}
                group={g}
                week={week}
                dates={state.roster.dates}
                holidays={state.roster.holidays}
                day={day}
              />
            ))}
          <p className="text-muted-foreground text-xs">
            Cada pessoa tem pelo menos 11 horas de descanso entre uma jornada e a seguinte, e o
            rodízio de domingos segue a regra escolhida no cadastro. Na equipe mínima, parte da
            equipe alterna de tipo de turno de uma semana para outra.
          </p>
        </>
      ) : null}
    </div>
  );
}
