# Publicar o Radar Escala no Coolify

Painel: https://coolify.radar.farmarcas.com.br/

O Coolify publica o que estiver no GitHub (`farmarcas/escala_5_2`, branch `main`). Antes de começar, as mudanças precisam ter sido enviadas ao GitHub.

## O que será criado
Uma única aplicação do tipo Docker Compose (`docker-compose.prod.yml`) com três serviços: `web` (tela, pública), `api` (interna) e `postgres` (banco, interno, com volume próprio). Só a tela recebe endereço.

## Passo a passo
1. **Criar a aplicação.** No projeto: *+ New* → *Application* → repositório `farmarcas/escala_5_2` (GitHub), branch `main`, *Build Pack*: **Docker Compose**, arquivo: `/docker-compose.prod.yml`.
2. **Variáveis** (aba *Environment Variables*; nomes em `.env.production.example`):
   - `APP_BASE_URL` (o endereço final, com `https://`)
   - `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`
   - `ADMIN_API_KEY` (aleatória, mínimo 16 caracteres)
   - `ANTHROPIC_API_KEY` (opcional; sem ela o botão de IA não aparece)
   - `TRUST_PROXY=2`
   - A senha do banco (`SERVICE_PASSWORD_POSTGRES`) o Coolify gera sozinho.
3. **Domínio.** No serviço `web`, campo *Domains*: o endereço com `https://` e a porta `:8080` (ex.: `https://radarescala.farmarcas.com.br:8080`). `api` e `postgres` não recebem domínio.
4. **Publicar.** *Deploy*. A API espera o banco ficar saudável e aplica as migrations sozinha. Se algo falhar, o Coolify mantém a versão anterior.
5. **Publicar sozinho a cada mudança.** Ligue o *Auto Deploy* da aplicação para a branch `main`.

## Backup do banco
Os dados ficam no volume `postgres_data`; atualizar a aplicação não os apaga. Como o banco está dentro do compose, o backup agendado do Coolify pode não aparecer para ele. Enquanto isso, faça uma cópia manual (no terminal do servidor ou do serviço `postgres`):

```bash
docker exec <container-postgres> pg_dump -U radar radar | gzip > radar-$(date +%F).sql.gz
```

Guarde o arquivo fora do servidor. Se o backup automático for exigido, a alternativa é um PostgreSQL gerenciado do Coolify e a variável `DATABASE_URL` (exige ajustar o compose).

## A API recusa subir se...
`COOKIE_SECURE` não for verdadeiro (o compose já fixa isso), `APP_BASE_URL` não começar com `https://` ou faltarem `MAIL_USER`/`MAIL_PASSWORD` (a menos que `ALLOW_PRODUCTION_WITHOUT_MAIL=true`, interruptor temporário: sem e-mail, ninguém consegue se cadastrar nem recuperar senha; desligue ao configurar o e-mail). A mensagem aparece nos logs do serviço `api`.

## Voltar a uma versão anterior
Na aplicação: *Deployments* → escolha o deploy anterior → *Rollback* (ou *Redeploy* de um commit anterior). O volume do banco não é desfeito. Migrations já aplicadas **não** voltam sozinhas: mudanças de banco seguem o padrão expand/contract, então a versão antiga continua funcionando com o banco novo.

## Pedido para a TI
- Apontar o DNS do endereço escolhido para o servidor do Coolify.
- Informar servidor SMTP, usuário, senha e remetente (ex.: `Farmarcas <nao-responda@farmarcas.com.br>`).

## Limites conhecidos
- Uma única cópia da API: o limite de tentativas de login fica na memória dela.
- Monitoramento: só a saúde básica do Coolify (`/health/ready`).

## Teste local da imagem de produção
Sem o Coolify: `docker build -t radar-api backend/node` e `docker build -t radar-web frontend/react`. A tela precisa de `API_UPSTREAM` (ex.: `http://api:4000`) e rodar na mesma rede Docker da API.
