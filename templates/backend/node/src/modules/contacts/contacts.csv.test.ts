import { describe, expect, it } from 'vitest';
import { buildContactsCsv, csvCell } from './contacts.csv.js';

describe('csvCell', () => {
  it('deve deixar texto simples como está', () => {
    expect(csvCell('Ana Souza')).toBe('Ana Souza');
  });

  it('deve proteger separador, aspas e quebras de linha', () => {
    expect(csvCell('Rede; Saúde')).toBe('"Rede; Saúde"');
    expect(csvCell('Ele disse "oi"')).toBe('"Ele disse ""oi"""');
    expect(csvCell('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it('deve neutralizar fórmulas de planilha (=, +, -, @)', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+55 11 99999-0000')).toBe("'+55 11 99999-0000");
    expect(csvCell('-1')).toBe("'-1");
    expect(csvCell('@soma')).toBe("'@soma");
  });

  it('deve tratar nulo e vazio como célula vazia', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });
});

describe('buildContactsCsv', () => {
  const row = {
    id: 'id-1',
    createdAt: new Date('2026-10-22T18:30:00Z'),
    source: 'consultor',
    mode: 'rapido',
    name: 'Ana Souza',
    roleTitle: 'Diretora',
    company: 'Rede Saúde',
    phone: '(11) 98888-7777',
    email: 'ana@rede.com.br',
    sector: null,
    utm: 'utm_source=google',
    anonymizedAt: null,
  };

  it('deve começar com BOM UTF-8, usar ; e cabeçalho em português', () => {
    const csv = buildContactsCsv([row]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [header, line] = csv.slice(1).split('\r\n');
    expect(header).toBe(
      'id;criado_em;origem;modo;nome;cargo;empresa;telefone;email;setor;utm;anonimizado',
    );
    expect(line).toBe(
      'id-1;2026-10-22T18:30:00.000Z;consultor;rapido;Ana Souza;Diretora;Rede Saúde;(11) 98888-7777;ana@rede.com.br;;utm_source=google;nao',
    );
  });

  it('deve marcar contatos anonimizados', () => {
    const csv = buildContactsCsv([{ ...row, anonymizedAt: new Date() }]);

    expect(csv.trimEnd().endsWith(';sim')).toBe(true);
  });

  it('deve gerar só o cabeçalho quando não há contatos', () => {
    expect(buildContactsCsv([]).slice(1).split('\r\n').filter(Boolean)).toHaveLength(1);
  });
});
