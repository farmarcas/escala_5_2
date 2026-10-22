import { createTransport } from 'nodemailer';
import { env } from '../config/env.js';
import type { Mailer } from '../modules/auth/auth.types.js';

// SMTP configurado por ambiente. Em desenvolvimento aponta para o Mailpit (caixa de teste, nada sai).
export const makeSmtpMailer = (): Mailer => {
  const transport = createTransport({
    host: env.MAIL_HOST,
    port: env.MAIL_PORT,
    secure: env.MAIL_PORT === 465,
  });

  return {
    async send({ to, subject, text }) {
      await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
    },
  };
};
