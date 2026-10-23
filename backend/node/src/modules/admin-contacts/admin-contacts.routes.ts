import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { makeContactsController } from '../contacts/contacts.controller.js';
import { contactsRepository } from '../contacts/contacts.repository.js';
import {
  anonymizeContactRequestSchema,
  listContactRequestsSchema,
} from '../contacts/contacts.schemas.js';
import { makeContactsService, type ContactsRepository } from '../contacts/contacts.service.js';

export const adminContactsRouter = (
  requireAdminKey: RequestHandler,
  repo: ContactsRepository = contactsRepository,
) => {
  const controller = makeContactsController(makeContactsService(repo));
  const router = Router();

  router.use(requireAdminKey);
  router.get('/', validate(listContactRequestsSchema), controller.list);
  router.post('/:id/anonymize', validate(anonymizeContactRequestSchema), controller.anonymize);

  return router;
};
