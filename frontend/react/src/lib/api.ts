export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: { path?: string; message?: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiInit = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown };

const FALLBACK_MESSAGE = 'Algo deu errado. Tente de novo em instantes.';

// Fala com a API pelo mesmo endereço da tela (o Vite repassa /api): o cookie de sessão vai junto.
export async function apiFetch<T = void>(path: string, init: ApiInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method: init.method ?? 'GET',
    headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    credentials: 'same-origin',
  });

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: [] } } | null)
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? FALLBACK_MESSAGE,
      error?.details ?? [],
    );
  }
  return data as T;
}

const SESSION_EXPIRED_MESSAGE =
  'Sua sessão expirou. Entre de novo em outra aba (o que você digitou continua aqui) e tente salvar outra vez.';

export const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') return SESSION_EXPIRED_MESSAGE;
  return error instanceof ApiError ? error.message : FALLBACK_MESSAGE;
};
