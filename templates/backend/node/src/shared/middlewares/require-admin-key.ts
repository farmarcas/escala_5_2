import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

const digest = (value: string) => createHash('sha256').update(value).digest();

// Chave da equipe da Farmarcas (ADMIN_API_KEY). Sem chave configurada, a consulta fica desligada.
export const requireAdminKey =
  (adminKey: string | undefined) => (req: Request, _res: Response, next: NextFunction) => {
    const given = req.headers['x-admin-key'];
    const isValid =
      adminKey !== undefined &&
      typeof given === 'string' &&
      timingSafeEqual(digest(given), digest(adminKey));

    next(isValid ? undefined : new AppError('Chave de acesso inválida', 401, 'UNAUTHENTICATED'));
  };
