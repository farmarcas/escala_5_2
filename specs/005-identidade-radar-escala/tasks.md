---

description: "Tarefas: Identidade visual Radar Escala"
---

# Tasks: Identidade visual Radar Escala

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Skills**: `component-development` + `styling-tailwind` (tela), `node-api-development` (e-mails e relatório).
**Regra**: cada bloco termina com conferência visual (1440 e 390 px, claro e escuro) e todos os testes verdes.

## Bloco 1: Fundação
- [x] T001 Instalar `@fontsource/rubik`, `@fontsource/ibm-plex-sans` e `lucide-react`; remover `@fontsource-variable/inter`
- [x] T002 `globals.css`: tokens da marca, tokens semânticos claro e escuro, `@theme` apontando para eles, fontes, `tabular-nums`, foco laranja; remover a paleta Alquimia
- [x] T003 [P] `src/lib/contrast.test.ts`: lê os pares de cor dos tokens (claro e escuro) e exige 4,5:1 para texto pequeno
- [x] T004 [P] `src/lib/formatPtBr.ts` + testes: `formatDelta` (U+2212 e unidade), `formatSignedBRL`, `formatHours`, `formatRange` ("07:00 às 22:00"), `formatPP`
- [x] T005 [P] Marca: copiar logotipos Farmarcas para `src/assets/brand/`; `Symbol.tsx` (tons e versão simplificada), `Logo.tsx` (horizontal, escuro, endossada); `public/favicon.svg`; `index.html` (título "Radar Escala", descrição, ícone)

## Bloco 2: Componentes base
- [x] T006 `Icon.tsx` (Lucide 16/20/24, traço 2) e `ScenarioTag.tsx` (Atual e 5x2)
- [x] T007 Button (5 variantes, 3 alturas), `fieldStyles`, TextField, NumberField, SelectField, Checkbox, FieldShell, SliderField
- [x] T008 Modal, FormMessage (alerta com título, texto e ação), EmptyState, Skeleton
- [x] T009 StatusPill e StatusBadge (4 tons semânticos), Tabs, Stepper, SegmentedControl, DaySelector
- [x] T010 KpiCard no formato "Atual → 5x2 + variação neutra", BarCompare e StackedBar com as cores de cenário (sem laranja)
- [x] T011 Conferência visual do bloco 2 feita nas próprias telas (as páginas reais usam todos os componentes), claro e escuro

## Bloco 3: Telas
- [x] T012 Cabeçalho e moldura (`Header`, `PageShell`, `AccountMenu`) com `Logo` e ícones
- [x] T013 Entrada, cadastro, confirmação de e-mail, recuperação e redefinição de senha (`AuthCard` e formulários) no formato do guia, com painel escuro no desktop
- [x] T014 Lista de lojas: card de loja com barra de 7 segmentos; estado vazio e exclusão
- [x] T015 Cadastro da loja em passos: stepper, formulários, resumo ao vivo, cartão do dono, cartão de função
- [x] T016 Diagnóstico: cartões "Atual → 5x2", etiquetas de cenário, tabelas, barras, alertas e vendas com `formatDelta` e demais formatos
- [x] T017 Escala de 4 semanas: grade em tons de Azul Turno, folga em neutro, legenda, visão do celular
- [x] T018 Regras aplicadas, conta, política de privacidade e demais telas
- [x] T019 Revisão do tom de voz: percorrer todas as mensagens do frontend, aplicar o guia e registrar a lista antes e depois no fim deste arquivo

## Bloco 4: API e documentos
- [x] T020 `auth.emails.ts` (assunto e texto) e testes que citam os textos
- [x] T021 `scales.report.ts` (cores, autor) e `scales.controller.ts` (nome do arquivo `radar-escala-...xlsx`); atualizar o teste de integração
- [x] T022 README, `specs/004-painel-de-escalas` (nome do produto) e `specs/002-identidade-visual-alquimia` marcada como substituída

## Bloco 5: Verificação final
- [x] T023 Tipos, lint, formatação e todos os testes (tela e API, integração incluída); `scripts/validar-frontend.sh`
- [x] T024 Busca por `#006FF7`, classes `rp-`, `da-`, `mi-`, `li-`, `wa-`, `su-`, `at-` e "Painel de Escalas" sem resultado indevido
- [x] T025 Imagens de todas as telas em 1440 e 390 px, claro e escuro; conferir rolagem lateral e foco visível; `sync-templates`; commit

## Dependências
Bloco 1 → 2 → 3; bloco 4 pode andar em paralelo com o 3; bloco 5 por último. T003, T004 e T005 podem andar em paralelo com T002.

## Revisão do tom de voz (T019): antes e depois
| Onde | Antes | Depois |
| --- | --- | --- |
| Entrada, descrição | Acesse o modo detalhado, por loja. | Use o e-mail da sua conta para ver a escala 5x2 de cada loja. |
| Lista de lojas, título e descrição | Painel de Escalas 5x2 · Veja quantas pessoas cada loja precisa e quanto custa a nova escala. | Suas lojas · Veja quantos colaboradores cada loja precisa na escala 5x2 e quanto isso custa por mês. |
| Lista de lojas, estado vazio | Você ainda não cadastrou nenhuma loja | Cadastre sua primeira loja |
| Card de loja, botão | Abrir | Ver resultado |
| Diagnóstico, destaque | Para cumprir a 5x2 · 42h, esta loja precisa contratar N pessoas. | Na 5x2 · 42h, esta loja precisa de N colaboradores a mais. |
| Diagnóstico, título | Diagnóstico e custos | Resultado da escala 5x2 |
| Pedido de consultor, botão e aviso | Enviar · Solicitação registrada! | Pedir contato · Pedido de contato registrado. |
| Recuperação de senha, botão | Enviar link | Receber link por e-mail |
| Cadastro concluído | Clique nele para ativar a conta… · Ir para a entrada | Abra o link para ativar a conta… · Entrar na conta |
| Erro genérico | Algo deu errado. Tente de novo em instantes. | Não conseguimos concluir agora. Tente de novo em instantes. |
| E-mails da conta | calculadora da Farmarcas · Olá, Nome! | Radar Escala · Olá, Nome. |
