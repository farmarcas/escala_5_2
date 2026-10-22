import type { Request, Response } from 'express';
import type { z } from 'zod';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import { addDays, mondayOf } from './engine/time.js';
import { defaultStore } from './scales.defaults.js';
import type { bodyRequestSchema, idRequestSchema, updateRequestSchema } from './scales.schemas.js';
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
    res.json({ diagnostic: service.preview(body) });
  },

  async diagnostic(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json({ diagnostic: await service.diagnostic(getPrincipal(res).groupId, params.id) });
  },
});
