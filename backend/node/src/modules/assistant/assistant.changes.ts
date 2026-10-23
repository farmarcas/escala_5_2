import { z } from 'zod';
import { scaleStoreSchema, SCALE_ROLES, type ScaleStoreInput } from '../scales/scales.schemas.js';

// Mudanças que a IA pode simular numa cópia da loja: lista fechada, com limites. Nada aqui grava dados.
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const role = z.enum(SCALE_ROLES);
const day = z.number().int().min(0).max(6);

export const changeSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('horario_padrao'), abre: time, fecha: time }).strict(),
  z
    .object({
      tipo: z.literal('horario_dia'),
      dia: day,
      fechado: z.boolean().optional(),
      abre: time.optional(),
      fecha: time.optional(),
    })
    .strict(),
  z.object({ tipo: z.literal('vinte_e_quatro_horas'), ligado: z.boolean() }).strict(),
  z
    .object({
      tipo: z.literal('almoco'),
      minutos: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(120)]),
    })
    .strict(),
  z
    .object({
      tipo: z.literal('lanche'),
      minutos: z.union([z.literal(0), z.literal(10), z.literal(15), z.literal(20)]),
    })
    .strict(),
  z
    .object({
      tipo: z.literal('folga_dominical'),
      regra: z.enum(['um_em_tres', 'um_em_dois', 'todo_domingo']),
    })
    .strict(),
  z
    .object({
      tipo: z.literal('plantao'),
      plantao: z.enum(['none', 'weekly', 'monthly']),
      cobertura: z.enum(['team', 'intermittent']).optional(),
      indenizarIntervalo: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      tipo: z.literal('feriados'),
      abreNosFeriados: z.boolean().optional(),
      compensacao: z.enum(['folga', 'dobro']).optional(),
      rodizio: z.enum(['rotativa', 'fixa']).optional(),
    })
    .strict(),
  z
    .object({
      tipo: z.literal('quantidade'),
      funcao: role,
      quantidade: z.number().int().min(0).max(200),
    })
    .strict(),
  z
    .object({ tipo: z.literal('salario'), funcao: role, salario: z.number().min(0).max(100_000) })
    .strict(),
  z.object({ tipo: z.literal('escala_12x36'), funcao: role, ligado: z.boolean() }).strict(),
  z
    .object({
      tipo: z.literal('faixa'),
      funcao: role,
      todoFuncionamento: z.boolean().optional(),
      inicio: time.optional(),
      fim: time.optional(),
    })
    .strict(),
  z
    .object({ tipo: z.literal('dias_da_funcao'), funcao: role, dias: z.array(day).min(1).max(7) })
    .strict(),
  z
    .object({ tipo: z.literal('regime'), regime: z.enum(['simples', 'lucro_presumido_real']) })
    .strict(),
  z.object({ tipo: z.literal('provisoes'), ligado: z.boolean() }).strict(),
]);

export type Change = z.infer<typeof changeSchema>;
export type ChangeStep = 'horario' | 'plantao' | 'equipe' | 'regras' | 'vendas' | 'feriados';

export class ChangeError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(' · '));
  }
}

export type AppliedChange = { descricao: string; passo: ChangeStep };

const DAY_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

// Aplica as mudanças numa cópia profunda e valida com as mesmas regras do cadastro.
export function applyChanges(
  base: ScaleStoreInput,
  changes: readonly Change[],
): { store: ScaleStoreInput; applied: AppliedChange[] } {
  const store = structuredClone(base);
  const applied: AppliedChange[] = [];
  const roleOf = (r: (typeof SCALE_ROLES)[number]) => {
    const found = store.roles.find((x) => x.role === r);
    if (!found) throw new ChangeError([`A função ${r} não existe nesta loja.`]);
    return found;
  };

  for (const c of changes) {
    switch (c.tipo) {
      case 'horario_padrao':
        store.hours.standard.start = c.abre;
        store.hours.standard.end = c.fecha;
        store.hours.always24h = false;
        applied.push({
          descricao: `Horário de funcionamento das ${c.abre} às ${c.fecha}`,
          passo: 'horario',
        });
        break;
      case 'horario_dia': {
        const key = String(c.dia);
        delete store.hours.overrides[key];
        if (c.fechado) {
          store.hours.standard.daysMask &= ~(1 << c.dia);
          store.hours.overrides[key] = { closed: true };
        } else if (c.abre && c.fecha) {
          store.hours.overrides[key] = { start: c.abre, end: c.fecha };
        } else {
          store.hours.standard.daysMask |= 1 << c.dia;
        }
        applied.push({
          descricao: c.fechado
            ? `Fechar na ${DAY_NAMES[c.dia]}`
            : c.abre && c.fecha
              ? `Horário da ${DAY_NAMES[c.dia]}: ${c.abre} às ${c.fecha}`
              : `Abrir na ${DAY_NAMES[c.dia]} no horário padrão`,
          passo: 'horario',
        });
        break;
      }
      case 'vinte_e_quatro_horas':
        store.hours.always24h = c.ligado;
        applied.push({
          descricao: c.ligado ? 'Funcionar 24 horas' : 'Deixar de funcionar 24 horas',
          passo: 'horario',
        });
        break;
      case 'almoco':
        store.rules.lunchMinutes = c.minutos;
        applied.push({ descricao: `Almoço de ${c.minutos} minutos`, passo: 'regras' });
        break;
      case 'lanche':
        store.rules.snackMinutes = c.minutos;
        applied.push({
          descricao: c.minutos === 0 ? 'Sem lanche pago' : `Lanche pago de ${c.minutos} minutos`,
          passo: 'regras',
        });
        break;
      case 'folga_dominical':
        store.rules.sundayRule = c.regra;
        applied.push({
          descricao: `Folga dominical: ${c.regra === 'um_em_tres' ? '1 domingo a cada 3 semanas' : c.regra === 'um_em_dois' ? '1 domingo a cada 2 semanas' : 'todo domingo'}`,
          passo: 'regras',
        });
        break;
      case 'plantao':
        store.plantao.type = c.plantao;
        if (c.cobertura) store.plantao.cover = c.cobertura;
        if (c.indenizarIntervalo !== undefined) store.plantao.indemnifyBreak = c.indenizarIntervalo;
        applied.push({
          descricao:
            c.plantao === 'none'
              ? 'Sem plantão noturno'
              : `Plantão ${c.plantao === 'weekly' ? 'semanal' : 'mensal'} coberto por ${(c.cobertura ?? store.plantao.cover) === 'team' ? 'equipe da escala' : 'plantonista intermitente'}`,
          passo: 'plantao',
        });
        break;
      case 'feriados':
        if (c.abreNosFeriados !== undefined) store.holidays.openOnHolidays = c.abreNosFeriados;
        if (c.compensacao) store.holidays.compensation = c.compensacao;
        if (c.rodizio) store.holidays.rotation = c.rodizio;
        applied.push({
          descricao: [
            c.abreNosFeriados === false
              ? 'Loja fechada nos feriados'
              : c.abreNosFeriados
                ? 'Loja aberta nos feriados'
                : null,
            c.compensacao
              ? c.compensacao === 'folga'
                ? 'feriado compensado com folga'
                : 'feriado pago em dobro'
              : null,
            c.rodizio
              ? c.rodizio === 'rotativa'
                ? 'escala rotativa nos feriados'
                : 'escala fixa nos feriados'
              : null,
          ]
            .filter(Boolean)
            .join(', '),
          passo: 'feriados',
        });
        break;
      case 'quantidade':
        roleOf(c.funcao).headcount = c.quantidade;
        applied.push({
          descricao: `${c.funcao}: ${c.quantidade} colaborador(es) hoje`,
          passo: 'equipe',
        });
        break;
      case 'salario':
        roleOf(c.funcao).monthlySalary = c.salario;
        applied.push({
          descricao: `${c.funcao}: salário de registro de R$ ${c.salario}`,
          passo: 'equipe',
        });
        break;
      case 'escala_12x36':
        roleOf(c.funcao).scaleType = c.ligado ? 'doze_x_trinta_e_seis' : 'normal';
        applied.push({
          descricao: `${c.funcao}: ${c.ligado ? 'escala 12x36' : 'jornada normal'}`,
          passo: 'equipe',
        });
        break;
      case 'faixa': {
        const r = roleOf(c.funcao);
        if (c.todoFuncionamento || !c.inicio || !c.fim) r.coverage = { mode: 'all' };
        else r.coverage = { mode: 'band', start: c.inicio, end: c.fim };
        applied.push({
          descricao: `${c.funcao}: cobertura ${r.coverage.mode === 'all' ? 'em todo o funcionamento' : `das ${r.coverage.start} às ${r.coverage.end}`}`,
          passo: 'equipe',
        });
        break;
      }
      case 'dias_da_funcao': {
        roleOf(c.funcao).daysMask = c.dias.reduce((m, d) => m | (1 << d), 0);
        applied.push({
          descricao: `${c.funcao}: trabalha ${c.dias.map((d) => DAY_NAMES[d]).join(', ')}`,
          passo: 'equipe',
        });
        break;
      }
      case 'regime':
        store.taxRegime = c.regime;
        applied.push({
          descricao: `Regime tributário: ${c.regime === 'simples' ? 'Simples Nacional' : 'Lucro Presumido/Real'}`,
          passo: 'regras',
        });
        break;
      case 'provisoes':
        store.rules.provisions = c.ligado;
        applied.push({
          descricao: c.ligado ? 'Incluir provisões' : 'Sem provisões',
          passo: 'regras',
        });
        break;
    }
  }

  const parsed = scaleStoreSchema.safeParse(store);
  if (!parsed.success) {
    throw new ChangeError(parsed.error.issues.map((i) => i.message));
  }
  return { store: parsed.data, applied };
}
