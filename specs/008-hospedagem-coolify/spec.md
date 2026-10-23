# Spec 008 — Hospedar o Radar Escala no Coolify

**Status**: rascunho para aprovação · **Origem**: pedido "vamos hospedar esse site no Coolify".

> O guia do projeto ainda não tem procedimento de produção (imagem final, registry, orquestração). Esta spec cobre essa lacuna só para o Coolify e fica documentada ao final.

## Objetivo
Colocar o Radar Escala no ar, com endereço próprio e HTTPS, rodando no Coolify da Farmarcas, de forma que quem tem conta (associado) acesse de qualquer lugar e que cada nova versão suba com poucos cliques.

## O que o produto passa a ter

### História 1 — Site no ar com HTTPS (prioridade 1)
- Um endereço (ex.: `radarescala.farmarcas.com.br`) com certificado HTTPS automático do Coolify.
- Uma única entrada pública: a tela. A API não fica exposta direto; a tela repassa `/api` para ela (como no ambiente local).
- O banco PostgreSQL não é acessível pela internet.

**Aceite**: abrir o endereço mostra a tela de entrada; cadastrar, confirmar o e-mail, entrar, criar loja e ver o diagnóstico funcionam; o cookie de sessão sai marcado como seguro.

### História 2 — E-mails de verdade (prioridade 1)
- O cadastro e a recuperação de senha mandam e-mail de verdade por um servidor de e-mail (SMTP) da Farmarcas, com usuário e senha, em conexão segura.
- O Mailpit (caixa de teste) não vai para produção.

**Aceite**: o e-mail de confirmação chega na caixa de uma conta real, com o link do endereço de produção.

### História 3 — Atualizar e voltar atrás sem medo (prioridade 2)
- A cada novo código no GitHub (branch principal), o Coolify reconstrói e publica sozinho, ou com um clique.
- O banco é atualizado automaticamente na subida (migrations), sem apagar dados.
- Se a versão nova não ficar saudável, o Coolify mantém a anterior no ar.
- Backup diário do banco, com restauração testada uma vez.

**Aceite**: publicar uma mudança pequena de texto leva o site à nova versão sem derrubar o acesso; um backup restaurado em outro banco abre as lojas salvas.

### História 4 — Segredos e IA ligados com segurança (prioridade 2)
- Todas as chaves (banco, e-mail, chave da equipe, chave da IA) ficam nas variáveis do Coolify, nunca no Git.
- A IA liga se a chave da Anthropic for colocada; sem ela, o botão não aparece.
- Atrás do proxy do Coolify, a API enxerga o IP real do visitante (para o limite de tentativas de login e de IA contar certo).

**Aceite**: nenhum arquivo do repositório contém segredo; com e sem a chave da IA o site funciona; 6 logins errados seguidos bloqueiam o IP real, não o proxy.

## Fora do escopo
- Domínio, DNS e certificado corporativo (a equipe de TI aponta o endereço para o servidor).
- Mais de uma cópia da API (hoje o limite de tentativas fica na memória de uma só).
- Monitoramento e alertas avançados (só saúde básica do Coolify).
- Mudanças de regra de negócio.

## O que precisa mudar no projeto (resumo; detalhes no plano)
- Imagem de produção da tela (servidor estático + repasse de `/api`); a da API já existe.
- Arquivo de composição para produção, separado do local (sem Mailpit, sem portas abertas, sem código por volume).
- API: confiar no proxy (`trust proxy`), usuário e senha do SMTP, e subir aplicando migrations.
- Guia curto para a equipe: variáveis, primeira publicação, backup e como voltar versão.

## Perguntas de negócio (preciso das respostas para o plano)
1. **Endereço e servidor:** qual endereço o site terá, e o Coolify já existe (qual a URL do painel e quem tem acesso)? O repositório está em `farmarcas/escala_5_2` no GitHub e o envio das branches ainda está pendente; o Coolify só publica o que estiver lá.
2. **E-mail:** qual servidor de e-mail (SMTP) e qual remetente a Farmarcas usa para mandar os e-mails de confirmação? (Se ainda não houver, posso deixar tudo pronto e a conta de e-mail entra depois.)
