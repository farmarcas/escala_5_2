import { describe, expect, it } from 'vitest';
import {
  emptyStoreForm,
  formToRequest,
  storeToForm,
  validateStoreForm,
  type StoreFormValues,
} from './storeForm';
import type { Store } from './types';

const filled = (): StoreFormValues => {
  const form = emptyStoreForm();
  form.name = 'Centro';
  form.city = 'São Paulo';
  form.roles.farmaceutico = {
    ...form.roles.farmaceutico,
    minPerShift: 1,
    headcount: 2,
    monthlySalary: 8500,
  };
  return form;
};

describe('emptyStoreForm', () => {
  it('deve começar com segunda a sábado abertos e o farmacêutico ativo', () => {
    const form = emptyStoreForm();

    expect(form.days[1]?.isOpen).toBe(true);
    expect(form.days[6]?.isOpen).toBe(true);
    expect(form.days[0]?.isOpen).toBe(false);
    expect(form.roles.farmaceutico.isEnabled).toBe(true);
    expect(form.roles.balconista.isEnabled).toBe(false);
  });
});

describe('validateStoreForm', () => {
  it('deve aceitar um formulário completo', () => {
    expect(validateStoreForm(filled())).toEqual({});
  });

  it('deve exigir nome e cidade', () => {
    const errors = validateStoreForm({ ...filled(), name: ' ', city: '' });

    expect(errors.name).toBeDefined();
    expect(errors.city).toBeDefined();
  });

  it('deve exigir ao menos um dia aberto', () => {
    const form = filled();
    for (const day of Object.values(form.days)) day.isOpen = false;

    expect(validateStoreForm(form).days).toBeDefined();
  });

  it('deve validar horários e recusar abertura igual ao fechamento', () => {
    const form = filled();
    form.days[1] = { isOpen: true, opensAt: '8h', closesAt: '20:00' };
    form.days[2] = { isOpen: true, opensAt: '08:00', closesAt: '08:00' };
    form.days[3] = { isOpen: true, opensAt: '24:00', closesAt: '24:00' };

    const errors = validateStoreForm(form);

    expect(errors['day.1']).toBeDefined();
    expect(errors['day.2']).toBeDefined();
    expect(errors['day.3']).toBeDefined();
  });

  it('deve aceitar 24 horas e fechamento depois da meia-noite', () => {
    const form = filled();
    form.days[1] = { isOpen: true, opensAt: '00:00', closesAt: '24:00' };
    form.days[2] = { isOpen: true, opensAt: '18:00', closesAt: '02:00' };

    expect(validateStoreForm(form)).toEqual({});
  });

  it('deve exigir mínimo de 1 farmacêutico por turno', () => {
    const form = filled();
    form.roles.farmaceutico.minPerShift = 0;

    expect(validateStoreForm(form)['role.farmaceutico.minPerShift']).toContain('obrigatório');
  });

  it('deve validar números das funções ativas e ignorar as desativadas', () => {
    const form = filled();
    form.roles.balconista = {
      isEnabled: true,
      minPerShift: 2.5,
      headcount: -1,
      weeklyHours: 45,
      monthlySalary: 0,
      absenceRatePct: 60,
    };
    form.roles.caixa = { ...form.roles.caixa, isEnabled: false, monthlySalary: null };

    const errors = validateStoreForm(form);

    expect(errors['role.balconista.minPerShift']).toBeDefined();
    expect(errors['role.balconista.headcount']).toBeDefined();
    expect(errors['role.balconista.weeklyHours']).toBeDefined();
    expect(errors['role.balconista.monthlySalary']).toBeDefined();
    expect(errors['role.balconista.absenceRatePct']).toBeDefined();
    expect(Object.keys(errors).some((key) => key.startsWith('role.caixa'))).toBe(false);
  });

  it('deve aceitar ausência em branco (usa o padrão)', () => {
    const form = filled();
    form.roles.farmaceutico.absenceRatePct = null;

    expect(validateStoreForm(form)).toEqual({});
  });
});

describe('formToRequest', () => {
  it('deve montar o pedido só com dias abertos e funções ativas', () => {
    const form = filled();
    form.roles.balconista = {
      isEnabled: true,
      minPerShift: 2,
      headcount: 5,
      weeklyHours: 44,
      monthlySalary: 2100,
      absenceRatePct: 10,
    };

    const request = formToRequest(form);

    expect(request.openingHours).toHaveLength(6);
    expect(request.openingHours.every((day) => day.weekday !== 0)).toBe(true);
    expect(request.roles.map((role) => role.role)).toEqual(['farmaceutico', 'balconista']);
    expect(request.roles[1]).toMatchObject({ absenceRate: 0.1, monthlySalary: 2100 });
    expect(request.roles[0]?.absenceRate).toBeNull();
  });
});

describe('storeToForm', () => {
  it('deve levar uma loja existente de volta para o formulário', () => {
    const store: Store = {
      id: '1',
      name: 'Centro',
      city: 'Santos',
      profile: '24h',
      openingHours: [{ weekday: 0, opensAt: '00:00', closesAt: '24:00' }],
      roles: [
        {
          role: 'farmaceutico',
          minPerShift: 1,
          headcount: 3,
          weeklyHours: 44,
          monthlySalary: 9000,
          absenceRate: 0.12,
        },
      ],
      createdAt: '',
      updatedAt: '',
    };

    const form = storeToForm(store);

    expect(form.name).toBe('Centro');
    expect(form.profile).toBe('24h');
    expect(form.days[0]).toEqual({ isOpen: true, opensAt: '00:00', closesAt: '24:00' });
    expect(form.days[1]?.isOpen).toBe(false);
    expect(form.roles.farmaceutico).toMatchObject({
      isEnabled: true,
      headcount: 3,
      absenceRatePct: 12,
    });
    expect(form.roles.balconista.isEnabled).toBe(false);
    expect(formToRequest(form).roles[0]).toMatchObject({ absenceRate: 0.12 });
  });
});
