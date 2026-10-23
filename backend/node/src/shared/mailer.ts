import { createTransport, type TransportOptions } from 'nodemailer';
import { env } from '../config/env.js';
import type { Mailer } from '../modules/auth/auth.types.js';

type MailEnv = Pick<
  typeof env,
  'MAIL_HOST' | 'MAIL_PORT' | 'MAIL_USER' | 'MAIL_PASSWORD' | 'MAIL_SECURE'
>;

// Sem usuário e senha: caixa de teste (Mailpit). Com eles: autentica e exige conexão segura.
export const smtpOptions = (e: MailEnv): TransportOptions =>
  ({
    host: e.MAIL_HOST,
    port: e.MAIL_PORT,
    secure: e.MAIL_SECURE ?? e.MAIL_PORT === 465,
    ...(e.MAIL_USER && e.MAIL_PASSWORD
      ? { auth: { user: e.MAIL_USER, pass: e.MAIL_PASSWORD }, requireTLS: true }
      : {}),
  }) as TransportOptions;

// SMTP configurado por ambiente. Em desenvolvimento aponta para o Mailpit (caixa de teste, nada sai).
export const makeSmtpMailer = (): Mailer => {
  const transport = createTransport(smtpOptions(env));

  return {
    async send({ to, subject, text }) {
      await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
    },
  };
};
