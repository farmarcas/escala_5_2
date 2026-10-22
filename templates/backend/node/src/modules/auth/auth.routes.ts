import { Router } from 'express';
import { rateLimitByIp } from '../../shared/middlewares/rate-limit.js';
import { requireSession } from '../../shared/middlewares/require-session.js';
import { validate } from '../../shared/middlewares/validate.js';
import { makeAuthController } from './auth.controller.js';
import {
  deleteAccountRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  updateGroupRequestSchema,
  verifyEmailRequestSchema,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

const HOUR_MS = 3600_000;

export const authRouter = (service: AuthService) => {
  const controller = makeAuthController(service);
  const router = Router();
  const mailLimit = rateLimitByIp({ max: 50, windowMs: HOUR_MS });
  const session = requireSession(service);

  router.post('/register', mailLimit, validate(registerRequestSchema), controller.register);
  router.post('/verify-email', validate(verifyEmailRequestSchema), controller.verifyEmail);
  router.post('/login', validate(loginRequestSchema), controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', session, controller.me);
  router.post(
    '/forgot-password',
    mailLimit,
    validate(forgotPasswordRequestSchema),
    controller.forgotPassword,
  );
  router.post('/reset-password', validate(resetPasswordRequestSchema), controller.resetPassword);
  router.delete(
    '/account',
    session,
    validate(deleteAccountRequestSchema),
    controller.deleteAccount,
  );

  return router;
};

export const groupsRouter = (service: AuthService) => {
  const controller = makeAuthController(service);
  const router = Router();

  router.patch(
    '/current',
    requireSession(service),
    validate(updateGroupRequestSchema),
    controller.updateGroup,
  );

  return router;
};
