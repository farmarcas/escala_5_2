# Plano de implementação: Identidade visual Radar Escala

**Spec**: [spec.md](spec.md) | **Escopo**: só frontend, mais textos de e-mail e cores do Excel na API. Sem mudança de banco, rotas ou cálculo.

## Resumo
Trocar a camada visual por tokens do guia (claro e escuro), fontes Rubik e IBM Plex Sans, símbolo e logotipo como componentes, e repintar os componentes base e as telas existentes. O app já usa tokens semânticos do Tailwind (`bg-primary`, `text-foreground`, `bg-muted` etc.); só 12 arquivos usam a paleta Alquimia crua. Por isso a maior parte da troca acontece em um arquivo (`globals.css`) e nos componentes base.

## Decisões técnicas (e por quê)
1. **Tokens em dois níveis** em `src/styles/globals.css`: variáveis da marca (laranja, azul, neutros 0–900, semânticas) e variáveis semânticas por tema (`--background`, `--surface`, `--surface-subtle`, `--border`, `--fg`, `--fg-2`, `--fg-3`, `--action`, `--link`, `--focus`, `--info`, `--positive`, `--attention`, `--critical`, `--scenario-now`, `--scenario-5x2`). O tema escuro redefine as semânticas dentro de `@media (prefers-color-scheme: dark)`. O `@theme` do Tailwind aponta para as variáveis, então `bg-primary` e similares continuam existindo e mudam de cor sozinhos. A paleta Alquimia sai (`rp-`, `da-`, `mi-`, `li-`, `wa-`, `su-`, `at-`).
2. **Fontes autohospedadas**: `@fontsource/rubik` (500, 600, 800) e `@fontsource/ibm-plex-sans` (400, 500, 600), importadas em `globals.css`; `font-variant-numeric: tabular-nums` global na interface. Títulos usam a classe `font-display` (Rubik).
3. **Marca como componentes**: `src/components/brand/Symbol.tsx` (tons `cor`, `escuro`, `preto`, `branco`; `simples` sem agulha, obrigatório abaixo de 24 px) e `Logo.tsx` (horizontal, `escuro`, `endossada` com o logotipo Farmarcas em `src/assets/brand/`). O favicon é um SVG simplificado em `public/favicon.svg`. Os SVGs vêm do pacote enviado.
4. **Ícones**: `lucide-react`, com um wrapper `Icon` de tamanhos 16/20/24 e traço 2.
5. **Componentes base** (em `src/components/ui/`): Button (variantes primário, secundário, contorno, discreto, perigo; alturas 44, 36 e 32), campos e seletor (raio 8, borda 1 px, foco laranja com halo), Modal e cards (raio 12), StatusPill nos quatro tons semânticos, **ScenarioTag** novo (etiqueta quadrada "Atual" e "5x2"), KpiCard no formato "Atual → 5x2 + variação" (variação neutra para custo e quadro), BarCompare e StackedBar com as cores de cenário, Tabs, Stepper, DaySelector, SegmentedControl, FormMessage no formato de alerta.
6. **Formatação** em `src/lib/formatPtBr.ts`: `formatDelta` (sinal e U+2212), `formatSignedBRL`, `formatHours`, `formatRange` ("07:00 às 22:00"), `formatPP`. Substituir os usos nas telas do painel; testes novos.
7. **Telas**: login e cadastro no formato do guia (painel escuro com a frase "A escala muda. O controle continua seu." no desktop, só o formulário no celular, "uma solução Farmarcas"); cabeçalho com `Logo`; lista de lojas com o card de loja (barra de 7 segmentos); diagnóstico com cartões "Atual → 5x2" e etiquetas de cenário; grade da escala em tons de Azul Turno com folga em neutro; abas, passos e formulários com os componentes novos; conta, privacidade e recuperação de senha herdam o resto.
8. **Tom de voz**: revisão de todas as mensagens do frontend contra o guia (verbo no botão, sem exclamação, alerta com próximo passo), numa lista única registrada em `tasks.md` para conferência.
9. **API**: `auth.emails.ts` (assunto e texto), `scales.report.ts` (cores de cabeçalho e autor "Radar Escala") e `scales.controller.ts` (`Content-Disposition` passa a `radar-escala-<loja>.xlsx`). Nenhuma regra muda.
10. **Contraste automatizado**: teste de unidade que lê os pares de cor de `globals.css` (texto sobre fundo nos dois temas) e exige 4,5:1. Evita regressão futura.

## Estrutura (arquivos novos ou alterados)
```
frontend/react/
  index.html                     (título, descrição, ícone)
  public/favicon.svg             (símbolo simplificado)
  src/assets/brand/              (farmarcas-logo.svg, farmarcas-logo-white.svg)
  src/styles/globals.css         (tokens, fontes, tema escuro)
  src/components/brand/          (Symbol.tsx, Logo.tsx)
  src/components/ui/             (Icon.tsx, ScenarioTag.tsx + componentes base repintados)
  src/lib/formatPtBr.ts          (+ testes)
  src/lib/contrast.test.ts       (teste de contraste dos tokens)
  src/app/ e src/features/       (telas)
backend/node/src/modules/auth/auth.emails.ts
backend/node/src/modules/scales/scales.report.ts, scales.controller.ts
specs/ e README (nome do produto)
```

## Riscos e cuidados
- Laranja só em ações, marca e destaques; nunca em séries de dados (regra do guia). Revisar `StackedBar` (direto/indireto) e a grade da escala para não usar laranja.
- Os quatro tons semânticos e o par de cenário precisam passar 4,5:1 também no escuro; o teste de contraste cobre.
- Fontes pesam mais que a Inter: importar só os pesos usados.
- O relatório em Excel e os e-mails têm testes que citam textos; atualizar junto.

## Verificação
Tipos, lint, formatação e testes (tela e API); `scripts/validar-frontend.sh`; imagens das telas em 1440 e 390 px, nos temas claro e escuro, antes de concluir cada bloco de telas; busca por `#006FF7` e pelas classes Alquimia sem resultado.
