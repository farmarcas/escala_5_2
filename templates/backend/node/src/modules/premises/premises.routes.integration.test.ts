import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';
import { makeTestApp, resetDatabase, signUpAndLogin } from '../../test-utils/auth-helper.js';

describe('GET /api/v1/premises/defaults', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve exigir login', async () => {
    const t = makeTestApp();

    const response = await request(t.app).get('/api/v1/premises/defaults');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('deve entregar as premissas padrão a quem está logado, sem o antigo bloco do modo rápido', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const response = await agent.get('/api/v1/premises/defaults');

    expect(response.status).toBe(200);
    expect(response.body.version).toEqual(expect.any(String));
    expect(response.body.taxation.irpjCsllRate).toBe(0.34);
    expect(response.body.detailed.absenceRate).toBe(0.13);
    expect(response.body.detailed.actions).toHaveLength(6);
    expect(response.body.detailed.actions[0]).toMatchObject({
      id: 'ajuste-quadro',
      defaultEffect: 0.1,
    });
    expect(response.body.quick).toBeUndefined();
  });
});
