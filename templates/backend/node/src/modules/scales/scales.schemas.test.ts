import { describe, expect, it } from 'vitest';
import { defaultStore } from './scales.defaults.js';
import { scaleStoreSchema } from './scales.schemas.js';

const valid = () => ({
  ...defaultStore('2026-12-14'),
  name: 'Centro',
  city: 'Varginha',
  state: 'MG',
});
const issues = (input: unknown) => {
  const r = scaleStoreSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe('scaleStoreSchema', () => {
  it('aceita a loja de exemplo', () => {
    expect(issues(valid())).toEqual([]);
  });

  it('exige início de escala numa segunda-feira', () => {
    expect(issues({ ...valid(), scaleStartDate: '2026-12-15' })).toContain(
      'O início da escala precisa ser uma segunda-feira',
    );
  });

  it('exige farmacêutico ativo com presença em todo o horário', () => {
    const base = valid();
    const noPharm = {
      ...base,
      roles: base.roles.map((r) => (r.role === 'farmaceutico' ? { ...r, headcount: 0 } : r)),
    };
    expect(issues(noPharm).join()).toContain('ao menos 1 farmacêutico');
    const band = {
      ...base,
      roles: base.roles.map((r) =>
        r.role === 'farmaceutico'
          ? { ...r, coverage: { mode: 'band' as const, start: '09:00', end: '18:00' } }
          : r,
      ),
    };
    expect(issues(band).join()).toContain('todo o horário');
  });

  it('recusa funções repetidas, moto fora do entregador e UF inválida', () => {
    const base = valid();
    expect(issues({ ...base, roles: [...base.roles, base.roles[0]] }).join()).toContain(
      'repetidas',
    );
    expect(
      issues({
        ...base,
        roles: base.roles.map((r) => (r.role === 'caixa' ? { ...r, motorcycle: true } : r)),
      }).join(),
    ).toContain('Só o entregador');
    expect(issues({ ...base, state: 'mg' }).join()).toContain('UF');
  });

  it('recusa folga todo domingo com loja aberta no domingo', () => {
    const base = valid();
    const bad = { ...base, rules: { ...base.rules, sundayRule: 'todo_domingo' as const } };
    expect(issues(bad).join()).toContain('não pode abrir no domingo');
    const closed = {
      ...bad,
      hours: { ...bad.hours, overrides: { '6': { closed: true as const } } },
    };
    expect(issues(closed)).toEqual([]);
  });

  it('recusa campos desconhecidos', () => {
    expect(scaleStoreSchema.safeParse({ ...valid(), extra: 1 }).success).toBe(false);
  });

  it('plantão exige farmacêutico e não aceita início igual ao fim', () => {
    const base = valid();
    const semFarmaceutico = {
      ...base,
      plantao: {
        ...base.plantao,
        type: 'weekly' as const,
        people: { farmaceutico: 0, balconista: 1, caixa: 0 },
      },
    };
    expect(issues(semFarmaceutico).join()).toContain('plantão precisa de farmacêutico');
    const igual = { ...base, plantao: { ...base.plantao, start: '22:00', end: '22:00' } };
    expect(issues(igual).join()).toContain('Início e fim do plantão');
  });

  it('lojas sem plantão e feriados no corpo recebem o padrão', () => {
    const { plantao: _p, holidays: _h, ...rest } = valid();
    const r = scaleStoreSchema.safeParse(rest);
    expect(r.success && r.data.plantao.type).toBe('none');
    expect(r.success && r.data.holidays.national).toBe(true);
  });
});
