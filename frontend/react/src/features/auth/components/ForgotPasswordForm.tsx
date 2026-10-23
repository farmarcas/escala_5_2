import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useSubmit } from '@/hooks/useSubmit';
import { apiFetch } from '@/lib/api';
import { validateEmail } from '../validateAuthForms';
import { AuthCard } from './AuthCard';
import { FormMessage } from './FormMessage';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { submit, isSubmitting, error } = useSubmit((value: string) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: { email: value } }),
  );

  const emailError = showErrors ? validateEmail(email) : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (validateEmail(email)) return;
    if (await submit(email)) setIsDone(true);
  };

  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Informe o e-mail da conta e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/entrar" className="text-primary-strong font-medium underline">
          Voltar para a entrada
        </Link>
      }
    >
      {isDone ? (
        <FormMessage tone="success">
          Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele vale por 1
          hora.
        </FormMessage>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
          />
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Receber link por e-mail'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
