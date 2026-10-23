import { describe, expect, it } from 'vitest';
import { collectNumbers, extractNumbers, untraceableNumbers } from './assistant.numbers.js';

const pool = collectNumbers({
  folhaHoje: 56386,
  folhaNova: 115753,
  diferenca: 59367,
  percentual: 105.3,
  contratar: 15,
  funcoes: [{ funcao: 'balconista', hoje: 5, necessario: 8 }],
  alertas: ['Perfumista: a cobertura de 10h passa 1 turno em 36 min.'],
});

describe('números da resposta', () => {
  it('lê moeda, porcentagem e horas no formato brasileiro', () => {
    expect(extractNumbers('R$ 115.753 · 105,3% · 52 h').map((n) => n.value)).toEqual([
      115753, 105.3, 52,
    ]);
  });

  it('ignora horários, cenários, leis, datas e numeração de lista', () => {
    const text =
      '1. Na 5x2 · 42h, das 07:00 às 22:00, em 21/12, pela Lei 13.021/2014 e o art. 71 da CLT.';
    expect(extractNumbers(text).map((n) => n.value)).toEqual([42]);
  });

  it('aceita números que vieram das ferramentas, com arredondamento', () => {
    const text =
      'A folha vai de R$ 56.386 para R$ 115.753: +R$ 59.367 por mês (+105,3%). Contrate 15 pessoas. Cerca de R$ 59,4 mil.';
    expect(untraceableNumbers(text, pool)).toEqual([]);
  });

  it('pega número inventado em reais, porcentagem e contagem', () => {
    const text = 'A folha sobe R$ 70.000 (+80%) e você precisa de 12 pessoas.';
    expect(untraceableNumbers(text, pool).sort()).toEqual(['12', '70.000', '80'].sort());
  });

  it('aceita inteiros pequenos de frase, mas não valores pequenos de dinheiro ou hora quando fora da ferramenta', () => {
    expect(untraceableNumbers('Veja 3 cenários, de 2 a 4.', pool)).toEqual([]);
    expect(untraceableNumbers('Economiza 9 horas por semana.', pool)).toEqual(['9']);
  });

  it('o número que está dentro do texto de um alerta também vale', () => {
    expect(untraceableNumbers('Encurte a faixa em 36 min.', pool)).toEqual([]);
  });

  it('aceita as jornadas dos cenários como rótulo', () => {
    expect(untraceableNumbers('Na jornada de 44h e na de 40h.', pool)).toEqual([]);
  });
});
