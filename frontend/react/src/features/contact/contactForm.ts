export type ContactSnapshot = {
  profile: Record<string, unknown>;
  result: Record<string, unknown>;
};

// Nome, e-mail e empresa vêm da conta de quem está logado; o formulário pede só o que a conta não tem.
export type ContactFormValues = {
  roleTitle: string;
  phone: string;
  sector: string;
  acceptPrivacy: boolean;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export const emptyContactForm = (): ContactFormValues => ({
  roleTitle: '',
  phone: '',
  sector: '',
  acceptPrivacy: false,
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
  if (values.roleTitle.trim().length < 2) errors.roleTitle = 'Informe seu cargo.';
  const phoneDigits = values.phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 11)
    errors.phone = 'Informe um telefone com DDD.';
  if (!values.acceptPrivacy)
    errors.acceptPrivacy = 'É preciso aceitar ser contatado e a política de privacidade.';
  return errors;
}

export type ContactRequest = {
  source: 'consultor';
  mode: 'detalhado';
  roleTitle: string;
  phone: string;
  sector?: string;
  acceptPrivacy: true;
  profile: Record<string, unknown>;
  result: Record<string, unknown>;
  idempotencyKey: string;
  utm?: string;
};

export function buildContactRequest(
  values: ContactFormValues,
  context: { snapshot: ContactSnapshot; idempotencyKey: string; utm?: string },
): ContactRequest {
  const sector = values.sector.trim();
  return {
    source: 'consultor',
    mode: 'detalhado',
    roleTitle: values.roleTitle.trim(),
    phone: values.phone,
    ...(sector && { sector }),
    acceptPrivacy: true,
    profile: context.snapshot.profile,
    result: context.snapshot.result,
    idempotencyKey: context.idempotencyKey,
    ...(context.utm && { utm: context.utm }),
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
