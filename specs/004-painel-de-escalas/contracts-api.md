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

Corpo da loja: `name, city, state, scaleStartDate (segunda-feira), taxRegime, hours, rules, plantao, holidays, sales, roles[]`. Contratos completos nos schemas em `backend/node/src/modules/scales/scales.schemas.ts`.
