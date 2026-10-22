import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '../hooks/usePreview';
import type { ScaleStoreDraft } from '../types';
import { formatDayMonth } from './rosterFormat';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

export function HolidaysStep({ draft, onChange }: Props) {
  const { holidays } = draft;
  const set = (patch: Partial<ScaleStoreDraft['holidays']>) =>
    onChange({ holidays: { ...holidays, ...patch } });
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const canAdd = /^\d{4}-\d{2}-\d{2}$/.test(date) && name.trim().length >= 2;

  return (
    <div className="flex flex-col gap-5">
      <Checkbox
        label="Incluir os feriados nacionais (2026 a 2028)"
        checked={holidays.national}
        onChange={(e) => set({ national: e.target.checked })}
      />
      <Checkbox
        label="A loja abre nos feriados"
        description="Desmarque se a loja fecha em todos os feriados."
        checked={holidays.openOnHolidays}
        onChange={(e) => set({ openOnHolidays: e.target.checked })}
      />

      {holidays.openOnHolidays ? (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Quem trabalha no feriado</span>
            <SegmentedControl
              label="Rodízio nos feriados"
              value={holidays.rotation}
              options={[
                { value: 'rotativa', label: 'Escala rotativa' },
                { value: 'fixa', label: 'Escala fixa' },
              ]}
              onValueChange={(rotation) => set({ rotation })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Como compensar quem trabalha</span>
            <SegmentedControl
              label="Compensação do feriado"
              value={holidays.compensation}
              options={[
                { value: 'folga', label: 'Folga compensatória' },
                { value: 'dobro', label: 'Pagamento em dobro' },
              ]}
              onValueChange={(compensation) => set({ compensation })}
            />
          </div>
          <Checkbox
            label="A folga que cai no feriado conta como a folga da semana"
            description="Pela lei não gera outra folga; algumas convenções preveem o contrário."
            checked={holidays.offOnHolidayCounts}
            onChange={(e) => set({ offOnHolidayCounts: e.target.checked })}
          />
        </>
      ) : null}

      <fieldset className="border-border rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">Feriados estaduais e municipais</legend>
        <ul className="mb-3 flex flex-col gap-2">
          {holidays.extra.length === 0 ? (
            <li className="text-muted-foreground text-sm">Nenhum cadastrado.</li>
          ) : (
            holidays.extra.map((h) => (
              <li key={h.date} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {formatDayMonth(h.date)}/{h.date.slice(0, 4)} · {h.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => set({ extra: holidays.extra.filter((x) => x.date !== h.date) })}
                >
                  Remover
                </Button>
              </li>
            ))
          )}
        </ul>
        <div className="grid items-end gap-3 sm:grid-cols-[10rem_1fr_auto]">
          <TextField
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            label="Nome do feriado"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!canAdd}
            onClick={() => {
              set({
                extra: [
                  ...holidays.extra.filter((x) => x.date !== date),
                  { date, name: name.trim() },
                ].sort((a, b) => a.date.localeCompare(b.date)),
              });
              setDate('');
              setName('');
            }}
          >
            Adicionar
          </Button>
        </div>
      </fieldset>
    </div>
  );
}
