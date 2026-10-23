# Implementation Plan: Calculadora de Impacto do Fim da Escala 6x1

**Branch**: `001-calculadora-impacto-escala` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-calculadora-impacto-escala/spec.md`

## Summary

Duas experiências sobre a mesma base: (1) **modo rápido público**, cálculo feito no navegador, com premissas editáveis, PDF e formulário de contato; (2) **modo detalhado autenticado**, em que o gestor cadastra lojas e equipes, a API calcula o impacto por loja/função com a conta de horas descrita na spec, e simulações são salvas como "fotos" reproduzíveis. Stack da constituição (Node 22 + TypeScript + Prisma + PostgreSQL 16; React + Vite + Tailwind), com login próprio por e-mail e senha e sessão em cookie. Detalhes: [research.md](research.md), [data-model.md](data-model.md), [contracts/api.md](contracts/api.md), [quickstart.md](quickstart.md).

## For the reader

Chosen: o modo rápido calcula direto na tela, e o modo detalhado calcula no servidor e guarda cada simulação como uma foto do momento.

Why: o modo rápido responde na hora e dispensa cadastro; no detalhado, o servidor guarda exatamente os números e as premissas usados, então uma simulação antiga nunca muda sozinha.

## Technical Context

**Language/Version**: TypeScript (Node 22 na API; React 18 + Vite 5 na tela)

**Primary Dependencies**: já no projeto: Express 5, Zod, Prisma, Pino. Novas, justificadas em [research.md](research.md): `tailwindcss`, `clsx`, `tailwind-merge` (visual, exigido pela skill), `react-router-dom` (páginas), `jspdf` (PDF no navegador, como a referência) e `nodemailer` (e-mail de confirmação e recuperação de senha). Senha usa o `scrypt` nativo do Node, sem dependência extra

**Storage**: PostgreSQL 16 (já no Compose). Migrations Prisma. Senhas com `scrypt`, sessões e tokens guardados só como hash

**Testing**: Vitest (unitário do cálculo, TDD) + Supertest (HTTP, login e isolamento entre grupos). Tela: Vitest nas funções puras de cálculo e formatação; fluxos conferidos pelo roteiro do [quickstart.md](quickstart.md)

**Target Platform**: Navegadores atuais, desktop e celular; ambiente local em Docker Compose

**Project Type**: Aplicação web (API + tela)

**Performance Goals**: modo rápido recalcula em < 100 ms no navegador; modo detalhado com 200 lojas responde em < 1 s (SC-004)

**Constraints**: tudo em Docker; portas só em `127.0.0.1`; nenhum segredo no git; dados de um grupo nunca visíveis a outro; LGPD (consentimento, exclusão)

**Scale/Scope**: poucos milhares de contas, até ~200 lojas por grupo, ~15 telas

## Constitution Check

*GATE: passa antes da pesquisa e é reavaliado após o desenho.*

| Princípio | Situação |
| --- | --- |
| I. Spec Kit obrigatório | ✅ spec → plan; `tasks` e `implement` seguem com aprovação |
| II. Tudo no Docker | ✅ um serviço novo só para desenvolvimento (Mailpit, caixa de e-mail de teste); sobe junto com `docker compose up` |
| III. Stack padrão | ✅ stack mantida. Dependências novas justificadas em [research.md](research.md) (ver Complexity Tracking) |
| IV. Banco só muda por migration | ✅ toda tabela nova e a evolução de `users` via Prisma Migrate (expand/contract) |
| V. Dados locais protegidos | ✅ nenhum comando destrutivo previsto; testes de integração usam banco `_test` separado |
| VI. Linguagem simples e execução pelo agente | ✅ agente roda tudo e explica em linguagem simples |
| VII. Começar pequeno | ✅ entrega em fatias: rápido (P1) → conta e lojas → detalhado → ações/salvar → PDF/planilha → contato |
| VIII. Agente decide o técnico | ✅ decisões abaixo; nenhuma pergunta técnica ao usuário |

**Pós-desenho**: sem violações. Lacuna conhecida do projeto: autenticação não tem skill (AGENTS.md). Seguimos o padrão de API do projeto e registramos as regras de segurança que adotamos em [research.md](research.md); recomenda-se revisão de segurança (`/security-review`) antes de publicar fora da máquina local.

## Project Structure

### Documentation (this feature)

```text
specs/001-calculadora-impacto-escala/
├── spec.md
├── referencia-peers.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md             # gerado por /speckit-tasks
```

### Source Code (repository root)

```text
backend/node/
├── prisma/
│   ├── schema.prisma                # + groups, stores, store_roles, simulations, sessions, email_tokens, contact_requests; evolui users
│   └── migrations/                  # novas migrations
└── src/
    ├── config/
    │   ├── env.ts                   # + MAIL_*, ADMIN_API_KEY, COOKIE_SECURE
    │   └── premises.ts              # premissas padrão da Farmarcas (único lugar de ajuste) + versão e data de revisão
    ├── shared/
    │   ├── mailer.ts                # envio de e-mail (SMTP; Mailpit em desenvolvimento)
    │   ├── middlewares/require-session.ts, require-admin-key.ts, same-origin.ts, rate-limit.ts
    │   └── security/password.ts, tokens.ts
    └── modules/
        ├── auth/                    # cadastro, confirmação, login, logout, recuperação (substitui o CRUD aberto de `users`)
        ├── premises/                # entrega premissas padrão (público)
        ├── stores/                  # lojas e equipe por função (por grupo)
        ├── simulations/             # impact.calculator.ts (puro), mitigations, salvar/listar/comparar
        ├── contacts/                # solicitações de contato e lead de PDF (público)
        └── admin-contacts/          # consulta da equipe Farmarcas (chave de admin)

frontend/react/
├── vite.config.ts, tsconfig.json, tailwind (tokens no @theme)
└── src/
    ├── app/                         # páginas finas: Rapido, Entrar, Cadastrar, Lojas, Simulacao, Comparar
    ├── components/ui/               # Button, TextField, SelectField, Slider, Modal, StatusBadge...
    ├── components/layout/           # PageShell, Header
    ├── features/
    │   ├── quick-calculator/        # formulário, resultado, premissas editáveis
    │   ├── auth/                    # sessão, formulários de conta
    │   ├── stores/                  # cadastro de lojas e equipe
    │   ├── simulations/             # resultado por loja, ranking, ações, salvar, comparar
    │   ├── reports/                 # PDF (jspdf) e CSV
    │   └── contact/                 # formulário "Falar com um consultor"
    └── lib/                         # quick-impact.ts (cálculo rápido, puro), format-pt-br.ts, cn.ts

docker-compose.yml                   # + serviço mailpit (só dev)
.env.example                         # + MAIL_*, ADMIN_API_KEY, MAILPIT_UI_PORT
```

**Structure Decision**: mantém a divisão `backend/node` + `frontend/react` que o projeto já tem. O cálculo rápido vive só na tela (`lib/quick-impact.ts`) e o detalhado só na API (`impact.calculator.ts`): cada fórmula existe em um único lugar, sem duplicar código entre serviços.

## Complexity Tracking

| Item | Por que é necessário | Alternativa mais simples rejeitada porque |
| --- | --- | --- |
| Serviço `mailpit` (só dev) | Cadastro exige e-mail de confirmação e recuperação de senha; precisa de uma caixa de teste local | Imprimir links no log: pouco amigável para quem não é desenvolvedor e não testa o e-mail de verdade |
| `nodemailer` | Enviar e-mail por SMTP (Mailpit local; servidor da Farmarcas depois) | Fetch manual a um provedor: amarra a um fornecedor |
| `react-router-dom` | Várias páginas e rotas protegidas | Troca de tela por estado: quebra o botão voltar e links diretos |
| `jspdf` | PDF gerado no navegador, sem servidor, igual à referência | PDF no servidor exige navegador headless pesado no Docker |
| `tailwindcss`, `clsx`, `tailwind-merge` | Exigido pela skill de estilo e pela constituição | — |
| Login próprio (sem biblioteca de auth) | O projeto não tem skill de auth; `scrypt` nativo + sessão em cookie é pequeno e auditável | Biblioteca de auth externa traz muita superfície e dependência para um caso simples |
