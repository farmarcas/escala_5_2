import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getPrincipal } from '../../shared/middlewares/require-session.js';
import { clearSessionCookie, readSessionCookie, setSessionCookie } from './auth.cookies.js';
import type {
  deleteAccountRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
  updateGroupRequestSchema,
  verifyEmailRequestSchema,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

type Body<T extends z.ZodType<{ body: unknown }>> = z.infer<T>['body'];

const sessionView = (principal: ReturnType<typeof getPrincipal>) => ({
  user: principal.user,
  group: principal.group,
});

export const makeAuthController = (service: AuthService) => ({
  async register(_req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof registerRequestSchema> }>(res);
    await service.register(body);
    res.status(202).json({
      message: 'Se o e-mail puder ser cadastrado, enviamos um link de confirmação para ele.',
    });
  },

  async verifyEmail(_req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof verifyEmailRequestSchema> }>(res);
    await service.verifyEmail(body.token);
    res.status(204).send();
  },

  async login(req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof loginRequestSchema> }>(res);
    const { token, principal } = await service.login(body.email, body.password, req.ip ?? 'ip');
    setSessionCookie(res, token);
    res.json(sessionView(principal));
  },

  async logout(req: Request, res: Response) {
    const token = readSessionCookie(req);
    if (token) await service.logout(token);
    clearSessionCookie(res);
    res.status(204).send();
  },

  me(_req: Request, res: Response) {
    res.json(sessionView(getPrincipal(res)));
  },

  async forgotPassword(_req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof forgotPasswordRequestSchema> }>(res);
    await service.forgotPassword(body.email);
    res.status(202).json({
      message: 'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.',
    });
  },

  async resetPassword(_req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof resetPasswordRequestSchema> }>(res);
    await service.resetPassword(body.token, body.password);
    res.status(204).send();
  },

  async deleteAccount(_req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof deleteAccountRequestSchema> }>(res);
    await service.deleteAccount(getPrincipal(res), body.password);
    clearSessionCookie(res);
    res.status(204).send();
  },

  async updateGroup(_req: Request, res: Response) {
    const { body } = readValidated<{ body: Body<typeof updateGroupRequestSchema> }>(res);
    const group = await service.updateGroup(getPrincipal(res).groupId, body);
    res.json({ group });
  },
});
