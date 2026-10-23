import type { NextFunction, Request, Response } from 'express';
import { readSessionCookie } from '../../modules/auth/auth.cookies.js';
import type { AuthService } from '../../modules/auth/auth.service.js';
import type { Principal } from '../../modules/auth/auth.types.js';
import { AppError } from '../errors/app-error.js';

export const requireSession =
  (auth: AuthService) => async (req: Request, res: Response, next: NextFunction) => {
    const token = readSessionCookie(req);
    const principal = token ? await auth.authenticate(token) : null;
    if (!principal) {
      next(new AppError('Entre na sua conta para continuar', 401, 'UNAUTHENTICATED'));
      return;
    }
    res.locals.principal = principal;
    next();
  };

export const getPrincipal = (res: Response): Principal => res.locals.principal as Principal;
