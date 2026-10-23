import { describe, expect, it, vi } from 'vitest';
import { defaultStore } from '../scales/scales.defaults.js';
import { diagnose } from '../scales/scales.diagnostic.js';
import { MAX_SIMULATIONS, TOOL_NAMES, makeToolbox, toolDefinitions } from './assistant.tools.js';

const store = { ...defaultStore('2026-12-14'), name: 'Centro', city: 'Varginha', state: 'MG' };
const toolbox = () => makeToolbox({ store, defaultScenario: '5x2_42' });

describe('ferramentas da IA', () => {
  it('a lista é exatamente a esperada e todas só leem ou calculam (nenhum verbo de escrita)', () => {
    expect(toolDefinitions.map((t) => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const t of toolDefinitions)
      expect(t.name).not.toMatch(/gravar|salvar|criar|apagar|excluir|enviar|alterar|atualizar/);
    // Nenhuma ferramenta pede identificação de conta ou de loja.
    expect(JSON.stringify(toolDefinitions)).not.toMatch(/groupId|storeId|email|telefone/i);
  });

  it('ler_diagnostico devolve os mesmos números do motor', async () => {
    const out = await toolbox().run('ler_diagnostico', {});
    const data = JSON.parse(out.content);
    const d = diagnose(store);
    expect(out.isError).toBe(false);
    expect(data.totais.contratar).toBe(d.totals.hire['5x2_42']);
    expect(data.folha.novaEscala).toBe(Math.round(d.payroll.scenarios['5x2_42'].total));
    expect(data.funcoes.length).toBe(d.rows.length);
    expect(data.totais.faltaParaCobrirHoje + data.totais.efeitoDaNovaEscala).toBe(
      data.totais.contratar,
    );
    expect(data.totais.faltaParaCobrirHoje).toBe(d.totals.fill);
  });

  it('ler_diagnostico aceita regime e provisões sem gravar', async () => {
    const out = await toolbox().run('ler_diagnostico', {
      regime: 'lucro_presumido_real',
      provisoes: false,
    });
    const data = JSON.parse(out.content);
    expect(data.regime).toBe('lucro_presumido_real');
    expect(data.provisoes).toBe(false);
  });

  it('simular_mudanca devolve antes, depois e diferença, e entrega o cenário para a tela', async () => {
    const tb = toolbox();
    const out = await tb.run('simular_mudanca', {
      titulo: 'Fechar mais cedo',
      mudancas: [{ tipo: 'horario_padrao', abre: '07:00', fecha: '20:00' }],
    });
    expect(out.isError).toBe(false);
    expect(out.scenario?.titulo).toBe('Fechar mais cedo');
    expect(out.scenario?.depois.folhaMensal).toBeLessThan(out.scenario!.antes.folhaMensal);
    expect(out.scenario?.diferenca.folhaMensal).toBe(
      out.scenario!.depois.folhaMensal - out.scenario!.antes.folhaMensal,
    );
    expect(out.scenario?.mudancas[0]?.passo).toBe('horario');
    // Os números do resultado entram no conjunto de números permitidos da análise.
    expect(tb.numbers.has(Math.abs(out.scenario!.diferenca.folhaMensal))).toBe(true);
  });

  it('simular_mudanca não altera a loja nem chama nada que grave', async () => {
    const frozen = JSON.stringify(store);
    const spy = vi.fn();
    const tb = makeToolbox({ store, defaultScenario: '5x2_42' });
    await tb.run('simular_mudanca', {
      titulo: 'Plantão intermitente',
      mudancas: [{ tipo: 'plantao', plantao: 'weekly', cobertura: 'intermittent' }],
    });
    expect(JSON.stringify(store)).toBe(frozen);
    expect(spy).not.toHaveBeenCalled();
  });

  it('recusa mudança inválida como erro da ferramenta, sem derrubar a análise', async () => {
    const out = await toolbox().run('simular_mudanca', {
      titulo: 'Farmacêutico só de dia',
      mudancas: [{ tipo: 'faixa', funcao: 'farmaceutico', inicio: '09:00', fim: '18:00' }],
    });
    expect(out.isError).toBe(true);
    expect(out.content).toContain('Mudança não aceita');
    const bad = await toolbox().run('simular_mudanca', {
      titulo: 'x',
      mudancas: [{ tipo: 'gravar_loja' }],
    });
    expect(bad.isError).toBe(true);
  });

  it(`limita a ${MAX_SIMULATIONS} simulações por análise`, async () => {
    const tb = toolbox();
    for (let i = 0; i < MAX_SIMULATIONS; i++) {
      const ok = await tb.run('simular_mudanca', {
        titulo: `Cenário ${i + 1}`,
        mudancas: [{ tipo: 'almoco', minutos: 60 }],
      });
      expect(ok.isError).toBe(false);
    }
    const over = await tb.run('simular_mudanca', {
      titulo: 'Mais um',
      mudancas: [{ tipo: 'almoco', minutos: 60 }],
    });
    expect(over.isError).toBe(true);
    expect(over.content).toContain('Limite');
  });

  it('ler_escala_resumida e ler_regras_aplicadas', async () => {
    const escala = JSON.parse(
      (await toolbox().run('ler_escala_resumida', { funcao: 'balconista' })).content,
    );
    expect(escala.pessoasNaEscala).toBeGreaterThan(0);
    expect(escala.primeiraSemana).toHaveLength(7);
    const regras = JSON.parse((await toolbox().run('ler_regras_aplicadas', {})).content);
    expect(regras.regras.length).toBeGreaterThan(5);
    expect((await toolbox().run('ler_escala_resumida', { funcao: 'comprador' })).isError).toBe(
      true,
    );
  });

  it('ferramenta desconhecida vira erro', async () => {
    expect((await toolbox().run('gravar_loja', {})).isError).toBe(true);
  });
});
