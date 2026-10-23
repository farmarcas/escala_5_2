# Publicar o Radar Escala no Coolify

Painel: https://coolify.radar.farmarcas.com.br/

O Coolify publica o que estiver no GitHub (`farmarcas/escala_5_2`, branch `main`). Antes de começar, as mudanças precisam ter sido enviadas ao GitHub.

## O que será criado
- **Banco**: PostgreSQL gerenciado do Coolify (recurso separado, com backup).
- **Aplicação**: `docker-compose.prod.yml` com dois serviços, `web` (tela, pública) e `api` (interna).

## Passo a passo
1. **Criar o banco.** No projeto: *+ New* → *Database* → *PostgreSQL 16*. Deixe **sem** "Make it publicly available". Copie a **Postgres URL (internal)**.
2. **Agendar backup.** No banco: *Backups* → diário, com retenção. Faça uma restauração de teste em outro banco uma vez.
3. **Criar a aplicação.** *+ New* → *Application* → repositório `farmarcas/escala_5_2` (GitHub), branch `main`, *Build Pack*: **Docker Compose**, arquivo: `/docker-compose.prod.yml`.
4. **Variáveis** (aba *Environment Variables*; nomes em `.env.production.example`):
   - `DATABASE_URL` (a URL interna do passo 1)
   - `APP_BASE_URL` (o endereço final, com `https://`)
   - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`
   - `ADMIN_API_KEY` (aleatória, mínimo 16 caracteres)
   - `ANTHROPIC_API_KEY` (opcional; sem ela o botão de IA não aparece)
   - `TRUST_PROXY=2`
5. **Domínio.** No serviço `web`, campo *Domains*: o endereço com `https://` e a porta `:8080` (ex.: `https://radarescala.farmarcas.com.br:8080`). O `api` não recebe domínio.
6. **Publicar.** *Deploy*. A API aplica as migrations sozinha ao subir. Se algo falhar, o Coolify mantém a versão anterior.
7. **Publicar sozinho a cada mudança.** Ligue o *Webhook*/*Auto Deploy* da aplicação para a branch `main`.

## A API recusa subir se...
`COOKIE_SECURE` não for verdadeiro (o compose já fixa isso), `APP_BASE_URL` não começar com `https://` ou faltarem `MAIL_USER`/`MAIL_PASSWORD`. A mensagem aparece nos logs do serviço `api`.

## Voltar a uma versão anterior
Na aplicação: *Deployments* → escolha o deploy anterior → *Rollback* (ou *Redeploy* de um commit anterior). Migrations já aplicadas **não** voltam sozinhas: mudanças de banco seguem o padrão expand/contract, então a versão antiga continua funcionando com o banco novo.

## Pedido para a TI
- Apontar o DNS do endereço escolhido para o servidor do Coolify.
- Informar servidor SMTP, usuário, senha e remetente (ex.: `Farmarcas <nao-responda@farmarcas.com.br>`).

## Limites conhecidos
- Uma única cópia da API: o limite de tentativas de login fica na memória dela.
- Monitoramento: só a saúde básica do Coolify (`/health/ready`).

## Teste local da imagem de produção
Sem o Coolify: `docker build -t radar-api backend/node` e `docker build -t radar-web frontend/react`. A tela precisa de `API_UPSTREAM` (ex.: `http://api:4000`) e rodar na mesma rede Docker da API.
