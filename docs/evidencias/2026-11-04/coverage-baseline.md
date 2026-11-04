# Baseline de cobertura (T32, DOC-06)

Data: 2026-11-04 (America/Sao_Paulo). Commit base: `be6a81f` com alterações não commitadas no working tree no momento da medição (a baseline foi medida sobre o working tree desta tarefa; recomenda-se remedir após o commit e confirmar que os números não mudam).
Ambiente: Windows 11, Node v26.8.1, npm 11.19.0, Vitest 5.1 + `@vitest/coverage-v8`, jsdom.
Comando: `npm run test:coverage` (`vitest run tests/unit tests/integration --coverage --reporter=verbose`), saída 0.
Execução: 10 arquivos de teste, 203 passed | 8 expected fail (211). Os 8 `expected fail` são os casos `[BLOQUEADO FE-xx]` (defeitos conhecidos, `it.fails`); não são aprovações do comportamento correto.

## Métricas (cobertos/total)

| Métrica | Cobertos/Total | Percentual |
| --- | --- | --- |
| Linhas | 577/955 | 60,41% |
| Branches | 329/597 | 55,10% |
| Funções | 114/184 | 61,95% |
| Statements | 583/973 | 59,91% |

Fonte dos números: `coverage/coverage-summary.json` (chave `total`). Baseline versionada: `tests/coverage-baseline.json` (métricas e lista dos 25 arquivos do escopo). Não há percentual mínimo arbitrário: o piso é a própria baseline.

## Escopo e exclusões

- Incluído: `src/**/*.{ts,tsx}`, instrumentado por V8 nas suítes unit e integration. `coverage.include` faz arquivos nunca importados entrarem no denominador.
- Excluído: somente `src/**/*.d.ts` (declarações de tipo, sem código executável). Justificativa em comentário em `vitest.config.mts`. Nenhuma página, componente, contexto ou util de produto é excluído.
- Relatórios gerados em `coverage/` (ignorado pelo git): `coverage-summary.json` (json-summary), `coverage-final.json` (json), `lcov.info` (lcov), `index.html` e `lcov-report/` (html).
- Playwright (functional/e2e) não entra nesta cobertura.

## Prova de que fonte não exercitada está no denominador

`src/app/Configuracoes/ConfiguracoesContent.tsx` não é importado por nenhum teste de unit ou integration e aparece no relatório com 0%:

- `coverage-summary.json`: linhas 0/150 (0%).
- `lcov.info`: `SF:src\app\Configuracoes\ConfiguracoesContent.tsx`, `FNF:17 FNH:0`, `LF:150 LH:0`, `BRF:90 BRH:0`.

Outros com 0%: `layout.tsx` (0/4), `page.tsx` (0/21), `historico/HistoricoContent.tsx` (0/85), `meus-medicamentos/MeusMedicamentosContent.tsx` (0/42), `contexts/SidebarContext.tsx` (0/12), `components/Sidebar/sidebar.tsx` (0/9), além das `page.tsx` de Configuracoes, historico, meus-lembretes e meus-medicamentos. Somados, esses arquivos têm 331 linhas no denominador de 955 (35%); sem `include`, ficariam fora e a cobertura pareceria bem maior.

## Proteção contra queda (`scripts/check-coverage.mjs`)

`node scripts/check-coverage.mjs` compara `coverage/coverage-summary.json` com `tests/coverage-baseline.json`. Sai 1 se qualquer das quatro métricas tiver fração covered/total menor que a da baseline (comparação exata por produto cruzado, sem tolerância), se um arquivo da baseline sumir do relatório (escopo reduzido), se o arquivo estiver ausente/inválido ou se o denominador for 0. Arquivos novos entram no denominador (avisados). Melhoria é informada; atualizar a baseline para cima é decisão revisada.

Resultado contra a baseline (saída 0):

```text
linhas     baseline 577/955 (60.41%)  atual 577/955 (60.41%)  igual
branches   baseline 329/597 (55.10%)  atual 329/597 (55.10%)  igual
funções    baseline 114/184 (61.95%)  atual 114/184 (61.95%)  igual
statements baseline 583/973 (59.91%)  atual 583/973 (59.91%)  igual
OK: nenhuma métrica ficou abaixo da baseline.
```

Experimento controlado de falha: `branches.covered` da baseline foi inflado temporariamente de 329 para 330 (saída 1); a baseline foi restaurada em seguida (diff idêntico, saída 0 novamente):

```text
branches   baseline 330/597 (55.27%)  atual 329/597 (55.10%)  QUEDA
FALHA: a cobertura diminuiu em relação à baseline (ou o escopo/dado é inválido).
EXIT_INFLADA=1
```

Segundo experimento: baseline com um arquivo inexistente na lista falha com `arquivos da baseline ausentes da cobertura atual (escopo reduzido)` (saída 1).

## Limitações e pendências

- Percentuais valem para o mesmo escopo e ambiente (Node v26.8.1, Windows). Se o CI (Node 22/24, Linux) produzir contagens diferentes por diferença de versão do V8, será necessário registrar baseline por ambiente; isso ainda não foi observado (execução no GitHub não comprovada).
- A cobertura mede execução de linhas, não correção: testes `[BLOQUEADO FE-xx]` com `it.fails` exercitam código sem aprovar o comportamento.
- Gate de cobertura em CI: ver `.github/workflows/quality.yml` (T33), não executado no GitHub.
