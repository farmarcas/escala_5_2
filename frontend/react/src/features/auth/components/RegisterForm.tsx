import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { TextField } from '@/components/ui/TextField';
import { useSubmit } from '@/hooks/useSubmit';
import { apiFetch } from '@/lib/api';
import { validateRegister, type RegisterValues } from '../validateAuthForms';
import { AuthCard } from './AuthCard';
import { FormMessage } from './FormMessage';

const EMPTY: RegisterValues = {
  name: '',
  email: '',
  groupName: '',
  password: '',
  acceptPrivacy: false,
};

export function RegisterForm() {
  const [values, setValues] = useState<RegisterValues>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { submit, isSubmitting, error } = useSubmit((input: RegisterValues) =>
    apiFetch('/auth/register', { method: 'POST', body: input }),
  );

  const errors = showErrors ? validateRegister(values) : {};
  const set = <K extends keyof RegisterValues>(key: K, value: RegisterValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(validateRegister(values)).length > 0) return;
    if (await submit(values)) setIsDone(true);
  };

  if (isDone) {
    return (
      <AuthCard title="Confira seu e-mail">
        <FormMessage tone="success">
          {`Enviamos um link de confirmação para ${values.email.trim()}. Clique nele para ativar a conta e depois entre.`}
        </FormMessage>
        <Link to="/entrar" className="text-primary-strong text-sm font-medium underline">
          Ir para a entrada
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Criar conta"
      description="Cadastre seu grupo para simular o impacto loja a loja e salvar os cenários."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" className="text-primary-strong font-medium underline">
            Entrar
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Seu nome"
          autoComplete="name"
          value={values.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
        />
        <TextField
          label="E-mail corporativo"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => set('email', event.target.value)}
          error={errors.email}
        />
        <TextField
          label="Nome do grupo ou da rede"
          value={values.groupName}
          onChange={(event) => set('groupName', event.target.value)}
          error={errors.groupName}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => set('password', event.target.value)}
          hint="Pelo menos 10 caracteres."
          error={errors.password}
        />
        <div className="flex flex-col gap-1">
          <Checkbox
            label="Li e aceito a política de privacidade"
            description="Usamos seus dados só para a calculadora e o contato da Farmarcas."
            checked={values.acceptPrivacy}
            onChange={(event) => set('acceptPrivacy', event.target.checked)}
          />
          <Link to="/privacidade" className="text-primary-strong text-xs underline">
            Ler a política de privacidade
          </Link>
          {errors.acceptPrivacy ? (
            <p role="alert" className="text-destructive text-xs">
              {errors.acceptPrivacy}
            </p>
          ) : null}
        </div>
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
    </AuthCard>
  );
}
