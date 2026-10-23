# Engenharia reversa — calculadora da Peers

Fonte: código da página https://peers.com.br/calculadora-de-impacto-fim-da-escala-6x1/ (lido em 2026-10-22). Serve de referência de ideias; não copiar texto, visual nem código deles.

## Como é construída

- Página WordPress com **um único script no navegador**. Todo o cálculo roda na máquina da pessoa, sem servidor.
- O único contato com servidor é o envio do formulário (`POST /wp-json/peers/v1/lead`): nome, cargo, empresa, telefone, e-mail, setor, as respostas da simulação em JSON e os parâmetros de campanha (UTM). Tem campo "isca" anti-robô.
- O PDF é montado no navegador (biblioteca jsPDF). **O PDF só é baixado depois que o lead é enviado**: o relatório é a moeda de troca pelo contato.
- Os números vêm de uma planilha interna (o comentário do código cita `Calculadora_Impacto_6x1_Peers_V2.xlsx`).

## Fórmulas (completas)

Entradas: segmento, faturamento, colaboradores, % em 6x1, salário médio, dias de funcionamento (7/6/5), regime, maturidade, alavancas marcadas.

```
afetados        = round(colaboradores × %6x1)
FTEs a repor    = afetados × 0,10                    (44h→40h: 44/40 − 1)
custo/pessoa    = salário × 13,33 × encargos         (1,55 Real/Presumido; 1,25 Simples)
multiplicador de dias = 7 dias: 1,00–1,00 | 6 dias: 0,90–0,92 | 5 dias: 0,70–0,78
cobertura       = min(1, cobertura_do_segmento × multiplicador de dias)   (mín e máx)

impacto bruto   = FTEs × custo/pessoa × cobertura    → uma FAIXA (mín a máx)
impacto líquido = bruto × 0,66 se Lucro Real (IRPJ+CSLL 34%); senão = bruto
% faturamento   = bruto / faturamento
EBIT estimado   = faturamento × margem do segmento
% do EBIT       = bruto / EBIT
pessoas         = round(FTEs × cobertura)

mitigação       = 30% + 20% × (alavancas marcadas / 6)       (de 30% a 50%)
residual        = bruto × (1 − mitigação)
```

Tabela por segmento (farmácia): margem 5%, cobertura 60% a 95%, % afetados sugerido 80%. Outros segmentos variam de 4% a 8,5% de margem.

Limite de Lucro Presumido: aviso se faturamento > R$ 78 milhões.

## O que o modelo faz de esperto

- Mostra **faixa** (mín–máx), não um número só. Passa honestidade e evita discussão sobre precisão.
- Resultado atualiza ao vivo a cada campo.
- Alavancas viram um "botão de esperança": cada ação marcada sobe a redução de 30% para até 50%.
- Texto-resumo para a diretoria é gerado automaticamente com os números.

## Fragilidades que a Farmarcas pode superar

1. **"Cobertura" é um fator de ajuste sem explicação.** Ela corta o impacto em 5% a 40% e vem de benchmark, não da operação. Não dá para o usuário auditar nem corrigir.
2. **Maturidade não entra na conta.** Só muda um texto de dica. O campo parece importante mas não afeta nenhum número.
3. **Duas linhas repetem o mesmo valor:** "custo das contratações" é exatamente o impacto bruto.
4. **Mitigação é linear e genérica.** Cada alavanca vale o mesmo (3,3 pontos) e nada depende da operação.
5. **Nada é editável.** Encargos, margem, cobertura e alíquota são fixos e invisíveis.
6. **Uma empresa só, no agregado.** Não há loja, turno, função nem comparação entre unidades.
7. **Sem salvar.** Fechou a página, perdeu a simulação.
8. **Efeito fiscal ingênuo:** supõe sempre lucro suficiente, e Presumido/Simples não têm nenhum tratamento.

## O que isso muda para a Farmarcas (autonomia do gestor)

Em vez de um benchmark, o gestor mede a própria operação. Proposta de dois modos:

| | Rápido (como a Peers) | Detalhado (diferencial) |
| --- | --- | --- |
| Quem usa | Dono do grupo, 2 minutos | Gestor de loja/rede, com seus dados |
| Base do cálculo | Benchmarks de farmácia, editáveis | Horas reais por loja, função e turno |
| Cobertura | Faixa de referência | Calculada: horas de funcionamento × equipe mínima por turno |
| Premissas | Visíveis e editáveis | Visíveis e editáveis por loja |
| Resultado | Faixa para o grupo | Por loja, ranking e total do grupo |

Cálculo detalhado por loja (no lugar da "cobertura" opaca):

```
horas a cobrir / semana  = horas de abertura × dias × equipe mínima por turno
horas disponíveis hoje   = pessoas × 44h × (1 − ausências/férias)
horas disponíveis a 40h  = pessoas × 40h × (1 − ausências/férias)
déficit                  = horas a cobrir − horas disponíveis a 40h  (se positivo)
pessoas a contratar      = déficit / (40h × (1 − ausências))
custo                    = pessoas × salário da função × meses × encargos
```

Funções típicas de farmácia: farmacêutico (presença obrigatória enquanto a loja está aberta), balconista, caixa, estoquista. O farmacêutico é o gargalo: a loja não pode abrir sem ele, então ele não se resolve com "multifuncionalidade".

Autonomia concreta para o gestor:

- Editar todas as premissas (encargos, ausência média, horas por função) e ver o efeito na hora.
- Cadastrar cada loja com horário de abertura e equipe mínima por turno.
- Simular alavancas com **efeito próprio** (ex.: banco de horas reduz a equipe mínima fora do pico em X%), em vez de percentuais genéricos.
- Salvar cenários e compará-los (ex.: "manter horário" × "fechar mais cedo domingo").
- Exportar o PDF e planilha por loja.

## Pontos em aberto para decidir antes do plano

1. Salvar simulações exige **login e guardar dados**. Hoje a spec é pública, sem login.
2. O modo detalhado precisa de **dados reais** (jornada por função, escala atual), que o gestor tem e o dono do grupo, não.
3. As premissas (encargos, ausência, efeito de cada alavanca) precisam de **validação da área financeira e do jurídico** da Farmarcas.
