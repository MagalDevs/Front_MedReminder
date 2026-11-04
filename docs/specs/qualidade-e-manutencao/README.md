# Frontend Quality and Maintenance Plan

**Status**: Draft. Nenhuma tarefa de implementação foi executada.
**Date**: 2026-11-04, America/Sao_Paulo.
**Baseline**: `43b05890d8a6cca1311969a6ca51a9f9decc2620`.

O pacote detalha atualização de dependências, otimizações e segurança sem alteração de lógica, testes unitários/de integração/funcionais/não funcionais e documentação do projeto. Usa a skill `tlc-spec-driven`, com os artefatos em `docs` conforme solicitado. As 15 issues abertas do frontend foram consultadas e vinculadas ao plano.

## Reading Order

| File | Content |
| --- | --- |
| [context.md](context.md) | Escopo pedido, escolha do usuário por Vitest/RTL/Playwright e estado das aprovações. |
| [spec.md](spec.md) | 23 requisitos com critérios EARS, limites, fontes e rastreabilidade. |
| [design.md](design.md) | Arquitetura efetiva, diagramas, design atual, contratos, reutilização e riscos. |
| [test-plan.md](test-plan.md) | Casos, dados, resultados esperados, medições, cobertura e bloqueios. |
| [tasks.md](tasks.md) | 41 tarefas em seis fases, entregáveis, dependências, testes, gates, commits futuros e 23 checks. |
| [sources.md](sources.md) | Mapa das 15 issues, PRs de dependência existentes e fontes locais/oficiais consultadas. |
| [validation.md](validation.md) | Validação estrutural e revisão do pacote; não equivale a teste da aplicação. |
| [Adendo de integração com o backend](../integracao-backend/README.md) | Verificação posterior nos dois repositórios: contratos atuais e correções funcionais de conexão planejadas, com IDs próprios. |

## Planned Deliverables

| Workstream | Deliverable after future execution |
| --- | --- |
| Dependências | Inventário de todos os pacotes, análise dos PRs existentes, atualização compatível, peers e lockfile reproduzível. |
| Código e segurança | Redução de normalização repetida nas buscas e retirada de logs sensíveis, com regressão no mesmo commit. |
| Testes e CI | Vitest + React Testing Library, Playwright, coleta de cobertura, experimentos e relatório de falhas/bloqueios por commit. |
| Descrição da solução | `docs/SOLUCAO.md`. |
| Arquitetura do sistema | `docs/ARQUITETURA.md`. |
| Organização do repositório | `docs/ORGANIZACAO_REPOSITORIO.md`. |
| Tecnologias utilizadas | `docs/TECNOLOGIAS.md`. |
| Evidências de escalabilidade | `docs/ESCALABILIDADE.md` e experimentos identificados. |
| Relatório de qualidade e cobertura | Nova rodada em `docs/RELATORIO_QUALIDADE.md`, preservando evidências históricas. |

Os documentos finais e testes acima são entregas **planejadas**, não arquivos ou capacidades já implementados. A cobertura atual é **NÃO MEDIDA**. Mocks não comprovam persistência; logs antigos não aprovam outro commit; características arquiteturais não comprovam escala em produção.

## Review and Execution

Primeiro revisar `spec.md`; uma eventual aprovação é registrada com as palavras do usuário. Depois revisar/aprovar separadamente `tasks.md`. A escolha das ferramentas já registrada não substitui essas aprovações. A entrega deste pedido termina no planejamento; este pacote não inicia a implementação.

O plano preserva lógica e design. Mudanças de histórico, sessão, fila de alertas, senha/foto e recuperação de falha parcial continuam nas issues funcionais correspondentes. Cenários que dependem delas ficam bloqueados ou reprovados, sem apresentação de MVP aprovado. Testes com API real e comprovação cloud exigem ambiente isolado/configuração efetiva; não há operação remota autorizada por este plano.

## Structural Validation

Na raiz do frontend, usar um Python 3.8+ real, não o alias da Microsoft Store:

```powershell
python '<skill-dir>\scripts\validate_spec.py' 'docs/specs/qualidade-e-manutencao/spec.md'
python '<skill-dir>\scripts\validate_tasks.py' 'docs/specs/qualidade-e-manutencao/tasks.md'
git diff --check
```

`<skill-dir>` é o diretório da skill instalada; nesta elaboração foi usado `C:\Users\danie\.codex\skills\tlc-spec-driven`. Não usar `--execute`, `check_proofs.py` ou a validação de implementação concluída para apresentar tarefas futuras como realizadas.
