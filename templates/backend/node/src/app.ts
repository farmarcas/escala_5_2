import express from 'express';
import { pinoHttp } from 'pino-http';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { requestId } from './shared/middlewares/request-id.js';
import { sameOrigin } from './shared/middlewares/same-origin.js';
import { env } from './config/env.js';
import { authRouter, groupsRouter } from './modules/auth/auth.routes.js';
import { authRepository } from './modules/auth/auth.repository.js';
import { makeAuthService } from './modules/auth/auth.service.js';
import type { Mailer } from './modules/auth/auth.types.js';
import { adminContactsRouter } from './modules/admin-contacts/admin-contacts.routes.js';
import { contactsRouter } from './modules/contacts/contacts.routes.js';
import { assistantRouter, type AssistantDeps } from './modules/assistant/assistant.routes.js';
import { scalesRouter } from './modules/scales/scales.routes.js';
import { makeSmtpMailer } from './shared/mailer.js';
import { AttemptLimiter } from './shared/middlewares/rate-limit.js';
import { requireAdminKey } from './shared/middlewares/require-admin-key.js';
import { requireSession } from './shared/middlewares/require-session.js';
import { hashPassword, verifyPassword } from './shared/security/password.js';

type AppDeps = {
  mailer?: Mailer;
  loginLimiter?: AttemptLimiter;
  contactLimiter?: AttemptLimiter;
  // `undefined` explícito desliga a consulta de contatos; omitido usa ADMIN_API_KEY do ambiente.
  adminApiKey?: string | undefined;
  assistant?: AssistantDeps;
};

export const createApp = (deps: AppDeps = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch (error) {
      logger.warn({ err: error }, 'readiness check failed');
      res.status(503).json({
        error: { code: 'NOT_READY', message: 'Banco indisponível', details: [] },
      });
    }
  });

  app.use('/api/v1', sameOrigin(env.APP_BASE_URL));
  const auth = makeAuthService({
    repo: authRepository,
    mailer: deps.mailer ?? makeSmtpMailer(),
    passwords: { hash: hashPassword, verify: verifyPassword },
    limiter: deps.loginLimiter ?? new AttemptLimiter({ max: 5, windowMs: 15 * 60_000 }),
    appBaseUrl: env.APP_BASE_URL,
  });
  app.use('/api/v1/auth', authRouter(auth));
  app.use('/api/v1/groups', groupsRouter(auth));
  app.use('/api/v1/scales', scalesRouter(requireSession(auth)));
  app.use('/api/v1/assistant', assistantRouter(requireSession(auth), deps.assistant));
  app.use('/api/v1/contact-requests', contactsRouter(requireSession(auth), deps.contactLimiter));
  app.use(
    '/api/v1/admin/contact-requests',
    adminContactsRouter(
      requireAdminKey('adminApiKey' in deps ? deps.adminApiKey : env.ADMIN_API_KEY),
    ),
  );

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada', details: [] },
    });
  });

  app.use(errorHandler);
  return app;
};

export const app = createApp();
