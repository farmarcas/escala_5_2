import { describe, expect, it } from 'vitest';
import { AttemptLimiter } from '../../shared/middlewares/rate-limit.js';
import { makeFakeAuthRepository, makeFakeMailer, makeFakePasswords } from './auth.fakes.js';
import { makeAuthService } from './auth.service.js';

const NOW = new Date('2026-10-22T12:00:00Z');
const validRegistration = {
  name: 'Ana Souza',
  email: 'ana@rede.com.br',
  password: 'senha-bem-longa-1',
  groupName: 'Rede Saúde',
  acceptPrivacy: true as const,
};

const setup = (clock: { now: Date } = { now: NOW }) => {
  const fakes = makeFakeAuthRepository();
  const { mailer, sent } = makeFakeMailer();
  const limiter = new AttemptLimiter({
    max: 5,
    windowMs: 15 * 60_000,
    now: () => clock.now.getTime(),
  });
  const service = makeAuthService({
    repo: fakes.repo,
    mailer,
    passwords: makeFakePasswords(),
    limiter,
    appBaseUrl: 'http://localhost:3000',
    now: () => clock.now,
  });
  const tokenFromLastEmail = () => {
    const last = sent.at(-1);
    return last?.text.match(/token=([\w-]+)/)?.[1] ?? '';
  };
  return { ...fakes, service, sent, clock, tokenFromLastEmail };
};

const registerAndVerify = async (ctx: ReturnType<typeof setup>) => {
  await ctx.service.register(validRegistration);
  await ctx.service.verifyEmail(ctx.tokenFromLastEmail());
};

describe('auth.service', () => {
  describe('register', () => {
    it('deve criar conta e enviar link de confirmação por e-mail', async () => {
      const ctx = setup();

      await ctx.service.register(validRegistration);

      expect(ctx.users).toHaveLength(1);
      expect(ctx.users[0]?.emailVerifiedAt).toBeNull();
      expect(ctx.sent).toHaveLength(1);
      expect(ctx.sent[0]?.to).toBe('ana@rede.com.br');
      expect(ctx.sent[0]?.text).toContain('http://localhost:3000/confirmar-email?token=');
    });

    it('deve normalizar o e-mail em minúsculas', async () => {
      const ctx = setup();

      await ctx.service.register({ ...validRegistration, email: 'Ana@Rede.com.BR' });

      expect(ctx.users[0]?.email).toBe('ana@rede.com.br');
    });

    it('não deve revelar nem duplicar quando o e-mail já existe', async () => {
      const ctx = setup();
      await ctx.service.register(validRegistration);

      await expect(ctx.service.register(validRegistration)).resolves.toBeUndefined();

      expect(ctx.users).toHaveLength(1);
      expect(ctx.sent).toHaveLength(1);
    });
  });

  describe('verifyEmail', () => {
    it('deve confirmar o e-mail com o token recebido', async () => {
      const ctx = setup();
      await ctx.service.register(validRegistration);

      await ctx.service.verifyEmail(ctx.tokenFromLastEmail());

      expect(ctx.users[0]?.emailVerifiedAt).toEqual(NOW);
    });

    it('deve recusar token inválido', async () => {
      const ctx = setup();

      await expect(ctx.service.verifyEmail('token-falso')).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
      });
    });

    it('deve recusar token usado duas vezes', async () => {
      const ctx = setup();
      await ctx.service.register(validRegistration);
      const token = ctx.tokenFromLastEmail();
      await ctx.service.verifyEmail(token);

      await expect(ctx.service.verifyEmail(token)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    });

    it('deve recusar token expirado (24 horas)', async () => {
      const ctx = setup();
      await ctx.service.register(validRegistration);
      const token = ctx.tokenFromLastEmail();

      ctx.clock.now = new Date(NOW.getTime() + 25 * 3600_000);

      await expect(ctx.service.verifyEmail(token)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
    });
  });

  describe('login', () => {
    it('deve exigir e-mail confirmado', async () => {
      const ctx = setup();
      await ctx.service.register(validRegistration);

      await expect(
        ctx.service.login('ana@rede.com.br', validRegistration.password, '1.1.1.1'),
      ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', statusCode: 403 });
    });

    it('deve entrar com credenciais corretas e criar sessão', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);

      const result = await ctx.service.login(
        'ANA@rede.com.br',
        validRegistration.password,
        '1.1.1.1',
      );

      expect(result.token.length).toBeGreaterThanOrEqual(43);
      expect(result.principal.user.email).toBe('ana@rede.com.br');
      expect(ctx.sessions).toHaveLength(1);
      expect(ctx.sessions[0]?.tokenHash).not.toBe(result.token);
    });

    it('deve responder igual para senha errada e e-mail inexistente', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);

      const wrongPassword = await ctx.service
        .login('ana@rede.com.br', 'senha-errada-123', '1.1.1.1')
        .catch((error: unknown) => error);
      const unknownEmail = await ctx.service
        .login('ninguem@rede.com.br', 'qualquer-coisa-1', '1.1.1.1')
        .catch((error: unknown) => error);

      expect(wrongPassword).toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
      expect(unknownEmail).toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
      expect((wrongPassword as Error).message).toBe((unknownEmail as Error).message);
    });

    it('deve bloquear depois de 5 falhas, mesmo com a senha certa', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      for (let i = 0; i < 5; i++) {
        await ctx.service.login('ana@rede.com.br', 'senha-errada-123', '1.1.1.1').catch(() => null);
      }

      await expect(
        ctx.service.login('ana@rede.com.br', validRegistration.password, '1.1.1.1'),
      ).rejects.toMatchObject({ code: 'RATE_LIMITED', statusCode: 429 });
    });

    it('deve liberar de novo depois de 15 minutos', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      for (let i = 0; i < 5; i++) {
        await ctx.service.login('ana@rede.com.br', 'senha-errada-123', '1.1.1.1').catch(() => null);
      }

      ctx.clock.now = new Date(NOW.getTime() + 16 * 60_000);

      await expect(
        ctx.service.login('ana@rede.com.br', validRegistration.password, '1.1.1.1'),
      ).resolves.toBeDefined();
    });
  });

  describe('authenticate', () => {
    it('deve devolver a pessoa da sessão e estender a validade quando já passou 1 hora', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      const { token } = await ctx.service.login(
        'ana@rede.com.br',
        validRegistration.password,
        '1.1.1.1',
      );
      const firstExpiry = ctx.sessions[0]?.expiresAt.getTime() ?? 0;

      ctx.clock.now = new Date(NOW.getTime() + 2 * 3600_000);
      const principal = await ctx.service.authenticate(token);

      expect(principal?.user.email).toBe('ana@rede.com.br');
      expect(principal?.groupId).toBe(ctx.groups[0]?.id);
      expect(ctx.sessions[0]?.expiresAt.getTime()).toBeGreaterThan(firstExpiry);
    });

    it('deve recusar token desconhecido, revogado ou expirado', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      const { token } = await ctx.service.login(
        'ana@rede.com.br',
        validRegistration.password,
        '1.1.1.1',
      );

      expect(await ctx.service.authenticate('desconhecido')).toBeNull();

      ctx.clock.now = new Date(NOW.getTime() + 8 * 24 * 3600_000);
      expect(await ctx.service.authenticate(token)).toBeNull();

      ctx.clock.now = NOW;
      await ctx.service.logout(token);
      expect(await ctx.service.authenticate(token)).toBeNull();
    });
  });

  describe('recuperação de senha', () => {
    it('não deve enviar e-mail nem falhar quando o e-mail não existe', async () => {
      const ctx = setup();

      await expect(ctx.service.forgotPassword('ninguem@rede.com.br')).resolves.toBeUndefined();

      expect(ctx.sent).toHaveLength(0);
    });

    it('deve trocar a senha com o token e revogar as sessões antigas', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      const { token: sessionToken } = await ctx.service.login(
        'ana@rede.com.br',
        validRegistration.password,
        '1.1.1.1',
      );
      await ctx.service.forgotPassword('ana@rede.com.br');
      const resetToken = ctx.tokenFromLastEmail();

      await ctx.service.resetPassword(resetToken, 'nova-senha-muito-boa');

      expect(await ctx.service.authenticate(sessionToken)).toBeNull();
      await expect(
        ctx.service.login('ana@rede.com.br', validRegistration.password, '2.2.2.2'),
      ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
      await expect(
        ctx.service.login('ana@rede.com.br', 'nova-senha-muito-boa', '2.2.2.2'),
      ).resolves.toBeDefined();
    });

    it('deve valer só uma vez e por 1 hora', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      await ctx.service.forgotPassword('ana@rede.com.br');
      const resetToken = ctx.tokenFromLastEmail();
      await ctx.service.resetPassword(resetToken, 'nova-senha-muito-boa');

      await expect(
        ctx.service.resetPassword(resetToken, 'outra-senha-bem-boa'),
      ).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
      });

      await ctx.service.forgotPassword('ana@rede.com.br');
      const second = ctx.tokenFromLastEmail();
      ctx.clock.now = new Date(NOW.getTime() + 61 * 60_000);
      await expect(ctx.service.resetPassword(second, 'mais-uma-senha-boa')).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
      });
    });
  });

  describe('excluir conta', () => {
    it('deve exigir a senha atual', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      const { principal } = await ctx.service.login(
        'ana@rede.com.br',
        validRegistration.password,
        '1.1.1.1',
      );

      await expect(ctx.service.deleteAccount(principal, 'senha-errada-123')).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
      expect(ctx.deletedGroups).toHaveLength(0);
    });

    it('deve apagar o grupo inteiro com a senha certa', async () => {
      const ctx = setup();
      await registerAndVerify(ctx);
      const { principal } = await ctx.service.login(
        'ana@rede.com.br',
        validRegistration.password,
        '1.1.1.1',
      );

      await ctx.service.deleteAccount(principal, validRegistration.password);

      expect(ctx.deletedGroups).toEqual([principal.groupId]);
    });
  });
});
