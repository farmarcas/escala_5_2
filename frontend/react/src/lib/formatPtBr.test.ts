import { describe, expect, it } from 'vitest';
import {
  formatBRL,
  formatBRLDetailed,
  formatDelta,
  formatHours,
  formatPP,
  formatRange,
  formatSignedBRL,
  formatBRLCompact,
  formatDateTime,
  formatInt,
  formatPercent,
  formatPlainNumber,
  parseBrNumber,
} from './formatPtBr';

const plain = (text: string) => text.replace(/\u00a0/g, ' ');

describe('formatPtBr', () => {
  it('deve formatar reais sem centavos', () => {
    expect(plain(formatBRL(1234567.8))).toBe('R$ 1.234.568');
  });

  it('deve formatar valores compactos em mil, mi e bi', () => {
    expect(plain(formatBRLCompact(885138.66))).toBe('R$ 885,1 mil');
    expect(plain(formatBRLCompact(1_401_469.5))).toBe('R$ 1,4 mi');
    expect(plain(formatBRLCompact(2_500_000_000))).toBe('R$ 2,5 bi');
    expect(plain(formatBRLCompact(950))).toBe('R$ 950');
  });

  it('deve formatar percentual com vírgula', () => {
    expect(formatPercent(0.007376, 2)).toBe('0,74%');
    expect(formatPercent(0.5, 0)).toBe('50%');
  });

  it('deve formatar inteiros com separador de milhar', () => {
    expect(formatInt(12345.4)).toBe('12.345');
  });

  it('deve devolver traço para valores que não são número', () => {
    expect(formatBRL(Number.NaN)).toBe('—');
    expect(formatPercent(Number.POSITIVE_INFINITY, 1)).toBe('—');
  });

  it('deve formatar número simples para campos de edição', () => {
    expect(formatPlainNumber(1234.5)).toBe('1.234,5');
    expect(formatPlainNumber(2100)).toBe('2.100');
  });

  it('deve ler números digitados no formato brasileiro', () => {
    expect(parseBrNumber('1.234,56')).toBe(1234.56);
    expect(parseBrNumber('2.100')).toBe(2100);
    expect(parseBrNumber('120.000.000')).toBe(120_000_000);
    expect(parseBrNumber('1,55')).toBe(1.55);
    expect(parseBrNumber('1234.5')).toBe(1234.5);
    expect(parseBrNumber('R$ 2.100')).toBe(2100);
  });

  it('deve devolver null para texto vazio ou inválido', () => {
    expect(parseBrNumber('')).toBeNull();
    expect(parseBrNumber('abc')).toBeNull();
    expect(parseBrNumber('1,2,3')).toBeNull();
  });
});

describe('formatDateTime', () => {
  it('deve formatar no horário de Brasília', () => {
    expect(formatDateTime('2026-10-22T18:30:00Z').replace(/\u00a0/g, ' ')).toMatch(
      /22\/10\/2026,? 15:30/,
    );
  });

  it('deve devolver traço para data inválida', () => {
    expect(formatDateTime('não é data')).toBe('—');
  });
});

describe('formatos do guia Radar Escala', () => {
  it('variação com sinal, unidade e o menos verdadeiro (U+2212)', () => {
    expect(formatDelta(2, 'colaboradores')).toBe('+2 colaboradores');
    expect(formatDelta(-52, 'h')).toBe('\u221252 h');
    expect(formatDelta(0, 'h')).toBe('0 h');
    expect(formatDelta(22.2, '%', 1)).toBe('+22,2%');
    expect(formatDelta(Number.NaN)).toBe('—');
  });

  it('variação em reais', () => {
    expect(formatSignedBRL(8400).replace(/\s/g, ' ')).toBe('+R$ 8.400');
    expect(formatSignedBRL(-4200).replace(/\s/g, ' ')).toBe('\u2212R$ 4.200');
    expect(formatSignedBRL(0).replace(/\s/g, ' ')).toBe('R$ 0');
  });

  it('moeda com centavos nas tabelas', () => {
    expect(formatBRLDetailed(46200).replace(/\s/g, ' ')).toBe('R$ 46.200,00');
    expect(formatBRLDetailed(-4200).replace(/\s/g, ' ')).toBe('\u2212R$ 4.200,00');
  });

  it('horas, faixa de horário e pontos percentuais', () => {
    expect(formatHours(102)).toBe('102 h');
    expect(formatRange('07:00', '22:00')).toBe('07:00 às 22:00');
    expect(formatPP(9)).toBe('+9 p.p.');
    expect(formatPP(-1.5)).toBe('\u22121,5 p.p.');
  });
});
