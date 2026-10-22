import {
  buildWeekHours,
  roleWindows,
  shiftModelFor,
  shiftsPerPost,
  type StoreHoursInput,
} from './engine/coverage.js';
import { SCENARIOS } from './engine/rules.js';
import { formatHM, windowLength } from './engine/time.js';
import type { Diagnostic } from './scales.diagnostic.js';
import type { ScaleStoreInput } from './scales.schemas.js';

// Alertas e ajustes: o que merece atenção do dono, em linguagem simples. Função pura.

export type Alert = {
  id: string;
  severity: 'danger' | 'warning' | 'info';
  message: string;
};

const ROLE_NAMES: Record<string, string> = {
  farmaceutico: 'Farmacêutico',
  gerente: 'Gerente',
  subgerente: 'Subgerente',
  balconista: 'Balconista',
  caixa: 'Caixa',
  perfumista: 'Perfumista',
  servicos_gerais: 'Serviços gerais',
  entregador: 'Entregador',
  comprador: 'Comprador',
  conferente: 'Conferente',
  atendente_digital: 'Atendente digital',
  expedicao: 'Expedição',
};

const DAY_NAMES = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const MAX_SHORTEN_MINUTES = 60;

const hours = (minutes: number) => {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1).replace('.', ',')}h`;
};

export function buildAlerts(store: ScaleStoreInput, diagnostic: Diagnostic): Alert[] {
  const alerts: Alert[] = [];
  const pharmacist = diagnostic.rows.find((r) => r.key === 'farmaceutico');
  if (pharmacist && (pharmacist.gap6x1 > 0 || pharmacist.hire['5x2_42'] > 0)) {
    alerts.push({
      id: 'farmaceutico-horario',
      severity: 'danger',
      message:
        'Sem farmacêutico em todo o horário de funcionamento a loja fica irregular perante o CRF (Lei 13.021/2014). Esta é a contratação prioritária.',
    });
  }

  const { plantao } = store;
  if (plantao.type !== 'none') {
    alerts.push(
      plantao.cover === 'team'
        ? {
            id: 'plantao-equipe',
            severity: 'info',
            message:
              'O plantão está coberto pela própria equipe, com folga no dia seguinte. Se preferir não aumentar o quadro por causa do plantão, simule a opção "Plantonista intermitente" no passo do plantão.',
          }
        : {
            id: 'plantao-intermitente',
            severity: 'info',
            message:
              'O plantão está coberto por plantonista intermitente: o contrato paga só as horas convocadas e precisa ser formalizado (CLT art. 452-A).',
          },
    );
  }

  // Faixas que passam do último turno por poucos minutos.
  const week = buildWeekHours(store.hours as StoreHoursInput);
  const model = (role: ScaleStoreInput['roles'][number]) =>
    shiftModelFor(SCENARIOS['5x2_42'], role, store.rules.lunchMinutes);
  for (const role of store.roles) {
    if (!role.enabled || role.coverage.mode !== 'band' || role.minInHall < 1) continue;
    const windows = roleWindows(role, week);
    let longest = -1;
    windows.forEach((w, d) => {
      if (windowLength(w) > (windowLength(windows[longest] ?? null) || 0)) longest = d;
    });
    const w = windows[longest];
    if (!w) continue;
    const len = windowLength(w);
    const m = model(role);
    const shifts = shiftsPerPost(len, m);
    for (let cut = 15; cut <= MAX_SHORTEN_MINUTES; cut += 3) {
      if (shiftsPerPost(len - cut, m) < shifts) {
        alerts.push({
          id: `faixa-${role.role}`,
          severity: 'info',
          message: `${ROLE_NAMES[role.role]}: a cobertura de ${hours(len)} em ${DAY_NAMES[longest]} ultrapassa ${shifts - 1} turno(s) em ${cut} min. Encurtar essa faixa em ${cut} min (ex.: até ${formatHM(w.end - cut)}) reduz um turno por dia.`,
        });
        break;
      }
    }
  }

  for (const role of store.roles) {
    if (role.enabled && role.scaleType === 'doze_x_trinta_e_seis') {
      alerts.push({
        id: `doze-${role.role}`,
        severity: 'warning',
        message: `${ROLE_NAMES[role.role]} em 12x36: esse regime só vale com convenção ou acordo coletivo (EC 141/2026; CLT art. 59-A). Confirme antes de adotar.`,
      });
    }
  }

  if (diagnostic.sales) {
    const share = diagnostic.sales.scenarios['5x2_42'].payrollShare;
    if (share > store.sales.payrollTargetRate) {
      alerts.push({
        id: 'meta-folha',
        severity: 'warning',
        message:
          'Na 5x2 · 42h a folha fica acima da meta de participação nas vendas. Veja a venda necessária no Diagnóstico.',
      });
    }
  }

  if (store.rules.cct.trim() === '') {
    alerts.push({
      id: 'cct',
      severity: 'info',
      message:
        'Cadastre a convenção coletiva da loja. Convenções podem exigir folga dominical mais frequente, adicional por domingo trabalhado ou piso acima do informado.',
    });
  }
  return alerts;
}
