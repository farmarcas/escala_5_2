import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MiniMarkdown, parseBlocks } from './MiniMarkdown';
import { readEvents } from './useAnalysis';

describe('MiniMarkdown', () => {
  it('entende títulos em negrito, listas e parágrafos', () => {
    const blocks = parseBlocks('**O que o resultado diz**\nTexto.\n- um\n- dois\n1. a\n2. b');
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'p', 'ul', 'ol']);
  });

  it('nunca interpreta HTML: o texto aparece escapado', () => {
    const html = renderToStaticMarkup(
      <MiniMarkdown text={'<img src=x onerror=alert(1)> **ok**'} />,
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('<strong class="font-semibold">ok</strong>');
  });
});

describe('readEvents', () => {
  it('junta pedaços e entrega cada evento inteiro', async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode('data: {"type":"text","te'));
        controller.enqueue(enc.encode('xt":"Oi"}\n\ndata: {"type":"done"}\n\n'));
        controller.close();
      },
    });
    const seen: unknown[] = [];
    await readEvents(stream, (e) => seen.push(e));
    expect(seen).toEqual([{ type: 'text', text: 'Oi' }, { type: 'done' }]);
  });
});
