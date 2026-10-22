import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { SimulationRecord, SimulationsRepository } from './simulations.service.js';

type DbSimulation = Prisma.SimulationGetPayload<object>;

const toRecord = (row: DbSimulation): SimulationRecord => ({
  id: row.id,
  name: row.name,
  premises: row.premises as unknown as SimulationRecord['premises'],
  stores: row.input as unknown as SimulationRecord['stores'],
  mitigations: row.mitigations as unknown as SimulationRecord['mitigations'],
  result: row.result as unknown as SimulationRecord['result'],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const json = (value: unknown) => value as Prisma.InputJsonValue;
const scoped = (groupId: string) => ({ groupId, deletedAt: null }) as const;

export const simulationsRepository: SimulationsRepository = {
  async create(input) {
    const row = await prisma.simulation.create({
      data: {
        groupId: input.groupId,
        createdBy: input.createdBy,
        name: input.name,
        premises: json(input.premises),
        input: json(input.stores),
        mitigations: json(input.mitigations),
        result: json(input.result),
      },
    });
    return toRecord(row);
  },

  async findById(groupId, id) {
    const row = await prisma.simulation.findFirst({ where: { id, ...scoped(groupId) } });
    return row ? toRecord(row) : null;
  },

  async findByName(groupId, name) {
    const row = await prisma.simulation.findFirst({
      where: { ...scoped(groupId), name: { equals: name, mode: 'insensitive' } },
    });
    return row ? toRecord(row) : null;
  },

  async findMany(groupId, ids) {
    const rows = await prisma.simulation.findMany({
      where: { ...scoped(groupId), id: { in: ids } },
    });
    return rows.map(toRecord);
  },

  async list(groupId, page, pageSize) {
    const [rows, total] = await prisma.$transaction([
      prisma.simulation.findMany({
        where: scoped(groupId),
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.simulation.count({ where: scoped(groupId) }),
    ]);
    return { data: rows.map(toRecord), total };
  },

  async rename(groupId, id, name) {
    await prisma.simulation.updateMany({ where: { id, ...scoped(groupId) }, data: { name } });
    const row = await prisma.simulation.findFirstOrThrow({ where: { id, ...scoped(groupId) } });
    return toRecord(row);
  },

  // Exclusão lógica (database/DATABASE.md).
  async softDelete(groupId, id) {
    await prisma.simulation.updateMany({
      where: { id, ...scoped(groupId) },
      data: { deletedAt: new Date() },
    });
  },
};
