# Research — Calculadora de Impacto do Fim da Escala 6x1

Todas as decisões abaixo são do agente (constituição, princípio VIII). Nenhuma foi levada ao usuário como pergunta.

## 1. Onde roda cada cálculo

- **Decision**: modo rápido no navegador (função pura em `frontend/react/src/lib/quick-impact.ts`); modo detalhado na API (`modules/simulations/impact.calculator.ts`, função pura).
- **Rationale**: o rápido precisa de resposta instantânea e é público (sem servidor, sem custo por uso). O detalhado precisa ser fonte única de verdade para o que fica salvo e comparável. Cada fórmula existe em um só lugar.
- **Alternatives**: código compartilhado entre os dois serviços (exigiria pacote comum e mudar os Dockerfiles); tudo na API (rápido ficaria lento e acoplado à rede).

## 2. Fórmulas do modo rápido

Estrutura inspirada na análise em [referencia-peers.md](referencia-peers.md), com parâmetros e regras próprios.

```
afetados      = round(colaboradores × pct6x1)
pessoasRepor  = afetados × 0,10                          (44h→40h)
custoPessoa   = salário × 13,33 × encargos               (regime define encargos)
coberturaMin/Max = cobertura do perfil de loja × multiplicador de dias (min/max)
bruto         = pessoasRepor × custoPessoa × cobertura   (faixa)
liquido       = bruto × (1 − 0,34) se Lucro Real, senão bruto
%faturamento  = bruto / faturamento
resultadoOp   = faturamento × margem do perfil de loja ; %resultadoOp = bruto / resultadoOp
pessoas       = round(pessoasRepor × cobertura)
mitigação     = 0 sem ação; com k ações (1 a 6): 30% + (teto_maturidade − 30%) × (k − 1) / 5
residual      = bruto × (1 − mitigação)
```

Mudanças deliberadas frente à referência (corrigem fragilidades da análise):

- **Maturidade passa a valer**: define o teto de mitigação (padrão provisório: ainda não começamos 40%; em avaliação 45%; plano em curso 50%). Evita campo decorativo (FR-009).
- **Número de lojas** é informativo e gera "impacto médio por loja"; fica marcado como tal na tela.
- **Cobertura** aparece como premissa editável com explicação ("quanto da lacuna de horas vira contratação"), em vez de fator escondido.
- **Custo das contratações** é mostrado uma vez só (na referência repetia o impacto bruto).
- Valores padrão provisórios (todos editáveis): encargos 1,55 (Real/Presumido) e 1,25 (Simples); 13,33 meses; alíquota 34%; limite Presumido R$ 78 milhões. Margens e coberturas por perfil de loja (rua / shopping / 24h) começam em margem 5% e cobertura 60%–95% (valores de farmácia da referência, apenas como ponto de partida) e **precisam de validação da área financeira**.

## 3. Fórmulas do modo detalhado

Por loja e função (farmacêutico, balconista, caixa, estoquista):

```
horasAberturaSemana = Σ (fechamento − abertura) por dia aberto      (24h → 24 por dia)
horasCobrir         = horasAberturaSemana × equipeMinima
disponibilidade     = 1 − taxaAusencia                              (férias + faltas + afastamentos)
horasDisp(jornada)  = quantidade × jornada × disponibilidade
deficit(jornada)    = max(0, horasCobrir − horasDisp(jornada))
deficitNovo         = deficit(40) − deficit(jornadaAtual)           (só o que a mudança acrescenta)
pessoasContratar    = ceil(deficitNovo / (40 × disponibilidade))
custoAnual          = pessoasContratar × salário × 13,33 × encargos
```

- **Por que `deficitNovo`**: se a loja já está curta hoje (a 44h), o custo da mudança é só o déficit adicional. Sem isso o modo detalhado inflaria o impacto.
- **Arredondamento**: pessoas inteiras por loja/função (não se contrata 0,3 pessoa). O total do grupo soma loja a loja; por isso pode diferir levemente do modo rápido, e a tela explica.
- **Farmacêutico**: presença obrigatória durante toda a abertura. `equipeMinima` ≥ 1 validado. Ações de mitigação de **flexibilização de equipe** (multifuncionalidade, automação, ajuste de quadro) não se aplicam a ele; só ajuste de horário e negociação coletiva.
- **Ausência padrão provisória**: 13% (férias ~8% + faltas e afastamentos ~5%). Editável por função. Precisa validação do RH/financeiro.
- **Ações de mitigação (detalhado)**: cada ação tem efeito em % sobre `deficitNovo` da loja/função (padrão sugerido provisório: ajuste de quadro 10%, escalas por demanda 15%, banco de horas 15%, multifuncionalidade 10%, automação 10%, negociação coletiva 5%). Combinação multiplicativa: `residual = deficitNovo × Π(1 − efeito)`. **Ajuste de horário** é entrada em horas/semana removidas da abertura. Se a redução combinada passar de 50%, a tela mostra aviso de "acima do usual". Valores são provisórios e editáveis.
- **Ordem de cálculo com ações**: aplica ajuste de horário (muda `horasCobrir`), recalcula `deficitNovo`, depois aplica os percentuais, depois arredonda para pessoas inteiras.

## 4. Premissas padrão (único lugar de ajuste)

- **Decision**: arquivo `backend/node/src/config/premises.ts` com `version` e `reviewedAt`, entregue por `GET /api/v1/premises/defaults`. O modo rápido carrega ao abrir; o detalhado usa o padrão e permite ajuste por simulação. Cada simulação salva guarda cópia das premissas usadas.
- **Rationale**: ajustar um número = mudar um arquivo e reiniciar, sem mexer em lógica (FR-026). Sem tabela nem tela de administração nesta versão (fora do escopo).
- **Alternatives**: tabela no banco com tela de admin (mais coisa a construir e proteger agora).

## 5. Autenticação (lacuna do projeto)

O projeto declara que não tem procedimento de autenticação. Regras adotadas, pequenas e auditáveis:

- **Senha**: `crypto.scrypt` do Node, sal aleatório por senha, comparação em tempo constante; mínimo 10 caracteres; sem armazenar senha em texto ou log.
- **Sessão**: token aleatório de 32 bytes em cookie `HttpOnly`, `SameSite=Lax`, `Secure` fora do desenvolvimento; só o hash (SHA-256) vai ao banco; expira em 7 dias sem uso (renovação deslizante) e pode ser revogada no logout. Sem JWT: revogação imediata e sem segredo de assinatura para gerenciar.
- **CSRF**: cookie `SameSite=Lax` + verificação do cabeçalho `Origin` em toda requisição que altera dados; a tela fala com a API pelo mesmo endereço (proxy), como o projeto já faz.
- **Confirmação de e-mail e recuperação de senha**: token aleatório de uso único, só o hash no banco, expira em 24 h (confirmação) e 1 h (recuperação). Resposta de "esqueci a senha" é sempre a mesma, exista ou não o e-mail.
- **Tentativas**: limite de 5 falhas de login por e-mail+IP em 15 minutos, mensagem genérica de erro. O limitador é em memória nesta versão (suficiente para uma instância); troca por armazenamento compartilhado se a API for replicada.
- **Isolamento**: toda leitura e escrita de lojas e simulações filtra por `group_id` da sessão; teste de integração cobre "grupo A não vê grupo B" (SC-008). Recurso de outro grupo responde 404.
- **LGPD**: consentimento registrado com data; exclusão da conta apaga lojas e simulações do grupo e anonimiza contatos; só dados necessários.
- **Fora desta versão**: login social, autenticação em dois fatores, perfis de acesso por grupo.
- **Alternatives**: biblioteca de auth/servidor de identidade (mais peso e configuração para um caso simples); JWT (revogação difícil).
- **Recomendação**: rodar `/security-review` antes de publicar fora da máquina local.

## 6. E-mail

- **Decision**: `nodemailer` por SMTP configurado em `.env`. Em desenvolvimento, serviço **Mailpit** no Compose (`127.0.0.1:8025` mostra as mensagens). Em produção, a Farmarcas informa o servidor SMTP (decisão de infraestrutura fora do escopo local).
- **Rationale**: testa o fluxo real de e-mail sem enviar nada para fora.
- **Alternatives**: link no log (não amigável); provedor específico (amarra fornecedor).

## 7. Contatos e consulta pela equipe

- **Decision**: tabela `contact_requests` com origem (`consultor` ou `pdf`), perfil e resultado do momento. A equipe consulta por `GET /api/v1/admin/contact-requests` (JSON ou CSV) protegido por chave `ADMIN_API_KEY` do `.env`, sem tela nesta versão.
- **Rationale**: atende "consultável pela equipe" (SC-008) com o mínimo; evita criar perfil de administrador agora.
- **Proteção**: campo isca anti-robô (honeypot) e limite de envios por IP; envio duplicado tratado por chave de idempotência gerada na tela.
- **Alternatives**: tela de admin com login separado (maior escopo); planilha enviada por e-mail (dados pessoais circulando sem controle).

## 8. PDF e planilha

- **PDF**: `jspdf` no navegador, a partir do resultado que já está na tela (garante SC-003: mesmos números). Texto em Helvetica com acentos do português.
- **Planilha**: **CSV** em UTF-8 com BOM e separador `;` (abre direto no Excel brasileiro). Sem dependência extra.
- **Alternatives**: PDF no servidor (navegador headless pesado); XLSX (dependência a mais sem ganho para esta versão).

## 9. Tela (frontend)

- **Decision**: converter o esqueleto de JSX para TypeScript (exigência da skill `component-development`), adicionar Tailwind (skill `styling-tailwind`) e `react-router-dom`. Estado de servidor em hooks por feature (`fetch` simples, sem biblioteca de cache).
- **Rationale**: segue as skills do projeto; mantém poucas dependências.
- **Acessibilidade e celular**: HTML semântico, rótulos em todos os campos, resultado em região com `aria-live`, layout de uma coluna no celular (SC-007).
- **Formato BR**: funções de formatação em `lib/format-pt-br.ts` (`1.234,56`, `R$`, `%`) e entrada de números aceita vírgula e ponto.

## 10. Banco

- **Decision**: UUIDv7 como PK (padrão já usado em `users`), tabelas no plural em `snake_case`, `timestamptz(3)`, exclusão lógica onde há dado do usuário, `numeric` para dinheiro e taxas, collation `pt_br` em nomes de lojas e cidades. Detalhes em [data-model.md](data-model.md).
- **`users` existente**: é o esqueleto de exemplo. A migration estende a tabela (senha, e-mail confirmado, grupo, consentimento) e o CRUD público de `users` é **removido da API**, pois deixaria dados de contas abertos. A migration segue expand/contract: colunas novas nulas, preenchidas, e depois restrições.
- **Simulação salva**: guarda `premises`, `input` e `result` como JSON (foto imutável). Justificativa de 3NF: o conteúdo é um instantâneo histórico, que não pode mudar quando a loja ou as premissas mudarem depois (FR-018). As lojas continuam normalizadas nas suas tabelas.

## 11. Testes (TDD)

- Cálculo detalhado e rápido: testes unitários antes do código, com casos conferidos à mão (SC-002): loja 12h × 7 dias; loja 24h; déficit já existente; farmacêutico; ausência; arredondamento.
- Auth e isolamento: testes de integração (cadastro, confirmação, login errado, limite de tentativas, sessão expirada, grupo A × B).
- Lint, tipos e testes verdes antes de entregar; `scripts/validar-frontend` para a tela.

## Pontos para a Farmarcas validar (fora do código)

1. Encargos, meses de remuneração, margens e coberturas por perfil de loja.
2. Taxa de ausência padrão e efeito sugerido de cada ação.
3. Servidor SMTP de produção e remetente.
4. Texto final da política de privacidade e do aviso legal.

## Registro das decisões tomadas durante a construção

- **Versões da tela**: para rodar testes com Vitest 5, a tela passou de Vite 5 para Vite 8 (e `@vitejs/plugin-react` 6). Sem mudança de tecnologia: continua React + Vite + Tailwind. `@types/node` foi adicionado só para o `vite.config.ts`.
- **API atrás de proxy**: o limite de tentativas usa o IP da requisição. Se a API for publicada atrás de um proxy ou balanceador, é preciso configurar `trust proxy` do Express e um armazenamento compartilhado para o limite (hoje é em memória, uma instância). Item de implantação, fora do escopo local.
- **Ajuste de horário**: entra antes dos percentuais e vale para todas as funções, inclusive o farmacêutico.
- **Comparação**: de 2 a 4 simulações.
- **Mitigação no modo rápido**: sem ação marcada não há redução; com 1 ação vale o piso (30%) e com as 6, o teto da maturidade.
