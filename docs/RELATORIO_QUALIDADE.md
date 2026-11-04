# Relatório de qualidade — validação inicial

> Correção posterior dos checks: [CI, lint e estabilidade das capturas](evidencias/2026-11-04/ci-corrections.md). O lint foi corrigido sem desativar regras; 321 testes Vitest foram aprovados e os 53 funcionais atenderam às expectativas. As falhas esperadas conhecidas continuam explicitadas no registro. A descrição de sete erros de lint abaixo pertence à rodada anterior.

> Atualização final de 04/11/2026: [consolidação da execução](evidencias/2026-11-04/execution-final.md). O texto de outubro e a coleta intermediária abaixo permanecem históricos. Resultado final: 316 testes Vitest aprovados e 4 falhas esperadas conhecidas; 53 funcionais (incluindo 1 falha esperada), 10 NF, 11 E2E e 4 CORS reais atenderam às expectativas. Cobertura final: linhas 790/1016 (77,75%), branches 589/798 (73,80%), funções 169/213 (79,34%) e statements 833/1082 (76,98%). Lint continua reprovado por 7 erros e 2 avisos preexistentes; audit conserva 8 entradas moderate e 1 high. A comparação histórica e o parsing no Chromium foram concluídos. Aceite global ainda depende da revisão manual de acessibilidade, do CI remoto e dos defeitos FE-03/FE-05 explicitados no registro final.

Data: 01/10/2026, America/Sao_Paulo. Baseline: ffd8893b423879194e512f65de8db7de099d2b06. Windows, Node v24.21.0, npm 11.19.0.

## Resultados executados

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| npm ci --no-audit --no-fund | APROVADO: 331 pacotes instalados | [Registro](evidencias/2026-10-01/README.md) |
| npm run build | APROVADO: compilação, tipos e geração de rotas | [Log](evidencias/2026-10-01/build.log) |
| npm run lint | APROVADO com 1 aviso | [Log](evidencias/2026-10-01/lint.log) |

Aviso: src/app/meus-lembretes/MeusLembretesContent.tsx:68 — useEffect sem dependência getLembretes. Vinculado a FE-05/07 para revisar atualização dos dados e regressão. O build reportou First Load JS compartilhado de 101 kB; isso é tamanho do artefato, não medição de desempenho no usuário.

## Diagnóstico funcional por inspeção

FE-02: histórico usa registros aleatórios e consulta /remedio sem autenticação. FE-03: token presente assume sessão válida. FE-04: senha/foto chamam endpoints ausentes. FE-05: alertas dependem de timers e página aberta, sem limpeza explícita no efeito. Essas observações não são resultados de E2E executado.

## Pendências e conclusão

Não há suíte de testes funcional própria. Cenários WEB-01 a WEB-09, acessibilidade, performance no navegador, carga e deploy/monitoramento estão PENDENTES. npm informou scripts de sharp/unrs-resolver não aprovados; build aprovado, runtime deve ser validado no ambiente final.

Frontend aprovado para compilação e lint com aviso; funcionalidade integrada e aceite do MVP ainda NÃO COMPROVADOS. A apresentação deve excluir dados simulados ou aguardar FE-02.

## Rodada de 04/11/2026 — manutenção e integração local

O conteúdo acima descreve 01/10/2026 e não é o diagnóstico atual. A rodada de novembro usa `84b5ae7` mais alterações de integração no working tree. Node v26.8.1, npm 11.19.0, Windows, Next 16.4.5, React 19.3.1; a lista final de versões está em [TECNOLOGIAS](TECNOLOGIAS.md). Nenhum push, deploy ou execução de CI remoto foi necessário para estas medições.

| Verificação | Resultado observado | Evidência / limite |
| --- | --- | --- |
| Instalação limpa | APROVADA com `npm ci` após integrar nove commits de dependências | [Decisões e gates](evidencias/2026-11-04/dependency-updates.md). Audit não ficou verde. |
| Build de produção | APROVADO na preparação dos testes NF, Next 16.4.5, todas as rotas geradas | `npx playwright test --project=nonfunctional --workers=1`, 04/11. Build não comprova fluxo real. |
| Tipos | APROVADO, sem diagnósticos na verificação local de 16:26 | `npx tsc --noEmit`; fontes em integração. |
| Lint global | REPROVADO: 7 erros e 2 avisos preexistentes, sem regras desativadas | Erros `set-state-in-effect`: CardBusca 2, SearchBar 2, CardCadastrar 1, novo-medicamento/page 1 e page 1. Avisos de imagem da sidebar e navegação relativa no cliente HTTP. Não chamar o gate build completo de verde. |
| Unitários e integração com coverage | 16 arquivos; 313 passaram e 4 expected fail (317), na coleta local de 16:26:58 | Os quatro expected fail descrevem defeitos e **não** aprovam o comportamento correto. Fontes ainda em integração; nova alteração exige revalidação pertinente. |
| Não funcionais | APROVADA a execução de 10 testes; acessibilidade e comparação completa de rotas permanecem parciais | [Métodos/achados](evidencias/2026-11-04/nonfunctional/README.md); 10 passaram, saída 0, 30,6 s. Após guarda adicional de rede, 3 testes perf/scale revalidados, saída 0. |
| Auditoria | REPROVADA: 9 entradas de pacotes afetados, 8 moderate e 1 high | [Resumo](evidencias/2026-11-04/nonfunctional/audit-summary.json); uma entrada direta de tooling, oito transitivas; não são nove advisories independentes. |
| Funcionais com API simulada | Última evidência anterior: 52 casos e 12 capturas preservadas na atualização de dependências | [Registro das dependências](evidencias/2026-11-04/dependency-updates.md). Integração subsequente muda contratos; essa evidência não aprova automaticamente o working tree final. |
| E2E API real | Não declarado aprovado por esta rodada NF | Pré-condições e resultado pertencem às [tarefas de integração](specs/integracao-backend/tasks.md). Mocks não provam persistência/autorização. |
| Pipeline GitHub | NÃO COMPROVADO | Workflow local existe, sem prova de execução remota nem experimento de falha do job. |

### Cobertura medida no working tree de 16:26:58

| Métrica | Cobertos / total | Percentual |
| --- | --- | --- |
| Linhas | 780 / 1006 | 77,53% |
| Branches | 584 / 792 | 73,73% |
| Funções | 166 / 210 | 79,04% |
| Statements | 820 / 1068 | 76,77% |

Fontes: `coverage/coverage-summary.json`, JSON por arquivo, HTML e LCOV gerados por `npm run test:coverage`. O escopo continua `src/**/*.{ts,tsx}` incluindo arquivos não exercitados; somente declarações `*.d.ts` sem runtime são excluídas. Playwright não entra no denominador. `node scripts/check-coverage.mjs` saiu 0: as quatro frações superaram a [baseline original](evidencias/2026-11-04/coverage-baseline.md), mantendo todos os caminhos originais. Os denominadores mudaram com a implementação; isso não autoriza reduzir o piso nem excluir arquivos. A baseline versionada não foi elevada automaticamente.

### Achados e aceite

A coleta DOM/teclado em 360/768/1440px identificou busca/botão sem nome acessível, campo sem foco visível e filtros sem label associado. [FE-09](https://github.com/MagalDevs/Front_MedReminder/issues/33) permanece pendente; leitor de tela, contraste, zoom e foco de modal não foram avaliados manualmente. Os testes coletam os achados, sem transformá-los em conformidade.

O experimento de 10/100/1000 medicamentos/doses contém cinco execuções por volume, amostras, mediana/máximo, heap disponível e erros em [scale.json](evidencias/2026-11-04/nonfunctional/scale.json). É evidência de um navegador local com API simulada. Concorrência, disponibilidade, capacidade de banco/API e cloud estão **NÃO COMPROVADAS**. O benchmark usa dez consultas e três rodadas; parsing browser isolado e comparação de rotas com build anterior estão pendentes. Nenhuma melhoria de rota ou Core Web Vitals é afirmada.

O working tree revisado passa a restaurar sessão por `/usuario/me`, ler histórico real de `/dose/me` e usar o contrato atômico de tratamento; os diagnósticos históricos de simulação e sessão presumida não descrevem essas alterações. A prova com API real e o fechamento de alertas/isolamento continuam condicionados aos testes correspondentes. Consulte a [solução](SOLUCAO.md) e a [arquitetura](ARQUITETURA.md). O aceite integrado permanece condicionado a E2E, lint, achados de acessibilidade e evidência remota; nenhum caso bloqueado foi contado como aprovado nesta documentação.
