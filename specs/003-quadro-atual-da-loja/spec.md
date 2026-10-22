# Feature Specification: Impacto a partir do quadro atual da loja

**Created**: 2026-10-22 | **Status**: SUBSTITUÍDA pela [spec 004 (Painel de Escalas 5x2)](../004-painel-de-escalas/spec.md); o código desta versão foi retirado | **Substitui parcialmente**: spec 001 (modo detalhado: cadastro da loja e cálculo; remove o modo rápido público e o PDF com captação de contato)

## Contexto
O dono da loja já tem os colaboradores. O que ele quer saber é **quanto custa passar para a escala 5x2 mantendo a loja funcionando como hoje**. Hoje o formulário exige "mínimo por turno" (quantas pessoas precisam estar juntas na loja), um dado que o dono não costuma ter à mão, e quando o quadro tem folga o resultado dá R$ 0 sem explicar.

## O que muda para a pessoa
1. No cadastro da loja o dono informa o **tamanho da loja** e, para cada função, o **quadro atual**: quantas pessoas tem, jornada atual e salário médio. Só isso já gera a simulação.
2. A simulação assume que **o quadro atual é o que a loja precisa hoje**. Passando de 44h para 40h, cada pessoa entrega 4 horas a menos por semana; manter a mesma cobertura exige 10% a mais de gente (44 ÷ 40).
3. O campo "mínimo por turno" passa a ser **opcional e avançado** ("Quantas pessoas precisam estar juntas na loja"). Quando o dono o informa, o sistema refina o resultado: mostra se o quadro tem folga ou está curto, como já faz hoje.
4. O resultado mostra o impacto de duas formas: **custo proporcional** (pessoas equivalentes × custo por pessoa, como o dono pensa) e **contratações inteiras** necessárias (arredondando para cima por loja e função).
5. Quando o resultado é zero, a tela explica o motivo ("o quadro cadastrado tem folga de X horas e já cobre a abertura").

6. **Só com login.** Toda a calculadora passa a exigir login e **não existe mais página inicial pública nem "modo rápido"**. Quem abre o endereço sem estar logado cai na tela de entrada; quem está logado vai para "Minhas lojas". Criar conta continua aberto a qualquer pessoa com e-mail confirmado.
7. **Contato e relatório mais simples.** Como a pessoa já tem conta, o PDF e a planilha baixam direto e o "falar com um consultor" já vem com nome, e-mail e empresa preenchidos (pede só cargo, telefone e o aceite de contato).

## Requisitos
- **FR-001**: O cadastro da loja exige o tamanho (pequena, média ou grande, escolhido pelo dono) e, por função: quantidade atual de pessoas, jornada atual (1 a 44h) e salário médio mensal. Ausência (férias, faltas) continua opcional, com padrão da Farmarcas.
- **FR-002**: O farmacêutico continua obrigatório em toda loja (ao menos 1 pessoa cadastrada), e continua sem substituição por outra função.
- **FR-003**: O "mínimo por turno" é opcional. Sem ele, a necessidade da função é o quadro atual (cobertura constante).
- **FR-004**: Sem "mínimo por turno", pessoas equivalentes a repor = pessoas atuais × (jornada atual − 40) ÷ 40, por função (zero se a jornada já é 40h ou menos). Custo = equivalentes × salário × meses de remuneração × encargos.
- **FR-005**: Com "mínimo por turno", vale o cálculo atual de horas a cobrir × horas entregues (déficit novo), e o resultado indica a folga ou a falta de horas.
- **FR-006**: O resultado exibe, por loja, função e grupo: pessoas equivalentes, custo proporcional, contratações inteiras e seu custo. O total do grupo soma por loja.
- **FR-007**: Quando o impacto é zero, a tela explica o motivo em linguagem simples (folga do quadro ou jornada já em 40h).
- **FR-008**: O tamanho da loja é salvo e aparece nas listas, nos relatórios (PDF e CSV) e no ranking. Ele não altera o cálculo.
- **FR-009**: As ações de mitigação, as simulações salvas, a comparação e os relatórios continuam funcionando com o novo cálculo. Simulações já salvas permanecem como foram (foto imutável) e continuam abrindo.
- **FR-010**: Lojas já cadastradas continuam válidas: o tamanho é pedido na próxima edição e, enquanto não for informado, aparece como "não informado".

- **FR-011**: Todas as telas da calculadora (lojas, simulação, simulações salvas, conta) exigem login. Entrar, criar conta, confirmar e-mail, esqueci a senha e a política de privacidade continuam abertos.
- **FR-012**: A rota inicial `/` redireciona: sem login para a entrada; com login para "Minhas lojas". O modo rápido (formulário público, PDF com captação) é removido, com seu código e testes.
- **FR-013**: As premissas padrão e o envio de pedido de contato exigem login. O pedido de contato usa nome, e-mail e empresa da conta; o formulário pede cargo, telefone, setor (opcional) e o aceite de ser contatado. Os campos de proteção para pessoas não logadas (campo isca) deixam de existir; a chave de envio única (contra duplo clique) e o limite por IP continuam.
- **FR-014**: PDF e CSV baixam direto, sem pedir dados de contato.
- **FR-015**: A consulta da equipe da Farmarcas aos contatos (chave `x-admin-key`, CSV, anonimização) continua igual.
- **FR-016**: Quem entra na tela de outra rota protegida sem sessão vai para a entrada e, depois de entrar, para "Minhas lojas".

## Edge cases
- Função com 0 pessoas: não gera impacto; farmacêutico com 0 não é aceito.
- Jornada atual menor que 40h: sem impacto para a função.
- Quadro muito pequeno (ex.: 2 pessoas): equivalentes de 0,2; a tela mostra o custo proporcional e a contratação inteira (1 pessoa) lado a lado, para o dono ver as duas leituras.

## Critérios de sucesso
- **SC-001**: O dono cadastra uma loja e vê o impacto em menos de 3 minutos, sem precisar saber o "mínimo por turno".
- **SC-002**: Em 5 casos conferidos à mão por finanças, o custo proporcional e as contratações inteiras batem em 100%.
- **SC-003**: Resultado zero sempre vem com explicação.

## Decisões do agente (revisáveis)
- **Tamanho** como classificação (pequena/média/grande), sem preencher números sozinho. Motivo: o dono manda no quadro; o porte serve para identificar e comparar lojas.
- **Dois números** (proporcional e inteiro) em vez de só um. Motivo: o custo proporcional responde "quanto pesa no meu caixa"; o inteiro mostra o que de fato se contrata.
- **Cobertura constante** como padrão: assume que o quadro atual é o necessário. Se a loja já está folgada ou curta, o dono informa o "mínimo por turno" para refinar.
