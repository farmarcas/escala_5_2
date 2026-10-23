import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const forbidden = () => new AppError('Origem da requisição não permitida', 403, 'FORBIDDEN_ORIGIN');

// Defesa contra CSRF junto com o cookie SameSite=Lax: escrita só vale se vier do próprio site.
export const sameOrigin = (appBaseUrl: string) => {
  const allowedHost = new URL(appBaseUrl).host;

  return (req: Request, _res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.headers.origin;
    if (typeof origin === 'string') {
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        next(forbidden());
        return;
      }
      if (originHost === allowedHost || originHost === req.headers.host) next();
      else next(forbidden());
      return;
    }

    if (req.headers['sec-fetch-site'] === 'cross-site') next(forbidden());
    else next();
  };
};
