# Plano: Impacto a partir do quadro atual da loja

**Spec**: [spec.md](spec.md) | **Base**: spec 001 (modo detalhado) | **Branch**: `feat/identidade-visual-alquimia` (segue a de 001)

## Para quem lê
Escolhi: o quadro atual passa a ser a base do cálculo, e o "mínimo por turno" vira um refinamento opcional.
Por quê: o dono sabe quantas pessoas tem, e o resultado fica simples de entender e de conferir à mão.

## Contexto técnico
Sem tecnologia nova: Node 22 + Prisma + PostgreSQL, React + Tailwind. Mudanças em quatro pontos: banco (duas colunas), cálculo, formulário da loja e telas/relatórios de resultado.

## Constituição
Spec Kit seguido (specify → plan → tasks); migration versionada (IV); sem dependência nova (III); linguagem simples (VI). Sem violações.

## Decisões técnicas

### 1. Cálculo
Por função, com `H` pessoas, jornada `J` (horas), ausência `a`, `meta = 40`:

```
horasHoje   = H × J × (1 − a)
horasA40    = H × min(J, 40) × (1 − a)
horasCobrir = minPorTurno informado ? horasAbertura × minPorTurno : horasHoje   (cobertura constante)
faltaNova   = max(0, max(0, horasCobrir − horasA40) − max(0, horasCobrir − horasHoje))
equivalentes   = faltaNova / (40 × (1 − a))           (fração de pessoa)
custoProporcional = equivalentes × salário × meses × encargos
contratacoesInteiras = ceil(equivalentes)             (já existe: peopleToHire)
custoInteiras        = contratacoesInteiras × salário × meses × encargos   (já existe: annualCost)
```

Sem "mínimo por turno" a ausência se cancela: `equivalentes = H × (J − 40) ÷ 40`, igual a 0,1 × H para 44h. Com o mínimo informado vale o cálculo atual. A mitigação continua aplicada sobre `faltaNova`, agora também gerando `residualEquivalentes` e `residualCustoProporcional`.

- **Motivo do zero** (por função): `jornada_ate_40` se J ≤ 40; `folga` se há mínimo informado e `horasA40 ≥ horasCobrir` (devolve `slackHours`); `sem_impacto` nos demais casos. A tela traduz em frase simples.
- **Total do grupo**: soma por loja (proporcional e inteiras). O ranking passa a ordenar pelo **custo proporcional** (as inteiras distorcem lojas pequenas).
- **Farmacêutico**: continua obrigatório. Sem mínimo informado, vale `H ≥ 1`; com mínimo informado, mínimo ≥ 1 (como hoje).

### 2. Banco (migration `expand`, só aditiva)
- `enum StoreSize { pequena, media, grande }` e `stores.size StoreSize NULL` (lojas antigas ficam "não informado").
- `store_roles.min_per_shift` passa a aceitar nulo (`DROP NOT NULL`). Os `CHECK` existentes (`>= 0`, farmacêutico `>= 1`) continuam valendo quando há valor e passam em nulo.
- Nenhum dado existente é alterado. Simulações salvas continuam com o resultado antigo (JSON), que não tem os campos novos.

### 3. API (contrato)
- `POST /stores` exige `size`; `PATCH /stores/:id` aceita `size`. Resposta da loja inclui `size` (`null` em lojas antigas).
- `roles[].minPerShift` passa a ser opcional e nulo. Validação: farmacêutico exige `headcount ≥ 1`; se `minPerShift` vier, farmacêutico exige `≥ 1`.
- `result.totals` ganha: `equivalentPeople`, `proportionalAnnualImpact`, `netProportionalAnnualImpact`, `residualProportionalAnnualImpact`, `proportionalSavings`. `result.stores[]` ganha `size`, `equivalentPeople`, `proportionalAnnualImpact`, `residualProportionalAnnualImpact`. `result.stores[].roles[]` ganha `equivalentPeople`, `proportionalCost`, `residualEquivalentPeople`, `residualProportionalCost`, `coverageMode` (`quadro_atual` | `minimo_por_turno`), `slackHours`, `zeroReason`.
- Campos antigos (`grossAnnualImpact`, `peopleToHire`...) ficam, com o mesmo significado: contratações inteiras. A tela trata simulações antigas (sem campos novos) mostrando só o que existe.

### 4. Tela
- **Formulário da loja**: primeiro o **tamanho** (obrigatório). Por função: "Pessoas hoje", jornada, salário, ausência (opcional). O "mínimo por turno" vai para uma área **"Opções avançadas"**, fechada por padrão, com o texto "Quantas pessoas precisam estar juntas na loja (opcional)". Farmacêutico sempre ativo.
- **Resultado**: métrica principal "Custo proporcional por ano" e "Pessoas equivalentes"; abaixo, "Contratações inteiras" com seu custo. Tabela por função com equivalentes, custo proporcional, contratações inteiras, e uma frase de explicação quando o impacto é zero. Lista e ranking mostram o tamanho.
- **Relatórios**: PDF e CSV com as novas colunas e o tamanho da loja; PDF reorganiza a tabela por função (equivalentes, custo proporcional, contratações inteiras, após ações).
- **Compatibilidade**: componentes tratam campos novos como opcionais para abrir simulações antigas.

### 5. Acesso somente com login (FR-011 a FR-016)
- **Rotas (tela)**: `/` vira um redirecionamento (`AuthRedirect`): carregando mostra "Carregando…"; sem sessão vai para `/entrar`; com sessão vai para `/lojas`. Sai `RapidoPage` e o botão público do cabeçalho passa a "Entrar" e "Criar conta" só quando não há sessão.
- **Remoção do modo rápido**: apagar `features/quick-calculator/`, `lib/quickImpact*`, `lib/buildSummaryText*`, `lib/describeQuickResult*`, `lib/quickLabels.ts`, `buildQuickReport` e seus testes. O tipo de premissas e o arquivo `config/premises.ts` perdem o bloco `quick` (e a API deixa de devolvê-lo): o que sobra é `taxation` e `detailed`.
- **API**: `GET /premises/defaults` e `POST /contact-requests` passam por `requireSession`. O pedido de contato usa `principal.user` e `principal.group` para nome, e-mail e empresa; o corpo traz `roleTitle`, `phone`, `sector?`, `acceptPrivacy: true`, `profile`, `result`, `idempotencyKey`, `utm?`. `mode` aceita só `detalhado` e `source` só `consultor` (os valores `rapido` e `pdf` ficam no enum do banco, sem migration destrutiva). Campo isca (`website`) removido.
- **Tela de contato**: `ContactFormModal` mostra cargo, telefone, setor e o aceite; nome, e-mail e empresa aparecem só para conferência.
- **PDF**: `ReportDownloadButtons` já baixa direto no modo detalhado; sai o fluxo com formulário.
- **Compatibilidade**: contatos já gravados (origem `pdf`, modo `rapido`) continuam consultáveis pela equipe.

## Estrutura de arquivos
```text
backend/node/prisma/schema.prisma, migrations/<nova>/        # size + min_per_shift nulo
backend/node/src/modules/stores/                              # schemas, repository, service
backend/node/src/modules/simulations/impact.calculator.ts     # modo quadro atual + equivalentes
backend/node/src/modules/simulations/simulations.service.ts   # snapshot com size
frontend/react/src/features/stores/                           # storeForm, StoreForm, RolesEditor, lista
frontend/react/src/features/simulations/                      # types, describeResult, GroupTotals, tabela, ranking
frontend/react/src/features/reports/                          # reportModel, storesCsv, buildPdf
specs/001-.../contracts/api.md, quickstart.md                  # atualizados no fim
```

## Riscos e cuidados
- **Testes existentes** assumem `minPerShift` obrigatório e só contratações inteiras: serão ajustados, mantendo os casos conferidos à mão.
- **Arredondamento**: lojas com poucas pessoas têm equivalentes pequenos (ex.: 0,2) e 1 contratação inteira; a tela mostra os dois para evitar leitura errada.
- **Premissas continuam provisórias** (encargos, ausência): validar com finanças e RH.
