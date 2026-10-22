import { premises as defaultPremises } from '../../config/premises.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import type { Principal } from '../auth/auth.types.js';
import type { StoreRecord, StoresRepository } from '../stores/stores.service.js';
import {
  calculateDetailedImpact,
  type CalcPremises,
  type DetailedResult,
  type Mitigations,
  type RegimeKind,
} from './impact.calculator.js';
import type { PremiseOverrides } from './simulations.schemas.js';

const NOT_FOUND = 'Simulação não encontrada';
const NAME_TAKEN = 'Já existe uma simulação com esse nome';

export type CalcInput = {
  storeIds?: string[];
  taxRegime?: RegimeKind;
  premiseOverrides?: PremiseOverrides;
  mitigations?: Mitigations;
};

export type StoreSnapshot = Pick<
  StoreRecord,
  'id' | 'name' | 'city' | 'profile' | 'openingHours' | 'roles'
>;

// Foto das premissas: o que foi usado no cálculo, com a versão do padrão da Farmarcas na época.
export type PremisesSnapshot = {
  taxRegime: RegimeKind;
  calc: CalcPremises;
  version: string;
};

export type SimulationRecord = {
  id: string;
  name: string;
  premises: PremisesSnapshot;
  stores: StoreSnapshot[];
  mitigations: Mitigations;
  result: DetailedResult;
  createdAt: Date;
  updatedAt: Date;
};

export type SimulationsRepository = {
  create: (input: {
    groupId: string;
    createdBy: string;
    name: string;
    premises: PremisesSnapshot;
    stores: StoreSnapshot[];
    mitigations: Mitigations;
    result: DetailedResult;
  }) => Promise<SimulationRecord>;
  findById: (groupId: string, id: string) => Promise<SimulationRecord | null>;
  findByName: (groupId: string, name: string) => Promise<SimulationRecord | null>;
  findMany: (groupId: string, ids: string[]) => Promise<SimulationRecord[]>;
  list: (
    groupId: string,
    page: number,
    pageSize: number,
  ) => Promise<{ data: SimulationRecord[]; total: number }>;
  rename: (groupId: string, id: string, name: string) => Promise<SimulationRecord>;
  softDelete: (groupId: string, id: string) => Promise<void>;
};

export const mergePremises = (overrides: PremiseOverrides = {}): CalcPremises => ({
  taxation: {
    monthsPerYear: overrides.taxation?.monthsPerYear ?? defaultPremises.taxation.monthsPerYear,
    chargesRealPresumido:
      overrides.taxation?.chargesRealPresumido ?? defaultPremises.taxation.chargesRealPresumido,
    chargesSimples: overrides.taxation?.chargesSimples ?? defaultPremises.taxation.chargesSimples,
    irpjCsllRate: overrides.taxation?.irpjCsllRate ?? defaultPremises.taxation.irpjCsllRate,
  },
  detailed: {
    targetWeeklyHours: defaultPremises.detailed.targetWeeklyHours,
    absenceRate: overrides.detailed?.absenceRate ?? defaultPremises.detailed.absenceRate,
  },
});

const snapshotOf = (store: StoreRecord): StoreSnapshot => ({
  id: store.id,
  name: store.name,
  city: store.city,
  profile: store.profile,
  openingHours: store.openingHours,
  roles: store.roles,
});

const onlyStores = (mitigations: Mitigations, stores: { id: string }[]): Mitigations => {
  const ids = new Set(stores.map((store) => store.id));
  return Object.fromEntries(Object.entries(mitigations).filter(([id]) => ids.has(id)));
};

const summary = (record: SimulationRecord) => ({
  id: record.id,
  name: record.name,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  taxRegime: record.premises.taxRegime,
  storeCount: record.stores.length,
  totals: record.result.totals,
  warnings: record.result.warnings,
});

const detail = (record: SimulationRecord) => ({
  id: record.id,
  name: record.name,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  taxRegime: record.premises.taxRegime,
  premises: record.premises.calc,
  premisesVersion: record.premises.version,
  stores: record.stores,
  mitigations: record.mitigations,
  result: record.result,
});

export const makeSimulationsService = (
  stores: StoresRepository,
  simulations: SimulationsRepository,
) => {
  const calculate = async (principal: Principal, input: CalcInput) => {
    const records = await stores.listAll(principal.groupId, input.storeIds);
    const taxRegime = input.taxRegime ?? principal.group.taxRegime;
    const calc = mergePremises(input.premiseOverrides);
    const mitigations = onlyStores(input.mitigations ?? {}, records);
    const result = calculateDetailedImpact({
      regime: taxRegime,
      premises: calc,
      mitigations,
      stores: records,
    });
    return {
      records,
      taxRegime,
      calc,
      mitigations,
      result,
      premises: { taxRegime, calc, version: defaultPremises.version } satisfies PremisesSnapshot,
    };
  };

  const assertNameFree = async (groupId: string, name: string) => {
    if (await simulations.findByName(groupId, name)) {
      throw new ConflictError(NAME_TAKEN, 'SIMULATION_NAME_EXISTS');
    }
  };

  const getRecord = async (groupId: string, id: string) => {
    const record = await simulations.findById(groupId, id);
    if (!record) throw new NotFoundError(NOT_FOUND, 'SIMULATION_NOT_FOUND');
    return record;
  };

  return {
    // Não salva nada: serve para recalcular na tela enquanto a pessoa ajusta ações e premissas.
    async preview(principal: Principal, input: CalcInput) {
      const { result, taxRegime, calc } = await calculate(principal, input);
      return { result, taxRegime, premises: calc };
    },

    async create(principal: Principal, input: CalcInput & { name: string }) {
      await assertNameFree(principal.groupId, input.name);
      const computed = await calculate(principal, input);
      const record = await simulations.create({
        groupId: principal.groupId,
        createdBy: principal.user.id,
        name: input.name,
        premises: computed.premises,
        stores: computed.records.map(snapshotOf),
        mitigations: computed.mitigations,
        result: computed.result,
      });
      return detail(record);
    },

    async list(groupId: string, page: number, pageSize: number) {
      const { data, total } = await simulations.list(groupId, page, pageSize);
      return { data: data.map(summary), meta: { page, pageSize, total } };
    },

    async get(groupId: string, id: string) {
      return detail(await getRecord(groupId, id));
    },

    async rename(groupId: string, id: string, name: string) {
      const current = await getRecord(groupId, id);
      if (current.name.toLowerCase() !== name.toLowerCase()) await assertNameFree(groupId, name);
      return detail(await simulations.rename(groupId, id, name));
    },

    async duplicate(principal: Principal, id: string, name: string) {
      const source = await getRecord(principal.groupId, id);
      await assertNameFree(principal.groupId, name);
      const copy = await simulations.create({
        groupId: principal.groupId,
        createdBy: principal.user.id,
        name,
        premises: source.premises,
        stores: source.stores,
        mitigations: source.mitigations,
        result: source.result,
      });
      return detail(copy);
    },

    // Nova simulação com as lojas como estão hoje; mantém as premissas, o regime e as ações da original.
    async recalculate(principal: Principal, id: string, name: string) {
      const source = await getRecord(principal.groupId, id);
      await assertNameFree(principal.groupId, name);

      const current = await stores.listAll(
        principal.groupId,
        source.stores.map((store) => store.id),
      );
      if (current.length === 0) {
        throw new ValidationError('Nenhuma loja desta simulação existe mais para recalcular');
      }

      const mitigations = onlyStores(source.mitigations, current);
      const result = calculateDetailedImpact({
        regime: source.premises.taxRegime,
        premises: source.premises.calc,
        mitigations,
        stores: current,
      });
      const copy = await simulations.create({
        groupId: principal.groupId,
        createdBy: principal.user.id,
        name,
        premises: source.premises,
        stores: current.map(snapshotOf),
        mitigations,
        result,
      });
      return detail(copy);
    },

    async remove(groupId: string, id: string) {
      await getRecord(groupId, id);
      await simulations.softDelete(groupId, id);
    },

    async compare(groupId: string, ids: string[]) {
      const found = await simulations.findMany(groupId, ids);
      const byId = new Map(found.map((record) => [record.id, record]));
      const items = ids.map((id) => {
        const record = byId.get(id);
        if (!record) throw new NotFoundError(NOT_FOUND, 'SIMULATION_NOT_FOUND');
        return summary(record);
      });
      return { items };
    },
  };
};

export type SimulationsService = ReturnType<typeof makeSimulationsService>;
