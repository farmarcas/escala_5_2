# Feature Specification: Análise com IA no diagnóstico do Radar Escala

**Feature Branch**: `feat/assistente-radar-escala` | **Created**: 2026-10-23 | **Status**: Rascunho revisado (aguardando aprovação)

## O que muda para a pessoa
Na tela de **Resultado** (diagnóstico) da loja, o associado ganha o botão **"Analisar com IA"**. Quando ele clica, a IA recebe os parâmetros da loja e o resultado, e devolve uma análise **em linguagem simples**: o que o resultado quer dizer, o que mais pesa no custo e na equipe, e **cenários que vale testar** (já calculados pelo motor, com antes e depois) e parâmetros que ele pode revisar. A pessoa também pode escrever uma pergunta ou pedido ("e se eu fechar mais cedo?", "como gastar menos?").

**A IA não faz nada sozinha.** Ela só responde quando a pessoa clica, não altera a loja, não salva, não envia mensagem. Quem decide e muda os dados é sempre a pessoa.

Decisões da pessoa (23/10/2026): sem limite mensal de custo por enquanto; só para o associado logado; o público é leigo, então a análise precisa ser fácil de entender; a IA apenas ajuda, nunca age.

## Histórias
- **US1 - Entender o resultado (P1)**: com um clique em "Analisar com IA", a pessoa lê, em poucas frases e sem jargão, o que o resultado diz (quantos colaboradores a mais, quanto muda a folha, onde pesa mais) e o que isso significa para a loja dela. Teste independente: loja de exemplo gera análise com os mesmos números do diagnóstico.
- **US2 - Ver cenários que ela não está vendo (P1)**: a IA propõe de 2 a 4 cenários (por exemplo: encurtar uma faixa, trocar o plantão por intermitente, fechar mais cedo no domingo, mudar o almoço) e **cada cenário é calculado pelo motor** numa cópia da configuração, mostrando antes e depois (colaboradores, folha por mês, alertas). Nada é salvo.
- **US3 - Pedir o que quiser (P2)**: campo de texto para a pessoa escrever um pedido ou pergunta; a resposta segue as mesmas regras (números do motor, linguagem simples, sem agir). Pode continuar a conversa na mesma tela enquanto ela está aberta.
- **US4 - Rever parâmetros com orientação (P2)**: quando a IA sugere mudar um parâmetro, ela diz **qual**, **onde fica** (com atalho para o passo do cadastro) e **o efeito calculado**. O atalho só abre a tela; a pessoa é quem altera.
- **US5 - Levar a um consultor (P3)**: se a dúvida foge do que a IA cobre, ela oferece o botão "Falar com um consultor" que já existe.

## Requisitos
- **FR-001 Acesso**: só usuário logado, no escopo do próprio grupo; a loja precisa pertencer ao grupo. Sem sessão, 401.
- **FR-002 Entrada**: o botão "Analisar com IA" fica na tela de Resultado. Abre um painel ali mesmo (tela cheia no celular) com o botão principal "Analisar minha loja" e o campo para escrever. **Nada é enviado à IA antes do clique**; nenhuma análise roda sozinha ao abrir a tela.
- **FR-003 A IA não age**: nenhuma função da IA grava dados, altera a loja, envia mensagem ou chama serviço externo. Ela só lê e calcula. Mudar um parâmetro é sempre ação da pessoa, nas telas de dados. A tela deixa claro: "A IA só sugere. Você decide o que mudar."
- **FR-004 Ferramentas (leitura e cálculo)**: ler o diagnóstico (cenário, regime, provisões), ler a escala resumida de uma função, ler as regras aplicadas e **simular mudança** numa cópia, sobre uma lista fechada de campos (horário e dias, almoço e lanche, folga dominical, plantão, feriados, quantidade e salário por função, 12x36 por função, vendas e meta).
- **FR-005 Números só do motor**: todo número citado vem do resultado de uma ferramenta chamada naquela análise. Sem resultado de ferramenta, a IA não afirma número. A tela marca os números como "calculado pelo Radar Escala".
- **FR-006 Linguagem para leigos**: português simples, sem sigla ou termo técnico sem explicar (por exemplo, "DSR", "provisão" e "CMV" sempre com uma frase de apoio); frases curtas; número antes do adjetivo; estrutura fixa: **O que o resultado diz** · **O que mais pesa** · **Cenários que vale testar** · **O que você pode revisar** · **Próximo passo**. Segue o tom de voz do guia (spec 005).
- **FR-007 Regras e lei**: afirmações sobre a lei só com base na lista de regras do painel (fonte e vigência). Fora dela, a IA diz que não tem essa informação e indica o consultor ou o contador. Respostas jurídicas trazem o aviso curto de que o contador ou advogado confirma.
- **FR-008 Privacidade (LGPD)**: não vão ao modelo nome da loja, cidade, nome do grupo, e-mail nem telefone; vão só quadro por função, salários, horários, regras escolhidas e resultados. O servidor não guarda o texto das conversas; o registro técnico guarda só a conta (identificador interno), ferramentas usadas, tokens e tempo. A tela informa isso em uma linha.
- **FR-009 Segurança**: chave da API só no servidor (variável de ambiente); o texto digitado e os dados da loja são tratados como dados, nunca como instruções; as ferramentas têm lista fixa de campos e limites de valor (os do cadastro).
- **FR-010 Limite técnico (não de custo)**: limite por conta contra abuso e laços (por exemplo, 20 pedidos a cada 10 minutos) e tamanho máximo da resposta. Não há teto mensal de custo.
- **FR-011 Resposta em fluxo e erros**: o texto aparece aos poucos; falha mostra "A IA está indisponível agora. O painel continua funcionando."; sem chave configurada, o botão não aparece e o resto do app funciona igual.
- **FR-012 Qualidade verificável**: conjunto de perguntas de teste (analisar, simular, regra, fora do escopo, injeção, dado pessoal, tentativa de gravar) executado automaticamente com o modelo simulado, e roteiro manual com o modelo real, incluindo leitura por uma pessoa leiga.
- **FR-013 Aparência**: usa os componentes e os dois temas do Radar Escala; sem rolagem lateral no celular.

## Fora desta versão
Aplicar a mudança na loja com um clique; duplicar a loja a partir de um cenário; guardar histórico no servidor; memória entre conversas; análise automática ao abrir a tela; treinar ou ajustar modelo próprio; voz; WhatsApp; orientação jurídica própria; dados de outros associados; painel de uso para a equipe Farmarcas.

## Critérios de sucesso
- **SC-001**: nas perguntas de teste, 100% dos números da resposta aparecem no resultado das ferramentas daquela análise.
- **SC-002**: nenhuma carga enviada ao modelo contém nome da loja, cidade, nome do grupo, e-mail ou telefone (teste automatizado).
- **SC-003**: nenhuma ferramenta da IA grava ou altera dados (teste automatizado sobre a lista de ferramentas), e as tentativas de injeção do conjunto de teste são recusadas em 100% dos casos.
- **SC-004**: nenhuma chamada à IA acontece sem o clique da pessoa (teste automatizado: abrir a tela não chama a API).
- **SC-005**: em teste com pessoas leigas (3 ou mais), a análise da loja de exemplo é entendida sem explicação extra.
- **SC-006**: a primeira palavra aparece em até 3 segundos e uma análise completa com simulações termina em até 20 segundos em condições normais.
- **SC-007**: tipos, lint, formatação e todos os testes verdes; sem chave configurada o app inteiro funciona igual a hoje.

## Premissas e decisões do agente
- API da Anthropic pelo SDK oficial, com **uso de ferramentas** e **cache de prompt** (instruções e regras aplicadas mudam pouco). Modelo configurável por `ASSISTANT_MODEL`; padrão **Sonnet 5.5**. Preços e limites serão conferidos na documentação antes de fixar o padrão.
- A chave (`ANTHROPIC_API_KEY`) é colocada pela equipe no `.env`; nunca passa pelo chat nem entra no repositório.
- A simulação reaproveita o cálculo de `POST /scales/preview` por dentro, então a IA não cria regra de cálculo nova.
- Streaming por Server-Sent Events no endpoint da análise.
- O limite técnico (FR-010) é decisão do agente; o valor se ajusta por variável de ambiente.
- O atalho para o passo do cadastro (US4) é só navegação; a mudança continua sendo feita pela pessoa.
