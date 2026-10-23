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

## 4. Conferência do nosso motor com o painel de referência (atualizada em 23/10/2026)
Depois de ler a configuração real da loja de exemplo da referência (gerência "integral" com folga no domingo; perfumista, serviços gerais e entregador só de segunda a sábado) e as escalas que ela gera, o motor foi ajustado: turno de apoio do meio do dia opcional na 5x2, almoços cobertos pela sobreposição de turnos, gerência com só abertura e fechamento na 5x2, reserva de gente para o domingo, contratados pelo menor salário da função.

**Loja Centro sem plantão (Simples)**: **igual à referência** em tudo — pessoas por função (6x1 e 5x2 · 42h), folha por função, folha de hoje (R$ 54.710 × R$ 54.705), folha da nova escala (R$ 103.360 × R$ 103.360) e 13 contratações.

**Loja Centro completa (plantão mensal, Simples)**: pessoas na 5x2 · 42h iguais em todas as funções (5, 3, 8, 4, 3, 3, 3) e 15 contratações; na 6x1 só o balconista fica 1 abaixo (8 × 9). Folha de hoje R$ 56.386 × R$ 56.241 (+0,3%) e da nova escala R$ 115.753 × R$ 115.628 (+0,1%). Em Presumido/Real, a folha fica a menos de 1% do PDF (R$ 68.701 e R$ 141.455).
O que fechou o último caso: em feriado com folga compensatória o gerador só escala os turnos obrigatórios (cada turno de apoio geraria mais uma folga), tentando antes o desenho completo.

## 5. Onde o painel de referência pode estar errado (conferência da escala que ele gera)
Li as escalas de 4 semanas que a referência gera para as 7 funções nos 3 cenários e conferi as regras. **Cumpre**: 11 h entre jornadas, no máximo 5 dias por semana na 5x2 (6 na 6x1), nunca 3 domingos seguidos na regra "1 a cada 3" e cobertura mínima do salão em todo o horário. **Não cumpre / discutível**:
- **Dias seguidos de trabalho**: o repouso é contado por semana de calendário, e por isso aparecem sequências de até 8 dias (balconista 5x2 · 42h), 10 dias (caixa 5x2 · 40h) e 12 dias (balconista 6x1). A jurisprudência (TST) entende que o descanso semanal vem depois de, no máximo, 6 dias seguidos. O nosso motor limita em 6 dias; mesmo assim chegamos ao mesmo número de pessoas.
- **Custo de "hoje" do plantão**: o painel só paga as noites que o quadro atual consegue cobrir (com 2 farmacêuticos paga 50%, com 3 paga 75%, com 4 ou mais paga 100%). Isso reproduzimos para os números baterem, mas **subestima o custo de hoje** quando falta gente e deixa noites de plantão sem farmacêutico, o que a Lei 13.021/2014 não permite.
- **12x36**: a hora de intervalo é paga como hora extra a 150% sobre a hora de 42 h semanais (÷ 210); as regras da CLT para o intervalo na 12x36 dependem da convenção coletiva, e o painel não pergunta isso.
Essas três decisões precisam passar pelo jurídico.

**Custo do plantão (decifrado e igual à referência na nova escala)**, por noite de 22h às 7h com intervalo indenizado, por pessoa: adicional noturno = 20% × 8 h noturnas reduzidas; horas extras = (10 h pagas com a hora reduzida − jornada do dia) × 150%; intervalo = 1 h a 150%; DSR = (noturno + extras) ÷ 6. Noites por mês = noites da escala de 4 semanas × 4,34 ÷ 4 (semanal 4,34; mensal 7,6). Resultados conferidos: plantão semanal (farmacêutico e balconista) nova 237/355/99/222 × 236/355/99/222 nossos; só farmacêutico 172/258/72/161 idênticos; mensal nova 414/621/173/388 × 414/621/172/388. Em "hoje" (6x1) o plantão gira entre até 4 pessoas (uma noite a cada 4 semanas cada): com 2 farmacêuticos paga 50%, com 3 paga 75%, com 4 ou mais paga 100% (exato no semanal; no mensal o nosso fica 4% acima).

**Plantonista intermitente**: não muda a equipe; custa só na nova escala (hoje não tem). Por noite paga (10 h reduzidas + 20% × 8 h noturnas = 11,6 h) × hora, com 13º, férias e FGTS, sem multa do FGTS, vale-transporte nem benefícios. Mensal: R$ 107.229 × R$ 107.234 (referência).

**12x36 no caixa**: a equipe não muda (4×4). A hora de intervalo vira "horas extras" a 150% com a hora = salário ÷ 210 (42 h por semana), 3,5 dias por semana no vale-transporte. Caixa R$ 6.243/12.604 × 6.289/12.578; total R$ 55.092/104.398 × 55.134/104.371.

**Feriados fechados**: 5x2 e totais idênticos (R$ 103.360); 6x1 fecha em 4, 3, 4, 2, 2, 2 como a referência, e a balconista dá 7 × 8.

**Vendas e CMV**: as fórmulas batem com a referência (vendas de R$ 1,5 mi, CMV 70%, meta 12%): venda mínima para pagar mercadoria e folha R$ 344.533, venda pela meta R$ 861.333, folha sobre a venda 6,9% e sobra de R$ 23,11 a cada R$ 100.
