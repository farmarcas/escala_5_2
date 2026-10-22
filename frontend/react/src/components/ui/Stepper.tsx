import { cn } from '@/lib/cn';

export type StepItem = { id: string; label: string; done?: boolean };

type StepperProps = {
  steps: StepItem[];
  currentId: string;
  onSelect: (id: string) => void;
};

// Índice dos passos do cadastro: lateral em telas largas, faixa rolável em telas estreitas.
export function Stepper({ steps, currentId, onSelect }: StepperProps) {
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <nav aria-label="Passos do cadastro">
      <p className="text-muted-foreground mb-2 text-xs">
        {doneCount} de {steps.length} passos preenchidos
      </p>
      <div
        className="bg-li-30 mb-3 h-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
        aria-label="Progresso do cadastro"
      >
        <div
          className="bg-primary h-full transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {steps.map((step, index) => {
          const current = step.id === currentId;
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:outline-none',
                  current ? 'bg-accent text-primary-strong font-bold' : 'hover:bg-muted',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    step.done ? 'bg-primary text-primary-foreground' : 'bg-li-30 text-da-600',
                  )}
                >
                  {step.done ? '✓' : index + 1}
                </span>
                <span>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
