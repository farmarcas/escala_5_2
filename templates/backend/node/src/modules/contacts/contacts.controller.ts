import type { Request, Response } from 'express';
import type { z } from 'zod';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
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
    const { user, group } = getPrincipal(res);
    // Quem entra já tem conta: nome, e-mail e empresa vêm dela, não do corpo da requisição.
    res.status(201).json(
      await service.submit({
        ...contact,
        name: user.name,
        email: user.email,
        company: group.name,
      }),
    );
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
