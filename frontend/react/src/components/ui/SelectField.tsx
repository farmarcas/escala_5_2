import { useId } from 'react';
import { describedBy, FieldShell } from './FieldShell';
import { fieldControlClass } from './fieldStyles';

type SelectOption<T extends string> = { value: T; label: string };

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onValueChange: (value: T) => void;
  hint?: string;
  error?: string;
  className?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  options,
  onValueChange,
  hint,
  error,
  className,
}: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value as T)}
        aria-describedby={describedBy(id, hint, error)}
        className={fieldControlClass(Boolean(error))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
