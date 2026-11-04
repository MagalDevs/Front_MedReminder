# Tecnologias e ambiente

Valores lidos de package.json e package-lock.json após integrar as atualizações em `84b5ae7`, em 04/11/2026. Instalação limpa usa `npm ci`; não depende de ferramentas globais.

| Pacote runtime | Declarado | Resolvido | Uso |
| --- | --- | --- | --- |
| next | 16.4.5 | 16.4.5 | App Router, build e servidor. |
| react / react-dom | ^19.3.1 | 19.3.1 | Componentes e DOM. |
| papaparse | ^5.7.0 | 5.7.0 | Parser do CSV. |
| react-datepicker | ^8.10.0 | 8.10.0 | Instalada, sem importação atual em src; o formulário usa campos nativos. |
| lucide-react | ^0.511.0 | 0.511.0 | Ícones. |
| react-input-mask | ^2.0.4 | 2.0.4 | Dependência mantida, sem uso atual; incompatibilidade latente com React 19 registrada. |

| Ferramenta | Declarado / resolvido |
| --- | --- |
| TypeScript | ^5.9.3 / 5.9.3 |
| Tailwind / @tailwindcss/postcss | ^4.3.4 / 4.3.4 |
| ESLint | ^9.39.5 / 9.39.5 |
| eslint-config-next | 16.4.5 / 16.4.5 |
| @eslint/eslintrc | ^3.3.7 / 3.3.7 |
| Vitest / @vitest/coverage-v8 | ^5.1.0 / 5.1.0 |
| @vitejs/plugin-react | ^6.2.1 / 6.2.1 |
| jsdom | ^30.1.3 / 30.1.3 |
| @playwright/test | ^1.64.1 / 1.64.1 |
| @testing-library/react | ^16.3.3 / 16.3.3 |
| @testing-library/dom | ^10.4.2 / 10.4.2 |
| @testing-library/jest-dom | ^7.0.1 / 7.0.1 |
| @testing-library/user-event | ^14.6.8 / 14.6.8 |
| @types/node | ^22.20.5 / 22.20.5 |
| @types/react / @types/react-dom | ^19.3.0 / 19.3.0 |
| @types/papaparse | ^5.5.2 / 5.5.2 |
| @types/react-input-mask | ^3.0.6 / 3.0.6 |

Runtime declarado: Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Ambiente efetivamente verificado: Windows, Node v26.8.1 e npm 11.19.0. As faixas mínimas também atendem ao harness de testes, mais restritivo que o mínimo do Next. Não há afirmação de teste executado em todas as versões permitidas.

Copie [`.env.example`](../.env.example) para `.env.local` e ajuste a origem da API. As variáveis `NEXT_PUBLIC_*` são públicas e incorporadas ao build. Para testes isolados, exija a origem explicitamente; confira o protocolo [E2E](../tests/README.md) antes de acessar uma API real.

Ferramentas instaladas não equivalem a cenários aprovados. Vitest/RTL cobrem unidade e integração; Playwright cobre navegador com mocks, E2E e medições. Tipos/build/lint verificam aspectos técnicos. A avaliação de dependências, decisões de manter versões e majors adiadas estão em [dependency-updates.md](evidencias/2026-11-04/dependency-updates.md). A auditoria atual mantém 9 entradas afetadas, detalhadas na [avaliação NF](evidencias/2026-11-04/nonfunctional/audit-summary.json).
