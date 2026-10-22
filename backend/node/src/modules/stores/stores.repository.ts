import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { CreateStoreInput, UpdateStoreInput } from './stores.schemas.js';
import type { StoreRecord, StoresRepository } from './stores.service.js';

const include = { roles: { orderBy: { role: 'asc' } } } satisfies Prisma.StoreInclude;
type DbStore = Prisma.StoreGetPayload<{ include: typeof include }>;

// O enum do banco chama o perfil de 24 horas de `h24` (mapeado para "24h" no SQL); a API usa "24h".
const profileToDb = (profile: 'rua' | 'shopping' | '24h') => (profile === '24h' ? 'h24' : profile);
const profileFromDb = (profile: 'rua' | 'shopping' | 'h24') =>
  profile === 'h24' ? '24h' : profile;

const toRecord = (row: DbStore): StoreRecord => ({
  id: row.id,
  name: row.name,
  city: row.city,
  profile: profileFromDb(row.profile),
  size: row.size,
  openingHours: row.openingHours as StoreRecord['openingHours'],
  roles: row.roles.map((role) => ({
    role: role.role,
    minPerShift: role.minPerShift,
    headcount: role.headcount,
    weeklyHours: role.weeklyHours.toNumber(),
    monthlySalary: role.monthlySalary.toNumber(),
    absenceRate: role.absenceRate ? role.absenceRate.toNumber() : null,
  })),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const roleRows = (roles: CreateStoreInput['roles']) =>
  roles.map((role) => ({
    role: role.role,
    minPerShift: role.minPerShift ?? null,
    headcount: role.headcount,
    weeklyHours: role.weeklyHours,
    monthlySalary: role.monthlySalary,
    absenceRate: role.absenceRate ?? null,
  }));

const scoped = (groupId: string) => ({ groupId, deletedAt: null }) as const;

export const storesRepository: StoresRepository = {
  async list(groupId, page, pageSize) {
    const [rows, total] = await prisma.$transaction([
      prisma.store.findMany({
        where: scoped(groupId),
        include,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.store.count({ where: scoped(groupId) }),
    ]);
    return { data: rows.map(toRecord), total };
  },

  async listAll(groupId, ids) {
    const rows = await prisma.store.findMany({
      where: { ...scoped(groupId), ...(ids && { id: { in: ids } }) },
      include,
      orderBy: { name: 'asc' },
    });
    return rows.map(toRecord);
  },

  async findById(groupId, id) {
    const row = await prisma.store.findFirst({ where: { id, ...scoped(groupId) }, include });
    return row ? toRecord(row) : null;
  },

  async findByName(groupId, name) {
    const row = await prisma.store.findFirst({
      where: { ...scoped(groupId), name: { equals: name, mode: 'insensitive' } },
      include,
    });
    return row ? toRecord(row) : null;
  },

  async create(groupId, input) {
    const row = await prisma.store.create({
      data: {
        groupId,
        name: input.name,
        city: input.city,
        profile: profileToDb(input.profile),
        size: input.size,
        openingHours: input.openingHours,
        roles: { create: roleRows(input.roles) },
      },
      include,
    });
    return toRecord(row);
  },

  async update(groupId, id, input: UpdateStoreInput) {
    const row = await prisma.$transaction(async (tx) => {
      // updateMany com groupId garante que só se altera loja do próprio grupo.
      await tx.store.updateMany({
        where: { id, ...scoped(groupId) },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.city !== undefined && { city: input.city }),
          ...(input.profile !== undefined && { profile: profileToDb(input.profile) }),
          ...(input.size !== undefined && { size: input.size }),
          ...(input.openingHours !== undefined && { openingHours: input.openingHours }),
        },
      });
      if (input.roles) {
        await tx.storeRole.deleteMany({ where: { storeId: id, store: { groupId } } });
        await tx.storeRole.createMany({
          data: roleRows(input.roles).map((role) => ({ ...role, storeId: id })),
        });
      }
      return tx.store.findFirstOrThrow({ where: { id, ...scoped(groupId) }, include });
    });
    return toRecord(row);
  },

  // Exclusão lógica (database/DATABASE.md).
  async softDelete(groupId, id) {
    await prisma.store.updateMany({
      where: { id, ...scoped(groupId) },
      data: { deletedAt: new Date() },
    });
  },
};
