import Anthropic from '@anthropic-ai/sdk';

// Fronteira com o modelo: uma volta (uma chamada) com texto em fluxo. Os testes usam uma versão roteirizada.
export type ModelUsage = { input: number; output: number; cacheRead: number; cacheWrite: number };

export type ModelTurn = {
  content: Anthropic.ContentBlock[];
  stopReason: string | null;
  usage: ModelUsage;
};

export type ModelRequest = {
  system: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  tools: Anthropic.Tool[];
  onText: (delta: string) => void;
  signal?: AbortSignal;
};

export type ModelClient = { stream: (request: ModelRequest) => Promise<ModelTurn> };

export type RealClientOptions = {
  apiKey: string;
  model: string;
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  maxTokens?: number;
};

export function makeAnthropicClient(options: RealClientOptions): ModelClient {
  const client = new Anthropic({ apiKey: options.apiKey });
  return {
    async stream(request) {
      const stream = client.messages.stream(
        {
          model: options.model,
          max_tokens: options.maxTokens ?? 4000,
          system: request.system,
          tools: request.tools,
          messages: request.messages,
          output_config: { effort: options.effort },
        },
        request.signal ? { signal: request.signal } : undefined,
      );
      stream.on('text', request.onText);
      const message = await stream.finalMessage();
      return {
        content: message.content,
        stopReason: message.stop_reason,
        usage: {
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
          cacheRead: message.usage.cache_read_input_tokens ?? 0,
          cacheWrite: message.usage.cache_creation_input_tokens ?? 0,
        },
      };
    },
  };
}
