import { Router, type RequestHandler } from 'express';
import { AttemptLimiter, rateLimitWith } from '../../shared/middlewares/rate-limit.js';
import { validate } from '../../shared/middlewares/validate.js';
import { makeContactsController } from './contacts.controller.js';
import { contactsRepository } from './contacts.repository.js';
import { createContactRequestSchema } from './contacts.schemas.js';
import { makeContactsService, type ContactsRepository } from './contacts.service.js';

const HOUR_MS = 3600_000;

export const contactsRouter = (
  requireSession: RequestHandler,
  limiter: AttemptLimiter = new AttemptLimiter({ max: 20, windowMs: HOUR_MS }),
  repo: ContactsRepository = contactsRepository,
) => {
  const controller = makeContactsController(makeContactsService(repo));
  const router = Router();

  router.use(requireSession);
  router.post('/', rateLimitWith(limiter), validate(createContactRequestSchema), controller.create);

  return router;
};
