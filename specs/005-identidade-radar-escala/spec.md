# Feature Specification: Identidade visual Radar Escala

**Feature Branch**: `feat/identidade-radar-escala` | **Created**: 2026-10-23 | **Status**: Implementada em 23/10/2026 (aprovada pela pessoa)
**Fonte**: pacote "Identidade visual Radar Escala" (guia de identidade 1.0 e telas-chave), enviado pelo responsável do produto. **Substitui**: [spec 002](../002-identidade-visual-alquimia/spec.md) (paleta Alquimia).

## O que muda para a pessoa
O produto passa a se chamar **Radar Escala** e ganha a identidade do guia: símbolo do radar, laranja Farmarcas como cor da marca e das ações, Azul Turno como cor do cenário 5x2, fontes Rubik (títulos) e IBM Plex Sans (interface e números), tema claro e escuro e o tom de voz "de dono para dono". Nenhuma regra de negócio, número ou cálculo muda.

Decisões da pessoa (22–23/10/2026): aplicar **só a identidade** nas telas que já existem (as telas novas do pacote ficam para depois) e trocar o nome do produto em tudo.

## Requisitos
- **FR-001 Nome e logotipo**: o produto se chama "Radar Escala" no cabeçalho, no título da aba, nas telas de entrada e cadastro, na política de privacidade, nos e-mails da conta, no relatório em Excel e nos textos. O logotipo horizontal é o símbolo (anel de 5 blocos, 2 pontos e agulha) com "Radar" em Rubik Medium e "Escala" em Rubik ExtraBold. Versões: clara, escura (fundo escuro), endossada com "uma solução Farmarcas" (entrada e materiais externos) e reduzida sem agulha para favicon e tamanhos abaixo de 24 px.
- **FR-002 Cores**: laranja Farmarcas `#FF5510` na marca, no símbolo e em títulos grandes; Laranja Ação `#CC3D00` (hover `#A83200`) em botões primários, links e texto laranja de interface; Azul Turno `#3B4FC4` no cenário 5x2, em informação, seleção e na grade de horários; apoio Laranja 50 `#FFF2EC`, Laranja 100 `#FFDFD1`, Azul 100 `#DDE2F8`, Azul 700 `#26338A`; neutros 0 a 900 do guia (Neutro 500 `#6B6763`); semânticas positivo, atenção, crítico e informativo nos pares claro e escuro do guia.
- **FR-003 Cenários nos gráficos**: cenário atual sempre em grafite (`#8A8580`, escuro `#9A958F`) e cenário 5x2 sempre em Azul Turno (`#3B4FC4`, escuro `#7F8FF0`). O laranja não entra em séries de dados. Atual vem antes do 5x2, lado a lado.
- **FR-004 Tema claro e escuro**: os tokens por tema do guia (fundo, superfície, superfície sutil, borda, texto principal, secundário e auxiliar, ação, link e foco) valem nos dois temas; o tema segue a preferência do aparelho.
- **FR-005 Tipografia**: Rubik 500/600/800 nos títulos e IBM Plex Sans 400/500/600 na interface; números sempre com algarismos tabulares. Escala de estilos do guia: Display, Título 1 a 3, Corpo, Corpo pequeno, Rótulo, Legenda, Sobretítulo, Número KPI e Número em tabela. As fontes são entregues pela própria aplicação (sem pedir arquivos a sites de terceiros).
- **FR-006 Componentes**: raio de 8 px em controles e 12 px em cards; campos com borda de 1 px e foco com contorno laranja e halo Laranja 100; botões primário, secundário, contorno e discreto, em alturas de 44, 36 e 32 px, com um botão primário por tela; selos de status em pílula e etiquetas de cenário quadradas; etapas e alternância de cenário; alertas com título, texto e ação; cards de loja com a barra de 7 segmentos dos dias de funcionamento; tabelas com números à direita e em tabular.
- **FR-007 Ícones**: Lucide com traço de 2 px e pontas arredondadas, em 16 px (tabela), 20 px (interface) e 24 px (navegação), sempre na cor do texto ao lado.
- **FR-008 Formato dos números e horários**: moeda como `R$ 46.200` em destaques e `R$ 46.200,00` em tabelas; variação sempre com sinal, com o sinal de menos verdadeiro (−, U+2212) e a unidade (`+2 colaboradores`, `−52 h`); horário como `07:00 às 22:00` nos textos; porcentagem com vírgula e diferença em `p.p.`.
- **FR-009 Tom de voz**: textos em segunda pessoa, frases curtas, número antes do adjetivo, verbo no botão (nunca "Enviar" ou "OK"), todo alerta com um próximo passo, sem exclamação e sem dramatizar. As mensagens existentes são revisadas com esse guia.
- **FR-010 Relatório em Excel**: cabeçalhos e títulos nas cores da marca, nome do produto no arquivo e no autor.
- **FR-011 Acessibilidade e celular**: contraste mínimo de 4,5:1 para texto pequeno nos dois temas; foco visível; sem rolagem lateral da página no celular (390 px) nem na tela larga.
- **FR-012 Sem mudança de comportamento**: rotas, regras, cálculos e textos de negócio permanecem; todos os testes seguem passando.

## Fora desta versão
Telas novas do pacote: painel resumo de todas as lojas, mapa de cobertura por faixa de horário, simulações salvas, comparação de simulações e exportação em PDF. Elas pedem funções que o produto não tem hoje e entram em uma spec própria, se forem escolhidas.

## Critérios de sucesso
- **SC-001**: 100% das telas existentes (entrada, cadastro, recuperação de senha, conta, privacidade, painel, cadastro da loja em passos, diagnóstico, escala e regras) com a paleta, as fontes e os componentes novos, sem sobras do azul Alquimia (`#006FF7`).
- **SC-002**: contraste de pelo menos 4,5:1 em todo texto pequeno, nos temas claro e escuro, conferido por teste automatizado nos pares de cor do guia.
- **SC-003**: conferência visual com imagens em largura de computador (1440 px) e de celular (390 px), nos dois temas, nas telas principais.
- **SC-004**: tipos, lint, formatação e todos os testes verdes; nenhum arquivo de fonte vem de site de terceiros em tempo de execução.

## Premissas e decisões do agente
- Os tokens do guia viram variáveis do Tailwind em `globals.css`, no mesmo esquema da spec 002, e substituem a paleta Alquimia (que sai). Motivo: o guia redefine marca, ação e escalas.
- Fontes: `@fontsource/rubik` e `@fontsource/ibm-plex-sans` (autohospedadas), como já era feito com a Inter.
- Ícones: `lucide-react` (pacote público, só os ícones usados entram no pacote final).
- O símbolo e os logotipos do pacote são copiados para `frontend/react/src/assets/brand/` e usados como componentes React (símbolo com tom claro, escuro, preto e branco, versão simplificada abaixo de 24 px).
- Tema escuro: segue `prefers-color-scheme` por padrão. Depois da implementação a pessoa pediu para poder testar o tema claro: o cabeçalho ganhou um botão que alterna automático, claro e escuro, e a escolha fica guardada só no navegador (`radar-escala-tema`).
- Os textos de e-mail da conta passam a falar em Radar Escala; o remetente (`MAIL_FROM`) é configuração de ambiente e não muda por código.
- Pontos do guia que dependem de telas ainda inexistentes (cobertura em porcentagem, horas extras por mês como destaque, seletor de loja com busca) não são criados aqui.
