import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { ScaleRoleInput, ScaleStoreInput } from './scales.schemas.js';
import type { ScalesRepository, ScaleStoreRecord } from './scales.service.js';

const include = { roles: { orderBy: { role: 'asc' } } } satisfies Prisma.ScaleStoreInclude;
type DbStore = Prisma.ScaleStoreGetPayload<{ include: typeof include }>;

const CONFIG_VERSION = 1;
const scoped = (groupId: string) => ({ groupId, deletedAt: null }) as const;

const toRole = (row: DbStore['roles'][number]): ScaleRoleInput => ({
  role: row.role,
  enabled: row.enabled,
  headcount: row.headcount,
  monthlySalary: row.monthlySalary.toNumber(),
  scaleType: row.scaleType,
  minInHall: row.minInHall,
  coverage:
    row.coverageMode === 'band' && row.bandStart && row.bandEnd
      ? { mode: 'band', start: row.bandStart, end: row.bandEnd }
      : { mode: 'all' },
  daysMask: row.daysMask,
  ownerIsPharmacist: row.ownerIsPharmacist,
  motorcycle: row.motorcycle,
});

const toRecord = (row: DbStore): ScaleStoreRecord => {
  const config = row.config as { hours: ScaleStoreInput['hours']; rules: ScaleStoreInput['rules'] };
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    scaleStartDate: row.scaleStartDate.toISOString().slice(0, 10),
    taxRegime: row.taxRegime,
    hours: config.hours,
    rules: config.rules,
    roles: row.roles.map(toRole),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const roleRows = (roles: ScaleRoleInput[]) =>
  roles.map((r) => ({
    role: r.role,
    enabled: r.enabled,
    headcount: r.headcount,
    monthlySalary: r.monthlySalary,
    scaleType: r.scaleType,
    minInHall: r.minInHall,
    coverageMode: r.coverage.mode,
    bandStart: r.coverage.mode === 'band' ? r.coverage.start : null,
    bandEnd: r.coverage.mode === 'band' ? r.coverage.end : null,
    daysMask: r.daysMask,
    ownerIsPharmacist: r.ownerIsPharmacist,
    motorcycle: r.motorcycle,
  }));

const columns = (input: ScaleStoreInput) => ({
  name: input.name,
  city: input.city,
  state: input.state,
  scaleStartDate: new Date(`${input.scaleStartDate}T00:00:00.000Z`),
  taxRegime: input.taxRegime,
  config: { version: CONFIG_VERSION, hours: input.hours, rules: input.rules },
});

export const scalesRepository: ScalesRepository = {
  async list(groupId) {
    const rows = await prisma.scaleStore.findMany({
      where: scoped(groupId),
      include,
      orderBy: { name: 'asc' },
    });
    return rows.map(toRecord);
  },

  async findById(groupId, id) {
    const row = await prisma.scaleStore.findFirst({ where: { id, ...scoped(groupId) }, include });
    return row ? toRecord(row) : null;
  },

  async findByName(groupId, name) {
    const row = await prisma.scaleStore.findFirst({
      where: { ...scoped(groupId), name: { equals: name, mode: 'insensitive' } },
      include,
    });
    return row ? toRecord(row) : null;
  },

  async create(groupId, input) {
    const row = await prisma.scaleStore.create({
      data: { groupId, ...columns(input), roles: { create: roleRows(input.roles) } },
      include,
    });
    return toRecord(row);
  },

  async update(groupId, id, input) {
    const row = await prisma.$transaction(async (tx) => {
      // updateMany com groupId garante que só se altera loja do próprio grupo.
      await tx.scaleStore.updateMany({ where: { id, ...scoped(groupId) }, data: columns(input) });
      await tx.scaleStoreRole.deleteMany({ where: { storeId: id, store: { groupId } } });
      await tx.scaleStoreRole.createMany({
        data: roleRows(input.roles).map((r) => ({ ...r, storeId: id })),
      });
      return tx.scaleStore.findFirstOrThrow({ where: { id, ...scoped(groupId) }, include });
    });
    return toRecord(row);
  },

  // Exclusão lógica (database/DATABASE.md).
  async softDelete(groupId, id) {
    await prisma.scaleStore.updateMany({
      where: { id, ...scoped(groupId) },
      data: { deletedAt: new Date() },
    });
  },
};
