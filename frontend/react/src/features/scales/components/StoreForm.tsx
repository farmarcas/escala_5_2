import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import { fieldErrorsOf, usePreview, type FieldErrors } from '../hooks/usePreview';
import type { ScaleStoreDraft } from '../types';
import { HolidaysStep } from './HolidaysStep';
import { HoursStep } from './HoursStep';
import { IdentityStep } from './IdentityStep';
import { LivePreview } from './LivePreview';
import { PlantaoStep } from './PlantaoStep';
import { RulesStep } from './RulesStep';
import { TeamStep } from './TeamStep';

type StepId = 'identidade' | 'horario' | 'plantao' | 'equipe' | 'regras' | 'feriados';

const STEPS: { id: StepId; label: string; prefixes: string[] }[] = [
  {
    id: 'identidade',
    label: 'Identificação e tributação',
    prefixes: ['name', 'city', 'state', 'scaleStartDate', 'taxRegime'],
  },
  { id: 'horario', label: 'Horário de funcionamento', prefixes: ['hours'] },
  { id: 'plantao', label: 'Plantão noturno', prefixes: ['plantao'] },
  { id: 'equipe', label: 'Equipe por função', prefixes: ['roles'] },
  { id: 'regras', label: 'Regras, benefícios e encargos', prefixes: ['rules'] },
  { id: 'feriados', label: 'Feriados', prefixes: ['holidays'] },
];

type Props = {
  initial: ScaleStoreDraft;
  isNew: boolean;
  onSave: (draft: ScaleStoreDraft) => Promise<void>;
};

export function StoreForm({ initial, isNew, onSave }: Props) {
  const [draft, setDraft] = useState(initial);
  const [step, setStep] = useState<StepId>('identidade');
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const preview = usePreview(draft);
  const save = useSubmit(async (d: ScaleStoreDraft) => {
    try {
      await onSave(d);
    } catch (error) {
      setServerErrors(fieldErrorsOf(error));
      throw error;
    }
  });

  const errors = useMemo<FieldErrors>(
    () => (preview.status === 'invalid' ? { ...preview.errors, ...serverErrors } : serverErrors),
    [preview, serverErrors],
  );

  const update = (patch: Partial<ScaleStoreDraft>) => {
    setServerErrors({});
    setDraft((d) => ({ ...d, ...patch }));
  };

  const hasError = (prefixes: string[]) =>
    Object.keys(errors).some((path) =>
      prefixes.some((p) => path === p || path.startsWith(`${p}.`)),
    );

  const steps: StepItem[] = STEPS.map((s) => ({
    id: s.id,
    label: s.label,
    done: preview.status === 'ready' || (preview.status === 'invalid' && !hasError(s.prefixes)),
  }));
  const index = STEPS.findIndex((s) => s.id === step);
  const current = STEPS[index]!;

  const body = {
    identidade: <IdentityStep draft={draft} errors={errors} onChange={update} />,
    horario: <HoursStep draft={draft} errors={errors} onChange={update} />,
    plantao: <PlantaoStep draft={draft} errors={errors} onChange={update} />,
    equipe: <TeamStep draft={draft} errors={errors} onChange={update} />,
    regras: <RulesStep draft={draft} errors={errors} onChange={update} />,
    feriados: <HolidaysStep draft={draft} errors={errors} onChange={update} />,
  }[step];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save.submit(draft);
      }}
      className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)_14rem]"
    >
      <div className="lg:col-start-1">
        <Stepper steps={steps} currentId={step} onSelect={(id) => setStep(id as StepId)} />
      </div>

      <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
        {isNew ? (
          <FormMessage tone="success">
            Loja de exemplo: substitua pelos dados da sua loja.
          </FormMessage>
        ) : null}
        <section
          className="border-border bg-background rounded-lg border p-5"
          aria-labelledby="step-title"
        >
          <h2 id="step-title" className="mb-4 text-lg font-bold">
            Passo {index + 1} · {current.label}
          </h2>
          {body}
        </section>
        <p className="text-muted-foreground text-xs">
          Vendas, CMV e meta da folha entram na próxima etapa do painel.
        </p>
        {save.error ? <FormMessage tone="error">{save.error}</FormMessage> : null}
        {preview.status === 'invalid' && Object.keys(errors).length > 0 ? (
          <FormMessage tone="error">
            Há campos para ajustar antes de salvar (veja os destaques).
          </FormMessage>
        ) : null}
        <div className="flex flex-wrap justify-between gap-3">
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => setStep(STEPS[index - 1]!.id)}
          >
            Voltar
          </Button>
          <div className="flex gap-3">
            {index < STEPS.length - 1 ? (
              <Button variant="secondary" onClick={() => setStep(STEPS[index + 1]!.id)}>
                Próximo passo
              </Button>
            ) : null}
            <Button type="submit" disabled={save.isSubmitting}>
              {save.isSubmitting ? 'Salvando…' : isNew ? 'Salvar loja' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:col-start-3 lg:row-start-1">
        <LivePreview preview={preview} />
      </div>
    </form>
  );
}
