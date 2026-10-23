# Contrato da API — `/api/v1`

Segue o contrato comum do projeto ([backend/BACKEND.md](../../../backend/BACKEND.md)): recursos no plural, kebab-case, entrada validada com Zod, datas ISO 8601 UTC, listagens paginadas (`?page=&pageSize=`), erro no formato:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Texto em português", "details": [] } }
```

Autenticação: cookie de sessão `HttpOnly`. Requisições que alteram dados exigem `Origin` do mesmo site (senão `403 FORBIDDEN_ORIGIN`). 🔓 = público; 🔒 = exige sessão; 🗝️ = exige `x-admin-key`.

Códigos de erro comuns: `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN_ORIGIN` (403), `NOT_FOUND` (404; também para recurso de outro grupo), `CONFLICT` (409), `RATE_LIMITED` (429).

## Premissas

| Método e caminho | Acesso | Resposta |
| --- | --- | --- |
| `GET /premises/defaults` | 🔓 | `{ version, reviewedAt, provisional, taxation, quick, detailed }`; `detailed.actions` traz as ações do modo detalhado com `defaultEffect` sugerido |

## Conta (auth)

| Método e caminho | Acesso | Corpo → resposta |
| --- | --- | --- |
| `POST /auth/register` | 🔓 | `{ name, email, password, groupName, acceptPrivacy: true }` → `202` (envia e-mail de confirmação; resposta igual exista ou não a conta) |
| `POST /auth/verify-email` | 🔓 | `{ token }` → `204` |
| `POST /auth/login` | 🔓 | `{ email, password }` → `200 { user }` + cookie. Erro genérico `401 INVALID_CREDENTIALS`; `429` após 5 falhas |
| `POST /auth/logout` | 🔒 | `204` |
| `GET /auth/me` | 🔒 | `{ user, group }` |
| `POST /auth/forgot-password` | 🔓 | `{ email }` → `202` sempre |
| `POST /auth/reset-password` | 🔓 | `{ token, password }` → `204` (revoga sessões) |
| `PATCH /groups/current` | 🔒 | `{ name?, taxRegime?, annualRevenue? }` → `{ group }` |
| `DELETE /auth/account` | 🔒 | `{ password }` → `204` (apaga dados do grupo; LGPD) |

## Lojas

| Método e caminho | Acesso | Corpo → resposta |
| --- | --- | --- |
| `GET /stores` | 🔒 | lista paginada do grupo, com resumo de equipe |
| `POST /stores` | 🔒 | `{ name, city, profile, openingHours[], roles[] }` → `201 { store }` |
| `GET /stores/:id` | 🔒 | `{ store }` com `roles[]` |
| `PATCH /stores/:id` | 🔒 | campos parciais, `roles[]` substitui o conjunto → `{ store }` |
| `DELETE /stores/:id` | 🔒 | `204` (exclusão lógica) |

`roles[]` item: `{ role, minPerShift, headcount, weeklyHours, monthlySalary, absenceRate? }`.

## Simulações (modo detalhado)

Corpo comum de cálculo (todos os campos opcionais):

```json
{
  "storeIds": ["uuid"],
  "taxRegime": "real | presumido | simples",
  "premiseOverrides": {
    "taxation": { "monthsPerYear": 13.33, "chargesRealPresumido": 1.55, "chargesSimples": 1.25, "irpjCsllRate": 0.34 },
    "detailed": { "absenceRate": 0.13 }
  },
  "mitigations": {
    "<storeId>": {
      "hoursReductionPerWeek": 4,
      "actions": { "banco-horas": 0.15, "negociacao-coletiva": 0.05 }
    }
  }
}
```

Ações aceitas: `ajuste-quadro`, `escalas-demanda`, `banco-horas`, `multifuncionalidade`, `automacao`, `negociacao-coletiva` (efeito de 0 a 1 sobre o déficit novo de horas). O farmacêutico só recebe `negociacao-coletiva` e o ajuste de horário. Mitigação de loja que não é do grupo (ou não está na simulação) é ignorada. Ações desconhecidas e valores fora dos limites dão `400`.

| Método e caminho | Acesso | Corpo → resposta |
| --- | --- | --- |
| `POST /simulations/preview` | 🔒 | corpo comum → `{ result, taxRegime, premises }` (não salva; usado para recalcular ao vivo) |
| `POST /simulations` | 🔒 | corpo comum + `{ name }` → `201 { simulation }` (guarda premissas, lojas, ações e resultado). Nome repetido: `409 SIMULATION_NAME_EXISTS` |
| `GET /simulations?page=&pageSize=` | 🔒 | `{ data: [{ id, name, createdAt, updatedAt, taxRegime, storeCount, totals, warnings }], meta }` |
| `GET /simulations/:id` | 🔒 | `{ simulation }` completa |
| `PATCH /simulations/:id` | 🔒 | `{ name }` → `{ simulation }` (só o nome muda) |
| `POST /simulations/:id/duplicate` | 🔒 | `{ name }` → `201 { simulation }` (cópia idêntica) |
| `POST /simulations/:id/recalculate` | 🔒 | `{ name }` → `201 { simulation }`: nova simulação com as lojas de hoje, mantendo regime, premissas e ações. `400` se nenhuma loja da original existe mais |
| `DELETE /simulations/:id` | 🔒 | `204` (exclusão lógica; o nome volta a ficar livre) |
| `GET /simulations/compare?ids=a,b,c` | 🔒 | `{ items: [{ id, name, ...resumo }] }` na ordem pedida (2 a 4 ids; de outro grupo ou inexistente: `404`) |

`simulation` (detalhe):

```json
{
  "id": "…", "name": "…", "createdAt": "…", "updatedAt": "…",
  "taxRegime": "real",
  "premises": { "taxation": { "…": 0 }, "detailed": { "targetWeeklyHours": 40, "absenceRate": 0.13 } },
  "premisesVersion": "2026-10-22-provisoria",
  "stores": [{ "id": "…", "name": "…", "city": "…", "profile": "rua", "openingHours": [], "roles": [] }],
  "mitigations": {},
  "result": { }
}
```

`result`:

```json
{
  "totals": {
    "grossAnnualImpact": 0, "netAnnualImpact": 0, "peopleToHire": 0, "storesWithImpact": 0,
    "residualAnnualImpact": 0, "residualPeopleToHire": 0, "savings": 0
  },
  "stores": [
    { "storeId": "…", "name": "…", "weeklyOpenHours": 84, "grossAnnualImpact": 0, "peopleToHire": 0,
      "hasImpact": false, "residualGrossAnnualImpact": 0, "residualPeopleToHire": 0, "savings": 0,
      "mitigationReduction": 0,
      "roles": [{ "role": "balconista", "hoursToCover": 0, "hoursAvailableAt40": 0, "baselineDeficit": 0,
                  "newDeficit": 0, "peopleToHire": 0, "annualCost": 0, "mandatoryPresence": false,
                  "residualNewDeficit": 0, "residualPeopleToHire": 0, "residualAnnualCost": 0 }] }
  ],
  "ranking": [{ "storeId": "…", "name": "…", "grossAnnualImpact": 0 }],
  "warnings": ["MITIGATION_ABOVE_USUAL"]
}
```

## Contato (público)

| Método e caminho | Acesso | Corpo → resposta |
| --- | --- | --- |
| `POST /contact-requests` | 🔓 | `{ source: "consultor"\|"pdf", name, roleTitle, company, phone, email, sector?, acceptPrivacy: true, mode: "rapido"\|"detalhado", profile, result, idempotencyKey, utm?, website }` → `201 { id }`. O telefone é normalizado para `(DD) 9XXXX-XXXX`. `website` é o campo isca: preenchido, responde `201` sem gravar. Mesmo `idempotencyKey` devolve o mesmo `id` sem duplicar. Limite de 20 envios por hora por IP (`429`). |

## Equipe da Farmarcas

Exige o cabeçalho `x-admin-key` com o valor de `ADMIN_API_KEY` (sem a variável configurada, a consulta fica desligada e responde `401`).

| Método e caminho | Acesso | Resposta |
| --- | --- | --- |
| `GET /admin/contact-requests?page=&pageSize=&format=json\|csv` | 🗝️ | lista paginada, do mais novo para o mais antigo; `format=csv` devolve CSV UTF-8 com BOM, separador `;` e proteção contra fórmulas de planilha |
| `POST /admin/contact-requests/:id/anonymize` | 🗝️ | `204`: apaga os dados pessoais (nome, cargo, empresa, telefone, e-mail, setor, utm); perfil e resultado ficam. Id inexistente: `404 CONTACT_NOT_FOUND` |

## Saúde

`GET /health` e `GET /health/ready` (já existem, fora de `/api/v1`).

## Removido

O CRUD aberto `/api/v1/users` do esqueleto sai da API: contas passam a ser criadas só por `/auth/register`.
