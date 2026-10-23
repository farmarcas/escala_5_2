import { prisma } from '../../shared/database/prisma.js';
import type { AuthRepository, GroupRecord, UserRecord } from './auth.types.js';

type DbUser = {
  id: string;
  name: string;
  email: string;
  groupId: string | null;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
};

type DbGroup = {
  id: string;
  name: string;
  taxRegime: 'real' | 'presumido' | 'simples';
  annualRevenue: { toNumber: () => number } | null;
};

const toUser = (row: DbUser): UserRecord | null =>
  row.groupId && row.passwordHash
    ? {
        id: row.id,
        name: row.name,
        email: row.email,
        groupId: row.groupId,
        passwordHash: row.passwordHash,
        emailVerifiedAt: row.emailVerifiedAt,
      }
    : null;

export const toGroup = (row: DbGroup): GroupRecord => ({
  id: row.id,
  name: row.name,
  taxRegime: row.taxRegime,
  annualRevenue: row.annualRevenue ? row.annualRevenue.toNumber() : null,
});

const isUniqueViolation = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'P2002';

const activeUser = { deletedAt: null } as const;

export const authRepository: AuthRepository = {
  async findUserByEmail(email) {
    const row = await prisma.user.findFirst({ where: { email, ...activeUser } });
    return row ? toUser(row) : null;
  },

  async createGroupWithUser(input) {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const group = await tx.group.create({ data: { name: input.groupName } });
        return tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash: input.passwordHash,
            privacyAcceptedAt: input.privacyAcceptedAt,
            groupId: group.id,
          },
        });
      });
      return toUser(row);
    } catch (error) {
      // Dois cadastros ao mesmo tempo com o mesmo e-mail: o segundo vira "já existe".
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  },

  async createEmailToken({ userId, kind, tokenHash, expiresAt }) {
    await prisma.$transaction([
      prisma.emailToken.updateMany({
        where: { userId, kind, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.emailToken.create({ data: { userId, kind, tokenHash, expiresAt } }),
    ]);
  },

  async consumeEmailToken(kind, tokenHash, now) {
    const claimed = await prisma.emailToken.updateMany({
      where: { kind, tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return null;
    const row = await prisma.emailToken.findUnique({ where: { tokenHash } });
    return row ? { userId: row.userId } : null;
  },

  async markEmailVerified(userId, at) {
    await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: at } });
  },

  async updatePassword(userId, passwordHash) {
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  async createSession({ userId, tokenHash, expiresAt }) {
    await prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  },

  async findSessionByTokenHash(tokenHash) {
    const row = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: { include: { group: true } } },
    });
    if (!row || row.user.deletedAt || !row.user.group || row.user.group.deletedAt) return null;
    const user = toUser(row.user);
    if (!user) return null;
    return {
      id: row.id,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      user,
      group: toGroup(row.user.group),
    };
  },

  async extendSession(id, expiresAt) {
    await prisma.session.update({ where: { id }, data: { expiresAt } });
  },

  async revokeSession(tokenHash, at) {
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: at },
    });
  },

  async revokeAllSessions(userId, at) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: at },
    });
  },

  async updateGroup(groupId, patch) {
    const row = await prisma.group.update({ where: { id: groupId }, data: patch });
    return toGroup(row);
  },

  // Exclusão a pedido do titular (LGPD): apaga de verdade o grupo e, em cascata, contas, lojas e sessões.
  async deleteGroupCascade(groupId) {
    await prisma.group.delete({ where: { id: groupId } });
  },
};
