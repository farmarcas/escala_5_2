import { cn } from '@/lib/cn';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const NAMES = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
];

type DaySelectorProps = { label: string; mask: number; onMaskChange: (mask: number) => void };

// Sete botões de dia da semana; a máscara usa 1 bit por dia (segunda = bit 0).
export function DaySelector({ label, mask, onMaskChange }: DaySelectorProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1">
      {DAYS.map((day, index) => {
        const on = (mask & (1 << index)) !== 0;
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            aria-label={NAMES[index]}
            onClick={() => onMaskChange(mask ^ (1 << index))}
            className={cn(
              'h-9 min-w-10 rounded-md border px-2 text-xs font-semibold',
              on
                ? 'border-blue-turn bg-blue-turn text-white'
                : 'border-input bg-surface text-secondary-foreground hover:bg-muted',
            )}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}
