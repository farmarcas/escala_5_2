export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Informe seu e-mail.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? undefined : 'Informe um e-mail válido.';
};

export const validatePassword = (password: string): string | undefined =>
  password.length >= 10 ? undefined : 'A senha precisa ter ao menos 10 caracteres.';

export type RegisterValues = {
  name: string;
  email: string;
  groupName: string;
  password: string;
  acceptPrivacy: boolean;
};

export function validateRegister(values: RegisterValues): FieldErrors<keyof RegisterValues> {
  const errors: FieldErrors<keyof RegisterValues> = {};
  if (values.name.trim().length < 2) errors.name = 'Informe seu nome.';
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  if (values.groupName.trim().length < 2) errors.groupName = 'Informe o nome do grupo ou da rede.';
  const password = validatePassword(values.password);
  if (password) errors.password = password;
  if (!values.acceptPrivacy) errors.acceptPrivacy = 'É preciso aceitar a política de privacidade.';
  return errors;
}

export type LoginValues = { email: string; password: string };

export function validateLogin(values: LoginValues): FieldErrors<keyof LoginValues> {
  const errors: FieldErrors<keyof LoginValues> = {};
  if (!values.email.trim()) errors.email = 'Informe seu e-mail.';
  if (!values.password) errors.password = 'Informe sua senha.';
  return errors;
}

export type GroupFormValues = { name: string; annualRevenue: number | null };

export function validateGroupForm(values: GroupFormValues): FieldErrors<keyof GroupFormValues> {
  const errors: FieldErrors<keyof GroupFormValues> = {};
  if (values.name.trim().length < 2) errors.name = 'Informe o nome do grupo ou da rede.';
  if (values.annualRevenue !== null && values.annualRevenue <= 0)
    errors.annualRevenue = 'Use um valor maior que zero ou deixe em branco.';
  return errors;
}
