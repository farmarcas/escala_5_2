---

description: "Lista de tarefas da calculadora de impacto do fim da escala 6x1"
---

# Tasks: Calculadora de Impacto do Fim da Escala 6x1

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md)

**Prerequisites**: spec e plano aprovados.

**Tests**: incluídos. O plano manda TDD no cálculo (rápido e detalhado) e testes de integração em login e isolamento entre grupos: o teste vem antes do código e precisa falhar primeiro.

**Organization**: por história de usuário, para entregar e validar cada fatia sozinha. A US6 (contato) vem antes da US5 (relatório) porque o PDF do modo rápido pede os dados de contato.

## Format: `[ID] [P?] [Story] Descrição com caminho`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: história da spec (US1 a US6)

## Path Conventions

- API: `backend/node/src/...` · Tela: `frontend/react/src/...` · Banco: `backend/node/prisma/...`
- Antes de mexer em cada área, ler a skill dela (AGENTS.md): `component-development` + `styling-tailwind` (tela), `node-api-development` + `node-unit-testing` (API), `schema-design` + `migrations` (banco), `containerization` (Docker).

---

## Phase 1: Setup (infraestrutura compartilhada)

**Purpose**: preparar tela em TypeScript com Tailwind e o ambiente com caixa de e-mail de teste.

- [x] T001 Converter o esqueleto da tela para TypeScript: renomear `frontend/react/src/main.jsx` e `App.jsx` para `.tsx`, criar `frontend/react/tsconfig.json` e `vite.config.ts` (trocando `vite.config.js`), ajustar `index.html`
- [x] T002 Instalar e configurar Tailwind, `clsx`, `tailwind-merge` e `react-router-dom` em `frontend/react/package.json`; criar `frontend/react/src/index.css` com tokens no `@theme` e `frontend/react/src/lib/cn.ts` (skill `styling-tailwind`)
- [x] T003 [P] Instalar `jspdf` em `frontend/react/package.json` e `nodemailer` (+ `@types/nodemailer`) em `backend/node/package.json`
- [x] T004 [P] Adicionar serviço `mailpit` (só desenvolvimento, portas em 127.0.0.1) em `docker-compose.yml` e as variáveis `MAIL_*`, `MAILPIT_UI_PORT`, `ADMIN_API_KEY`, `COOKIE_SECURE` em `.env.example` e `backend/node/.env.example`; replicar em `templates/docker` pelo `scripts/sync-templates.sh`
- [x] T005 [P] Configurar Vitest na tela (`frontend/react/vitest.config.ts`) e o script `test` em `frontend/react/package.json`; ligar `scripts/validar-frontend` ao novo teste e lint, se existir passo para isso
- [x] T006 Confirmar que o ambiente sobe saudável (`docker compose up -d --build --wait`) com a tela já em TypeScript e Tailwind

---

## Phase 2: Foundational (bloqueia todas as histórias)

**Purpose**: base de segurança, premissas, formatação e casca da tela.

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

- [x] T007 [P] Criar as premissas padrão com versão e data de revisão em `backend/node/src/config/premises.ts` (encargos, meses, alíquota, limite Presumido, perfis de loja, ausência, ações) e o tipo `Premises` em `backend/node/src/modules/premises/premises.types.ts`
- [x] T008 [P] Teste de integração de `GET /api/v1/premises/defaults` em `backend/node/src/modules/premises/premises.routes.integration.test.ts`
- [x] T009 Implementar módulo `premises` (routes, controller, service) em `backend/node/src/modules/premises/` e registrar em `backend/node/src/app.ts`
- [x] T010 [P] Estender `backend/node/src/config/env.ts` com `MAIL_*`, `ADMIN_API_KEY`, `COOKIE_SECURE` (validação Zod)
- [x] T011 [P] Middleware de mesma origem em `backend/node/src/shared/middlewares/same-origin.ts` com teste em `same-origin.test.ts`
- [x] T012 [P] Limitador de tentativas em memória em `backend/node/src/shared/middlewares/rate-limit.ts` com teste unitário em `rate-limit.test.ts`
- [x] T013 [P] Funções `scrypt` de senha em `backend/node/src/shared/security/password.ts` e de tokens aleatórios/hash em `backend/node/src/shared/security/tokens.ts`, com testes `password.test.ts` e `tokens.test.ts` escritos antes
- [x] T014 [P] Utilitários de formatação e leitura de números no padrão brasileiro em `frontend/react/src/lib/formatPtBr.ts` com testes `formatPtBr.test.ts` (1.234,56, R$, %, compacto "mi/bi")
- [x] T015 [P] Primitivos de interface em `frontend/react/src/components/ui/`: `Button.tsx`, `TextField.tsx`, `NumberField.tsx`, `SelectField.tsx`, `SliderField.tsx`, `Checkbox.tsx`, `Modal.tsx`, `StatusBadge.tsx`
- [x] T016 [P] Casca da página em `frontend/react/src/components/layout/PageShell.tsx` e `Header.tsx` e rotas base em `frontend/react/src/app/routes.tsx`
- [x] T017 [P] Hook de premissas padrão em `frontend/react/src/features/quick-calculator/hooks/useDefaultPremises.ts` (busca `/api/v1/premises/defaults`; trata carregamento e erro)

**Checkpoint**: base pronta; histórias podem começar.

---

## Phase 3: User Story 1 — Modo rápido (Priority: P1) 🎯 MVP

**Goal**: o dono do grupo vê o impacto em faixa, com premissas visíveis e editáveis, sem cadastro.

**Independent Test**: roteiro 1, passos 1 a 7 do [quickstart.md](quickstart.md), com números conferidos à mão.

### Tests (escrever primeiro e ver falhar)

- [x] T018 [P] [US1] Testes do cálculo rápido em `frontend/react/src/lib/quickImpact.test.ts`: caso do quickstart (340 afetados, 34 pessoas, R$ 43.389,15 por pessoa), faixa por dias 7/6/5, Lucro Real × Presumido × Simples, 0% em 6x1, faturamento zero, teto de mitigação por maturidade, limite de 30%
- [x] T019 [P] [US1] Testes de validação do formulário em `frontend/react/src/features/quick-calculator/validateQuickInput.test.ts` (negativo, zero, % > 100, vazio)

### Implementation

- [x] T020 [US1] Implementar `frontend/react/src/lib/quickImpact.ts` (função pura, fórmulas da seção 2 do [research.md](research.md))
- [x] T021 [P] [US1] Implementar `frontend/react/src/features/quick-calculator/validateQuickInput.ts`
- [x] T022 [US1] Hook `useQuickCalculator.ts` em `frontend/react/src/features/quick-calculator/hooks/` (estado do formulário, premissas editáveis com "voltar ao padrão", resultado derivado no render)
- [x] T023 [P] [US1] Componente `QuickForm.tsx` com todos os campos da FR-002; "número de lojas" marcado como informativo em `frontend/react/src/features/quick-calculator/components/`
- [x] T024 [P] [US1] Componente `PremisesPanel.tsx` (premissas editáveis, selo "premissas alteradas", botão voltar ao padrão)
- [x] T025 [P] [US1] Componente `ImpactResult.tsx` (faixa bruta e líquida, % do faturamento e do resultado operacional, pessoas e custo, impacto médio por loja, região `aria-live`)
- [x] T026 [P] [US1] Componente `MitigationChecklist.tsx` (seis ações, impacto sem ação × residual) e `LegalNotice.tsx` (FR-024)
- [x] T027 [P] [US1] Componente `ExecutiveSummary.tsx` e função `buildSummaryText` em `frontend/react/src/lib/buildSummaryText.ts` com teste `buildSummaryText.test.ts` (FR-010)
- [x] T028 [US1] Avisos: Presumido acima de R$ 78 milhões, sem lucro (líquido = bruto) e 0% em 6x1 dentro de `ImpactResult.tsx`
- [x] T029 [US1] Página `frontend/react/src/app/RapidoPage.tsx` compondo a feature e rota inicial `/`; layout de uma coluna no celular (375 px)
- [x] T030 [US1] Conferir o roteiro 1 (passos 1 a 7) no navegador, incluindo celular; rodar lint e testes da tela

**Checkpoint**: modo rápido completo e usável sozinho (MVP).

---

## Phase 4: User Story 2 — Conta e lojas (Priority: P2)

**Goal**: o gestor cria conta, entra e cadastra lojas e equipes por função.

**Independent Test**: roteiro 2 do [quickstart.md](quickstart.md); teste de integração "grupo A não vê grupo B".

### Banco

- [x] T031 [US2] Atualizar `backend/node/prisma/schema.prisma` com `groups`, `sessions`, `email_tokens`, `stores`, `store_roles` e novos campos de `users` (skills `schema-design` e `migrations`; ver [data-model.md](data-model.md))
- [x] T032 [US2] Gerar a migration com `--create-only`, editar o SQL (índices parciais, collation `pt_br`, expand/contract em `users`) e aplicar; migration em `backend/node/prisma/migrations/`

### Tests

- [x] T033 [P] [US2] Testes unitários do service de autenticação em `backend/node/src/modules/auth/auth.service.test.ts` (cadastro, e-mail já usado sem revelar, confirmação, login, bloqueio após 5 falhas, expiração de token, recuperação)
- [x] T034 [P] [US2] Testes de integração HTTP de auth em `backend/node/src/modules/auth/auth.routes.integration.test.ts` (cookie HttpOnly, `Origin` inválido → 403, logout revoga, exclusão de conta)
- [x] T035 [P] [US2] Testes de integração de lojas em `backend/node/src/modules/stores/stores.routes.integration.test.ts` (CRUD, validações do farmacêutico, **isolamento entre grupos: 404 para loja de outro grupo**)
- [x] T036 [P] [US2] Testes unitários das regras de loja em `backend/node/src/modules/stores/stores.service.test.ts` (horário 24h, fechamento após meia-noite, nome único no grupo)

### API

- [x] T037 [P] [US2] E-mail: `backend/node/src/shared/mailer.ts` (SMTP via env) e templates de confirmação e recuperação em `backend/node/src/modules/auth/auth.emails.ts`
- [x] T038 [US2] Módulo `auth` (schemas, repository, service, controller, routes) em `backend/node/src/modules/auth/` conforme [contracts/api.md](contracts/api.md)
- [x] T039 [US2] Middleware `require-session.ts` em `backend/node/src/shared/middlewares/` e tipagem de `req.session` em `backend/node/src/types/express.d.ts`
- [x] T040 [US2] Módulo `stores` (schemas Zod de horários e funções, repository filtrando por `group_id`, service, controller, routes) em `backend/node/src/modules/stores/`
- [x] T041 [US2] Rota `PATCH /api/v1/groups/current` (nome, regime tributário, faturamento) em `backend/node/src/modules/auth/groups.routes.ts`
- [x] T042 [US2] Remover o CRUD aberto `backend/node/src/modules/users/` e seu registro em `app.ts`; ajustar testes que o usavam
- [x] T043 [US2] Registrar módulos e middlewares (same-origin, sessão) em `backend/node/src/app.ts`; rodar lint, tipos, testes unitários e de integração

### Tela

- [x] T044 [P] [US2] Feature `auth`: contexto de sessão e `useAuth.ts` em `frontend/react/src/features/auth/hooks/`, rota protegida em `frontend/react/src/app/ProtectedRoute.tsx`
- [x] T045 [P] [US2] Telas e formulários: `RegisterPage.tsx`, `VerifyEmailPage.tsx`, `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` em `frontend/react/src/app/` e componentes em `features/auth/components/`
- [x] T046 [P] [US2] Feature `stores`: `useStores.ts`, `StoreList.tsx`, `StoreForm.tsx` (horários por dia, equipe por função, farmacêutico com mínimo ≥ 1), `StoresPage.tsx`, estados de carregando, vazio e erro
- [x] T047 [US2] Conferir o roteiro 2 no navegador (e-mail no Mailpit incluído)

**Checkpoint**: conta e lojas funcionando, com isolamento provado por teste.

---

## Phase 5: User Story 3 — Modo detalhado por loja (Priority: P2)

**Goal**: impacto por loja e função, total do grupo e ranking.

**Independent Test**: loja simples do roteiro 3 (passo 2) com contas conferidas à mão.

### Tests (primeiro)

- [x] T048 [P] [US3] Testes do calculador em `backend/node/src/modules/simulations/impact.calculator.test.ts`: 12h × 7 dias; loja 24h; fechamento após meia-noite; déficit já existente a 44h (conta só `deficitNovo`); farmacêutico (caso do quickstart → 1 pessoa); ausência; arredondamento para cima; loja sem déficit; regime tributário
- [x] T049 [P] [US3] Teste de integração `POST /simulations/preview` em `backend/node/src/modules/simulations/simulations.preview.integration.test.ts` (resultado, isolamento, 200 lojas em menos de 1 s)

### Implementation

- [x] T050 [US3] Implementar `backend/node/src/modules/simulations/impact.calculator.ts` (função pura, seção 3 do [research.md](research.md)) e tipos de resultado
- [x] T051 [US3] Schemas, service, controller e rota `POST /api/v1/simulations/preview` em `backend/node/src/modules/simulations/`
- [x] T052 [P] [US3] Feature `simulations` na tela: `useSimulationPreview.ts` (com espera de ~300 ms entre digitações), `SimulationPage.tsx`
- [x] T053 [P] [US3] Componentes `StoreImpactTable.tsx` (por loja e função), `GroupTotals.tsx`, `StoreRanking.tsx`, `MandatoryPresenceNote.tsx` (destaque do farmacêutico) e mensagem "sem contratação necessária"
- [x] T054 [US3] Conferir o roteiro 3 (passos 1 a 3) e o desempenho com 200 lojas

**Checkpoint**: modo detalhado entrega números por loja.

---

## Phase 6: User Story 4 — Ações, simulações salvas e comparação (Priority: P2)

**Goal**: marcar ações com efeito próprio, salvar, reabrir, duplicar e comparar.

**Independent Test**: roteiro 3, passos 4 a 6.

### Tests (primeiro)

- [x] T055 [P] [US4] Testes de mitigação em `backend/node/src/modules/simulations/mitigations.test.ts`: combinação multiplicativa, ajuste de horário antes dos percentuais, farmacêutico sem multifuncionalidade/automação/ajuste de quadro, aviso acima de 50%
- [x] T056 [P] [US4] Testes de integração de salvar, listar, reabrir, duplicar, recalcular, apagar e comparar em `backend/node/src/modules/simulations/simulations.routes.integration.test.ts`, incluindo "foto imutável" (mudar loja/premissa não altera simulação antiga) e isolamento entre grupos

### Implementation

- [x] T057 [US4] Implementar `backend/node/src/modules/simulations/mitigations.ts` e integrá-lo ao `impact.calculator.ts`
- [x] T058 [US4] Migration e modelo de `simulations` (já descritos em [data-model.md](data-model.md)) em `backend/node/prisma/schema.prisma` e nova pasta em `backend/node/prisma/migrations/`
- [x] T059 [US4] Repository, service, controller e rotas de simulações salvas e `compare` em `backend/node/src/modules/simulations/`
- [x] T060 [P] [US4] Telas: `MitigationPanel.tsx` (efeito por loja e função com sugestões padrão), `SaveSimulationDialog.tsx`, `SimulationsListPage.tsx`, `ComparePage.tsx` (lado a lado) em `frontend/react/src/features/simulations/` e `app/`
- [x] T061 [US4] Reabrir simulação mostrando data e premissas de origem, e ação "recalcular com dados atuais"
- [x] T062 [US4] Conferir o roteiro 3 (passos 4 a 6)

**Checkpoint**: o gestor decide com números e guarda cenários.

---

## Phase 7: User Story 6 — Falar com um consultor (Priority: P3)

**Goal**: contato registrado para a equipe da Farmarcas (e base do PDF do modo rápido).

**Independent Test**: roteiro 1, passos 9 e 10.

- [x] T063 [P] [US6] Testes de integração em `backend/node/src/modules/contacts/contacts.routes.integration.test.ts`: envio válido, campos obrigatórios, e-mail inválido, sem aceite, honeypot preenchido (responde 201 sem gravar), duplo envio com a mesma `idempotencyKey`, limite por IP
- [x] T064 [P] [US6] Testes de integração de `admin/contact-requests` em `backend/node/src/modules/admin-contacts/admin-contacts.routes.integration.test.ts` (sem chave → 401, lista, CSV, anonimizar)
- [x] T065 [US6] Migration e modelo `contact_requests` em `backend/node/prisma/schema.prisma` e `prisma/migrations/`
- [x] T066 [US6] Módulos `contacts` e `admin-contacts` (schemas Zod, repository, service, controller, routes, `require-admin-key.ts`) em `backend/node/src/`
- [x] T067 [P] [US6] Feature `contact` na tela: `ContactFormModal.tsx` (campos da FR-022, aceite, máscara de telefone, isca, chave de idempotência), `useContactRequest.ts`, confirmação "Solicitação registrada!"
- [x] T068 [US6] Ligar o botão "Falar com um consultor" em `RapidoPage.tsx` e em `SimulationPage.tsx`, enviando perfil e resultado do momento
- [x] T069 [US6] Conferir o roteiro 1 (passos 9 e 10)

---

## Phase 8: User Story 5 — Relatório em PDF e planilha (Priority: P3)

**Goal**: PDF com os mesmos números da tela e CSV por loja.

**Independent Test**: roteiro 1 passo 8 e roteiro 3 passo 7.

- [x] T070 [P] [US5] Testes do conversor para CSV em `frontend/react/src/features/reports/buildStoresCsv.test.ts` (UTF-8 com BOM, separador `;`, vírgula decimal)
- [x] T071 [US5] Implementar `frontend/react/src/features/reports/buildStoresCsv.ts` e `downloadFile.ts`
- [x] T072 [US5] Implementar `frontend/react/src/features/reports/buildPdf.ts` com `jspdf`: um relatório para o modo rápido e outro para o detalhado (perfil, resultados, ações, síntese, premissas, aviso legal)
- [x] T073 [US5] Modo rápido: botão "Baixar relatório" abre o `ContactFormModal` com origem `pdf` e só baixa depois do envio com sucesso (FR-021); botão desabilitado sem resultado calculado
- [x] T074 [US5] Modo detalhado: botões de PDF e CSV baixam direto, sem pedir dados de novo
- [x] T075 [US5] Conferir que os números do PDF e do CSV são idênticos aos da tela (SC-003) nos roteiros 1 e 3

---

## Phase 9: Polish e itens transversais

- [x] T076 [P] Exclusão de conta (LGPD): apaga lojas e simulações do grupo; botão e confirmação em `frontend/react/src/features/auth/components/DeleteAccount.tsx` e teste de integração
- [x] T077 [P] Página de política de privacidade e aviso legal (texto provisório sinalizado para revisão jurídica) em `frontend/react/src/app/PrivacyPage.tsx`
- [x] T078 [P] Revisão de acessibilidade e celular (rótulos, foco, contraste, 375 px) em todas as telas
- [x] T079 Rodar o roteiro 4 (isolamento e privacidade) e o quickstart inteiro; registrar o resultado
- [x] T080 Rodar lint, tipos e todos os testes (API e tela) e confirmar `docker compose ps` saudável
- [x] T081 Rodar `/speckit-analyze` e uma revisão de segurança (`/security-review`) antes de publicar fora da máquina local
- [x] T082 Atualizar `README.md` com como usar a calculadora, onde ajustar premissas (`backend/node/src/config/premises.ts`) e como consultar contatos

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → histórias.** Fase 2 bloqueia todas.
- **US1** não depende de conta nem de banco novo (só do endpoint de premissas); é o **MVP**.
- **US2** (conta e lojas) é base de **US3**, **US4**; **US3 → US4**.
- **US6** (contato) independe de conta; precisa vir antes da **US5** porque o PDF do modo rápido exige o formulário de contato. O PDF/CSV do modo detalhado só depende de US3.
- **Polish** por último.
- Ordem sugerida de execução: US1 → US2 → US3 → US4 → US6 → US5 → Polish.

## Parallel Opportunities

- Fase 2: T007, T010 a T017 em paralelo (arquivos diferentes).
- US1: testes T018 e T019 juntos; depois componentes T023 a T027 juntos.
- US2: testes T033 a T036 juntos; API (T038 a T041) e tela (T044 a T046) podem andar em paralelo depois da migration.
- US3: T048 e T049 juntos; tela T052 e T053 em paralelo à API depois de T050.
- US6 pode andar em paralelo com US3/US4 (outra pessoa/sessão), pois não compartilha arquivos, exceto `app.ts` e `schema.prisma` (coordenar para não sobrescrever).

## Implementation Strategy

1. **MVP**: Fases 1, 2 e US1. Parar e validar com a pessoa (modo rápido no ar).
2. **Fatia 2**: US2 + US3 (conta, lojas, números por loja). Validar.
3. **Fatia 3**: US4 (ações, salvar, comparar). Validar.
4. **Fatia 4**: US6 + US5 (contato, PDF, CSV) e Polish.
5. Em cada fatia: testes primeiro, depois código; lint, tipos e testes verdes antes de seguir; confirmar o ambiente saudável e informar a URL.

## Pendências de negócio (não bloqueiam o código, bloqueiam o lançamento)

- Validar com finanças: encargos, margens e coberturas por perfil de loja, ausência média, efeito sugerido das ações.
- Definir servidor de e-mail de produção e remetente.
- Revisão jurídica da política de privacidade e do aviso legal.
