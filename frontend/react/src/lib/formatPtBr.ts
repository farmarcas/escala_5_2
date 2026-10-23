const NOT_A_NUMBER = '—';

export const formatBRL = (value: number): string =>
  Number.isFinite(value)
    ? value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      })
    : NOT_A_NUMBER;

export const formatBRLCompact = (value: number): string => {
  if (!Number.isFinite(value)) return NOT_A_NUMBER;
  const abs = Math.abs(value);
  const short = (divisor: number, unit: string, digits: number) =>
    `R$ ${(value / divisor).toLocaleString('pt-BR', { maximumFractionDigits: digits })} ${unit}`;
  if (abs >= 1e9) return short(1e9, 'bi', 2);
  if (abs >= 1e6) return short(1e6, 'mi', 2);
  if (abs >= 1e3) return short(1e3, 'mil', 1);
  return formatBRL(value);
};

export const formatPercent = (fraction: number, digits = 1): string =>
  Number.isFinite(fraction)
    ? `${(fraction * 100).toLocaleString('pt-BR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}%`
    : NOT_A_NUMBER;

export const formatInt = (value: number): string =>
  Number.isFinite(value) ? Math.round(value).toLocaleString('pt-BR') : NOT_A_NUMBER;

export const formatPlainNumber = (value: number): string =>
  Number.isFinite(value) ? value.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) : '';

// Lê o que a pessoa digita: "1.234,56", "2.100", "1,55", "1234.5". Vazio ou inválido vira null.
export const parseBrNumber = (text: string): number | null => {
  const cleaned = text.replace(/[^\d.,-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;

  const commas = cleaned.split(',').length - 1;
  if (commas > 1) return null;

  let normalized: string;
  if (commas === 1) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  } else {
    normalized = cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? NOT_A_NUMBER
    : date.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      });
};

// Sinal de menos verdadeiro (U+2212): o hífen de teclado não serve em número com sinal.
const MINUS = '\u2212';
const signOf = (value: number) => (value > 0 ? '+' : value < 0 ? MINUS : '');

// Variação sempre com sinal e unidade: "+2 colaboradores", "−52 h". Zero sai sem sinal.
export const formatDelta = (value: number, unit = '', digits = 0): string => {
  if (!Number.isFinite(value)) return NOT_A_NUMBER;
  const abs = Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  // Porcentagem cola no número (22,2%); as demais unidades levam espaço (52 h, 2 colaboradores).
  const glue = unit === '%' ? '' : ' ';
  return `${signOf(value)}${abs}${unit ? `${glue}${unit}` : ''}`;
};

// Variação em reais: "+R$ 8.400", "−R$ 4.200".
export const formatSignedBRL = (value: number): string =>
  Number.isFinite(value) ? `${signOf(value)}${formatBRL(Math.abs(value))}` : NOT_A_NUMBER;

// Moeda com centavos, para tabelas: "R$ 46.200,00".
export const formatBRLDetailed = (value: number): string =>
  Number.isFinite(value)
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('-', MINUS)
    : NOT_A_NUMBER;

// Horas por semana ou por mês: "102 h".
export const formatHours = (hours: number): string =>
  Number.isFinite(hours)
    ? `${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`
    : NOT_A_NUMBER;

// Faixa de horário em texto corrido: "07:00 às 22:00".
export const formatRange = (start: string, end: string): string => `${start} às ${end}`;

// Diferença em pontos percentuais: "+9 p.p.".
export const formatPP = (points: number): string =>
  Number.isFinite(points)
    ? `${formatDelta(points, 'p.p.', Number.isInteger(points) ? 0 : 1)}`
    : NOT_A_NUMBER;
