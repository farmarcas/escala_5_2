import { describe, expect, it } from 'vitest';
import {
  buildContactRequest,
  emptyContactForm,
  maskPhone,
  readUtm,
  validateContactForm,
  type ContactFormValues,
} from './contactForm';

const valid: ContactFormValues = {
  name: 'Ana Souza',
  roleTitle: 'Diretora',
  company: 'Rede Saúde',
  phone: '(11) 98888-7777',
  email: 'ana@rede.com.br',
  sector: '',
  acceptPrivacy: true,
  website: '',
};

describe('maskPhone', () => {
  it('deve formatar celular e fixo enquanto digita', () => {
    expect(maskPhone('1')).toBe('(1');
    expect(maskPhone('11')).toBe('(11');
    expect(maskPhone('119')).toBe('(11) 9');
    expect(maskPhone('1198888')).toBe('(11) 9888-8');
    expect(maskPhone('11988887777')).toBe('(11) 98888-7777');
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('deve ignorar letras e limitar a 11 dígitos', () => {
    expect(maskPhone('abc')).toBe('');
    expect(maskPhone('119888877779999')).toBe('(11) 98888-7777');
  });
});

describe('validateContactForm', () => {
  it('deve aceitar um formulário completo', () => {
    expect(validateContactForm(valid)).toEqual({});
  });

  it('deve exigir todos os campos obrigatórios e o aceite', () => {
    const errors = validateContactForm({ ...emptyContactForm(), acceptPrivacy: false });

    expect(Object.keys(errors).sort()).toEqual(
      ['acceptPrivacy', 'company', 'email', 'name', 'phone', 'roleTitle'].sort(),
    );
  });

  it('deve recusar e-mail e telefone inválidos', () => {
    const errors = validateContactForm({ ...valid, email: 'x@y', phone: '(11) 9888' });

    expect(errors.email).toBeDefined();
    expect(errors.phone).toBeDefined();
  });

  it('deve deixar o setor opcional', () => {
    expect(validateContactForm({ ...valid, sector: '' })).toEqual({});
  });
});

describe('buildContactRequest', () => {
  it('deve montar o pedido com origem, modo, números e chave do envio', () => {
    const request = buildContactRequest(valid, {
      source: 'pdf',
      snapshot: { mode: 'rapido', profile: { employees: 200 }, result: { grossMin: 1 } },
      idempotencyKey: 'chave-1234',
      utm: 'utm_source=google',
    });

    expect(request).toMatchObject({
      source: 'pdf',
      mode: 'rapido',
      name: 'Ana Souza',
      acceptPrivacy: true,
      profile: { employees: 200 },
      result: { grossMin: 1 },
      idempotencyKey: 'chave-1234',
      utm: 'utm_source=google',
      website: '',
    });
    expect(request.sector).toBeUndefined();
  });

  it('deve limpar espaços e enviar o setor quando informado', () => {
    const request = buildContactRequest(
      { ...valid, name: '  Ana  ', sector: ' Farmácias ' },
      {
        source: 'consultor',
        snapshot: { mode: 'detalhado', profile: {}, result: {} },
        idempotencyKey: 'chave-1234',
      },
    );

    expect(request.name).toBe('Ana');
    expect(request.sector).toBe('Farmácias');
  });
});

describe('readUtm', () => {
  it('deve juntar só os parâmetros utm presentes', () => {
    expect(readUtm('?utm_source=google&x=1&utm_campaign=escala')).toBe(
      'utm_source=google&utm_campaign=escala',
    );
  });

  it('deve devolver nada quando não há utm', () => {
    expect(readUtm('?a=1')).toBeUndefined();
    expect(readUtm('')).toBeUndefined();
  });
});
