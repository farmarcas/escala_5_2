import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { AttemptLimiter } from '../../shared/middlewares/rate-limit.js';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { validate } from '../../shared/middlewares/validate.js';
import { scalesRepository } from '../scales/scales.repository.js';
import { makeScalesService, type ScalesRepository } from '../scales/scales.service.js';
import { makeAssistantController } from './assistant.controller.js';
import { makeAnthropicClient, type ModelClient } from './assistant.model-client.js';
import { analyzeRequestSchema, statusRequestSchema } from './assistant.schemas.js';

export type AssistantDeps = { modelClient?: ModelClient | null; limiter?: AttemptLimiter };

const defaultModel = (): ModelClient | null =>
  env.ANTHROPIC_API_KEY
    ? makeAnthropicClient({
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ASSISTANT_MODEL,
        effort: env.ASSISTANT_EFFORT,
      })
    : null;

// Limite técnico por conta (não é teto de custo): evita laço de cliente com defeito.
const perAccount =
  (limiter: AttemptLimiter) => (_req: Request, res: Response, next: NextFunction) => {
    const key = getPrincipal(res).user.id;
    if (limiter.isBlocked(key)) {
      next(
        new AppError(
          'Muitos pedidos seguidos. Tente de novo em alguns minutos.',
          429,
          'RATE_LIMITED',
        ),
      );
      return;
    }
    limiter.recordFailure(key);
    next();
  };

export const assistantRouter = (
  requireSession: RequestHandler,
  deps: AssistantDeps = {},
  repo: ScalesRepository = scalesRepository,
) => {
  const model = deps.modelClient === undefined ? defaultModel() : deps.modelClient;
  const limiter =
    deps.limiter ??
    new AttemptLimiter({ max: env.ASSISTANT_RATE_MAX, windowMs: env.ASSISTANT_RATE_WINDOW_MS });
  const controller = makeAssistantController({ scales: makeScalesService(repo), model });
  const router = Router();

  router.use(requireSession);
  router.get('/status', validate(statusRequestSchema), controller.status);
  router.post('/analyze', validate(analyzeRequestSchema), perAccount(limiter), controller.analyze);

  return router;
};
