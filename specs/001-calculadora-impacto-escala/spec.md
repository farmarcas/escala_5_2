# Feature Specification: Calculadora de Impacto do Fim da Escala 6x1 (Farmarcas)

**Feature Branch**: `001-calculadora-impacto-escala`

**Created**: 2026-10-22

**Updated**: 2026-10-22 (inclui modo detalhado por loja, login e simulações salvas)

**Status**: Draft

**Input**: User description: "Construir para a Farmarcas uma calculadora de impacto do fim da escala 6x1, inspirada na da Peers. Dois modos: rápido e público para o dono do grupo; detalhado por loja, com login e simulações salvas, para dar autonomia ao gestor. Inclui captura de contato e relatório em PDF." Análise da referência em [referencia-peers.md](referencia-peers.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Modo rápido: descobrir o impacto no grupo (Priority: P1)

O dono ou gestor de um grupo de farmácias, sem cadastro, informa o perfil geral do grupo e vê quanto custaria passar de 44h para 40h semanais (escala 5x2), sem reduzir salário. O resultado é uma faixa (mínimo a máximo), e todas as premissas aparecem na tela e podem ser editadas.

**Why this priority**: É o coração do produto e a porta de entrada. Sozinha, já entrega um diagnóstico útil e atrai contatos.

**Independent Test**: Preencher um grupo de exemplo e conferir que os resultados batem com o cálculo feito à mão. Editar uma premissa e ver o resultado mudar.

**Acceptance Scenarios**:

1. **Given** um perfil com valores válidos, **When** a pessoa altera qualquer campo, **Then** o resultado se atualiza na hora e mostra o impacto bruto anual (faixa), o impacto líquido após efeito fiscal, o impacto como % do faturamento e do resultado operacional estimado, e as pessoas equivalentes a contratar.
2. **Given** campos vazios ou inválidos (negativo, zero, % acima de 100), **When** a pessoa tenta calcular, **Then** vê mensagem clara ao lado do campo e nenhum resultado enganoso.
3. **Given** Lucro Presumido e faturamento anual acima de R$ 78 milhões, **When** calcula, **Then** vê aviso para conferir o enquadramento fiscal real.
4. **Given** o painel de premissas aberto, **When** a pessoa edita um valor (ex.: encargos), **Then** o resultado recalcula e a tela indica que as premissas foram alteradas e permite voltar ao padrão.

---

### User Story 2 - Entrar e cadastrar minhas lojas (Priority: P2)

O gestor cria uma conta, entra e cadastra cada loja do grupo: horário de abertura, dias de funcionamento, perfil (rua, shopping, 24h) e equipe atual por função (farmacêutico, balconista, caixa, estoquista), com jornada e salário.

**Why this priority**: É a base do modo detalhado, que é o diferencial de autonomia.

**Independent Test**: Criar uma conta, cadastrar duas lojas, sair, entrar de novo e encontrar as lojas.

**Acceptance Scenarios**:

1. **Given** uma pessoa sem conta, **When** se cadastra com e-mail e senha e confirma o e-mail, **Then** entra no sistema e vê a lista de lojas vazia com a orientação para cadastrar a primeira.
2. **Given** um gestor logado, **When** cadastra uma loja com horários e equipe por função, **Then** a loja aparece na lista e pode ser editada ou removida.
3. **Given** dois gestores de grupos diferentes, **When** cada um entra, **Then** só vê as próprias lojas e simulações.
4. **Given** dados incompletos ou incoerentes (ex.: loja aberta 24h com equipe mínima zero), **When** tenta salvar, **Then** vê o que corrigir.

---

### User Story 3 - Modo detalhado: impacto por loja e ranking (Priority: P2)

Com as lojas cadastradas, o gestor roda a simulação detalhada: para cada loja, compara as horas que a loja precisa cobrir (horário de abertura × equipe mínima por turno) com as horas que a equipe entrega a 40h, considerando ausências e férias. O resultado mostra, por loja e por função, quantas pessoas faltam e quanto isso custa, além do total do grupo e do ranking das lojas mais afetadas.

**Why this priority**: Troca o "fator de cobertura" opaco da referência por conta real da operação. É o que dá autonomia ao gestor.

**Independent Test**: Cadastrar uma loja com números simples (ex.: 12h por dia, 7 dias, 2 pessoas por turno) e conferir à mão o déficit de horas e o custo.

**Acceptance Scenarios**:

1. **Given** lojas cadastradas, **When** o gestor roda a simulação, **Then** vê por loja: horas a cobrir, horas disponíveis a 40h, déficit, pessoas a contratar por função e custo anual.
2. **Given** a função de farmacêutico, **When** a loja tem déficit dela, **Then** a tela destaca que essa função é obrigatória durante a abertura e não pode ser compensada por outra função.
3. **Given** o resultado por loja, **When** o gestor consulta o ranking, **Then** vê as lojas ordenadas pelo maior impacto e o total do grupo.
4. **Given** uma loja sem déficit, **When** vê o resultado, **Then** a tela diz que não há contratação necessária, em vez de mostrar zeros soltos.

---

### User Story 4 - Simular ações e comparar cenários salvos (Priority: P2)

O gestor marca ações de mitigação com efeito próprio sobre a loja (ex.: banco de horas reduz a equipe mínima nos horários de baixo movimento em X%; escalas por demanda; multifuncionalidade nas funções permitidas; automação; negociação coletiva; ajuste de horário de funcionamento), salva a simulação com um nome e compara cenários lado a lado.

**Why this priority**: Responde "o que eu posso fazer?" e permite decidir com números.

**Independent Test**: Salvar um cenário base, criar outro com ações marcadas, comparar e conferir que a diferença bate com o efeito configurado de cada ação.

**Acceptance Scenarios**:

1. **Given** um resultado por loja, **When** o gestor marca uma ação e informa seu efeito, **Then** o impacto residual da loja muda e a economia estimada aparece.
2. **Given** uma simulação, **When** o gestor a salva com nome, **Then** ela aparece na lista de simulações salvas, com data, e pode ser reaberta, duplicada ou apagada.
3. **Given** duas simulações salvas, **When** o gestor as compara, **Then** vê lado a lado impacto, contratações e economia de cada uma.
4. **Given** uma premissa editada na conta, **When** a simulação é reaberta mais tarde, **Then** ela mostra as premissas com que foi calculada, sem mudar o resultado antigo sem aviso.

---

### User Story 5 - Relatório em PDF (e planilha no modo detalhado) (Priority: P3)

A pessoa baixa um relatório em PDF com perfil, resultados, ações, síntese para a diretoria, premissas e avisos. No modo detalhado, também pode baixar uma planilha com os números por loja.

**Why this priority**: O número precisa circular entre sócios e financeiro.

**Independent Test**: Calcular, baixar o PDF e conferir que os números e premissas são os mesmos da tela.

**Acceptance Scenarios**:

1. **Given** um resultado calculado, **When** a pessoa pede o PDF, **Then** recebe um arquivo com os mesmos números da tela, as premissas e o aviso de estimativa.
2. **Given** o modo rápido sem cadastro, **When** pede o PDF, **Then** preenche os dados de contato, aceita a política de privacidade e só então baixa o arquivo.
3. **Given** um gestor logado no modo detalhado, **When** pede PDF ou planilha, **Then** baixa direto, sem repetir dados.

---

### User Story 6 - Falar com um consultor da Farmarcas (Priority: P3)

A pessoa deixa seus dados para que um consultor da Farmarcas entre em contato.

**Why this priority**: Gera oportunidade comercial, mas a calculadora tem valor sem isso.

**Independent Test**: Enviar o formulário e conferir a confirmação na tela e o registro para a equipe.

**Acceptance Scenarios**:

1. **Given** nome, cargo, empresa, telefone e e-mail corporativo preenchidos e o aceite da política, **When** envia, **Then** vê "Solicitação registrada!" e a Farmarcas recebe o contato com o perfil e o resultado calculado.
2. **Given** campo obrigatório vazio, e-mail inválido ou sem aceite, **When** tenta enviar, **Then** o envio é bloqueado com mensagem clara.

---

### Edge Cases

- Salário ou colaboradores zerados: pedir correção, sem divisão por zero nem resultado absurdo.
- 0% em 6x1: o impacto é zero e a tela diz isso.
- Empresa sem lucro: o efeito fiscal não se aplica e a tela avisa que o líquido é igual ao bruto.
- Formatos de número do Brasil (1.234,56) aceitos em todos os campos.
- Mudar um campo ou premissa depois de marcar ações: resultado e residual se atualizam juntos.
- Duplo clique em enviar (contato, cadastro, salvar simulação): registra uma única vez.
- Esqueci a senha: recuperação por e-mail.
- Muitas lojas (ex.: 200): lista, simulação e ranking continuam utilizáveis.
- Sessão expirada no meio de uma edição: a pessoa é avisada e não perde o que digitou (o formulário continua na tela; ela entra de novo em outra aba e salva outra vez).
- Celular: modo rápido inteiro e consulta de resultados continuam legíveis e utilizáveis.
- Loja que não funciona todos os dias ou com horários diferentes por dia da semana.

## Requirements *(mandatory)*

### Functional Requirements

**Modo rápido (público)**

- **FR-001**: O sistema DEVE oferecer uma página pública, em português do Brasil, com a calculadora rápida, sem cadastro.
- **FR-002**: O modo rápido DEVE coletar: número de lojas, total de colaboradores, % em escala 6x1 (padrão 85%), salário médio dos afetados, faturamento anual, perfil de loja (rua, shopping ou 24h), dias de funcionamento (7, 6 ou 5), regime tributário (Lucro Real, Presumido ou Simples) e maturidade de adequação.
- **FR-003**: O sistema DEVE validar os campos e explicar cada erro ao lado do campo.
- **FR-004**: O sistema DEVE calcular e mostrar, como faixa de mínimo a máximo: impacto bruto anual; impacto líquido após efeito fiscal; impacto como % do faturamento e do resultado operacional estimado; pessoas equivalentes a contratar e custo anual.
- **FR-005**: O cálculo DEVE modelar a passagem de 44h para 40h semanais sem redução salarial, usando só o estado final (40h).
- **FR-006**: O sistema DEVE aplicar efeito fiscal só no Lucro Real, com empresa lucrativa, e mostrar quando não se aplica.
- **FR-007**: O sistema DEVE avisar sobre o enquadramento quando Lucro Presumido e faturamento acima de R$ 78 milhões.
- **FR-008**: Todas as premissas usadas (encargos, meses de remuneração por ano, alíquota, margens e coberturas de referência por perfil de loja) DEVEM aparecer na tela e poder ser editadas pela pessoa, com opção de voltar ao padrão.
- **FR-009**: Cada campo do formulário DEVE afetar o resultado ou ser claramente marcado como informativo; nenhum campo pode parecer importante sem efeito.
- **FR-010**: O sistema DEVE gerar uma síntese em texto para a diretoria a partir do resultado.

**Conta, lojas e modo detalhado**

- **FR-011**: O sistema DEVE permitir criar conta com e-mail e senha, confirmar o e-mail, entrar, sair e recuperar a senha.
- **FR-012**: O gestor DEVE poder cadastrar, editar e remover lojas, cada uma com nome, cidade, perfil, horário de abertura por dia da semana, equipe mínima por turno e função, e a equipe atual por função (quantidade, jornada, salário).
- **FR-013**: As funções DEVEM incluir ao menos farmacêutico, balconista, caixa e estoquista; o farmacêutico DEVE ser tratado como presença obrigatória durante a abertura, sem substituição por outra função.
- **FR-014**: O modo detalhado DEVE calcular, por loja e função: horas a cobrir por semana, horas disponíveis a 40h (descontadas ausências e férias), déficit de horas, pessoas a contratar e custo anual, com encargos e premissas editáveis.
- **FR-015**: O sistema DEVE mostrar o total do grupo e o ranking das lojas por impacto.
- **FR-016**: O gestor DEVE poder marcar ações de mitigação por loja com efeito configurável (ações: ajuste de quadro, escalas por demanda, banco de horas, multifuncionalidade, automação, negociação coletiva, ajuste de horário), e ver impacto residual e economia.
- **FR-017**: O gestor DEVE poder salvar simulações com nome, reabrir, duplicar, apagar e comparar de duas a quatro lado a lado.
- **FR-018**: Cada simulação salva DEVE guardar as premissas e os dados das lojas usados no cálculo, para que o resultado antigo seja reproduzível.
- **FR-019**: Cada pessoa DEVE ver apenas os dados do próprio grupo.

**Relatórios, contato e privacidade**

- **FR-020**: O sistema DEVE gerar relatório em PDF com perfil, resultados, ações, síntese, premissas e avisos; no modo detalhado, também uma planilha por loja.
- **FR-021**: No modo rápido sem cadastro, o PDF DEVE exigir os mesmos dados do formulário de contato (nome, cargo, empresa, telefone, e-mail corporativo) e o aceite da política de privacidade; o PDF só é gerado depois do registro. No modo detalhado, quem está logado baixa direto.
- **FR-022**: O sistema DEVE oferecer o formulário "Falar com um consultor" com nome, cargo, empresa, telefone e e-mail corporativo obrigatórios, setor opcional e aceite da política.
- **FR-023**: O sistema DEVE registrar cada contato com o perfil e o resultado do momento, consultável pela equipe da Farmarcas.
- **FR-024**: O sistema DEVE exibir na tela de resultado e no PDF o aviso de que é estimativa para diagnóstico, não substitui análise contábil, jurídica ou trabalhista, e que depende da promulgação e regulamentação da PEC.
- **FR-025**: O sistema DEVE tratar dados pessoais conforme a LGPD: coletar só o necessário, mostrar a política, permitir que a pessoa peça exclusão da conta e dos dados, e não usar o contato para outra finalidade sem aviso.
- **FR-026**: As premissas padrão DEVEM ficar num único lugar de fácil ajuste pela Farmarcas, com data de revisão, sem mexer na lógica.

### Key Entities

- **Conta**: pessoa que usa o modo detalhado (e-mail, nome, empresa/grupo, aceite da política).
- **Grupo**: conjunto de lojas de uma empresa; pertence a uma ou mais contas.
- **Loja**: unidade do grupo (nome, cidade, perfil, horários por dia, equipe mínima por turno e função).
- **Equipe por função**: quantidade, jornada atual, salário e taxa de ausência de cada função na loja.
- **Premissas**: parâmetros do cálculo (padrão da Farmarcas e ajustes da pessoa), com data de revisão.
- **Simulação**: foto salva do cálculo (nome, data, lojas, premissas, ações e resultados).
- **Ação de mitigação**: medida marcada por loja, com efeito configurado.
- **Solicitação de contato**: dados do formulário mais perfil e resultado no momento do envio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: No modo rápido, um gestor vê o resultado em menos de 3 minutos, sem ajuda.
- **SC-002**: Em 10 cenários conferidos à mão por finanças, os números do modo rápido e do detalhado batem em 100% dos casos (diferença só de arredondamento).
- **SC-003**: Os números do PDF e da planilha são idênticos aos da tela em 100% dos casos.
- **SC-004**: Ao mudar um campo ou premissa, o resultado se atualiza em até 1 segundo, inclusive com 200 lojas.
- **SC-005**: Um gestor cadastra uma loja completa em menos de 5 minutos.
- **SC-006**: 90% dos gestores que testam conseguem salvar e reabrir uma simulação na primeira tentativa.
- **SC-007**: 90% das pessoas usam o modo rápido completo no celular, sem rolar para o lado nem ampliar a tela.
- **SC-008**: 100% dos contatos válidos ficam registrados e consultáveis; nenhum gestor consegue ver dados de outro grupo.

## Assumptions

- **Público e modos**: modo rápido é público, para o dono do grupo, e capta contato. Modo detalhado exige conta e é para gestor de loja ou rede.
- **Quem pode criar conta**: qualquer pessoa com e-mail corporativo, com confirmação de e-mail. Aprovação manual pela Farmarcas fica fora desta versão. Se a Farmarcas quiser restringir a quem já é associado, isso muda o cadastro.
- **Grupo e permissões**: cada conta tem um grupo próprio; compartilhar um grupo entre várias pessoas, com perfis de acesso, fica para uma versão futura.
- **Norma modelada**: PEC 221/19 (44h → 40h, 5x2, sem perda salarial), só o estado final de 40h. Se a regra mudar, as premissas são ajustadas.
- **Fórmulas do modo rápido**: pessoas afetadas = colaboradores × % em 6x1. Pessoas a repor = afetados × 10%. Custo por pessoa = salário × 13,33 meses × encargos. Impacto = pessoas × custo × cobertura de referência, em faixa. Efeito fiscal de 34% só no Lucro Real. Resultado operacional estimado = faturamento × margem de referência do perfil de loja. Valores de encargos, margem e cobertura são provisórios e editáveis.
- **Fórmulas do modo detalhado**: déficit = horas a cobrir − horas disponíveis a 40h com ausências; pessoas a contratar = déficit ÷ (40h × (1 − ausência)); custo = pessoas × salário da função × 13,33 × encargos. Valores padrão de ausência e encargos são provisórios.
- **Efeito das ações de mitigação**: no modo rápido, redução de 30% a 50% do impacto conforme as ações marcadas. No detalhado, cada ação tem efeito configurável pelo gestor, com sugestão padrão da Farmarcas. Os valores sugeridos precisam ser validados.
- **Referência**: a Peers não divulga as fórmulas em texto, mas o cálculo é executado na própria página. Usamos a estrutura geral como inspiração, com parâmetros, textos e visual próprios da Farmarcas. Análise em [referencia-peers.md](referencia-peers.md).
- **Contato**: a equipe da Farmarcas acompanha as solicitações por uma consulta simples; envio automático para CRM ou e-mail fica fora desta versão.
- **Fora desta versão**: login com conta de terceiros, integração com sistema de RH ou folha, importação automática de escalas, aconselhamento jurídico ou contábil, transição intermediária 44h→42h→40h.
- **Decisões técnicas (agente)**: stack, estrutura de dados, forma de autenticação e armazenamento de senha seguem a constituição e o padrão do projeto, e serão detalhados no plano. Atenção: o projeto ainda não tem procedimento para autenticação (lacuna listada no AGENTS.md); isso será tratado com cuidado no plano e informado à pessoa.
