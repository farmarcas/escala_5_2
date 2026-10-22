import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { makeStoresController } from './stores.controller.js';
import { storesRepository } from './stores.repository.js';
import {
  createStoreRequestSchema,
  deleteStoreRequestSchema,
  getStoreRequestSchema,
  listStoresRequestSchema,
  updateStoreRequestSchema,
} from './stores.schemas.js';
import { makeStoresService, type StoresRepository } from './stores.service.js';

export const storesRouter = (
  requireSession: RequestHandler,
  repo: StoresRepository = storesRepository,
) => {
  const controller = makeStoresController(makeStoresService(repo));
  const router = Router();

  router.use(requireSession);
  router.get('/', validate(listStoresRequestSchema), controller.list);
  router.post('/', validate(createStoreRequestSchema), controller.create);
  router.get('/:id', validate(getStoreRequestSchema), controller.getById);
  router.patch('/:id', validate(updateStoreRequestSchema), controller.update);
  router.delete('/:id', validate(deleteStoreRequestSchema), controller.remove);

  return router;
};
