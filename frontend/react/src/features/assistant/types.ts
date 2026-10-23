// Espelho dos eventos e do cenário da API (backend/node/src/modules/assistant).
export type ChangeStepId = 'horario' | 'plantao' | 'equipe' | 'regras' | 'vendas' | 'feriados';

export type ScenarioSummary = {
  colaboradores: number;
  contratar: number;
  folhaMensal: number;
  alertas: string[];
};

export type ScenarioResult = {
  titulo: string;
  cenario: '5x2_42' | '5x2_40';
  mudancas: { descricao: string; passo: ChangeStepId }[];
  antes: ScenarioSummary & { colaboradoresHoje: number; folhaHoje: number };
  depois: ScenarioSummary;
  diferenca: { colaboradores: number; folhaMensal: number; folhaAnual: number; percentual: number };
};

export type AnalysisEvent =
  | { type: 'text'; text: string }
  | { type: 'reset' }
  | { type: 'tool'; label: string }
  | { type: 'scenario'; scenario: ScenarioResult }
  | { type: 'done'; warning?: string }
  | { type: 'error'; code: string; message: string };
