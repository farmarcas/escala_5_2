import type {
  OpeningHour,
  RoleKind,
  Store,
  StoreProfileKind,
  StoreRequest,
  StoreRole,
} from './types';

export const WEEKDAYS: { weekday: number; label: string }[] = [
  { weekday: 1, label: 'Segunda-feira' },
  { weekday: 2, label: 'Terça-feira' },
  { weekday: 3, label: 'Quarta-feira' },
  { weekday: 4, label: 'Quinta-feira' },
  { weekday: 5, label: 'Sexta-feira' },
  { weekday: 6, label: 'Sábado' },
  { weekday: 0, label: 'Domingo' },
];

export const ROLE_ORDER: RoleKind[] = ['farmaceutico', 'balconista', 'caixa', 'estoquista'];

export const ROLE_LABELS: Record<RoleKind, string> = {
  farmaceutico: 'Farmacêutico',
  balconista: 'Balconista',
  caixa: 'Caixa',
  estoquista: 'Estoquista',
};

export const PROFILE_LABELS: Record<StoreProfileKind, string> = {
  rua: 'Loja de rua',
  shopping: 'Loja de shopping',
  '24h': 'Loja 24 horas',
};

export type DayValues = { isOpen: boolean; opensAt: string; closesAt: string };

export type RoleValues = {
  isEnabled: boolean;
  minPerShift: number | null;
  headcount: number | null;
  weeklyHours: number | null;
  monthlySalary: number | null;
  absenceRatePct: number | null;
};

export type StoreFormValues = {
  name: string;
  city: string;
  profile: StoreProfileKind;
  days: Record<number, DayValues>;
  roles: Record<RoleKind, RoleValues>;
};

// Chaves: name, city, days, day.<0-6>, role.<função>.<campo>
export type StoreFormErrors = Record<string, string>;

const emptyRole = (isEnabled: boolean): RoleValues => ({
  isEnabled,
  minPerShift: isEnabled ? 1 : null,
  headcount: null,
  weeklyHours: 44,
  monthlySalary: null,
  absenceRatePct: null,
});

export const emptyStoreForm = (): StoreFormValues => ({
  name: '',
  city: '',
  profile: 'rua',
  days: Object.fromEntries(
    WEEKDAYS.map(({ weekday }) => [
      weekday,
      { isOpen: weekday !== 0, opensAt: '08:00', closesAt: '20:00' },
    ]),
  ),
  roles: {
    farmaceutico: emptyRole(true),
    balconista: emptyRole(false),
    caixa: emptyRole(false),
    estoquista: emptyRole(false),
  },
});

export const storeToForm = (store: Store): StoreFormValues => {
  const form = emptyStoreForm();
  form.name = store.name;
  form.city = store.city;
  form.profile = store.profile;

  for (const day of Object.values(form.days)) day.isOpen = false;
  for (const hour of store.openingHours) {
    form.days[hour.weekday] = { isOpen: true, opensAt: hour.opensAt, closesAt: hour.closesAt };
  }

  for (const role of ROLE_ORDER) form.roles[role] = { ...emptyRole(false), minPerShift: null };
  for (const role of store.roles) {
    form.roles[role.role] = {
      isEnabled: true,
      minPerShift: role.minPerShift,
      headcount: role.headcount,
      weeklyHours: role.weeklyHours,
      monthlySalary: role.monthlySalary,
      absenceRatePct: role.absenceRate === null ? null : Math.round(role.absenceRate * 1000) / 10,
    };
  }
  return form;
};

export const formToRequest = (values: StoreFormValues): StoreRequest => {
  const openingHours: OpeningHour[] = WEEKDAYS.filter(
    ({ weekday }) => values.days[weekday]?.isOpen,
  ).map(({ weekday }) => {
    const day = values.days[weekday] as DayValues;
    return { weekday, opensAt: day.opensAt, closesAt: day.closesAt };
  });

  const roles: StoreRole[] = ROLE_ORDER.filter((role) => values.roles[role].isEnabled).map(
    (role) => {
      const data = values.roles[role];
      return {
        role,
        minPerShift: data.minPerShift ?? 0,
        headcount: data.headcount ?? 0,
        weeklyHours: data.weeklyHours ?? 0,
        monthlySalary: data.monthlySalary ?? 0,
        absenceRate:
          data.absenceRatePct === null ? null : Math.round(data.absenceRatePct * 10) / 1000,
      };
    },
  );

  return {
    name: values.name.trim(),
    city: values.city.trim(),
    profile: values.profile,
    openingHours,
    roles,
  };
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const REQUIRED = 'Informe um valor.';

const validateDay = (day: DayValues): string | undefined => {
  if (!TIME.test(day.opensAt)) return 'Abertura inválida. Use HH:MM, por exemplo 08:00.';
  if (!TIME.test(day.closesAt) && day.closesAt !== '24:00')
    return 'Fechamento inválido. Use HH:MM (ou 24:00).';
  if (day.opensAt === day.closesAt)
    return 'Abertura e fechamento não podem ser iguais. Para 24 horas, use 00:00 até 24:00.';
  return undefined;
};

const checkInteger = (
  errors: StoreFormErrors,
  key: string,
  value: number | null,
  min: number,
  max: number,
  message?: string,
) => {
  if (value === null) errors[key] = REQUIRED;
  else if (!Number.isInteger(value)) errors[key] = 'Use um número inteiro.';
  else if (value < min || value > max)
    errors[key] = message ?? `Use um valor entre ${min} e ${max}.`;
};

export function validateStoreForm(values: StoreFormValues): StoreFormErrors {
  const errors: StoreFormErrors = {};

  if (values.name.trim().length < 2) errors.name = 'Informe o nome da loja.';
  if (values.city.trim().length < 2) errors.city = 'Informe a cidade.';

  const openDays = WEEKDAYS.filter(({ weekday }) => values.days[weekday]?.isOpen);
  if (openDays.length === 0) errors.days = 'Marque ao menos um dia de funcionamento.';
  for (const { weekday } of openDays) {
    const message = validateDay(values.days[weekday] as DayValues);
    if (message) errors[`day.${weekday}`] = message;
  }

  for (const role of ROLE_ORDER) {
    const data = values.roles[role];
    if (!data.isEnabled) continue;
    const key = (field: string) => `role.${role}.${field}`;

    checkInteger(
      errors,
      key('minPerShift'),
      data.minPerShift,
      role === 'farmaceutico' ? 1 : 0,
      50,
      role === 'farmaceutico'
        ? 'O farmacêutico é obrigatório durante a abertura: o mínimo por turno é 1.'
        : undefined,
    );
    checkInteger(errors, key('headcount'), data.headcount, 0, 500);

    if (data.weeklyHours === null) errors[key('weeklyHours')] = REQUIRED;
    else if (data.weeklyHours < 1 || data.weeklyHours > 44)
      errors[key('weeklyHours')] = 'Use uma jornada entre 1 e 44 horas por semana.';

    if (data.monthlySalary === null) errors[key('monthlySalary')] = REQUIRED;
    else if (data.monthlySalary <= 0) errors[key('monthlySalary')] = 'Use um valor maior que zero.';

    if (data.absenceRatePct !== null && (data.absenceRatePct < 0 || data.absenceRatePct > 50))
      errors[key('absenceRatePct')] = 'Use um valor entre 0 e 50.';
  }

  return errors;
}
