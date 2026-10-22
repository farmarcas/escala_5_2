import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('deve validar a senha correta', async () => {
    const hash = await hashPassword('uma-senha-bem-longa');

    expect(await verifyPassword('uma-senha-bem-longa', hash)).toBe(true);
  });

  it('deve recusar senha errada', async () => {
    const hash = await hashPassword('uma-senha-bem-longa');

    expect(await verifyPassword('outra-senha-qualquer', hash)).toBe(false);
  });

  it('deve gerar hashes diferentes para a mesma senha (sal único)', async () => {
    const first = await hashPassword('mesma-senha-1234');
    const second = await hashPassword('mesma-senha-1234');

    expect(first).not.toBe(second);
    expect(first).not.toContain('mesma-senha-1234');
  });

  it('deve recusar hash em formato inesperado sem lançar erro', async () => {
    expect(await verifyPassword('qualquer', 'lixo')).toBe(false);
  });
});
