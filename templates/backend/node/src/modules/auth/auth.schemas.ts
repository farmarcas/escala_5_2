import { z } from 'zod';

const emptyObject = z.object({}).strict().default({});

const email = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z
  .string()
  .min(10, 'A senha precisa ter ao menos 10 caracteres')
  .max(128);
const token = z.string().min(20).max(200);

const request = <B extends z.ZodType>(body: B) =>
  z.object({ body, params: emptyObject, query: emptyObject });

export const registerRequestSchema = request(
  z
    .object({
      name: z.string().trim().min(2).max(100),
      email,
      password: passwordSchema,
      groupName: z.string().trim().min(2).max(100),
      acceptPrivacy: z.literal(true, { error: 'É preciso aceitar a política de privacidade' }),
    })
    .strict(),
);

export const verifyEmailRequestSchema = request(z.object({ token }).strict());

export const loginRequestSchema = request(
  z.object({ email, password: z.string().min(1).max(128) }).strict(),
);

export const forgotPasswordRequestSchema = request(z.object({ email }).strict());

export const resetPasswordRequestSchema = request(
  z.object({ token, password: passwordSchema }).strict(),
);

export const deleteAccountRequestSchema = request(
  z.object({ password: z.string().min(1).max(128) }).strict(),
);

export const updateGroupRequestSchema = request(
  z
    .object({
      name: z.string().trim().min(2).max(100),
      taxRegime: z.enum(['real', 'presumido', 'simples']),
      annualRevenue: z.number().positive().max(1e13).nullable(),
    })
    .partial()
    .strict()
    .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' }),
);
