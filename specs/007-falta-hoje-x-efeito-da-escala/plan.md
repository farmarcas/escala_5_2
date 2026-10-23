# Plano 007 — Falta hoje x efeito da nova escala

**Spec**: [spec.md](spec.md) · **Sem banco novo, sem rota nova, sem biblioteca nova.**

## Escolhi
Calcular as duas partes dentro do próprio diagnóstico (`scales.diagnostic.ts`) e entregar no mesmo resultado que a tela, o Excel, o consultor e a IA já leem.

## Por quê
O motor já calcula o necessário na 6x1 e na 5x2 por função. As duas partes são só uma subtração desses números; assim todas as telas mostram sempre o mesmo valor e nenhum número existente muda.

## Como
**Pessoas (por função, somadas no total)**
- falta hoje = `max(0, necessário 6x1 − pessoas hoje)`
- efeito da escala = `contratar 5x2 − falta hoje` (pode ser negativo ou zero)
- A soma das duas é sempre igual ao "contratar" atual.

**Dinheiro (folha mensal)**
- Nova folha "loja coberta na 6x1": folha de hoje mais as pessoas da "falta hoje", com o menor salário da função e a jornada da 6x1 (mesma regra que já vale para contratação na 5x2).
- falta hoje (R$) = folha coberta na 6x1 − folha de hoje
- efeito da escala (R$) = folha 5x2 − folha coberta na 6x1
- A soma é igual à diferença atual da folha. O plantão intermitente (que só existe nos cenários novos) entra no efeito da escala.

**Onde entra**
- Motor: campos novos em `Diagnostic` (`totals.gap` e `payroll.covered6x1`, `payroll.scenarios[x].split`) e `gap` por linha. Nada existente é removido nem muda de valor.
- Tela: faixa de destaque e cartões do Diagnóstico, Resumo ao vivo, tipos em `features/scales/types.ts`.
- Excel (`scales.report.ts`): duas linhas a mais no comparativo.
- Consultor: o resumo do pedido ganha os dois números.
- IA: `ler_diagnostico` devolve as duas partes (e entram no conjunto de números permitidos), e as instruções fixas pedem para explicar a diferença em linguagem simples.
- Passo 4: aviso no cartão da função, calculado na tela com o resultado do resumo ao vivo (`rows[].need` e `today`), sem chamada nova.

## Testes
- Motor: soma das partes = totais atuais (pessoas e R$) em loja que cobre, loja que falta e loja com sobra; caso Loja Gabriel (9 pessoas: falta 22, efeito −1, soma 21).
- Excel igual à tela; ferramenta da IA devolve as duas partes; teste da tela para o aviso do passo 4.
- Teste dourado do caso de referência continua passando sem alteração.
