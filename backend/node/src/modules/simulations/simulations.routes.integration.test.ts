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
  headcount: 4,
  weeklyHours: 44,
  monthlySalary: 2100,
};

const storeBody = (name: string) => ({
  name,
  city: 'São Paulo',
  profile: 'rua',
  openingHours: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '20:00',
  })),
  roles: [pharmacist, clerk],
});

type Agent = Awaited<ReturnType<typeof signUpAndLogin>>['agent'];

const createStore = async (agent: Agent, name: string) => {
  const response = await agent.post('/api/v1/stores').send(storeBody(name));
  return response.body.store.id as string;
};

describe('simulações salvas', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve exigir login', async () => {
    const t = makeTestApp();

    expect((await request(t.app).get('/api/v1/simulations')).status).toBe(401);
    expect((await request(t.app).post('/api/v1/simulations').send({ name: 'X1' })).status).toBe(
      401,
    );
  });

  it('deve salvar uma simulação com ações e devolver a foto completa', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');

    const response = await agent.post('/api/v1/simulations').send({
      name: 'Base',
      mitigations: { [storeId]: { actions: { 'banco-horas': 1 } } },
    });

    expect(response.status).toBe(201);
    const simulation = response.body.simulation;
    expect(simulation).toMatchObject({ name: 'Base', taxRegime: 'real' });
    expect(simulation.stores).toHaveLength(1);
    expect(simulation.premisesVersion).toEqual(expect.any(String));
    expect(simulation.mitigations[storeId].actions['banco-horas']).toBe(1);
    // Balconista (4 pessoas) elimina a contratação com banco de horas 100%; o farmacêutico segue em 1.
    expect(simulation.result.totals.peopleToHire).toBe(2);
    expect(simulation.result.totals.residualPeopleToHire).toBe(1);
    expect(simulation.result.totals.savings).toBeCloseTo(2100 * 13.33 * 1.55, 2);
  });

  it('deve listar, reabrir, renomear e apagar', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await createStore(agent, 'Centro');
    const saved = await agent.post('/api/v1/simulations').send({ name: 'Base' });
    const id = saved.body.simulation.id as string;

    const list = await agent.get('/api/v1/simulations');
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ name: 'Base', storeCount: 1 });
    expect(list.body.data[0].totals.peopleToHire).toBe(2);
    expect(list.body.meta.total).toBe(1);

    const read = await agent.get(`/api/v1/simulations/${id}`);
    expect(read.body.simulation.result.stores).toHaveLength(1);

    const renamed = await agent.patch(`/api/v1/simulations/${id}`).send({ name: 'Cenário base' });
    expect(renamed.body.simulation.name).toBe('Cenário base');

    expect((await agent.delete(`/api/v1/simulations/${id}`)).status).toBe(204);
    expect((await agent.get(`/api/v1/simulations/${id}`)).status).toBe(404);
    expect((await agent.get('/api/v1/simulations')).body.meta.total).toBe(0);
  });

  it('deve recusar nome repetido (sem diferenciar maiúsculas) e liberar o nome depois de apagar', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await createStore(agent, 'Centro');
    const first = await agent.post('/api/v1/simulations').send({ name: 'Base' });

    const again = await agent.post('/api/v1/simulations').send({ name: 'base' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('SIMULATION_NAME_EXISTS');

    await agent.delete(`/api/v1/simulations/${first.body.simulation.id}`);
    expect((await agent.post('/api/v1/simulations').send({ name: 'base' })).status).toBe(201);
  });

  it('deve manter a foto imutável quando a loja ou as premissas mudam depois', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');
    const saved = await agent.post('/api/v1/simulations').send({ name: 'Base' });
    const id = saved.body.simulation.id as string;
    const gross = saved.body.simulation.result.totals.grossAnnualImpact as number;

    await agent.patch(`/api/v1/stores/${storeId}`).send({
      roles: [{ ...pharmacist, headcount: 10, monthlySalary: 20000 }, clerk],
    });
    await agent.patch('/api/v1/groups/current').send({ taxRegime: 'simples' });

    const reopened = await agent.get(`/api/v1/simulations/${id}`);
    expect(reopened.body.simulation.result.totals.grossAnnualImpact).toBeCloseTo(gross, 6);
    expect(reopened.body.simulation.taxRegime).toBe('real');
    expect(
      reopened.body.simulation.stores[0].roles.find(
        (r: { role: string }) => r.role === 'farmaceutico',
      ).headcount,
    ).toBe(2);
  });

  it('deve recalcular com os dados atuais, mantendo regime, premissas e ações', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');
    const saved = await agent.post('/api/v1/simulations').send({
      name: 'Base',
      taxRegime: 'simples',
      premiseOverrides: { detailed: { absenceRate: 0.1 } },
      mitigations: { [storeId]: { actions: { 'banco-horas': 1 } } },
    });
    await agent
      .patch(`/api/v1/stores/${storeId}`)
      .send({ roles: [{ ...pharmacist, headcount: 6 }, clerk] });

    const recalculated = await agent
      .post(`/api/v1/simulations/${saved.body.simulation.id}/recalculate`)
      .send({ name: 'Base atualizada' });

    expect(recalculated.status).toBe(201);
    const next = recalculated.body.simulation;
    expect(next.taxRegime).toBe('simples');
    expect(next.premises.detailed.absenceRate).toBe(0.1);
    expect(next.mitigations[storeId].actions['banco-horas']).toBe(1);
    expect(
      next.stores[0].roles.find((r: { role: string }) => r.role === 'farmaceutico').headcount,
    ).toBe(6);
    // Com 6 farmacêuticos já não falta ninguém; a simulação antiga continua com 2 contratações.
    expect(next.result.totals.peopleToHire).toBe(1);
    const old = await agent.get(`/api/v1/simulations/${saved.body.simulation.id}`);
    expect(old.body.simulation.result.totals.peopleToHire).toBe(2);
  });

  it('não deve recalcular quando as lojas da simulação foram removidas', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');
    const saved = await agent.post('/api/v1/simulations').send({ name: 'Base' });
    await agent.delete(`/api/v1/stores/${storeId}`);

    const response = await agent
      .post(`/api/v1/simulations/${saved.body.simulation.id}/recalculate`)
      .send({ name: 'Outra' });

    expect(response.status).toBe(400);
  });

  it('deve duplicar como cópia independente', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await createStore(agent, 'Centro');
    const saved = await agent.post('/api/v1/simulations').send({ name: 'Base' });

    const copy = await agent
      .post(`/api/v1/simulations/${saved.body.simulation.id}/duplicate`)
      .send({ name: 'Cópia' });

    expect(copy.status).toBe(201);
    expect(copy.body.simulation.id).not.toBe(saved.body.simulation.id);
    expect(copy.body.simulation.result).toEqual(saved.body.simulation.result);
    expect((await agent.get('/api/v1/simulations')).body.meta.total).toBe(2);
  });

  it('deve comparar de 2 a 4 simulações na ordem pedida', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');
    const base = await agent.post('/api/v1/simulations').send({ name: 'Base' });
    const acoes = await agent.post('/api/v1/simulations').send({
      name: 'Com ações',
      mitigations: { [storeId]: { actions: { 'banco-horas': 1, 'negociacao-coletiva': 1 } } },
    });
    const ids = [acoes.body.simulation.id, base.body.simulation.id];

    const compared = await agent.get(`/api/v1/simulations/compare?ids=${ids.join(',')}`);

    expect(compared.status).toBe(200);
    expect(compared.body.items.map((item: { name: string }) => item.name)).toEqual([
      'Com ações',
      'Base',
    ]);
    expect(compared.body.items[0].totals.residualAnnualImpact).toBe(0);
    expect(compared.body.items[1].totals.savings).toBe(0);

    expect((await agent.get(`/api/v1/simulations/compare?ids=${ids[0]}`)).status).toBe(400);
  });

  it('não deve deixar um grupo ver, alterar, apagar nem comparar simulação de outro grupo', async () => {
    const t = makeTestApp();
    const a = await signUpAndLogin(t, 'ana@rede.com.br', 'Grupo A');
    const b = await signUpAndLogin(t, 'bia@outra.com.br', 'Grupo B');
    await createStore(a.agent, 'Centro');
    await createStore(b.agent, 'Filial');
    const simA = await a.agent.post('/api/v1/simulations').send({ name: 'Base' });
    const simB = await b.agent.post('/api/v1/simulations').send({ name: 'Base' });
    const idA = simA.body.simulation.id as string;

    expect((await b.agent.get(`/api/v1/simulations/${idA}`)).status).toBe(404);
    expect(
      (await b.agent.patch(`/api/v1/simulations/${idA}`).send({ name: 'Invadida' })).status,
    ).toBe(404);
    expect((await b.agent.delete(`/api/v1/simulations/${idA}`)).status).toBe(404);
    expect(
      (await b.agent.post(`/api/v1/simulations/${idA}/duplicate`).send({ name: 'Roubada' })).status,
    ).toBe(404);
    expect(
      (await b.agent.get(`/api/v1/simulations/compare?ids=${idA},${simB.body.simulation.id}`))
        .status,
    ).toBe(404);
    expect((await b.agent.get('/api/v1/simulations')).body.meta.total).toBe(1);
    expect((await a.agent.get(`/api/v1/simulations/${idA}`)).body.simulation.name).toBe('Base');
  });

  it('deve ignorar ações de lojas de outro grupo e recusar ações desconhecidas', async () => {
    const t = makeTestApp();
    const a = await signUpAndLogin(t, 'ana@rede.com.br', 'Grupo A');
    const b = await signUpAndLogin(t, 'bia@outra.com.br', 'Grupo B');
    await createStore(a.agent, 'Centro');
    const foreignStore = await createStore(b.agent, 'Filial');

    const foreign = await a.agent.post('/api/v1/simulations').send({
      name: 'Base',
      mitigations: { [foreignStore]: { actions: { 'banco-horas': 1 } } },
    });
    const unknown = await a.agent.post('/api/v1/simulations/preview').send({
      mitigations: { [foreignStore]: { actions: { 'acao-inventada': 0.5 } } },
    });

    expect(foreign.status).toBe(201);
    expect(foreign.body.simulation.mitigations).toEqual({});
    expect(unknown.status).toBe(400);
  });

  it('deve avisar quando a redução combinada passa de 50% no preview', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');

    const response = await agent.post('/api/v1/simulations/preview').send({
      mitigations: {
        [storeId]: { actions: { 'banco-horas': 0.4, 'escalas-demanda': 0.4, automacao: 0.2 } },
      },
    });

    expect(response.body.result.warnings).toEqual(['MITIGATION_ABOVE_USUAL']);
  });

  it('deve recusar ajuste de horário negativo ou acima de 168 h', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const storeId = await createStore(agent, 'Centro');

    for (const hours of [-1, 169]) {
      const response = await agent
        .post('/api/v1/simulations/preview')
        .send({ mitigations: { [storeId]: { hoursReductionPerWeek: hours } } });
      expect(response.status).toBe(400);
    }
  });
});
