# Organização do repositório

Árvore conferida em 04/11/2026. Mantém os nomes atuais, inclusive a rota `Configuracoes` com inicial maiúscula.

| Caminho | Finalidade |
| --- | --- |
| [src/app](../src/app) | App Router, layout, home e rotas cadastro/login/novo-medicamento/meus-medicamentos/meus-lembretes/historico/Configuracoes. |
| [components](../src/app/components) | Busca, formulário, navegação, proteção de rota, logo e alertas. |
| [contexts](../src/app/contexts) | Sessão, lembretes e estado da sidebar. |
| [utils](../src/app/utils) | Cliente HTTP e configuração da origem. |
| [public](../public) | Recursos estáticos; catálogo e imagens em assets. |
| [tests/unit](../tests/unit) | Comportamentos isolados de cliente HTTP e busca; infraestrutura. |
| [tests/integration](../tests/integration) | Componentes e providers reais, rede/storage/tempo controlados. |
| [tests/functional](../tests/functional) | Chromium com API interceptada; gestos, payloads e capturas. |
| [tests/e2e](../tests/e2e) | API real isolada; pré-condições explícitas, sem aprovação quando indisponível. |
| [tests/nonfunctional](../tests/nonfunctional) | Avaliação de acessibilidade, segurança, performance e capacidade local. |
| [tests/support](../tests/support) | Guardas de rede e preparação E2E. |
| [scripts](../scripts) | Comparação das quatro métricas de cobertura com baseline. |
| [.github/workflows](../.github/workflows) | Pipeline de qualidade, sem prova de execução remota nesta rodada. |
| [docs/specs](specs) | Requisitos, projeto e tarefas; estado de execução nos tasks.md. |
| [docs/evidencias](evidencias) | Rodadas datadas, versões, benchmarks e limites. |

[package.json](../package.json) declara comandos, dependências e runtime; [package-lock.json](../package-lock.json) fixa a resolução instalada. `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts` e `playwright.config.ts` são configurações autorais da raiz.

`node_modules`, `.next`, `coverage`, `playwright-report` e `test-results` são artefatos gerados e não representam fontes. Relatórios de navegador e traces podem conter estado da sessão; as evidências publicadas usam apenas fixtures sintéticas. Arquivos temporários de agentes em `.claude` não substituem código nem documentação de produto.

Reprodução: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run build` e os scripts `test:*` do [guia de testes](../tests/README.md). O projeto roda em desenvolvimento com `npm run dev`; produção local com `npm run build` e `npm run start`. No PowerShell que bloqueia `npm.ps1`, o executável `npm.cmd` chama o mesmo npm sem alterar a política do sistema.
