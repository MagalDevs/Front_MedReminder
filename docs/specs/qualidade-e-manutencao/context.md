# Quality and Maintenance Context

**Date**: 2026-11-04, America/Sao_Paulo.
**Scope**: criação de specs e tarefas no frontend. A solicitação não inclui executar a manutenção planejada.

## User Decisions

| Decision | Source | Recorded outcome |
| --- | --- | --- |
| Local dos artefatos | Pedido: "crie specs de tasks em uma pasta docs" | Os artefatos ficam em `docs/specs/qualidade-e-manutencao/`, em vez do caminho padrão `.specs/` da skill. Os validadores recebem os caminhos dos arquivos. |
| Preservação da aplicação | Pedido: "otimizações - não deve mudar a lógica, segurança" | Atualizações e otimizações preservam regras, contratos e design existentes. Correções funcionais do backlog são identificadas como dependências separadas. |
| Fontes complementares | Usuário: "há também essas issues criadas no qual você pode se basear também" | Consultar as issues de `MagalDevs/Front_MedReminder` e manter rastreabilidade por URL. |
| Stack de testes | Usuário: "Vitest + React Testing Library para unitários/integração e Playwright para funcionais (recomendado)" | Prever Vitest e React Testing Library para unitários e integração; Playwright para funcionais. |
| Verificação da conexão com a API | Usuário: "só faça essa verificação" e "se houver incremente nos docs" | Em 04/11/2026, comparar o frontend com o backend local e documentar lacunas no [adendo de integração](../integracao-backend/README.md), sem executar correções. |

## Approval State

**Status**: Approved — em execução, desde 2026-11-04 (America/Sao_Paulo).

| Item | Registro |
| --- | --- |
| Data | 2026-11-04 |
| Palavras do usuário (owner do projeto) | "siga as specs deste projeto e finalize elas por favor" |
| Escopo aprovado | `spec.md` e `tasks.md` dos pacotes `qualidade-e-manutencao` e `integracao-backend`. |
| Limites | A aprovação não autoriza push, merge, deploy nem acesso/mutação à API de produção; E2E real continua dependendo de API isolada explícita. |

Observações de protocolo, registradas sem ocultar desvios:

- O usuário deu uma única instrução, que cobre spec e tasks ao mesmo tempo. O protocolo pedia duas aprovações em momentos separados; a instrução foi tratada como aprovação conjunta do spec e das tasks por decisão do owner do projeto.
- A skill `tlc-spec-driven` não está disponível nesta máquina. O fluxo Execute está sendo seguido manualmente: tarefas em ordem, um commit atômico por tarefa, gates registrados e status atualizado no `tasks.md`.
- Os validadores Python da skill (`validate_spec.py`, `validate_tasks.py --execute`) não existem nesta máquina e não foram executados. O gate inicial equivalente é o Build do cabeçalho do `tasks.md`; seu resultado é registrado nas evidências de T1/T2, sem ocultar falhas.
- Execução em curso na branch `feat/executar-specs`, sem push.
