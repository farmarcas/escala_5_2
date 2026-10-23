import ExcelJS from 'exceljs';
import { type ScenarioId } from './engine/rules.js';
import { buildAlerts } from './scales.alerts.js';
import { diagnose, type Diagnostic } from './scales.diagnostic.js';
import { buildRosterView, type RosterView } from './scales.roster.js';
import type { ScaleStoreInput } from './scales.schemas.js';

// Relatório em Excel: usa o mesmo diagnóstico e a mesma escala da tela, então os números são idênticos.

const BRL = '"R$" #,##0.00';
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF050505' },
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

const KIND_LABEL = {
  abertura: 'Abertura',
  meio: 'Meio',
  fechamento: 'Fechamento',
  unico: 'Turno único',
  plantao: 'Plantão',
} as const;

function header(sheet: ExcelJS.Worksheet, row: number) {
  const r = sheet.getRow(row);
  r.font = HEADER_FONT;
  r.fill = HEADER_FILL;
  r.alignment = { vertical: 'middle', wrapText: true };
}

function title(sheet: ExcelJS.Worksheet, text: string, columns: number) {
  sheet.mergeCells(1, 1, 1, columns);
  sheet.getCell(1, 1).value = text;
  sheet.getCell(1, 1).font = { bold: true, size: 14 };
}

const COMPONENTS: { key: keyof Diagnostic['payroll']['today']['components']; label: string }[] = [
  { key: 'salary', label: 'Salários de registro' },
  { key: 'hazard', label: 'Periculosidade (entregador de moto)' },
  { key: 'holidayDouble', label: 'Feriados trabalhados pagos em dobro' },
  { key: 'night', label: 'Adicional noturno' },
  { key: 'overtime', label: 'Horas extras (plantão)' },
  { key: 'dsr', label: 'Reflexo no DSR' },
  { key: 'indemnifiedBreak', label: 'Intervalo indenizado' },
  { key: 'thirteenth', label: '13º salário (provisão)' },
  { key: 'vacation', label: 'Férias + 1/3 (provisão)' },
  { key: 'fgts', label: 'FGTS' },
  { key: 'fgtsFine', label: 'Multa FGTS (provisão)' },
  { key: 'inss', label: 'INSS patronal + RAT + terceiros' },
  { key: 'transport', label: 'Vale-transporte (parte da empresa)' },
  { key: 'otherBenefits', label: 'Outros benefícios' },
];

function comparative(wb: ExcelJS.Workbook, store: ScaleStoreInput, d: Diagnostic) {
  const sheet = wb.addWorksheet('Comparativo');
  title(sheet, `${store.name} · pessoas e custos`, 7);
  sheet.addRow([]);
  sheet.addRow([
    'Função',
    'Hoje',
    'Necessário 6x1 · 44h',
    'Necessário 5x2 · 42h',
    'Necessário 5x2 · 40h',
    'Contratar 5x2 · 42h',
    'Contratar 5x2 · 40h',
    'Falta hoje (6x1)',
    'Efeito 5x2 · 42h',
    'Efeito 5x2 · 40h',
  ]);
  header(sheet, 3);
  for (const r of d.rows) {
    sheet.addRow([
      r.label,
      r.today,
      r.need['6x1_44'],
      r.need['5x2_42'],
      r.need['5x2_40'],
      r.hire['5x2_42'],
      r.hire['5x2_40'],
      r.fill,
      r.effect['5x2_42'],
      r.effect['5x2_40'],
    ]);
  }
  const t = d.totals;
  const total = sheet.addRow([
    'Total',
    t.today,
    t.need['6x1_44'],
    t.need['5x2_42'],
    t.need['5x2_40'],
    t.hire['5x2_42'],
    t.hire['5x2_40'],
    t.fill,
    t.effect['5x2_42'],
    t.effect['5x2_40'],
  ]);
  total.font = { bold: true };

  sheet.addRow([]);
  const h = sheet.addRow(['Componente mensal', 'Hoje (6x1 · 44h)', '5x2 · 42h', '5x2 · 40h']);
  header(sheet, h.number);
  for (const c of COMPONENTS) {
    sheet.addRow([
      c.label,
      d.payroll.today.components[c.key],
      d.payroll.scenarios['5x2_42'].components[c.key],
      d.payroll.scenarios['5x2_40'].components[c.key],
    ]);
  }
  const lines: [string, number, number, number][] = [
    [
      'Custo direto',
      d.payroll.today.direct,
      d.payroll.scenarios['5x2_42'].direct,
      d.payroll.scenarios['5x2_40'].direct,
    ],
    [
      'Custo indireto',
      d.payroll.today.indirect,
      d.payroll.scenarios['5x2_42'].indirect,
      d.payroll.scenarios['5x2_40'].indirect,
    ],
    [
      'Folha mensal total',
      d.payroll.today.total,
      d.payroll.scenarios['5x2_42'].total,
      d.payroll.scenarios['5x2_40'].total,
    ],
    [
      'Diferença por mês',
      0,
      d.payroll.scenarios['5x2_42'].monthlyDifference,
      d.payroll.scenarios['5x2_40'].monthlyDifference,
    ],
    ['  · para cobrir o horário hoje (6x1)', 0, d.payroll.fillMonthly, d.payroll.fillMonthly],
    [
      '  · efeito da nova escala',
      0,
      d.payroll.scenarios['5x2_42'].effectMonthly,
      d.payroll.scenarios['5x2_40'].effectMonthly,
    ],
    [
      'Diferença por ano',
      0,
      d.payroll.scenarios['5x2_42'].yearlyDifference,
      d.payroll.scenarios['5x2_40'].yearlyDifference,
    ],
  ];
  for (const l of lines) sheet.addRow(l).font = { bold: true };
  const firstMoney = h.number + 1;
  for (let r = firstMoney; r <= sheet.rowCount; r += 1) {
    for (const c of [2, 3, 4]) sheet.getCell(r, c).numFmt = BRL;
  }
  sheet.addRow([]);
  sheet.addRow([
    `Regime: ${store.taxRegime === 'simples' ? 'Simples Nacional' : 'Lucro Presumido/Real'} · ${d.payroll.provisions ? 'com' : 'sem'} provisões. Estimativa para planejamento: confirme com seu contador ou advogado.`,
  ]);
  sheet.columns = [
    { width: 42 },
    { width: 18 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
  ];
}

function actionPlan(wb: ExcelJS.Workbook, store: ScaleStoreInput, d: Diagnostic) {
  const sheet = wb.addWorksheet('Plano de ação');
  title(sheet, 'Plano de ação', 4);
  sheet.addRow([]);
  sheet.addRow(['Prioridade', 'Ação', 'Quantidade 5x2 · 42h', 'Quantidade 5x2 · 40h']);
  header(sheet, 3);
  const rows = [...d.rows].sort((a, b) =>
    a.key === 'farmaceutico'
      ? -1
      : b.key === 'farmaceutico'
        ? 1
        : b.hire['5x2_42'] - a.hire['5x2_42'],
  );
  let n = 1;
  for (const r of rows) {
    if (r.hire['5x2_42'] === 0 && r.hire['5x2_40'] === 0) continue;
    sheet.addRow([n, `Contratar ${r.label}`, r.hire['5x2_42'], r.hire['5x2_40']]);
    n += 1;
  }
  if (n === 1) sheet.addRow(['', 'Nenhuma contratação necessária', 0, 0]);
  sheet.addRow([]);
  const a = sheet.addRow(['Gravidade', 'Alertas e ajustes']);
  header(sheet, a.number);
  const label = { danger: 'Prioritário', warning: 'Atenção', info: 'Ajuste' } as const;
  for (const alert of buildAlerts(store, d)) {
    sheet.addRow([label[alert.severity], alert.message]).getCell(2).alignment = { wrapText: true };
  }
  sheet.columns = [{ width: 14 }, { width: 110 }, { width: 22 }, { width: 22 }];
}

function model(wb: ExcelJS.Workbook, store: ScaleStoreInput, roster: RosterView) {
  const sheet = wb.addWorksheet('Modelo por função');
  title(sheet, 'Modelo de escala por função (5x2 · 42h)', 6);
  sheet.addRow([]);
  sheet.addRow([
    'Função',
    'Pessoas hoje',
    'Salário de registro',
    'Mínimo no salão',
    'Cobertura',
    'Tipos de turno e horários (semana 1)',
  ]);
  header(sheet, 3);
  for (const g of roster.groups) {
    const members = store.roles.filter((r) => r.enabled && r.role === g.key);
    const lead =
      members[0] ??
      store.roles.find((r) => r.enabled && (g.key === 'gerencia' ? r.role === 'gerente' : false));
    const shifts = new Map<string, string>();
    for (const p of g.people) {
      for (const cell of p.days.slice(0, 7)) {
        if (!cell) continue;
        shifts.set(`${KIND_LABEL[cell.kind]} ${cell.start}–${cell.end}`, '');
      }
    }
    sheet.addRow([
      g.label,
      g.people.filter((p) => !p.tags.includes('contratar')).length,
      lead?.monthlySalary ?? '',
      lead?.minInHall ?? '',
      lead
        ? lead.coverage.mode === 'all'
          ? 'Todo o funcionamento'
          : `${lead.coverage.start}–${lead.coverage.end}`
        : '',
      [...shifts.keys()].join(' · '),
    ]);
  }
  for (let r = 4; r <= sheet.rowCount; r += 1) sheet.getCell(r, 3).numFmt = BRL;
  sheet.columns = [
    { width: 24 },
    { width: 14 },
    { width: 20 },
    { width: 16 },
    { width: 24 },
    { width: 100 },
  ];
}

function rosterSheet(wb: ExcelJS.Workbook, name: string, roster: RosterView) {
  const sheet = wb.addWorksheet(name);
  const weekday = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  title(sheet, `Escala de 4 semanas · ${name}`, 33);
  sheet.addRow([]);
  const head = [
    'Função',
    'Pessoa',
    ...roster.dates.map(
      (d, i) =>
        `${weekday[i % 7]} ${d.slice(8, 10)}/${d.slice(5, 7)}${roster.holidays[i] ? ' (feriado)' : ''}`,
    ),
    'Horas S1',
    'Horas S2',
    'Horas S3',
    'Horas S4',
  ];
  sheet.addRow(head);
  header(sheet, 3);
  for (const g of roster.groups) {
    for (const p of g.people) {
      const marks = p.tags
        .map((t) => ({ contratar: 'Contratar', reforco: 'Reforço', dono: 'Dono farmacêutico' })[t])
        .join(', ');
      sheet.addRow([
        g.label,
        marks ? `${p.label} (${marks})` : p.label,
        ...p.days.map((c) =>
          c ? `${c.start}–${c.end}${c.kind === 'plantao' ? ' plantão' : ''}` : 'Folga',
        ),
        ...p.weekMinutes.map((m) => Math.round((m / 60) * 100) / 100),
      ]);
    }
  }
  sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 3 }];
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 34;
  for (let c = 3; c <= 30; c += 1) sheet.getColumn(c).width = 13;
  for (let c = 31; c <= 34; c += 1) sheet.getColumn(c).width = 10;
}

export async function buildReport(store: ScaleStoreInput): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Radar Escala';
  const d = diagnose(store);
  comparative(wb, store, d);
  actionPlan(wb, store, d);
  const r42 = buildRosterView(store, '5x2_42');
  model(wb, store, r42);
  const names: [ScenarioId, string][] = [
    ['6x1_44', 'Escala 6x1 44h'],
    ['5x2_42', 'Escala 5x2 42h'],
    ['5x2_40', 'Escala 5x2 40h'],
  ];
  for (const [id, name] of names)
    rosterSheet(wb, name, id === '5x2_42' ? r42 : buildRosterView(store, id));
  return Buffer.from(await wb.xlsx.writeBuffer());
}
