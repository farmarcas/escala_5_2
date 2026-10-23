---

description: "Tarefas: impacto a partir do quadro atual da loja e acesso só com login"
---

# Tasks: Impacto a partir do quadro atual da loja e acesso só com login

**Input**: [spec.md](spec.md), [plan.md](plan.md), [quickstart.md](quickstart.md); base: specs/001-calculadora-impacto-escala
**Tests**: incluídos, testes antes do código (ver falhar, depois implementar).
**Skills**: ler antes de mexer: `schema-design` + `migrations` (banco), `node-api-development` + `node-unit-testing` (API), `component-development` + `styling-tailwind` (tela).

## Format: `[ID] [P?] [Story] Descrição com caminho`

---

## Phase 1: Banco (aditivo)

- [ ] T001 Em `backend/node/prisma/schema.prisma`: criar `enum StoreSize { pequena media grande }`, `Store.size StoreSize?` e `StoreRole.minPerShift Int?`
- [ ] T002 Gerar a migration com `prisma migrate diff`, revisar o SQL (só `ADD COLUMN`, `CREATE TYPE` e `DROP NOT NULL`; os `CHECK` existentes seguem valendo), aplicar e confirmar que não há divergência; pasta nova em `backend/node/prisma/migrations/`

## Phase 2: Cadastro da loja na API (bloqueia as histórias)

- [ ] T003 [P] Atualizar `backend/node/src/modules/stores/stores.schemas.test.ts`: tamanho obrigatório na criação; `minPerShift` opcional e nulo; farmacêutico exige `headcount ≥ 1`; se o mínimo vier, farmacêutico exige `≥ 1`
- [ ] T004 [P] Atualizar `backend/node/src/modules/stores/stores.routes.integration.test.ts` e `backend/node/src/test-utils/auth-helper.ts`: loja com tamanho, sem mínimo, loja antiga com `size: null`, `PATCH` do tamanho
- [ ] T005 Atualizar `stores.schemas.ts`, `stores.repository.ts` e `stores.service.ts`: `size` (criar e editar), `minPerShift` nulo, resposta com `size`
- [ ] T006 Atualizar os testes de integração que criam lojas (`simulations.*.integration.test.ts`) para enviar `size`; rodar a API e deixar verde antes de seguir

**Checkpoint**: a API cadastra loja com tamanho e sem mínimo por turno.

---

## Phase 3: US0 - Acesso só com login (P1)

**Teste independente**: roteiro 0 do [quickstart.md](quickstart.md) (abrir `/` sem login cai na entrada; premissas e contato sem sessão dão 401).

### Testes primeiro
- [ ] T007 [P] [US0] Atualizar `backend/node/src/modules/premises/premises.routes.integration.test.ts`: sem sessão `401`; com sessão devolve só `taxation` e `detailed` (sem `quick`)
- [ ] T008 [P] [US0] Atualizar `backend/node/src/modules/contacts/contacts.routes.integration.test.ts`: exige sessão; nome, e-mail e empresa vêm da conta; sem campo isca; duplo envio grava uma vez; limite por IP; `mode` só `detalhado`; consulta da equipe e anonimização continuam passando

### Implementação (API)
- [ ] T009 [US0] `premises.routes.ts`: exigir sessão (`app.ts` injeta `requireSession`); remover o bloco `quick` de `config/premises.ts` e do tipo `Premises`
- [ ] T010 [US0] `contacts.schemas.ts`, `contacts.controller.ts`, `contacts.service.ts`, `contacts.routes.ts`: exigir sessão, usar `principal` para nome, e-mail e empresa, remover `website` e `name`/`email`/`company` do corpo; `source` só `consultor`, `mode` só `detalhado`

### Implementação (tela)
- [ ] T011 [US0] Remover o modo rápido: apagar `frontend/react/src/features/quick-calculator/`, `app/RapidoPage.tsx`, `lib/quickImpact*`, `lib/buildSummaryText*`, `lib/describeQuickResult*`, `lib/quickLabels.ts`, `buildQuickReport` (e testes), e o bloco `quick` de `lib/premisesTypes.ts` e do `__fixtures__/premises.ts`
- [ ] T012 [US0] `app/routes.tsx` e novo `app/HomeRedirect.tsx`: `/` redireciona (sem sessão `/entrar`; com sessão `/lojas`); cabeçalho mostra "Entrar" e "Criar conta" só sem sessão; depois de entrar vai para "Minhas lojas"
- [ ] T013 [US0] `features/contact/`: `ContactFormModal` com cargo, telefone, setor e aceite (nome, e-mail e empresa só para conferência), sem campo isca e sem fluxo de PDF; ajustar `contactForm.ts` e seu teste
- [ ] T014 [US0] `SimulationScreen.tsx`: PDF e CSV baixam direto, botão "Falar com um consultor" usa o novo formulário
- [ ] T015 [US0] README e textos: tirar o "modo rápido" e o link público; página de privacidade continua aberta
- [ ] T016 [US0] Conferir o roteiro 0 no navegador

## Phase 4: US1 - Impacto a partir do quadro atual (P1) 🎯

**Teste independente**: roteiro 1 do quickstart (1,2 equivalentes, ≈ R$ 78,5 mil proporcional, 2 contratações inteiras ≈ R$ 219 mil).

### Testes primeiro
- [ ] T017 [P] [US1] `backend/node/src/modules/simulations/impact.calculator.test.ts`: modo quadro atual (farmacêutico 2×0,1 = 0,2; balconista 10×0,1 = 1,0; sem efeito da ausência), jornada ≤ 40 sem impacto, custo proporcional e inteiras, totais, ranking pelo proporcional, mitigação sobre o proporcional, regime tributário, 200 lojas
- [ ] T018 [P] [US1] `simulations.preview.integration.test.ts`: preview com loja sem mínimo, campos novos no resultado, isolamento entre grupos mantido

### Implementação
- [ ] T019 [US1] `impact.calculator.ts`: `minPerShift` nulo = cobertura constante; campos novos de função, loja e total (equivalentes, custo proporcional, líquido e residual proporcionais, economia proporcional); ranking pelo proporcional
- [ ] T020 [US1] `simulations.service.ts`, `simulations.repository.ts` e resumos (lista e comparação): tamanho no snapshot da loja e totais novos
- [ ] T021 [P] [US1] Tela, tipos e textos: `features/simulations/types.ts` (campos novos opcionais) e `describeResult.ts` com teste (`describeResult.test.ts`): métricas e linhas por função com equivalentes e custo proporcional
- [ ] T022 [P] [US1] `features/stores/storeForm.ts` com teste (`storeForm.test.ts` atualizado): tamanho obrigatório, `minPerShift` opcional, validações do plano, conversão para e do pedido
- [ ] T023 [US1] Formulário e lista: `StoreForm.tsx`, `RolesEditor.tsx` ("Pessoas hoje" em destaque, mínimo em "Opções avançadas"), `StoreListItem.tsx` (selo do tamanho) e `types.ts`
- [ ] T024 [US1] Resultado: `GroupTotals.tsx`, `StoreImpactTable.tsx`, `StoreRanking.tsx` e `SimulationResultView.tsx` mostrando custo proporcional, equivalentes e contratações inteiras
- [ ] T025 [US1] Conferir o roteiro 1 no navegador

## Phase 5: US2 - Mínimo opcional e explicação do zero (P2)

**Teste independente**: roteiro 2 do quickstart.

- [ ] T026 [P] [US2] Testes do calculador para `zeroReason` (`jornada_ate_40`, `folga`, `sem_impacto`), `slackHours` e `coverageMode`
- [ ] T027 [US2] Implementar `zeroReason`, `slackHours` e `coverageMode` em `impact.calculator.ts`
- [ ] T028 [US2] Frases de explicação em `describeResult.ts` (com teste) e na `StoreImpactTable.tsx`; "Opções avançadas" do `RolesEditor.tsx` com o texto "Quantas pessoas precisam estar juntas na loja (opcional)"
- [ ] T029 [US2] Conferir o roteiro 2 no navegador

## Phase 6: US3 - Relatórios e compatibilidade (P2)

**Teste independente**: roteiro 3 do quickstart.

- [ ] T030 [P] [US3] Testes de `reportModel.test.ts` e `storesCsv.test.ts`: tamanho, equivalentes, custo proporcional e inteiras; simulação antiga (sem campos novos) segue gerando relatório
- [ ] T031 [US3] `reportModel.ts`, `storesCsv.ts` e `buildPdf.ts` (tabela por função reorganizada)
- [ ] T032 [US3] Compatibilidade: lista, detalhe e comparação de simulações salvas mostram o proporcional quando existir e não quebram quando não existir; loja antiga com "não informado"
- [ ] T033 [US3] Conferir o roteiro 3 no navegador

## Phase 7: Fechamento

- [ ] T034 [P] Atualizar `specs/001-calculadora-impacto-escala/contracts/api.md`, `data-model.md`, `quickstart.md` e a nota de alteração na spec 001 (tamanho, `minPerShift` nulo, campos novos do resultado, sem modo rápido, contato e premissas com login)
- [ ] T035 Rodar tudo: lint, tipos, testes unitários e de integração (API e tela), `scripts/validar-frontend.sh`, `scripts/sync-templates.sh`; ambiente saudável; auditoria de contraste e de celular nas telas alteradas
- [ ] T036 Commitar na branch

---

## Dependências
Fase 1 → Fase 2 → US0 → US1 → US2 → US3 → Fechamento. Dentro da US1, T021 e T022 (tela) podem andar em paralelo com T019 e T020 (cálculo) depois de T017 e T018 escritos. A US0 só mexe em acesso e contato e pode andar em paralelo com a Fase 2 depois dela estar verde.

## Estratégia
Primeiro o acesso só com login e a limpeza do modo rápido (US0), depois o dono conseguir cadastrar o quadro atual e ver o impacto (US1, MVP), a explicação do zero e o refinamento (US2), e por fim relatórios e compatibilidade (US3).
