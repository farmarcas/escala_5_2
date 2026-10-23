import { describe, expect, it } from 'vitest';
import { roleWarning } from './roleWarning';
import type { DiagnosticRow, ScaleRole } from './types';

const role = (patch: Partial<ScaleRole>): ScaleRole => ({
  role: 'caixa',
  enabled: true,
  headcount: 0,
  monthlySalary: 1850,
  scaleType: 'normal',
  minInHall: 1,
  coverage: { mode: 'all' },
  daysMask: 127,
  ownerIsPharmacist: false,
  motorcycle: false,
  ...patch,
});

const row = (key: string, hire: number, need: number) =>
  ({
    key,
    hire: { '5x2_42': hire, '5x2_40': hire },
    need: { '5x2_42': need },
  }) as unknown as DiagnosticRow;

describe('aviso do passo 4', () => {
  it('avisa quando não há ninguém e o mínimo é 1, com o número de contratações', () => {
    const text = roleWarning(role({}), [row('caixa', 4, 4)]);
    expect(text).toContain('Você não tem ninguém aqui hoje');
    expect(text).toContain('4 contratações');
    expect(text).toContain('Faixa de horário');
  });

  it('não avisa quando a equipe já cobre o mínimo, quando o mínimo é 0 ou a função está desligada', () => {
    expect(roleWarning(role({ headcount: 1 }), [row('caixa', 3, 4)])).toBeNull();
    expect(roleWarning(role({ minInHall: 0 }), [row('caixa', 0, 0)])).toBeNull();
    expect(roleWarning(role({ enabled: false }), [row('caixa', 4, 4)])).toBeNull();
  });

  it('subgerente usa a linha da gerência', () => {
    expect(roleWarning(role({ role: 'subgerente' }), [row('gerencia', 2, 3)])).toContain(
      '2 contratações',
    );
  });
});
