import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import type { CreateStoreInput, UpdateStoreInput } from './stores.schemas.js';

const STORE_NOT_FOUND = 'Loja não encontrada';
const NAME_TAKEN = 'Já existe uma loja com esse nome no seu grupo';

export type StoreRoleRecord = {
  role: 'farmaceutico' | 'balconista' | 'caixa' | 'estoquista';
  minPerShift: number | null;
  headcount: number;
  weeklyHours: number;
  monthlySalary: number;
  absenceRate: number | null;
};

export type StoreRecord = {
  id: string;
  name: string;
  city: string;
  profile: 'rua' | 'shopping' | '24h';
  size: 'pequena' | 'media' | 'grande' | null;
  openingHours: { weekday: number; opensAt: string; closesAt: string }[];
  roles: StoreRoleRecord[];
  createdAt: Date;
  updatedAt: Date;
};

// Todo método recebe o groupId: loja de outro grupo nunca é encontrada.
export type StoresRepository = {
  list: (
    groupId: string,
    page: number,
    pageSize: number,
  ) => Promise<{ data: StoreRecord[]; total: number }>;
  listAll: (groupId: string, ids?: string[]) => Promise<StoreRecord[]>;
  findById: (groupId: string, id: string) => Promise<StoreRecord | null>;
  findByName: (groupId: string, name: string) => Promise<StoreRecord | null>;
  create: (groupId: string, input: CreateStoreInput) => Promise<StoreRecord>;
  update: (groupId: string, id: string, input: UpdateStoreInput) => Promise<StoreRecord>;
  softDelete: (groupId: string, id: string) => Promise<void>;
};

export const makeStoresService = (repo: StoresRepository) => {
  const assertNameFree = async (groupId: string, name: string, exceptId?: string) => {
    const existing = await repo.findByName(groupId, name);
    if (existing && existing.id !== exceptId)
      throw new ConflictError(NAME_TAKEN, 'STORE_NAME_EXISTS');
  };

  return {
    async list(groupId: string, page: number, pageSize: number) {
      const { data, total } = await repo.list(groupId, page, pageSize);
      return { data, meta: { page, pageSize, total } };
    },

    async getById(groupId: string, id: string) {
      const store = await repo.findById(groupId, id);
      if (!store) throw new NotFoundError(STORE_NOT_FOUND, 'STORE_NOT_FOUND');
      return store;
    },

    async create(groupId: string, input: CreateStoreInput) {
      await assertNameFree(groupId, input.name);
      return repo.create(groupId, input);
    },

    async update(groupId: string, id: string, input: UpdateStoreInput) {
      await this.getById(groupId, id);
      if (input.name) await assertNameFree(groupId, input.name, id);
      return repo.update(groupId, id, input);
    },

    async remove(groupId: string, id: string) {
      await this.getById(groupId, id);
      await repo.softDelete(groupId, id);
    },
  };
};

export type StoresService = ReturnType<typeof makeStoresService>;
