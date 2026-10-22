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
