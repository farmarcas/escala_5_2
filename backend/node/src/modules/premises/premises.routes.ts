import { Router } from 'express';
import { premises } from '../../config/premises.js';

export const premisesRouter = () => {
  const router = Router();

  router.get('/defaults', (_req, res) => {
    res.json(premises);
  });

  return router;
};
