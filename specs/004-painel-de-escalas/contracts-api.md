# Contrato da API do Painel de Escalas

Base: `/api/v1/scales`. Todas as rotas exigem sessão (cookie `fm_session`); escritas conferem a origem. Cada conta só enxerga as lojas do próprio grupo (loja de outro grupo responde 404).
Erros: `{ error: { code, message, details: [{ path, message }] } }`.

| Método e rota | O que faz |
| --- | --- |
| `GET /defaults` | Loja de exemplo para o cadastro novo (início na próxima segunda-feira) |
| `GET /rules` | Base legal aplicada (`asOf`, `rules[]`, `scenarios[]`) |
| `POST /preview` | Recebe uma loja sem salvar; devolve `{ diagnostic, alerts }` |
| `GET /stores` | Lista resumida (`id, name, city, state, people, updatedAt`) |
| `POST /stores` | Cria a loja (corpo completo, validado por Zod). 409 se o nome já existe no grupo |
| `GET /stores/:id` | Loja completa |
| `PUT /stores/:id` | Substitui a loja |
| `DELETE /stores/:id` | Exclusão lógica |
| `POST /stores/:id/duplicate` | Copia como "Nome (cópia)" |
| `GET /stores/:id/diagnostic?regime=&provisions=` | `{ diagnostic, alerts }`; `regime` (`simples`, `lucro_presumido_real`) e `provisions` (`true`, `false`) simulam sem gravar |
| `GET /stores/:id/roster?scenario=` | Escala de 4 semanas (`6x1_44`, `5x2_42`, `5x2_40`) |
| `GET /stores/:id/report.xlsx` | Relatório em Excel (mesmos números da tela) |

O diagnóstico separa o "contratar" em duas partes que somam o total: `totals.fill` e `rows[].fill` (falta para cobrir o horário já na 6x1) e `totals.effect[cenário]` e `rows[].effect[cenário]` (efeito só da nova escala). Em reais: `payroll.fillMonthly`, `payroll.covered` (folha da loja coberta na 6x1) e `payroll.scenarios[cenário].effectMonthly` (soma = `monthlyDifference`).

Corpo da loja: `name, city, state, scaleStartDate (segunda-feira), taxRegime, hours, rules, plantao, holidays, sales, roles[]`. Contratos completos nos schemas em `backend/node/src/modules/scales/scales.schemas.ts`.

## Análise com IA (`/api/v1/assistant`, spec 006)

Login obrigatório. A IA só lê e calcula; não grava nada.

| Rota | O que faz |
| --- | --- |
| `GET /status` | `{ enabled }`: `true` quando `ANTHROPIC_API_KEY` está configurada. Sem a chave o botão não aparece |
| `POST /analyze` | Corpo: `storeId`, `scenario` (`5x2_42`/`5x2_40`), `regime?`, `provisions?`, `prompt?` (até 1.000 caracteres), `history?` (até 8 mensagens). Responde em fluxo (`text/event-stream`) com eventos `text`, `tool`, `scenario`, `reset`, `done`, `error`. 404 se a loja é de outro grupo, 429 no limite técnico por conta, 503 `ASSISTANT_DISABLED` sem chave |

Privacidade: ao modelo vão só os números e regras da loja (sem nome, cidade, UF nem dados pessoais). O texto da conversa não é gravado nem entra no log (só metadados: resultado, voltas, ferramentas, uso, tempo).
