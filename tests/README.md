# Testes do frontend

Esta pasta reúne os testes automatizados, o suporte compartilhado e o modelo de registro de execução. Existir um comando ou um arquivo aqui não significa que o produto foi aprovado: a aprovação depende do resultado observado de cada rodada, registrado com evidência. Estratégia e casos: [test-plan.md](../docs/specs/qualidade-e-manutencao/test-plan.md) e [PLANO_TESTES.md](../docs/PLANO_TESTES.md). Resultado inicial histórico (01/10/2026, outro commit): [RELATORIO_QUALIDADE.md](../docs/RELATORIO_QUALIDADE.md).

## Estado atual

A infraestrutura (Vitest, Playwright, isolamento) está pronta. Os testes de produto ainda não foram escritos: existem apenas testes de infraestrutura, que não contam como cobertura funcional.

| Tipo | Arquivo | Conteúdo hoje |
| --- | --- | --- |
| unit | `tests/unit/infra.test.ts` | 8 casos sentinela do isolamento (alias `@/`, jsdom, RTL, fetch bloqueado, storage, relógio, fuso). |
| integration | `tests/integration/` | Vazio. `npm run test:integration` falha até existir ao menos um teste (T8). |
| functional | `tests/functional/smoke.spec.ts` | 1 smoke: a página inicial carrega no Chromium sem requisições à API. |
| e2e | `tests/e2e/precondicao.spec.ts` | 1 verificação de configuração (`E2E_API_URL` isolada). Não prova persistência nem isolamento A/B. |
| nonfunctional | `tests/nonfunctional/` | Vazio. `npm run test:nonfunctional` falha até existir ao menos um teste. |

## Preparação

Requisitos: Node `^22.22.2 || ^24.15.0 || >=26.0.0` (campo `engines` do `package.json`; o Next 16 exige só 20.9, mas Vitest 5, jsdom 30 e jest-dom 7 exigem Node 22+) e npm. Verificado com Node v26.8.1 e npm 11.19.0.

```bash
npm ci                              # instala conforme o package-lock.json
npx playwright install chromium     # uma vez por máquina; baixa o Chromium do Playwright
```

No Windows, pare o `npm run dev` antes de `npm ci`: o servidor mantém `lightningcss` aberto e o npm falha com `EPERM` ao removê-lo.

## Comandos

Todos existem em `package.json`. Nenhum usa `passWithNoTests`, `continue-on-error` ou filtro silencioso: seleção vazia sai com código diferente de zero.

| Comando | O que executa | Configuração |
| --- | --- | --- |
| `npm run lint` | `eslint .` (sem `--fix`) | `eslint.config.mjs` |
| `npm run test:unit` | `vitest run tests/unit --reporter=verbose` | `vitest.config.mts`, projeto `unit` |
| `npm run test:integration` | `vitest run tests/integration --reporter=verbose` | `vitest.config.mts`, projeto `integration` |
| `npm run test:functional` | `playwright test --project=functional` | `playwright.config.ts` |
| `npm run test:e2e` | `playwright test --project=e2e` | `playwright.config.ts`; exige API isolada |
| `npm run test:nonfunctional` | `playwright test --project=nonfunctional` | `playwright.config.ts` |
| `npm run test:coverage` | `vitest run tests/unit tests/integration --coverage --reporter=verbose` | `vitest.config.mts` |
| `npm run test:regression` | `test:unit`, depois `test:integration`, depois `test:functional` | Mocks apenas; não alega E2E real |

Observações sobre o estado atual, sem esconder falhas:

- `npm run lint` roda, mas sai com código 1: há 10 achados preexistentes no código de produto (8 erros, 2 avisos), registrados em [lint-baseline.log](../docs/evidencias/2026-11-04/lint-baseline.log) e no [BACKLOG](../docs/BACKLOG.md).
- `npm run test:integration` e, por consequência, `npm run test:regression` falham enquanto não houver testes de integração.
- `npm run test:coverage` ainda não compara as quatro métricas com uma baseline versionada (previsto em T32); só gera os relatórios.
- Para rodar um teste específico: `npm run test:unit -- -t "texto do nome"` ou `npm run test:functional -- --grep "texto"`. Um filtro sem correspondência reprova a execução.

## Isolamento e fixtures

Regras de [Fixtures and Isolation](../docs/specs/qualidade-e-manutencao/test-plan.md) aplicadas pela infraestrutura:

- Dados sintéticos: nomes, e-mails, medicamentos e tokens inventados (por exemplo `ana@example.test`, `token-sintetico`). Nunca usar paciente, credencial ou token reais.
- Vitest (`tests/setup.ts`): depois de cada teste ocorrem `cleanup` do RTL, restauração de relógio real, mocks, globais (`vi.stubGlobal`), variáveis de ambiente, `localStorage` e `sessionStorage`. O `fetch` global é substituído antes de cada teste por uma função que rejeita com `Fetch não simulado: <método> <url>`; cada teste deve simular explicitamente as chamadas que espera.
- Tempo e fuso: o fuso é `America/Sao_Paulo`. Em cenários temporais, instale o relógio falso antes de montar o componente (`vi.useFakeTimers()` e `vi.setSystemTime(new Date("2026-11-04T12:00:00-03:00"))`), avance o tempo explicitamente, desmonte o componente e deixe o `afterEach` restaurar tudo.
- Alias `@/` aponta para `src/`, igual ao `tsconfig.json`.
- Playwright: cada teste usa um contexto novo, sem `storageState` e sem credenciais. `tests/support/api-guard.ts` aborta qualquer requisição a `https://medreminder-backend.onrender.com` que o teste não tenha previsto (com `page.route` ou `context.route`) e reprova o teste ao final, listando as chamadas. Os testes funcionais usam API simulada e devem ser descritos como mocks, não como persistência real.
- Fixtures CSV e catálogo: ver as regras no test-plan (cabeçalhos `NOME_PRODUTO` e `DESCRIÇÃO`, ordem conhecida, duplicatas, acentos). Uma fixture curta prova a regra de busca, não o desempenho do catálogo completo.

## Pré-condições do E2E (API isolada)

Os testes de `tests/e2e/` rodam o navegador contra uma API isolada, com dados sintéticos, que a rodada pode restaurar e limpar. Eles exigem a variável `E2E_API_URL`:

```bash
E2E_API_URL=http://localhost:3000 npm run test:e2e
```

- Sem `E2E_API_URL`, com URL inválida ou apontando para a produção, o teste falha com uma mensagem iniciada por `BLOQUEADO:` (`tests/support/e2e.ts`). Ele não é pulado, e um caso BLOQUEADO nunca é contado como aprovado.
- Nunca use a API de produção para testes que alteram dados nem para carga.
- O cliente usa `NEXT_PUBLIC_API_URL`, incorporada no build. Para E2E, defina também `NEXT_PUBLIC_API_ENV=isolated`, `NEXT_PUBLIC_API_URL` igual a `E2E_API_URL`, `E2E_BACKEND_COMMIT` com o SHA completo da API e `E2E_SQLITE_FILE` identificando o banco temporário em arquivo. Ausência de metadados ou configuração divergente falha com BLOQUEADO. Use `NODE_ENV=development` no backend desta revisão: `test` força banco em memória. O frontend continua sendo compilado em produção pelo Playwright.
- Execute `CI=1 npx playwright test --project=e2e --workers=1 --retries=0` e depois `CI=1 npx playwright test --project=isolated-cors --workers=1 --retries=0` (no PowerShell, atribua `$env:CI='1'` antes do comando). CORS tem projeto próprio para não misturar provas reais com a regressão mockada. O teste 429 consome a janela de login por IP; rode-o depois do E2E ou reinicie somente o servidor descartável entre suítes.
- [Evidência real de 04/11](../docs/evidencias/2026-11-04/execution-final.md): persistência, idempotência e isolamento aprovados nos fluxos enumerados. Alertas FE-05 e a rota de medicamentos FE-03 ainda impedem aceite integral; nenhum expected failure aprova esses comportamentos.
- Registre versão e commit da API, contratos usados e dados criados. Remova apenas o que a própria rodada criou.

## Servidor dos testes Playwright

As capturas de novo medicamento mascaram somente os inputs nativos de data/hora, pois sua apresentação varia conforme a regionalização do Windows. Antes da captura, os valores e a quantidade desses campos são verificados explicitamente. Não aumentar tolerância nem atualizar todas as referências para resolver uma divergência localizada; ver [correções do CI](../docs/evidencias/2026-11-04/ci-corrections.md).

`playwright.config.ts` executa `npm run build && npm run start -- --port 3001` e usa `http://localhost:3001`. Localmente reaproveita um servidor já ativo nessa porta (`reuseExistingServer`); com `CI` definida nunca reaproveita. Se houver um servidor antigo na porta 3001, finalize-o para testar o build atual.

## Tipos de testes

| Tipo | Camada | O que prova | Não prova |
| --- | --- | --- | --- |
| unit | Funções puras, cliente HTTP, componentes isolados (Vitest + RTL, jsdom) | Resultado de entradas e saídas | Integração entre módulos |
| integration | Providers, formulários e confirmação com módulos reais e fronteiras controladas | Colaboração entre módulos reais | Navegador real |
| functional | Navegador (Chromium) com API controlada por interceptação | Gestos, requests enviados e layout | Persistência real |
| e2e | Navegador com API isolada | Persistência e isolamento A/B, quando as pré-condições existirem | Produção |
| nonfunctional | Medições e propriedades (desempenho, acessibilidade, capacidade) | Resultado do método e do ambiente registrados | Escala de produção sem medição |

## Cobertura

`npm run test:coverage` roda unitários e integração com V8 sobre `src/**/*.{ts,tsx}` e grava JSON, LCOV e HTML em `coverage/` (ignorado pelo git). Arquivos de `src` nunca importados entram no denominador. Não há percentual mínimo aprovado: o objetivo é cobrir os critérios do escopo e não reduzir as quatro métricas (linhas, funções, branches e statements) depois da baseline.

## Coleta sanitizada de evidências

1. Copie [REGISTRO_EXECUCAO.md](REGISTRO_EXECUCAO.md) para `docs/evidencias/<data>/` e preencha: data e fuso, commit do frontend e da API, ambiente e origem, versões de Node/npm/navegador/SO, fixtures, comando, resultado esperado e observado, contagem selecionada/executada/aprovada/reprovada/bloqueada, duração e defeito associado.
2. Salve a saída dos comandos em `.log` (`docs/evidencias/.gitignore` preserva logs no histórico) e inclua o código de saída. Informe também falhas e bloqueios; não apague nem sobrescreva logs de rodadas anteriores.
3. Sanitize antes de versionar: remova tokens, cookies, senhas, e-mails e nomes reais, respostas completas de API e caminhos absolutos com nome de usuário.
4. `playwright-report/`, `test-results/` (traces, vídeos, capturas) e `coverage/` ficam fora do git. Eles podem conter dados da sessão. Publique somente capturas ou resumos revisados e sem dados sensíveis.
5. Sem evidência não há aprovação. Um comando com vários testes verdes não prova um critério ausente.
