# Roteiro de validação: quadro atual da loja

Pré-requisito: ambiente no ar (`docker compose up -d --build --wait`), conta confirmada. Regime Lucro Real, encargos 1,55, 13,33 meses, ausência padrão 13%.

## Roteiro 0: acesso só com login
1. Saia da conta e abra `http://localhost:3000/`: você cai na tela de **entrada** (não existe mais página pública da calculadora).
2. Tente abrir `/lojas` e `/simulacao` sem login: também vai para a entrada. Entrar, "Criar conta", confirmar e-mail, "esqueci a senha" e a política de privacidade seguem abertos.
3. Entre: o sistema leva para **Minhas lojas**. Abrir `/` logado também leva para lá.
4. Pela linha de comando, sem sessão: `curl -s -o /dev/null -w "%{http_code}" localhost:4000/api/v1/premises/defaults` e `.../api/v1/contact-requests` (POST) devolvem **401**.
5. Logado, "Falar com um consultor" pede só cargo, telefone, setor (opcional) e o aceite; nome, e-mail e empresa vêm da conta. O PDF e a planilha baixam direto.

## Roteiro 1: sem "mínimo por turno" (o caso do dono)
1. **Minhas lojas → Cadastrar loja**: nome "Centro", tamanho **média**, aberta de segunda a sábado, das 08:00 às 20:00.
2. Farmacêutico: 2 pessoas, 44h, R$ 8.500. Balconista: 10 pessoas, 44h, R$ 2.100. Deixe "Opções avançadas" fechadas.
3. **Simular impacto**. Conferir à mão:
   - Pessoas equivalentes: farmacêutico 2 × 0,1 = **0,2**; balconista 10 × 0,1 = **1,0**; total **1,2**.
   - Custo por pessoa: farmacêutico R$ 8.500 × 13,33 × 1,55 ≈ R$ 175.623; balconista R$ 2.100 × 13,33 × 1,55 ≈ R$ 43.389.
   - **Custo proporcional**: 0,2 × 175.623 + 1,0 × 43.389 ≈ **R$ 78,5 mil por ano**.
   - **Contratações inteiras**: 1 farmacêutico + 1 balconista = **2 pessoas**, ≈ **R$ 219 mil por ano**.
4. A lista e o ranking mostram o tamanho "Média".

## Roteiro 2: resultado zero com explicação
1. Edite a loja, abra **Opções avançadas** e informe, no balconista, "pessoas juntas na loja" = 1 (com 10 pessoas no quadro).
2. Simule: balconista com **0 equivalentes** e a frase explicando a folga de horas ("o quadro cadastrado já cobre a abertura com 40h").
3. Jornada 40h em uma função: frase "já trabalha 40h, sem impacto".

## Roteiro 3: compatibilidade
1. Abra uma simulação salva antes desta mudança: abre normalmente, sem erro, mostrando só os números que existiam.
2. Abra uma loja antiga: tamanho aparece como "não informado"; ao salvar, a tela exige o tamanho.
3. Baixe PDF e CSV de uma simulação nova: trazem tamanho, equivalentes, custo proporcional e contratações inteiras, iguais aos da tela.
