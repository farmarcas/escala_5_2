import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { CreateStoreInput } from './stores.schemas.js';
import { makeStoresService, type StoreRecord, type StoresRepository } from './stores.service.js';

const input: CreateStoreInput = {
  name: 'Centro',
  city: 'São Paulo',
  profile: 'rua',
  openingHours: [{ weekday: 1, opensAt: '08:00', closesAt: '20:00' }],
  roles: [
    { role: 'farmaceutico', minPerShift: 1, headcount: 2, weeklyHours: 44, monthlySalary: 8500 },
  ],
};

const makeFakeRepo = () => {
  const rows: (StoreRecord & { groupId: string; deleted: boolean })[] = [];
  const live = (groupId: string) => rows.filter((row) => row.groupId === groupId && !row.deleted);
  const repo: StoresRepository = {
    list: async (groupId, page, pageSize) => {
      const all = live(groupId);
      return { data: all.slice((page - 1) * pageSize, page * pageSize), total: all.length };
    },
    listAll: async (groupId, ids) => live(groupId).filter((row) => !ids || ids.includes(row.id)),
    findById: async (groupId, id) => live(groupId).find((row) => row.id === id) ?? null,
    findByName: async (groupId, name) =>
      live(groupId).find((row) => row.name.toLowerCase() === name.toLowerCase()) ?? null,
    create: async (groupId, data) => {
      const row = {
        id: randomUUID(),
        groupId,
        deleted: false,
        name: data.name,
        city: data.city,
        profile: data.profile,
        openingHours: data.openingHours,
        roles: data.roles.map((role) => ({ ...role, absenceRate: role.absenceRate ?? null })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      rows.push(row);
      return row;
    },
    update: async (groupId, id, data) => {
      const row = live(groupId).find((item) => item.id === id);
      if (!row) throw new Error('não deveria chegar aqui');
      Object.assign(row, data);
      return row;
    },
    softDelete: async (groupId, id) => {
      const row = live(groupId).find((item) => item.id === id);
      if (row) row.deleted = true;
    },
  };
  return { repo, rows };
};

describe('stores.service', () => {
  it('deve criar loja no grupo da pessoa', async () => {
    const { repo, rows } = makeFakeRepo();
    const service = makeStoresService(repo);

    const store = await service.create('grupo-a', input);

    expect(store.name).toBe('Centro');
    expect(rows[0]?.groupId).toBe('grupo-a');
  });

  it('deve recusar nome repetido no mesmo grupo, sem diferenciar maiúsculas', async () => {
    const service = makeStoresService(makeFakeRepo().repo);
    await service.create('grupo-a', input);

    await expect(service.create('grupo-a', { ...input, name: 'CENTRO' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'STORE_NAME_EXISTS',
    });
  });

  it('deve aceitar o mesmo nome em outro grupo', async () => {
    const service = makeStoresService(makeFakeRepo().repo);
    await service.create('grupo-a', input);

    await expect(service.create('grupo-b', input)).resolves.toBeDefined();
  });

  it('deve permitir salvar a própria loja sem trocar o nome', async () => {
    const service = makeStoresService(makeFakeRepo().repo);
    const store = await service.create('grupo-a', input);

    await expect(
      service.update('grupo-a', store.id, { name: 'Centro', city: 'Santos' }),
    ).resolves.toMatchObject({
      city: 'Santos',
    });
  });

  it('deve tratar loja de outro grupo como inexistente', async () => {
    const service = makeStoresService(makeFakeRepo().repo);
    const store = await service.create('grupo-a', input);

    await expect(service.getById('grupo-b', store.id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.update('grupo-b', store.id, { city: 'X1' })).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(service.remove('grupo-b', store.id)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deve liberar o nome depois que a loja é removida', async () => {
    const service = makeStoresService(makeFakeRepo().repo);
    const store = await service.create('grupo-a', input);
    await service.remove('grupo-a', store.id);

    await expect(service.create('grupo-a', input)).resolves.toBeDefined();
  });
});
