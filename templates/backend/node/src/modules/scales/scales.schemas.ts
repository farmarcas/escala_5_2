import { z } from 'zod';
import { buildWeekHours } from './engine/coverage.js';
import { roleWindows } from './engine/coverage.js';
import { SUNDAY, windowLength, weekdayOf } from './engine/time.js';

const emptyObject = z.object({}).strict().default({});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:MM');
const day = z.number().int().min(0).max(6);
const mask = z.number().int().min(0).max(127);

export const SCALE_ROLES = [
  'farmaceutico',
  'gerente',
  'subgerente',
  'balconista',
  'caixa',
  'perfumista',
  'servicos_gerais',
  'entregador',
  'comprador',
  'conferente',
  'atendente_digital',
  'expedicao',
] as const;
export type ScaleRoleName = (typeof SCALE_ROLES)[number];

export const hoursSchema = z
  .object({
    always24h: z.boolean(),
    standard: z.object({ start: time, end: time, daysMask: mask }).strict(),
    overrides: z
      .partialRecord(
        z.coerce.number().pipe(day).transform(String),
        z.union([
          z.object({ closed: z.literal(true) }).strict(),
          z.object({ start: time, end: time }).strict(),
        ]),
      )
      .default({}),
  })
  .strict()
  .refine((h) => h.always24h || h.standard.start !== h.standard.end, {
    message: 'Abertura e fechamento não podem ser iguais (para 24 horas use a opção "24 horas")',
    path: ['standard', 'end'],
  });

export const rulesSchema = z
  .object({
    sundayRule: z.enum(['um_em_tres', 'um_em_dois', 'todo_domingo']),
    lunchMinutes: z.number().int().min(30).max(120),
    snackMinutes: z.number().int().min(0).max(30),
    provisions: z.boolean(),
    // Na 12x36 o intervalo não gozado é pago com 50% de acréscimo.
    indemnifyBreak: z.boolean().default(true),
    rat: z.number().min(0).max(0.06),
    thirdParty: z.number().min(0).max(0.1),
    transport: z
      .object({ tripsPerDay: z.number().int().min(0).max(4), fare: z.number().min(0).max(50) })
      .strict(),
    benefits: z.number().min(0).max(10_000),
  })
  .strict();

export const roleSchema = z
  .object({
    role: z.enum(SCALE_ROLES),
    enabled: z.boolean(),
    headcount: z.number().int().min(0).max(200),
    monthlySalary: z.number().min(0).max(1_000_000),
    scaleType: z.enum(['normal', 'doze_x_trinta_e_seis']),
    minInHall: z.number().int().min(0).max(50),
    coverage: z.union([
      z.object({ mode: z.literal('all') }).strict(),
      z.object({ mode: z.literal('band'), start: time, end: time }).strict(),
    ]),
    daysMask: mask,
    ownerIsPharmacist: z.boolean(),
    motorcycle: z.boolean(),
  })
  .strict();

const storeShape = z
  .object({
    name: z.string().trim().min(2).max(100),
    city: z.string().trim().min(2).max(100),
    state: z.string().regex(/^[A-Z]{2}$/, 'Use a sigla da UF, por exemplo MG'),
    scaleStartDate: z.iso.date(),
    taxRegime: z.enum(['simples', 'lucro_presumido_real']),
    hours: hoursSchema,
    rules: rulesSchema,
    roles: z.array(roleSchema).min(1).max(SCALE_ROLES.length),
  })
  .strict();

// Regras que dependem de mais de um campo.
export const scaleStoreSchema = storeShape.superRefine((store, ctx) => {
  if (weekdayOf(store.scaleStartDate) !== 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'O início da escala precisa ser uma segunda-feira',
      path: ['scaleStartDate'],
    });
  }
  if (new Set(store.roles.map((r) => r.role)).size !== store.roles.length) {
    ctx.addIssue({ code: 'custom', message: 'Há funções repetidas', path: ['roles'] });
  }
  const pharmacistIndex = store.roles.findIndex((r) => r.role === 'farmaceutico');
  const pharmacist = store.roles[pharmacistIndex];
  if (!pharmacist || !pharmacist.enabled || pharmacist.headcount < 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Toda farmácia precisa de ao menos 1 farmacêutico (Lei 13.021/2014)',
      path: ['roles', Math.max(pharmacistIndex, 0), 'headcount'],
    });
  } else if (
    pharmacist.minInHall < 1 ||
    pharmacist.coverage.mode !== 'all' ||
    pharmacist.daysMask !== 127
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'O farmacêutico precisa estar presente em todo o horário de funcionamento',
      path: ['roles', pharmacistIndex],
    });
  }
  store.roles.forEach((role, i) => {
    if (role.role === 'entregador' || !role.motorcycle) return;
    ctx.addIssue({
      code: 'custom',
      message: 'Só o entregador usa moto',
      path: ['roles', i, 'motorcycle'],
    });
  });
  if (store.rules.sundayRule === 'todo_domingo') {
    const week = buildWeekHours(store.hours as Parameters<typeof buildWeekHours>[0]);
    const opensSunday = store.roles.some(
      (r) => r.enabled && r.minInHall > 0 && windowLength(roleWindows(r, week)[SUNDAY] ?? null) > 0,
    );
    if (opensSunday) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Com folga em todo domingo a loja não pode abrir no domingo: escolha outra regra ou feche a loja no domingo',
        path: ['rules', 'sundayRule'],
      });
    }
  }
});

export type ScaleStoreInput = z.infer<typeof scaleStoreSchema>;
export type ScaleRoleInput = z.infer<typeof roleSchema>;

const idParams = z.object({ id: z.uuid() }).strict();

export const listRequestSchema = z.object({
  body: emptyObject,
  params: emptyObject,
  query: emptyObject,
});
export const diagnosticRequestSchema = z.object({
  body: emptyObject,
  params: idParams,
  query: z
    .object({
      regime: z.enum(['simples', 'lucro_presumido_real']).optional(),
      provisions: z.enum(['true', 'false']).optional(),
    })
    .strict(),
});
export const idRequestSchema = z.object({
  body: emptyObject,
  params: idParams,
  query: emptyObject,
});
export const bodyRequestSchema = z.object({
  body: scaleStoreSchema,
  params: emptyObject,
  query: emptyObject,
});
export const updateRequestSchema = z.object({
  body: scaleStoreSchema,
  params: idParams,
  query: emptyObject,
});

export const rosterRequestSchema = z.object({
  body: emptyObject,
  params: idParams,
  query: z.object({ scenario: z.enum(['6x1_44', '5x2_42', '5x2_40']).default('5x2_42') }).strict(),
});
