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
} from '../contactForm';

type ContactFormModalProps = {
  isOpen: boolean;
  snapshot: ContactSnapshot;
  onClose: () => void;
};

type FormBodyProps = Omit<ContactFormModalProps, 'isOpen'>;

// Montado de novo a cada abertura (key): cada tentativa ganha sua própria chave de envio,
// e um duplo clique reaproveita a mesma, gravando um único pedido.
function ContactFormBody({ snapshot, onClose }: FormBodyProps) {
  const { state: auth } = useAuth();
  const [values, setValues] = useState<ContactFormValues>(emptyContactForm);
  const [showErrors, setShowErrors] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const { submit, isSubmitting, error } = useSubmit(async (formValues: ContactFormValues) => {
    await apiFetch('/contact-requests', {
      method: 'POST',
      body: buildContactRequest(formValues, {
        snapshot,
        idempotencyKey,
        utm: readUtm(window.location.search),
      }),
    });
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
        <FormMessage tone="success">Pedido de contato registrado.</FormMessage>
        <p className="text-sm">Um consultor Farmarcas entra em contato com você em breve.</p>
        <Button onClick={onClose}>Fechar</Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <p className="text-muted-foreground text-sm">
        Um consultor da Farmarcas entra em contato para detalhar o resultado e o plano de adequação
        da sua loja.
      </p>

      {auth.status === 'authenticated' ? (
        <dl className="bg-muted grid gap-1 rounded-md p-3 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Nome:</dt>
            <dd>{auth.user.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">E-mail:</dt>
            <dd>{auth.user.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Empresa:</dt>
            <dd>{auth.group.name}</dd>
          </div>
        </dl>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Cargo"
          autoComplete="organization-title"
          value={values.roleTitle}
          onChange={(event) => set('roleTitle', event.target.value)}
          error={errors.roleTitle}
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
      </div>
      <TextField
        label="Setor (opcional)"
        value={values.sector}
        onChange={(event) => set('sector', event.target.value)}
      />

      <div className="flex flex-col gap-1">
        <Checkbox
          label="Aceito ser contatado e a política de privacidade"
          description="Usamos seus dados só para este contato e para o painel."
          checked={values.acceptPrivacy}
          onChange={(event) => set('acceptPrivacy', event.target.checked)}
        />
        <Link to="/privacidade" target="_blank" className="text-primary-strong text-xs underline">
          Ler a política de privacidade
        </Link>
        {errors.acceptPrivacy ? (
          <p role="alert" className="text-critical text-xs">
            {errors.acceptPrivacy}
          </p>
        ) : null}
      </div>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Pedindo contato…' : 'Pedir contato'}
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
    <Modal isOpen={isOpen} title="Falar com um consultor" onClose={rest.onClose}>
      {isOpen ? <ContactFormBody key={openCount} {...rest} /> : null}
    </Modal>
  );
}
