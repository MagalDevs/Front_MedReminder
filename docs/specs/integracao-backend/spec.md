# Backend Integration Specification

**Status**: Approved — em execução
**Date**: 2026-11-04, America/Sao_Paulo.
**Frontend baseline**: `43b05890d8a6cca1311969a6ca51a9f9decc2620`.
**Backend baseline**: `b6b63168ba2a092e6e6350c256bfa15483199b4a`.

## Problem Statement

A conexão não está inteiramente alinhada aos contratos atuais. O frontend usa uma origem fixa, interpreta incorretamente a resposta de atualização do perfil e continua criando medicamento e doses em duas operações, embora o backend já ofereça uma operação atômica. O histórico consulta uma rota autenticada sem Bearer; erros estruturados e a restauração de sessão também precisam de tratamento no cliente.

O usuário solicitou verificar a conexão e incrementar os docs se houvesse lacunas. Este adendo registra o diagnóstico e as tarefas futuras; não implementa correções. A análise foi estática nos dois repositórios, sem acessar produção ou afirmar que o deploy corresponde ao código local.

## Goals

- [ ] Registrar contratos reais, compatibilidades e divergências com referências dos dois repositórios.
- [ ] Planejar alinhamentos de configuração, sessão, perfil, tratamento e histórico.
- [ ] Derivar testes de contratos do backend, sem fazer mocks validarem tipos incorretos do frontend.
- [ ] Distinguir implementação disponível no backend de integração ainda não realizada no frontend.

## Out of Scope

| Item | Reason |
| --- | --- |
| Executar correções, commits ou operações remotas nesta rodada | O pedido autoriza verificação e incremento dos documentos. |
| Inventar endpoint de senha ou mecanismo transacional | Ambos já existem no backend local e devem ser consumidos conforme contrato. |
| Implementar upload de foto ou edição de medicamento | Foto não possui contrato implementado; edição não possui fluxo frontend atual. São decisões/funcionalidades separadas. |
| Alterar doses, fuso, intervalo ou significado de quantidadeDiaria/quantidadeDias por inferência | DTOs validam tipos e limites, mas não resolvem sozinhos a semântica de negócio desses nomes. |
| Permitir apagar CEP ou omitir silenciosamente CEP vazio no PATCH | O contrato atual rejeita string vazia com 400. Este adendo testa e apresenta essa rejeição; mudar a semântica do campo exige decisão própria, sem escolher entre apagar/manter por suposição. |
| Trocar autenticação por cookies ou introduzir refresh/Firebase no cliente | O alinhamento usa o Bearer existente. |
| Retry automático, timeout arbitrário, paginação de UI ou novos estados de adiamento | Não há requisito de produto para esses comportamentos neste pedido. |
| Declarar conexão de produção, CORS publicado ou MVP aprovados | Não houve execução do navegador contra o ambiente publicado. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Escopo da rodada | Somente verificação e documentação | Usuário: "só faça essa verificação" e "se houver incremente nos docs". | y |
| Preservação do plano anterior | Adendo funcional separado | Os 23 requisitos/41 tarefas de manutenção continuam com seus IDs; este plano trata correções de integração, não as disfarça de otimização. | y, pedido e código |
| Ferramentas de teste futuras | Vitest + React Testing Library e Playwright | Escolha anterior do usuário registrada no contexto da manutenção. | y |
| Fonte do contrato | Controllers, DTOs, serviços e configuração do backend no commit informado | O código atual prevalece sobre premissas antigas de endpoints ausentes. | y, inspeção |
| Ambiente publicado | Não verificado | Não assumir que Render contém o mesmo commit nem que CORS_ORIGINS está configurado. | y, limite da verificação |
| Foto e semântica de quantidades | Continuam fora das correções automáticas | Exigem especificação própria se houver mudança; não bloqueiam documentar as incompatibilidades comprovadas. | y, fronteira do escopo |

**Open questions:** none para registrar os alinhamentos comprovados. URL da homologação, revisão implantada e decisões de foto/semântica permanecem pré-condições externas, sem valores inventados. Spec e tarefas não foram aprovados para implementação.

## User Stories

### P1: Transport and Session

**User Story**: Como usuário, quero que o cliente se conecte ao ambiente correto e carregue dados somente após confirmar minha sessão.

**Why P1**: Configuração fixa e sessão presumida impedem testes isolados e tornam falhas de integração difíceis de diagnosticar.

**Acceptance Criteria**:

1. WHEN a origem pública da API for configurada para um build THEN todas as chamadas de domínio suportadas SHALL usar essa origem sem URLs fixas nas telas (BEAPI-01).
2. IF uma resposta HTTP falhar THEN o erro do cliente SHALL preservar status, `code`, mensagens string/array e `Retry-After` disponíveis, inclusive quando o corpo for inválido (BEAPI-02).
3. WHEN uma sessão armazenada for restaurada THEN o estado autenticado SHALL depender de GET `/usuario/me` bem-sucedido, sem considerar apenas a presença do token (BEAPI-03).
4. WHILE a sessão não estiver confirmada o provider de lembretes SHALL executar zero requisições a `/dose/me` (BEAPI-04).

**Independent Test**: Dois builds/origens sintéticos; respostas 400 com array, 401 com corpo inválido, 429 com Retry-After e 503; sessão ausente/válida/expirada e troca de conta com resposta atrasada.

### P1: Existing Backend Operations

**User Story**: Como usuário, quero que perfil, senha e tratamento consumam os contratos que o backend já implementa.

**Why P1**: Há falhas concretas no consumo da resposta e oportunidade de remover gravação parcial sem criar uma nova API.

**Acceptance Criteria**:

1. WHEN PATCH `/usuario/me` retornar `{message,data}` THEN o formulário SHALL preencher nome, email e CEP a partir de `data`, sem apagar os valores por ler o envelope como usuário (BEAPI-05).
2. IF PATCH `/usuario/senha` falhar THEN a tela SHALL apresentar a falha dessa operação sem anunciar sucesso integral das alterações solicitadas (BEAPI-06).
3. WHEN um tratamento válido for confirmado THEN o cliente SHALL enviar uma única operação POST `/tratamento` com `{remedio,doses}` e `Idempotency-Key`, em vez da sequência de criação de remédio e lote de doses (BEAPI-07).
4. IF o tratamento tiver validade ausente, lote vazio, mais de 1000 doses, instantes duplicados ou datas inválidas THEN a validação do cliente SHALL impedir o envio desse tratamento inválido (BEAPI-08).

**Independent Test**: PATCH perfil com envelope real; senha correta/incorreta, fraca, concorrência 409 e limite 429; POST tratamento com chave/conteúdo iguais e diferentes; limites 1/1000/1001 e validade null. Preservar os horários já especificados: este plano não escolhe nova regra de posologia.

### P1: Reliable Connection Evidence

**User Story**: Como mantenedor, quero testes que comprovem os contratos e exponham as partes ainda não disponíveis.

**Why P1**: Uma fixture baseada apenas no tipo do frontend pode esconder exatamente a incompatibilidade investigada.

**Acceptance Criteria**:

1. WHEN o histórico for carregado THEN a tela SHALL usar dados autenticados de `/dose/me`, sem gerar registros aleatórios ou estados de adiamento inexistentes no contrato (BEAPI-09).
2. WHEN o smoke de conexão for executado em navegador THEN o registro SHALL demonstrar origem permitida e negada, preflight com Bearer/Idempotency-Key e leitura de Retry-After no ambiente e revisão identificados (BEAPI-10).
3. IF o contrato de foto de usuário permanecer ausente THEN o relatório SHALL identificar `/usuario/foto` como indisponível, sem atestar upload integrado (BEAPI-11).
4. WHEN as suítes de contrato forem executadas THEN as fixtures SHALL declarar o commit do backend e reproduzir seus DTOs/envelopes/status, incluindo os formatos diferentes de login, listas e perfil (BEAPI-12).

**Independent Test**: Reconciliação fixture-controller-serviço; histórico vazio/preenchido e isolamento A/B; smoke local com API isolada. Falta de ambiente é BLOQUEADO, sem usar resposta mockada como comprovação de persistência real.

## Edge Cases

- Login retorna `access_token` na raiz; GET/PATCH perfil usam `data`; senha e exclusão retornam somente `message`. Não desembrulhar todas as respostas automaticamente.
- GET `/remedio` retorna array na raiz e exige autenticação. O formato esperado pelo histórico atual é compatível; a ausência de Bearer e os registros simulados são os problemas comprovados.
- Uma senha atual incorreta retorna 401 com token ainda válido. Não tratar todo 401 de negócio como prova de sessão expirada; revalidar o perfil para distinguir falha operacional de credencial inválida.
- Perfil pode ter sido atualizado antes de a senha falhar. Não prometer rollback dessa sequência nem apresentar tudo como salvo ou tudo como não salvo.
- CEP vazio enviado no PATCH é 400 pelo DTO atual. Exibir a validação do servidor e não anunciar sucesso. Não reinterpretar vazio como ordem de apagar ou omitir o campo; isso está fora deste alinhamento semântico.
- Em resposta incerta do tratamento, um reenvio explícito da mesma intenção mantém chave e conteúdo. Não gerar nova chave automaticamente, não fragmentar o lote e não introduzir retry automático.
- A chave tem 1–128 caracteres ASCII alfanuméricos ou `. _ : -`; mesma chave com outro conteúdo produz 409. Não reutilizar intenção/chave de outra conta.
- O endpoint atômico requer SQLite em arquivo no backend; API com `:memory:` produz 503 e não serve como ambiente E2E positivo desse caso.
- GET `/dose/me` sem query não é paginado; com filtros/paginação usa `pagination`. Consumir o contrato escolhido sem truncar silenciosamente resultados.

## Implicit Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | BEAPI-08/12; whitelist estrita, date-only de nascimento, datas de doses e limites do lote. |
| Failure / partial-failure states | BEAPI-02/05/06/07; erro com corpo inválido, perfil/senha parcialmente concluídos e resposta incerta do tratamento. |
| Idempotency / retry / duplicate handling | BEAPI-07/08; usar contrato existente; sem retry automático. |
| Auth boundaries & rate limits | BEAPI-02/03/04/06; Bearer, 401 operacional e Retry-After; autorização permanece no backend. |
| Concurrency / ordering | BEAPI-04/07; descartar resposta de identidade anterior e preservar chave por intenção; fila de alertas continua FE-05. |
| Data lifecycle / expiry | BEAPI-03/04; restauração validada e descarte do estado anterior, sem refresh token inventado. |
| Observability | BEAPI-02/10/12; logs/evidências sem tokens, senhas ou dados reais. |
| External-dependency failure | BEAPI-10/12; API/CORS/revisão indisponíveis bloqueiam a prova. |
| State-transition integrity | BEAPI-05/06/07/09; sucesso somente a partir da operação confirmada, histórico a partir de dados persistidos. |

## Requirement Traceability

| Requirement ID | Story / AC | Tasks | Issue / source | Status |
| --- | --- | --- | --- | --- |
| BEAPI-01 | Transport and Session / 1 | T2, T3, T9 | FE-06 | Pending |
| BEAPI-02 | Transport and Session / 2 | T2, T3, T6 | FE-04/06/07 | Pending |
| BEAPI-03 | Transport and Session / 3 | T4 | FE-03 | Pending |
| BEAPI-04 | Transport and Session / 4 | T5 | FE-03/05 | Pending |
| BEAPI-05 | Existing Backend Operations / 1 | T6 | FE-04 | Pending |
| BEAPI-06 | Existing Backend Operations / 2 | T6 | FE-04 | Pending |
| BEAPI-07 | Existing Backend Operations / 3 | T8 | FE-08 | Pending |
| BEAPI-08 | Existing Backend Operations / 4 | T7, T8 | FE-08 | Pending |
| BEAPI-09 | Reliable Connection Evidence / 1 | T9 | FE-02 | Pending |
| BEAPI-10 | Reliable Connection Evidence / 2 | T11, T12 | FE-06/12/15 | Pending |
| BEAPI-11 | Reliable Connection Evidence / 3 | T10 | FE-04 | Pending |
| BEAPI-12 | Reliable Connection Evidence / 4 | T1, T12 | FE-07/15 | Pending |

**Coverage**: 12 requisitos, 12 mapeados a tarefas. Não representa cobertura de código ou execução dos critérios.

## Differences from the source

O [plano de manutenção](../qualidade-e-manutencao/README.md) preserva a lógica da baseline. Este adendo documenta correções funcionais de integração, autorizadas somente como planejamento pelo pedido subsequente. Nenhuma captura ou nova UI foi fornecida. A criação de senha no backend não é tarefa: a rota existe. O mesmo vale para CORS e tratamento atômico.

## Sources

- [Diagnóstico, contratos e desenho do alinhamento](design.md), com fontes dos dois repositórios.
- [Contexto e stack escolhida](../qualidade-e-manutencao/context.md), [plano existente](../../PLANO_TESTES.md) e [backlog](../../BACKLOG.md).
- Backend: `src/usuario/usuario.controller.ts`, `src/usuario/usuario.service.ts`, `src/usuario/dto/`, `src/common/api-response.ts`, `src/common/api-exception.filter.ts`, `src/common/cors-config.ts`, `src/configure-app.ts`, `src/tratamento/` e `src/dose/` no commit registrado.
- Frontend: `src/app/utils/api.ts`, `contexts/AuthContext.tsx`, `contexts/lembreteContext.tsx`, `cadastro/page.tsx`, `Configuracoes/ConfiguracoesContent.tsx`, `historico/HistoricoContent.tsx` e `components/CardCadastrar/cardCadastrar.tsx`.

## Success Criteria

- [ ] Cada requisito tem tarefa e check com prova planejada.
- [ ] Nenhuma lacuna de frontend é descrita como endpoint backend ausente sem conferir o controller atual.
- [ ] Os documentos distinguem diagnóstico estático, testes futuros e comprovação do ambiente publicado.
- [ ] Validadores estruturais passam antes da revisão do pacote. Nenhuma aprovação ou execução é inventada.
