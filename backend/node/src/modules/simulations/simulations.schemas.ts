import { z } from 'zod';
import { ACTION_IDS } from './mitigations.js';

const emptyObject = z.object({}).strict().default({});

const premiseOverridesSchema = z
  .object({
    taxation: z
      .object({
        monthsPerYear: z.number().min(12).max(14),
        chargesRealPresumido: z.number().min(1).max(3),
        chargesSimples: z.number().min(1).max(3),
        irpjCsllRate: z.number().min(0).max(0.6),
      })
      .partial()
      .strict(),
    detailed: z
      .object({ absenceRate: z.number().min(0).max(0.5) })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type PremiseOverrides = z.infer<typeof premiseOverridesSchema>;

const storeMitigationSchema = z
  .object({
    hoursReductionPerWeek: z.number().min(0).max(168),
    actions: z.partialRecord(z.enum(ACTION_IDS), z.number().min(0).max(1)),
  })
  .partial()
  .strict();

const mitigationsSchema = z.record(z.uuid(), storeMitigationSchema);

const calcFields = {
  storeIds: z.array(z.uuid()).max(500).optional(),
  taxRegime: z.enum(['real', 'presumido', 'simples']).optional(),
  premiseOverrides: premiseOverridesSchema.optional(),
  mitigations: mitigationsSchema.optional(),
};

const name = z.string().trim().min(2).max(100);
const idParams = z.object({ id: z.uuid() }).strict();

export const previewRequestSchema = z.object({
  body: z.object(calcFields).strict().default({}),
  params: emptyObject,
  query: emptyObject,
});

export const createSimulationRequestSchema = z.object({
  body: z.object({ ...calcFields, name }).strict(),
  params: emptyObject,
  query: emptyObject,
});

export const listSimulationsRequestSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(20),
    })
    .strict(),
});

export const getSimulationRequestSchema = z.object({
  body: emptyObject,
  params: idParams,
  query: emptyObject,
});

export const deleteSimulationRequestSchema = getSimulationRequestSchema;

export const renameSimulationRequestSchema = z.object({
  body: z.object({ name }).strict(),
  params: idParams,
  query: emptyObject,
});

export const copySimulationRequestSchema = renameSimulationRequestSchema;

export const compareSimulationsRequestSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: z
    .object({
      ids: z
        .string()
        .transform((value) => value.split(',').map((id) => id.trim()))
        .pipe(
          z.array(z.uuid()).min(2, 'Escolha ao menos 2 simulações').max(4, 'Compare no máximo 4'),
        ),
    })
    .strict(),
});
