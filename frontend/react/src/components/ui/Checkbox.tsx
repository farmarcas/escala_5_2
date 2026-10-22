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
        'border-border hover:bg-muted flex cursor-pointer items-start gap-3 rounded-md border p-3',
        'has-[:checked]:border-primary has-[:checked]:bg-accent',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="accent-primary focus-visible:ring-ring mt-1 h-4 w-4 focus-visible:ring-2 focus-visible:outline-none"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description ? <span className="text-muted-foreground text-xs">{description}</span> : null}
      </span>
    </label>
  );
}
