import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '../hooks/usePreview';
import type { ScaleStoreDraft } from '../types';

type Props = {
  draft: ScaleStoreDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ScaleStoreDraft>) => void;
};

const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
type Mode = 'padrao' | 'especial' | 'fechado';

export function HoursStep({ draft, errors, onChange }: Props) {
  const { hours } = draft;

  const modeOf = (day: number): Mode => {
    const override = hours.overrides[String(day)];
    if (override) return 'closed' in override ? 'fechado' : 'especial';
    return hours.standard.daysMask & (1 << day) ? 'padrao' : 'fechado';
  };

  const setMode = (day: number, mode: Mode) => {
    const overrides = { ...hours.overrides };
    delete overrides[String(day)];
    let daysMask = hours.standard.daysMask;
    if (mode === 'padrao') daysMask |= 1 << day;
    else daysMask &= ~(1 << day);
    if (mode === 'especial') {
      overrides[String(day)] = { start: hours.standard.start, end: hours.standard.end };
    }
    onChange({ hours: { ...hours, standard: { ...hours.standard, daysMask }, overrides } });
  };

  const setSpecial = (day: number, field: 'start' | 'end', value: string) => {
    const current = hours.overrides[String(day)];
    if (!current || 'closed' in current) return;
    onChange({
      hours: {
        ...hours,
        overrides: { ...hours.overrides, [String(day)]: { ...current, [field]: value } },
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Checkbox
        label="Funciona 24 horas, todos os dias"
        checked={hours.always24h}
        onChange={(e) => onChange({ hours: { ...hours, always24h: e.target.checked } })}
      />
      {hours.always24h ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Abre às"
              type="time"
              value={hours.standard.start}
              onChange={(e) =>
                onChange({
                  hours: { ...hours, standard: { ...hours.standard, start: e.target.value } },
                })
              }
            />
            <TextField
              label="Fecha às"
              type="time"
              value={hours.standard.end}
              error={errors['hours.standard.end']}
              onChange={(e) =>
                onChange({
                  hours: { ...hours, standard: { ...hours.standard, end: e.target.value } },
                })
              }
            />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Dias da semana</legend>
            <ul className="divide-border border-border divide-y rounded-lg border">
              {DAY_NAMES.map((name, day) => {
                const mode = modeOf(day);
                const special = hours.overrides[String(day)];
                return (
                  <li key={name} className="flex flex-wrap items-center gap-3 p-3">
                    <span className="w-24 text-sm font-medium">{name}</span>
                    <select
                      aria-label={`${name}: horário`}
                      value={mode}
                      onChange={(e) => setMode(day, e.target.value as Mode)}
                      className="border-input bg-surface rounded-lg border p-2 text-sm"
                    >
                      <option value="padrao">Horário padrão</option>
                      <option value="especial">Horário diferente</option>
                      <option value="fechado">Fechada</option>
                    </select>
                    {mode === 'especial' && special && !('closed' in special) ? (
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          aria-label={`${name}: abre às`}
                          value={special.start}
                          onChange={(e) => setSpecial(day, 'start', e.target.value)}
                          className="border-input bg-surface rounded-lg border p-2"
                        />
                        até
                        <input
                          type="time"
                          aria-label={`${name}: fecha às`}
                          value={special.end}
                          onChange={(e) => setSpecial(day, 'end', e.target.value)}
                          className="border-input bg-surface rounded-lg border p-2"
                        />
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </>
      )}
    </div>
  );
}
