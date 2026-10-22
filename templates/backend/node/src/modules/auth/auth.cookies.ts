import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { SESSION_TTL_MS } from './auth.service.js';

export const SESSION_COOKIE = 'fm_session';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.COOKIE_SECURE,
  path: '/',
});

export const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
};

export const readSessionCookie = (req: Request): string | null => {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        // Cookie malformado vira "sem sessão" em vez de erro 500.
        return null;
      }
    }
  }
  return null;
};
