import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalysisEvent, ScenarioResult } from './types';

export type Turn = {
  id: number;
  prompt: string | null;
  text: string;
  scenarios: ScenarioResult[];
  warning?: string;
  error?: string;
};

export type AnalysisContext = {
  storeId: string;
  scenario: '5x2_42' | '5x2_40';
  regime: 'simples' | 'lucro_presumido_real';
  provisions: boolean;
};

const UNAVAILABLE = 'A IA está indisponível agora. O painel continua funcionando.';

// Lê o fluxo (SSE sobre POST): cada evento vem como "data: {json}" separado por linha em branco.
export async function readEvents(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: AnalysisEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      if (!chunk.startsWith('data: ')) continue;
      try {
        onEvent(JSON.parse(chunk.slice(6)) as AnalysisEvent);
      } catch {
        // pedaço malformado: ignora
      }
    }
  }
}

const toHistory = (turns: Turn[]) =>
  turns
    .filter((t) => t.text && !t.error)
    .flatMap((t) => [
      {
        role: 'user' as const,
        content: (t.prompt ?? 'Faça a análise completa da minha loja.').slice(0, 1000),
      },
      { role: 'assistant' as const, content: t.text.slice(0, 4000) },
    ])
    .slice(-8);

export function useAnalysis(context: AnalysisContext) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [running, setRunning] = useState(false);
  const [activity, setActivity] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const nextId = useRef(1);
  const turnsRef = useRef<Turn[]>([]);
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const cancel = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setRunning(false);
    setActivity(null);
  }, []);

  useEffect(() => cancel, [cancel]);

  const ask = useCallback(
    async (prompt: string | null) => {
      if (abort.current) return;
      const controller = new AbortController();
      abort.current = controller;
      const id = nextId.current++;
      const history = toHistory(turnsRef.current);
      const patch = (fn: (t: Turn) => Turn) =>
        setTurns((all) => all.map((t) => (t.id === id ? fn(t) : t)));
      setTurns((all) => [...all, { id, prompt, text: '', scenarios: [] }]);
      setRunning(true);
      setActivity('Começando a análise');

      const onEvent = (event: AnalysisEvent) => {
        if (event.type === 'text') patch((t) => ({ ...t, text: t.text + event.text }));
        else if (event.type === 'reset') patch((t) => ({ ...t, text: '' }));
        else if (event.type === 'tool') setActivity(event.label);
        else if (event.type === 'scenario')
          patch((t) =>
            t.scenarios.some((s) => s.titulo === event.scenario.titulo)
              ? t
              : { ...t, scenarios: [...t.scenarios, event.scenario] },
          );
        else if (event.type === 'done') patch((t) => ({ ...t, warning: event.warning }));
        else patch((t) => ({ ...t, error: event.message }));
      };

      try {
        const response = await fetch('/api/v1/assistant/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          signal: controller.signal,
          body: JSON.stringify({
            ...context,
            ...(prompt && { prompt }),
            ...(history.length > 0 && { history }),
          }),
        });
        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          patch((t) => ({ ...t, error: data?.error?.message ?? UNAVAILABLE }));
        } else {
          await readEvents(response.body, onEvent);
        }
      } catch {
        if (!controller.signal.aborted) patch((t) => ({ ...t, error: UNAVAILABLE }));
      } finally {
        if (abort.current === controller) abort.current = null;
        setRunning(false);
        setActivity(null);
      }
    },
    [context],
  );

  const clear = useCallback(() => {
    cancel();
    setTurns([]);
  }, [cancel]);

  return { turns, running, activity, ask, cancel, clear };
}
