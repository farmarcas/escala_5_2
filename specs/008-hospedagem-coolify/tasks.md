# Tarefas 008

- [x] T001 API: `TRUST_PROXY` em `config/env.ts` e `app.ts`, com teste do IP real atrás de `X-Forwarded-For`
- [x] T002 [P] API: `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_SECURE` em `env.ts` e `shared/mailer.ts`, com teste (com e sem credenciais)
- [x] T003 API: recusa de subir em produção com `COOKIE_SECURE` falso, `APP_BASE_URL` sem https ou sem servidor de e-mail; teste
- [x] T004 API: `prisma` como dependência, script de entrada de produção (`migrate deploy` e servidor) e ajuste do `Dockerfile`; conferir que a imagem final constrói e sobe
- [x] T005 Tela: estágio de produção do `Dockerfile` com nginx (`nginx.conf`: arquivos, fallback do React, repasse de `/api` e `/health`, cabeçalhos de segurança, compressão e cache)
- [x] T006 `docker-compose.prod.yml` e `.env.production.example` (sem segredos); `check-repo.sh` passa a conferir que não há segredo nem valor real
- [x] T007 Conferência local da imagem de produção (fluxo completo, cookie `Secure`, `/api` chegando, tela sem rolagem lateral)
- [x] T008 `infrastructure/docker/COOLIFY.md` (passo a passo, variáveis, backup, voltar versão, pedido à TI) e atualização de README e `AGENTS.md` (lacuna de produção)
- [x] T009 Tipos, lint, testes (API, integração e tela), `validar-frontend.sh`, `sync-templates`; commit
