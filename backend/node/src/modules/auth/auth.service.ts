import { AppError } from '../../shared/errors/app-error.js';
import type { AttemptLimiter } from '../../shared/middlewares/rate-limit.js';
import { generateToken, hashToken } from '../../shared/security/tokens.js';
import { passwordResetEmail, verificationEmail } from './auth.emails.js';
import type {
  AuthRepository,
  GroupRecord,
  Mailer,
  PasswordHasher,
  Principal,
  TaxRegimeValue,
} from './auth.types.js';

const HOUR_MS = 3600_000;
export const SESSION_TTL_MS = 7 * 24 * HOUR_MS;
const VERIFY_TTL_MS = 24 * HOUR_MS;
const RESET_TTL_MS = HOUR_MS;
// A validade da sessão só é estendida se passou mais de 1 hora desde a última vez (poupa escritas).
const EXTEND_AFTER_MS = HOUR_MS;

const invalidCredentials = () =>
  new AppError('E-mail ou senha incorretos', 401, 'INVALID_CREDENTIALS');
const invalidToken = () =>
  new AppError('Link inválido ou expirado. Peça um novo.', 400, 'INVALID_TOKEN');

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  groupName: string;
  acceptPrivacy: true;
};

export type AuthServiceDeps = {
  repo: AuthRepository;
  mailer: Mailer;
  passwords: PasswordHasher;
  limiter: AttemptLimiter;
  appBaseUrl: string;
  now?: () => Date;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const makeAuthService = ({
  repo,
  mailer,
  passwords,
  limiter,
  appBaseUrl,
  now = () => new Date(),
}: AuthServiceDeps) => {
  // Hash de uma senha qualquer, para gastar o mesmo tempo quando o e-mail não existe.
  const dummyHash = passwords.hash('senha-que-nunca-sera-usada');

  const issueEmailToken = async (
    userId: string,
    kind: 'verify' | 'reset',
    ttlMs: number,
  ): Promise<string> => {
    const { token, hash } = generateToken();
    await repo.createEmailToken({
      userId,
      kind,
      tokenHash: hash,
      expiresAt: new Date(now().getTime() + ttlMs),
    });
    return token;
  };

  return {
    // Resposta igual exista ou não a conta: ninguém descobre quem está cadastrado.
    async register(input: RegisterInput): Promise<void> {
      const email = normalizeEmail(input.email);
      if (await repo.findUserByEmail(email)) return;

      const user = await repo.createGroupWithUser({
        groupName: input.groupName.trim(),
        name: input.name.trim(),
        email,
        passwordHash: await passwords.hash(input.password),
        privacyAcceptedAt: now(),
      });
      if (!user) return;

      const token = await issueEmailToken(user.id, 'verify', VERIFY_TTL_MS);
      await mailer.send({ to: email, ...verificationEmail(appBaseUrl, user.name, token) });
    },

    async verifyEmail(token: string): Promise<void> {
      const consumed = await repo.consumeEmailToken('verify', hashToken(token), now());
      if (!consumed) throw invalidToken();
      await repo.markEmailVerified(consumed.userId, now());
    },

    async login(rawEmail: string, password: string, ip: string) {
      const email = normalizeEmail(rawEmail);
      const limiterKey = `${email}|${ip}`;
      if (limiter.isBlocked(limiterKey)) {
        throw new AppError(
          'Muitas tentativas. Tente de novo em alguns minutos.',
          429,
          'RATE_LIMITED',
        );
      }

      const user = await repo.findUserByEmail(email);
      const passwordOk = user
        ? await passwords.verify(password, user.passwordHash)
        : (await passwords.verify(password, await dummyHash), false);

      if (!user || !passwordOk) {
        limiter.recordFailure(limiterKey);
        throw invalidCredentials();
      }
      if (!user.emailVerifiedAt) {
        throw new AppError('Confirme seu e-mail antes de entrar.', 403, 'EMAIL_NOT_VERIFIED');
      }

      limiter.reset(limiterKey);
      const { token, hash } = generateToken();
      const expiresAt = new Date(now().getTime() + SESSION_TTL_MS);
      await repo.createSession({ userId: user.id, tokenHash: hash, expiresAt });

      const session = await repo.findSessionByTokenHash(hash);
      if (!session) throw new AppError('Erro ao criar a sessão', 500, 'SESSION_ERROR');
      return { token, principal: toPrincipal(session) };
    },

    async logout(token: string): Promise<void> {
      await repo.revokeSession(hashToken(token), now());
    },

    async authenticate(token: string): Promise<Principal | null> {
      const session = await repo.findSessionByTokenHash(hashToken(token));
      if (!session || session.revokedAt || session.expiresAt <= now()) return null;

      const remaining = session.expiresAt.getTime() - now().getTime();
      if (SESSION_TTL_MS - remaining > EXTEND_AFTER_MS) {
        await repo.extendSession(session.id, new Date(now().getTime() + SESSION_TTL_MS));
      }
      return toPrincipal(session);
    },

    async forgotPassword(rawEmail: string): Promise<void> {
      const user = await repo.findUserByEmail(normalizeEmail(rawEmail));
      if (!user || !user.emailVerifiedAt) return;
      const token = await issueEmailToken(user.id, 'reset', RESET_TTL_MS);
      await mailer.send({ to: user.email, ...passwordResetEmail(appBaseUrl, user.name, token) });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
      const consumed = await repo.consumeEmailToken('reset', hashToken(token), now());
      if (!consumed) throw invalidToken();
      await repo.updatePassword(consumed.userId, await passwords.hash(newPassword));
      await repo.revokeAllSessions(consumed.userId, now());
    },

    async updateGroup(
      groupId: string,
      patch: { name?: string; taxRegime?: TaxRegimeValue; annualRevenue?: number | null },
    ): Promise<GroupRecord> {
      return repo.updateGroup(groupId, patch);
    },

    async deleteAccount(principal: Principal, password: string): Promise<void> {
      const user = await repo.findUserByEmail(principal.user.email);
      if (!user || !(await passwords.verify(password, user.passwordHash))) {
        throw new AppError('Senha incorreta', 401, 'INVALID_CREDENTIALS');
      }
      await repo.deleteGroupCascade(principal.groupId);
    },
  };
};

export type AuthService = ReturnType<typeof makeAuthService>;

const toPrincipal = (session: {
  id: string;
  user: { id: string; name: string; email: string };
  group: GroupRecord;
}): Principal => ({
  sessionId: session.id,
  user: { id: session.user.id, name: session.user.name, email: session.user.email },
  groupId: session.group.id,
  group: session.group,
});
