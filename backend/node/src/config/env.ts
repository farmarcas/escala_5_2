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
  // Servidor de e-mail real (produção): com usuário e senha a API autentica e usa conexão segura.
  MAIL_USER: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  MAIL_PASSWORD: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  // Vazio: segura só na porta 465 (as demais usam STARTTLS quando o servidor oferece).
  MAIL_SECURE: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  ),
  // Quantos proxies existem na frente da API (0 = nenhum). Atrás do Coolify + nginx da tela são 2.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
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

// Em produção a API recusa subir com uma configuração que vazaria sessão ou e-mail.
export const productionProblems = (e: z.infer<typeof envSchema>): string[] => {
  if (e.NODE_ENV !== 'production') return [];
  const problems: string[] = [];
  if (!e.COOKIE_SECURE) problems.push('COOKIE_SECURE precisa ser "true"');
  if (!e.APP_BASE_URL.startsWith('https://'))
    problems.push('APP_BASE_URL precisa começar com https://');
  if (!e.MAIL_USER || !e.MAIL_PASSWORD) problems.push('MAIL_USER e MAIL_PASSWORD são obrigatórios');
  return problems;
};

const parsed = envSchema.parse(process.env);
const problems = productionProblems(parsed);
if (problems.length > 0) {
  throw new Error(`Configuração de produção insegura: ${problems.join('; ')}`);
}

export const env = parsed;
