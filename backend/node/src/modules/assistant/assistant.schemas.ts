import { z } from 'zod';

const emptyObject = z.object({}).strict().default({});

const historyMessage = z
  .object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })
  .strict();

export const analyzeRequestSchema = z.object({
  body: z
    .object({
      storeId: z.uuid(),
      scenario: z.enum(['5x2_42', '5x2_40']).default('5x2_42'),
      regime: z.enum(['simples', 'lucro_presumido_real']).optional(),
      provisions: z.boolean().optional(),
      prompt: z.string().trim().max(1000).optional(),
      history: z.array(historyMessage).max(8).default([]),
    })
    .strict(),
  params: emptyObject,
  query: emptyObject,
});

export const statusRequestSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: emptyObject,
});
