import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { LEGAL_RULES, REFERENCE_DATE } from '../scales/engine/rules.js';
import { buildAlerts } from '../scales/scales.alerts.js';
import { diagnose, GROUPS, type Diagnostic } from '../scales/scales.diagnostic.js';
import { buildRosterView } from '../scales/scales.roster.js';
import type { ScaleStoreInput } from '../scales/scales.schemas.js';
import {
  applyChanges,
  changeSchema,
  ChangeError,
  type AppliedChange,
} from './assistant.changes.js';
import { collectNumbers } from './assistant.numbers.js';

// Ferramentas da IA: só leem e calculam. Nenhuma recebe identificação da conta; a loja vem do servidor.

export const MAX_SIMULATIONS = 6;
export const TOOL_NAMES = [
  'ler_diagnostico',
  'ler_escala_resumida',
  'ler_regras_aplicadas',
  'simular_mudanca',
] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

const scenarioSchema = z.enum(['5x2_42', '5x2_40']);
type Scenario = z.infer<typeof scenarioSchema>;
const groupKeys = GROUPS.map((g) => g.key) as [string, ...string[]];

const inputs = {
  ler_diagnostico: z
    .object({
      cenario: scenarioSchema.optional(),
      regime: z.enum(['simples', 'lucro_presumido_real']).optional(),
      provisoes: z.boolean().optional(),
    })
    .strict(),
  ler_escala_resumida: z
    .object({ funcao: z.enum(groupKeys), cenario: scenarioSchema.optional() })
    .strict(),
  ler_regras_aplicadas: z.object({}).strict(),
  simular_mudanca: z
    .object({
      titulo: z.string().min(3).max(80),
      cenario: scenarioSchema.optional(),
      mudancas: z.array(changeSchema).min(1).max(6),
    })
    .strict(),
} satisfies Record<ToolName, z.ZodType>;

const schemaOf = (schema: z.ZodType) => {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { io: 'input' }) as Record<
    string,
    unknown
  >;
  return rest as Anthropic.Tool['input_schema'];
};

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: 'ler_diagnostico',
    description:
      'Lê o resultado da loja na nova escala: quadro por função (hoje, necessário na 6x1 e na 5x2, contratar), folha de hoje e da nova escala, principais custos, feriados, vendas e alertas. Comece sempre por esta ferramenta.',
    input_schema: schemaOf(inputs.ler_diagnostico),
  },
  {
    name: 'ler_escala_resumida',
    description:
      'Resumo da escala de uma função em uma semana: quais turnos existem em cada dia e quantas pessoas em cada um. Use só quando a pergunta for sobre quem trabalha quando.',
    input_schema: schemaOf(inputs.ler_escala_resumida),
  },
  {
    name: 'ler_regras_aplicadas',
    description:
      'Lista as regras legais e de cálculo que o Radar Escala aplica, com fonte e vigência.',
    input_schema: schemaOf(inputs.ler_regras_aplicadas),
  },
  {
    name: 'simular_mudanca',
    description:
      'Simula uma ou mais mudanças numa cópia da loja e devolve o antes e o depois (colaboradores, folha, alertas). Não altera a loja da pessoa. Use uma chamada por cenário, com um título curto.',
    input_schema: schemaOf(inputs.simular_mudanca),
  },
];

const money = (n: number) => Math.round(n);
const pct = (n: number) => Math.round(n * 10) / 10;

type Summary = {
  colaboradores: number;
  contratar: number;
  folhaMensal: number;
  alertas: string[];
};

const summarize = (d: Diagnostic, scenario: Scenario, alerts: string[]): Summary => ({
  colaboradores: d.totals.today + d.totals.hire[scenario],
  contratar: d.totals.hire[scenario],
  folhaMensal: money(d.payroll.scenarios[scenario].total),
  alertas: alerts,
});

export type ScenarioResult = {
  titulo: string;
  cenario: Scenario;
  mudancas: AppliedChange[];
  antes: Summary & { colaboradoresHoje: number; folhaHoje: number };
  depois: Summary;
  diferenca: { colaboradores: number; folhaMensal: number; folhaAnual: number; percentual: number };
};

export type ToolContext = {
  store: ScaleStoreInput;
  defaultScenario: Scenario;
};

export type ToolOutcome = { content: string; isError: boolean; scenario?: ScenarioResult };

export function makeToolbox(ctx: ToolContext) {
  const pool = new Set<number>();
  let simulations = 0;
  const baseline = new Map<string, { d: Diagnostic; alerts: string[] }>();

  const diagnoseOnce = (store: ScaleStoreInput, key: string, overrides = {}) => {
    const cached = baseline.get(key);
    if (cached) return cached;
    const d = diagnose(store, overrides);
    const entry = { d, alerts: buildAlerts(store, d).map((a) => a.message) };
    if (key !== 'sim') baseline.set(key, entry);
    return entry;
  };

  const ok = (value: unknown, scenario?: ScenarioResult): ToolOutcome => {
    collectNumbers(value, pool);
    return { content: JSON.stringify(value), isError: false, ...(scenario && { scenario }) };
  };
  const fail = (message: string): ToolOutcome => ({
    content: JSON.stringify({ erro: message }),
    isError: true,
  });

  async function run(name: string, rawInput: unknown): Promise<ToolOutcome> {
    if (!(TOOL_NAMES as readonly string[]).includes(name))
      return fail(`Ferramenta desconhecida: ${name}`);
    const tool = name as ToolName;
    const parsed = inputs[tool].safeParse(rawInput ?? {});
    if (!parsed.success)
      return fail(`Pedido inválido: ${parsed.error.issues.map((i) => i.message).join('; ')}`);

    if (tool === 'ler_diagnostico') {
      const input = parsed.data as z.infer<typeof inputs.ler_diagnostico>;
      const scenario = input.cenario ?? ctx.defaultScenario;
      const overrides = {
        ...(input.regime && { taxRegime: input.regime }),
        ...(input.provisoes !== undefined && { provisions: input.provisoes }),
      };
      const { d, alerts } = diagnoseOnce(ctx.store, `diag:${JSON.stringify(overrides)}`, overrides);
      const pay = d.payroll.scenarios[scenario];
      const components = Object.entries(pay.components)
        .map(([nome, valor]) => ({
          nome,
          hoje: money(d.payroll.today.components[nome as keyof typeof pay.components]),
          novaEscala: money(valor),
        }))
        .sort((a, b) => b.novaEscala - b.hoje - (a.novaEscala - a.hoje))
        .slice(0, 6);
      return ok({
        cenario: scenario,
        regime: d.payroll.taxRegime,
        provisoes: d.payroll.provisions,
        funcoes: d.rows.map((r) => ({
          funcao: r.label,
          colaboradoresHoje: r.today,
          necessarioNa6x1: r.need['6x1_44'],
          necessarioNaNovaEscala: r.need[scenario],
          contratar: r.hire[scenario],
          reforco: r.reinforcement[scenario],
          folhaHoje: money(r.cost.today),
          folhaNaNovaEscala: money(r.cost[scenario]),
        })),
        totais: {
          colaboradoresHoje: d.totals.today,
          necessarioNaNovaEscala: d.totals.today + d.totals.hire[scenario],
          contratar: d.totals.hire[scenario],
        },
        folha: {
          hoje: money(d.payroll.today.total),
          novaEscala: money(pay.total),
          diferencaPorMes: money(pay.monthlyDifference),
          diferencaPorAno: money(pay.yearlyDifference),
          percentual: pct(pay.percent),
          diretoNaNovaEscala: money(pay.direct),
          indiretoNaNovaEscala: money(pay.indirect),
        },
        custosQueMaisCrescem: components,
        feriadosNoPeriodo: d.holidays[scenario].rows.length,
        folgasCompensatorias: d.holidays[scenario].compensatoryDays,
        vendas: d.sales
          ? {
              folhaSobreVendasHoje: pct(d.sales.today.payrollShare * 100),
              folhaSobreVendasNaNovaEscala: pct(d.sales.scenarios[scenario].payrollShare * 100),
              vendaParaPagarMercadoriaEFolha:
                d.sales.scenarios[scenario].breakEvenSales === null
                  ? null
                  : money(d.sales.scenarios[scenario].breakEvenSales),
            }
          : null,
        parametros: {
          almocoMinutos: ctx.store.rules.lunchMinutes,
          lancheMinutos: ctx.store.rules.snackMinutes,
          folgaDominical: ctx.store.rules.sundayRule,
          plantao: ctx.store.plantao.type,
          coberturaDoPlantao: ctx.store.plantao.cover,
        },
        alertas: alerts,
      });
    }

    if (tool === 'ler_escala_resumida') {
      const input = parsed.data as z.infer<typeof inputs.ler_escala_resumida>;
      const view = buildRosterView(ctx.store, input.cenario ?? ctx.defaultScenario);
      const group = view.groups.find((g) => g.key === input.funcao);
      if (!group) return fail('Essa função não está ativa nesta loja.');
      const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
      const porDia = days.map((dia, i) => {
        const shifts = new Map<string, number>();
        for (const p of group.people) {
          const c = p.days[i];
          if (c)
            shifts.set(
              `${c.kind} ${c.start} às ${c.end}`,
              (shifts.get(`${c.kind} ${c.start} às ${c.end}`) ?? 0) + 1,
            );
        }
        return { dia, turnos: [...shifts].map(([turno, pessoas]) => ({ turno, pessoas })) };
      });
      const hours = group.people.map((p) => (p.weekMinutes[0] ?? 0) / 60);
      return ok({
        funcao: group.label,
        pessoasNaEscala: group.people.length,
        aContratar: group.people.filter((p) => p.tags.includes('contratar')).length,
        salaoCobertoEmTodoOHorario: group.covered,
        horasMediasPorSemana: pct(hours.reduce((a, b) => a + b, 0) / Math.max(hours.length, 1)),
        primeiraSemana: porDia,
      });
    }

    if (tool === 'ler_regras_aplicadas') {
      return ok({
        vigenteEm: REFERENCE_DATE,
        regras: LEGAL_RULES.map((r) => ({
          titulo: r.title,
          texto: r.text,
          fonte: r.source,
          emVigorDesde: r.effectiveFrom,
        })),
      });
    }

    // simular_mudanca
    const input = parsed.data as z.infer<typeof inputs.simular_mudanca>;
    if (simulations >= MAX_SIMULATIONS) {
      return fail(
        `Limite de ${MAX_SIMULATIONS} simulações por análise atingido. Use os cenários já calculados.`,
      );
    }
    simulations += 1;
    const scenario = input.cenario ?? ctx.defaultScenario;
    try {
      const { store, applied } = applyChanges(ctx.store, input.mudancas);
      const before = diagnoseOnce(ctx.store, 'diag:{}');
      const after = diagnoseOnce(store, 'sim');
      const b = summarize(before.d, scenario, before.alerts);
      const a = summarize(after.d, scenario, after.alerts);
      const result: ScenarioResult = {
        titulo: input.titulo,
        cenario: scenario,
        mudancas: applied,
        antes: {
          ...b,
          colaboradoresHoje: before.d.totals.today,
          folhaHoje: money(before.d.payroll.today.total),
        },
        depois: a,
        diferenca: {
          colaboradores: a.colaboradores - b.colaboradores,
          folhaMensal: a.folhaMensal - b.folhaMensal,
          folhaAnual: (a.folhaMensal - b.folhaMensal) * 12,
          percentual:
            b.folhaMensal > 0 ? pct(((a.folhaMensal - b.folhaMensal) / b.folhaMensal) * 100) : 0,
        },
      };
      return ok(result, result);
    } catch (error) {
      if (error instanceof ChangeError) return fail(`Mudança não aceita: ${error.message}`);
      throw error;
    }
  }

  return { definitions: toolDefinitions, run, numbers: pool, simulations: () => simulations };
}
