import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, errorMessage } from '@/lib/api';
import { AuthCard } from './AuthCard';
import { FormMessage } from './FormMessage';

type Status = { kind: 'loading' } | { kind: 'ok' } | { kind: 'error'; message: string };

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>(
    token
      ? { kind: 'loading' }
      : { kind: 'error', message: 'Este link não tem o código de confirmação.' },
  );
  // O token vale uma vez só: em desenvolvimento o React executa o efeito duas vezes, então travamos.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    apiFetch('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setStatus({ kind: 'ok' }))
      .catch((error: unknown) => setStatus({ kind: 'error', message: errorMessage(error) }));
  }, [token]);

  return (
    <AuthCard title="Confirmação de e-mail">
      {status.kind === 'loading' ? <p role="status">Confirmando…</p> : null}
      {status.kind === 'ok' ? (
        <>
          <FormMessage tone="success">E-mail confirmado! Sua conta está ativa.</FormMessage>
          <Link to="/entrar" className="text-primary-strong text-sm font-medium underline">
            Entrar
          </Link>
        </>
      ) : null}
      {status.kind === 'error' ? (
        <>
          <FormMessage tone="error">{status.message}</FormMessage>
          <Link to="/cadastrar" className="text-primary-strong text-sm font-medium underline">
            Criar a conta de novo
          </Link>
        </>
      ) : null}
    </AuthCard>
  );
}
