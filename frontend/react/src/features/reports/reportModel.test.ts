import { describe, expect, it } from 'vitest';
import { describeTotals } from '@/features/simulations/describeResult';
import type { DetailedResult } from '@/features/simulations/types';
import { LEGAL_NOTICE } from '@/lib/legalNotice';
import { buildDetailedReport } from './reportModel';

const NOW = new Date('2026-10-22T18:30:00Z');

const detailed: DetailedResult = {
  totals: {
    grossAnnualImpact: 175_623,
    netAnnualImpact: 115_911,
    peopleToHire: 1,
    storesWithImpact: 1,
    residualAnnualImpact: 0,
    residualPeopleToHire: 0,
    savings: 175_623,
  },
  stores: [
    {
      storeId: 'a',
      name: 'Centro',
      weeklyOpenHours: 84,
      grossAnnualImpact: 175_623,
      peopleToHire: 1,
      hasImpact: true,
      residualGrossAnnualImpact: 0,
      residualPeopleToHire: 0,
      savings: 175_623,
      mitigationReduction: 1,
      roles: [
        {
          role: 'farmaceutico',
          hoursToCover: 84,
          hoursAvailableAt40: 69.6,
          baselineDeficit: 7.44,
          newDeficit: 6.96,
          peopleToHire: 1,
          annualCost: 175_623,
          mandatoryPresence: true,
          residualNewDeficit: 0,
          residualPeopleToHire: 0,
          residualAnnualCost: 0,
        },
      ],
    },
    {
      storeId: 'b',
      name: 'Filial',
      weeklyOpenHours: 60,
      grossAnnualImpact: 0,
      peopleToHire: 0,
      hasImpact: false,
      residualGrossAnnualImpact: 0,
      residualPeopleToHire: 0,
      savings: 0,
      mitigationReduction: 0,
      roles: [],
    },
  ],
  ranking: [
    { storeId: 'a', name: 'Centro', grossAnnualImpact: 175_623 },
    { storeId: 'b', name: 'Filial', grossAnnualImpact: 0 },
  ],
  warnings: ['MITIGATION_ABOVE_USUAL'],
};

describe('buildDetailedReport', () => {
  const report = buildDetailedReport({
    name: 'Com negociação',
    regime: 'real',
    result: detailed,
    premises: {
      taxation: {
        monthsPerYear: 13.33,
        chargesRealPresumido: 1.55,
        chargesSimples: 1.25,
        irpjCsllRate: 0.34,
      },
      detailed: { targetWeeklyHours: 40, absenceRate: 0.13 },
    },
    mitigations: { a: { hoursReductionPerWeek: 4, actions: { 'negociacao-coletiva': 1 } } },
    actionTitles: { 'negociacao-coletiva': 'Negociação coletiva' },
    version: '2026-10-22-provisoria',
    savedAt: '2026-10-22T18:00:00Z',
    now: NOW,
  });

  it('deve trazer o total do grupo igual ao da tela', () => {
    const totals = report.sections.find((section) => section.heading === 'Total do grupo');

    expect(totals?.rows?.map((row) => row.label)).toEqual(
      describeTotals(detailed, 'real').map((metric) => metric.label),
    );
    expect(totals?.rows?.[0]?.value).toMatch(/^R\$ 175,6 mil$/);
  });

  it('deve montar o título, o subtítulo e o aviso de redução acima do usual', () => {
    expect(report.title).toBe('Simulação: Com negociação');
    expect(report.subtitle).toContain('Modo detalhado');
    expect(report.subtitle).toContain('Salva em 22/10/2026');
    expect(report.sections.some((section) => section.heading === 'Atenção')).toBe(true);
  });

  it('deve listar o ranking só com lojas que têm impacto', () => {
    const ranking = report.sections.find((section) => section.heading === 'Lojas mais afetadas');

    expect(ranking?.table?.rows).toEqual([['1', 'Centro', 'R$ 175,6 mil']]);
    expect(ranking?.table?.leftAligned).toEqual([0, 1]);
  });

  it('deve trazer uma seção por loja, com a tabela por função e as ações', () => {
    const centro = report.sections.find((section) => section.heading === 'Loja: Centro');
    const filial = report.sections.find((section) => section.heading === 'Loja: Filial');

    expect(centro?.table?.columns).toHaveLength(7);
    expect(centro?.table?.rows[0]?.[0]).toBe('Farmacêutico');
    expect(centro?.table?.rows[0]?.[4]).toBe('1');
    expect(centro?.paragraphs?.join(' ')).toContain('Negociação coletiva (100%)');
    expect(centro?.paragraphs?.join(' ')).toContain('Ajuste de horário: 4 h a menos por semana');
    expect(filial?.paragraphs?.[0]).toContain('Sem contratação necessária');
  });

  it('deve listar as premissas com a versão', () => {
    const premises = report.sections.find((section) => section.heading === 'Premissas usadas');

    expect(premises?.rows).toContainEqual({
      label: 'Ausência padrão (férias, faltas)',
      value: '13%',
    });
    expect(premises?.rows).toContainEqual({
      label: 'Versão das premissas',
      value: '2026-10-22-provisoria',
    });
  });

  it('deve levar o aviso legal e o nome do arquivo', () => {
    expect(report.notice).toBe(LEGAL_NOTICE);
    expect(report.fileName).toBe('relatorio-simulacao-por-loja.pdf');
    expect(report.generatedAt).toMatch(/22\/10\/2026/);
  });

  it('deve usar um título padrão quando a simulação não tem nome', () => {
    const unnamed = buildDetailedReport({
      regime: 'simples',
      result: detailed,
      premises: {
        taxation: {
          monthsPerYear: 13.33,
          chargesRealPresumido: 1.55,
          chargesSimples: 1.25,
          irpjCsllRate: 0.34,
        },
        detailed: { targetWeeklyHours: 40, absenceRate: 0.13 },
      },
      mitigations: {},
      actionTitles: {},
      now: NOW,
    });

    expect(unnamed.title).toBe('Simulação por loja do fim da escala 6x1');
  });
});
