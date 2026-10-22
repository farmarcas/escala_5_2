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
});

export const env = envSchema.parse(process.env);
