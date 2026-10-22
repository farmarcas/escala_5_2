import { validateEmail } from '@/features/auth/validateAuthForms';

export type ContactSource = 'consultor' | 'pdf';

export type ContactSnapshot = {
  mode: 'rapido' | 'detalhado';
  profile: Record<string, unknown>;
  result: Record<string, unknown>;
};

export type ContactFormValues = {
  name: string;
  roleTitle: string;
  company: string;
  phone: string;
  email: string;
  sector: string;
  acceptPrivacy: boolean;
  // Campo isca anti-robô: pessoas nunca o veem nem preenchem.
  website: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export const emptyContactForm = (): ContactFormValues => ({
  name: '',
  roleTitle: '',
  company: '',
  phone: '',
  email: '',
  sector: '',
  acceptPrivacy: false,
  website: '',
});

export const maskPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};
  if (values.name.trim().length < 2) errors.name = 'Informe seu nome.';
  if (values.roleTitle.trim().length < 2) errors.roleTitle = 'Informe seu cargo.';
  if (values.company.trim().length < 2) errors.company = 'Informe o nome da empresa.';
  const phoneDigits = values.phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 11)
    errors.phone = 'Informe um telefone com DDD.';
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  if (!values.acceptPrivacy) errors.acceptPrivacy = 'É preciso aceitar a política de privacidade.';
  return errors;
}

export type ContactRequest = {
  source: ContactSource;
  mode: ContactSnapshot['mode'];
  name: string;
  roleTitle: string;
  company: string;
  phone: string;
  email: string;
  sector?: string;
  acceptPrivacy: true;
  profile: Record<string, unknown>;
  result: Record<string, unknown>;
  idempotencyKey: string;
  utm?: string;
  website: string;
};

export function buildContactRequest(
  values: ContactFormValues,
  context: {
    source: ContactSource;
    snapshot: ContactSnapshot;
    idempotencyKey: string;
    utm?: string;
  },
): ContactRequest {
  const sector = values.sector.trim();
  return {
    source: context.source,
    mode: context.snapshot.mode,
    name: values.name.trim(),
    roleTitle: values.roleTitle.trim(),
    company: values.company.trim(),
    phone: values.phone,
    email: values.email.trim(),
    ...(sector && { sector }),
    acceptPrivacy: true,
    profile: context.snapshot.profile,
    result: context.snapshot.result,
    idempotencyKey: context.idempotencyKey,
    ...(context.utm && { utm: context.utm }),
    website: values.website,
  };
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

// Guarda de onde veio o contato (campanha), só com os parâmetros utm da página.
export const readUtm = (search: string): string | undefined => {
  const params = new URLSearchParams(search);
  const parts = UTM_KEYS.flatMap((key) => {
    const value = params.get(key);
    return value ? [`${key}=${value}`] : [];
  });
  return parts.length > 0 ? parts.join('&') : undefined;
};
