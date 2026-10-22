export const verificationEmail = (appBaseUrl: string, name: string, token: string) => ({
  subject: 'Confirme seu e-mail na calculadora da Farmarcas',
  text: [
    `Olá, ${name}!`,
    '',
    'Para ativar sua conta na calculadora do fim da escala 6x1, confirme seu e-mail neste link (vale por 24 horas):',
    `${appBaseUrl}/confirmar-email?token=${token}`,
    '',
    'Se você não criou esta conta, pode ignorar esta mensagem.',
  ].join('\n'),
});

export const passwordResetEmail = (appBaseUrl: string, name: string, token: string) => ({
  subject: 'Redefinição de senha - calculadora da Farmarcas',
  text: [
    `Olá, ${name}!`,
    '',
    'Recebemos um pedido para redefinir sua senha. Use este link (vale por 1 hora):',
    `${appBaseUrl}/redefinir-senha?token=${token}`,
    '',
    'Se você não fez esse pedido, pode ignorar esta mensagem: sua senha continua a mesma.',
  ].join('\n'),
});
