import { describe, expect, it } from 'vitest';
import { analyzeSales, DEFAULT_SALES } from './sales.js';

const on = {
  ...DEFAULT_SALES,
  enabled: true,
  monthlySales: 1_000_000,
  cmvRate: 0.7,
  payrollTargetRate: 0.12,
};

describe('sales', () => {
  it('desligado ou sem vendas informadas não gera análise', () => {
    expect(analyzeSales(DEFAULT_SALES, 100_000)).toBeNull();
    expect(analyzeSales({ ...on, monthlySales: 0 }, 100_000)).toBeNull();
  });

  it('folha de R$ 100 mil sobre R$ 1 milhão: 10% das vendas e margem de R$ 200 mil', () => {
    const a = analyzeSales(on, 100_000)!;
    expect(a.payrollShare).toBeCloseTo(0.1, 8);
    expect(a.cmv).toBe(700_000);
    expect(a.margin).toBeCloseTo(200_000, 6);
    expect(a.growthToTarget).toBe(0);
  });

  it('venda necessária para pagar mercadoria e folha: folha ÷ (1 − CMV)', () => {
    const a = analyzeSales(on, 150_000)!;
    expect(a.breakEvenSales).toBeCloseTo(500_000, 6);
    expect(a.margin).toBeCloseTo(150_000, 6);
  });

  it('venda necessária para a meta e quanto precisa crescer', () => {
    const a = analyzeSales(on, 240_000)!;
    expect(a.targetSales).toBeCloseTo(2_000_000, 6);
    expect(a.growthToTarget).toBeCloseTo(1, 8);
  });

  it('CMV de 100% ou meta zero não tem venda que pague: infinito', () => {
    expect(analyzeSales({ ...on, cmvRate: 1 }, 1)!.breakEvenSales).toBe(Number.POSITIVE_INFINITY);
    expect(analyzeSales({ ...on, payrollTargetRate: 0 }, 1)!.targetSales).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
