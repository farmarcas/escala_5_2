import { Checkbox } from '@/components/ui/Checkbox';
import { NumberField } from '@/components/ui/NumberField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROLE_LABELS, ROLE_ORDER, type RoleValues, type StoreFormErrors } from '../storeForm';
import type { RoleKind } from '../types';

type RolesEditorProps = {
  roles: Record<RoleKind, RoleValues>;
  errors: StoreFormErrors;
  onRoleChange: (role: RoleKind, values: RoleValues) => void;
};

export function RolesEditor({ roles, errors, onRoleChange }: RolesEditorProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold">Equipe por função</legend>
      <p className="text-muted-foreground text-sm">
        Para cada função, informe quantas pessoas a loja precisa ter ao mesmo tempo enquanto está
        aberta (mínimo por turno) e a equipe de hoje.
      </p>

      {ROLE_ORDER.map((role) => {
        const values = roles[role];
        const isPharmacist = role === 'farmaceutico';
        const error = (field: string) => errors[`role.${role}.${field}`];
        const update = (patch: Partial<RoleValues>) => onRoleChange(role, { ...values, ...patch });

        return (
          <div key={role} className="border-border flex flex-col gap-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                label={ROLE_LABELS[role]}
                checked={values.isEnabled}
                disabled={isPharmacist}
                onChange={(event) =>
                  update({
                    isEnabled: event.target.checked,
                    minPerShift: event.target.checked
                      ? (values.minPerShift ?? 1)
                      : values.minPerShift,
                  })
                }
              />
              {isPharmacist ? (
                <StatusBadge tone="warning">Presença obrigatória enquanto a loja abre</StatusBadge>
              ) : null}
            </div>

            {values.isEnabled ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField
                  label="Mínimo por turno"
                  value={values.minPerShift}
                  onValueChange={(value) => update({ minPerShift: value })}
                  error={error('minPerShift')}
                />
                <NumberField
                  label="Pessoas hoje"
                  value={values.headcount}
                  onValueChange={(value) => update({ headcount: value })}
                  error={error('headcount')}
                />
                <NumberField
                  label="Jornada atual por semana"
                  value={values.weeklyHours}
                  suffix="h"
                  onValueChange={(value) => update({ weeklyHours: value })}
                  error={error('weeklyHours')}
                />
                <NumberField
                  label="Salário mensal médio"
                  value={values.monthlySalary}
                  prefix="R$"
                  onValueChange={(value) => update({ monthlySalary: value })}
                  error={error('monthlySalary')}
                />
                <NumberField
                  label="Ausências (férias, faltas)"
                  value={values.absenceRatePct}
                  suffix="%"
                  hint="Em branco usa o padrão da Farmarcas."
                  onValueChange={(value) => update({ absenceRatePct: value })}
                  error={error('absenceRatePct')}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}
