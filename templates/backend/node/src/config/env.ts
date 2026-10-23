import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.coerce.number().default(1025),
  MAIL_FROM: z.string().default('Farmarcas <nao-responda@farmarcas.local>'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  // Sem chave, a consulta de contatos da equipe fica desligada.
  ADMIN_API_KEY: z.string().min(16).optional(),
  // Análise com IA: sem chave o assistente fica desligado e o app funciona igual.
  ANTHROPIC_API_KEY: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(10).optional()),
  ASSISTANT_MODEL: z.string().default('claude-sonnet-5-5'),
  ASSISTANT_EFFORT: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).default('medium'),
  // Limite técnico por conta contra abuso e laços (não é teto de custo).
  ASSISTANT_RATE_MAX: z.coerce.number().int().positive().default(20),
  ASSISTANT_RATE_WINDOW_MS: z.coerce.number().int().positive().default(600_000),
});

export const env = envSchema.parse(process.env);
