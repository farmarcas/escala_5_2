import type { Request, Response } from 'express';
import type { z } from 'zod';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import type {
  compareSimulationsRequestSchema,
  copySimulationRequestSchema,
  createSimulationRequestSchema,
  deleteSimulationRequestSchema,
  getSimulationRequestSchema,
  listSimulationsRequestSchema,
  previewRequestSchema,
  renameSimulationRequestSchema,
} from './simulations.schemas.js';
import type { SimulationsService } from './simulations.service.js';

type Validated<T extends z.ZodType> = z.infer<T>;

export const makeSimulationsController = (service: SimulationsService) => ({
  async preview(_req: Request, res: Response) {
    const { body } = readValidated<Validated<typeof previewRequestSchema>>(res);
    res.json(await service.preview(getPrincipal(res), body));
  },

  async create(_req: Request, res: Response) {
    const { body } = readValidated<Validated<typeof createSimulationRequestSchema>>(res);
    res.status(201).json({ simulation: await service.create(getPrincipal(res), body) });
  },

  async list(_req: Request, res: Response) {
    const { query } = readValidated<Validated<typeof listSimulationsRequestSchema>>(res);
    res.json(await service.list(getPrincipal(res).groupId, query.page, query.pageSize));
  },

  async get(_req: Request, res: Response) {
    const { params } = readValidated<Validated<typeof getSimulationRequestSchema>>(res);
    res.json({ simulation: await service.get(getPrincipal(res).groupId, params.id) });
  },

  async rename(_req: Request, res: Response) {
    const { params, body } = readValidated<Validated<typeof renameSimulationRequestSchema>>(res);
    res.json({ simulation: await service.rename(getPrincipal(res).groupId, params.id, body.name) });
  },

  async duplicate(_req: Request, res: Response) {
    const { params, body } = readValidated<Validated<typeof copySimulationRequestSchema>>(res);
    res
      .status(201)
      .json({ simulation: await service.duplicate(getPrincipal(res), params.id, body.name) });
  },

  async recalculate(_req: Request, res: Response) {
    const { params, body } = readValidated<Validated<typeof copySimulationRequestSchema>>(res);
    res
      .status(201)
      .json({ simulation: await service.recalculate(getPrincipal(res), params.id, body.name) });
  },

  async remove(_req: Request, res: Response) {
    const { params } = readValidated<Validated<typeof deleteSimulationRequestSchema>>(res);
    await service.remove(getPrincipal(res).groupId, params.id);
    res.status(204).send();
  },

  async compare(_req: Request, res: Response) {
    const { query } = readValidated<Validated<typeof compareSimulationsRequestSchema>>(res);
    res.json(await service.compare(getPrincipal(res).groupId, query.ids));
  },
});
