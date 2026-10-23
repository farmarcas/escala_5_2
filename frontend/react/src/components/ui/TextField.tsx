import { useId, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { describedBy, FieldShell } from './FieldShell';
import { fieldControlClass } from './fieldStyles';

type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        className={cn(fieldControlClass(Boolean(error)))}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </FieldShell>
  );
}
