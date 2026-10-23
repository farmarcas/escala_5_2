import { describe, expect, it } from 'vitest';
import { AttemptLimiter } from './rate-limit.js';

describe('AttemptLimiter', () => {
  it('deve bloquear depois do máximo de falhas dentro da janela', () => {
    const limiter = new AttemptLimiter({ max: 3, windowMs: 1000, now: () => 0 });

    for (let i = 0; i < 3; i++) limiter.recordFailure('a');

    expect(limiter.isBlocked('a')).toBe(true);
    expect(limiter.isBlocked('b')).toBe(false);
  });

  it('deve liberar depois que a janela passa', () => {
    let now = 0;
    const limiter = new AttemptLimiter({ max: 2, windowMs: 1000, now: () => now });
    limiter.recordFailure('a');
    limiter.recordFailure('a');

    now = 1001;

    expect(limiter.isBlocked('a')).toBe(false);
  });

  it('deve zerar as falhas quando reset é chamado', () => {
    const limiter = new AttemptLimiter({ max: 2, windowMs: 1000 });
    limiter.recordFailure('a');
    limiter.recordFailure('a');

    limiter.reset('a');

    expect(limiter.isBlocked('a')).toBe(false);
  });
});
