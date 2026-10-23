import { describe, expect, it } from 'vitest';
import { buildAlerts } from './scales.alerts.js';
import { defaultStore } from './scales.defaults.js';
import { diagnose } from './scales.diagnostic.js';

const base = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
const ids = (store = base) => buildAlerts(store, diagnose(store)).map((a) => a.id);

describe('alertas', () => {
  it('farmacêutico a contratar é alerta de prioridade (perigo)', () => {
    const a = buildAlerts(base, diagnose(base)).find((x) => x.id === 'farmaceutico-horario');
    expect(a?.severity).toBe('danger');
    expect(a?.message).toContain('CRF');
  });

  it('sem farmacêutico faltando, o alerta some', () => {
    const rich = {
      ...base,
      roles: base.roles.map((r) => (r.role === 'farmaceutico' ? { ...r, headcount: 12 } : r)),
    };
    expect(ids(rich)).not.toContain('farmaceutico-horario');
  });

  it('plantão: equipe ou intermitente geram orientações diferentes; sem plantão nada', () => {
    expect(ids()).not.toContain('plantao-equipe');
    const team = { ...base, plantao: { ...base.plantao, type: 'weekly' as const } };
    expect(ids(team)).toContain('plantao-equipe');
    const inter = { ...team, plantao: { ...team.plantao, cover: 'intermittent' as const } };
    expect(ids(inter)).toContain('plantao-intermitente');
  });

  it('faixa que passa do turno por poucos minutos sugere encurtar', () => {
    const store = {
      ...base,
      roles: base.roles.map((r) =>
        r.role === 'perfumista'
          ? { ...r, coverage: { mode: 'band' as const, start: '07:00', end: '22:00' } }
          : r,
      ),
    };
    const a = buildAlerts(store, diagnose(store)).find((x) => x.id === 'faixa-perfumista');
    expect(a).toBeDefined();
    expect(a!.message).toMatch(/Encurtar essa faixa em \d+ min \(ex\.: até \d\d:\d\d\)/);
  });

  it('CCT: alerta enquanto não for informada', () => {
    expect(ids()).toContain('cct');
    const withCct = {
      ...base,
      rules: { ...base.rules, cct: 'Sindicato do Comércio de Varginha, vigência 2026' },
    };
    expect(ids(withCct)).not.toContain('cct');
  });

  it('12x36 avisa que depende de convenção ou acordo', () => {
    const store = {
      ...base,
      roles: base.roles.map((r) =>
        r.role === 'caixa' ? { ...r, scaleType: 'doze_x_trinta_e_seis' as const } : r,
      ),
    };
    expect(ids(store)).toContain('doze-caixa');
  });

  it('folha acima da meta de vendas gera aviso', () => {
    const store = {
      ...base,
      sales: { enabled: true, monthlySales: 200_000, cmvRate: 0.7, payrollTargetRate: 0.12 },
    };
    expect(ids(store)).toContain('meta-folha');
  });

  it('plantão com poucos farmacêuticos hoje avisa que o custo de hoje está subestimado', () => {
    const team = { ...base, plantao: { ...base.plantao, type: 'weekly' as const } };
    expect(ids(team)).toContain('plantao-hoje-farmaceutico');
    const enough = {
      ...team,
      roles: team.roles.map((r) => (r.role === 'farmaceutico' ? { ...r, headcount: 4 } : r)),
    };
    expect(ids(enough)).not.toContain('plantao-hoje-farmaceutico');
  });
});
