import { z } from 'zod';

const emptyObject = z.object({}).strict().default({});

// Aceita (11) 98888-7777, 11988887777, +55 11 98888-7777. Guarda sempre no formato (DD) 9XXXX-XXXX.
export const normalizePhone = (raw: string): string | null => {
  let digits = raw.replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55'))
    digits = digits.slice(2);
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return null;
};

const phone = z
  .string()
  .max(30)
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'Informe um telefone com DDD' });
      return z.NEVER;
    }
    return normalized;
  });

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const snapshot = z.record(z.string(), z.unknown());

export const createContactRequestSchema = z.object({
  body: z
    .object({
      source: z.enum(['consultor', 'pdf']),
      name: text(2, 100),
      roleTitle: text(2, 100),
      company: text(2, 150),
      phone,
      email: z.string().trim().toLowerCase().email().max(254),
      sector: z.string().trim().max(100).optional(),
      acceptPrivacy: z.literal(true, { error: 'É preciso aceitar a política de privacidade' }),
      mode: z.enum(['rapido', 'detalhado']),
      profile: snapshot,
      result: snapshot,
      idempotencyKey: z.string().min(8).max(100),
      utm: z.string().max(500).optional(),
      // Campo isca: pessoas não o veem; robôs costumam preenchê-lo.
      website: z.string().max(500).optional(),
    })
    .strict(),
  params: emptyObject,
  query: emptyObject,
});

export const listContactRequestsSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(200).default(50),
      format: z.enum(['json', 'csv']).default('json'),
    })
    .strict(),
});

export const anonymizeContactRequestSchema = z.object({
  body: emptyObject,
  params: z.object({ id: z.uuid() }).strict(),
  query: emptyObject,
});
