# Frontend Quality and Maintenance Tasks

## Execution Protocol

Ativar a skill `tlc-spec-driven` pelo nome para uma futura implementação e seguir seu fluxo Execute. Se ela não estiver disponível, interromper. Este arquivo entrega o planejamento solicitado, sem iniciar suas tarefas.

**Spec**: [spec.md](spec.md)
**Design**: [design.md](design.md)
**Status**: Approved — em execução
**Date**: 2026-11-04, America/Sao_Paulo.
**Build**: `npx --no-install eslint .; npx --no-install tsc --noEmit; npm run build`

Aprovação registrada em 2026-11-04 (ver [context.md](context.md#approval-state)): "siga as specs deste projeto e finalize elas por favor". Os validadores Python da skill e a própria skill `tlc-spec-driven` não existem nesta máquina; o protocolo é seguido manualmente. O texto original abaixo permanece como histórico do plano. A escolha da stack está em [context.md](context.md). Antes de implementar, obter as duas aprovações em momentos separados, registradas com data e palavras do usuário, e executar `validate_tasks.py docs/specs/qualidade-e-manutencao/tasks.md --execute`. Se o baseline estiver vermelho, interromper e registrar o bloqueio. Não transformar este plano em autorização para push, merge, deploy ou acesso a produção.

O Build usa a CLI ESLint já prevista no plano antigo como alternativa a `next lint`, removido no Next 16. Isso descreve o gate futuro, não um resultado executado. Após T2/T3, `npm run lint` deve produzir o mesmo resultado. Caso o gate inicial falhe, não pular o validador para executar T2/T3; a recuperação do baseline deve ser tratada antes da execução normal.

## Test Coverage Matrix

Gerada de `package.json`, `eslint.config.mjs`, `tsconfig.json`, `docs/PLANO_TESTES.md`, `docs/RELATORIO_QUALIDADE.md`, `tests/README.md` e do código localizado pelo Graphify. Não há suíte automatizada atual. Os tipos e a stack foram escolhidos pelo usuário; comandos abaixo são futuros, a serem criados em T3/T4/T5. Metas: todos os critérios/casos do escopo e nenhuma regressão das quatro métricas após baseline, sem percentual mínimo inventado.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Cliente HTTP e funções puras | unit | Sucesso, limites e todas as falhas listadas; resultado independente da implementação | `tests/unit/*.test.ts` | `npm run test:unit` |
| Busca e seletores | unit | Entradas/ordem/limite/gestos previstos, sem snapshot isolado como única assertiva | `tests/unit/*.test.tsx` | `npm run test:unit` |
| Providers, formulários e confirmação | integration | Módulos reais, sucesso/falha e fronteiras de rede/storage/tempo controladas | `tests/integration/*.test.tsx` | `npm run test:integration` |
| Navegador com API controlada | functional | Gestos e requests, layouts estáveis; identificado como mocks | `tests/functional/*.spec.ts` | `npm run test:functional` |
| Navegador com API isolada | e2e | Persistência e isolamento A/B; dependência ausente bloqueia, não aprova | `tests/e2e/*.spec.ts` | `npm run test:e2e` |
| Propriedades não funcionais | nonfunctional | Método/amostras/ambiente e resultados; revisão manual quando necessária | `tests/nonfunctional/*.spec.ts` | `npm run test:nonfunctional` |
| Dependências de UI/runtime | unit/integration/functional | Reexecutar cenários afetados e conferir contrato/visual antes e depois | Suítes das camadas afetadas | Build + regressão pertinente |
| Configuração, compiler e documentos | none | Validação estrutural, build ou conferência por fontes; não criar testes que só repetem texto | Configurações e `docs/` | Build ou revisão manual |

Os testes da mudança acompanham a tarefa que altera código. Os testes de caracterização T7–T12 cobrem código preexistente; T23–T27 incluem seus próprios testes de regressão no mesmo commit. Testes de defeitos funcionais não devem congelar o bug como resultado aprovado, nem usar skip para tornar o gate verde.

## Planned Commands

Nenhum script `test:*` existe na baseline. Estas são interfaces planejadas; não foram executadas nem são provas verdes.

| Command | Planned implementation |
| --- | --- |
| `npm run lint` | `eslint .`, sem --fix automático |
| `npm run test:unit` | `vitest run tests/unit --reporter=verbose` |
| `npm run test:integration` | `vitest run tests/integration --reporter=verbose` |
| `npm run test:functional` | `playwright test --project=functional` |
| `npm run test:e2e` | `playwright test --project=e2e`, com API isolada obrigatória |
| `npm run test:nonfunctional` | `playwright test --project=nonfunctional`; auditoria/manual/carga seguem o protocolo complementar |
| `npm run test:coverage` | `vitest run tests/unit tests/integration --coverage --reporter=verbose`, com JSON/LCOV/HTML e verificação de baseline |
| `npm run test:regression` | unitários, integração e funcionais com mocks; sem alegar E2E real |

Não configurar `passWithNoTests`, `--pass-with-no-tests`, `continue-on-error` ou filtros silenciosos. Os testes devem falhar se não houver seleção. Cada prova futura seleciona testes nomeados por ID de critério ou arquivo pertinente; materializar esse nome no teste antes de executar a prova.

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| quick | Unitários e alteração local de busca/HTTP | `npm run test:unit` e teste específico indicado na tarefa |
| full | Integração ou funcional | `npm run test:unit`, `npm run test:integration`, suíte específica; E2E real só com pré-condições atendidas |
| build | Configuração/atualização de dependências e CI | Build do cabeçalho; após bootstrap, `npm run test:regression`; instalar com `npm ci` em atualização |
| nf | Medições e propriedades não funcionais | `npm run test:nonfunctional` mais protocolo nomeado em `test-plan.md`; comandos não substituem leitura manual |
| manual | Documentação e inventário | Conferir entregável, fontes, links, commit e evidências; registrar revisão; nenhuma alegação de teste de produto |
| bootstrap-unit | Primeiro harness Vitest, antes das suítes de produto | `npm run test:unit`; teste sentinela selecionado; repetir com filtro inexistente e exigir saída não zero |
| bootstrap-functional | Primeiro harness Playwright, antes da integração de produto | `npm run test:functional`; smoke selecionado; repetir com grep inexistente e exigir saída não zero |
| coverage | Coleta e proteção das quatro métricas | `npm run test:coverage`; conferir JSON/LCOV, fontes não exercitadas e comparação das quatro métricas no mesmo escopo |

Instalação e baseline precisam de runtime verificado e acesso ao registry. Resultados antigos de 01/10/2026 não aprovam estes gates. Não rodar novamente suítes amplas sem mudança ou falha que justifique; os proofs finais da skill reúnem a comprovação no commit final.

## Execution Plan

Fases sequenciais. Cada tarefa é um entregável atômico com commit próprio. Testes e lockfile necessários acompanham a mudança que verificam. Nenhuma tarefa está concluída.

As transições entre fases também são dependências:

```text
T6 → T7
T12 → T13
T13 → T14
T22 → T23
T27 → T28
T33 → T34
```

### Phase 1: Foundation

```text
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Behavior Characterization

```text
T7 → T8 → T9 → T10 → T11 → T12 → T13
```

### Phase 3: Dependency Updates

```text
T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21 → T22
```

### Phase 4: Optimization and Logging

```text
T23 → T24 → T25 → T26 → T27
```

### Phase 5: Quality Evidence

```text
T28 → T29 → T30 → T31 → T32 → T33
```

### Phase 6: Documentation and Integrated Acceptance

```text
T34 → T35 → T36 → T37 → T38 → T39 → T40 → T41
```

T41 é o marco condicionado de E2E real. A indisponibilidade de ambiente ou das correções externas mantém o aceite integrado bloqueado, sem impedir as tarefas locais T1–T40. Nenhum caso bloqueado é contado como teste aprovado.

## Task Breakdown

### T1: Registrar inventário e baseline de dependências

**What**: Registrar todos os pacotes diretos do manifesto e lockfile, runtime, peers, candidato, advisory, origem da consulta e decisão manter/atualizar/bloquear.
**Where**: `docs/evidencias/<execucao>/dependencies.json`
**Depends on**: None
**Reuses**: FE-01; PRs Dependabot; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-01
**Status**: Done

**Done when**:

- [x] Inventário inclui todos os pacotes diretos, hashes e commit; consulta indisponível é BLOQUEADO, sem versão inventada.
- [x] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documento; conferir manifesto/lockfile e registry sem instalar pacotes.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(docs): record dependency baseline`

**Execution note**: 2026-11-04. Inventário em [dependencies.json](../../evidencias/2026-11-04/dependencies.json) com 18/18 pacotes diretos, hashes de package.json/package-lock.json e commit avaliado. Gate manual: conferido manifesto/lockfile e registry sem instalar pacotes. Baseline do gate Build registrado no JSON: eslint FALHA (TypeError circular em FlatCompat, corrigido em T2), tsc OK, build OK. Nenhum teste aplicável (documento).

### T2: Adequar configuração do ESLint ao Next 16

**What**: Configurar ESLint CLI com as regras Next/TypeScript existentes, preservando a intensidade das regras.
**Where**: `eslint.config.mjs`
**Depends on**: T1
**Reuses**: FE-01; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, CI-01
**Status**: Done

**Done when**:

- [x] CLI lê a configuração sem erro; zero regras desativadas para ocultar achados; avisos e falhas preexistentes são relacionados ao backlog.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, configuração; executar lint sem --fix e revisar saída completa.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(lint): align config with Next 16`

**Execution note**: 2026-11-04. Config flat nativa (defineConfig + eslint-config-next/core-web-vitals + /typescript, conforme documentação do Next 16.2 via Context7); FlatCompat removido. Ignora .next, node_modules, coverage, playwright-report, test-results (e out/build/next-env.d.ts). Gate build: `eslint .` lê a configuração sem erro e reporta 10 achados preexistentes (8 erros, 2 avisos; exit 1) registrados em [lint-baseline.log](../../evidencias/2026-11-04/lint-baseline.log) e em docs/BACKLOG.md; o exit 1 permanece visível, nenhuma regra foi desativada. `tsc --noEmit` OK (exit 0). Nenhum teste aplicável (configuração).

### T3: Configurar runtime e comandos de qualidade

**What**: Declarar runtime verificado e devDependencies das ferramentas escolhidas; registrar os comandos da tabela Planned Commands e substituir next lint por ESLint CLI.
**Where**: `package.json`
**Depends on**: T2
**Reuses**: FE-01/07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, CI-01
**Status**: Done

**Done when**:

- [x] Instalação limpa respeita peers; lockfile é regenerado pelo npm como parte do mesmo entregável; comandos não permitem sucesso com zero testes e não usam instalação global.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, configuração; npm ci e conferência dos scripts/devDependencies/lockfile; a rejeição de seleção vazia pertence aos harnesses que a tornam executável em T4/T5.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(test): declare test toolchain and commands`

**Execution note**: 2026-11-04. Instalado com `npm install -D` (sem --force/--legacy-peer-deps): vitest 5.1.0, @vitest/coverage-v8 5.1.0, @vitejs/plugin-react 6.2.1, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, @playwright/test 1.64.1 (vite 8.3.5 entra como dependência transitiva de vitest/plugin-react; vite-tsconfig-paths não foi necessário, o alias `@/` vai por `resolve.alias` em T4). Decisão de runtime: `engines.node` = `^22.22.2 || ^24.15.0 || >=26.0.0`. O Next 16 exige apenas Node >=20.9 (Context7, docs do Next 16), mas vitest 5 (^22.12 || ^24 || >=26), jsdom 30 (^22.22.2 || ^24.15 || >=26) e jest-dom 7 (>=22) exigem Node 22+; o runtime verificado é Node v26.8.1/npm 11.19.0. Peer conflitante: vitest 5 declara `@types/node` ^22 || >=24 e o projeto tinha ^20, o que gerava ERESOLVE; `@types/node` subiu para ^22 (22.20.5), alinhado ao runtime mínimo e sem force (T22 ainda revisa esse pacote). Lockfile regenerado pelo npm no mesmo commit: 120 pacotes adicionados e 4 mudanças de versão por resolução (@types/node 22.20.5, undici-types 6.21.0, nanoid 3.3.20, source-map-js 1.2.2 — este último fecha o advisory high do inventário). `npm ci` limpo OK (após parar o `next dev` que travava lightningcss com EPERM). Gate build: `tsc --noEmit` OK, `npm run build` OK, `npm run lint` roda e mantém os 10 achados preexistentes (8 erros, 2 avisos; exit 1) de T2. Os scripts `test:*` existem, mas as suítes são criadas em T4/T5; `test:integration` e `test:regression` falham até haver testes de integração (T8), por desenho (sem passWithNoTests). Nenhum teste aplicável.

### T4: Configurar Vitest e isolamento dos testes

**What**: Configurar alias @/, jsdom, setup RTL, reset de mocks/storage/relógio e separação unit/integration.
**Where**: `vitest.config.mts`
**Depends on**: T3
**Reuses**: FE-07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-01
**Status**: Done

**Done when**:

- [x] Configuração inclui src não exercitado no denominador de coverage; teste sentinela de infraestrutura executa; filtro inexistente retorna saída não zero.
- [x] Resultado do gate bootstrap-unit registrado no commit avaliado; smoke executado e filtro inexistente rejeitado antes do commit.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: 1 teste sentinela de infraestrutura; não conta como cobertura funcional.
**Gate**: bootstrap-unit — usar a linha correspondente em Gate Check Commands; não exigir integração ainda inexistente.
**Commit**: `test: configure Vitest isolation`

**Execution note**: 2026-11-04. `vitest.config.mts`: alias `@` -> src, jsdom, `tests/setup.ts` (jest-dom, cleanup do RTL, restauração de mocks/timers/globals/env/storage após cada teste, fetch global que rejeita chamadas não simuladas), fuso fixo America/Sao_Paulo, projetos `unit` (tests/unit) e `integration` (tests/integration), coverage v8 com `include: src/**/*.{ts,tsx}` (25/25 arquivos de src aparecem em coverage-final.json) e reporters json/lcov/html em `coverage/`. Sem passWithNoTests. Achado: o Vitest 5.1.0 sai com código 0 quando `-t FILTRO_INEXISTENTE` deixa todos os testes skipped; por isso um plugin (`configureVitest` + `onClose`, API pública) define exit 1 se nenhum teste passou ou falhou, independente de `--reporter`. Gate bootstrap-unit: `npm run test:unit` = 1 arquivo, 8 testes passando (tests/unit/infra.test.ts: alias @/, jsdom + jest-dom + cleanup, fetch não simulado rejeitado, storage limpo entre testes, restauração de relógio falso e fetch, fuso); `npm run test:unit -- -t FILTRO_INEXISTENTE` = 8 skipped, exit 1; `npm run test:integration` sem testes = exit 1 (No test files found); `npm run test:coverage` gera json/lcov/html. `tsc --noEmit` OK; `eslint` nos arquivos novos sem achados (os 10 achados de produto de T2 permanecem). O teste de infraestrutura tem 8 casos em vez de 1 para provar o isolamento; não conta como cobertura funcional.

### T5: Configurar execução Playwright

**What**: Configurar servidor de build de produção na porta 3001, projetos funcionais/E2E/NF e browser/context isolado.
**Where**: `playwright.config.ts`
**Depends on**: T4
**Reuses**: FE-07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-03
**Status**: Done

**Done when**:

- [x] Smoke de carregamento executa em Chromium; API real exige URL isolada explícita; traces e storage state não são publicados com credenciais.
- [x] Resultado do gate bootstrap-functional registrado no commit avaliado; smoke executado e filtro inexistente rejeitado antes do commit.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: functional: 1 smoke de infraestrutura; API isolada é pré-condição dos casos reais.
**Gate**: bootstrap-functional — usar a linha correspondente em Gate Check Commands; não exigir a suíte de integração criada em T8.
**Commit**: `test: configure Playwright projects`

**Execution note**: 2026-11-04. `playwright.config.ts`: webServer `npm run build && npm run start -- --port 3001` (`reuseExistingServer: !process.env.CI`), baseURL http://localhost:3001, projetos `functional`, `e2e` e `nonfunctional` (Chromium, `trace: on-first-retry`, sem storageState, relatório html e test-results fora do git). Chromium instalado com `npx playwright install chromium` (@playwright/test 1.64.1). `.gitignore` ganhou playwright-report/, test-results/ e coverage/. Pré-condição E2E em `tests/support/e2e.ts`: sem `E2E_API_URL` ou apontando para a produção o teste FALHA com mensagem BLOQUEADO (não é skip). Guarda de API em `tests/support/api-guard.ts`: toda requisição à API de produção é abortada e reprova o teste. Gate bootstrap-functional: `npm run test:functional` = 1 teste (smoke: a página inicial carrega sem requisições à API), 1 passed; `npm run test:functional -- --grep INEXISTENTE` = 'No tests found', exit 1; `test:e2e` sem env = failed com BLOQUEADO (exit 1), com env de produção = BLOQUEADO, com `E2E_API_URL=http://localhost:4010` = 1 passed (apenas a pré-condição de configuração, não prova persistência nem isolamento); `test:nonfunctional` sem testes = exit 1. Guarda provada com um spec temporário (removido) que chamava a API e reprovava. `tsc --noEmit` OK; eslint nos arquivos novos sem achados. Achado preexistente, não afirmado no smoke: sem sessão a página inicial emite o erro não tratado 'Authentication required but no token found' (consulta de lembretes no mount; FE-03/FE-05). O E2E real contra a API isolada continua dependendo de o frontend aceitar a URL por ambiente (FE-06): hoje a URL é fixa em `src/app/utils/api.ts`.

### T6: Documentar os comandos e a preparação dos testes

**What**: Explicar fixtures, comandos, isolamento, pré-condições, tipos de testes e coleta sanitizada de evidências.
**Where**: `tests/README.md`
**Depends on**: T5
**Reuses**: FE-07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CI-01
**Status**: Done

**Done when**:

- [x] Cada comando Planned Commands aponta para script/configuração existente; nenhum comando inexistente é apresentado como disponível; registrar limpeza e falhas.
- [x] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; revisar comandos e links após T3/T4/T5.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs(test): describe reproducible test runs`

**Execution note**: 2026-11-04. Gate manual: cada comando de Planned Commands conferido contra `npm pkg get scripts.<nome>` (8/8 existem) e contra a configuração citada (eslint.config.mjs, vitest.config.mts, playwright.config.ts); links locais do README resolvem; nenhum comando inexistente é apresentado como disponível. Falhas registradas no README sem ocultar: `npm run lint` sai com 1 (10 achados preexistentes), `test:integration`/`test:regression` falham até haver testes de integração (T8), `test:coverage` ainda sem comparação de baseline (T32). Limitação documentada: E2E real depende de URL de API por ambiente (FE-06). Pastas vazias tests/integration e tests/nonfunctional ganharam .gitkeep para existirem em clone limpo. Execuções finais da fase: test:unit 8 passed; test:functional 1 passed; tsc OK; filtros inexistentes saem com código 1. Nenhum teste novo (documentação).

### T7: Caracterizar apiRequest com testes unitários

**What**: Testar o módulo HTTP real controlando somente Fetch, storage e navegação nas fronteiras.
**Where**: `tests/unit/api.test.ts`
**Depends on**: T6
**Reuses**: FE-07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-01
**Status**: Done

**Done when**:

- [x] Cobrir todos os UT de apiRequest do test-plan, incluindo headers, JSON/texto, auth opcional/obrigatória, status e erro em HTTP 200; expectativas são tabelas de entradas/saídas.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: todos os casos API do plano; mínimo 12 asserts de resultados em casos nomeados.
**Gate**: quick — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(api): cover HTTP contract outcomes`

### T8: Caracterizar sessão e proteção por integração

**What**: Montar AuthProvider, login e ProtectedRoute reais com router/rede controlados.
**Where**: `tests/integration/auth.test.tsx`
**Depends on**: T7
**Reuses**: FE-03/07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-01, TEST-02
**Status**: Done (FE-03 registrado como it.fails)

**Done when**:

- [x] Loading, restauração, login e logout atuais têm asserts; token inválido sem consulta remota permanece defeito FE-03, sem teste verde que o legitime.
- [x] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration: mínimo 6 cenários, incluindo UT-08, ausência de token e falha no perfil; teste unitário do nome acompanha a caracterização do AuthContext.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(auth): cover session integration`

### T9: Caracterizar SearchBar

**What**: Testar consultas, seleção e navegação do SearchBar com catálogo sintético fixo.
**Where**: `tests/unit/SearchBar.test.tsx`
**Depends on**: T8
**Reuses**: FE-07/10; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CODE-01, DEP-03, TEST-01
**Status**: Done

**Done when**:

- [x] Fixture com mais de dez correspondências, duplicados, acentos, espaços e consulta vazia prova ordem, limite e querystring; registrar capturas da baseline em 360/768/1440px antes de mudanças visuais.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: mínimo 8 cenários; assertar nomes/ordem/URL e condição de Cadastrar, sem espelhar filter no teste.
**Gate**: quick — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(search): characterize SearchBar`

### T10: Caracterizar CardBusca

**What**: Testar medicamento inicial, seleção, limpeza, dropdown e callback de BuscaMedicamento.
**Where**: `tests/unit/CardBusca.test.tsx`
**Depends on**: T9
**Reuses**: FE-07/10; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CODE-02, DEP-03, TEST-01
**Status**: Done

**Done when**:

- [x] Resultados e eventos esperados são explícitos; timer de callback é controlado; diferenças com SearchBar são preservadas.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: mínimo 7 cenários, incluindo callback assíncrono, seleção inicial e limpeza.
**Gate**: quick — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(search): characterize medication selector`

### T11: Caracterizar criação do tratamento

**What**: Integrar formulário, seleção, contextos e cliente real com relógio e respostas de rede controlados.
**Where**: `tests/integration/tratamento.test.tsx`
**Depends on**: T10
**Reuses**: FE-07/08; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-01, TEST-02
**Status**: Done (FE-08 e defeitos D-01 fuso/D-02 overflow de mês registrados como it.fails)

**Done when**:

- [x] Validar payloads e ordem POST remédio/doses, cálculo em data/fuso fixos e falha de cada etapa; falha parcial vira evidência de FE-08, não transação simulada.
- [x] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration: UT-12/13 e mínimo 6 cenários integrados; dados/horários esperados escritos como tabela, sem copiar o algoritmo.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(treatment): cover creation boundaries`

### T12: Caracterizar lembretes e confirmação de dose

**What**: Integrar provider, lista, filtros e confirmação com GET/PUT controlados e relógio fixo.
**Where**: `tests/integration/lembretes.test.tsx`
**Depends on**: T11
**Reuses**: FE-05/07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-01, TEST-02
**Status**: Done (4 cenários FE-05 registrados como it.fails)

**Done when**:

- [x] Verificar agora/fim do dia, filtros, PUT tomado e recarga; doses simultâneas/limpeza de timers ficam como achados FE-05 quando falharem, sem alterar lifecycle.
- [x] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration: UT-11 e mínimo 7 cenários integrados; timer cleanup no próprio teste, sem skip de falhas do produto.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(reminders): cover dose state integration`

### T13: Criar suíte funcional com API controlada

**What**: Exercitar o navegador real com respostas HTTP controladas para os fluxos suportados.
**Where**: `tests/functional/fluxo.spec.ts`
**Depends on**: T12
**Reuses**: FE-07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-03, DEP-03
**Status**: Done (52 testes; 3 test.fail: FE-03, FE-08, ACHADO-T13-01; snapshots win32)

**Done when**:

- [x] Login/logout, busca/seleção, criação/listagem/exclusão e confirmação têm asserts de UI e requests; estados de erro são exercitados; relatório declara mocks e não persistência real. Não há fluxo frontend de edição de medicamento nesta baseline.
- [x] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: functional: mínimo 8 cenários, mais snapshots determinísticos de rotas afetadas em 360/768/1440px.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(functional): cover browser flows with controlled API`

### T14: Atualizar grupo Next e configuração Next do ESLint

**What**: Selecionar patch/minor suportado de Next e eslint-config-next compatível, avaliando advisories e o PR de segurança existente.
**Where**: `package.json`
**Depends on**: T13
**Reuses**: FE-01; PR #53; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done

**Done when**:

- [x] Manifesto e lockfile consistentes; npm ci, lint, tipos, build e regressão passam; release notes e decisão registradas; sem merge do PR nesta tarefa.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration/functional: repetir os cenários já definidos; nenhuma exclusão ou atualização automática de snapshots.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): update compatible Next group`

**Execution note**: 2026-11-04. Next/eslint-config-next 16.3.6 → 16.4.5; instalação limpa, tipos, build e regressão aprovados; lint mantém os 10 achados preexistentes (exit 1), sem novos achados. Contagens: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais com 12 snapshots preservados. Decisão, fontes e gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md#t14--next-e-configuração-do-eslint).

### T15: Atualizar grupo React e suas tipagens

**What**: Atualizar React, React DOM e tipagens como uma família de peers compatível com o Next selecionado.
**Where**: `package.json`
**Depends on**: T14
**Reuses**: FE-01/07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done

**Done when**:

- [x] Peers resolvidos sem force; providers, inputs, hidratação e navegação mantêm o comportamento; lockfile acompanha o manifesto.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration/functional: sessão, formulários, busca, dose e capturas de regressão.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): update compatible React group`

**Execution note**: 2026-11-04. Decisão por pacote, fontes e resultado dos gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md). `npm ci`, tipos, build e regressão: exit 0; lint: exit 1, mesmos 10 achados preexistentes, sem aumento. Seleção preservada: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais, 12 snapshots.

### T16: Atualizar react-datepicker

**What**: Avaliar e atualizar react-datepicker com migração mínima compatível com os formulários atuais.
**Where**: `package.json`
**Depends on**: T15
**Reuses**: FE-01/07; PR #51; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done

**Done when**:

- [x] Seleção de datas, locale, formato enviado e limites atuais permanecem iguais; major só é aceita após leitura de migração e regressão.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: integration/functional: datas e tratamento; mínimo 3 cenários específicos de data.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): update datepicker compatibly`

**Execution note**: 2026-11-04. Decisão por pacote, fontes e resultado dos gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md). `npm ci`, tipos, build e regressão: exit 0; lint: exit 1, mesmos 10 achados preexistentes, sem aumento. Seleção preservada: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais, 12 snapshots.

### T17: Atualizar lucide-react

**What**: Avaliar lucide-react com inventário dos ícones usados e migração mínima.
**Where**: `package.json`
**Depends on**: T16
**Reuses**: FE-01/09; PR #50; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done — mantido/bloqueado: major exige escopo proprio

**Done when**:

- [x] Imports e ícones existentes preservam rótulos/layout; major é isolada e pode ser mantida/bloqueada se exigir redesign; lockfile acompanha.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: functional: capturas e controles das rotas que usam ícones, sem aceitar snapshots diferentes automaticamente.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): review icon library update`

**Execution note**: 2026-11-04. Decisão por pacote, fontes e resultado dos gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md). `npm ci`, tipos, build e regressão: exit 0; lint: exit 1, mesmos 10 achados preexistentes, sem aumento. Seleção preservada: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais, 12 snapshots.

### T18: Revisar react-input-mask e sua tipagem

**What**: Verificar compatibilidade do pacote de máscara e @types/react-input-mask com React selecionado, atualizando apenas versões compatíveis.
**Where**: `package.json`
**Depends on**: T17
**Reuses**: FE-01/07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done — mantido/bloqueado: latest sem uso; compatibilidade React 19 exige escopo proprio

**Done when**:

- [x] Máscara e payloads permanecem; incompatibilidade gera bloqueio e proposta separada, sem trocar biblioteca por conta própria.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: integration: mínimo 3 casos de máscara/digitação/valor enviado; não usar any para ocultar incompatibilidade.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): review input mask compatibility`

**Execution note**: 2026-11-04. Decisão por pacote, fontes e resultado dos gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md). `npm ci`, tipos, build e regressão: exit 0; lint: exit 1, mesmos 10 achados preexistentes, sem aumento. Seleção preservada: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais, 12 snapshots.

### T19: Atualizar PapaParse e sua tipagem

**What**: Atualizar PapaParse/@types/papaparse preservando configuração do parser e cabeçalhos do catálogo.
**Where**: `package.json`
**Depends on**: T18
**Reuses**: FE-01/10; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done — mantido: pacotes ja no latest

**Done when**:

- [x] Headers acentuados, linhas vazias, aspas e ordem preservados; nenhuma edição de conteúdo do catálogo como parte da atualização.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration: fixture de parser e cenários T9/T10; mínimo 3 casos CSV específicos.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): update CSV parser compatibly`

**Execution note**: 2026-11-04. Decisão por pacote, fontes e resultado dos gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md). `npm ci`, tipos, build e regressão: exit 0; lint: exit 1, mesmos 10 achados preexistentes, sem aumento. Seleção preservada: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais, 12 snapshots.

### T20: Atualizar TypeScript

**What**: Avaliar TypeScript contra Next, configuração bundler e ferramentas de testes; manter versão compatível quando major exigir outro escopo.
**Where**: `package.json`
**Depends on**: T19
**Reuses**: FE-01; PR #52; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Done

**Done when**:

- [x] npx tsc --noEmit passa; strict/noEmit permanecem; nenhuma tipagem relaxada para contornar erro; decisão de atualizar/manter/bloquear documentada.
- [x] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, compilador; typecheck, build e regressão completa como gate.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps-dev): review TypeScript compatibility`

**Execution note**: 2026-11-04. Decisão por pacote, fontes e resultado dos gates em [dependency-updates.md](../../evidencias/2026-11-04/dependency-updates.md). `npm ci`, tipos, build e regressão: exit 0; lint: exit 1, mesmos 10 achados preexistentes, sem aumento. Seleção preservada: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais, 12 snapshots.

### T21: Atualizar grupo Tailwind e PostCSS

**What**: Avaliar Tailwind e @tailwindcss/postcss como família com build e tokens atuais.
**Where**: `package.json`
**Depends on**: T20
**Reuses**: FE-01/09; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Pending

**Done when**:

- [ ] CSS, fontes e utilitários seguem iguais nos viewports do plano; nenhuma migração de tema ou reestilização implícita.
- [ ] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: functional: capturas de login/busca/formulário/lembretes antes/depois; revisão das diferenças com fonte de estilos.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps): update styling toolchain compatibly`

### T22: Revisar ESLint e tipagens do runtime

**What**: Revisar ESLint/@eslint/eslintrc e @types/node contra a configuração e o Node escolhido, com decisão por pacote.
**Where**: `package.json`
**Depends on**: T21
**Reuses**: FE-01; PR #48/#49; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DEP-02, DEP-03
**Status**: Pending

**Done when**:

- [ ] Não elevar tipos Node acima do runtime por seguir latest; regras mantidas; mudanças de major incompatíveis registradas como bloqueadas; manifesto/lockfile consistentes.
- [ ] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, configuração; lint, tipos, build e regressão após resolução dos peers.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `chore(deps-dev): align lint and runtime types`

### T23: Reduzir normalização repetida em SearchBar

**What**: Calcular a consulta em minúsculas uma vez por filtragem, sem alterar query original, estados ou algoritmo de correspondência.
**Where**: `src/app/components/SearchBar/SearchBar.tsx`
**Depends on**: T22
**Reuses**: FE-10; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CODE-01
**Status**: Done (ganho de 6–15% na mediana; ver benchmark-busca.md)

**Done when**:

- [x] Todos os cenários T9 passam sem alterar expectativas; arrays/ordem e captura permanecem iguais; benchmark antes/depois demonstra benefício ou a otimização é descartada.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: atualizar no mesmo commit os testes de equivalência de T9; incluir entradas que divergiriam com trim/accent folding.
**Gate**: quick — usar a linha correspondente em Gate Check Commands.
**Commit**: `perf(search): avoid repeated query normalization`

### T24: Reduzir normalização repetida em CardBusca

**What**: Aplicar a mesma redução local de trabalho preservando seleção, medicamentoInicial e callback assíncrono.
**Where**: `src/app/components/CardBusca/cardBusca.tsx`
**Depends on**: T23
**Reuses**: FE-10; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CODE-02
**Status**: Done (ganho de 6–15% na mediana; ver benchmark-busca.md)

**Done when**:

- [x] Todos os cenários T10 passam sem alterar expectativas; nenhum debounce, cache, trim adicional, normalização de acentos ou alteração de onSelect.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: manter testes T10 no mesmo commit e medir antes/depois.
**Gate**: quick — usar a linha correspondente em Gate Check Commands.
**Commit**: `perf(search): reduce selector normalization work`

### T25: Retirar payload sensível do log de cadastro

**What**: Remover ou minimizar o log do payload sem mudar validação, request, mensagem ou navegação.
**Where**: `src/app/cadastro/page.tsx`
**Depends on**: T24
**Reuses**: FE-07/14; NF-WEB-04; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: SEC-01
**Status**: Done

**Done when**:

- [x] Sentinelas de senha/CPF/CEP/email não aparecem em nenhum método console exercitado; sucesso e falha mantêm payload e saída existentes.
- [x] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: integration: mínimo 3 casos cadastro válido, inválido e falha HTTP; spies verificam ausência das sentinelas.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `fix(logging): remove signup payload exposure`

### T26: Retirar corpo sensível dos logs HTTP

**What**: Remover conteúdo arbitrário do console de apiRequest mantendo o contrato de erro ao consumidor.
**Where**: `src/app/utils/api.ts`
**Depends on**: T25
**Reuses**: FE-07/14; NF-WEB-04; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: SEC-02
**Status**: Done

**Done when**:

- [x] Corpo JSON/texto e mensagens de HTTP 200 não vazam sentinelas no console; status, throw e tratamento de 401 são equivalentes à baseline.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit: mínimo 4 casos de erro com sentinelas; atualizar T7 junto com a alteração.
**Gate**: quick — usar a linha correspondente em Gate Check Commands.
**Commit**: `fix(logging): sanitize HTTP diagnostics`

### T27: Retirar dados de tratamento dos logs do alerta

**What**: Remover logs de horaInicio/data_dose/dataAlvo/delay sem alterar timers, contexto ou JSX.
**Where**: `src/app/components/AlarmeDose/AlertaLembrete.tsx`
**Depends on**: T26
**Reuses**: FE-05, apenas logs; FE-14; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: SEC-03
**Status**: Done

**Done when**:

- [x] Console não contém os dados sintéticos; instante do agendamento e gesto de confirmação permanecem iguais; defeitos FE-05 continuam visíveis.
- [x] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: integration: mínimo 2 cenários de agendamento com relógio controlado e spies; sem corrigir lifecycle nesta tarefa.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `fix(logging): remove treatment timing logs`

### T28: Avaliar acessibilidade e responsividade

**What**: Automatizar verificações de conteúdo/controles e registrar percurso manual por teclado, foco, leitor de tela e contraste.
**Where**: `tests/nonfunctional/acessibilidade.spec.ts`
**Depends on**: T27
**Reuses**: FE-09/14; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: NF-01
**Status**: Pending

**Done when**:

- [ ] Relatório contém 360/768/1440px, casos e evidências; achado não é convertido em sucesso; correção visual/gestual requer escopo FE-09.
- [ ] Resultado do gate nf registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: nonfunctional: mínimo 3 larguras no login/busca/tratamento/lembretes; revisão manual é evidência adicional obrigatória.
**Gate**: nf — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(a11y): record responsive and keyboard findings`

### T29: Medir busca e desempenho de rotas

**What**: Implementar coleta reproduzível do benchmark de busca e baseline de carga/bundle/performance de rotas.
**Where**: `tests/nonfunctional/performance.spec.ts`
**Depends on**: T28
**Reuses**: FE-10/14; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: NF-02
**Status**: Pending

**Done when**:

- [ ] Dez consultas após carga têm amostras, p95 nearest-rank, duração de carga/hash/tamanho do CSV e ambiente; comparar antes/depois; registrar meta p95<500ms como proposta preexistente.
- [ ] Resultado do gate nf registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: nonfunctional: 10 consultas fixas em pelo menos 3 rodadas iguais antes/depois; não afirmar ganho por bundle ou uma medição isolada.
**Gate**: nf — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(perf): measure search and route baseline`

### T30: Avaliar exposição de dados e dependências

**What**: Inspecionar console/network/storage com sentinelas sintéticas e registrar npm audit do lockfile.
**Where**: `tests/nonfunctional/seguranca.spec.ts`
**Depends on**: T29
**Reuses**: FE-14; NF-WEB-04; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: NF-03
**Status**: Pending

**Done when**:

- [ ] Logs não expõem sentinelas dos fluxos corrigidos; token em storage continua limitação explícita; auditoria indisponível é bloqueio, não zero vulnerabilidades.
- [ ] Resultado do gate nf registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: nonfunctional: mínimo 4 cenários de logging/erro/sessão; registrar auditoria direta/transitiva separadamente.
**Gate**: nf — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(security): record data exposure evidence`

### T31: Executar experimento de capacidade do frontend

**What**: Medir navegador local com volumes declarados de registros, conforme NF-SCALE-01; API mockada identificada.
**Where**: `docs/evidencias/<execucao>/scale.json`
**Depends on**: T30
**Reuses**: FE-12/14; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: NF-04
**Status**: Pending

**Done when**:

- [ ] Registrar volume, amostras, mediana/máximo, duração, erros, CPU/memória disponíveis e limitações; concorrência multiusuário e cloud permanecem NÃO COMPROVADAS sem experimento próprio.
- [ ] Resultado do gate nf registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: nonfunctional: datasets locais de 10/100/1000 registros, cinco execuções por volume, conforme NF-SCALE-01; medir mediana/máximo; não chamar API de produção.
**Gate**: nf — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(scale): record frontend capacity experiment`

### T32: Configurar coleta e proteção de cobertura

**What**: Gerar relatórios JSON/LCOV/HTML das suítes unitária e integração sobre src e comparar as quatro métricas com baseline versionada.
**Where**: `vitest.config.mts`
**Depends on**: T31
**Reuses**: FE-07/14; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-06
**Status**: Done (baseline 60,41% linhas; ver coverage-baseline.md)

**Done when**:

- [x] Linhas/branches/funções/statements têm cobertos/total; incluir arquivos não testados; exclusões justificadas por arquivo; nenhum percentual diminui para o mesmo escopo e ambiente.
- [x] Resultado do gate quick registrado no commit avaliado; falha/bloqueio permanece visível.
- [x] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: unit/integration: testes de produto existentes mais verificação de que fonte não exercitada aparece no denominador; não escolher percentual arbitrário.
**Gate**: coverage — usar a linha correspondente em Gate Check Commands; unitários e integração instrumentados, não apenas test:unit.
**Commit**: `test(coverage): report full source coverage baseline`

### T33: Configurar pipeline de qualidade por commit

**What**: Adicionar CI de instalação, lint, tipos, build, suítes e coverage, com E2E real somente em ambiente isolado preparado.
**Where**: `.github/workflows/quality.yml`
**Depends on**: T32
**Reuses**: FE-07; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CI-01
**Status**: Parcial — workflow criado e validado localmente; execução no GitHub NÃO comprovada (sem push)

**Done when**:

- [ ] Falha controlada e seleção vazia falham o job; cobertura/relatórios sanitizados publicados; E2E não executado é visível como bloqueio e não aprovação do fluxo real.
- [ ] Resultado do gate build registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: integration/functional: validar workflow em branch de teste após autorização remota; revisão local não é execução GitHub comprovada.
**Gate**: build — usar a linha correspondente em Gate Check Commands.
**Commit**: `ci: enforce frontend quality gates`

### T34: Documentar a descrição da solução

**What**: Descrever problema atendido, perfis, fluxo principal, capacidades e limitações com estado atual versus planejado.
**Where**: `docs/SOLUCAO.md`
**Depends on**: T33
**Reuses**: Pedido; FE-15; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-01
**Status**: Pending

**Done when**:

- [ ] Histórico simulado, sessão local, alertas em primeiro plano e contratos ausentes têm indicação clara e links às issues.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; revisão contra fontes do código e fluxos verificados.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: describe solution and current limits`

### T35: Documentar arquitetura do sistema

**What**: Publicar diagramas de composição, fronteiras e sequência real de login/tratamento/dose com referências de código.
**Where**: `docs/ARQUITETURA.md`
**Depends on**: T34
**Reuses**: Pedido; FE-06/12; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-02
**Status**: Pending

**Done when**:

- [ ] Distinguir App Router/cliente/API, storage, CSV e chamadas diretas; não representar cliente central ou ambiente configurável como já concluído.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; conferir diagramas com design.md e código do commit final.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: describe current system architecture`

### T36: Documentar organização do repositório

**What**: Mapear src/app, components, contexts, utils, public, tests, configurações, docs e evidências.
**Where**: `docs/ORGANIZACAO_REPOSITORIO.md`
**Depends on**: T35
**Reuses**: Pedido; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-03
**Status**: Pending

**Done when**:

- [ ] Cada diretório e comando citado existe no commit documentado; testes separados por finalidade, sem renomear estrutura da aplicação.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; conferir árvore e links locais.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: map frontend repository organization`

### T37: Documentar tecnologias e ambiente reproduzível

**What**: Publicar finalidade, versões declaradas/resolvidas, runtime verificado e ferramentas de testes adotadas.
**Where**: `docs/TECNOLOGIAS.md`
**Depends on**: T36
**Reuses**: Pedido; FE-01; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-04
**Status**: Pending

**Done when**:

- [ ] Versões derivam do manifesto/lockfile final; Next15 histórico não é versão atual; framework de teste proposto só vira instalado após tarefa correspondente.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; comparar com inventário e comandos reais.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: record frontend technologies`

### T38: Documentar evidências e limites de escala

**What**: Relacionar experimentos a recursos de frontend, cache/CSV/runtime e dependências da API.
**Where**: `docs/ESCALABILIDADE.md`
**Depends on**: T37
**Reuses**: Pedido; FE-12/13/14; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-05
**Status**: Pending

**Done when**:

- [ ] Cada alegação aponta para artefato, método e commit ou NÃO COMPROVADO; separar proposta CDN/réplicas de operação real; não inferir escala do banco pelo frontend.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; revisar escala local e bloqueios externos do experimento T31.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: report scalability evidence and limits`

### T39: Atualizar relatório de qualidade e cobertura

**What**: Acrescentar rodada nova sem apagar a evidência histórica, consolidando resultados e cobertura das quatro métricas.
**Where**: `docs/RELATORIO_QUALIDADE.md`
**Depends on**: T38
**Reuses**: Pedido; FE-14/15; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: DOC-06
**Status**: Pending

**Done when**:

- [ ] Cada caso tem aprovado/reprovado/bloqueado, evidência e commit; cobertura não executada fica NÃO MEDIDA; defeitos conhecidos e riscos residuais são explícitos.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documento de evidências; validar denominadores/LCOV/JSON e reconciliação issue-commit-teste.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: publish measured quality and coverage report`

### T40: Atualizar o índice da documentação

**What**: Vincular docs finais, plano e evidências a partir do índice sem remover o histórico.
**Where**: `docs/README.md`
**Depends on**: T39
**Reuses**: Pedido; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: CI-01, DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06
**Status**: Pending

**Done when**:

- [ ] Todos os links locais resolvem; distinguir specs Draft de entregas executadas; orientações de reprodução e limitações acessíveis.
- [ ] Resultado do gate manual registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: none, documentação; revisão de links e navegação do índice.
**Gate**: manual — usar a linha correspondente em Gate Check Commands.
**Commit**: `docs: link project documentation and evidence`

### T41: Criar protocolo e suíte E2E da API isolada

**What**: Exercitar contas sintéticas A/B sem interceptar os endpoints cuja persistência é verificada.
**Where**: `tests/e2e/fluxo-real.spec.ts`
**Depends on**: T40
**Reuses**: FE-02/03/04/05/08/15 e API isolada; contratos atuais de `design.md` e cenários de `test-plan.md`.
**Requirement**: TEST-04
**Status**: Pending

**Done when**:

- [ ] Casos reais cobrem persistência/reload e isolamento; ausência de ambiente gera falha de pré-condição e registro BLOQUEADO; defeitos conhecidos não recebem skip nem resultado aprovado.
- [ ] Resultado do gate full registrado no commit avaliado; falha/bloqueio permanece visível.
- [ ] Contagem e nomes dos testes informados quando aplicável, sem redução, skip ou relaxamento de assertivas para aprovar a tarefa.

**Tests**: e2e: mínimo 5 cenários preparados; execução depende de ambiente e correções externas; falhas documentadas impedem aceite do MVP.
**Gate**: full — usar a linha correspondente em Gate Check Commands.
**Commit**: `test(e2e): define isolated API acceptance flow`

## Checks

As 23 provas abaixo são **planejadas e não executadas**. Comandos de suítes serão criados nas tarefas; títulos dos testes recebem o ID do critério. Não há pass marker fabricado. Provas manuais exigem registro objetivo de revisão; as demais serão selecionadas por comando que falhe com zero testes. O Verifier deve questionar o poder de detecção das assertivas, não apenas a saída verde.

**C1** - Inventário identifica todos os pacotes diretos com origem, destino e decisão (DEP-01, AC 1).
Proof: walk - revisar dependencies.json contra package.json, lockfile e fonte datada da consulta.

**C2** - Lockfile permite instalação limpa sem forçar peers (DEP-02, AC 2).
Proof: `npm ci --no-fund`

**C3** - Atualizações preservam contratos e estados visuais da regressão (DEP-03, AC 3).
Proof: `npm run test:regression`

**C4** - SearchBar mantém resultados, ordem, dez sugestões e URL codificada (CODE-01, AC 1).
Proof: `npm run test:unit -- tests/unit/SearchBar.test.tsx -t CODE-01`

**C5** - CardBusca mantém seleção, limpeza e callback assíncrono (CODE-02, AC 2).
Proof: `npm run test:unit -- tests/unit/CardBusca.test.tsx -t CODE-02`

**C6** - Cadastro não imprime as quatro sentinelas pessoais (SEC-01, AC 1).
Proof: `npm run test:integration -- -t SEC-01`

**C7** - Cliente HTTP não imprime corpo sensível e mantém resultado de erro (SEC-02, AC 2).
Proof: `npm run test:unit -- tests/unit/api.test.ts -t SEC-02`

**C8** - Alerta não imprime dados da dose e mantém o agendamento (SEC-03, AC 3).
Proof: `npm run test:integration -- -t SEC-03`

**C9** - Cada caso UT do plano corresponde a um teste de resultado (TEST-01, AC 1).
Proof: `npm run test:unit`

**C10** - Cada caso IT do plano corresponde a um teste entre módulos reais (TEST-02, AC 2).
Proof: `npm run test:integration`

**C11** - Fluxos funcionais são executados e identificados como mocks (TEST-03, AC 3).
Proof: `npm run test:functional -- --grep TEST-03`

**C12** - E2E indisponível tem causa e dependência, sem falsa aprovação (TEST-04, AC 4).
Proof: walk - conferir pré-condições, saída da suíte real e registro de todos os casos E2E; conferir BLOQUEADO ou evidência real por caso.

**C13** - Avaliação registra teclado, foco, nomes, contraste e três larguras (NF-01, AC 1).
Proof: walk - conferir relatório NF-WEB-01, execuções automatizadas e protocolo manual nos três viewports.

**C14** - Benchmark contém dez amostras, método de p95 e comparação (NF-02, AC 2).
Proof: `npm run test:nonfunctional -- --grep NF-02`

**C15** - Inspeção identifica exposição e auditoria com evidências sanitizadas (NF-03, AC 3).
Proof: walk - revisar NF-WEB-04, sentinelas, storage/network e audit JSON; indisponibilidade ou achado não é zero vulnerabilidades.

**C16** - Experimento identifica carga, erros e limites frontend/API (NF-04, AC 4).
Proof: walk - reproduzir protocolo NF-SCALE-01 e conferir scale.json, logs e ambiente.

**C17** - Solução distingue capacidades e limitações (DOC-01, AC 1).
Proof: walk - revisar docs/SOLUCAO.md contra código, issues e resultados do commit.

**C18** - Diagrama representa as fronteiras efetivas da aplicação (DOC-02, AC 2).
Proof: walk - revisar docs/ARQUITETURA.md contra layout, páginas, contextos e chamadas de rede.

**C19** - Mapa do repositório corresponde aos diretórios existentes (DOC-03, AC 3).
Proof: walk - conferir docs/ORGANIZACAO_REPOSITORIO.md e todos os caminhos citados.

**C20** - Tecnologias e runtime correspondem ao manifesto e lockfile finais (DOC-04, AC 4).
Proof: walk - confrontar docs/TECNOLOGIAS.md com manifesto, lockfile e logs do ambiente.

**C21** - Toda alegação de escala tem prova ou NÃO COMPROVADO (DOC-05, AC 5).
Proof: walk - revisar docs/ESCALABILIDADE.md e rastrear cada alegação ao experimento.

**C22** - Cobertura tem quatro métricas, denominadores e escopo ou NÃO MEDIDA (DOC-06, AC 6).
Proof: walk - comparar relatório de qualidade com JSON/LCOV/HTML e configuração de inclusão/exclusão.

**C23** - Job falha com erro obrigatório e seleção vazia (CI-01, AC 1).
Proof: walk - executar experimento controlado de falha e filtro inexistente; registrar comandos, saídas não zero e job; revisão de YAML sozinha não comprova CI.

## Review Rules

A matriz de casos em `test-plan.md` estabelece a profundidade; mínimos de cenários nas tarefas são piso, não substituem cobertura de cada caso. Em C9/C10, a revisão compara nomes/IDs do plano com a saída verbose e examina as assertivas; saída geral verde não comprova esse mapeamento sozinha. Em C3, a revisão também confere diferenças visuais e requests, sem aceitar snapshots por atualização automática.

A implementação usa a skill: gate por tarefa, commit atômico e checks finais. Depois da última tarefa, executar `check_proofs.py`, verificação independente com `validate.md` da skill e `validate_verification.py`. Capturas produzidas durante a execução são julgadas contra a baseline declarada. Esta entrega documental não tem HEAD implementado, `proofs.md` ou aprovação funcional.

## Handoff

**Settled mid-build:** somente a escolha de ferramentas registrada em `context.md`; não houve build/implementação.
**Dispatched:** análises de arquitetura/qualidade e autoria documental auxiliares retornaram; nenhum batch de implementação foi despachado. Revisão independente do pacote documental será registrada em `validation.md`.
**Walked:** nenhum fluxo da aplicação executado nesta rodada; revisão de código/documentação não é UAT.
**Next:** revisão humana do spec; depois aprovação separada das tarefas se houver intenção de implementar.
**External blockers:** FE-02/03/04/05/08 e ambiente isolado para aceite integrado; FE-06/12/13 para comprovação cloud. Os números BE/MO referem-se a planejamento externo, sem presumir conclusão.
