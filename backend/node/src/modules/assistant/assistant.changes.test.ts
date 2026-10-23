import { describe, expect, it } from 'vitest';
import { defaultStore } from '../scales/scales.defaults.js';
import { applyChanges, changeSchema, ChangeError, type Change } from './assistant.changes.js';

const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };

describe('mudanças simuláveis', () => {
  it('aplica numa cópia e não altera a loja original', () => {
    const before = JSON.stringify(base);
    const { store, applied } = applyChanges(base, [
      { tipo: 'horario_padrao', abre: '07:00', fecha: '21:00' },
      { tipo: 'almoco', minutos: 90 },
    ]);
    expect(store.hours.standard.end).toBe('21:00');
    expect(store.rules.lunchMinutes).toBe(90);
    expect(JSON.stringify(base)).toBe(before);
    expect(applied.map((a) => a.passo)).toEqual(['horario', 'regras']);
  });

  it('fechar um dia e reabrir no padrão', () => {
    const closed = applyChanges(base, [{ tipo: 'horario_dia', dia: 6, fechado: true }]).store;
    expect(closed.hours.overrides['6']).toEqual({ closed: true });
    const reopened = applyChanges(closed, [{ tipo: 'horario_dia', dia: 6 }]).store;
    expect(reopened.hours.overrides['6']).toBeUndefined();
    expect(reopened.hours.standard.daysMask & (1 << 6)).not.toBe(0);
  });

  it('plantão, feriados, quantidade, salário, 12x36, faixa e dias da função', () => {
    const { store } = applyChanges(base, [
      { tipo: 'plantao', plantao: 'weekly', cobertura: 'intermittent' },
      { tipo: 'feriados', compensacao: 'dobro', abreNosFeriados: false },
      { tipo: 'quantidade', funcao: 'caixa', quantidade: 3 },
      { tipo: 'salario', funcao: 'caixa', salario: 2000 },
      { tipo: 'escala_12x36', funcao: 'caixa', ligado: true },
      { tipo: 'faixa', funcao: 'balconista', inicio: '08:00', fim: '20:00' },
      { tipo: 'dias_da_funcao', funcao: 'balconista', dias: [0, 1, 2, 3, 4, 5] },
    ]);
    const caixa = store.roles.find((r) => r.role === 'caixa')!;
    expect(store.plantao).toMatchObject({ type: 'weekly', cover: 'intermittent' });
    expect(store.holidays).toMatchObject({ compensation: 'dobro', openOnHolidays: false });
    expect(caixa).toMatchObject({
      headcount: 3,
      monthlySalary: 2000,
      scaleType: 'doze_x_trinta_e_seis',
    });
    expect(store.roles.find((r) => r.role === 'balconista')!.coverage).toEqual({
      mode: 'band',
      start: '08:00',
      end: '20:00',
    });
  });

  it('recusa campo fora da lista, valor fora do limite e mudança com campo extra', () => {
    expect(changeSchema.safeParse({ tipo: 'nome_da_loja', nome: 'X' }).success).toBe(false);
    expect(
      changeSchema.safeParse({ tipo: 'quantidade', funcao: 'caixa', quantidade: 999 }).success,
    ).toBe(false);
    expect(changeSchema.safeParse({ tipo: 'salario', funcao: 'caixa', salario: -5 }).success).toBe(
      false,
    );
    expect(changeSchema.safeParse({ tipo: 'almoco', minutos: 45 }).success).toBe(false);
    expect(changeSchema.safeParse({ tipo: 'almoco', minutos: 60, gravar: true }).success).toBe(
      false,
    );
  });

  it('recusa mudança que deixa a loja inválida (farmacêutico fora do horário, domingo com folga todo domingo)', () => {
    const farm: Change = { tipo: 'faixa', funcao: 'farmaceutico', inicio: '09:00', fim: '18:00' };
    expect(() => applyChanges(base, [farm])).toThrow(ChangeError);
    expect(() => applyChanges(base, [{ tipo: 'folga_dominical', regra: 'todo_domingo' }])).toThrow(
      /domingo/,
    );
    expect(() =>
      applyChanges(base, [{ tipo: 'quantidade', funcao: 'farmaceutico', quantidade: 0 }]),
    ).toThrow(/farmacêutico/);
  });

  it('função inexistente na loja', () => {
    const off = { ...base, roles: base.roles.filter((r) => r.role !== 'comprador') };
    expect(() =>
      applyChanges(off, [{ tipo: 'quantidade', funcao: 'comprador', quantidade: 1 }]),
    ).toThrow(/não existe/);
  });
});
