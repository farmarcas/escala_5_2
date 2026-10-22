import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { buildContactsCsv } from './contacts.csv.js';
import type {
  anonymizeContactRequestSchema,
  createContactRequestSchema,
  listContactRequestsSchema,
} from './contacts.schemas.js';
import type { ContactsService } from './contacts.service.js';

export const makeContactsController = (service: ContactsService) => ({
  async create(_req: Request, res: Response) {
    const { body } = readValidated<z.output<typeof createContactRequestSchema>>(res);
    const { acceptPrivacy: _accepted, ...contact } = body;
    res.status(201).json(await service.submit(contact));
  },

  async list(_req: Request, res: Response) {
    const { query } = readValidated<z.output<typeof listContactRequestsSchema>>(res);
    const result = await service.list(query.page, query.pageSize);
    if (query.format === 'csv') {
      res
        .status(200)
        .type('text/csv; charset=utf-8')
        .set('Content-Disposition', 'attachment; filename="contatos-calculadora.csv"')
        .send(buildContactsCsv(result.data));
      return;
    }
    res.json(result);
  },

  async anonymize(_req: Request, res: Response) {
    const { params } = readValidated<z.output<typeof anonymizeContactRequestSchema>>(res);
    await service.anonymize(params.id);
    res.status(204).send();
  },
});
