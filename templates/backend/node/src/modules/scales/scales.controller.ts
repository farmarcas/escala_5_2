import type { Request, Response } from 'express';
import type { z } from 'zod';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import { LEGAL_RULES, REFERENCE_DATE, SCENARIOS } from './engine/rules.js';
import { addDays, mondayOf } from './engine/time.js';
import { defaultStore } from './scales.defaults.js';
import type {
  bodyRequestSchema,
  diagnosticRequestSchema,
  idRequestSchema,
  rosterRequestSchema,
  updateRequestSchema,
} from './scales.schemas.js';
import type { ScalesService } from './scales.service.js';

export const makeScalesController = (service: ScalesService, today: () => string) => ({
  async list(_req: Request, res: Response) {
    res.json({ data: await service.list(getPrincipal(res).groupId) });
  },

  // Loja de exemplo para o cadastro novo: início na próxima segunda-feira.
  defaults(_req: Request, res: Response) {
    const monday = mondayOf(today());
    res.json({ store: defaultStore(addDays(monday, 7)) });
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json({ store: await service.getById(getPrincipal(res).groupId, params.id) });
  },

  async create(_req: Request, res: Response) {
    const { body } = readValidated<z.infer<typeof bodyRequestSchema>>(res);
    res.status(201).json({ store: await service.create(getPrincipal(res).groupId, body) });
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateRequestSchema>>(res);
    res.json({ store: await service.update(getPrincipal(res).groupId, params.id, body) });
  },

  async remove(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    await service.remove(getPrincipal(res).groupId, params.id);
    res.status(204).send();
  },

  async duplicate(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.status(201).json({ store: await service.duplicate(getPrincipal(res).groupId, params.id) });
  },

  preview(_req: Request, res: Response) {
    const { body } = readValidated<z.infer<typeof bodyRequestSchema>>(res);
    res.json(service.preview(body));
  },

  async roster(_req: Request, res: Response) {
    const { params, query } = readValidated<z.infer<typeof rosterRequestSchema>>(res);
    res.json({
      roster: await service.roster(getPrincipal(res).groupId, params.id, query.scenario),
    });
  },

  rules(_req: Request, res: Response) {
    res.json({
      asOf: REFERENCE_DATE,
      rules: LEGAL_RULES,
      scenarios: Object.values(SCENARIOS).map(({ id, label, daysPerWeek, weeklyHours }) => ({
        id,
        label,
        daysPerWeek,
        weeklyHours,
      })),
    });
  },

  async report(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    const { name, buffer } = await service.report(getPrincipal(res).groupId, params.id);
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    res
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .set('Content-Disposition', `attachment; filename="escalas-${slug || 'loja'}.xlsx"`)
      .send(buffer);
  },

  async diagnostic(_req: Request, res: Response) {
    const { params, query } = readValidated<z.infer<typeof diagnosticRequestSchema>>(res);
    const overrides = {
      ...(query.regime && { taxRegime: query.regime }),
      ...(query.provisions && { provisions: query.provisions === 'true' }),
    };
    res.json(await service.diagnostic(getPrincipal(res).groupId, params.id, overrides));
  },
});
