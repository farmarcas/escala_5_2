import type Anthropic from '@anthropic-ai/sdk';
import type { ModelClient, ModelRequest, ModelTurn } from './assistant.model-client.js';

// Modelo roteirizado para os testes: devolve as voltas na ordem, sem chamar a API.
export type FakeTurn = {
  text?: string;
  tools?: { name: string; input: unknown }[];
  stopReason?: string;
};

export function makeFakeModel(
  script: FakeTurn[] | ((request: ModelRequest, round: number) => FakeTurn),
) {
  const requests: ModelRequest[] = [];
  const client: ModelClient = {
    async stream(request) {
      requests.push(
        structuredClone({
          ...request,
          signal: undefined,
          onText: undefined,
        }) as unknown as ModelRequest,
      );
      const round = requests.length - 1;
      const turn =
        typeof script === 'function' ? script(request, round) : (script[round] ?? { text: 'Fim.' });
      const content: Anthropic.ContentBlock[] = [];
      if (turn.text) {
        request.onText(turn.text);
        content.push({ type: 'text', text: turn.text, citations: null } as Anthropic.TextBlock);
      }
      (turn.tools ?? []).forEach((t, i) =>
        content.push({
          type: 'tool_use',
          id: `tool_${round}_${i}`,
          name: t.name,
          input: t.input,
        } as Anthropic.ToolUseBlock),
      );
      return {
        content,
        stopReason: turn.stopReason ?? ((turn.tools?.length ?? 0) > 0 ? 'tool_use' : 'end_turn'),
        usage: { input: 100, output: 50, cacheRead: 0, cacheWrite: 0 },
      } satisfies ModelTurn;
    },
  };
  return { client, requests };
}
