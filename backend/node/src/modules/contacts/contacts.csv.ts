// CSV para a equipe da Farmarcas abrir direto no Excel brasileiro: UTF-8 com BOM, separador ";" e quebra CRLF.
const SEPARATOR = ';';
const BOM = '﻿';

export type ContactCsvRow = {
  id: string;
  createdAt: Date;
  source: string;
  mode: string;
  name: string;
  roleTitle: string;
  company: string;
  phone: string;
  email: string;
  sector: string | null;
  utm: string | null;
  anonymizedAt: Date | null;
};

// Células que começam com = + - @ viram texto: planilhas as executariam como fórmula (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const HEADER = [
  'id',
  'criado_em',
  'origem',
  'modo',
  'nome',
  'cargo',
  'empresa',
  'telefone',
  'email',
  'setor',
  'utm',
  'anonimizado',
];

export const buildContactsCsv = (rows: ContactCsvRow[]): string => {
  const lines = rows.map((row) =>
    [
      row.id,
      row.createdAt.toISOString(),
      row.source,
      row.mode,
      row.name,
      row.roleTitle,
      row.company,
      row.phone,
      row.email,
      row.sector,
      row.utm,
      row.anonymizedAt ? 'sim' : 'nao',
    ]
      .map(csvCell)
      .join(SEPARATOR),
  );
  return BOM + [HEADER.join(SEPARATOR), ...lines].join('\r\n') + '\r\n';
};
