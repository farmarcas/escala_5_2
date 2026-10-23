import { Checkbox } from '@/components/ui/Checkbox';
import { DaySelector } from '@/components/ui/DaySelector';
import { NumberField } from '@/components/ui/NumberField';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/lib/cn';
import { OPTIONAL_ROLES, ROLE_LABELS, type ScaleRole } from '../types';

type Props = {
  role: ScaleRole;
  error?: string;
  warning?: string | null;
  onChange: (patch: Partial<ScaleRole>) => void;
};

export function RoleCard({ role, error, warning, onChange }: Props) {
  const label = ROLE_LABELS[role.role];
  const optional = OPTIONAL_ROLES.includes(role.role);
  const isPharmacist = role.role === 'farmaceutico';

  return (
    <section
      aria-label={label}
      className={cn(
        'rounded-lg border p-4',
        role.enabled ? 'border-border bg-surface' : 'border-border bg-muted',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">{label}</h3>
        {optional ? (
          <Checkbox
            label="Usar esta função"
            checked={role.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="py-1.5"
          />
        ) : isPharmacist ? (
          <StatusPill tone="info">Obrigatória · todo o horário</StatusPill>
        ) : null}
      </header>
      {error ? (
        <p role="alert" className="text-critical mt-2 text-xs">
          {error}
        </p>
      ) : null}

      {warning ? (
        <p role="note" className="bg-warning-background text-warning mt-3 rounded-md p-3 text-sm">
          {warning}
        </p>
      ) : null}

      {role.enabled ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Pessoas hoje"
            value={role.headcount}
            onValueChange={(v) => onChange({ headcount: Math.max(0, Math.round(v ?? 0)) })}
          />
          <NumberField
            label="Salário de registro"
            prefix="R$"
            value={role.monthlySalary}
            onValueChange={(v) => onChange({ monthlySalary: Math.max(0, v ?? 0) })}
          />
          <NumberField
            label="Mínimo no salão"
            value={role.minInHall}
            hint="Pessoas presentes o tempo todo"
            onValueChange={(v) => onChange({ minInHall: Math.max(0, Math.round(v ?? 0)) })}
          />

          {isPharmacist ? (
            <div className="sm:col-span-3">
              <Checkbox
                label="O dono é farmacêutico e atua na loja"
                description="Ele cobre um posto e reduz uma pessoa na equipe necessária."
                checked={role.ownerIsPharmacist}
                onChange={(e) => onChange({ ownerIsPharmacist: e.target.checked })}
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 sm:col-span-3">
                <span className="text-sm font-medium">Cobertura</span>
                <div className="flex flex-wrap items-center gap-3">
                  <SegmentedControl
                    label={`${label}: cobertura`}
                    value={role.coverage.mode}
                    options={[
                      { value: 'all', label: 'Todo o funcionamento' },
                      { value: 'band', label: 'Faixa de horário' },
                    ]}
                    onValueChange={(mode) =>
                      onChange({
                        coverage:
                          mode === 'all'
                            ? { mode: 'all' }
                            : { mode: 'band', start: '09:00', end: '18:00' },
                      })
                    }
                  />
                  {role.coverage.mode === 'band' ? (
                    <span className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        aria-label={`${label}: início da faixa`}
                        value={role.coverage.start}
                        onChange={(e) =>
                          role.coverage.mode === 'band' &&
                          onChange({ coverage: { ...role.coverage, start: e.target.value } })
                        }
                        className="border-input bg-surface rounded-lg border p-2"
                      />
                      até
                      <input
                        type="time"
                        aria-label={`${label}: fim da faixa`}
                        value={role.coverage.end}
                        onChange={(e) =>
                          role.coverage.mode === 'band' &&
                          onChange({ coverage: { ...role.coverage, end: e.target.value } })
                        }
                        className="border-input bg-surface rounded-lg border p-2"
                      />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-3">
                <span className="text-sm font-medium">Dias em que a função trabalha</span>
                <DaySelector
                  label={`${label}: dias`}
                  mask={role.daysMask}
                  onMaskChange={(daysMask) => onChange({ daysMask })}
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-3">
                <span className="text-sm font-medium">Tipo de escala</span>
                <SegmentedControl
                  label={`${label}: escala`}
                  value={role.scaleType}
                  options={[
                    { value: 'normal', label: 'Jornada normal' },
                    { value: 'doze_x_trinta_e_seis', label: '12x36 (exige convenção)' },
                  ]}
                  onValueChange={(scaleType) => onChange({ scaleType })}
                />
              </div>
            </>
          )}

          {role.role === 'entregador' ? (
            <div className="sm:col-span-3">
              <Checkbox
                label="Entrega de moto"
                description="Adicional de periculosidade de 30% sobre o salário."
                checked={role.motorcycle}
                onChange={(e) => onChange({ motorcycle: e.target.checked })}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground mt-2 text-sm">
          Desligada: não entra na escala nem no custo.
        </p>
      )}
    </section>
  );
}
