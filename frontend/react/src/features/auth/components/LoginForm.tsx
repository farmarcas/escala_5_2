import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useSubmit } from '@/hooks/useSubmit';
import { useAuth } from '../hooks/useAuth';
import { validateLogin, type LoginValues } from '../validateAuthForms';
import { AuthCard } from './AuthCard';
import { FormMessage } from './FormMessage';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [showErrors, setShowErrors] = useState(false);
  const { submit, isSubmitting, error } = useSubmit((input: LoginValues) =>
    login(input.email, input.password),
  );

  const errors = showErrors ? validateLogin(values) : {};

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(validateLogin(values)).length > 0) return;
    if (await submit(values)) navigate('/lojas');
  };

  return (
    <AuthCard
      title="Entrar"
      description="Acesse o modo detalhado, por loja."
      footer={
        <div className="flex flex-col gap-1">
          <Link to="/esqueci-a-senha" className="text-primary-strong font-medium underline">
            Esqueci minha senha
          </Link>
          <span>
            Ainda não tem conta?{' '}
            <Link to="/cadastrar" className="text-primary-strong font-medium underline">
              Criar conta
            </Link>
          </span>
        </div>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
          error={errors.email}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          error={errors.password}
        />
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthCard>
  );
}
