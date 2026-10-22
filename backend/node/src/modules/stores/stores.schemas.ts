import { z } from 'zod';

const MAX_PAGE_SIZE = 100;
const emptyObject = z.object({}).strict().default({});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');
const closingTime = z.union([time, z.literal('24:00')]);

export const openingHourSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    opensAt: time,
    closesAt: closingTime,
  })
  .strict()
  .refine((day) => day.opensAt !== day.closesAt, {
    message: 'Abertura e fechamento não podem ser iguais (para 24 horas use 00:00 até 24:00)',
    path: ['closesAt'],
  });

export const openingHoursSchema = z
  .array(openingHourSchema)
  .min(1, 'Informe ao menos um dia de funcionamento')
  .max(7)
  .refine((days) => new Set(days.map((day) => day.weekday)).size === days.length, {
    message: 'Há dias da semana repetidos',
  });

export const storeRoleSchema = z
  .object({
    role: z.enum(['farmaceutico', 'balconista', 'caixa', 'estoquista']),
    minPerShift: z.number().int().min(0).max(50),
    headcount: z.number().int().min(0).max(500),
    weeklyHours: z.number().min(1).max(44),
    monthlySalary: z.number().positive().max(1_000_000),
    absenceRate: z.number().min(0).max(0.5).nullable().optional(),
  })
  .strict();

export const storeRolesSchema = z
  .array(storeRoleSchema)
  .max(4)
  .superRefine((roles, ctx) => {
    if (new Set(roles.map((role) => role.role)).size !== roles.length) {
      ctx.addIssue({ code: 'custom', message: 'Há funções repetidas' });
    }
    const pharmacist = roles.find((role) => role.role === 'farmaceutico');
    if (!pharmacist) {
      ctx.addIssue({ code: 'custom', message: 'Toda loja precisa de farmacêutico' });
    } else if (pharmacist.minPerShift < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'O farmacêutico é obrigatório durante a abertura: o mínimo por turno é 1',
        path: [roles.indexOf(pharmacist), 'minPerShift'],
      });
    }
  });

const storeShape = {
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  profile: z.enum(['rua', 'shopping', '24h']),
  openingHours: openingHoursSchema,
  roles: storeRolesSchema,
};

export const createStoreSchema = z.object(storeShape).strict();
export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const updateStoreSchema = z
  .object(storeShape)
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' });
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

const idParams = z.object({ id: z.uuid() }).strict();

export const listStoresRequestSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
    })
    .strict(),
});

export const createStoreRequestSchema = z.object({
  body: createStoreSchema,
  params: emptyObject,
  query: emptyObject,
});

export const getStoreRequestSchema = z.object({
  body: emptyObject,
  params: idParams,
  query: emptyObject,
});

export const updateStoreRequestSchema = z.object({
  body: updateStoreSchema,
  params: idParams,
  query: emptyObject,
});

export const deleteStoreRequestSchema = getStoreRequestSchema;
