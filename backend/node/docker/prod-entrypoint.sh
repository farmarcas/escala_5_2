#!/bin/sh
# Entrada do container de produção da API: aplica as migrations pendentes e inicia o servidor.
# Se a migration falhar, o container não sobe e o Coolify mantém a versão anterior no ar.
set -e
npx prisma migrate deploy
exec node dist/server.js
