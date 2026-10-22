# Observações de calibração (resultados da referência, para teste)

Coletadas em 22/10/2026 digitando casos controlados no painel de referência, usado como **instrumento de medição** (registramos resultados, não código). Servem de testes dourados do nosso motor.

**Método e cuidados**
- Cada caso usa uma **loja nova** ("Nova loja"), sem reaproveitar estado. Uma primeira bateria foi feita reaproveitando a mesma loja e **foi descartada** (resultados contaminados por estado anterior).
- Salvo indicação, gerente/subgerente e entregador desligados, funções com os valores padrão, sem plantão, folga dominical "1 a cada 3 semanas", almoço 60 min, lanche pago 15 min, feriados nacionais ligados, regime Simples.
- A referência **trava** com a combinação "Todo domingo (CCT)" + loja aberta no domingo. O nosso motor deve avisar e recusar essa combinação.

## 1. Custos: decifrados (batem exatamente)
Por colaborador (Lucro Presumido/Real), com RAT 2% e terceiros 5,8% (valores padrão em "Encargos avançados"):
- `adicionais`: periculosidade do entregador de moto = 30% do salário.
- `13º + férias+1/3` = `(salário + adicionais) × (1/12 + 1/9)`. Ex.: 1.950 → 379,17.
- `FGTS (8%)` = `0,08 × (salário + adicionais + 13º/férias)`; `multa do FGTS` = `40% do FGTS`. Ex.: 1.950 → 186,33 + 74,53 = 260,87.
- `INSS patronal + RAT + terceiros` = `27,8% × (salário + adicionais + 13º/férias)` (20% + 2% + 5,8%). Ex.: 1.950 → 647,51; total FGTS+INSS 908,38.
- Simples Nacional: INSS = 0 (dentro do DAS); FGTS e multa iguais.
- Sem provisões: FGTS e INSS incidem só sobre o salário (e adicionais): 1.950 → 156 + 542,10 = 698,10; sem multa.
- Vale-transporte (parte da empresa) = `max(0, dias/mês × passagens × valor − 6% × salário)`, com `dias/mês = dias por semana × 4,34` (5x2: 21,7). Ex.: 1.950 → 21,7 × 9 − 117 = 78,30; 3.000 → 15,30.
- Benefícios = benefícios cadastrados + VT empresa. Ex.: 350 + 78,30 = 428,30.
- Totais (exemplo balconista 1.950, Presumido): 1.950 + 379,17 + 908,38 + 428,30 = 3.665,84 (88% sobre o salário).

## 2. Quantidade de pessoas: o que se vê
Função **Caixa**, mínimo no salão 1, loja abre às 07:00 e fecha 07:00 + W, dias abertos a partir de segunda (d); valores 6x1 · 44h / 5x2 · 42h (iguais em 5x2 · 40h):

| W | d=5 | d=6 | d=7 |
|---|---|---|---|
| 6 h | 3 / 3 | 3 / 3 | 3 / 4 |
| 10 h | 3 / 3 | 3 / 3 | 3 / 4 |
| 15 h | 4 / 3 | 4 / 3 | 5 / 4 |

Loja segunda a sábado 07–22 + domingo variável (Caixa e Farmacêutico, que deram o mesmo; Balconista com mínimo 2 entre parênteses):

| Domingo | folga 1 em 3 | folga 1 em 2 |
|---|---|---|
| fechado | 4 / 3 (7 / 6) | 4 / 3 (7 / 6) |
| 08–14 | 4 / 4 (8 / 7) | 4 / 4 (9 / 8) |
| 08–20 | 4 / 4 (8 / 7) | 4 / 4 (8 / 8) |
| 07–22 | 5 / 4 (9 / 7) | 6 / 4 (12 / 8) |

Loja segunda a sábado 07–22 + domingo 08–14 (BASE), funções padrão: 5x2 · 42h: farmacêutico 4, balconista 8, caixa 4, perfumista 3, serviços gerais 3 (11 contratações).

### Plantão e outros ajustes sobre a BASE (5x2 · 42h: farmacêutico / balconista / caixa / perfumista / serviços gerais)
- Semanal 22:00–07:00, 1 farmacêutico e 1 balconista, cobertura pela equipe: 4 / 8 / 4 / 3 / 3 (6x1: farmacêutico 5). Adicional noturno R$ 237, horas extras R$ 355, intervalo indenizado R$ 222.
- Mensal (1ª ou 2ª semana), mesma configuração: 5 / 8 / 4 / 3 / 3 (6x1: farmacêutico 5, balconista 9); adicional noturno R$ 414, horas extras R$ 621, reflexo no DSR R$ 173, intervalo indenizado R$ 388.
- Mensal com 2 farmacêuticos, 1 balconista, 1 caixa: 6 / 8 / 5 / 3 / 3 (6x1: 7 / 9 / 5).
- Mensal com plantonista intermitente: 4 / 7 / 4 / 3 / 3 e **zero** adicional noturno e horas extras no custo.
- Mensal sem indenizar o intervalo: mesma quantidade; intervalo indenizado R$ 0, horas extras R$ 178.
- Dono farmacêutico atuando: farmacêutico 6x1 3 e 5x2 4 (6x1 reduz uma pessoa).
- Farmacêutico com mínimo 2 no salão: 8 / 8.
- Perfumista: janela 09–19 → 3; janela 10–14 → 2; cobertura integral → 4 (6x1) e 3 (5x2).
- Feriados desligados: perfumista e serviços gerais passam de 3 para 2 (5x2) e as folgas compensatórias somem; "pagamento em dobro" gera R$ 1.524 (hoje) e R$ 2.538 (nova).

## 3. Conclusão sobre a igualdade numérica
O resultado de "necessário" da referência é de **algoritmo heurístico**, com efeitos que parecem não ligados à função (por exemplo, o balconista 5x2 vai de 8 para 7 ao mudar o lanche para 0, o almoço para 30 ou 90, ao colocar o caixa em 12x36 ou ao incluir um gerente, e volta a 8 com lanche de 20 min, almoço de 120 min, "feriados em escala fixa" e outras mudanças). Isso indica que a contagem depende do arranjo global das folgas e dos feriados, e não só de cada função isolada. Reproduzir **exatamente** todos os números em qualquer configuração exigiria reproduzir o algoritmo deles. A meta realista do nosso motor: regras claras e legais, resultado determinístico, e diferença **dentro de ±1 pessoa por função** na maioria dos casos, com cada diferença explicada.
