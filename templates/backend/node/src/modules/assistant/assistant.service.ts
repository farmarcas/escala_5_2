import type Anthropic from '@anthropic-ai/sdk';
import type { ScaleStoreInput } from '../scales/scales.schemas.js';
import { untraceableNumbers } from './assistant.numbers.js';
import type { ModelClient, ModelUsage } from './assistant.model-client.js';
import { SYSTEM_PROMPT } from './assistant.prompt.js';
import { toModelStore } from './assistant.sanitize.js';
import { makeToolbox, type ScenarioResult, type ToolName } from './assistant.tools.js';

// Laço da análise: pergunta ao modelo, executa as ferramentas que ele pedir (só leitura e cálculo), confere os
// números da resposta e conta tudo à tela em eventos. Não grava nada e não guarda texto de conversa.

export type AnalysisEvent =
  | { type: 'text'; text: string }
  | { type: 'reset' }
  | { type: 'tool'; label: string }
  | { type: 'scenario'; scenario: ScenarioResult }
  | { type: 'done'; warning?: string }
  | { type: 'error'; code: 'refusal' | 'unavailable' | 'too_long'; message: string };

export type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export type AnalysisInput = {
  store: ScaleStoreInput;
  scenario: '5x2_42' | '5x2_40';
  prompt?: string;
  history?: HistoryMessage[];
  model: ModelClient;
  emit: (event: AnalysisEvent) => void;
  signal?: AbortSignal;
};

export type AnalysisReport = {
  rounds: number;
  tools: string[];
  usage: ModelUsage;
  outcome: 'done' | 'refusal' | 'error' | 'aborted' | 'too_long';
};

export const DEFAULT_REQUEST = 'Faça a análise completa da minha loja.';
const MAX_ROUNDS = 8;

const TOOL_LABEL: Record<ToolName, string> = {
  ler_diagnostico: 'Lendo o resultado da sua loja',
  ler_escala_resumida: 'Olhando a escala da função',
  ler_regras_aplicadas: 'Consultando as regras aplicadas',
  simular_mudanca: 'Calculando um cenário',
};

// O que a pessoa digita é dado: sem chaves de marcação que quebrem a estrutura da mensagem.
const clean = (text: string) =>
  Array.from(text.replace(/[<>]/g, ' '))
    .filter((ch) => ch.charCodeAt(0) >= 32 || ch === '\n' || ch === '\t')
    .join('');

export function buildMessages(
  input: Pick<AnalysisInput, 'store' | 'scenario' | 'prompt' | 'history'>,
) {
  const context =
    `<loja>${JSON.stringify(toModelStore(input.store))}</loja>\n` +
    `<cenario>${input.scenario}</cenario>\n`;
  const history = input.history ?? [];
  const request = clean(input.prompt?.trim() || DEFAULT_REQUEST);
  const messages: Anthropic.MessageParam[] = [];
  if (history.length === 0) {
    messages.push({ role: 'user', content: `${context}<pedido>${request}</pedido>` });
  } else {
    history.forEach((m, i) => {
      messages.push({
        role: m.role,
        content: i === 0 ? `${context}<pedido>${clean(m.content)}</pedido>` : clean(m.content),
      });
    });
    messages.push({ role: 'user', content: `<pedido>${request}</pedido>` });
  }
  return messages;
}

const textOf = (content: Anthropic.ContentBlock[]) =>
  content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisReport> {
  const toolbox = makeToolbox({ store: input.store, defaultScenario: input.scenario });
  const messages = buildMessages(input);
  const report: AnalysisReport = {
    rounds: 0,
    tools: [],
    usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    outcome: 'done',
  };
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
  ];
  let corrected = false;

  try {
    while (report.rounds < MAX_ROUNDS) {
      if (input.signal?.aborted) {
        report.outcome = 'aborted';
        return report;
      }
      report.rounds += 1;
      const turn = await input.model.stream({
        system,
        messages,
        tools: toolbox.definitions,
        signal: input.signal,
        onText: (text) => input.emit({ type: 'text', text }),
      });
      report.usage.input += turn.usage.input;
      report.usage.output += turn.usage.output;
      report.usage.cacheRead += turn.usage.cacheRead;
      report.usage.cacheWrite += turn.usage.cacheWrite;

      if (turn.stopReason === 'refusal') {
        report.outcome = 'refusal';
        input.emit({
          type: 'error',
          code: 'refusal',
          message:
            'A IA não pôde responder a esse pedido. Tente escrever de outro jeito ou fale com um consultor Farmarcas.',
        });
        return report;
      }

      const toolCalls = turn.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );
      if (toolCalls.length > 0) {
        messages.push({ role: 'assistant', content: turn.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const call of toolCalls) {
          report.tools.push(call.name);
          input.emit({ type: 'tool', label: TOOL_LABEL[call.name as ToolName] ?? 'Calculando' });
          const outcome = await toolbox.run(call.name, call.input);
          if (outcome.scenario) input.emit({ type: 'scenario', scenario: outcome.scenario });
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: outcome.content,
            ...(outcome.isError && { is_error: true }),
          });
        }
        messages.push({ role: 'user', content: results });
        continue;
      }

      // Resposta final: confere se todo número escrito veio de uma ferramenta.
      const text = textOf(turn.content);
      const bad = untraceableNumbers(text, toolbox.numbers);
      if (bad.length > 0 && !corrected) {
        corrected = true;
        input.emit({ type: 'reset' });
        messages.push({ role: 'assistant', content: turn.content });
        messages.push({
          role: 'user',
          content: `Estes números da sua resposta não vieram das ferramentas: ${bad.join(', ')}. Refaça a resposta usando só números que as ferramentas devolveram nesta análise (chame as ferramentas que faltarem).`,
        });
        continue;
      }
      const warnings: string[] = [];
      if (bad.length > 0)
        warnings.push(
          'Alguns números acima não vieram do cálculo do Radar Escala. Confira no diagnóstico antes de decidir.',
        );
      if (turn.stopReason === 'max_tokens')
        warnings.push('A resposta foi cortada por tamanho. Peça de novo uma parte menor.');
      input.emit({ type: 'done', ...(warnings.length > 0 && { warning: warnings.join(' ') }) });
      return report;
    }
    report.outcome = 'too_long';
    input.emit({
      type: 'error',
      code: 'too_long',
      message: 'A análise ficou longa demais. Tente um pedido mais simples.',
    });
    return report;
  } catch {
    if (input.signal?.aborted) {
      report.outcome = 'aborted';
      return report;
    }
    report.outcome = 'error';
    input.emit({
      type: 'error',
      code: 'unavailable',
      message: 'A IA está indisponível agora. O painel continua funcionando.',
    });
    return report;
  }
}
