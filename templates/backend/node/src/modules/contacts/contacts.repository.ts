import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import type { ContactRecord, ContactsRepository } from './contacts.service.js';

const isUniqueViolation = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'P2002';

export const contactsRepository: ContactsRepository = {
  async findByKey(key) {
    const row = await prisma.contactRequest.findUnique({
      where: { idempotencyKey: key },
      select: { id: true },
    });
    return row;
  },

  async create(input) {
    try {
      return await prisma.contactRequest.create({
        data: {
          source: input.source,
          mode: input.mode,
          name: input.name,
          roleTitle: input.roleTitle,
          company: input.company,
          phone: input.phone,
          email: input.email,
          sector: input.sector ?? null,
          privacyAcceptedAt: input.privacyAcceptedAt,
          profile: input.profile as Prisma.InputJsonObject,
          result: input.result as Prisma.InputJsonObject,
          idempotencyKey: input.idempotencyKey,
          utm: input.utm ?? null,
        },
        select: { id: true },
      });
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  async list(page, pageSize) {
    const [rows, total] = await prisma.$transaction([
      prisma.contactRequest.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.contactRequest.count(),
    ]);
    return { data: rows as ContactRecord[], total };
  },

  // LGPD: apaga os dados pessoais; perfil e resultado (números de negócio) ficam.
  async anonymize(id, at) {
    const result = await prisma.contactRequest.updateMany({
      where: { id },
      data: {
        name: 'Anonimizado',
        roleTitle: 'Anonimizado',
        company: 'Anonimizado',
        phone: 'Anonimizado',
        email: `anonimizado+${id}@anonimizado.invalid`,
        sector: null,
        utm: null,
        anonymizedAt: at,
      },
    });
    return result.count > 0;
  },
};
