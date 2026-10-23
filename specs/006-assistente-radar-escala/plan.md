# Plano de implementação: Análise com IA no diagnóstico

**Spec**: [spec.md](spec.md) | **Escopo**: módulo novo na API (`modules/assistant`), uma tela de painel no diagnóstico e configuração por ambiente. Sem mudança de banco, sem gravar conversa, sem mudar o motor.

## Resumo
Um endpoint `POST /api/v1/assistant/analyze`, com sessão obrigatória, recebe a loja, o cenário e (opcionalmente) o pedido da pessoa. O servidor monta o contexto **sem dados pessoais**, chama o modelo com **ferramentas só de leitura e cálculo** e devolve a resposta em fluxo (SSE). As ferramentas reaproveitam o motor que já existe; a simulação roda numa cópia validada pelo mesmo esquema do cadastro e nunca grava. O frontend mostra o texto aos poucos e, ao lado, **cartões de cenário** montados com os números que o motor devolveu (não com os que o modelo escreve).

## Decisões técnicas (e por quê)
1. **SDK oficial `@anthropic-ai/sdk`** com laço manual de ferramentas e `client.messages.stream()` + `finalMessage()`. Laço manual (e não o executor beta) para controlar limite de iterações, cancelamento e o que sobe para a tela. O conteúdo da resposta do modelo (inclusive blocos de raciocínio) volta inteiro no histórico a cada volta do laço.
2. **Modelo**: `ASSISTANT_MODEL`, padrão `claude-sonnet-5-5` (decisão aprovada na spec; `claude-opus-5-5` é a alternativa de maior qualidade, trocando só a variável). Nível de esforço `medium` (equilíbrio de qualidade e tempo; ajustável por `ASSISTANT_EFFORT`). Raciocínio adaptativo (não se envia `thinking`). **Sem `tool_choice` forçado** (esse modelo rejeita); as ferramentas usam `strict: true` e o prompt manda chamar a ferramenta.
3. **Segurança de recusa**: se `stop_reason` for `refusal`, a tela mostra mensagem amigável; o desvio automático para outro modelo (`fallbacks`) é avaliado na tarefa T022 e entra se o SDK instalado tipar o campo.
4. **Cache de prompt**: instruções, estrutura da resposta e lista de regras aplicadas formam um bloco fixo (`cache_control: ephemeral`) antes do contexto da loja. Conferimos `cache_read_input_tokens` nos registros técnicos.
5. **Ferramentas (todas somente leitura ou cálculo)**: `ler_diagnostico`, `ler_escala_resumida`, `ler_regras_aplicadas`, `simular_mudanca`. A simulação aceita uma lista fechada de mudanças tipadas (horário e dias, almoço, lanche, folga dominical, plantão, feriados, quantidade, salário e 12x36 por função, faixa de cobertura por função, vendas e meta), aplica numa cópia profunda, valida com `scaleStoreSchema` e roda `diagnose`. Máximo de 6 simulações por análise. Nenhuma ferramenta recebe `groupId` do modelo: a loja vem da sessão e do corpo validado.
6. **Dados enviados ao modelo** passam por `toModelStore()`: sem nome, cidade, UF, nome do grupo, e-mail, telefone nem identificadores; só quadro, salários, horários, regras, plantão, feriados (datas) e vendas. Teste automatizado falha se uma dessas chaves aparecer.
7. **Números só do motor**: após a resposta final, uma verificação extrai os números do texto e compara com o conjunto de números devolvidos pelas ferramentas naquela análise. Se houver número sem origem, o servidor faz **uma** nova volta pedindo para refazer só com números das ferramentas; persistindo, a resposta sai com o aviso "Alguns números abaixo não vieram do cálculo". O mesmo utilitário é o teste do critério SC-001.
8. **Transporte**: SSE por `POST` (o navegador lê o fluxo com `fetch`). Eventos: `text` (pedaço de texto), `tool` (status curto, por exemplo "Calculando um cenário"), `scenario` (resultado estruturado de uma simulação), `done` (fim, com aviso se houver) e `error`. O servidor cancela o modelo se a pessoa fecha o painel.
9. **Limite técnico**: `rateLimitWith` por conta (padrão 20 pedidos em 10 minutos, `ASSISTANT_RATE_MAX` e `ASSISTANT_RATE_WINDOW_MS`), tamanho máximo do texto do pedido (1.000 caracteres), no máximo 6 voltas de ferramenta e `max_tokens` de 4.000 por volta.
10. **Disponibilidade**: `GET /api/v1/assistant/status` devolve `{ enabled }` (chave configurada). O botão só aparece com `enabled: true`. Sem chave, nada muda no app.
11. **Registro técnico**: só conta (identificador interno), loja (identificador), ferramentas usadas, tokens (entrada, saída, cache), tempo e resultado. Nunca o texto do pedido nem da resposta.
12. **Frontend**: pasta `features/assistant/` com `useAnalysis` (leitura do fluxo SSE com `fetch`), `AssistantPanel` (modal lateral, tela cheia no celular), cartões de cenário, sugestões de pergunta e campo de texto. O texto é renderizado por um renderizador mínimo (títulos, listas, negrito) em componentes React, **sem `dangerouslySetInnerHTML`**. Os atalhos "Onde mudar" saem de uma tabela fixa (tipo de mudança → passo do cadastro), nunca do texto do modelo.
13. **Simulação sem efeito**: o teste de integração confirma que `simular_mudanca` não chama `update` nem `create` do repositório e que a loja segue igual depois.

## Estrutura (arquivos novos ou alterados)
```
backend/node/
  src/config/env.ts                 (+ ANTHROPIC_API_KEY, ASSISTANT_MODEL, ASSISTANT_EFFORT, ASSISTANT_RATE_*)
  src/app.ts                        (registra /api/v1/assistant com sessão)
  src/modules/assistant/
    assistant.routes.ts / .controller.ts / .schemas.ts
    assistant.service.ts            (laço do modelo, SSE, verificação de números)
    assistant.prompt.ts             (instruções fixas, tom de voz, estrutura, regras)
    assistant.tools.ts              (definições e execução das 4 ferramentas)
    assistant.changes.ts            (mudanças tipadas e aplicação em cópia)
    assistant.sanitize.ts           (toModelStore)
    assistant.numbers.ts            (extração e conferência de números)
    assistant.model-client.ts       (interface e versão real do SDK; versão falsa nos testes)
    *.test.ts / *.integration.test.ts
  package.json                      (+ @anthropic-ai/sdk)
.env.example, docker-compose.yml    (variáveis novas, sem valor)
frontend/react/src/features/assistant/
  useAnalysis.ts, AssistantPanel.tsx, ScenarioCard.tsx, MiniMarkdown.tsx, steps.ts
frontend/react/src/features/scales/components/DiagnosticScreen.tsx   (botão "Analisar com IA")
specs/ e README
```

## Riscos e cuidados
- **Injeção de instruções**: o texto digitado e qualquer campo da loja são dados. Vão na mensagem do usuário, nunca no bloco de instruções; as ferramentas têm campos e limites fixos; nenhuma ferramenta escreve. Conjunto de testes de injeção.
- **Custo sem teto mensal**: o limite técnico por conta contém laços e abuso; o registro de tokens permite acompanhar o gasto real. Revisitar quando houver uso real.
- **Respostas erradas sobre lei**: a lista de regras aplicadas é a única fonte; fora dela a resposta é "não tenho essa informação".
- **Tempo**: o modelo pode encadear várias simulações; o limite de 6 e o `effort` médio mantêm a resposta em até cerca de 20 segundos.
- **Chave**: só em `.env` do servidor; nunca no repositório, no front ou no chat.

## Verificação
Tipos, lint, formatação e testes (tela e API, integração incluída); testes novos do assistente com o modelo simulado (conjunto de perguntas, injeção, dados pessoais, ferramentas somente leitura, sem chamada ao abrir a tela, números rastreáveis); roteiro manual com o modelo real e leitura por 3 pessoas leigas; imagens do painel em 1440 e 390 px, nos dois temas.
