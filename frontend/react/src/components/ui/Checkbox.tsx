import { useId, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

type CheckboxProps = Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'type'> & {
  label: string;
  description?: string;
};

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        'border-border bg-surface hover:bg-muted flex cursor-pointer items-start gap-3 rounded-md border p-3',
        'has-[:checked]:border-blue-turn has-[:checked]:bg-selected',
        className,
      )}
    >
      <input id={id} type="checkbox" className="accent-primary mt-1 h-4 w-4" {...rest} />
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-secondary-foreground text-xs">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
