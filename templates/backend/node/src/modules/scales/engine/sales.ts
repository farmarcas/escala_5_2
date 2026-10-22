// Vendas, CMV e meta da folha (opcional). Tudo em valores mensais.
// CMV = custo da mercadoria vendida, informado como % das vendas.

export type SalesSettings = {
  enabled: boolean;
  monthlySales: number;
  // CMV em fração das vendas (0,7 = 70%).
  cmvRate: number;
  // Meta de participação da folha nas vendas (0,12 = 12%).
  payrollTargetRate: number;
};

export const DEFAULT_SALES: SalesSettings = {
  enabled: false,
  monthlySales: 0,
  cmvRate: 0.7,
  payrollTargetRate: 0.12,
};

export type SalesAnalysis = {
  monthlySales: number;
  cmv: number;
  payroll: number;
  // Folha como fração das vendas atuais.
  payrollShare: number;
  // Sobra das vendas depois de pagar mercadoria e folha (antes de aluguel, impostos e demais despesas).
  margin: number;
  // Venda mensal em que a margem fecha em zero: mercadoria e folha pagas.
  breakEvenSales: number;
  // Venda mensal para a folha caber na meta.
  targetSales: number;
  // Quanto as vendas precisam crescer para atingir a meta (zero quando já atinge).
  growthToTarget: number;
};

export function analyzeSales(settings: SalesSettings, payroll: number): SalesAnalysis | null {
  if (!settings.enabled || settings.monthlySales <= 0) return null;
  const { monthlySales, cmvRate, payrollTargetRate } = settings;
  const margin = monthlySales * (1 - cmvRate) - payroll;
  const grossMargin = 1 - cmvRate;
  const breakEvenSales = grossMargin > 0 ? payroll / grossMargin : Number.POSITIVE_INFINITY;
  const targetSales =
    payrollTargetRate > 0 ? payroll / payrollTargetRate : Number.POSITIVE_INFINITY;
  return {
    monthlySales,
    cmv: monthlySales * cmvRate,
    payroll,
    payrollShare: payroll / monthlySales,
    margin,
    breakEvenSales,
    targetSales,
    growthToTarget: Math.max(0, targetSales / monthlySales - 1),
  };
}
