import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import {
  formToRequest,
  PROFILE_LABELS,
  validateStoreForm,
  type DayValues,
  type RoleValues,
  type StoreFormValues,
} from '../storeForm';
import type { RoleKind, StoreProfileKind, StoreRequest } from '../types';
import { OpeningHoursEditor } from './OpeningHoursEditor';
import { RolesEditor } from './RolesEditor';

type StoreFormProps = {
  initialValues: StoreFormValues;
  submitLabel: string;
  onSubmit: (request: StoreRequest) => Promise<void>;
  onCancel: () => void;
};

const PROFILE_OPTIONS = (Object.keys(PROFILE_LABELS) as StoreProfileKind[]).map((value) => ({
  value,
  label: PROFILE_LABELS[value],
}));

export function StoreForm({ initialValues, submitLabel, onSubmit, onCancel }: StoreFormProps) {
  const [values, setValues] = useState<StoreFormValues>(initialValues);
  const [showErrors, setShowErrors] = useState(false);
  const { submit, isSubmitting, error } = useSubmit(onSubmit);

  const errors = showErrors ? validateStoreForm(values) : {};

  const setDay = (weekday: number, day: DayValues) =>
    setValues((current) => ({ ...current, days: { ...current.days, [weekday]: day } }));

  const applyToOpenDays = (hours: Pick<DayValues, 'opensAt' | 'closesAt'>) =>
    setValues((current) => {
      const days = Object.fromEntries(
        Object.entries(current.days).map(([weekday, day]) => [
          weekday,
          hours.opensAt === '00:00' && hours.closesAt === '24:00'
            ? { isOpen: true, ...hours }
            : day.isOpen
              ? { ...day, ...hours }
              : day,
        ]),
      );
      return {
        ...current,
        days,
        profile: hours.closesAt === '24:00' && hours.opensAt === '00:00' ? '24h' : current.profile,
      };
    });

  const setRole = (role: RoleKind, roleValues: RoleValues) =>
    setValues((current) => ({ ...current, roles: { ...current.roles, [role]: roleValues } }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(validateStoreForm(values)).length > 0) return;
    await submit(formToRequest(values));
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <section className="bg-background border-border flex flex-col gap-4 rounded-lg border p-5">
        <h2 className="text-lg font-semibold">Dados da loja</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Nome da loja"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            error={errors.name}
          />
          <TextField
            label="Cidade"
            value={values.city}
            onChange={(event) => setValues({ ...values, city: event.target.value })}
            error={errors.city}
          />
          <SelectField
            label="Perfil da loja"
            value={values.profile}
            options={PROFILE_OPTIONS}
            onValueChange={(profile) => setValues({ ...values, profile })}
          />
        </div>
      </section>

      <section className="bg-background border-border rounded-lg border p-5">
        <OpeningHoursEditor
          days={values.days}
          errors={errors}
          onDayChange={setDay}
          onApplyAll={applyToOpenDays}
        />
      </section>

      <section className="bg-background border-border rounded-lg border p-5">
        <RolesEditor roles={values.roles} errors={errors} onRoleChange={setRole} />
      </section>

      {hasErrors ? (
        <FormMessage tone="error">Corrija os campos destacados para salvar a loja.</FormMessage>
      ) : null}
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
