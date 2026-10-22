import { describe, expect, it } from 'vitest';
import { renderReportPdf } from './buildPdf';
import type { Report } from './reportModel';

const report = (extraSections = 0): Report => ({
  title: 'Quanto vale o fim da escala 6x1 para o seu grupo?',
  subtitle: 'Simulação de impacto financeiro da PEC 221/19 · Modo detalhado',
  generatedAt: '22/10/2026, 15:30',
  sections: [
    {
      heading: 'Impacto anual direto estimado',
      rows: [{ label: 'Impacto bruto de folha por ano', value: 'R$ 885,1 mil a R$ 1,4 mi' }],
      paragraphs: ['Texto de apoio com acentuação: ação, são, é, ç.'],
    },
    {
      heading: 'Loja: Centro',
      table: {
        columns: [
          'Função',
          'Horas a cobrir',
          'Horas com 40h',
          'Falta nova',
          'Contratar',
          'Após ações',
          'Custo por ano',
        ],
        rows: [['Farmacêutico', '84 h', '69,6 h', '7 h', '1', '0', 'R$ 175.623']],
      },
    },
    ...Array.from({ length: extraSections }, (_, index) => ({
      heading: `Seção extra ${index + 1}`,
      rows: Array.from({ length: 8 }, (_, row) => ({
        label: `Linha ${row}`,
        value: `${row} valor`,
      })),
    })),
  ],
  notice: 'Estimativa para diagnóstico estratégico.',
  fileName: 'relatorio.pdf',
});

describe('renderReportPdf', () => {
  it('deve gerar um PDF válido de uma página para um relatório curto', async () => {
    const doc = await renderReportPdf(report());

    expect(doc.getNumberOfPages()).toBe(1);
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(2000);
  });

  it('deve passar para novas páginas quando o conteúdo é longo', async () => {
    const doc = await renderReportPdf(report(12));

    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});
