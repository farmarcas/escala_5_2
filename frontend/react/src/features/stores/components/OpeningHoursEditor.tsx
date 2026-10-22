import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import { WEEKDAYS, type DayValues, type StoreFormErrors } from '../storeForm';

type OpeningHoursEditorProps = {
  days: Record<number, DayValues>;
  errors: StoreFormErrors;
  onDayChange: (weekday: number, day: DayValues) => void;
  onApplyAll: (day: Pick<DayValues, 'opensAt' | 'closesAt'>) => void;
};

export function OpeningHoursEditor({
  days,
  errors,
  onDayChange,
  onApplyAll,
}: OpeningHoursEditorProps) {
  const firstOpen = WEEKDAYS.map(({ weekday }) => days[weekday]).find((day) => day?.isOpen);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold">Horário de funcionamento</legend>
      <p className="text-muted-foreground text-sm">
        Marque os dias em que a loja abre. Use 24:00 como fechamento para ir até a meia-noite, ou um
        horário menor que a abertura quando a loja passa da meia-noite.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onApplyAll({ opensAt: '00:00', closesAt: '24:00' })}
        >
          Loja 24 horas (todos os dias)
        </Button>
        {firstOpen ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onApplyAll({ opensAt: firstOpen.opensAt, closesAt: firstOpen.closesAt })}
          >
            Copiar o primeiro horário para todos os dias abertos
          </Button>
        ) : null}
      </div>

      {errors.days ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.days}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        {WEEKDAYS.map(({ weekday, label }) => {
          const day = days[weekday] as DayValues;
          const error = errors[`day.${weekday}`];
          return (
            <div
              key={weekday}
              className="border-border grid items-start gap-3 rounded-md border p-3 sm:grid-cols-[12rem_1fr_1fr]"
            >
              <Checkbox
                label={label}
                checked={day.isOpen}
                onChange={(event) => onDayChange(weekday, { ...day, isOpen: event.target.checked })}
              />
              {day.isOpen ? (
                <>
                  <TextField
                    label="Abre às"
                    inputMode="numeric"
                    placeholder="08:00"
                    maxLength={5}
                    value={day.opensAt}
                    onChange={(event) =>
                      onDayChange(weekday, { ...day, opensAt: event.target.value })
                    }
                    error={error}
                  />
                  <TextField
                    label="Fecha às"
                    inputMode="numeric"
                    placeholder="20:00"
                    maxLength={5}
                    value={day.closesAt}
                    onChange={(event) =>
                      onDayChange(weekday, { ...day, closesAt: event.target.value })
                    }
                  />
                </>
              ) : (
                <p className="text-muted-foreground self-center text-sm sm:col-span-2">Fechada</p>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
