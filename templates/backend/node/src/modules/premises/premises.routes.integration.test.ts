import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

describe('GET /api/v1/premises/defaults', () => {
  it('deve entregar as premissas padrão sem exigir login', async () => {
    const response = await request(createApp()).get('/api/v1/premises/defaults');

    expect(response.status).toBe(200);
    expect(response.body.version).toEqual(expect.any(String));
    expect(response.body.taxation.irpjCsllRate).toBe(0.34);
    expect(Object.keys(response.body.quick.profiles)).toEqual(['rua', 'shopping', '24h']);
    expect(response.body.quick.mitigation.actions).toHaveLength(6);
    expect(response.body.detailed.actions).toHaveLength(6);
    expect(response.body.detailed.actions[0]).toMatchObject({
      id: 'ajuste-quadro',
      defaultEffect: 0.1,
    });
  });
});
