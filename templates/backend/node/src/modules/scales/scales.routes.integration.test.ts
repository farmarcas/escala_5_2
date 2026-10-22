import ExcelJS from 'exceljs';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';
import { makeTestApp, resetDatabase, signUpAndLogin } from '../../test-utils/auth-helper.js';
import { defaultStore } from './scales.defaults.js';

const centro = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };

describe('scales routes', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('exige login em todas as rotas', async () => {
    const t = makeTestApp();
    expect((await request(t.app).get('/api/v1/scales/stores')).status).toBe(401);
    expect((await request(t.app).post('/api/v1/scales/preview').send(centro)).status).toBe(401);
    expect((await request(t.app).get('/api/v1/scales/defaults')).status).toBe(401);
  });

  it('cria, lê, edita, duplica, diagnostica e remove', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');

    const created = await agent.post('/api/v1/scales/stores').send(centro);
    expect(created.status).toBe(201);
    const id = created.body.store.id as string;
    expect(created.body.store.roles).toHaveLength(12);
    expect(created.body.store.hours.overrides['6']).toEqual({ start: '08:00', end: '14:00' });

    const dup = await agent.post(`/api/v1/scales/stores/${id}/duplicate`);
    expect(dup.status).toBe(201);
    expect(dup.body.store.name).toBe('Centro (cópia)');

    const list = await agent.get('/api/v1/scales/stores');
    expect(list.body.data.map((s: { name: string }) => s.name)).toEqual([
      'Centro',
      'Centro (cópia)',
    ]);
    expect(list.body.data[0].people).toBe(14);

    const edited = await agent
      .put(`/api/v1/scales/stores/${id}`)
      .send({ ...centro, city: 'Alfenas' });
    expect(edited.body.store.city).toBe('Alfenas');

    const diag = await agent.get(`/api/v1/scales/stores/${id}/diagnostic`);
    expect(diag.status).toBe(200);
    expect(diag.body.diagnostic.totals.hire['5x2_42']).toBeGreaterThan(0);
    const presumido = await agent.get(
      `/api/v1/scales/stores/${id}/diagnostic?regime=lucro_presumido_real&provisions=false`,
    );
    expect(presumido.body.diagnostic.payroll.taxRegime).toBe('lucro_presumido_real');
    expect(presumido.body.diagnostic.payroll.provisions).toBe(false);
    expect((await agent.get(`/api/v1/scales/stores/${id}/diagnostic?regime=x`)).status).toBe(400);

    const started = Date.now();
    const roster = await agent.get(`/api/v1/scales/stores/${id}/roster?scenario=5x2_42`);
    expect(roster.status).toBe(200);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(roster.body.roster.dates).toHaveLength(28);
    const balconista = roster.body.roster.groups.find(
      (g: { key: string }) => g.key === 'balconista',
    );
    expect(balconista.covered).toBe(true);
    expect(balconista.people.some((p: { tags: string[] }) => p.tags.includes('contratar'))).toBe(
      true,
    );
    expect((await agent.get(`/api/v1/scales/stores/${id}/roster?scenario=7x0`)).status).toBe(400);

    expect(diag.body.alerts.length).toBeGreaterThan(0);

    const rules = await agent.get('/api/v1/scales/rules');
    expect(rules.status).toBe(200);
    expect(rules.body.rules.length).toBeGreaterThan(5);

    const xlsx = await agent
      .get(`/api/v1/scales/stores/${id}/report.xlsx`)
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(xlsx.status).toBe(200);
    expect(xlsx.headers['content-disposition']).toContain('escalas-');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(xlsx.body as never);
    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Comparativo',
      'Plano de ação',
      'Modelo por função',
      'Escala 6x1 44h',
      'Escala 5x2 42h',
      'Escala 5x2 40h',
    ]);
    // Os números do Excel são os mesmos da tela (diagnóstico da API).
    const total = wb.getWorksheet('Comparativo')!.getRow(4 + diag.body.diagnostic.rows.length);
    expect(total.getCell(1).value).toBe('Total');
    expect(total.getCell(4).value).toBe(diag.body.diagnostic.totals.need['5x2_42']);
    expect(total.getCell(6).value).toBe(diag.body.diagnostic.totals.hire['5x2_42']);
    const roster42 = wb.getWorksheet('Escala 5x2 42h')!;
    expect(roster42.rowCount).toBeGreaterThan(20);
    expect((await agent.get(`/api/v1/scales/stores/${id}/report.xlsx`)).status).toBe(200);

    expect((await agent.delete(`/api/v1/scales/stores/${id}`)).status).toBe(204);
    expect((await agent.get(`/api/v1/scales/stores/${id}`)).status).toBe(404);
  });

  it('recusa nome repetido e dados inválidos', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    await agent.post('/api/v1/scales/stores').send(centro);
    const again = await agent.post('/api/v1/scales/stores').send({ ...centro, name: 'CENTRO' });
    expect(again.status).toBe(409);
    const bad = await agent
      .post('/api/v1/scales/stores')
      .send({ ...centro, name: 'Outra', scaleStartDate: '2026-12-15' });
    expect(bad.status).toBe(400);
  });

  it('isola lojas entre grupos', async () => {
    const t = makeTestApp();
    const a = await signUpAndLogin(t, 'ana@rede.com.br', 'Rede A');
    const created = await a.agent.post('/api/v1/scales/stores').send(centro);
    const b = await signUpAndLogin(t, 'bia@rede.com.br', 'Rede B');
    const id = created.body.store.id as string;
    expect((await b.agent.get(`/api/v1/scales/stores/${id}`)).status).toBe(404);
    expect((await b.agent.delete(`/api/v1/scales/stores/${id}`)).status).toBe(404);
    expect((await b.agent.get(`/api/v1/scales/stores/${id}/diagnostic`)).status).toBe(404);
    expect((await b.agent.get(`/api/v1/scales/stores/${id}/roster`)).status).toBe(404);
    expect((await b.agent.get(`/api/v1/scales/stores/${id}/report.xlsx`)).status).toBe(404);
    expect((await b.agent.get('/api/v1/scales/stores')).body.data).toEqual([]);
  });

  it('preview calcula sem salvar e defaults traz uma loja de exemplo', async () => {
    const t = makeTestApp();
    const { agent } = await signUpAndLogin(t, 'ana@rede.com.br');
    const preview = await agent.post('/api/v1/scales/preview').send(centro);
    expect(preview.status).toBe(200);
    expect(preview.body.diagnostic.rows.length).toBeGreaterThan(5);
    expect(Array.isArray(preview.body.alerts)).toBe(true);
    expect((await agent.get('/api/v1/scales/stores')).body.data).toEqual([]);
    const defaults = await agent.get('/api/v1/scales/defaults');
    expect(defaults.body.store.scaleStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
