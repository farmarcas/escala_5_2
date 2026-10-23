import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';
import { AttemptLimiter } from '../../shared/middlewares/rate-limit.js';
import { makeTestApp, resetDatabase, signUpAndLogin } from '../../test-utils/auth-helper.js';
import { makeFakeModel, type FakeTurn } from './assistant.fake-model.js';

const clean = async () => resetDatabase();

const makeApp = (script: FakeTurn[] | null, max = 20) => {
  const fake = script ? makeFakeModel(script) : null;
  const t = makeTestApp({
    assistant: {
      modelClient: fake ? fake.client : null,
      limiter: new AttemptLimiter({ max, windowMs: 600_000 }),
    },
  });
  return { ...t, fake };
};

const createStore = async (agent: ReturnType<typeof request.agent>, name = 'Loja Centro') => {
  const defaults = await agent.get('/api/v1/scales/defaults');
  const created = await agent.post('/api/v1/scales/stores').send({ ...defaults.body.store, name });
  return created.body.store.id as string;
};

const events = (text: string) =>
  text
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.slice(6)));

describe('/api/v1/assistant', () => {
  beforeEach(clean);
  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('exige login', async () => {
    const t = makeApp([]);
    expect((await request(t.app).get('/api/v1/assistant/status')).status).toBe(401);
    expect((await request(t.app).post('/api/v1/assistant/analyze').send({})).status).toBe(401);
  });

  it('status mostra se a IA está ligada', async () => {
    const off = makeApp(null);
    const a = await signUpAndLogin(off, 'a@teste.com');
    expect((await a.agent.get('/api/v1/assistant/status')).body).toEqual({ enabled: false });
    await clean();
    const on = makeApp([]);
    const b = await signUpAndLogin(on, 'b@teste.com');
    expect((await b.agent.get('/api/v1/assistant/status')).body).toEqual({ enabled: true });
  });

  it('sem chave, a análise responde 503 e o painel segue', async () => {
    const t = makeApp(null);
    const { agent } = await signUpAndLogin(t, 'a@teste.com');
    const storeId = await createStore(agent);
    const response = await agent.post('/api/v1/assistant/analyze').send({ storeId });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('ASSISTANT_DISABLED');
    expect((await agent.get(`/api/v1/scales/stores/${storeId}/diagnostic`)).status).toBe(200);
  });

  it('abrir o diagnóstico não chama o modelo; analisar chama e responde em fluxo', async () => {
    const t = makeApp([
      { tools: [{ name: 'ler_diagnostico', input: {} }] },
      { text: 'Análise pronta.' },
    ]);
    const { agent } = await signUpAndLogin(t, 'a@teste.com');
    const storeId = await createStore(agent);
    await agent.get(`/api/v1/scales/stores/${storeId}/diagnostic`);
    expect(t.fake!.requests).toHaveLength(0);

    const response = await agent
      .post('/api/v1/assistant/analyze')
      .send({ storeId })
      .buffer(true)
      .parse((res, done) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => done(null, data));
      });
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.headers['cache-control']).toContain('no-cache');
    const list = events(response.body as string);
    expect(list.map((e) => e.type)).toEqual(['tool', 'text', 'done']);
    expect(t.fake!.requests).toHaveLength(2);
  });

  it('simular um cenário não muda a loja gravada', async () => {
    const t = makeApp([
      {
        tools: [
          {
            name: 'simular_mudanca',
            input: {
              titulo: 'Fechar às 21h',
              mudancas: [{ tipo: 'horario_padrao', abre: '07:00', fecha: '21:00' }],
            },
          },
        ],
      },
      { text: 'Feito.' },
    ]);
    const { agent } = await signUpAndLogin(t, 'a@teste.com');
    const storeId = await createStore(agent);
    const before = await agent.get(`/api/v1/scales/stores/${storeId}`);
    const run = await agent
      .post('/api/v1/assistant/analyze')
      .send({ storeId })
      .buffer(true)
      .parse((res, done) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => done(null, data));
      });
    expect(events(run.body as string).map((e) => e.type)).toContain('scenario');
    const after = await agent.get(`/api/v1/scales/stores/${storeId}`);
    expect(after.body.store).toEqual(before.body.store);
  });

  it('loja de outro grupo dá 404', async () => {
    const t = makeApp([{ text: 'x' }]);
    const a = await signUpAndLogin(t, 'a@teste.com', 'Grupo A');
    const storeId = await createStore(a.agent);
    const b = await signUpAndLogin(t, 'b@teste.com', 'Grupo B');
    const response = await b.agent.post('/api/v1/assistant/analyze').send({ storeId });
    expect(response.status).toBe(404);
    expect(t.fake!.requests).toHaveLength(0);
  });

  it('valida o corpo: pedido longo, histórico grande e campos extras', async () => {
    const t = makeApp([{ text: 'x' }]);
    const { agent } = await signUpAndLogin(t, 'a@teste.com');
    const storeId = await createStore(agent);
    const post = (body: object) => agent.post('/api/v1/assistant/analyze').send(body);
    expect((await post({ storeId, prompt: 'a'.repeat(1001) })).status).toBe(400);
    const history = Array.from({ length: 9 }, () => ({ role: 'user', content: 'oi' }));
    expect((await post({ storeId, history })).status).toBe(400);
    expect((await post({ storeId, extra: 1 })).status).toBe(400);
    expect((await post({ storeId: 'nao-e-uuid' })).status).toBe(400);
  });

  it('limite por conta responde 429', async () => {
    const t = makeApp([{ text: 'ok' }], 1);
    const { agent } = await signUpAndLogin(t, 'a@teste.com');
    const storeId = await createStore(agent);
    expect((await agent.post('/api/v1/assistant/analyze').send({ storeId })).status).toBe(200);
    const second = await agent.post('/api/v1/assistant/analyze').send({ storeId });
    expect(second.status).toBe(429);
  });

  it('o texto do pedido e da resposta não vai para o log', async () => {
    const { logger } = await import('../../shared/logger.js');
    const lines: string[] = [];
    const original = logger.info.bind(logger);
    logger.info = ((...args: unknown[]) => {
      if (args.at(-1) === 'assistant analysis') lines.push(JSON.stringify(args));
      return (original as (...a: unknown[]) => void)(...args);
    }) as typeof logger.info;
    try {
      const t = makeApp([{ text: 'Resposta confidencial XYZ.' }]);
      const { agent } = await signUpAndLogin(t, 'a@teste.com');
      const storeId = await createStore(agent);
      await agent.post('/api/v1/assistant/analyze').send({ storeId, prompt: 'Pedido secreto ABC' });
      const joined = lines.join('\n');
      expect(joined).toContain('assistant analysis');
      expect(joined).not.toContain('ABC');
      expect(joined).not.toContain('XYZ');
    } finally {
      logger.info = original;
    }
  });
});
