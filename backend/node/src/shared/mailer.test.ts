import { describe, expect, it } from 'vitest';
import { smtpOptions } from './mailer.js';

const base = { MAIL_HOST: 'smtp.exemplo.com', MAIL_PORT: 587 };

describe('smtpOptions', () => {
  it('sem credenciais: sem autenticação (caixa de teste)', () => {
    const o = smtpOptions({ ...base, MAIL_PORT: 1025 }) as Record<string, unknown>;
    expect(o.auth).toBeUndefined();
    expect(o.secure).toBe(false);
  });

  it('com credenciais: autentica e exige TLS (STARTTLS na 587)', () => {
    const o = smtpOptions({ ...base, MAIL_USER: 'u', MAIL_PASSWORD: 'p' }) as Record<
      string,
      unknown
    >;
    expect(o.auth).toEqual({ user: 'u', pass: 'p' });
    expect(o.requireTLS).toBe(true);
    expect(o.secure).toBe(false);
  });

  it('porta 465 é segura direto; MAIL_SECURE sobrescreve', () => {
    expect((smtpOptions({ ...base, MAIL_PORT: 465 }) as Record<string, unknown>).secure).toBe(true);
    expect(
      (smtpOptions({ ...base, MAIL_PORT: 465, MAIL_SECURE: false }) as Record<string, unknown>)
        .secure,
    ).toBe(false);
  });
});
