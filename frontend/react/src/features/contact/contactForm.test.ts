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
  roleTitle: 'Diretora',
  phone: '(11) 98888-7777',
  sector: '',
  acceptPrivacy: true,
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

  it('deve exigir cargo, telefone e o aceite', () => {
    const errors = validateContactForm({ ...emptyContactForm(), acceptPrivacy: false });

    expect(Object.keys(errors).sort()).toEqual(['acceptPrivacy', 'phone', 'roleTitle']);
  });

  it('deve recusar telefone sem DDD ou incompleto', () => {
    expect(validateContactForm({ ...valid, phone: '(11) 9888' }).phone).toBeDefined();
    expect(validateContactForm({ ...valid, phone: '98888-7777' }).phone).toBeDefined();
  });

  it('deve deixar o setor opcional', () => {
    expect(validateContactForm({ ...valid, sector: '' })).toEqual({});
  });
});

describe('buildContactRequest', () => {
  const snapshot = { profile: { storeCount: 3 }, result: { grossAnnualImpact: 1 } };

  it('deve montar o pedido com origem, modo, números e chave do envio', () => {
    const request = buildContactRequest(valid, {
      snapshot,
      idempotencyKey: 'chave-1234',
      utm: 'utm_source=google',
    });

    expect(request).toEqual({
      source: 'consultor',
      mode: 'detalhado',
      roleTitle: 'Diretora',
      phone: '(11) 98888-7777',
      acceptPrivacy: true,
      profile: { storeCount: 3 },
      result: { grossAnnualImpact: 1 },
      idempotencyKey: 'chave-1234',
      utm: 'utm_source=google',
    });
  });

  it('deve limpar espaços e enviar o setor só quando informado', () => {
    const request = buildContactRequest(
      { ...valid, roleTitle: '  Gerente  ', sector: ' Farmácias ' },
      { snapshot, idempotencyKey: 'chave-1234' },
    );

    expect(request.roleTitle).toBe('Gerente');
    expect(request.sector).toBe('Farmácias');
    expect('utm' in request).toBe(false);
  });

  it('não deve mandar nome, e-mail nem empresa (vêm da conta)', () => {
    const request = buildContactRequest(valid, { snapshot, idempotencyKey: 'chave-1234' });

    expect('name' in request || 'email' in request || 'company' in request).toBe(false);
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
