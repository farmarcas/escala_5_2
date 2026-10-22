import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { storesRepository } from '../stores/stores.repository.js';
import type { StoresRepository } from '../stores/stores.service.js';
import { makeSimulationsController } from './simulations.controller.js';
import { simulationsRepository } from './simulations.repository.js';
import {
  compareSimulationsRequestSchema,
  copySimulationRequestSchema,
  createSimulationRequestSchema,
  deleteSimulationRequestSchema,
  getSimulationRequestSchema,
  listSimulationsRequestSchema,
  previewRequestSchema,
  renameSimulationRequestSchema,
} from './simulations.schemas.js';
import { makeSimulationsService, type SimulationsRepository } from './simulations.service.js';

export const simulationsRouter = (
  requireSession: RequestHandler,
  stores: StoresRepository = storesRepository,
  repo: SimulationsRepository = simulationsRepository,
) => {
  const controller = makeSimulationsController(makeSimulationsService(stores, repo));
  const router = Router();

  router.use(requireSession);
  router.post('/preview', validate(previewRequestSchema), controller.preview);
  // /compare vem antes de /:id para não ser lido como um id.
  router.get('/compare', validate(compareSimulationsRequestSchema), controller.compare);
  router.get('/', validate(listSimulationsRequestSchema), controller.list);
  router.post('/', validate(createSimulationRequestSchema), controller.create);
  router.get('/:id', validate(getSimulationRequestSchema), controller.get);
  router.patch('/:id', validate(renameSimulationRequestSchema), controller.rename);
  router.post('/:id/duplicate', validate(copySimulationRequestSchema), controller.duplicate);
  router.post('/:id/recalculate', validate(copySimulationRequestSchema), controller.recalculate);
  router.delete('/:id', validate(deleteSimulationRequestSchema), controller.remove);

  return router;
};
