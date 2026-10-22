import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, errorMessage } from './api';

const mockFetch = (status: number, body: unknown) => {
  const fetchMock = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('deve devolver o JSON de uma resposta de sucesso', async () => {
    const fetchMock = mockFetch(200, { ok: true });

    await expect(apiFetch('/auth/me')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    );
  });

  it('deve enviar JSON no corpo', async () => {
    const fetchMock = mockFetch(201, {});

    await apiFetch('/stores', { method: 'POST', body: { name: 'Centro' } });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/stores',
      expect.objectContaining({
        body: '{"name":"Centro"}',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('deve tratar 204 como resposta vazia', async () => {
    mockFetch(204, null);

    await expect(apiFetch('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('deve lançar ApiError com código e mensagem da API', async () => {
    mockFetch(401, {
      error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos' },
    });

    const error = await apiFetch('/auth/login', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(errorMessage(error)).toBe('E-mail ou senha incorretos');
  });

  it('deve usar mensagem padrão quando a resposta de erro não é JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 502,
        ok: false,
        json: async () => {
          throw new Error('sem json');
        },
      }),
    );

    const error = await apiFetch('/x').catch((e: unknown) => e);

    expect(errorMessage(error)).toContain('Tente de novo');
  });

  it('deve explicar a sessão expirada sem perder o que a pessoa digitou', () => {
    const error = new ApiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar');

    expect(errorMessage(error)).toContain('sessão expirou');
    expect(errorMessage(error)).toContain('continua aqui');
  });
});
