import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../shared/database/prisma.js';
import { AttemptLimiter } from '../shared/middlewares/rate-limit.js';

export const PASSWORD = 'senha-de-teste-123';

export const makeTestApp = () => {
  const sent: { to: string; subject: string; text: string }[] = [];
  const app: Express = createApp({
    mailer: {
      send: async (message) => {
        sent.push(message);
      },
    },
    loginLimiter: new AttemptLimiter({ max: 5, windowMs: 15 * 60_000 }),
  });
  const lastToken = () => sent.at(-1)?.text.match(/token=([\w-]+)/)?.[1] ?? '';
  return { app, sent, lastToken };
};

export const resetDatabase = async () => {
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
};

type TestApp = ReturnType<typeof makeTestApp>;

// Cadastra, confirma o e-mail e entra. O agente devolvido já carrega o cookie de sessão.
export const signUpAndLogin = async (testApp: TestApp, email: string, groupName = 'Rede Teste') => {
  await request(testApp.app)
    .post('/api/v1/auth/register')
    .send({ name: 'Pessoa Teste', email, password: PASSWORD, groupName, acceptPrivacy: true });
  await request(testApp.app).post('/api/v1/auth/verify-email').send({ token: testApp.lastToken() });
  const agent = request.agent(testApp.app);
  const login = await agent.post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return { agent, login };
};
