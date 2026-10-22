import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useSubmit } from '@/hooks/useSubmit';
import { apiFetch } from '@/lib/api';
import { validatePassword } from '../validateAuthForms';
import { AuthCard } from './AuthCard';
import { FormMessage } from './FormMessage';

export function ResetPasswordForm() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { submit, isSubmitting, error } = useSubmit((value: string) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: { token, password: value } }),
  );

  const passwordError = showErrors ? validatePassword(password) : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (validatePassword(password)) return;
    if (await submit(password)) setIsDone(true);
  };

  if (!token) {
    return (
      <AuthCard title="Link incompleto">
        <FormMessage tone="error">
          Este link não tem o código de redefinição. Peça um novo link.
        </FormMessage>
        <Link to="/esqueci-a-senha" className="text-primary-strong text-sm font-medium underline">
          Pedir novo link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Criar nova senha">
      {isDone ? (
        <>
          <FormMessage tone="success">
            Senha alterada. Por segurança, você foi desconectado dos outros aparelhos.
          </FormMessage>
          <Link to="/entrar" className="text-primary-strong text-sm font-medium underline">
            Entrar com a nova senha
          </Link>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint="Pelo menos 10 caracteres."
            error={passwordError}
          />
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
