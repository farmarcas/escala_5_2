# Roteiro de validação: Painel de Escalas

Pré-requisito: ambiente no ar e conta confirmada (login obrigatório).

## Roteiro 1: caso de conferência (fatia 1)
1. Entre e crie a loja **"Drogaria Exemplo — Centro"** (Varginha/MG, início 14/12/2026, Lucro Presumido/Real) com o horário e a equipe do caso de conferência da [spec](spec.md).
2. Abra **Diagnóstico e custos** em 5x2 · 42h. Conferir:
   - Necessário 6x1: farmacêutico 5, gerente/subgerente 4, balconista 9, caixa 4, perfumista 3, serviços gerais 3, entregador 3.
   - Necessário 5x2 · 42h: 5, 3, 8, 4, 3, 3, 3 → contratar 3, 1, 3, 2, 2, 2, 2 (15 pessoas).
   - Folha mensal: ≈ R$ 68.701 hoje e ≈ R$ 141.455 na 5x2 · 42h (diferença ≈ R$ 72.754, +105,9%, ≈ R$ 873 mil por ano).
3. Diferenças entre o painel e a referência aparecem listadas (com a causa) na página de testes de conferência do projeto.

## Roteiro 2: escala (fatia 2)
1. Aba **Escala**, cenário 5x2 · 42h, função Farmacêutico: 4 semanas por pessoa com entrada, saída, almoço, lanche e "Reforço"; farmacêutico presente em todo o horário; mínimo de 11 h entre jornadas; folga dominical conforme a regra.
2. Trocar para 6x1 · 44h e 5x2 · 40h: o quadro e as horas mudam e o salão continua "Coberto".

## Roteiro 3: custos (fatia 3)
Alternar Simples e Presumido/Real, com e sem provisões: componentes mensais, direto x indireto e custo por colaborador mudam coerentemente.

## Roteiro 4: plantão e feriados (fatia 4)
Ativar plantão mensal e cadastrar um feriado municipal: a escala, as folgas compensatórias e o resumo "Feriados no período" mudam.

## Roteiro 5: relatório e consultor (fatia 6)
Baixar o Excel: abas e números iguais aos da tela. "Falar com um consultor": pedido registrado com os dados da conta.

## Roteiro 6: segurança e acesso
Sem login, qualquer rota do painel e da API volta 401 ou leva à entrada; um grupo nunca vê a loja de outro.
