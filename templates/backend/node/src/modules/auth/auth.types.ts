export type TaxRegimeValue = 'real' | 'presumido' | 'simples';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  groupId: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
};

export type GroupRecord = {
  id: string;
  name: string;
  taxRegime: TaxRegimeValue;
  annualRevenue: number | null;
};

export type SessionRecord = {
  id: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: UserRecord;
  group: GroupRecord;
};

export type EmailTokenKindValue = 'verify' | 'reset';

export type AuthRepository = {
  findUserByEmail: (email: string) => Promise<UserRecord | null>;
  createGroupWithUser: (input: {
    groupName: string;
    name: string;
    email: string;
    passwordHash: string;
    privacyAcceptedAt: Date;
  }) => Promise<UserRecord | null>;
  createEmailToken: (input: {
    userId: string;
    kind: EmailTokenKindValue;
    tokenHash: string;
    expiresAt: Date;
  }) => Promise<void>;
  consumeEmailToken: (
    kind: EmailTokenKindValue,
    tokenHash: string,
    now: Date,
  ) => Promise<{ userId: string } | null>;
  markEmailVerified: (userId: string, at: Date) => Promise<void>;
  updatePassword: (userId: string, passwordHash: string) => Promise<void>;
  createSession: (input: { userId: string; tokenHash: string; expiresAt: Date }) => Promise<void>;
  findSessionByTokenHash: (tokenHash: string) => Promise<SessionRecord | null>;
  extendSession: (id: string, expiresAt: Date) => Promise<void>;
  revokeSession: (tokenHash: string, at: Date) => Promise<void>;
  revokeAllSessions: (userId: string, at: Date) => Promise<void>;
  updateGroup: (
    groupId: string,
    patch: { name?: string; taxRegime?: TaxRegimeValue; annualRevenue?: number | null },
  ) => Promise<GroupRecord>;
  deleteGroupCascade: (groupId: string) => Promise<void>;
};

export type Mailer = {
  send: (message: { to: string; subject: string; text: string }) => Promise<void>;
};

export type PasswordHasher = {
  hash: (password: string) => Promise<string>;
  verify: (password: string, stored: string) => Promise<boolean>;
};

export type PublicUser = { id: string; name: string; email: string };

export type Principal = {
  sessionId: string;
  user: PublicUser;
  groupId: string;
  group: GroupRecord;
};
