import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/features/auth';
import { FormMessage } from '@/features/auth/components/FormMessage';
import { useSubmit } from '@/hooks/useSubmit';
import { apiFetch } from '@/lib/api';
import {
  buildContactRequest,
  emptyContactForm,
  maskPhone,
  readUtm,
  validateContactForm,
  type ContactFormValues,
  type ContactSnapshot,
  type ContactSource,
} from '../contactForm';

type ContactFormModalProps = {
  isOpen: boolean;
  source: ContactSource;
  snapshot: ContactSnapshot;
  onClose: () => void;
  // Chamado depois que o contato foi registrado (o relatório em PDF baixa aqui). Se falhar, a pessoa vê o
  // erro e pode tentar de novo: o envio repetido reaproveita a mesma chave e não duplica o contato.
  onRegistered?: () => void | Promise<void>;
};

const COPY: Record<
  ContactSource,
  { title: string; description: string; submit: string; doneTitle: string; doneText: string }
> = {
  consultor: {
    title: 'Falar com um consultor',
    description:
      'Preencha os dados. Um consultor da Farmarcas entra em contato para detalhar o impacto e o plano de adequação do seu grupo.',
    submit: 'Enviar',
    doneTitle: 'Solicitação registrada!',
    doneText: 'Seus dados foram registrados. Nossa equipe entra em contato em breve.',
  },
  pdf: {
    title: 'Baixar relatório em PDF',
    description:
      'Informe seus dados para baixar o relatório completo com o resultado da sua simulação.',
    submit: 'Baixar relatório',
    doneTitle: 'Relatório baixado!',
    doneText:
      'O PDF com o resultado da sua simulação foi baixado. Nossa equipe também pode entrar em contato para aprofundar a análise.',
  },
};

type FormBodyProps = Omit<ContactFormModalProps, 'isOpen'>;

// Montado de novo a cada abertura (key): cada tentativa ganha sua própria chave de envio,
// e um duplo clique reaproveita a mesma, gravando um único pedido.
function ContactFormBody({ source, snapshot, onClose, onRegistered }: FormBodyProps) {
  const { state: auth } = useAuth();
  const copy = COPY[source];
  const [values, setValues] = useState<ContactFormValues>(() => ({
    ...emptyContactForm(),
    ...(auth.status === 'authenticated' && {
      name: auth.user.name,
      email: auth.user.email,
      company: auth.group.name,
    }),
  }));
  const [showErrors, setShowErrors] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const { submit, isSubmitting, error } = useSubmit(async (formValues: ContactFormValues) => {
    await apiFetch('/contact-requests', {
      method: 'POST',
      body: buildContactRequest(formValues, {
        source,
        snapshot,
        idempotencyKey,
        utm: readUtm(window.location.search),
      }),
    });
    await onRegistered?.();
  });

  const errors = showErrors ? validateContactForm(values) : {};
  const set = <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (Object.keys(validateContactForm(values)).length > 0) return;
    if (await submit(values)) setIsDone(true);
  };

  if (isDone) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="success">{copy.doneTitle}</FormMessage>
        <p className="text-sm">{copy.doneText}</p>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <p className="text-muted-foreground text-sm">{copy.description}</p>
      <TextField
        label="Nome"
        autoComplete="name"
        value={values.name}
        onChange={(event) => set('name', event.target.value)}
        error={errors.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Cargo"
          autoComplete="organization-title"
          value={values.roleTitle}
          onChange={(event) => set('roleTitle', event.target.value)}
          error={errors.roleTitle}
        />
        <TextField
          label="Empresa"
          autoComplete="organization"
          value={values.company}
          onChange={(event) => set('company', event.target.value)}
          error={errors.company}
        />
        <TextField
          label="Telefone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="(11) 98888-7777"
          value={values.phone}
          onChange={(event) => set('phone', maskPhone(event.target.value))}
          error={errors.phone}
        />
        <TextField
          label="E-mail corporativo"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => set('email', event.target.value)}
          error={errors.email}
        />
      </div>
      <TextField
        label="Setor (opcional)"
        value={values.sector}
        onChange={(event) => set('sector', event.target.value)}
      />

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha este campo
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(event) => set('website', event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <Checkbox
          label="Li e aceito a política de privacidade"
          description="Usamos seus dados só para este contato e para a calculadora."
          checked={values.acceptPrivacy}
          onChange={(event) => set('acceptPrivacy', event.target.checked)}
        />
        <Link to="/privacidade" target="_blank" className="text-primary-strong text-xs underline">
          Ler a política de privacidade
        </Link>
        {errors.acceptPrivacy ? (
          <p role="alert" className="text-destructive text-xs">
            {errors.acceptPrivacy}
          </p>
        ) : null}
      </div>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : copy.submit}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function ContactFormModal({ isOpen, ...rest }: ContactFormModalProps) {
  const [openCount, setOpenCount] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);

  // Cada abertura monta o formulário do zero.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setOpenCount((current) => current + 1);
  }

  return (
    <Modal isOpen={isOpen} title={COPY[rest.source].title} onClose={rest.onClose}>
      {isOpen ? <ContactFormBody key={openCount} {...rest} /> : null}
    </Modal>
  );
}
