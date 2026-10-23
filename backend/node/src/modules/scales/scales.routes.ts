import { Router, type RequestHandler } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { makeScalesController } from './scales.controller.js';
import { scalesRepository } from './scales.repository.js';
import {
  bodyRequestSchema,
  diagnosticRequestSchema,
  idRequestSchema,
  listRequestSchema,
  rosterRequestSchema,
  updateRequestSchema,
} from './scales.schemas.js';
import { makeScalesService, type ScalesRepository } from './scales.service.js';

export const scalesRouter = (
  requireSession: RequestHandler,
  repo: ScalesRepository = scalesRepository,
  today: () => string = () => new Date().toISOString().slice(0, 10),
) => {
  const controller = makeScalesController(makeScalesService(repo), today);
  const router = Router();

  router.use(requireSession);
  router.get('/defaults', validate(listRequestSchema), controller.defaults);
  router.post('/preview', validate(bodyRequestSchema), controller.preview);
  router.get('/rules', validate(listRequestSchema), controller.rules);
  router.get('/stores', validate(listRequestSchema), controller.list);
  router.post('/stores', validate(bodyRequestSchema), controller.create);
  router.get('/stores/:id', validate(idRequestSchema), controller.getById);
  router.put('/stores/:id', validate(updateRequestSchema), controller.update);
  router.delete('/stores/:id', validate(idRequestSchema), controller.remove);
  router.post('/stores/:id/duplicate', validate(idRequestSchema), controller.duplicate);
  router.get('/stores/:id/report.xlsx', validate(idRequestSchema), controller.report);
  router.get('/stores/:id/roster', validate(rosterRequestSchema), controller.roster);
  router.get('/stores/:id/diagnostic', validate(diagnosticRequestSchema), controller.diagnostic);

  return router;
};
