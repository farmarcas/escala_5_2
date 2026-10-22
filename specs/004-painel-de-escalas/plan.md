# Plano: Painel de Escalas 5x2 (Farmarcas)

**Spec**: [spec.md](spec.md) | **Data**: 2026-10-22 | **Base**: contas, sessão, lojas, relatórios, contato e visual Alquimia já construídos (specs 001 e 002)

## Para quem lê
Escolhi: um motor de escala próprio no servidor, que monta a escala de cada loja e calcula o custo, com testes que reproduzem o seu caso de referência.
Por quê: é o coração do produto. Rodando no servidor ele é igual para todo mundo, é testável e gera o mesmo resultado na tela e no Excel.

## Riscos que a pessoa precisa saber (resumo)
1. **O algoritmo da referência não é público.** Só vemos as respostas dele. Vou deduzir as regras a partir dos resultados dos seus PDFs e calibrar com testes. Alguns números tendem a bater de primeira (os de perfumista, serviços gerais e entregador); outros (farmacêutico com plantão) dependem de regras que só dá para confirmar com mais exemplos. Ver "Calibração" abaixo.
2. **Regra trabalhista e custo são sensíveis.** Cada regra será escrita em um arquivo de regras, com a base legal, e validada pelo jurídico e pela contabilidade da Farmarcas.
3. **O projeto é grande.** Vai ser entregue em fatias, cada uma utilizável.

## Constituição
Spec Kit seguido; migrations Prisma (expand e depois contract); Docker; linguagem simples; sem pergunta técnica ao usuário. Dependência nova: `exceljs` (gerar o relatório em Excel no servidor), justificada abaixo. Nenhuma outra tecnologia nova.

## Contexto técnico
Node 22 + TypeScript + Prisma + PostgreSQL; React + Vite + Tailwind; visual Alquimia. Testes: Vitest e Supertest.

## Decisões

### 1. Onde roda o motor
No **servidor**, em `backend/node/src/modules/scales/engine/`, como funções puras (sem banco, sem relógio, sem HTTP), no mesmo estilo do calculador atual. Entrada: a configuração da loja (JSON validado) e o cenário (`6x1_44`, `5x2_42`, `5x2_40`). Saída: quadro por função, escala de 4 semanas e custos. Resultado **determinístico** (mesma entrada, mesma escala): sem sorteio, com desempate por ordem fixa.
A tela chama o motor por `POST /scales/preview` (com espera de ~400 ms entre digitações) e por `GET /scales/stores/:id/...` para lojas salvas. Meta: responder em até 2 s para lojas de até 40 pessoas (SC-004); o motor roda por função em paralelo na lógica, e cenários são calculados sob demanda.

### 2. Como o motor pensa (4 etapas)
1. **Postos por dia**: para cada função e dia, calcula quantos turnos sobrepostos são necessários para manter o *mínimo no salão* durante a janela de cobertura (todo o funcionamento ou a faixa da função), considerando que cada pessoa sai para o almoço (60/90/120 min) e para o lanche (pago), e que o turno tem tamanho fixo: `jornada diária do cenário + almoço`. Na referência isso aparece como três turnos para 15 h de funcionamento (abertura, meio com "reforço" e fechamento, espaçados por igual) e dois turnos para janelas de 10 a 12 h.
2. **Dimensionamento (quantas pessoas)**: menor `N` por função tal que dá para alocar os postos de 4 semanas, respeitando: dias por semana e horas máximas do cenário, rodízio da folga dominical (regra escolhida), 11 h entre jornadas, turnos fixos por pessoa, folga no dia seguinte ao plantão e feriados. Busca `N` crescente com alocação por heurística guiada e retrocesso curto; o primeiro `N` viável vence.
3. **Alocação e horários**: distribui pessoas pelos postos, escolhe a hora do almoço e do lanche de cada uma sem deixar o salão descoberto, marca "Reforço", "Dono farmacêutico", "Plantão", "Folga dominical" e "Feriado e folga compensatória", e soma as horas de cada pessoa na semana.
4. **Custo**: aplica regime tributário, adicionais e encargos aos horários gerados (ver item 4).

Regras legais e valores ficam em `engine/rules.ts` (uma fonte única, com a base legal de cada uma e a data de vigência), exibidas na página "Regras aplicadas" (US7).

### 3. Quadro, cenários e transição
`necessário 6x1 (44h)`, `necessário 5x2 (42h)` e `necessário 5x2 (40h)` por função. "Contratar" = necessário − hoje (nunca negativo; excedente é "reforço"). A folha "hoje" usa a equipe de hoje, a "nova" usa todos da escala (quem já existe e as novas contratações). A data de início da escala e a transição (42h até o 14º mês após a promulgação, depois 40h) ficam em `rules.ts` como parâmetros, não espalhadas pelo código.

### 4. Custos
Por pessoa e mês: salário de registro + adicionais (periculosidade 30% do entregador de moto, adicional noturno 20% e hora noturna de 52 min 30 s entre 22 h e 5 h, horas extras de plantão, reflexo no DSR, intervalo indenizado a 50% quando aplicável, feriado em dobro) + provisões (13º 1/12, férias + 1/3 1/9, FGTS 8%, multa) + INSS patronal (20% + RAT/FAP + terceiros 5,8% no Lucro Presumido/Real; dentro do DAS no Simples) + vale-transporte (parte da empresa, com desconto de até 6% do salário) + benefícios. Resultado em "direto" e "indireto". Tabelas e fórmulas em `engine/costs.ts`. Os valores da referência servem de **conferência** (testes dourados com tolerância e explicação), não de regra copiada.

### 5. Dados (migrations expand e contract)
Reaproveita `stores` e `store_roles` da calculadora atual e acrescenta o que falta (detalhe em [data-model.md](data-model.md)):
- **expand**: novas colunas e valores de enum (UF, início da escala, regime, configuração em JSON versionado para passos 2, 3, 5, 6 e 7; por função: ativa, tipo de escala, cobertura por faixa, dias, "dono é farmacêutico", gerentes e subgerentes). Nada existente é apagado.
- **contract** (última fatia, depois do código antigo sair): retirar colunas e módulos que não existem mais no produto (`weekly_hours`, `absence_rate`, simulações salvas e comparação, mitigações).
A configuração complexa (plantão, feriados, benefícios) fica em JSON porque é lida e gravada sempre junta e não é consultada por dentro; é validada por Zod e tem campo `version` para evoluir.

### 6. API (resumo; contrato detalhado em `contracts/api.md` na implementação)
- `GET/POST /api/v1/scales/stores`, `GET/PATCH/DELETE /scales/stores/:id`, `POST /scales/stores/:id/duplicate` (todos por grupo, como hoje).
- `POST /scales/preview` (configuração sem salvar → diagnóstico).
- `GET /scales/stores/:id/diagnostic?scenario=5x2_42&regime=...&provisions=true|false`
- `GET /scales/stores/:id/roster?scenario=...` (4 semanas)
- `GET /scales/stores/:id/report.xlsx` (relatório completo)
- `GET /scales/rules` (regras aplicadas, com base legal e vigência)
- Contato com consultor e consulta da equipe: já existem.

### 7. Tela
- **Lojas**: lista, "Nova loja", "Duplicar", "Excluir", troca de loja no topo.
- **Loja** (abas): **Dados da loja** (os 7 passos, na mesma página, com valores de exemplo), **Escala** (cenário e função, grade de 4 semanas rolável, filtros e legenda, botão do Excel), **Diagnóstico e custos**, **Regras aplicadas**.
- Visual do Alquimia; componentes novos: abas, passos, seletor de dias da semana, tabela de equipe, grade da escala (com rolagem lateral só dentro da grade), alternadores (cenário, regime, provisões).
- Acessibilidade: grade com cabeçalhos de linha e coluna; legenda não depende só de cor.

### 7b. Qualidade do layout (pedido da pessoa)
- **Estrutura**: cabeçalho escuro com nome do painel, seletor de loja e menu da conta; abaixo, abas (Dados da loja, Escala, Diagnóstico e custos, Regras aplicadas). Em celular as abas rolam na horizontal e o seletor vira lista.
- **Cadastro em passos**: índice lateral fixo no computador (e barra de progresso no celular) com os 7 passos, cada passo em um cartão; avisos de campo na hora; botão "Ver a escala" fixo no rodapé.
- **Cartões-resumo** fixos no topo do resultado: *Contratar N pessoas*, *Folha hoje*, *Folha nova* e *Diferença* (mensal, em % e por ano), com os 3 cenários em um seletor segmentado.
- **Quadro por função** em tabela com selos de situação ("Falta 3", "Contratar 3", "Coberto") e barras de proporção; **custo direto x indireto** em barras empilhadas e **hoje x nova** em barras lado a lado, feitas só com CSS (sem biblioteca de gráfico).
- **Grade da escala**: semanas em abas, primeira coluna (colaborador e horas da semana) fixa, células por tipo de turno com cor e rótulo (abertura, meio, fechamento, plantão, folga, folga dominical, feriado, reforço), legenda sempre visível, destaque da pessoa "Contratar", versão compacta no celular (um dia por vez).
- **Detalhes**: carregamento em "esqueleto" no lugar de textos soltos, estados vazios com instrução, ícones simples em SVG próprio, foco visível, contraste ≥ 4,5:1, animações curtas e desligáveis (`prefers-reduced-motion`).
- **Processo**: cada fatia termina com revisão visual (imagens em largura de computador e de celular, anotadas) e auditoria automática de contraste.

### 8. Excel
`exceljs` no servidor: abas "Comparativo de pessoas e custos", "Plano de ação", "Modelo por função" e "Escalas 6x1 · 5x2 42h · 5x2 40h" (4 semanas cada). Usa os mesmos números da tela porque vêm do mesmo motor (SC-005). Alternativa rejeitada: gerar no navegador (duplicaria lógica e não teria como testar sem navegador).

### 9. O que sai
Módulos de simulações salvas, comparação, mitigações e impacto por equivalentes, e suas telas e testes, saem na fatia final (a pessoa aprovou absorver a calculadora). Contas, sessão, e-mail, contato, relatórios base e visual ficam.

## Calibração com a referência (importante)
O caso de conferência da spec vira **teste dourado** (arquivo de fixtures). A meta é reproduzir o quadro por função e a folha. Onde houver diferença, o teste registra a diferença esperada e a causa, e a regra vai para validação do jurídico/contabilidade.
**O que ajuda muito**: casos simples rodados na referência, para eu deduzir as regras de dimensionamento sem chute. Sugestão de 6 casos: (1) só 1 farmacêutico, loja 08–18 de segunda a sexta, sem domingo e sem plantão; (2) o mesmo com domingo 08–14; (3) o mesmo com plantão mensal; (4) 1 balconista com mínimo 2; (5) uma função com faixa de 10 h; (6) a loja do exemplo em Simples Nacional. Para cada um, os PDFs das abas Escala e Diagnóstico e custos.

## Fatias de entrega (cada uma utilizável)
1. **Fundação e diagnóstico simples**: cadastro da loja (passos 1, 2 e 4), motor de postos e dimensionamento, quadro por função, "contratar" e folha com salários e encargos básicos; testes dourados.
2. **Escala de 4 semanas**: alocação, horários de almoço e lanche, domingos, 11 h, grade na tela.
3. **Custos completos**: todos os componentes, provisões, vale-transporte, benefícios, custo por colaborador, regimes.
4. **Plantão e feriados** (passos 3 e 7) no motor e no custo.
5. **Vendas, CMV e meta da folha** (passo 6) e regras avançadas (passo 5 completo).
6. **Relatório Excel, alertas, consultor, regras aplicadas**.
7. **Fechamento**: retirar o produto antigo (contract), documentação, auditorias de segurança, contraste e celular.

## Estrutura
```text
backend/node/src/modules/scales/
  engine/        time.ts, coverage.ts, staffing.ts, roster.ts, plantao.ts, holidays.ts, costs.ts, rules.ts, index.ts (+ testes e fixtures)
  stores/ ...    schemas Zod, repositório, serviço, rotas
  report/        xlsx.ts
frontend/react/src/features/scales/
  store-form/ (7 passos)   roster/ (grade)   diagnostic/ (custos)   rules/   components/ (abas, seletor de dias)
specs/004-painel-de-escalas/{spec,plan,data-model,quickstart}.md, contracts/api.md
```

## Dependência nova
`exceljs` (MIT): geração de .xlsx. Sem alternativa mais simples que atenda "Excel com várias abas e formatação".
