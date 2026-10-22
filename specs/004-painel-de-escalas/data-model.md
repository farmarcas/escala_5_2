# Modelo de dados: Painel de Escalas

Reaproveita `groups`, `users`, `sessions`, `contact_requests`. Evolui `stores` e `store_roles` (expand agora, contract na última fatia). Convenções do projeto: UUIDv7, `snake_case`, plural, `timestamptz`, exclusão lógica.

## stores (colunas novas)
| Campo | Tipo | Regra |
| --- | --- | --- |
| state | text(2) NULL | UF; obrigatória no cadastro novo |
| scale_start_date | date NULL | segunda-feira da semana de início; obrigatória no cadastro novo |
| tax_regime | enum `simples`, `lucro_presumido_real` NULL | por loja (o regime do grupo vira só sugestão) |
| config | jsonb NOT NULL default `{}` | passos 2, 3, 5, 6 e 7, com `version`; validado por Zod |

`config` (resumo): `hours` (24h, padrão, dias, ajuste por dia), `plantao` (tipo, semana do ciclo, início, fim, quantidades, cobertura, indenizar), `rules` (folga dominical, CCT texto, almoço, lanche, provisões, indenizar 12x36, vale-transporte, benefícios, encargos avançados), `sales` (opcional), `holidays` (lista, regras de rodízio e compensação).
Colunas antigas (`profile`, `size`, `opening_hours`) continuam até o contract; o novo cadastro grava o horário em `config.hours`.

## store_roles (colunas novas e enum ampliado)
- Enum de função passa a ter: `farmaceutico`, `gerente`, `subgerente`, `balconista`, `caixa`, `perfumista`, `servicos_gerais`, `entregador`, `comprador`, `conferente`, `atendente_digital`, `expedicao`.
- Novos campos: `enabled` (bool), `scale_type` (`normal` | `doze_x_trinta_e_seis`), `coverage_mode` (`all` | `band`), `band_start`/`band_end` (time, nulos), `days_mask` (smallint, 7 bits), `owner_is_pharmacist` (bool), `motorcycle` (bool, só entregador).
- `min_per_shift` passa a significar **mínimo no salão**; `headcount` = quantidade hoje; `monthly_salary` = salário de registro.
- Sem uso no produto novo (saem no contract): `weekly_hours`, `absence_rate`.

## Tabelas que saem (contract)
`simulations` (simulações salvas) e o módulo de mitigações e comparação. O que já está salvo não migra: era foto de um produto que deixa de existir (avisar antes de aplicar em qualquer base com dados reais).

## Resultado (não é tabela)
O motor devolve, por cenário: `staffing[role]` (hoje, necessário 6x1, necessário 5x2, contratar), `roster[weeks][person][day]` (entrada, saída, almoço, lanche, marcas, horas da semana), `cost` (componentes mensais e por colaborador), `holidays` (resumo), `alerts[]`. Nada disso é gravado: é recalculado sempre da configuração (determinístico), então não há "foto" velha para conciliar.
