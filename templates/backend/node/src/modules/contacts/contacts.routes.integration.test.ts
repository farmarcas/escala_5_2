import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';
import { AttemptLimiter } from '../../shared/middlewares/rate-limit.js';
import { makeTestApp, resetDatabase, signUpAndLogin } from '../../test-utils/auth-helper.js';

const ADMIN_KEY = 'chave-admin-de-teste-123';

const valid = {
  source: 'consultor',
  roleTitle: 'Diretora',
  phone: '(11) 98888-7777',
  sector: 'Farmácias',
  acceptPrivacy: true,
  mode: 'detalhado',
  profile: { storeCount: 3, taxRegime: 'real' },
  result: { grossAnnualImpact: 175623, peopleToHire: 1 },
  idempotencyKey: 'chave-de-teste-0001',
  utm: 'utm_source=google',
};

const makeApp = (max = 5) =>
  makeTestApp({
    adminApiKey: ADMIN_KEY,
    contactLimiter: new AttemptLimiter({ max, windowMs: 3600_000 }),
  });

type TestApp = ReturnType<typeof makeApp>;
const admin = (t: TestApp) => ({
  get: (url: string) => request(t.app).get(url).set('x-admin-key', ADMIN_KEY),
  post: (url: string) => request(t.app).post(url).set('x-admin-key', ADMIN_KEY),
});

const clean = async () => {
  await resetDatabase();
  await prisma.contactRequest.deleteMany();
};

describe('POST /api/v1/contact-requests', () => {
  beforeEach(clean);
  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('deve exigir login', async () => {
    const t = makeApp();

    const response = await request(t.app).post('/api/v1/contact-requests').send(valid);

    expect(response.status).toBe(401);
    expect(await prisma.contactRequest.count()).toBe(0);
  });

  it('deve registrar o pedido com nome, e-mail e empresa da conta', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br', 'Rede Saúde');

    const response = await agent.post('/api/v1/contact-requests').send(valid);

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(String));
    const saved = await prisma.contactRequest.findFirstOrThrow();
    expect(saved).toMatchObject({
      name: 'Pessoa Teste',
      email: 'ana@rede.com.br',
      company: 'Rede Saúde',
      roleTitle: 'Diretora',
      source: 'consultor',
      mode: 'detalhado',
      utm: 'utm_source=google',
    });
    expect(saved.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(saved.profile).toEqual(valid.profile);
    expect(saved.result).toEqual(valid.result);
  });

  it('deve guardar o telefone no formato padrão', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    await agent.post('/api/v1/contact-requests').send({ ...valid, phone: '11988887777' });

    expect((await prisma.contactRequest.findFirstOrThrow()).phone).toBe('(11) 98888-7777');
  });

  it('deve recusar dados inválidos e campos que não existem mais', async () => {
    const t = makeApp(50);
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const bad = [
      { ...valid, roleTitle: '' },
      { ...valid, phone: '123' },
      { ...valid, acceptPrivacy: false },
      { ...valid, source: 'pdf' },
      { ...valid, mode: 'rapido' },
      { ...valid, idempotencyKey: 'curta' },
      { ...valid, name: 'Outra Pessoa' },
      { ...valid, email: 'outra@x.com' },
      { ...valid, company: 'Outra' },
      { ...valid, website: '' },
    ];

    for (const body of bad) {
      const response = await agent.post('/api/v1/contact-requests').send(body);
      expect(response.status).toBe(400);
    }
    expect(await prisma.contactRequest.count()).toBe(0);
  });

  it('deve gravar uma vez só quando o mesmo envio chega duas vezes (duplo clique)', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const first = await agent.post('/api/v1/contact-requests').send(valid);
    const second = await agent.post('/api/v1/contact-requests').send(valid);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    expect(await prisma.contactRequest.count()).toBe(1);
  });

  it('deve limitar envios por IP', async () => {
    const t = makeApp(3);
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    let last = 0;
    for (let i = 0; i < 5; i++) {
      const response = await agent
        .post('/api/v1/contact-requests')
        .send({ ...valid, idempotencyKey: `chave-de-teste-${String(i).padStart(4, '0')}` });
      last = response.status;
    }

    expect(last).toBe(429);
  });

  it('deve bloquear envio vindo de outro site (Origin diferente)', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const response = await agent
      .post('/api/v1/contact-requests')
      .set('Origin', 'https://site-malicioso.example')
      .send(valid);

    expect(response.status).toBe(403);
  });
});

describe('/api/v1/admin/contact-requests', () => {
  beforeEach(clean);
  afterAll(async () => {
    await clean();
    await prisma.$disconnect();
  });

  it('deve exigir a chave da equipe (e não aceitar a sessão de quem usa o Radar Escala)', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const none = await request(t.app).get('/api/v1/admin/contact-requests');
    const wrong = await request(t.app)
      .get('/api/v1/admin/contact-requests')
      .set('x-admin-key', 'errada');
    const withSession = await agent.get('/api/v1/admin/contact-requests');

    expect(none.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(withSession.status).toBe(401);
  });

  it('deve ficar desligado quando não há chave configurada', async () => {
    const t = makeTestApp({ adminApiKey: undefined });

    const response = await request(t.app)
      .get('/api/v1/admin/contact-requests')
      .set('x-admin-key', 'qualquer');

    expect(response.status).toBe(401);
  });

  it('deve listar os pedidos, do mais novo para o mais antigo', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await agent.post('/api/v1/contact-requests').send(valid);
    await agent
      .post('/api/v1/contact-requests')
      .send({ ...valid, roleTitle: 'Gerente', idempotencyKey: 'chave-de-teste-0002' });

    const response = await admin(t).get('/api/v1/admin/contact-requests?page=1&pageSize=10');

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ page: 1, pageSize: 10, total: 2 });
    expect(response.body.data.map((item: { roleTitle: string }) => item.roleTitle)).toEqual([
      'Gerente',
      'Diretora',
    ]);
    expect(response.body.data[0].result).toBeDefined();
  });

  it('deve exportar CSV em UTF-8 com BOM', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br', 'Rede Saúde');
    await agent.post('/api/v1/contact-requests').send(valid);

    const response = await admin(t).get('/api/v1/admin/contact-requests?format=csv');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.text.charCodeAt(0)).toBe(0xfeff);
    expect(response.text).toContain('Pessoa Teste');
    expect(response.text).toContain('Rede Saúde');
  });

  it('deve anonimizar os dados pessoais a pedido do titular', async () => {
    const t = makeApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br', 'Rede Saúde');
    const created = await agent.post('/api/v1/contact-requests').send(valid);

    const response = await admin(t).post(
      `/api/v1/admin/contact-requests/${created.body.id}/anonymize`,
    );

    expect(response.status).toBe(204);
    const saved = await prisma.contactRequest.findFirstOrThrow();
    expect(saved.anonymizedAt).toBeInstanceOf(Date);
    expect(saved.name).not.toContain('Pessoa');
    expect(saved.email).not.toContain('ana@');
    expect(saved.phone).not.toContain('98888');
    expect(saved.company).not.toContain('Rede');
    expect(saved.sector).toBeNull();
    expect(saved.utm).toBeNull();
    expect(saved.result).toEqual(valid.result);

    const missing = await admin(t).post(
      '/api/v1/admin/contact-requests/00000000-0000-4000-8000-000000000000/anonymize',
    );
    expect(missing.status).toBe(404);
  });
});
