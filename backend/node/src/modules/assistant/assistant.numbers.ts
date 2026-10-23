// Conferência dos números da resposta: todo número que a IA escreve precisa ter vindo de uma ferramenta chamada
// naquela análise. A conferência pega valores em reais, porcentagens, horas e contagens a partir de 7; inteiros
// pequenos (0 a 6) são aceitos porque aparecem em frases como "2 a 4 cenários" ou "3 itens".

const NUMBER = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

// Trechos que parecem número mas não são valores do cálculo: horários, cenários (5x2, 12x36), citações de lei,
// anos, datas e numeração de lista.
const IGNORED: RegExp[] = [
  /\b\d{1,2}:\d{2}\b/g,
  /\b\d{1,2}\s?x\s?\d{1,2}\b/gi,
  /(?:Lei|Súmula|EC|CLT|LC|art\.?|artigos?|§)\s*n?º?\s*[\d./º°-]+/gi,
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
  /\b20\d{2}\b/g,
  /^\s*\d+[.)]\s/gm,
];

// Jornadas dos cenários e tempos de intervalo que aparecem como rótulo, sem serem resultado de cálculo.
const LABELS = new Set([40, 42, 44]);

const parse = (token: string) => Number(token.replace(/\./g, '').replace(',', '.'));

export function extractNumbers(text: string): { token: string; value: number }[] {
  let clean = text;
  for (const re of IGNORED) clean = clean.replace(re, ' ');
  return [...clean.matchAll(NUMBER)].map((m) => ({ token: m[0], value: parse(m[0]) }));
}

// Todos os números de um resultado de ferramenta (inclusive os que aparecem dentro de textos).
export function collectNumbers(value: unknown, into = new Set<number>()): Set<number> {
  if (typeof value === 'number' && Number.isFinite(value)) into.add(Math.abs(value));
  else if (typeof value === 'string') for (const n of extractNumbers(value)) into.add(n.value);
  else if (Array.isArray(value)) for (const v of value) collectNumbers(v, into);
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) collectNumbers(v, into);
  return into;
}

const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.0005);

function inPool(value: number, pool: Set<number>): boolean {
  for (const p of pool) {
    if (close(value, p)) return true;
    // Arredondamentos que a IA costuma fazer ao escrever: inteiro, uma casa, "mil" e "mi".
    if (close(value, Math.round(p)) || close(value, Math.round(p * 10) / 10)) return true;
    if (p >= 1000 && close(value * 1000, p)) return true;
    if (p >= 1_000_000 && close(value * 1_000_000, p)) return true;
    if (p >= 1000 && close(value * 1000, Math.round(p / 100) * 100)) return true;
  }
  return false;
}

// Números do texto que não aparecem nos resultados das ferramentas.
export function untraceableNumbers(text: string, pool: Set<number>): string[] {
  const bad = new Set<string>();
  for (const { token, value } of extractNumbers(text)) {
    const abs = Math.abs(value);
    if (Number.isInteger(abs) && abs <= 6) continue;
    if (LABELS.has(abs)) continue;
    if (!inPool(abs, pool)) bad.add(token);
  }
  return [...bad];
}
