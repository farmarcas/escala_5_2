# Feature Specification: Identidade visual do Alquimia na calculadora

**Feature Branch**: `feat/identidade-visual-alquimia` | **Created**: 2026-10-22 | **Status**: SUBSTITUÍDA pela [spec 005 (Radar Escala)](../005-identidade-radar-escala/spec.md)

## O que muda para a pessoa
A calculadora passa a ter a identidade visual do design system da Farmarcas (Alquimia): mesmas cores, mesma fonte (Inter) e o mesmo desenho de botões, campos e selos. Nenhuma regra de negócio muda.

## Requisitos
- **FR-001**: Todas as telas usam a paleta do Alquimia (azul `#006FF7` como cor principal, escala de cinzas, vermelho de erro, amarelo de alerta, verde de sucesso) e a fonte Inter.
- **FR-002**: Botões, campos de texto, selos e o cabeçalho seguem o desenho do Alquimia (cantos, pesos, estados de foco, hover e desativado).
- **FR-003**: O relatório em PDF usa as mesmas cores.
- **FR-004**: O contraste do texto continua legível (mínimo de 4,5:1 para texto pequeno).
- **FR-005**: Nada muda no comportamento, nos números nem nos textos; todos os testes seguem passando.
- **FR-006**: A fonte é entregue pela própria aplicação (sem pedir arquivos a sites de terceiros), por privacidade e para funcionar sem internet.

## Fora desta versão
Usar os componentes reais (`alq-button`, `alq-field`): dependem de o pacote estar publicado e acessível no GitHub Packages da Farmarcas, e cobrem só botão e campo. Será avaliado quando houver acesso.

## Critérios de sucesso
- **SC-001**: 100% das telas com a nova paleta e fonte, sem sobras da cor verde antiga.
- **SC-002**: Texto pequeno com contraste de pelo menos 4,5:1 nas combinações usadas.
- **SC-003**: Testes, lint e tipos verdes; telas sem rolagem lateral no celular.

## Premissas
- Decisão (agente): copiar a paleta e o desenho do Alquimia como tokens do nosso Tailwind, em vez de instalar o pacote privado. Motivo: funciona hoje, cobre todos os elementos (inclusive os que o Alquimia não tem) e troca fácil depois.
- Decisão (agente): fonte Inter pelo pacote `@fontsource-variable/inter` (autohospedada).
- Onde o Alquimia não tem componente (seletor, caixa de marcar, diálogo, controle deslizante, tabela), mantemos o nosso, pintado com a mesma paleta.
