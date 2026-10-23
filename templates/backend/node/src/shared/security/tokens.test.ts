import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from './tokens.js';

describe('tokens', () => {
  it('deve gerar token aleatório e o hash correspondente', () => {
    const first = generateToken();
    const second = generateToken();

    expect(first.token).not.toBe(second.token);
    expect(first.token.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(first.token)).toBe(first.hash);
  });

  it('deve guardar só o hash, nunca o token', () => {
    const { token, hash } = generateToken();

    expect(hash).not.toContain(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
