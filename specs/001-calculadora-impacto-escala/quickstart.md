# Quickstart — validar a calculadora de ponta a ponta

Roteiro para provar que a funcionalidade funciona depois de implementada. Serve também de checklist de aceite com a pessoa.

## Pré-requisitos

- Docker Desktop aberto.
- `.env` criado a partir de `.env.example` (inclui `MAIL_*`, `ADMIN_API_KEY` de teste e `MAILPIT_UI_PORT`).

## Subir

```bash
docker compose up -d --build --wait
```

Esperado: `docker compose ps` mostra postgres, api, web (e mailpit) `healthy`.

Endereços locais: tela `http://localhost:3000`, API `http://localhost:4000/health/ready`, caixa de e-mail de teste `http://localhost:8025`.

## Testes automáticos

```bash
docker compose exec api npm run lint
docker compose exec api npm test
docker compose exec api npm run test:integration
```

Esperado: tudo verde (inclui "grupo A não vê dados do grupo B").

## Roteiro 1 — Modo rápido (público)

1. Abrir `http://localhost:3000` sem login.
2. Preencher: 20 lojas, 400 colaboradores, 85% em 6x1, salário R$ 2.100, faturamento R$ 120 milhões, perfil "rua", 7 dias, Lucro Real.
3. Esperado: faixa de impacto bruto e líquido, % do faturamento, pessoas e custo; resultado muda ao editar qualquer campo; aviso legal visível.
4. Conferir à mão: afetados = 340; pessoas a repor = 34; custo por pessoa = 2.100 × 13,33 × 1,55 = R$ 43.389,15 (arredondado).
5. Abrir premissas, mudar encargos; resultado recalcula e aparece "premissas alteradas" + botão voltar ao padrão.
6. Escolher Lucro Presumido com faturamento R$ 120 milhões: aparece o aviso do limite de R$ 78 milhões.
7. Marcar ações de mitigação; residual cai entre 30% e o teto da maturidade escolhida.
8. "Baixar relatório": pede nome e e-mail corporativo e aceite; PDF baixa com os mesmos números da tela.
9. "Falar com um consultor": enviar; ver "Solicitação registrada!"; duplo clique grava uma vez só.
10. Consultar o contato:

```bash
curl -s -H "x-admin-key: $ADMIN_API_KEY" "http://localhost:4000/api/v1/admin/contact-requests"
```

## Roteiro 2 — Conta e lojas

1. "Criar conta": nome, e-mail, senha (10+), nome do grupo, aceite.
2. Abrir `http://localhost:8025`, clicar no link de confirmação.
3. Entrar. Esperado: lista de lojas vazia com orientação.
4. Cadastrar loja "Centro": rua, aberta todos os dias 08:00–20:00, farmacêutico (mín. 1, 2 pessoas, 44h, R$ 8.500), balconista (mín. 2, 5 pessoas, 44h, R$ 2.100).
5. Tentar salvar farmacêutico com mínimo 0: bloqueado com mensagem.
6. Sair e entrar de novo: a loja continua lá.
7. Errar a senha 5 vezes: bloqueio temporário com mensagem genérica.

## Roteiro 3 — Detalhado, ações e comparação

1. Rodar simulação com a loja "Centro".
2. Conferir à mão: abertura 12h × 7 = 84 h/semana. Balconista: 84 × 2 = 168 h a cobrir. Ausência 13%: 5 pessoas × 40 × 0,87 = 174 h → sem déficit a 40h, sem contratação. Farmacêutico: 84 h a cobrir; 2 × 40 × 0,87 = 69,6 h → déficit; a 44h: 2 × 44 × 0,87 = 76,56 h → déficit de 7,44 h; novo déficit = 14,4 − 7,44 = 6,96 h → 1 pessoa a contratar (6,96 ÷ 34,8 → arredonda para cima).
3. Destaque "presença obrigatória" no farmacêutico; multifuncionalidade não aparece como opção para ele.
4. Marcar "ajuste de horário" (−4 h/semana) e "banco de horas" (15%) na balconista; residual atualiza em menos de 1 s.
5. Salvar como "Base" e como "Com ações"; abrir "Comparar": lado a lado, diferença bate com as ações.
6. Mudar o salário da loja e reabrir "Base": números antigos permanecem, com a data e as premissas de origem.
7. Baixar PDF e CSV: números iguais aos da tela.

## Roteiro 4 — Isolamento e privacidade

1. Criar segunda conta (outro grupo) e tentar abrir o link de uma simulação da primeira: `404`.
2. Pedir exclusão da conta: lojas e simulações do grupo somem; contatos ficam anonimizados quando solicitado pela equipe.

## Celular

Abrir a tela com largura de 375 px: modo rápido completo, sem rolagem lateral, campos e botões utilizáveis.

## Parar

```bash
docker compose down
```

(Não usar `-v`: apagaria o banco local.)
