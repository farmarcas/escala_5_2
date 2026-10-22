import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
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
};

const storeBody = (name: string, roles: object[] = [pharmacist, clerk]) => ({
  name,
  city: 'São Paulo',
  profile: 'rua',
  openingHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '20:00',
  })),
  roles,
});

describe('POST /api/v1/simulations/preview', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve exigir login', async () => {
    const t = makeTestApp();

    const response = await request(t.app).post('/api/v1/simulations/preview').send({});

    expect(response.status).toBe(401);
  });

  it('deve calcular o impacto das lojas do grupo (caso conferido à mão)', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await agent.post('/api/v1/stores').send(storeBody('Centro'));

    const response = await agent.post('/api/v1/simulations/preview').send({});

    expect(response.status).toBe(200);
    expect(response.body.taxRegime).toBe('real');
    const store = response.body.result.stores[0];
    expect(store.name).toBe('Centro');
    expect(store.weeklyOpenHours).toBeCloseTo(84, 6);
    expect(store.peopleToHire).toBe(1);
    const gross = 8500 * 13.33 * 1.55;
    expect(response.body.result.totals.grossAnnualImpact).toBeCloseTo(gross, 2);
    expect(response.body.result.totals.netAnnualImpact).toBeCloseTo(gross * 0.66, 2);
    expect(response.body.result.ranking[0].name).toBe('Centro');
  });

  it('deve devolver totais zerados para um grupo sem lojas', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const response = await agent.post('/api/v1/simulations/preview').send({});

    expect(response.status).toBe(200);
    expect(response.body.result.stores).toEqual([]);
    expect(response.body.result.totals.peopleToHire).toBe(0);
  });

  it('deve usar o regime do grupo e permitir trocar na hora', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await agent.post('/api/v1/stores').send(storeBody('Centro'));
    await agent.patch('/api/v1/groups/current').send({ taxRegime: 'simples' });

    const fromGroup = await agent.post('/api/v1/simulations/preview').send({});
    const override = await agent.post('/api/v1/simulations/preview').send({ taxRegime: 'real' });

    expect(fromGroup.body.taxRegime).toBe('simples');
    expect(fromGroup.body.result.totals.grossAnnualImpact).toBeCloseTo(8500 * 13.33 * 1.25, 2);
    expect(override.body.taxRegime).toBe('real');
  });

  it('deve aplicar ajustes de premissas só nesta simulação', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await agent.post('/api/v1/stores').send(storeBody('Centro'));

    const response = await agent.post('/api/v1/simulations/preview').send({
      premiseOverrides: { taxation: { chargesRealPresumido: 2 }, detailed: { absenceRate: 0 } },
    });
    const again = await agent.post('/api/v1/simulations/preview').send({});

    expect(response.body.premises.taxation.chargesRealPresumido).toBe(2);
    expect(again.body.premises.taxation.chargesRealPresumido).toBe(1.55);
  });

  it('deve recusar premissas absurdas e campos desconhecidos', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const absurd = await agent
      .post('/api/v1/simulations/preview')
      .send({ premiseOverrides: { detailed: { absenceRate: 0.9 } } });
    const unknown = await agent.post('/api/v1/simulations/preview').send({ groupId: 'x' });

    expect(absurd.status).toBe(400);
    expect(unknown.status).toBe(400);
  });

  it('deve calcular só as lojas escolhidas e ignorar lojas de outro grupo', async () => {
    const t = makeTestApp();
    const a = await signUpAndLogin(t, 'ana@rede.com.br', 'Grupo A');
    const b = await signUpAndLogin(t, 'bia@outra.com.br', 'Grupo B');
    const storeA1 = await a.agent.post('/api/v1/stores').send(storeBody('A1'));
    await a.agent.post('/api/v1/stores').send(storeBody('A2'));
    const storeB = await b.agent.post('/api/v1/stores').send(storeBody('B1'));

    const onlyA1 = await a.agent
      .post('/api/v1/simulations/preview')
      .send({ storeIds: [storeA1.body.store.id] });
    const withForeign = await a.agent
      .post('/api/v1/simulations/preview')
      .send({ storeIds: [storeB.body.store.id] });
    const all = await a.agent.post('/api/v1/simulations/preview').send({});

    expect(onlyA1.body.result.stores.map((s: { name: string }) => s.name)).toEqual(['A1']);
    expect(withForeign.body.result.stores).toEqual([]);
    expect(all.body.result.stores.map((s: { name: string }) => s.name).sort()).toEqual([
      'A1',
      'A2',
    ]);
  });

  it('deve calcular 200 lojas em menos de 1 segundo', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const group = await prisma.group.findFirstOrThrow();
    await prisma.store.createMany({
      data: Array.from({ length: 200 }, (_, index) => ({
        groupId: group.id,
        name: `Loja ${index}`,
        city: 'Campinas',
        profile: 'rua' as const,
        openingHours: [{ weekday: 1, opensAt: '08:00', closesAt: '20:00' }],
      })),
    });
    const stores = await prisma.store.findMany({ select: { id: true } });
    await prisma.storeRole.createMany({
      data: stores.flatMap(({ id }) => [
        {
          storeId: id,
          role: 'farmaceutico' as const,
          minPerShift: 1,
          headcount: 2,
          weeklyHours: 44,
          monthlySalary: 8500,
        },
        {
          storeId: id,
          role: 'balconista' as const,
          minPerShift: 2,
          headcount: 5,
          weeklyHours: 44,
          monthlySalary: 2100,
        },
        {
          storeId: id,
          role: 'caixa' as const,
          minPerShift: 1,
          headcount: 3,
          weeklyHours: 44,
          monthlySalary: 2000,
        },
      ]),
    });

    const started = performance.now();
    const response = await agent.post('/api/v1/simulations/preview').send({});
    const elapsed = performance.now() - started;

    expect(response.status).toBe(200);
    expect(response.body.result.stores).toHaveLength(200);
    expect(elapsed).toBeLessThan(1000);
  });
});
