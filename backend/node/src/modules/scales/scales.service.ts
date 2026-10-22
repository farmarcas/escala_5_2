import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { diagnose } from './scales.diagnostic.js';
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
      return diagnose(input);
    },

    async diagnostic(groupId: string, id: string) {
      return diagnose(await getById(groupId, id));
    },
  };
};

export type ScalesService = ReturnType<typeof makeScalesService>;
