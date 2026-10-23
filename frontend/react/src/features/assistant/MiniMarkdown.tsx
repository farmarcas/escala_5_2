import type { ReactNode } from 'react';

// Só o que a resposta usa: negrito, títulos curtos, listas e parágrafos. Nada de HTML cru: tudo vira texto.
const inline = (text: string): ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'p'; text: string };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line)) continue;
    const heading = line.match(/^#{1,4}\s+(.*)$/) ?? line.match(/^\*\*([^*]+)\*\*:?$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const last = blocks.at(-1);
    if (heading) blocks.push({ kind: 'heading', text: (heading[1] ?? '').replace(/\*\*/g, '') });
    else if (bullet || numbered) {
      const kind = bullet ? 'ul' : 'ol';
      const text = (bullet ?? numbered)![1] ?? '';
      if (last && last.kind === kind) last.items.push(text);
      else blocks.push({ kind, items: [text] });
    } else blocks.push({ kind: 'p', text: line });
  }
  return blocks;
}

export function MiniMarkdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm leading-6">
      {parseBlocks(text).map((block, i) => {
        if (block.kind === 'heading')
          return (
            <h4 key={i} className="font-display mt-2 text-base font-semibold">
              {block.text}
            </h4>
          );
        if (block.kind === 'p') return <p key={i}>{inline(block.text)}</p>;
        const List = block.kind === 'ul' ? 'ul' : 'ol';
        return (
          <List
            key={i}
            className={`${block.kind === 'ul' ? 'list-disc' : 'list-decimal'} flex flex-col gap-1 pl-5`}
          >
            {block.items.map((item, j) => (
              <li key={j}>{inline(item)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
