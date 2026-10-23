import { describe, expect, it } from 'vitest';
import { productionProblems } from './env.js';

const prod = {
  NODE_ENV: 'production',
  COOKIE_SECURE: true,
  APP_BASE_URL: 'https://radar.exemplo.com.br',
  MAIL_USER: 'u',
  MAIL_PASSWORD: 'p',
} as Parameters<typeof productionProblems>[0];

describe('productionProblems', () => {
  it('configuração correta não tem problema', () => {
    expect(productionProblems(prod)).toEqual([]);
  });

  it('recusa cookie sem Secure, endereço sem https e e-mail sem credenciais', () => {
    const p = productionProblems({
      ...prod,
      COOKIE_SECURE: false,
      APP_BASE_URL: 'http://x.com',
      MAIL_USER: undefined,
    });
    expect(p).toHaveLength(3);
  });

  it('ALLOW_PRODUCTION_WITHOUT_MAIL libera só a falta de e-mail, nada além', () => {
    const noMail = { ...prod, MAIL_USER: undefined, MAIL_PASSWORD: undefined };
    expect(productionProblems(noMail)).toHaveLength(1);
    expect(productionProblems({ ...noMail, ALLOW_PRODUCTION_WITHOUT_MAIL: true })).toEqual([]);
    expect(
      productionProblems({ ...noMail, ALLOW_PRODUCTION_WITHOUT_MAIL: true, COOKIE_SECURE: false }),
    ).toHaveLength(1);
  });

  it('fora de produção não exige nada', () => {
    expect(productionProblems({ ...prod, NODE_ENV: 'development', COOKIE_SECURE: false })).toEqual(
      [],
    );
  });
});
