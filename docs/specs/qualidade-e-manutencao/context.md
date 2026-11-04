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

A escolha da stack não é aprovação do escopo completo nem das tarefas. `spec.md` e `tasks.md` permanecem em Draft. As aprovações serão registradas separadamente, com data e palavras do usuário, quando ocorrerem. Nenhuma tarefa de implementação foi iniciada.
