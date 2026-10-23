export const emailSignature = 'Radar Escala, uma solução Farmarcas';

export const verificationEmail = (appBaseUrl: string, name: string, token: string) => ({
  subject: 'Confirme seu e-mail no Radar Escala',
  text: [
    `Olá, ${name}.`,
    '',
    'Para ativar sua conta no Radar Escala, confirme seu e-mail neste link (vale por 24 horas):',
    `${appBaseUrl}/confirmar-email?token=${token}`,
    '',
    'Se você não criou esta conta, pode ignorar esta mensagem.',
    '',
    emailSignature,
  ].join('\n'),
});

export const passwordResetEmail = (appBaseUrl: string, name: string, token: string) => ({
  subject: 'Redefinição de senha no Radar Escala',
  text: [
    `Olá, ${name}.`,
    '',
    'Recebemos um pedido para redefinir sua senha. Use este link (vale por 1 hora):',
    `${appBaseUrl}/redefinir-senha?token=${token}`,
    '',
    'Se você não fez esse pedido, pode ignorar esta mensagem: sua senha continua a mesma.',
    '',
    emailSignature,
  ].join('\n'),
});
