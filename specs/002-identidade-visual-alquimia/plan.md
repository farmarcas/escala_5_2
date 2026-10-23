# Plano: Identidade visual do Alquimia

**Spec**: [spec.md](spec.md)

## Para quem lê
Escolhi: copiar as cores e o desenho do Alquimia para os nossos componentes.
Por quê: o pacote privado ainda não está acessível e só cobre botão e campo; assim a tela inteira muda de uma vez.

## Contexto técnico
React + Vite + Tailwind v4 (já em uso). O tema do Alquimia (`packages/tailwind/theme.css`) já é Tailwind v4: as cores são copiadas para `src/styles/globals.css` no bloco `@theme`, e os tokens semânticos do projeto (`primary`, `muted`, `border`...) passam a apontar para elas.

## Mapa de tokens
| Token do projeto | Alquimia | Valor |
| --- | --- | --- |
| background | li-00 | #FFFFFF |
| foreground | da-800 | #172B4D |
| primary / ring | rp-500 | #006FF7 |
| primary-hover | rp-600 | #074AC6 |
| primary-strong (texto sobre fundo claro azulado) | rp-600 | #074AC6 |
| muted | li-20 | #F0F3F6 |
| muted-foreground | mi-300 | #5E6C84 |
| border | li-40 | #D3D8DD |
| accent | rp-25 | #E4F2FF |
| destructive | wa-300 | #DF0028 |
| warning / warning-background | texto #7A5200 (mais escuro que at-500, por contraste) / at-50 | #FFEECD |

## Estrutura
- `frontend/react/src/styles/globals.css`: paleta Alquimia + tokens + fonte.
- `frontend/react/src/components/ui/*`: Button, campos, selo, caixa de marcar no desenho do Alquimia.
- `frontend/react/src/components/layout/Header.tsx`: cabeçalho escuro (foreground) com texto claro.
- `frontend/react/src/features/reports/buildPdf.ts`: cores do PDF.
- Dependência nova: `@fontsource-variable/inter` (fonte autohospedada).
