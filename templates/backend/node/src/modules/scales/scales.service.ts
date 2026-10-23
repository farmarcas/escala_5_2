import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { diagnose, type DiagnosticOverrides } from './scales.diagnostic.js';
import { buildWeekHours, type StoreHoursInput } from './engine/coverage.js';
import { windowLength } from './engine/time.js';
import { buildReport } from './scales.report.js';
import { buildAlerts } from './scales.alerts.js';
import { buildRosterView } from './scales.roster.js';
import type { ScenarioId } from './engine/rules.js';
import type { ScaleStoreInput } from './scales.schemas.js';

const NOT_FOUND = 'Loja não encontrada';
const NAME_TAKEN = 'Já existe uma loja com esse nome no seu grupo';

export type ScaleStoreRecord = ScaleStoreInput & { id: string; createdAt: Date; updatedAt: Date };

// Todo método recebe o groupId: loja de outro grupo nunca é encontrada.
export type ScalesRepository = {
  list: (groupId: string) => Promise<ScaleStoreRecord[]>;
  findById: (groupId: string, id: string) => Promise<ScaleStoreRecord | null>;
  findByName: (groupId: string, name: string) => Promise<ScaleStoreRecord | null>;
  create: (groupId: string, input: ScaleStoreInput) => Promise<ScaleStoreRecord>;
  update: (groupId: string, id: string, input: ScaleStoreInput) => Promise<ScaleStoreRecord>;
  softDelete: (groupId: string, id: string) => Promise<void>;
};

// Dias de funcionamento da semana (segunda a domingo) e horas abertas por semana, para o card da loja.
// "reduced" marca o dia com horário menor que o maior dia da semana (por exemplo, o domingo).
export function openingSummary(store: ScaleStoreInput) {
  const week = buildWeekHours(store.hours as StoreHoursInput);
  const lengths = week.map((w) => windowLength(w));
  const longest = Math.max(...lengths);
  return {
    weeklyHours: Math.round((lengths.reduce((n, l) => n + l, 0) / 60) * 10) / 10,
    days: lengths.map((l) => (l === 0 ? 'closed' : l < longest ? 'reduced' : 'open')) as (
      'open' | 'reduced' | 'closed'
    )[],
  };
}

export const makeScalesService = (repo: ScalesRepository) => {
  const assertNameFree = async (groupId: string, name: string, exceptId?: string) => {
    const existing = await repo.findByName(groupId, name);
    if (existing && existing.id !== exceptId)
      throw new ConflictError(NAME_TAKEN, 'STORE_NAME_EXISTS');
  };

  const getById = async (groupId: string, id: string) => {
    const store = await repo.findById(groupId, id);
    if (!store) throw new NotFoundError(NOT_FOUND, 'STORE_NOT_FOUND');
    return store;
  };

  return {
    async list(groupId: string) {
      const stores = await repo.list(groupId);
      return stores.map((s) => ({
        id: s.id,
        name: s.name,
        city: s.city,
        state: s.state,
        people: s.roles.filter((r) => r.enabled).reduce((n, r) => n + r.headcount, 0),
        ...openingSummary(s),
        updatedAt: s.updatedAt,
      }));
    },

    getById,

    async create(groupId: string, input: ScaleStoreInput) {
      await assertNameFree(groupId, input.name);
      return repo.create(groupId, input);
    },

    async update(groupId: string, id: string, input: ScaleStoreInput) {
      await getById(groupId, id);
      await assertNameFree(groupId, input.name, id);
      return repo.update(groupId, id, input);
    },

    async remove(groupId: string, id: string) {
      await getById(groupId, id);
      await repo.softDelete(groupId, id);
    },

    // "Nome (cópia)", "Nome (cópia 2)"… até achar um nome livre.
    async duplicate(groupId: string, id: string) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...source } = await getById(groupId, id);
      for (let n = 1; n < 100; n += 1) {
        const name = `${source.name} (cópia${n > 1 ? ` ${n}` : ''})`.slice(0, 100);
        if (!(await repo.findByName(groupId, name)))
          return repo.create(groupId, { ...source, name });
      }
      throw new ConflictError(NAME_TAKEN, 'STORE_NAME_EXISTS');
    },

    preview(input: ScaleStoreInput) {
      const diagnostic = diagnose(input);
      return { diagnostic, alerts: buildAlerts(input, diagnostic) };
    },

    async roster(groupId: string, id: string, scenario: ScenarioId) {
      return buildRosterView(await getById(groupId, id), scenario);
    },

    async diagnostic(groupId: string, id: string, overrides: DiagnosticOverrides = {}) {
      const store = await getById(groupId, id);
      const diagnostic = diagnose(store, overrides);
      return { diagnostic, alerts: buildAlerts(store, diagnostic) };
    },

    async report(groupId: string, id: string) {
      const store = await getById(groupId, id);
      return { name: store.name, buffer: await buildReport(store) };
    },
  };
};

export type ScalesService = ReturnType<typeof makeScalesService>;
