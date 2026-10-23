import { describe, expect, it } from 'vitest';
import { defaultStore } from '../scales/scales.defaults.js';
import { toModelStore } from './assistant.sanitize.js';

const store = {
  ...defaultStore('2026-12-14'),
  name: 'Drogaria Segredo da Maria',
  city: 'Cidade Secreta',
  state: 'MG',
  rules: {
    ...defaultStore('2026-12-14').rules,
    cct: 'Sindicato do Fulano, vigência 2026, tel (35) 99999-0000',
  },
  holidays: {
    ...defaultStore('2026-12-14').holidays,
    extra: [{ date: '2026-12-16', name: 'Aniversário de Cidade Secreta' }],
  },
};

describe('toModelStore', () => {
  const json = JSON.stringify(toModelStore(store));

  it('não leva nome, cidade, UF, convenção coletiva nem nome de feriado ao modelo', () => {
    for (const secret of [
      'Segredo',
      'Maria',
      'Cidade Secreta',
      'Fulano',
      '99999',
      'Aniversário',
      '"MG"',
    ]) {
      expect(json).not.toContain(secret);
    }
  });

  it('não leva identificadores nem as chaves de identificação', () => {
    for (const key of ['"name"', '"city"', '"state"', '"id"', 'email', 'phone', 'groupId']) {
      expect(json).not.toContain(key);
    }
  });

  it('mantém o que a análise precisa: quadro, salários, horários e regras', () => {
    expect(json).toContain('colaboradoresHoje');
    expect(json).toContain('salarioDeRegistro');
    expect(json).toContain('07:00');
    expect(json).toContain('folgaDominical');
    expect(json).toContain('"convencaoColetivaInformada":true');
  });

  it('deixa de fora funções desligadas', () => {
    expect(json).not.toContain('comprador');
  });
});
