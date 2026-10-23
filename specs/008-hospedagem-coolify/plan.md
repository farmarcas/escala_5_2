# Plano 008 — Hospedar no Coolify

**Spec**: [spec.md](spec.md) · Sem mudança de regra de negócio, banco ou telas.

## Escolhi
Publicar pelo Coolify com **Docker Compose de produção** (`docker-compose.prod.yml`) com dois serviços, **tela** (pública, com HTTPS do Coolify) e **API** (interna), e usar o **PostgreSQL gerenciado do próprio Coolify** (recurso separado) ligado por `DATABASE_URL`.

## Por quê
- A tela e a API sobem e voltam de versão juntas, e só a tela é pública.
- O banco gerenciado do Coolify já tem backup agendado e restauração pela interface. Isso resolve a história 3 sem eu inventar um backup próprio.
- É o jeito que o Coolify faz melhor: ele cuida de domínio, HTTPS, saúde e troca de versão.

## Como
**Tela (`frontend/react`)**
- Novo estágio de produção no `Dockerfile`: gera os arquivos (`vite build`) e serve com **nginx**: arquivos estáticos com cache, páginas do React caindo em `index.html`, `/api` e `/health` repassados para a API, compressão e cabeçalhos de segurança (HSTS, `nosniff`, `frame-ancestors`, política de referência). Usuário sem privilégio e saúde pela própria página.
- O IP do visitante segue pelo cabeçalho `X-Forwarded-For`.

**API (`backend/node`)**
- Imagem de produção que já existe, ajustada: `prisma` passa a ser dependência normal (hoje fica só no desenvolvimento e a imagem final não o teria), e a subida roda `prisma migrate deploy` antes do servidor, em um script de entrada.
- **Confiar no proxy:** novo `TRUST_PROXY` (número de saltos; padrão 0). Em produção são 2 (proxy do Coolify e nginx da tela). Faz o limite de tentativas usar o IP real.
- **E-mail:** novas variáveis opcionais `MAIL_USER`, `MAIL_PASSWORD` e `MAIL_SECURE`; com usuário e senha a API autentica e usa conexão segura (porta 465 direto, 587 com STARTTLS). Sem elas, funciona como hoje.
- Em produção a API recusa subir se `COOKIE_SECURE` for falso, `APP_BASE_URL` não for `https` ou faltar o e-mail (proteção contra publicar errado).

**Composição (`docker-compose.prod.yml`)**
- Só `web` e `api`. Sem Mailpit, sem portas no computador, sem código por volume. Variáveis vindas do Coolify (`DATABASE_URL`, `APP_BASE_URL`, `MAIL_*`, `ADMIN_API_KEY`, `ANTHROPIC_API_KEY` opcional, `TRUST_PROXY`). Saúde em `/health/ready`; a tela espera a API ficar saudável.
- `.env.production.example` com os nomes e **sem nenhum valor secreto**.

**Guia (`infrastructure/docker/COOLIFY.md`)**: passo a passo em linguagem simples (criar banco, criar aplicação a partir do GitHub, variáveis, domínio, primeiro deploy, backup, voltar versão) e a lista do que a TI precisa fazer (DNS).

## Testes e conferência
- Testes unitários: leitura de `TRUST_PROXY` e IP real com `X-Forwarded-For`; envio de e-mail com e sem usuário e senha; recusa de configuração insegura em produção.
- Conferência local da imagem de produção: subir `docker-compose.prod.yml` com um Postgres local, abrir a tela pelo nginx e passar pelo fluxo cadastro → confirmação (e-mail de teste) → loja → diagnóstico, conferir `Set-Cookie` com `Secure` por um proxy HTTPS de teste e que `/api` chega à API.
- Verificação final de tipos, lint, testes e `validar-frontend.sh`.

## O que depende de você depois
Endereço (DNS), servidor de e-mail e remetente, e o envio das branches ao GitHub. Tudo entra por variável do Coolify, sem mudar código.
