import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';
import { makeTestApp, resetDatabase, signUpAndLogin } from '../../test-utils/auth-helper.js';

const pharmacist = {
  role: 'farmaceutico',
  minPerShift: 1,
  headcount: 2,
  weeklyHours: 44,
  monthlySalary: 8500,
};
const clerk = {
  role: 'balconista',
  minPerShift: 2,
  headcount: 5,
  weeklyHours: 44,
  monthlySalary: 2100,
  absenceRate: 0.1,
};

const centro = {
  name: 'Centro',
  city: 'São Paulo',
  profile: '24h',
  openingHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opensAt: '00:00',
    closesAt: '24:00',
  })),
  roles: [pharmacist, clerk],
};

describe('stores routes', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve exigir login', async () => {
    const t = makeTestApp();

    const response = await request(t.app).get('/api/v1/stores');

    expect(response.status).toBe(401);
  });

  it('deve criar, ler, listar, editar e remover loja', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const created = await agent.post('/api/v1/stores').send(centro);
    expect(created.status).toBe(201);
    expect(created.body.store).toMatchObject({ name: 'Centro', profile: '24h' });
    expect(created.body.store.roles).toHaveLength(2);
    const clerkRole = (created.body.store.roles as { role: string }[]).find(
      (role) => role.role === 'balconista',
    );
    expect(clerkRole).toMatchObject({ weeklyHours: 44, absenceRate: 0.1, monthlySalary: 2100 });
    const id = created.body.store.id as string;

    const read = await agent.get(`/api/v1/stores/${id}`);
    expect(read.body.store.openingHours).toHaveLength(7);

    const list = await agent.get('/api/v1/stores?page=1&pageSize=20');
    expect(list.body.data).toHaveLength(1);
    expect(list.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });

    const updated = await agent
      .patch(`/api/v1/stores/${id}`)
      .send({ city: 'Santos', roles: [pharmacist] });
    expect(updated.status).toBe(200);
    expect(updated.body.store.city).toBe('Santos');
    expect(updated.body.store.roles).toHaveLength(1);

    const removed = await agent.delete(`/api/v1/stores/${id}`);
    expect(removed.status).toBe(204);
    expect((await agent.get(`/api/v1/stores/${id}`)).status).toBe(404);
    expect((await agent.get('/api/v1/stores')).body.meta.total).toBe(0);
  });

  it('deve recusar farmacêutico com mínimo zero e loja sem farmacêutico', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const zero = await agent
      .post('/api/v1/stores')
      .send({ ...centro, roles: [{ ...pharmacist, minPerShift: 0 }] });
    const none = await agent.post('/api/v1/stores').send({ ...centro, roles: [clerk] });

    expect(zero.status).toBe(400);
    expect(zero.body.error.code).toBe('VALIDATION_ERROR');
    expect(none.status).toBe(400);
  });

  it('deve recusar nome repetido no mesmo grupo (409)', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await agent.post('/api/v1/stores').send(centro);

    const again = await agent.post('/api/v1/stores').send({ ...centro, name: 'centro' });

    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('STORE_NAME_EXISTS');
  });

  it('não deve deixar um grupo ver, editar nem apagar loja de outro grupo', async () => {
    const t = makeTestApp();
    const a = await signUpAndLogin(t, 'ana@rede.com.br', 'Grupo A');
    const b = await signUpAndLogin(t, 'bia@outra.com.br', 'Grupo B');
    const created = await a.agent.post('/api/v1/stores').send(centro);
    const id = created.body.store.id as string;

    const read = await b.agent.get(`/api/v1/stores/${id}`);
    const update = await b.agent.patch(`/api/v1/stores/${id}`).send({ city: 'Invadida' });
    const remove = await b.agent.delete(`/api/v1/stores/${id}`);
    const list = await b.agent.get('/api/v1/stores');

    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
    expect(list.body.data).toEqual([]);
    expect((await a.agent.get(`/api/v1/stores/${id}`)).body.store.city).toBe('São Paulo');

    // O mesmo nome pode existir em outro grupo.
    const sameName = await b.agent.post('/api/v1/stores').send(centro);
    expect(sameName.status).toBe(201);
  });

  it('não deve aceitar groupId vindo do cliente', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const response = await agent.post('/api/v1/stores').send({ ...centro, groupId: 'outro' });

    expect(response.status).toBe(400);
  });
});
