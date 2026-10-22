import { buildWeekHours, type StoreHoursInput } from './engine/coverage.js';
import { rosterWithMinimumPeople, type Roster, type RosterCell } from './engine/roster.js';
import { SCENARIOS, SCHEDULE, type ScenarioId } from './engine/rules.js';
import { requiredPeople } from './engine/staffing.js';
import { addDays, formatHM } from './engine/time.js';
import { GROUPS } from './scales.diagnostic.js';
import type { ScaleRoleInput, ScaleStoreInput } from './scales.schemas.js';

// Escala de 4 semanas por cenário, pronta para a tela e para o relatório.

const ROLE_LABELS: Record<ScaleRoleInput['role'], string> = {
  farmaceutico: 'Farmacêutico(a)',
  gerente: 'Gerente',
  subgerente: 'Subgerente',
  balconista: 'Balconista',
  caixa: 'Caixa',
  perfumista: 'Perfumista',
  servicos_gerais: 'Serviços gerais',
  entregador: 'Entregador',
  comprador: 'Comprador(a)',
  conferente: 'Conferente',
  atendente_digital: 'Atendente digital',
  expedicao: 'Expedição',
};

export type ViewCell = {
  start: string;
  end: string;
  lunch: { start: string; end: string } | null;
  snack: { start: string; end: string } | null;
  kind: RosterCell['kind'];
  workMinutes: number;
};

export type ViewPerson = {
  id: string;
  label: string;
  tags: ('contratar' | 'reforco' | 'dono')[];
  // 28 posições (4 semanas × 7 dias); nulo = folga.
  days: (ViewCell | null)[];
  weekMinutes: number[];
};

export type ViewGroup = {
  key: string;
  label: string;
  covered: boolean;
  people: ViewPerson[];
};

export type RosterView = {
  scenario: ScenarioId;
  startDate: string;
  dates: string[];
  groups: ViewGroup[];
};

const hole = (h: { start: number; end: number } | null) =>
  h ? { start: formatHM(h.start), end: formatHM(h.end) } : null;

const toCell = (c: RosterCell | null): ViewCell | null =>
  c
    ? {
        start: formatHM(c.start),
        end: formatHM(c.end),
        lunch: hole(c.lunch),
        snack: hole(c.snack),
        kind: c.kind,
        workMinutes: c.workMinutes,
      }
    : null;

export function buildRosterView(store: ScaleStoreInput, scenario: ScenarioId): RosterView {
  const week = buildWeekHours(store.hours as StoreHoursInput);
  const options = { lunchMinutes: store.rules.lunchMinutes, sundayRule: store.rules.sundayRule };
  const groups: ViewGroup[] = [];

  for (const group of GROUPS) {
    const members = store.roles.filter((r) => r.enabled && group.roles.includes(r.role));
    if (members.length === 0) continue;
    const lead = members.find((r) => r.minInHall > 0) ?? members[0]!;
    const formula = requiredPeople(
      { ...lead, extraPostsPerWeek: 0 },
      week,
      SCENARIOS[scenario],
      options,
    );
    const start = formula.ok ? formula.people : 0;
    const today = members.reduce((n, r) => n + r.headcount, 0);
    const input = {
      role: lead,
      week,
      scenario: SCENARIOS[scenario],
      lunchMinutes: store.rules.lunchMinutes,
      snackMinutes: store.rules.snackMinutes,
      sundayRule: store.rules.sundayRule,
      hasOwner: lead.ownerIsPharmacist,
    };
    const minimal = rosterWithMinimumPeople(input, start);
    const need = minimal.count;
    // Quem já existe entra na escala; o que falta vira "Contratar"; o que sobra vira "Reforço".
    const total = Math.max(today, need);
    const roster: Roster = total === need ? minimal : rosterWithMinimumPeople(input, total);

    const names: string[] = [];
    for (const m of members) {
      for (let i = 1; i <= m.headcount; i += 1) {
        names.push(`${ROLE_LABELS[m.role]}${m.headcount > 1 || members.length > 1 ? ` ${i}` : ''}`);
      }
    }
    const people: ViewPerson[] = roster.people.map((p) => {
      const isHire = !p.isOwner && p.index >= today;
      const label = p.isOwner
        ? 'Dono (farmacêutico)'
        : (names[p.index] ?? `${ROLE_LABELS[lead.role]} ${p.index + 1}`);
      const tags: ViewPerson['tags'] = [];
      if (p.isOwner) tags.push('dono');
      if (isHire) tags.push('contratar');
      if (!p.isOwner && !isHire && today > need && p.index >= need) tags.push('reforco');
      const days = p.days.map(toCell);
      const weekMinutes = Array.from({ length: SCHEDULE.weeks }, (_, w) =>
        days.slice(w * 7, w * 7 + 7).reduce((n, c) => n + (c?.workMinutes ?? 0), 0),
      );
      return { id: `${group.key}-${p.index}`, label, tags, days, weekMinutes };
    });
    groups.push({ key: group.key, label: group.label, covered: roster.ok, people });
  }

  return {
    scenario,
    startDate: store.scaleStartDate,
    dates: Array.from({ length: SCHEDULE.weeks * 7 }, (_, i) => addDays(store.scaleStartDate, i)),
    groups,
  };
}
