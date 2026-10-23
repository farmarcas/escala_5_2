import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const ipApp = (hops: number) => {
  const app = express();
  app.set('trust proxy', hops);
  app.get('/ip', (req, res) => {
    res.json({ ip: req.ip });
  });
  return app;
};

describe('trust proxy', () => {
  it('com 1 salto, usa o IP real de X-Forwarded-For', async () => {
    const res = await request(ipApp(1)).get('/ip').set('X-Forwarded-For', '203.0.113.7');
    expect(res.body.ip).toBe('203.0.113.7');
  });

  it('sem proxy confiável, ignora o cabeçalho (não dá para forjar o IP)', async () => {
    const res = await request(ipApp(0)).get('/ip').set('X-Forwarded-For', '203.0.113.7');
    expect(res.body.ip).not.toBe('203.0.113.7');
  });
});
