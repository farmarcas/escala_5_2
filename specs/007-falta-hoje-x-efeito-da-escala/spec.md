# Spec 007 — Separar "falta hoje" do "efeito da nova escala"

**Status**: rascunho para aprovação · **Origem**: dúvida do dono ao ver "26 pessoas a contratar" e folha de R$ 18 mil para R$ 102 mil na Loja Gabriel.

## Problema
O resumo e o diagnóstico mostram um único número ("a contratar") e uma única variação de folha. Esse número mistura duas coisas:
1. **Falta hoje**: a loja não tem gente para cobrir o horário e o mínimo no salão que o próprio cadastro pede, mesmo na escala atual (6x1).
2. **Efeito da nova escala (5x2)**: a diferença que vem só da mudança de 6x1 para 5x2.

Exemplo real (Loja Gabriel): 9 pessoas hoje, 31 necessárias na 6x1 e 30 na 5x2. Falta hoje = 22; efeito da nova escala = −1. Hoje a tela diz "+21 colaboradores" e "+R$ 76 mil por mês" como se tudo fosse da nova lei. Isso leva a decisão errada.

## O que o produto passa a fazer

### História 1 — Dois números claros (prioridade 1)
Em todo lugar que hoje mostra "a contratar" e "variação da folha", a pessoa vê as duas partes:
- **Para cobrir o horário hoje** (na escala atual 6x1): quantas pessoas faltam e quanto custariam por mês.
- **Efeito da nova escala 5x2**: quantas pessoas a mais (ou a menos) e quanto muda a folha, a partir da loja já coberta.
- O total continua visível (é a soma das duas partes), com a frase que explica a origem em linguagem simples.

Onde aparece: Resumo ao vivo do cadastro, faixa de destaque e cartões do Diagnóstico, relatório em Excel (aba de comparativo), pedido ao consultor (resumo) e análise com IA (a IA passa a citar as duas partes).

**Critérios de aceite**
- Loja Gabriel: mostra "falta para cobrir hoje: 22" e "efeito da escala 5x2: −1" (soma 21, igual ao de antes).
- Loja que já cobre o horário: "falta hoje: 0" e o efeito é o que o resultado já mostrava.
- A soma das duas partes é sempre igual ao número total atual (nenhum número existente muda).
- Valores em reais seguem a mesma regra: falta hoje + efeito = diferença total da folha.
- Excel, tela e IA mostram os mesmos números.

### História 2 — Aviso no passo 4 do cadastro (prioridade 2)
Quando uma função tem **0 pessoas hoje** e **mínimo no salão ≥ 1** (ou menos pessoas hoje do que o mínimo), o cartão da função mostra um aviso curto: "Você não tem ninguém aqui hoje e pediu alguém presente o tempo todo. Isso gera N contratações. Se a função não precisa ficar o dia todo, use 'Faixa de horário' ou mínimo 0."
- Só informa. Não bloqueia nem muda o cálculo.
- N vem do cálculo real da função (necessário menos pessoas hoje).

## Fora do escopo
- Mudar o motor de cálculo ou as regras legais (continua calibrado com o site de referência).
- Mudar os valores de exemplo do cadastro novo.
- Sugestões automáticas de mudança de cadastro (isso é papel da análise com IA).

## Regras de negócio e decisões
- "Falta hoje" = soma, por função, de (necessário na 6x1 − pessoas hoje), nunca negativa. O custo dessa parte usa a mesma folha (salário, encargos, provisões) da loja.
- "Efeito da nova escala" = total na 5x2 − total na 6x1 (pode ser negativo ou zero), com o custo correspondente.
- A conta no código reaproveita campos que o diagnóstico já calcula (`need` por cenário, `gap6x1`); não cria cálculo novo de pessoas.

## Perguntas de negócio
Nenhuma em aberto. Escolhi: manter o total como está e acrescentar as duas partes ao lado, para quem já se acostumou com o número não se perder.
