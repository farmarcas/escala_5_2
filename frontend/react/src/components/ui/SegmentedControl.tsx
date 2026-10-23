import { cn } from '@/lib/cn';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onValueChange: (value: T) => void;
};

// Escolha entre poucas opções lado a lado (ex.: 42h ou 40h). A opção escolhida usa o Azul Turno (seleção).
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="bg-muted inline-flex rounded-md p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'bg-selected text-selected-foreground font-semibold'
                : 'text-secondary-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
