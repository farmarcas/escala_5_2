---

description: "Tarefas: Painel de Escalas 5x2 (Farmarcas)"
---

# Tasks: Painel de Escalas 5x2

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)
**Tests**: incluídos; testes antes do código (ver falhar e depois implementar). O caso de conferência da spec vira **teste dourado**.
**Skills**: `schema-design` + `migrations` (banco), `node-api-development` + `node-unit-testing` (API), `component-development` + `styling-tailwind` (tela).
**Layout**: cada fatia termina com revisão visual em tela larga e estreita (FR-015).

## Format: `[ID] [P?] [Fatia] Descrição com caminho`

---

## Fatia 0: Estabilizar a base (acesso só com login)

- [x] T001 Terminar a tela do acesso só com login: `app/HomeRedirect.tsx`, `routes.tsx` (a rota `/` leva à entrada ou a "Minhas lojas"), `ContactFormModal` novo (cargo, telefone, setor, aceite; dados da conta só para conferência) e `contactForm.ts`, ajustando `SimulationScreen.tsx` para o formulário novo; apagar o que sobrou do modo rápido
- [x] T002 Rodar tipos, lint e testes (API e tela) e commitar "acesso só com login" na branch

## Fatia 1: Fundação e diagnóstico simples

### Banco
- [x] T003 [S1] `schema.prisma`: colunas novas de `stores` (`state`, `scale_start_date`, `tax_regime`, `config`) e de `store_roles` (`enabled`, `scale_type`, `coverage_mode`, `band_start`, `band_end`, `days_mask`, `owner_is_pharmacist`, `motorcycle`) e valores novos do enum de função (ver [data-model.md](data-model.md))
- [x] T004 [S1] Migration aditiva (`prisma migrate diff` revisada e aplicada); confirmar sem divergência e sem alterar dados

### Motor (testes primeiro)
- [x] T005 [P] [S1] `engine/time.test.ts` e `engine/time.ts`: horas e minutos, janelas que passam da meia-noite, semana a partir de uma data, dias da semana e máscara de dias
- [x] T006 [P] [S1] `engine/rules.ts`: regras e valores com base legal e vigência (jornadas por cenário, 11 h, intervalos, adicional noturno, encargos por regime, provisões, VT, EC 141/2026 e transição), com teste de que toda regra tem fonte
- [x] T007 [S1] `engine/coverage.test.ts` e `engine/coverage.ts`: postos por dia e função (turnos sobrepostos para manter o mínimo no salão durante almoço e lanche); casos: janela de 15 h dá 3 turnos, de 10 h a 12 h dá 2, domingo curto dá 1, mínimo 2 duplica
- [x] T008 [S1] `engine/staffing.test.ts` e `engine/staffing.ts`: menor número de pessoas por função e cenário (dias por semana, horas do cenário, rodízio de domingo, 11 h entre jornadas); casos simples conferidos à mão
- [x] T009 [S1] `engine/fixtures/reference-centro.ts` e `engine/reference.golden.test.ts`: o caso de conferência da spec com os números esperados da referência; diferenças aceitas ficam escritas no teste com a causa (calibração)
- [x] T010 [S1] `engine/costs.test.ts` e `engine/costs.ts` (versão básica): salários, FGTS, INSS por regime, provisões; folha hoje x nova

### API
- [x] T011 [P] [S1] `modules/scales/stores/scales.schemas.test.ts` e `.schemas.ts`: validação da configuração (passos 1, 2 e 4 nesta fatia), funções ativas, farmacêutico obrigatório, `config.version`
- [x] T012 [S1] `scales.repository.ts`, `scales.service.ts`, `scales.routes.ts` e testes de integração: CRUD de lojas, duplicar, isolamento entre grupos, `POST /scales/preview` e `GET /scales/stores/:id/diagnostic`
- [x] T013 [S1] Registrar em `app.ts` com sessão obrigatória; premissas antigas continuam servindo o produto antigo até a fatia 7

### Tela e layout
- [x] T014 [P] [S1] Componentes de base com o visual do Alquimia: `Tabs`, `SegmentedControl`, `Stepper` (índice lateral e progresso), `KpiCard`, `StatusPill`, `Skeleton`, `EmptyState`, `DaySelector`, `StackedBar`, `BarCompare` (só CSS)
- [x] T015 [S1] Estrutura do painel: cabeçalho com seletor de loja, abas e menu da conta; `features/scales/` com rotas `/painel`, `/painel/lojas/:id/{dados,escala,diagnostico,regras}`; a rota `/` passa a levar ao painel
- [x] T016 [S1] Cadastro em passos (1, 2 e 4): `store-form/` com valores de exemplo, validação na hora, tabela de equipe por função (hoje, salário, escala, mínimo no salão, cobertura, dias), funções opcionais desligadas
- [x] T017 [S1] Aba Diagnóstico (versão básica): cartões-resumo, seletor 42h/40h, quadro por função com selos e barras, folha hoje x nova em barras
- [x] T018 [S1] Lista de lojas, "Nova loja", "Duplicar", "Excluir" e estados vazio, carregando e erro
- [x] T019 [S1] Revisão visual da fatia (imagens em largura de computador e de celular), auditoria de contraste, ajustes; conferir o roteiro 1 e o roteiro 6 do [quickstart.md](quickstart.md)

## Fatia 2: Escala de 4 semanas

- [x] T020 [P] [S2] `engine/roster.test.ts`: cobertura do salão em todo o horário, farmacêutico presente, 11 h de descanso, rodízio de domingos (1 em 3, 1 em 2, todo domingo), turnos fixos, horas da semana por pessoa, determinismo (mesma entrada, mesma escala)
- [x] T021 [S2] `engine/roster.ts`: alocação das pessoas aos postos, horários de almoço e lanche, marcas ("Reforço", "Dono farmacêutico", "Folga dominical"), horas da semana e "Contratar"
- [x] T022 [S2] `GET /scales/stores/:id/roster` com teste de integração; desempenho: loja do caso de conferência em até 2 s
- [x] T023 [S2] Aba Escala: seletor de cenário e função, semanas em abas, grade com primeira coluna fixa, cores e legenda por tipo de turno, destaque "Contratar", "Coberto", versão do celular (um dia por vez)
- [x] T024 [S2] Revisão visual e conferir o roteiro 2 do quickstart

## Fatia 3: Custos completos

- [ ] T025 [P] [S3] `engine/costs.test.ts` ampliado: periculosidade, adicional noturno, horas extras de plantão, reflexo no DSR, intervalo indenizado, feriado em dobro, 13º, férias + 1/3, FGTS e multa, INSS + RAT + terceiros, VT com desconto de até 6%, benefícios; Simples x Presumido/Real, com e sem provisões
- [ ] T026 [S3] `engine/costs.ts` completo, custo direto x indireto e custo por colaborador; teste dourado da tabela de componentes (com diferenças explicadas)
- [ ] T027 [S3] Passo 5 do cadastro (folga dominical, CCT, almoço, lanche, provisões, 12x36, VT, benefícios, encargos avançados) e alternadores de regime e provisões no Diagnóstico
- [ ] T028 [S3] Diagnóstico: tabela de componentes, custo por colaborador, barras empilhadas direto x indireto; revisão visual e roteiro 3

## Fatia 4: Plantão e feriados

- [ ] T029 [P] [S4] Testes de plantão (semanal, mensal, semana do ciclo, farmacêutico no plantão, folga no dia seguinte, intermitente, intervalo indenizado) e de feriados (rotativa e fixa, compensatória ou dobro, folga que cai no feriado, resumo)
- [ ] T030 [S4] `engine/plantao.ts` e `engine/holidays.ts`, integrados a `staffing.ts`, `roster.ts` e `costs.ts`; feriados nacionais 2026 a 2028 em dados
- [ ] T031 [S4] Passos 3 e 7 no cadastro; resumo "Feriados no período" e marcas na grade; revisão visual e roteiro 4

## Fatia 5: Vendas, CMV e meta da folha

- [ ] T032 [P] [S5] Testes e `engine/sales.ts`: venda necessária para pagar mercadoria e folha dada a meta
- [ ] T033 [S5] Passo 6 (opcional) e seção "Vendas, CMV e folha" no Diagnóstico

## Fatia 6: Relatório, alertas, consultor e regras

- [ ] T034 [P] [S6] Testes de alertas (farmacêutico fora de parte do horário, plantão, faixas que passam do turno em N minutos, CCT não cadastrada) e `engine/alerts.ts`
- [ ] T035 [S6] Instalar `exceljs`; `report/xlsx.ts` com as abas do plano; `GET /scales/stores/:id/report.xlsx`; teste de integração que lê o arquivo e confere números iguais aos da tela
- [ ] T036 [S6] Aba "Regras aplicadas" (`GET /scales/rules`), bloco "Alertas e ajustes", botão do Excel e "Falar com um consultor" com resumo da simulação
- [ ] T037 [S6] Revisão visual e roteiro 5

## Fatia 7: Fechamento

- [ ] T038 [S7] Retirar o produto antigo: módulos, telas e testes de simulações salvas, comparação, mitigações e impacto por equivalentes; migration `contract` (colunas e tabelas sem uso)
- [ ] T039 [S7] Atualizar README, `contracts/api.md` (nova), specs 001 e 003 marcadas como substituídas; `sync-templates`
- [ ] T040 [S7] Verificação final: lint, tipos, todos os testes, `validar-frontend.sh`, auditoria de contraste e de celular em todas as telas, revisão de segurança (`/security-review`) e `/speckit-analyze`; commit e envio da branch

---

## Dependências
Fatia 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. T003 a T004 e T005 a T006 podem andar em paralelo; T014 em paralelo com o motor.

## Estratégia
Cada fatia entrega algo que o dono já usa: a 1 mostra quem contratar e o custo; a 2, a escala; a 3, o custo completo; a 4, plantão e feriados; a 5 e a 6 fecham o produto. A calibração com a referência acontece nos testes dourados das fatias 1 a 4; os 6 casos simples sugeridos no plano aceleram essa etapa.
