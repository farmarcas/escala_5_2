import { describe, expect, it } from 'vitest';
import { createStoreSchema, openingHoursSchema } from './stores.schemas.js';

const pharmacist = {
  role: 'farmaceutico' as const,
  minPerShift: 1,
  headcount: 2,
  weeklyHours: 44,
  monthlySalary: 8500,
};

const validStore = {
  name: 'Centro',
  city: 'São Paulo',
  profile: 'rua' as const,
  size: 'media' as const,
  openingHours: [{ weekday: 1, opensAt: '08:00', closesAt: '20:00' }],
  roles: [pharmacist],
};

describe('openingHoursSchema', () => {
  it('deve aceitar loja 24 horas (00:00 até 24:00)', () => {
    const result = openingHoursSchema.safeParse(
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opensAt: '00:00', closesAt: '24:00' })),
    );

    expect(result.success).toBe(true);
  });

  it('deve aceitar fechamento depois da meia-noite (vira o dia)', () => {
    const result = openingHoursSchema.safeParse([
      { weekday: 5, opensAt: '18:00', closesAt: '02:00' },
    ]);

    expect(result.success).toBe(true);
  });

  it('deve recusar abertura igual ao fechamento', () => {
    const result = openingHoursSchema.safeParse([
      { weekday: 1, opensAt: '08:00', closesAt: '08:00' },
    ]);

    expect(result.success).toBe(false);
  });

  it('deve recusar dia repetido, horário inválido e lista vazia', () => {
    const day = { weekday: 1, opensAt: '08:00', closesAt: '20:00' };

    expect(openingHoursSchema.safeParse([day, day]).success).toBe(false);
    expect(openingHoursSchema.safeParse([{ ...day, opensAt: '25:00' }]).success).toBe(false);
    expect(openingHoursSchema.safeParse([{ ...day, opensAt: '24:00' }]).success).toBe(false);
    expect(openingHoursSchema.safeParse([]).success).toBe(false);
  });
});

describe('createStoreSchema', () => {
  it('deve aceitar uma loja válida', () => {
    expect(createStoreSchema.safeParse(validStore).success).toBe(true);
  });

  it('deve exigir farmacêutico com mínimo de 1 por turno', () => {
    const noPharmacist = createStoreSchema.safeParse({
      ...validStore,
      roles: [{ ...pharmacist, role: 'balconista' }],
    });
    const zeroMinimum = createStoreSchema.safeParse({
      ...validStore,
      roles: [{ ...pharmacist, minPerShift: 0 }],
    });

    expect(noPharmacist.success).toBe(false);
    expect(zeroMinimum.success).toBe(false);
  });

  it('deve recusar função repetida, jornada acima de 44h, salário zero e ausência acima de 50%', () => {
    const invalid = (role: object) =>
      createStoreSchema.safeParse({ ...validStore, roles: [pharmacist, role] }).success;
    const clerk = { ...pharmacist, role: 'balconista' as const };

    expect(
      createStoreSchema.safeParse({ ...validStore, roles: [pharmacist, pharmacist] }).success,
    ).toBe(false);
    expect(invalid({ ...clerk, weeklyHours: 45 })).toBe(false);
    expect(invalid({ ...clerk, monthlySalary: 0 })).toBe(false);
    expect(invalid({ ...clerk, absenceRate: 0.6 })).toBe(false);
    expect(invalid({ ...clerk, absenceRate: 0.13 })).toBe(true);
  });

  it('deve recusar campos desconhecidos', () => {
    expect(createStoreSchema.safeParse({ ...validStore, groupId: 'x' }).success).toBe(false);
  });

  it('deve exigir o tamanho da loja na criação', () => {
    const { size: _size, ...withoutSize } = validStore;

    expect(createStoreSchema.safeParse(withoutSize).success).toBe(false);
    expect(createStoreSchema.safeParse({ ...validStore, size: 'enorme' }).success).toBe(false);
    for (const size of ['pequena', 'media', 'grande']) {
      expect(createStoreSchema.safeParse({ ...validStore, size }).success).toBe(true);
    }
  });

  it('deve aceitar função sem mínimo por turno (ausente ou nulo)', () => {
    const { minPerShift: _min, ...pharmacistWithoutMin } = pharmacist;
    const clerk = { ...pharmacistWithoutMin, role: 'balconista' as const };

    expect(
      createStoreSchema.safeParse({ ...validStore, roles: [pharmacistWithoutMin, clerk] }).success,
    ).toBe(true);
    expect(
      createStoreSchema.safeParse({
        ...validStore,
        roles: [
          { ...pharmacist, minPerShift: null },
          { ...clerk, minPerShift: null },
        ],
      }).success,
    ).toBe(true);
  });

  it('deve exigir ao menos 1 farmacêutico no quadro, com ou sem mínimo por turno', () => {
    const { minPerShift: _min, ...pharmacistWithoutMin } = pharmacist;

    expect(
      createStoreSchema.safeParse({
        ...validStore,
        roles: [{ ...pharmacistWithoutMin, headcount: 0 }],
      }).success,
    ).toBe(false);
    expect(
      createStoreSchema.safeParse({
        ...validStore,
        roles: [{ ...pharmacist, headcount: 0, minPerShift: null }],
      }).success,
    ).toBe(false);
    expect(
      createStoreSchema.safeParse({ ...validStore, roles: [pharmacistWithoutMin] }).success,
    ).toBe(true);
  });
});
