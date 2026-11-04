# Frontend Quality and Maintenance Specification

**Status**: Draft
**Date**: 2026-11-04, America/Sao_Paulo.
**Baseline**: `43b05890d8a6cca1311969a6ca51a9f9decc2620`.
**Context**: [Decisões do usuário](context.md).

## Problem Statement

O frontend tem planos de evolução e 15 issues abertas, mas não tem suíte automatizada própria, medição de cobertura nem CI de qualidade. O manifesto atual usa Next.js 16.3.6, enquanto parte da documentação ainda descreve Next.js 15 e resultados de outro commit. A manutenção precisa de tarefas verificáveis que preservem regras e interface e produzam evidências de qualidade.

Este documento especifica trabalho futuro. A entrega solicitada agora é o pacote de planejamento em `docs`; nenhuma atualização, refatoração, implementação de testes ou operação remota faz parte desta rodada.

## Goals

- [ ] Atualizar dependências com versão de origem/destino, compatibilidade e regressão verificadas.
- [ ] Otimizar a busca e minimizar logs sensíveis sem alterar regras, contratos ou design.
- [ ] Planejar testes unitários, de integração, funcionais e não funcionais com resultados observáveis.
- [ ] Planejar documentação da solução, arquitetura, repositório, tecnologias, escalabilidade e qualidade com cobertura medida.
- [ ] Rastrear cada critério a tarefas, provas e issues existentes.

## Out of Scope

| Item | Reason |
| --- | --- |
| Executar as tarefas deste plano nesta rodada | O usuário pediu criação de specs e tarefas. |
| Histórico persistido, validação remota de sessão, contratos de senha/foto, recuperação de falha parcial e fila/cancelamento de alertas | São mudanças funcionais de FE-02/03/04/05/08. Recebem dependências e cenários de validação, sem serem introduzidas como otimizações. |
| Notificações com página fechada ou adiamento persistido | FE-11 exige novos contratos e decisões de produto. |
| Trocar localStorage por cookies, migrar framework, alterar banco/API ou refazer UI | Altera arquitetura ou contratos fora do escopo de manutenção sem mudança de lógica. |
| Alterar correspondência, ordenação, limite de sugestões, fuso ou cálculo das doses | Esses resultados devem permanecer iguais. |
| Debounce, cache compartilhado, novo retry e estabilização dos contextos que interfira nos timers | Mudam tempo de resposta, ciclo de vida ou chamadas; exigem especificação própria. |
| Deploy, merge, push, configuração de contas cloud e carga em produção | Não solicitados. Escala pode ser avaliada localmente; evidência cloud fica bloqueada sem ambiente autorizado. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Diretório do planejamento | `docs/specs/qualidade-e-manutencao/` | Pedido explícito; prevalece sobre `.specs/` da skill. | y |
| Ferramentas de testes | Vitest + React Testing Library; Playwright | Escolha expressa do usuário em `context.md`. | y |
| Referência visual | Componentes, CSS, fontes e assets atuais | Nenhuma captura ou arquivo de design foi enviado. Não se cria um novo layout. | y, fonte: código |
| Cobertura inicial | Não medida | Não existe suíte automatizada frontend; baseline histórico não contém coverage. | y, fonte: inspeção |
| Meta percentual de cobertura | Medir baseline e impedir regressão por métrica; cobrir todos os critérios do escopo | Nenhum percentual mínimo foi definido no projeto. Não declarar 80% ou outro número como requisito aprovado. | y, fonte: plano existente |
| Versões alvo | Resolver na execução a partir do registry, advisories oficiais e PRs existentes | A versão local não é uma recomendação de versão atual. | y, fonte: política de dependências |
| API real para integração | Instância isolada e dados sintéticos; bloquear quando indisponível | Plano de testes existente proíbe mutações em produção. | y, fonte: `tests/README.md` |

**Open questions:** none para este escopo de planejamento. Ambiente de E2E/cloud e decisões das issues funcionais são pré-condições explícitas, sem solução presumida. Aprovação do documento e das tarefas ainda não ocorreu.

## User Stories

### P1: Dependency Maintenance

**User Story**: Como mantenedor, quero atualizar dependências com instalação reproduzível e regressões controladas.

**Why P1**: Atualizações sem compatibilidade comprovada comprometem o restante do plano.

**Acceptance Criteria**:

1. WHEN uma rodada de atualização começar THEN o inventário SHALL registrar versão declarada, versão resolvida no lockfile, versão candidata consultada, data, motivo e decisão para cada dependência direta (DEP-01).
2. WHEN as dependências forem atualizadas THEN uma instalação limpa SHALL concluir com `npm ci` sem `--force` ou `--legacy-peer-deps` (DEP-02).
3. WHEN um grupo de dependências for atualizado THEN a regressão SHALL preservar os contratos HTTP, resultados de busca e estados visuais descritos em `design.md` e `test-plan.md` (DEP-03).

**Independent Test**: Reproduzir a instalação a partir do lockfile e executar os cenários de regressão no mesmo ambiente antes/depois. Revisar as migrações de major individualmente.

### P1: Code Optimization

**User Story**: Como usuário, quero a mesma busca de medicamentos com menor trabalho repetido.

**Why P1**: Otimização só é aceita com equivalência observável.

**Acceptance Criteria**:

1. WHEN uma consulta for digitada em SearchBar THEN a busca SHALL manter substring case insensitive, ordem do CSV, no máximo dez sugestões e a navegação com medicamento codificado da baseline (CODE-01).
2. WHEN um medicamento for selecionado ou a consulta for apagada em CardBusca THEN o componente SHALL preservar o medicamento emitido, o fechamento do dropdown e o instante de callback assíncrono definidos pela baseline (CODE-02).

**Independent Test**: Comparar arrays e eventos esperados em fixtures com duplicados, acentos, espaços, consulta vazia e mais de dez correspondências. Medir o mesmo dataset e as mesmas consultas antes/depois; descartar a otimização se não houver benefício demonstrado.

### P1: Sensitive Logging

**User Story**: Como usuário, quero que os fluxos existentes não exponham meus dados em logs.

**Why P1**: O cadastro imprime o payload com senha e dados pessoais; outras rotinas imprimem corpos de erro e horários de tratamento.

**Acceptance Criteria**:

1. WHEN o cadastro for enviado THEN o console SHALL conter zero ocorrências dos valores sintéticos de senha, CPF, CEP e email enviados no formulário (SEC-01).
2. IF uma resposta HTTP contiver um corpo com dados sensíveis THEN os logs de `apiRequest` SHALL conter zero ocorrências desses valores, mantendo a mensagem lançada e o tratamento de status atuais (SEC-02).
3. WHEN um alerta for agendado THEN os logs do alerta SHALL conter zero ocorrências de dados da dose ou do tratamento, mantendo o agendamento e os gestos atuais (SEC-03).

**Independent Test**: Usar spies de todos os métodos de console e sentinelas sintéticas, com restauração após cada caso. Comparar requisições e resultados de sucesso/falha com a baseline.

### P1: Automated Tests

**User Story**: Como mantenedor, quero distinguir testes isolados de comprovação do fluxo com API real.

**Why P1**: Build e lint não verificam o comportamento do usuário.

**Acceptance Criteria**:

1. WHEN a suíte unitária for executada THEN o relatório SHALL associar ao menos um teste de resultado observável a cada caso UT de `test-plan.md` (TEST-01).
2. WHEN a suíte de integração for executada THEN o relatório SHALL associar ao menos um teste de interação entre módulos a cada caso IT de `test-plan.md` (TEST-02).
3. WHEN a suíte funcional com API simulada for executada THEN o relatório SHALL identificar os casos FN como execução com mocks, sem apresentá-los como persistência real (TEST-03).
4. IF o ambiente ou um contrato necessário ao E2E real estiver indisponível THEN o registro SHALL marcar o caso E2E como BLOQUEADO com dependência e motivo, sem registrá-lo como aprovado (TEST-04).

**Independent Test**: Rodar cada suíte pelo seu comando. No E2E real, executar cadastro/login, busca/tratamento, confirmação/reload e isolamento A/B somente na API isolada. Os defeitos de FE-02/03/04/05/08 continuam reprovados ou bloqueados até sua correção em escopo próprio.

### P1: Nonfunctional Evidence

**User Story**: Como responsável pela qualidade, quero medir acessibilidade, desempenho, segurança e limites de escala com método reproduzível.

**Why P1**: Não há comprovação atual dessas propriedades.

**Acceptance Criteria**:

1. WHEN a avaliação de acessibilidade for executada THEN o registro SHALL descrever teclado, foco, nomes acessíveis, contraste e perda de conteúdo nas larguras de 360, 768 e 1440 pixels (NF-01).
2. WHEN a busca for medida THEN o relatório SHALL registrar dez consultas após carga, amostras individuais, método de p95, ambiente, tamanho/hash do CSV e comparação antes/depois (NF-02).
3. WHEN a inspeção de segurança for executada THEN o relatório SHALL registrar achados de logs, network, storage e auditoria de dependências com evidências sanitizadas (NF-03).
4. WHEN um experimento de escala for executado THEN o relatório SHALL registrar carga, duração, ambiente, latência, erros e gargalos, distinguindo recursos do frontend de limites da API (NF-04).

**Independent Test**: Reproduzir NF-WEB-01 a NF-WEB-04 e NF-SCALE-01 conforme `test-plan.md`. A meta inicial de busca p95 < 500 ms vem do plano existente e permanece identificada como proposta. Não há SLO de carga aprovado nem alegação de escala cloud sem medição.

### P1: Project Documentation

**User Story**: Como integrante da equipe, quero entender a solução e avaliar sua qualidade com fontes atuais.

**Why P1**: A documentação deve sustentar manutenção, revisão e apresentação sem converter propostas em fatos.

**Acceptance Criteria**:

1. WHEN a descrição da solução for publicada THEN o documento SHALL distinguir capacidades atuais, usuários atendidos e limitações funcionais com links para as issues correspondentes (DOC-01).
2. WHEN a arquitetura for documentada THEN o diagrama SHALL representar App Router, providers, cliente HTTP, chamadas diretas, API e catálogo conforme o código do commit informado (DOC-02).
3. WHEN a organização do repositório for documentada THEN o mapa SHALL relacionar os diretórios existentes e o local dos testes, configurações e evidências (DOC-03).
4. WHEN as tecnologias forem documentadas THEN o inventário SHALL separar versões do manifesto e lockfile, finalidade e requisito de runtime verificado de cada grupo (DOC-04).
5. WHEN as evidências de escalabilidade forem publicadas THEN cada alegação SHALL apontar para um experimento reproduzível ou indicar expressamente NÃO COMPROVADO (DOC-05).
6. WHEN o relatório de qualidade for publicado THEN a cobertura SHALL informar linhas, branches, funções e statements, com denominadores, arquivos incluídos/excluídos, commit e comando, ou NÃO MEDIDA quando não houver execução válida (DOC-06).

**Independent Test**: Navegar a documentação a partir de `docs/README.md`; conferir os arquivos citados e reproduzir os comandos em ambiente preparado. Os logs de 01/10/2026 continuam ligados ao commit original.

### P1: Reproducible Quality Gates

**User Story**: Como revisor, quero resultados verificáveis por commit.

**Why P1**: Um filtro sem testes ou um job omitido não pode indicar aprovação.

**Acceptance Criteria**:

1. WHEN o pipeline de qualidade executar THEN o job SHALL falhar se um comando obrigatório falhar ou se uma seleção obrigatória executar zero testes (CI-01).

**Independent Test**: Introduzir uma falha controlada em branch de teste e selecionar um nome inexistente, confirmar saída não zero e restaurar a alteração. Não executar esse experimento na branch principal ou em produção.

## Edge Cases

Casos limítrofes e falhas são detalhados em `test-plan.md`: token ausente, JSON inválido, HTTP 200 com erro, 401 público/autenticado, rede indisponível, CSV vazio/malformado, nomes duplicados, consulta com acentos/espaços, limites do dia local, falha entre POST de remédio e POST de doses, doses simultâneas e troca de conta. A caracterização não deve transformar defeitos conhecidos em comportamento desejável.

## Implicit Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | CODE-01/02, TEST-01/02; manter regras atuais e testar limites. |
| Failure / partial-failure states | TEST-02/04; falha parcial FE-08 fica rastreada, sem novo retry. |
| Idempotency / retry / duplicate handling | N/A para mudança de regras; cenários diagnósticos em TEST-02/04, correção em FE-08. |
| Auth boundaries & rate limits | TEST-02/04 e NF-03; autorização continua no servidor; mudança de sessão depende de FE-03. |
| Concurrency / ordering | CODE-01/02 preservam ordem/eventos; casos de simultaneidade identificam FE-05/08. |
| Data lifecycle / expiry | N/A para novas políticas; restauração/logout atuais são caracterizados, expiração remota depende de FE-03. |
| Observability | SEC-01/02/03, NF-03 e DOC-06 com evidências sanitizadas. |
| External-dependency failure | DEP-01/02 e TEST-02/04; registry/API indisponíveis são bloqueio, nunca sucesso. |
| State-transition integrity | TEST-02/03/04; persistência só é declarada com E2E real. |

## Requirement Traceability

| Requirement ID | Story / AC | Tasks | Issue / source | Status |
| --- | --- | --- | --- | --- |
| DEP-01 | Dependency Maintenance / 1 | T1 | FE-01; Dependabot | Pending |
| DEP-02 | Dependency Maintenance / 2 | T2, T3, T14–T22 | FE-01 | Pending |
| DEP-03 | Dependency Maintenance / 3 | T9, T10, T14–T22, T13 | FE-01/07/09 | Pending |
| CODE-01 | Code Optimization / 1 | T9, T23 | FE-10 | Pending |
| CODE-02 | Code Optimization / 2 | T10, T24 | FE-10 | Pending |
| SEC-01 | Sensitive Logging / 1 | T25 | NF-WEB-04; FE-07/14 | Pending |
| SEC-02 | Sensitive Logging / 2 | T26 | NF-WEB-04; FE-07/14 | Pending |
| SEC-03 | Sensitive Logging / 3 | T27 | NF-WEB-04; FE-05, apenas logs | Pending |
| TEST-01 | Automated Tests / 1 | T4, T7–T12 | FE-07 | Pending |
| TEST-02 | Automated Tests / 2 | T8, T11, T12 | FE-07 | Pending |
| TEST-03 | Automated Tests / 3 | T5, T13 | FE-07 | Pending |
| TEST-04 | Automated Tests / 4 | T41 | FE-02/03/04/05/08/15 | Pending |
| NF-01 | Nonfunctional Evidence / 1 | T28 | FE-09/14 | Pending |
| NF-02 | Nonfunctional Evidence / 2 | T29 | FE-10/14 | Pending |
| NF-03 | Nonfunctional Evidence / 3 | T30 | FE-14 | Pending |
| NF-04 | Nonfunctional Evidence / 4 | T31 | FE-12/14 | Pending |
| DOC-01 | Project Documentation / 1 | T34 | Pedido; FE-15 | Pending |
| DOC-02 | Project Documentation / 2 | T35 | Pedido; FE-06/12 | Pending |
| DOC-03 | Project Documentation / 3 | T36 | Pedido | Pending |
| DOC-04 | Project Documentation / 4 | T37 | Pedido; FE-01 | Pending |
| DOC-05 | Project Documentation / 5 | T38 | Pedido; FE-12/13/14 | Pending |
| DOC-06 | Project Documentation / 6 | T32, T39 | Pedido; FE-14 | Pending |
| CI-01 | Reproducible Quality Gates / 1 | T3, T6, T33, T40 | FE-07 | Pending |

**Coverage**: 23 requisitos, 23 mapeados a tarefas, zero sem mapeamento. Isso é rastreabilidade do plano, não cobertura de código.

## Differences from the source

Nenhuma alteração visual ou funcional é proposta. O uso de `docs/` em vez de `.specs/` decorre do pedido explícito. As issues são referência e dependência; sua consulta não autoriza implementar integralmente mudanças funcionais fora deste escopo. Nenhuma captura foi fornecida.

## Sources

- [Fontes, estado consultado e mapa das issues](sources.md).
- [Plano de testes existente](../../PLANO_TESTES.md), [backlog](../../BACKLOG.md) e [relatório histórico](../../RELATORIO_QUALIDADE.md).
- Código local no commit da baseline, localizado primeiro pelo Graphify e conferido nos arquivos atuais.
- [Migração Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16), consultada em 04/11/2026: `next lint` foi removido; usar CLI do ESLint.
- [Vitest no Next.js](https://nextjs.org/docs/app/guides/testing/vitest) e [Playwright no Next.js](https://nextjs.org/docs/app/guides/testing/playwright), consultados em 04/11/2026: suporte e configuração das ferramentas escolhidas.

## Success Criteria

- [ ] Os 23 critérios têm um check e uma prova em `tasks.md`.
- [ ] Todas as tarefas têm entregável, dependência, testes, gate e commit planejado.
- [ ] Nenhuma melhoria de manutenção altera a lógica, os contratos ou o design.
- [ ] Qualidade, cobertura e escala só são declaradas a partir de evidências do commit avaliado.
- [ ] Spec e tarefas passam pelos validadores estruturais antes da revisão humana; continuam Draft até aprovações reais.
