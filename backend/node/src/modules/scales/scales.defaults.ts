import { DEFAULT_HOLIDAYS } from './engine/holidays.js';
import { DEFAULT_SALES } from './engine/sales.js';
import { DEFAULT_PLANTAO } from './engine/plantao.js';
import type { ScaleRoleInput, ScaleStoreInput } from './scales.schemas.js';

// Valores de partida de uma loja nova. A tela usa os mesmos (GET /scales/defaults).
const role = (r: Partial<ScaleRoleInput> & Pick<ScaleRoleInput, 'role'>): ScaleRoleInput => ({
  enabled: true,
  headcount: 1,
  monthlySalary: 0,
  scaleType: 'normal',
  minInHall: 1,
  coverage: { mode: 'all' },
  daysMask: 127,
  ownerIsPharmacist: false,
  motorcycle: false,
  ...r,
});

export function defaultStore(scaleStartDate: string): ScaleStoreInput {
  return {
    name: 'Loja de exemplo',
    city: 'Sua cidade',
    state: 'SP',
    scaleStartDate,
    taxRegime: 'simples',
    hours: {
      always24h: false,
      standard: { start: '07:00', end: '22:00', daysMask: 0b0111111 },
      overrides: { '6': { start: '08:00', end: '14:00' } },
    },
    rules: {
      sundayRule: 'um_em_tres',
      lunchMinutes: 60,
      snackMinutes: 15,
      provisions: true,
      indemnifyBreak: true,
      cct: '',
      rat: 0.02,
      thirdParty: 0.058,
      transport: { tripsPerDay: 2, fare: 4.5 },
      benefits: 350,
    },
    plantao: DEFAULT_PLANTAO,
    holidays: DEFAULT_HOLIDAYS,
    sales: DEFAULT_SALES,
    roles: [
      role({ role: 'farmaceutico', headcount: 2, monthlySalary: 5200 }),
      role({
        role: 'gerente',
        headcount: 1,
        monthlySalary: 3800,
        daysMask: 0b0111111,
      }),
      role({
        role: 'subgerente',
        headcount: 1,
        monthlySalary: 2900,
        daysMask: 0b0111111,
      }),
      role({ role: 'balconista', headcount: 5, monthlySalary: 1950, minInHall: 2 }),
      role({ role: 'caixa', headcount: 2, monthlySalary: 1850 }),
      role({
        role: 'perfumista',
        daysMask: 0b0111111,
        headcount: 1,
        monthlySalary: 1950,
        coverage: { mode: 'band', start: '09:00', end: '19:00' },
      }),
      role({
        role: 'servicos_gerais',
        daysMask: 0b0111111,
        headcount: 1,
        monthlySalary: 1700,
        coverage: { mode: 'band', start: '07:00', end: '17:00' },
      }),
      role({
        role: 'entregador',
        daysMask: 0b0111111,
        headcount: 1,
        monthlySalary: 1800,
        motorcycle: true,
        coverage: { mode: 'band', start: '08:00', end: '20:00' },
      }),
      ...(['comprador', 'conferente', 'atendente_digital', 'expedicao'] as const).map((r) =>
        role({ role: r, enabled: false, headcount: 0, monthlySalary: 1900 }),
      ),
    ],
  };
}
