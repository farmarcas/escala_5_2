import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

type LimiterOptions = { max: number; windowMs: number; now?: () => number };

// Contador em memória (uma instância da API). Se a API for replicada, troque por armazenamento compartilhado.
export class AttemptLimiter {
  private readonly attempts = new Map<string, number[]>();
  private readonly now: () => number;

  constructor(private readonly options: LimiterOptions) {
    this.now = options.now ?? Date.now;
  }

  private recent(key: string): number[] {
    const limit = this.now() - this.options.windowMs;
    const recent = (this.attempts.get(key) ?? []).filter((at) => at > limit);
    if (recent.length === 0) this.attempts.delete(key);
    else this.attempts.set(key, recent);
    return recent;
  }

  isBlocked(key: string): boolean {
    return this.recent(key).length >= this.options.max;
  }

  recordFailure(key: string): void {
    this.attempts.set(key, [...this.recent(key), this.now()]);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Limita quantas requisições por IP a rota aceita na janela (ex.: envio de contato).
export const rateLimitWith =
  (limiter: AttemptLimiter) => (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip ?? 'desconhecido';
    if (limiter.isBlocked(key)) {
      next(
        new AppError('Muitas tentativas. Tente de novo em alguns minutos.', 429, 'RATE_LIMITED'),
      );
      return;
    }
    limiter.recordFailure(key);
    next();
  };

export const rateLimitByIp = (options: LimiterOptions) =>
  rateLimitWith(new AttemptLimiter(options));
