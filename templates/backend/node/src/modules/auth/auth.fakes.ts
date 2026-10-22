import { randomUUID } from 'node:crypto';
import type {
  AuthRepository,
  EmailTokenKindValue,
  GroupRecord,
  Mailer,
  PasswordHasher,
  SessionRecord,
  UserRecord,
} from './auth.types.js';

// Dublês em memória para testar o service sem banco nem e-mail.
export const makeFakePasswords = (): PasswordHasher => ({
  hash: async (password) => `hash:${password}`,
  verify: async (password, stored) => stored === `hash:${password}`,
});

export const makeFakeMailer = () => {
  const sent: { to: string; subject: string; text: string }[] = [];
  const mailer: Mailer = {
    send: async (message) => {
      sent.push(message);
    },
  };
  return { mailer, sent };
};

type TokenRow = {
  userId: string;
  kind: EmailTokenKindValue;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

type SessionRow = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export const makeFakeAuthRepository = () => {
  const users: UserRecord[] = [];
  const groups: GroupRecord[] = [];
  const tokens: TokenRow[] = [];
  const sessions: SessionRow[] = [];
  const deletedGroups: string[] = [];

  const repo: AuthRepository = {
    findUserByEmail: async (email) => users.find((user) => user.email === email) ?? null,
    createGroupWithUser: async (input) => {
      const group: GroupRecord = {
        id: randomUUID(),
        name: input.groupName,
        taxRegime: 'real',
        annualRevenue: null,
      };
      const user: UserRecord = {
        id: randomUUID(),
        name: input.name,
        email: input.email,
        groupId: group.id,
        passwordHash: input.passwordHash,
        emailVerifiedAt: null,
      };
      groups.push(group);
      users.push(user);
      return user;
    },
    createEmailToken: async (input) => {
      for (const token of tokens) {
        if (token.userId === input.userId && token.kind === input.kind && !token.usedAt) {
          token.usedAt = new Date(0);
        }
      }
      tokens.push({ ...input, usedAt: null });
    },
    consumeEmailToken: async (kind, tokenHash, now) => {
      const token = tokens.find(
        (row) =>
          row.kind === kind && row.tokenHash === tokenHash && !row.usedAt && row.expiresAt > now,
      );
      if (!token) return null;
      token.usedAt = now;
      return { userId: token.userId };
    },
    markEmailVerified: async (userId, at) => {
      const user = users.find((row) => row.id === userId);
      if (user) user.emailVerifiedAt = at;
    },
    updatePassword: async (userId, passwordHash) => {
      const user = users.find((row) => row.id === userId);
      if (user) user.passwordHash = passwordHash;
    },
    createSession: async (input) => {
      sessions.push({ id: randomUUID(), revokedAt: null, ...input });
    },
    findSessionByTokenHash: async (tokenHash): Promise<SessionRecord | null> => {
      const session = sessions.find((row) => row.tokenHash === tokenHash);
      if (!session) return null;
      const user = users.find((row) => row.id === session.userId);
      const group = groups.find((row) => row.id === user?.groupId);
      if (!user || !group) return null;
      return {
        id: session.id,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        user,
        group,
      };
    },
    extendSession: async (id, expiresAt) => {
      const session = sessions.find((row) => row.id === id);
      if (session) session.expiresAt = expiresAt;
    },
    revokeSession: async (tokenHash, at) => {
      const session = sessions.find((row) => row.tokenHash === tokenHash);
      if (session) session.revokedAt = at;
    },
    revokeAllSessions: async (userId, at) => {
      for (const session of sessions) if (session.userId === userId) session.revokedAt = at;
    },
    updateGroup: async (groupId, patch) => {
      const group = groups.find((row) => row.id === groupId);
      if (!group) throw new Error('grupo inexistente');
      Object.assign(group, patch);
      return group;
    },
    deleteGroupCascade: async (groupId) => {
      deletedGroups.push(groupId);
    },
  };

  return { repo, users, groups, tokens, sessions, deletedGroups };
};
