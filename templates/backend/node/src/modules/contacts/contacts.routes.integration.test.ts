import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { AttemptLimiter } from '../../shared/middlewares/rate-limit.js';

const valid = {
  source: 'consultor',
  name: 'Ana Souza',
  roleTitle: 'Diretora',
  company: 'Rede Saúde',
  phone: '(11) 98888-7777',
  email: 'ana@rede.com.br',
  sector: 'Farmácias',
  acceptPrivacy: true,
  mode: 'rapido',
  profile: { employees: 200, regime: 'real' },
  result: { grossMin: 442569, grossMax: 700735 },
  idempotencyKey: 'chave-de-teste-0001',
  utm: 'utm_source=google',
  website: '',
};

const ADMIN_KEY = 'chave-admin-de-teste-123';
const makeApp = (max = 5) =>
  createApp({
    adminApiKey: ADMIN_KEY,
    contactLimiter: new AttemptLimiter({ max, windowMs: 3600_000 }),
  });
const admin = (app: ReturnType<typeof makeApp>) => ({
  get: (url: string) => request(app).get(url).set('x-admin-key', ADMIN_KEY),
  post: (url: string) => request(app).post(url).set('x-admin-key', ADMIN_KEY),
});

describe('POST /api/v1/contact-requests', () => {
  beforeEach(async () => {
    await prisma.contactRequest.deleteMany();
  });
  afterAll(async () => {
    await prisma.contactRequest.deleteMany();
    await prisma.$disconnect();
  });

  it('deve registrar um pedido válido sem exigir login', async () => {
    const response = await request(makeApp()).post('/api/v1/contact-requests').send(valid);

    expect(response.status).toBe(201);
    expect(response.body.id).toEqual(expect.any(String));
    const saved = await prisma.contactRequest.findFirstOrThrow();
    expect(saved).toMatchObject({
      name: 'Ana Souza',
      email: 'ana@rede.com.br',
      source: 'consultor',
      mode: 'rapido',
      utm: 'utm_source=google',
    });
    expect(saved.privacyAcceptedAt).toBeInstanceOf(Date);
    expect(saved.profile).toEqual(valid.profile);
    expect(saved.result).toEqual(valid.result);
  });

  it('deve guardar o telefone só com dígitos formatados de forma padrão', async () => {
    await request(makeApp())
      .post('/api/v1/contact-requests')
      .send({ ...valid, phone: '11988887777' });

    expect((await prisma.contactRequest.findFirstOrThrow()).phone).toBe('(11) 98888-7777');
  });

  it('deve recusar campos obrigatórios vazios, e-mail inválido, telefone inválido e falta de aceite', async () => {
    const app = makeApp(50);
    const bad = [
      { ...valid, name: '' },
      { ...valid, company: ' ' },
      { ...valid, email: 'sem-arroba' },
      { ...valid, phone: '123' },
      { ...valid, acceptPrivacy: false },
      { ...valid, source: 'outro' },
      { ...valid, idempotencyKey: 'curta' },
    ];

    for (const body of bad) {
      const response = await request(app).post('/api/v1/contact-requests').send(body);
      expect(response.status).toBe(400);
    }
    expect(await prisma.contactRequest.count()).toBe(0);
  });

  it('deve responder 201 sem gravar quando o campo isca (website) vem preenchido', async () => {
    const response = await request(makeApp())
      .post('/api/v1/contact-requests')
      .send({ ...valid, website: 'http://spam.example' });

    expect(response.status).toBe(201);
    expect(await prisma.contactRequest.count()).toBe(0);
  });

  it('deve gravar uma vez só quando o mesmo envio chega duas vezes (duplo clique)', async () => {
    const app = makeApp();

    const first = await request(app).post('/api/v1/contact-requests').send(valid);
    const second = await request(app).post('/api/v1/contact-requests').send(valid);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    expect(await prisma.contactRequest.count()).toBe(1);
  });

  it('deve limitar envios por IP', async () => {
    const app = makeApp();
    let last = 0;
    for (let i = 0; i < 7; i++) {
      const response = await request(app)
        .post('/api/v1/contact-requests')
        .send({ ...valid, idempotencyKey: `chave-de-teste-${String(i).padStart(4, '0')}` });
      last = response.status;
    }

    expect(last).toBe(429);
  });

  it('deve bloquear envio vindo de outro site (Origin diferente)', async () => {
    const response = await request(makeApp())
      .post('/api/v1/contact-requests')
      .set('Origin', 'https://site-malicioso.example')
      .send(valid);

    expect(response.status).toBe(403);
  });
});

describe('/api/v1/admin/contact-requests', () => {
  beforeEach(async () => {
    await prisma.contactRequest.deleteMany();
  });
  afterAll(async () => {
    await prisma.contactRequest.deleteMany();
    await prisma.$disconnect();
  });

  it('deve exigir a chave da equipe', async () => {
    const app = makeApp();

    const none = await request(app).get('/api/v1/admin/contact-requests');
    const wrong = await request(app)
      .get('/api/v1/admin/contact-requests')
      .set('x-admin-key', 'errada');

    expect(none.status).toBe(401);
    expect(wrong.status).toBe(401);
  });

  it('deve ficar desligado quando não há chave configurada', async () => {
    const app = createApp({ adminApiKey: undefined });

    const response = await request(app)
      .get('/api/v1/admin/contact-requests')
      .set('x-admin-key', 'qualquer');

    expect(response.status).toBe(401);
  });

  it('deve listar os pedidos, do mais novo para o mais antigo', async () => {
    const app = makeApp();
    await request(app).post('/api/v1/contact-requests').send(valid);
    await request(app)
      .post('/api/v1/contact-requests')
      .send({ ...valid, name: 'Bia Lima', idempotencyKey: 'chave-de-teste-0002' });

    const response = await admin(app).get('/api/v1/admin/contact-requests?page=1&pageSize=10');

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ page: 1, pageSize: 10, total: 2 });
    expect(response.body.data.map((item: { name: string }) => item.name)).toEqual([
      'Bia Lima',
      'Ana Souza',
    ]);
    expect(response.body.data[0].result).toBeDefined();
  });

  it('deve exportar CSV em UTF-8 com BOM', async () => {
    const app = makeApp();
    await request(app).post('/api/v1/contact-requests').send(valid);

    const response = await admin(app).get('/api/v1/admin/contact-requests?format=csv');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.text.charCodeAt(0)).toBe(0xfeff);
    expect(response.text).toContain('Ana Souza');
    expect(response.text).toContain('Rede Saúde');
  });

  it('deve anonimizar os dados pessoais a pedido do titular', async () => {
    const app = makeApp();
    const created = await request(app).post('/api/v1/contact-requests').send(valid);

    const response = await admin(app).post(
      `/api/v1/admin/contact-requests/${created.body.id}/anonymize`,
    );

    expect(response.status).toBe(204);
    const saved = await prisma.contactRequest.findFirstOrThrow();
    expect(saved.anonymizedAt).toBeInstanceOf(Date);
    expect(saved.name).not.toContain('Ana');
    expect(saved.email).not.toContain('ana@');
    expect(saved.phone).not.toContain('98888');
    expect(saved.company).not.toContain('Rede');
    expect(saved.sector).toBeNull();
    expect(saved.utm).toBeNull();
    expect(saved.result).toEqual(valid.result);

    const missing = await admin(app).post(
      '/api/v1/admin/contact-requests/00000000-0000-4000-8000-000000000000/anonymize',
    );
    expect(missing.status).toBe(404);
  });
});
