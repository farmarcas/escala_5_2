import type { DiagnosticRow, ScaleRole } from './types';

// A linha do quadro que representa a função (gerente e subgerente dividem a linha "gerencia").
const rowKeyOf = (role: ScaleRole['role']) =>
  role === 'subgerente' ? 'gerencia' : role === 'gerente' ? 'gerencia' : role;

// Aviso do passo 4: a função pede gente presente o tempo todo mas a loja tem menos gente do que isso hoje.
export function roleWarning(role: ScaleRole, rows: DiagnosticRow[]): string | null {
  if (!role.enabled || role.minInHall < 1 || role.headcount >= role.minInHall) return null;
  const row = rows.find((r) => r.key === rowKeyOf(role.role));
  if (!row || row.hire['5x2_42'] < 1) return null;
  const have =
    role.headcount === 0
      ? 'Você não tem ninguém aqui hoje'
      : `Você tem ${role.headcount} aqui hoje`;
  const hire = row.hire['5x2_42'];
  return `${have} e pediu ${role.minInHall} ${role.minInHall === 1 ? 'pessoa presente' : 'pessoas presentes'} o tempo todo. Isso gera ${hire} ${hire === 1 ? 'contratação' : 'contratações'} (a função precisa de ${row.need['5x2_42']} pessoas). Se ela não precisa ficar o dia todo, use "Faixa de horário" ou mínimo 0.`;
}
