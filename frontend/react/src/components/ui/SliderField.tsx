import { useId } from 'react';
import { describedBy, FieldShell } from './FieldShell';

type SliderFieldProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  hint?: string;
  error?: string;
  className?: string;
};

export function SliderField({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  formatValue = (current) => String(current),
  hint,
  error,
  className,
}: SliderFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onValueChange(Number(event.target.value))}
          aria-describedby={describedBy(id, hint, error)}
          aria-valuetext={formatValue(value)}
          className="accent-primary focus-visible:ring-ring h-2 w-full cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
        />
        <output htmlFor={id} className="w-14 text-right text-sm font-semibold tabular-nums">
          {formatValue(value)}
        </output>
      </div>
    </FieldShell>
  );
}
