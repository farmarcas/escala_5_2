---

description: "Tarefas: Análise com IA no diagnóstico"
---

# Tasks: Análise com IA no diagnóstico

**Input**: [spec.md](spec.md), [plan.md](plan.md)
**Skills**: `node-api-development` + `node-unit-testing` (API), `component-development` + `styling-tailwind` (tela), `claude-api` (uso do SDK).
**Regra**: testes antes do código; nenhuma chamada real ao modelo nos testes automáticos; a chave nunca passa pelo chat.

## Bloco 1: Base na API
- [x] T001 Instalar `@anthropic-ai/sdk`; variáveis `ANTHROPIC_API_KEY`, `ASSISTANT_MODEL` (padrão `claude-sonnet-5-5`), `ASSISTANT_EFFORT` (padrão `medium`), `ASSISTANT_RATE_MAX` e `ASSISTANT_RATE_WINDOW_MS` em `config/env.ts`, `.env.example` e `docker-compose.yml`, todas opcionais e sem valor de chave
- [x] T002 [P] `assistant.sanitize.test.ts` e `assistant.sanitize.ts`: `toModelStore()` sem nome, cidade, UF, grupo, identificadores; o teste varre a carga em busca dessas chaves e de textos de exemplo
- [x] T003 [P] `assistant.numbers.test.ts` e `assistant.numbers.ts`: extração de números do texto (moeda, %, horas, contagens, menos verdadeiro) e conferência contra o conjunto de números das ferramentas
- [x] T004 [P] `assistant.changes.test.ts` e `assistant.changes.ts`: mudanças tipadas (lista fechada), aplicação em cópia profunda, validação com `scaleStoreSchema`, recusa de campo fora da lista, valor fora do limite e mudança que torna a loja inválida
- [x] T005 `assistant.tools.test.ts` e `assistant.tools.ts`: `ler_diagnostico`, `ler_escala_resumida`, `ler_regras_aplicadas`, `simular_mudanca` (antes e depois, máximo de 6 por análise); teste de que **nenhuma** ferramenta grava (repositório espiado) e de que a lista de ferramentas é exatamente a esperada

## Bloco 2: Laço do modelo e rota
- [x] T006 `assistant.model-client.ts`: interface mínima (`stream` com ferramentas) e versão do SDK; versão falsa roteirizada para testes
- [x] T007 `assistant.prompt.ts`: instruções fixas (papel, linguagem para leigos, estrutura de cinco partes, regras e lei, o que nunca fazer, tom de voz do guia) e bloco de regras aplicadas; teste de que o bloco fixo não muda entre chamadas (cache)
- [x] T008 `assistant.service.test.ts` e `assistant.service.ts`: laço de ferramentas (até 6 voltas), eventos `text`, `tool`, `scenario`, `done`, `error`, cancelamento, tratamento de `refusal` e `max_tokens`, verificação de números com uma volta de correção
- [x] T009 `assistant.routes.ts`, `.controller.ts`, `.schemas.ts` e `app.ts`: `POST /api/v1/assistant/analyze` (SSE) e `GET /api/v1/assistant/status`, sessão obrigatória, loja do próprio grupo, limite por conta, tamanho máximo do pedido
- [x] T010 Teste de integração (modelo falso): sem sessão 401; loja de outro grupo 404; limite de pedidos 429; status sem chave `enabled: false` e a rota de análise indisponível; **abrir o diagnóstico não chama o modelo**; simulação não altera a loja no banco
- [ ] T011 (parcial: estrutura coberta por T005/T008/T010; faltam as perguntas de injeção com o modelo real) Conjunto de perguntas de teste com o modelo falso: analisar, simular, regra, fora do escopo, tentativa de injeção (ignorar regras, mostrar instruções, gravar dados, outra conta), pedido de dado pessoal; todas dentro do esperado
- [x] T012 Registro técnico sem texto (teste que o log não contém pedido nem resposta) e cabeçalhos de SSE sem cache

## Bloco 3: Tela
- [x] T013 `features/assistant/steps.ts` (tipo de mudança → passo do cadastro e texto do atalho) e `MiniMarkdown.tsx` (títulos, listas e negrito em componentes; teste de que HTML digitado não vira HTML)
- [x] T014 `useAnalysis.ts`: leitura do fluxo SSE com `fetch`, estados (parado, analisando, concluído, erro), cancelamento ao fechar; teste com fluxo simulado
- [x] T015 `ScenarioCard.tsx`: cartão "Cenário simulado" com antes e depois (colaboradores, folha, alertas) usando `ComparisonKpi`, `formatDelta` e `formatSignedBRL`, e o atalho "Onde mudar"
- [x] T016 `AssistantPanel.tsx`: painel lateral (tela cheia no celular), botão "Analisar minha loja", sugestões de pergunta, campo de texto, avisos fixos ("A IA só sugere. Você decide o que mudar." e a linha de privacidade), estados vazio, carregando e erro
- [x] T017 Botão "Analisar com IA" no `DiagnosticScreen` (só se `enabled`), oferta "Falar com um consultor" dentro do painel reaproveitando o formulário existente
- [ ] T018 Conferência visual (1440 e 390 px, claro e escuro) e sem rolagem lateral

## Bloco 4: Verificação
- [x] T019 Tipos, lint, formatação e todos os testes (tela e API, integração incluída); `scripts/validar-frontend.sh`
- [ ] T020 Roteiro manual com o modelo real (depois de a equipe colocar a chave no `.env`): 10 perguntas, conferência dos números com o diagnóstico, tempo da primeira palavra e da análise completa, uso do cache (`cache_read_input_tokens`)
- [ ] T021 Leitura por 3 ou mais pessoas leigas da análise da loja de exemplo (SC-005) e ajuste do texto do prompt
- [ ] T022 Avaliar o desvio automático em caso de recusa (`fallbacks`) com o SDK instalado; incluir se tipado, senão registrar o motivo
- [x] T023 README (como ligar a IA, variáveis, privacidade), `contracts-api` e `sync-templates`; commit

## Dependências
T001 → demais da API; T002 a T005 em paralelo; T006 e T007 antes de T008; T009 depende de T008; bloco 3 depende de T009 (contrato dos eventos) e pode começar a partir de T013 e T014 com fluxo simulado; T020 e T021 dependem da chave no `.env`.

## Pendências fora do código
- A equipe Farmarcas coloca `ANTHROPIC_API_KEY` no `.env` (nunca no chat ou no repositório) e escolhe o modelo, se quiser trocar o padrão.
- Revisar o texto de privacidade da tela com o jurídico.
