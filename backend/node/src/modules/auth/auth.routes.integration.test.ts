import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';
import {
  makeTestApp,
  PASSWORD,
  resetDatabase,
  signUpAndLogin,
} from '../../test-utils/auth-helper.js';

const registration = {
  name: 'Ana Souza',
  email: 'ana@rede.com.br',
  password: PASSWORD,
  groupName: 'Rede Saúde',
  acceptPrivacy: true,
};

describe('auth routes', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve cadastrar, confirmar o e-mail e entrar com cookie seguro', async () => {
    const t = makeTestApp();

    const register = await request(t.app).post('/api/v1/auth/register').send(registration);
    expect(register.status).toBe(202);
    expect(t.sent).toHaveLength(1);

    const verify = await request(t.app)
      .post('/api/v1/auth/verify-email')
      .send({ token: t.lastToken() });
    expect(verify.status).toBe(204);

    const login = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ name: 'Ana Souza', email: 'ana@rede.com.br' });
    expect(login.body.user.passwordHash).toBeUndefined();
    expect(login.body.group).toMatchObject({ name: 'Rede Saúde', taxRegime: 'real' });

    const cookie = String(login.headers['set-cookie']);
    expect(cookie).toContain('fm_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('deve recusar cadastro sem aceite da política ou com senha curta', async () => {
    const t = makeTestApp();

    const noConsent = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ ...registration, acceptPrivacy: false });
    const shortPassword = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ ...registration, password: 'curta' });

    expect(noConsent.status).toBe(400);
    expect(shortPassword.status).toBe(400);
    expect(t.sent).toHaveLength(0);
  });

  it('deve responder igual quando o e-mail já está cadastrado', async () => {
    const t = makeTestApp();
    await request(t.app).post('/api/v1/auth/register').send(registration);

    const again = await request(t.app).post('/api/v1/auth/register').send(registration);

    expect(again.status).toBe(202);
    expect(await prisma.user.count()).toBe(1);
    expect(t.sent).toHaveLength(1);
  });

  it('não deve deixar entrar sem confirmar o e-mail', async () => {
    const t = makeTestApp();
    await request(t.app).post('/api/v1/auth/register').send(registration);

    const login = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: PASSWORD });

    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('deve exigir sessão em /auth/me e funcionar depois do login', async () => {
    const t = makeTestApp();
    const anonymous = await request(t.app).get('/api/v1/auth/me');
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const me = await agent.get('/api/v1/auth/me');

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('ana@rede.com.br');
  });

  it('deve encerrar a sessão no logout', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const logout = await agent.post('/api/v1/auth/logout');
    const me = await agent.get('/api/v1/auth/me');

    expect(logout.status).toBe(204);
    expect(me.status).toBe(401);
  });

  it('deve bloquear escrita vinda de outro site (Origin diferente)', async () => {
    const t = makeTestApp();

    const response = await request(t.app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://site-malicioso.example')
      .send({ email: 'a@a.com', password: 'x' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN_ORIGIN');
  });

  it('deve bloquear o login depois de 5 senhas erradas', async () => {
    const t = makeTestApp();
    await signUpAndLogin(t, 'ana@rede.com.br');

    let last = 0;
    for (let i = 0; i < 6; i++) {
      const response = await request(t.app)
        .post('/api/v1/auth/login')
        .send({ email: 'ana@rede.com.br', password: 'senha-errada-999' });
      last = response.status;
    }

    expect(last).toBe(429);
  });

  it('deve redefinir a senha pelo link do e-mail e derrubar a sessão antiga', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const forgot = await request(t.app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ana@rede.com.br' });
    expect(forgot.status).toBe(202);

    const reset = await request(t.app)
      .post('/api/v1/auth/reset-password')
      .send({ token: t.lastToken(), password: 'nova-senha-super-segura' });
    expect(reset.status).toBe(204);

    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
    const login = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: 'ana@rede.com.br', password: 'nova-senha-super-segura' });
    expect(login.status).toBe(200);
  });

  it('deve responder 202 em esqueci a senha mesmo com e-mail desconhecido', async () => {
    const t = makeTestApp();

    const forgot = await request(t.app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ninguem@rede.com.br' });

    expect(forgot.status).toBe(202);
    expect(t.sent).toHaveLength(0);
  });

  it('deve atualizar o regime tributário e o faturamento do grupo', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const response = await agent
      .patch('/api/v1/groups/current')
      .send({ taxRegime: 'simples', annualRevenue: 12000000 });

    expect(response.status).toBe(200);
    expect(response.body.group).toMatchObject({ taxRegime: 'simples', annualRevenue: 12000000 });
  });

  it('deve excluir a conta com a senha e apagar tudo do grupo', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const wrong = await agent.delete('/api/v1/auth/account').send({ password: 'senha-errada-999' });
    expect(wrong.status).toBe(401);

    const ok = await agent.delete('/api/v1/auth/account').send({ password: PASSWORD });
    expect(ok.status).toBe(204);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.group.count()).toBe(0);
    expect(await prisma.session.count()).toBe(0);
  });
});
