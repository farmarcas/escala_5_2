import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { sameOrigin } from './same-origin.js';

const run = (method: string, headers: Record<string, string>) => {
  const middleware = sameOrigin('http://localhost:3000');
  const req = {
    method,
    headers,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
  const next = vi.fn();
  middleware(req, {} as Response, next);
  return next;
};

describe('sameOrigin', () => {
  it('deve deixar passar leitura sem checar a origem', () => {
    expect(run('GET', { origin: 'https://outro.site' })).toHaveBeenCalledWith();
  });

  it('deve deixar passar escrita vinda do próprio site', () => {
    expect(
      run('POST', { origin: 'http://localhost:3000', host: 'localhost:3000' }),
    ).toHaveBeenCalledWith();
  });

  it('deve bloquear escrita vinda de outro site', () => {
    const next = run('POST', { origin: 'https://outro.site', host: 'localhost:3000' });

    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403, code: 'FORBIDDEN_ORIGIN' });
  });

  it('deve deixar passar escrita sem Origin (cliente que não é navegador)', () => {
    expect(run('POST', { host: 'localhost:4000' })).toHaveBeenCalledWith();
  });

  it('deve bloquear escrita sem Origin marcada como entre sites pelo navegador', () => {
    const next = run('POST', { 'sec-fetch-site': 'cross-site', host: 'localhost:3000' });

    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403 });
  });
});
