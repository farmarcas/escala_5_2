import { describe, expect, it } from 'vitest';
import { buildWeekHours } from './coverage.js';
import { centroHours, centroRows } from './fixtures/reference-centro.js';
import { SCENARIOS } from './rules.js';
import { requiredPeople } from './staffing.js';

const week = buildWeekHours(centroHours);
const opts = { lunchMinutes: 60, sundayRule: 'um_em_tres' } as const;

// Meta combinada com a pessoa dona do produto: no máximo 1 pessoa de diferença por função em relação à
// referência, com a causa escrita. A referência usa um algoritmo próprio e heurístico (specs/004-painel-de-escalas/
// calibration-observations.md); aqui o dimensionamento é por capacidade e é explicável.
const MAX_DIFF = 1;

describe('caso de conferência: Drogaria Exemplo — Centro', () => {
  for (const [name, row] of Object.entries(centroRows)) {
    for (const id of ['6x1_44', '5x2_42'] as const) {
      it(`${name} em ${SCENARIOS[id].label} fica a até ${MAX_DIFF} da referência`, () => {
        const r = requiredPeople(row.role, week, SCENARIOS[id], opts);
        if (!r.ok) throw new Error(r.reason);
        const diff = r.people - row.reference[id];
        const accepted = row.accepted?.[id];
        if (accepted === undefined) expect(Math.abs(diff)).toBeLessThanOrEqual(MAX_DIFF);
        else {
          // Diferença maior que 1 só vale se estiver registrada com a causa, e o teste a trava no valor aceito.
          expect(row.accepted?.cause).toBeTruthy();
          expect(diff).toBe(accepted);
        }
      });
    }
  }

  it('contratar na 5x2 · 42h fica a até 3 pessoas do total da referência (15)', () => {
    let hire = 0;
    for (const row of Object.values(centroRows)) {
      const r = requiredPeople(row.role, week, SCENARIOS['5x2_42'], opts);
      if (!r.ok) throw new Error(r.reason);
      hire += Math.max(0, r.people - row.today);
    }
    expect(Math.abs(hire - 15)).toBeLessThanOrEqual(3);
  });
});
