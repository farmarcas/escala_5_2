# Data Model — Calculadora de Impacto do Fim da Escala 6x1

Convenções do projeto ([database/DATABASE.md](../../database/DATABASE.md)): tabelas no plural em `snake_case`, PK UUIDv7 gerada pela aplicação, `timestamptz(3)`, `numeric` para dinheiro e taxas, exclusão lógica (`deleted_at`) onde há dado do usuário, collation `pt_br` em texto apresentado a pessoas. Alterações via Prisma Migrate; índices parciais e collation no SQL da migration.

## Diagrama (resumo)

```text
groups 1─── * users
groups 1─── * stores 1─── * store_roles
groups 1─── * simulations
users  1─── * sessions
users  1─── * email_tokens
contact_requests (independente; pode não ter conta)
```

## Tabelas

### groups (grupo de farmácias)

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| name | text (pt_br) | obrigatório |
| tax_regime | enum `real`, `presumido`, `simples` | padrão `real`; define encargos e efeito fiscal |
| annual_revenue | numeric(16,2) null | faturamento anual, para % do faturamento no resumo |
| created_at, updated_at, deleted_at | timestamptz | |

### users (evolui a tabela existente)

| Campo | Tipo | Regra |
| --- | --- | --- |
| id, name, email, created_at, updated_at, deleted_at | já existem | e-mail único entre ativos (índice parcial existente) |
| group_id | uuid FK groups | novo; obrigatório após preenchimento |
| password_hash | text | novo; `scrypt` com sal; nunca devolvido pela API |
| email_verified_at | timestamptz null | novo; sem isso não há login |
| privacy_accepted_at | timestamptz | novo; consentimento LGPD |

### sessions

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK users | |
| token_hash | text único | SHA-256 do token do cookie |
| expires_at | timestamptz | renova a cada uso (7 dias) |
| revoked_at | timestamptz null | logout |
| created_at | timestamptz | |

### email_tokens

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| user_id | uuid FK users | |
| kind | enum `verify`, `reset` | |
| token_hash | text único | |
| expires_at, used_at, created_at | timestamptz | uso único |

### stores (loja)

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| group_id | uuid FK groups | todo acesso filtra por aqui |
| name | text (pt_br) | obrigatório; único entre ativas dentro do grupo |
| city | text (pt_br) | |
| profile | enum `rua`, `shopping`, `24h` | |
| opening_hours | jsonb | `[{ "weekday": 0..6, "opensAt": "08:00", "closesAt": "22:00" }]`; dia ausente = fechado; `24h` aceito como 00:00–24:00; fechamento antes da abertura = vira o dia |
| created_at, updated_at, deleted_at | timestamptz | |

`opening_hours` fica em JSON porque é um valor atômico da loja, sempre lido e gravado junto (sem consultas por dia). Validado por schema Zod na API.

### store_roles (equipe por função e loja)

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| store_id | uuid FK stores | |
| role | enum `farmaceutico`, `balconista`, `caixa`, `estoquista` | único por (store_id, role) |
| min_per_shift | smallint | ≥ 0; **≥ 1 para `farmaceutico`** |
| headcount | smallint | ≥ 0, pessoas hoje |
| weekly_hours | numeric(4,1) | jornada atual (padrão 44); entre 1 e 44 |
| monthly_salary | numeric(12,2) | > 0 |
| absence_rate | numeric(4,3) null | 0–0,5; nulo usa o padrão das premissas |
| created_at, updated_at | timestamptz | |

### simulations (foto salva)

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| group_id | uuid FK groups | |
| created_by | uuid FK users | |
| name | text (pt_br) | obrigatório; único entre ativas no grupo |
| premises | jsonb | premissas usadas, com `version` |
| input | jsonb | lojas e equipes no momento do cálculo |
| mitigations | jsonb | ações marcadas por loja/função e efeitos |
| result | jsonb | resultado por loja/função, total e ranking |
| created_at, updated_at, deleted_at | timestamptz | |

Foto imutável de propósito (FR-018): editar loja ou premissa depois **não** altera simulação antiga. Reabrir mostra os valores guardados; há ação "recalcular com dados atuais" que cria uma nova simulação.

### contact_requests

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | uuid PK | |
| source | enum `consultor`, `pdf` | origem do pedido |
| name, role_title, company, phone, email | text | obrigatórios; e-mail validado |
| sector | text null | |
| privacy_accepted_at | timestamptz | obrigatório |
| mode | enum `rapido`, `detalhado` | |
| profile | jsonb | respostas do modo rápido ou resumo do grupo |
| result | jsonb | resultado no momento do envio |
| idempotency_key | text único | impede envio duplicado (duplo clique) |
| utm | text null | origem da campanha |
| created_at | timestamptz | |
| anonymized_at | timestamptz null | LGPD: dados pessoais apagados a pedido |

## Regras de validação (resumo)

- Salário > 0; `headcount` e `min_per_shift` inteiros ≥ 0; farmacêutico com `min_per_shift` ≥ 1.
- Percentuais entre 0 e 100 (modo rápido) ou 0 e 1 (taxas guardadas).
- Telefone brasileiro (10 ou 11 dígitos); e-mail válido; nome de loja não vazio.
- Senha com ao menos 10 caracteres.

## Transições de estado

- **Conta**: cadastrada (sem e-mail confirmado) → confirmada (pode entrar) → excluída (dados do grupo apagados).
- **Sessão**: ativa → expirada ou revogada.
- **Simulação**: criada → renomeada / duplicada / apagada (lógica). Nunca editada em números.

## Índices principais

- `stores (group_id, deleted_at)`; único parcial `(group_id, lower(name)) WHERE deleted_at IS NULL`.
- `store_roles (store_id, role)` único.
- `simulations (group_id, created_at DESC) WHERE deleted_at IS NULL`.
- `sessions (token_hash)`, `email_tokens (token_hash)`.
- `contact_requests (created_at DESC)`, `(idempotency_key)` único.
