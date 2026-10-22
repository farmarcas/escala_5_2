# Feature Specification: Painel de Escalas 5x2 (Farmarcas)

**Created**: 2026-10-22 | **Status**: Rascunho (aguardando aprovação) | **Referência funcional**: "Painel de Escalas" da Rede Inova (4 PDFs com as abas Dados da loja, Escala, Diagnóstico e custos e Regras aplicadas)

## Propósito
Ferramenta para o dono ou gestor de farmácia montar a escala de trabalho da loja para o fim da 6x1 (EC 141/2026, segundo a referência), ver **quantas pessoas faltam por função** e **quanto a folha aumenta**, e baixar um relatório. É um **produto novo, com a identidade da Farmarcas** (visual do Alquimia, textos próprios). Reproduz as **funções** da referência; não usa logotipo, textos nem código da Rede Inova.

## Premissas desta spec
- Acesso **só com login** (decisão anterior da pessoa). Os dados da loja ficam **guardados na conta**, e não só no navegador, para o dono voltar, ter várias lojas e a Farmarcas poder atendê-lo.
- As regras de lei vêm da descrição da referência e **precisam ser validadas pelo jurídico e pela contabilidade da Farmarcas** antes do lançamento; cada regra do painel mostra sua base legal.
- A calculadora atual (impacto de 44h para 40h) é **absorvida** por este produto: o "Diagnóstico e custos" faz o mesmo e melhor. Código e telas atuais de contas, lojas, simulações salvas, relatórios e visual são reaproveitados (proposta A; confirmar).
- Referência legal descrita no painel (a confirmar com o jurídico): fim da 6x1 e escala 5x2 a partir de 15/12/2026; jornada máxima de 42h até o 14º mês após a promulgação (16/10/2026), depois 40h; dois repousos semanais, um preferencialmente no domingo.

## Histórias de usuário

### US1 - Cadastrar a loja e ver o diagnóstico (P1) 🎯
O dono informa os dados da loja em passos e vê, por função, quantas pessoas **tem hoje**, quantas **precisa na 6x1 de hoje**, quantas **precisa na 5x2 (42h)** e **quantas contratar**; e a **folha mensal hoje x nova**, com a diferença por mês, em % e por ano.
- **Teste independente**: o exemplo de referência da seção "Caso de conferência" produz os mesmos números.
- **Aceite**: (1) as 7 funções com equipe de exemplo geram o quadro "hoje x necessário 6x1 x necessário 5x2"; (2) "Contratar" = necessário 5x2 − hoje (nunca negativo; excedente aparece como reforço); (3) a folha nova inclui quem já existe e as novas contratações; (4) alterar qualquer dado recalcula o resultado.

### US2 - Escala de 4 semanas por pessoa (P1)
O dono vê a escala completa por cenário (**6x1 · 44h**, **5x2 · 42h**, **5x2 · 40h**) e por função: para cada colaborador e dia, entrada e saída, almoço e lanche, folgas, rodízio de domingos e horas na semana.
- **Aceite**: (1) cobertura mínima no salão respeitada em todo o horário ("Coberto"); (2) farmacêutico presente em todo o funcionamento, inclusive no plantão; (3) pelo menos 11h de descanso entre jornadas; (4) folga dominical conforme a regra escolhida (1 em 3 semanas, 1 em 2 ou todo domingo); (5) colaboradores novos marcados como "Contratar"; (6) reforço e cobertura de intervalos identificados; (7) o filtro por função e por semana funciona.

### US3 - Custos detalhados (P1)
O dono vê o custo mensal **hoje x nova escala**, separado em **direto** (salários e adicionais) e **indireto** (provisões, encargos e benefícios), com os componentes linha a linha, e o **custo por colaborador** por cargo. Pode alternar o regime (Simples ou Lucro Presumido/Real) e incluir ou não as provisões.
- **Aceite**: componentes: salários de registro, periculosidade, feriados em dobro, adicional noturno, horas extras de plantão, reflexo no DSR, intervalo indenizado, 13º, férias + 1/3, FGTS, multa do FGTS, INSS patronal + RAT + terceiros (Lucro Presumido/Real) ou INSS dentro do DAS (Simples), vale-transporte (parte da empresa, descontando até 6% do salário), outros benefícios.

### US4 - Plantão noturno e feriados (P2)
O dono informa se a loja faz plantão (semanal ou mensal, com quantos farmacêuticos, balconistas e caixas) e como cobrir (equipe da escala com folga no dia seguinte, ou plantonista intermitente), e cadastra feriados estaduais e municipais. O painel usa isso na escala e no custo.
- **Aceite**: feriados nacionais já cadastrados; opção de escala rotativa ou fixa, folga compensatória ou pagamento em dobro, e se a folga que cai no feriado conta ou não; resumo "Feriados no período" com quantos trabalham, quantos folgam e folgas compensatórias geradas.

### US5 - Vendas, CMV e meta da folha (P3)
Opcional: o dono informa CMV e a meta de participação da folha nas vendas e vê quanto a loja precisa vender para pagar a mercadoria e a folha nova.

### US6 - Relatório, alertas e consultor (P2)
Baixar **relatório em Excel** (comparativo de pessoas e custos, plano de ação, modelo de cada função e as escalas de 4 semanas de cada cenário); ver **alertas e ajustes** (farmacêutico fora de parte do horário, plantão, faixas que podem ser encurtadas para economizar turnos, falta cadastrar a CCT); **falar com um consultor** da Farmarcas.

### US7 - Regras aplicadas (P2)
Página que lista a base legal usada (fim da 6x1 e 5x2, transição 42h e 40h, 12x36 só com CCT ou acordo, folga dominical no comércio, farmacêutico em todo o horário, 11h entre jornadas, intervalos, trabalho noturno, entregador de moto, plantonista intermitente, feriados, encargos por regime) com a data de vigência.

### Fora da primeira versão (a confirmar)
Assistente de dúvidas por IA ("Tirar dúvidas"), a aba de leads da referência (a equipe da Farmarcas usa a consulta de contatos que já existe) e a aba indicada como "+15".

## Dados da loja (os 7 passos)
1. **Identificação e tributação**: nome, cidade, UF, início da escala (semana de), regime tributário (Simples Nacional ou Lucro Presumido/Real).
2. **Horário de funcionamento**: padrão (abre e fecha) e dias; opção "24 horas, todos os dias"; ajuste por dia (domingo, sábado, horário estendido).
3. **Plantão noturno**: nenhum, semanal (1 noite por semana) ou mensal (1 semana por mês, no rodízio da cidade); semana do ciclo; início e fim; farmacêuticos, balconistas e caixas no plantão; como cobrir; indenizar o intervalo (hora paga com 50%).
4. **Equipe por função**: farmacêutico (dono pode ser farmacêutico e atuar na loja), gerente/subgerente (quantos de cada, salário de cada), balconista, caixa, perfumista, serviços gerais, entregador (de moto: periculosidade 30%), e funções opcionais (comprador, conferente de mercadoria, atendente digital, expedição de pedidos), que ficam desligadas por padrão e, desligadas, não entram na escala nem no custo. Por função: quantidade hoje, salário de registro, escala (jornada normal ou 12x36), mínimo no salão, cobertura (todo o funcionamento ou faixa de horário) e dias da semana.
5. **Regras, benefícios e encargos**: folga dominical, CCT aplicável (texto livre: sindicato e vigência), almoço (60, 90 ou 120 min; 30 só com CCT), lanche pago (sem, 10, 15 ou 20 min), incluir provisões (13º, férias + 1/3, multa do FGTS), indenizar o intervalo na 12x36, vale-transporte (passagens por dia e valor), outros benefícios (lista de nome e custo mensal por colaborador), encargos avançados.
6. **Vendas, CMV e meta da folha** (opcional).
7. **Feriados** e suas regras.

## Requisitos
- **FR-001**: Só usuários logados usam o painel; entrar, criar conta, confirmar e-mail e recuperar senha seguem abertos.
- **FR-002**: Cada conta pode ter várias lojas, com "Nova loja", "Duplicar loja" e "Excluir loja"; troca de loja no topo.
- **FR-003**: O cadastro segue os 7 passos acima, com valores iniciais de exemplo ("Loja de exemplo: substitua pelos seus dados") e validação em linguagem simples.
- **FR-004**: O motor de escala calcula, por função e cenário (6x1 · 44h, 5x2 · 42h, 5x2 · 40h), o **menor número de pessoas** que cobre todo o horário com o mínimo no salão, folgas, intervalos, folga dominical e plantões.
- **FR-005**: O motor gera a escala de **4 semanas** a partir da semana de início, com horário de entrada e saída, almoço e lanche por pessoa, rodízio de domingos, respeitando 11h de descanso entre jornadas e a presença do farmacêutico em todo o horário.
- **FR-006**: O motor calcula os componentes de custo da lista da US3, por regime tributário, com as alíquotas e regras que o painel mostra em "Regras aplicadas".
- **FR-007**: O diagnóstico mostra o quadro por função, a mensagem "para cumprir a 5x2 · 42h, esta loja precisa contratar N pessoas" detalhada por função, e a folha mensal hoje x nova (diferença por mês, em % e por ano), alternando 42h e 40h.
- **FR-008**: Alertas e ajustes (US6) são gerados a partir da escala e do custo.
- **FR-009**: Relatório em Excel com as abas descritas na US6, e nome de arquivo com a loja e a data.
- **FR-010**: "Falar com um consultor" registra o pedido (como já existe: dados da conta, cargo, telefone, aceite) e inclui o resumo da simulação.
- **FR-011**: A página "Regras aplicadas" cita a base legal de cada regra e a data da legislação usada; os avisos de planejamento (não substitui contador nem advogado) aparecem em todas as telas de resultado e no relatório.
- **FR-012**: Os dados pessoais são tratados conforme a LGPD, como já definido (consentimento, exclusão da conta e dos dados).
- **FR-013**: Visual e acessibilidade: identidade do Alquimia, contraste mínimo de 4,5:1, uso em celular sem rolagem lateral.
- **FR-015**: **Layout cuidado e moderno** (pedido da pessoa): estrutura de painel com cabeçalho, troca de loja e abas; cadastro em passos com índice lateral e progresso; cartões-resumo sempre à vista (quantas contratar, folha hoje, folha nova e diferença); escala em grade legível, com cores e legenda por tipo de turno e primeira coluna fixa; gráficos simples de barras (sem biblioteca) para comparar hoje x nova folha e custo direto x indireto; estados de carregando, vazio e erro bem desenhados; uso confortável em computador, tablet e celular. Cada fatia passa por revisão visual com imagens em tela larga e estreita.
- **FR-014**: A loja salva e a escala gerada são reproduzíveis: o mesmo conjunto de dados gera sempre a mesma escala.

## Caso de conferência (da referência, para os testes de aceite)
Loja "Drogaria Exemplo — Centro", Varginha/MG, início 14/12/2026, **Lucro Presumido/Real**, funciona de segunda a sábado 07:00–22:00 e domingo 08:00–14:00; plantão **mensal**, 2ª semana do ciclo, 22:00–07:00, 1 farmacêutico e 1 balconista; **folga dominical 1 em 3 semanas**; almoço 60 min, lanche pago 15 min; provisões ligadas; vale-transporte 2 × R$ 4,50; vale-alimentação R$ 350 por colaborador.
Equipe de hoje (quantidade, salário, mínimo no salão): farmacêutico 2, R$ 5.200, 1; gerente 1 (R$ 3.800) e subgerente 1 (R$ 2.900), 1; balconista 5, R$ 1.950, 2; caixa 2, R$ 1.850, 1; perfumista 1, R$ 1.950, 1 (faixa 09:00–19:00); serviços gerais 1, R$ 1.700, 1 (07:00–17:00); entregador 1, R$ 1.800, 1 (08:00–20:00, moto).
Resultado esperado da referência (não é exigência de igualdade exata em todos os centavos; diferenças precisam ser explicadas pelo jurídico/contabilidade):
- Necessário 6x1: farmacêutico 5, gerente/subgerente 4, balconista 9, caixa 4, perfumista 3, serviços gerais 3, entregador 3.
- Necessário 5x2 · 42h: 5, 3, 8, 4, 3, 3, 3 → **contratar 15 pessoas** (3, 1, 3, 2, 2, 2, 2).
- Folha mensal: **R$ 68.701** hoje, **R$ 141.455** na 5x2 · 42h (**+R$ 72.754**, +105,9%, **R$ 873.043 por ano**).

## Critérios de sucesso
- **SC-001**: No caso de conferência, o quadro necessário por função e o número de contratações batem 100% com a referência; a folha fica a menos de 2% de diferença, e cada diferença tem causa registrada.
- **SC-002**: Em toda escala gerada: cobertura mínima respeitada, farmacêutico em todo o horário e 11h de descanso, em 100% das semanas.
- **SC-003**: O dono cadastra uma loja e vê o diagnóstico em menos de 10 minutos.
- **SC-004**: Alterar um dado recalcula o diagnóstico em até 2 segundos para lojas de até 40 pessoas.
- **SC-005**: Os números do relatório em Excel são idênticos aos da tela.

## Fora de escopo (versão 1)
Assistente por IA, aba de leads própria, integração com ponto eletrônico, folha de pagamento e e-Social, regras de CCT específicas de cada sindicato (só texto livre e alerta), MEI e empresas com regras de transição por lei complementar.
