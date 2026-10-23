import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { ContactFormModal, type ContactSnapshot } from '@/features/contact';
import { MiniMarkdown } from './MiniMarkdown';
import { ScenarioCard } from './ScenarioCard';
import { useAnalysis, type AnalysisContext } from './useAnalysis';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  context: AnalysisContext;
  snapshot: ContactSnapshot;
};

const SUGGESTIONS = [
  'O que mais pesa na folha?',
  'E se eu fechar mais cedo?',
  'Como posso contratar menos gente?',
  'Explique as regras aplicadas',
];

const MAX_PROMPT = 1000;

export function AssistantPanel({ isOpen, onClose, context, snapshot }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const { turns, running, activity, ask, cancel, clear } = useAnalysis(context);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    bottom.current?.scrollIntoView?.({ block: 'end' });
  }, [turns, activity]);

  const close = () => {
    cancel();
    onClose();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || running) return;
    setDraft('');
    void ask(text);
  };

  return (
    <>
      <dialog
        ref={ref}
        onClose={close}
        aria-labelledby="assistant-title"
        className="bg-surface text-foreground border-border fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-none flex-col border-l open:flex p-0 shadow-xl backdrop:bg-black/50 sm:w-[34rem]"
      >
        <header className="border-border flex items-start justify-between gap-3 border-b p-4">
          <div>
            <h2 id="assistant-title" className="font-display text-lg font-semibold">
              Análise com IA
            </h2>
            <p className="text-secondary-foreground text-xs">
              A IA só sugere. Você decide o que mudar.
            </p>
          </div>
          <div className="flex gap-2">
            {turns.length > 0 ? (
              <Button size="sm" variant="ghost" onClick={clear} disabled={running}>
                Nova conversa
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={close}>
              Fechar
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4" aria-live="polite">
          {turns.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                Eu leio o resultado da sua loja e explico em palavras simples o que pesa, o que vale
                testar e onde você pode mudar. Os números vêm do cálculo do Radar Escala.
              </p>
              <Button onClick={() => void ask(null)} disabled={running}>
                Analisar minha loja
              </Button>
              <p className="text-secondary-foreground text-xs">Ou pergunte algo:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} size="sm" variant="secondary" onClick={() => void ask(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {turns.map((turn) => (
            <article key={turn.id} className="flex flex-col gap-3">
              {turn.prompt ? (
                <p className="bg-selected text-selected-foreground self-end rounded-lg px-3 py-2 text-sm">
                  {turn.prompt}
                </p>
              ) : null}
              {turn.text ? <MiniMarkdown text={turn.text} /> : null}
              {turn.scenarios.map((s) => (
                <ScenarioCard
                  key={s.titulo}
                  scenario={s}
                  storeId={context.storeId}
                  onNavigate={close}
                />
              ))}
              {turn.warning ? (
                <p
                  role="status"
                  className="bg-warning-background text-warning rounded-md p-3 text-xs"
                >
                  {turn.warning}
                </p>
              ) : null}
              {turn.error ? (
                <p role="alert" className="bg-critical-bg text-critical rounded-md p-3 text-sm">
                  {turn.error}
                </p>
              ) : null}
            </article>
          ))}

          {running ? (
            <p role="status" className="text-secondary-foreground text-sm">
              {activity ?? 'Pensando'}…{' '}
              <button type="button" onClick={cancel} className="text-primary-strong underline">
                Parar
              </button>
            </p>
          ) : null}
          {turns.length > 0 && !running ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setContactOpen(true)}>
                Falar com um consultor
              </Button>
            </div>
          ) : null}
          <div ref={bottom} />
        </div>

        <footer className="border-border flex flex-col gap-2 border-t p-4">
          <form onSubmit={submit} className="flex flex-col gap-2">
            <label htmlFor="assistant-prompt" className="text-sm font-medium">
              Pergunte ou peça um cenário
            </label>
            <textarea
              id="assistant-prompt"
              value={draft}
              maxLength={MAX_PROMPT}
              rows={2}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex.: e se a loja fechar às 21h?"
              className="border-input bg-surface focus-visible:ring-halo w-full resize-none rounded-md border p-2 text-sm focus-visible:ring-4"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                {draft.length}/{MAX_PROMPT}
              </span>
              <Button type="submit" size="md" disabled={running || draft.trim() === ''}>
                Enviar
              </Button>
            </div>
          </form>
          <p className="text-muted-foreground text-xs">
            A análise usa os números da loja, sem nome, cidade nem dados pessoais. A conversa não
            fica guardada. A IA pode errar: confira no diagnóstico antes de decidir.
          </p>
        </footer>
      </dialog>
      <ContactFormModal
        isOpen={contactOpen}
        snapshot={snapshot}
        onClose={() => setContactOpen(false)}
      />
    </>
  );
}
