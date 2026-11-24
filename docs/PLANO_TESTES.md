# Plano de testes — frontend web

## Objetivo

Validar a interface Next.js, o contrato com a API e as regressões de sessão, cadastro, tratamento e confirmação de doses. A evidência de persistência e isolamento entre contas vem dos testes com backend isolado.

## Ambiente e execução

Execute na raiz do repositório. Use uma versão de Node.js aceita pelo [package.json](../package.json), como Node 24.15 ou superior da série 24, e rode `npm ci`. Para Playwright, instale o Google Chrome disponível no canal `chrome` da [configuração atual](../playwright.config.ts). O servidor principal de testes ocupa `http://localhost:3000`, faz build com Webpack e inicia o Next.js sem reaproveitar servidor existente. As imagens de referência versionadas usam Windows e larguras de 360, 768 e 1440 px.

| Verificação | Comando | Ambiente |
| --- | --- | --- |
| Unitários | `npm run test:unit` | Vitest e jsdom em [tests/unit](../tests/unit). |
| Integração de componentes | `npm run test:integration` | Vitest e React Testing Library em [tests/integration](../tests/integration), com rede simulada e fuso `America/Sao_Paulo`. |
| Funcionais e visuais | `npm run test:functional` | Chrome com chamadas à API interceptadas em [tests/functional](../tests/functional). |
| Regressão local | `npm run test:regression` | Unitários, integração e funcionais, nessa ordem. |
| Cobertura | `npm run test:coverage` e `node scripts/check-coverage.mjs` | V8 sobre `src/**/*.{ts,tsx}`, incluindo fontes sem testes. O script compara as quatro métricas com a [baseline versionada](../tests/coverage-baseline.json). |
| E2E com backend isolado | `npm run test:e2e -- --workers=1 --retries=0` | [Contratos HTTP e fluxos de navegador](../tests/e2e). Configure a API antes de iniciar. |
| CORS com backend isolado | `npx playwright test --project=isolated-cors --workers=1 --retries=0` | [Provas de CORS](../tests/functional/backend-cors.spec.ts), incluindo preflight e leitura de `Retry-After`. Rode após o E2E porque o teste de 429 consome a janela de login. |
| Feedback de cadastro | `npx playwright test --config=playwright.feedback.config.ts` | [Suíte dedicada](../tests/feedback/cadastro-feedback.spec.ts). A configuração inicia o backend do repositório vizinho na porta 3001 em modo de teste e o web na 3000. |
| Não funcionais | `npm run test:nonfunctional` | [Acessibilidade, desempenho, volume e privacidade](../tests/nonfunctional) com dados sintéticos. |
| Verificações estáticas | `npm run lint`, `npx tsc --noEmit` e `npm run build` | ESLint, TypeScript e build de produção. |

O [workflow quality](../.github/workflows/quality.yml) configura lint, tipos, build, Vitest, cobertura e funcionais. O E2E no CI depende de uma API isolada configurada. Para a execução local de navegador, prevalecem a porta e o canal definidos na configuração atual do Playwright.

### Preparar o E2E com backend isolado

Inicie a API isolada em uma origem diferente da porta 3000, com duas contas sintéticas criadas pelos próprios testes, CORS liberado para `http://localhost:3000` e SQLite descartável em arquivo inicializado com migrações. Para reproduzir a API local com SQLite em arquivo, configure o backend com `NODE_ENV=development`, `SQLITE_PATH` apontando para esse arquivo, `FIREBASE_ENABLED=false` e um `JWT_SECRET` sintético. Confira `/health/ready` antes da rodada. Exporte as variáveis abaixo antes de iniciar os comandos E2E e CORS.

| Variável | Valor |
| --- | --- |
| `E2E_API_URL` | Origem da API isolada, por exemplo `http://localhost:3001`. |
| `NEXT_PUBLIC_API_URL` | Mesma origem, incorporada no build web. |
| `NEXT_PUBLIC_API_ENV` | `isolated`. |
| `E2E_BACKEND_COMMIT` | SHA completo da revisão do backend. |
| `E2E_SQLITE_FILE` | Identificador do arquivo SQLite temporário usado pelo backend. |

A [pré-condição](../tests/support/e2e.ts) rejeita URL ausente, inválida ou de produção. A [validação de ambiente](../tests/support/backend-environment.ts) verifica os metadados declarados e a origem usada no build. Registre como bloqueado o cenário que ficar sem essas pré-condições.

## Cenários automatizados

| Caso | Comportamento verificado | Referência |
| --- | --- | --- |
| WEB-01, WEB-02 | Cadastro, login, retomada de sessão, rota protegida, 401 e logout. Inclui mensagens de falha e limpeza de sessão. | [Auth](../tests/integration/auth.test.tsx), [sessão](../tests/integration/backend-session.test.tsx), [fluxo no Chrome](../tests/functional/fluxo.spec.ts) |
| WEB-03, WEB-06 | Busca no catálogo, seleção, validação do formulário, cálculo de horários, envio atômico, retry idempotente e exclusão com confirmação. | [Catálogo](../tests/unit/CardBusca.test.tsx), [formulário de tratamento](../tests/integration/tratamento.test.tsx), [operação com backend](../tests/integration/backend-tratamento.test.tsx), [fluxo no Chrome](../tests/functional/fluxo.spec.ts) |
| WEB-04, WEB-05 | Filtros e histórico, confirmação e recarga, isolamento A/B e repetição do tratamento sem duplicar registros em API isolada. | [Lembretes](../tests/integration/lembretes.test.tsx), [histórico](../tests/functional/backend-history.spec.ts), [contrato E2E](../tests/e2e/backend-contract.spec.ts) |
| WEB-07 | Alertas em primeiro plano e confirmação no diálogo com feedback de falha. A suíte também registra os cenários conhecidos de falha em timers e simultaneidade. | [Lembretes](../tests/integration/lembretes.test.tsx), [alarme](../tests/integration/cadastro-feedback-alarm.test.tsx), [fluxo no Chrome](../tests/functional/fluxo.spec.ts) |
| WEB-08 | Perfil, mudança de senha e fluxo de atualização de foto. | [Perfil](../tests/integration/backend-profile.test.tsx), [foto](../tests/integration/cadastro-feedback-photo.test.tsx), [feedback de perfil](../tests/integration/cadastro-feedback-profile.test.tsx) |
| WEB-09 | Erros HTTP e de rede, timeout, retomada de controle, reenvio explícito e prevenção de ações duplicadas. | [Erros HTTP](../tests/unit/request-errors.test.ts), [feedback de cadastro](../tests/feedback/cadastro-feedback.spec.ts), [integração de feedback](../tests/integration/) |
| NF-WEB-01 a NF-WEB-04 | Teclado, rótulos e layout responsivo. Medição de busca, rotas e listas com 10/100/1000 registros. Verificações de logs, storage, 401 e logout. | [Não funcionais](../tests/nonfunctional/), [protocolo e medições históricas](evidencias/2026-11-04/nonfunctional/README.md) |

A suíte de lembretes marca quatro falhas esperadas de FE-05: alerta para dose já tomada, fila de doses simultâneas, cancelamento e duplicação de timers. O projeto funcional marca como falha esperada o redirecionamento da rota `meus-medicamentos` sem sessão (FE-03). Registre esses cenários com o comportamento observado. Reserve uma rodada própria para leitor de tela e alertas com a aba suspensa ou fechada. Ao repetir as medições não funcionais, defina `NF_EVIDENCE_PREFIX` com um identificador novo para preservar os JSON históricos no diretório usado pela suíte.

## Aceite e evidências

Registre o resultado de cada cenário crítico com o ambiente usado. Exija build aprovado e ausência de defeitos P0 para o aceite do produto. O aceite dos fluxos integrados exige execução contra a API isolada. A cobertura unitária e de integração deve cumprir a baseline vigente.

Use o [modelo de execução](../tests/REGISTRO_EXECUCAO.md) para registrar revisões do web e da API, versões de Node/Chrome/SO, comando, resultado esperado e observado, código de saída e defeitos. Revise relatórios, capturas e traces antes de compartilhar e remova credenciais e dados pessoais. Consulte a [rodada histórica de 04/11](evidencias/2026-11-04/execution-final.md) para exemplos de evidência.
