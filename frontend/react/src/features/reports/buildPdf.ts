import type { Report, ReportSection } from './reportModel';

const PAGE_MARGIN = 40;
const NAVY: [number, number, number] = [11, 110, 79];
const SLATE: [number, number, number] = [86, 96, 89];
const INK: [number, number, number] = [20, 33, 61];

// Desenha o modelo do relatório em PDF (A4). Carrega a biblioteca só quando alguém pede o arquivo.
export async function renderReportPdf(report: Report) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let y = 0;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 50) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  const text = (
    value: string,
    x: number,
    options: {
      bold?: boolean;
      size?: number;
      color?: [number, number, number];
      align?: 'left' | 'right';
      maxWidth?: number;
    } = {},
  ) => {
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size ?? 10);
    doc.setTextColor(...(options.color ?? INK));
    doc.text(value, x, y, { align: options.align ?? 'left', maxWidth: options.maxWidth });
  };

  const paragraph = (value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(value, contentWidth) as string[];
    for (const line of lines) {
      ensureSpace(14);
      text(line, PAGE_MARGIN, { color: SLATE });
      y += 14;
    }
    y += 4;
  };

  const rowsBlock = (rows: NonNullable<ReportSection['rows']>) => {
    for (const row of rows) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const labelLines = doc.splitTextToSize(row.label, contentWidth * 0.55) as string[];
      const valueLines = doc.splitTextToSize(row.value, contentWidth * 0.4) as string[];
      const lines = Math.max(labelLines.length, valueLines.length);
      ensureSpace(lines * 14 + 4);
      const top = y;
      labelLines.forEach((line, index) => {
        y = top + index * 14;
        text(line, PAGE_MARGIN, { color: SLATE });
      });
      valueLines.forEach((line, index) => {
        y = top + index * 14;
        text(line, pageWidth - PAGE_MARGIN, { align: 'right', bold: true });
      });
      y = top + lines * 14 + 4;
    }
  };

  const tableBlock = (table: NonNullable<ReportSection['table']>) => {
    const firstWidth = table.columns.length > 4 ? contentWidth * 0.16 : contentWidth * 0.18;
    const restWidth = (contentWidth - firstWidth) / Math.max(1, table.columns.length - 1);
    const leftAligned = new Set(table.leftAligned ?? [0]);
    const rightEdge = (index: number) => PAGE_MARGIN + firstWidth + restWidth * index;
    const xFor = (index: number) =>
      index === 0
        ? PAGE_MARGIN
        : leftAligned.has(index)
          ? rightEdge(index) - restWidth
          : rightEdge(index);
    const alignFor = (index: number) => (leftAligned.has(index) ? 'left' : 'right');
    const compact = table.columns.length > 4;

    ensureSpace(24);
    table.columns.forEach((column, index) => {
      text(column, xFor(index), {
        bold: true,
        size: compact ? 7.5 : 9,
        color: SLATE,
        align: alignFor(index),
      });
    });
    y += 6;
    doc.setDrawColor(217, 226, 222);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 12;

    for (const row of table.rows) {
      ensureSpace(16);
      row.forEach((cell, index) => {
        text(cell, xFor(index), {
          size: compact ? 8 : 9.5,
          align: alignFor(index),
        });
      });
      y += 15;
    }
    y += 4;
  };

  // Cabeçalho
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 96, 'F');
  y = 52;
  text(report.title, PAGE_MARGIN, {
    bold: true,
    size: 18,
    color: [255, 255, 255],
    maxWidth: contentWidth,
  });
  y = 74;
  text(report.subtitle, PAGE_MARGIN, { size: 10, color: [255, 255, 255] });
  y = 118;
  text(`Gerado em ${report.generatedAt}`, PAGE_MARGIN, { size: 9, color: SLATE });
  y += 26;

  for (const section of report.sections) {
    ensureSpace(60);
    text(section.heading, PAGE_MARGIN, { bold: true, size: 13, color: NAVY });
    y += 8;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(1.2);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 16;
    for (const item of section.paragraphs ?? []) paragraph(item);
    if (section.rows) rowsBlock(section.rows);
    if (section.table) tableBlock(section.table);
    y += 12;
  }

  // Aviso legal e numeração das páginas
  ensureSpace(70);
  doc.setFillColor(241, 245, 243);
  doc.rect(PAGE_MARGIN, y, contentWidth, 56, 'F');
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const noticeLines = doc.splitTextToSize(report.notice, contentWidth - 24) as string[];
  noticeLines.slice(0, 4).forEach((line) => {
    text(line, PAGE_MARGIN + 12, { size: 8.5, color: SLATE });
    y += 11;
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE);
    doc.text(`Farmarcas · Página ${page} de ${pages}`, pageWidth / 2, pageHeight - 24, {
      align: 'center',
    });
  }

  return doc;
}

export async function downloadReportPdf(report: Report): Promise<void> {
  const doc = await renderReportPdf(report);
  doc.save(report.fileName);
}
