import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Contraste dos tokens de cor (guia Radar Escala): texto pequeno pede 4,5:1 e gráfico pede 3:1.
const css = readFileSync(fileURLToPath(new URL('../styles/globals.css', import.meta.url)), 'utf8');

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]!] = m[2]!;
  return out;
}

const darkStart = css.indexOf('@media (prefers-color-scheme: dark)');
const light = tokens(css.slice(css.indexOf(':root {'), darkStart));
const dark = { ...light, ...tokens(css.slice(darkStart)) };

const luminance = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

// [texto, fundo, mínimo]
const TEXT_PAIRS: [string, string, number][] = [
  ['fg', 'background', 4.5],
  ['fg', 'surface', 4.5],
  ['fg', 'surface-subtle', 4.5],
  ['fg-2', 'background', 4.5],
  ['fg-2', 'surface-subtle', 4.5],
  ['fg-3', 'background', 4.5],
  ['fg-3', 'surface', 4.5],
  ['fg-3', 'surface-subtle', 4.5],
  ['link', 'background', 4.5],
  ['link', 'surface', 4.5],
  ['link', 'accent', 4.5],
  ['positive', 'positive-bg', 4.5],
  ['attention', 'attention-bg', 4.5],
  ['critical', 'critical-bg', 4.5],
  ['info', 'info-bg', 4.5],
  ['selected-fg', 'selected', 4.5],
  ['shift-a-fg', 'shift-a-bg', 4.5],
  ['shift-b-fg', 'shift-b-bg', 4.5],
  ['shift-c-fg', 'shift-c-bg', 4.5],
  ['shift-d-fg', 'shift-d-bg', 4.5],
  ['shift-p-fg', 'shift-p-bg', 4.5],
  ['positive', 'background', 4.5],
  ['attention', 'background', 4.5],
  ['critical', 'background', 4.5],
  // Gráficos: 3:1 sobre a superfície
  ['scenario-now', 'surface', 3],
  ['scenario-5x2', 'surface', 3],
  ['series-2', 'surface', 3],
];

describe.each([
  ['claro', light],
  ['escuro', dark],
])('contraste dos tokens no tema %s', (_name, theme) => {
  it.each(TEXT_PAIRS)('%s sobre %s ≥ %s:1', (fg, bg, min) => {
    expect(theme[fg], `token ${fg}`).toBeDefined();
    expect(theme[bg], `token ${bg}`).toBeDefined();
    expect(ratio(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(min);
  });

  it('botão primário: texto branco sobre a cor de ação ≥ 4,5:1', () => {
    expect(ratio('#ffffff', theme['action']!)).toBeGreaterThanOrEqual(4.5);
    expect(ratio('#ffffff', theme['action-hover']!)).toBeGreaterThanOrEqual(4.5);
  });

  it('botão de perigo: texto branco sobre o crítico do tema claro vale 4,5:1', () => {
    expect(ratio('#ffffff', light['critical']!)).toBeGreaterThanOrEqual(4.5);
  });
});
