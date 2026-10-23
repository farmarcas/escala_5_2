import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validateGroupForm,
  validateLogin,
  validatePassword,
  validateRegister,
} from './validateAuthForms';

const validRegister = {
  name: 'Ana Souza',
  email: 'ana@rede.com.br',
  groupName: 'Rede Saúde',
  password: 'senha-bem-longa-1',
  acceptPrivacy: true,
};

describe('validateAuthForms', () => {
  it('deve aceitar e-mails válidos e recusar inválidos', () => {
    expect(validateEmail('ana@rede.com.br')).toBeUndefined();
    expect(validateEmail('')).toBeDefined();
    expect(validateEmail('sem-arroba')).toBeDefined();
    expect(validateEmail('a@b')).toBeDefined();
  });

  it('deve exigir senha com 10 ou mais caracteres', () => {
    expect(validatePassword('123456789')).toBe('A senha precisa ter ao menos 10 caracteres.');
    expect(validatePassword('1234567890')).toBeUndefined();
  });

  it('deve aceitar cadastro completo', () => {
    expect(validateRegister(validRegister)).toEqual({});
  });

  it('deve apontar cada problema do cadastro', () => {
    const errors = validateRegister({
      name: 'A',
      email: 'x',
      groupName: '',
      password: 'curta',
      acceptPrivacy: false,
    });

    expect(Object.keys(errors).sort()).toEqual(
      ['acceptPrivacy', 'email', 'groupName', 'name', 'password'].sort(),
    );
  });

  it('deve exigir e-mail e senha no login', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Informe seu e-mail.',
      password: 'Informe sua senha.',
    });
    expect(validateLogin({ email: 'ana@rede.com.br', password: 'x' })).toEqual({});
  });

  it('deve validar os dados do grupo (faturamento é opcional)', () => {
    expect(validateGroupForm({ name: 'Rede Saúde', annualRevenue: null })).toEqual({});
    expect(validateGroupForm({ name: 'Rede Saúde', annualRevenue: 60_000_000 })).toEqual({});
    expect(validateGroupForm({ name: 'A', annualRevenue: 0 })).toEqual({
      name: 'Informe o nome do grupo ou da rede.',
      annualRevenue: 'Use um valor maior que zero ou deixe em branco.',
    });
  });
});
