import type { Request, Response } from 'express';
import type { z } from 'zod';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import type {
  createStoreRequestSchema,
  deleteStoreRequestSchema,
  getStoreRequestSchema,
  listStoresRequestSchema,
  updateStoreRequestSchema,
} from './stores.schemas.js';
import type { StoresService } from './stores.service.js';

export const makeStoresController = (service: StoresService) => ({
  async list(_req: Request, res: Response) {
    const { query } = readValidated<z.infer<typeof listStoresRequestSchema>>(res);
    res.json(await service.list(getPrincipal(res).groupId, query.page, query.pageSize));
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof getStoreRequestSchema>>(res);
    res.json({ store: await service.getById(getPrincipal(res).groupId, params.id) });
  },

  async create(_req: Request, res: Response) {
    const { body } = readValidated<z.infer<typeof createStoreRequestSchema>>(res);
    res.status(201).json({ store: await service.create(getPrincipal(res).groupId, body) });
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateStoreRequestSchema>>(res);
    res.json({ store: await service.update(getPrincipal(res).groupId, params.id, body) });
  },

  async remove(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof deleteStoreRequestSchema>>(res);
    await service.remove(getPrincipal(res).groupId, params.id);
    res.status(204).send();
  },
});
