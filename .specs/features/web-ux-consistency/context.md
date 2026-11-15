# Web UX Consistency Context

**Gathered:** 2026-11-13
**Spec:** `.specs/features/web-ux-consistency/spec.md`
**Status:** Specification approved with the requested skills amendment

## Feature Boundary

Criar especificações das correções propostas na crítica profissional do MedReminder. O escopo cobre somente o cliente web `Front_MedReminder`. Esta solicitação entrega documentos, sem implementação da aplicação, mudanças no mobile ou mudanças no backend.

## Implementation Decisions

### Scope

- Pergunta: Nesta rodada, “somente no front-end” significa qual escopo?
- user: "Somente o web: Front_MedReminder"
- Decisão: todos os arquivos novos desta solicitação ficam no repositório web. Contratos do backend são consultados apenas para leitura.

### Product Direction

- Pergunta: As specs devem incluir a direção completa da crítica: tela Hoje, navegação padronizada, identidade visual compartilhada e cadastro em etapas?
- user: "Sim, incluir a direção completa (recomendado)"
- Decisão: incluir Hoje, Medicamentos, Histórico e Perfil; cadastro progressivo; sistema visual preparado para futura equivalência com o mobile. O aplicativo mobile não será alterado nesta rodada.

### Agent's Discretion

- Pergunta: Posso definir e documentar os detalhes de comportamento ainda abertos, como rascunhos, correção de dose e edição, respeitando a API atual?
- user: "Sim, defina as regras e documente os limites (recomendado)"
- Decisão: user delegated. Definir regras conservadoras, verificáveis e compatíveis com os contratos locais existentes. Não presumir capacidades remotas não verificadas nem inventar garantias de persistência ou notificações.
- A delegação inicial de comportamento não equivalia à aprovação de `spec.md`, `tasks.md` ou execução. As aprovações posteriores de spec e Tasks estão registradas abaixo.

### Specification Approval and Required Skills

- Em 2026-11-13, o usuário respondeu: "aprovado, só adicione nas specs para que o usuário utilize as skills" e indicou os recursos a seguir.
- Aprovação da especificação: user: "aprovado".
- Adendo solicitado: uso de `frontend-design`, `tlc-spec-driven`, plugin `taste-skill:design-taste-frontend` e skills de front-end presentes em `Front_MedReminder/skills-lock.json`.
- O lock atual contém `transitions-dev` e `transitions-polish`; os respectivos arquivos locais foram encontrados em `.agents/skills/`.
- Decisão: registrar essas ferramentas como orientação obrigatória ao agente ou desenvolvedor executor em `spec.md`, com fase de uso, fontes e limites de aplicação.
- A instrução é de processo; não exige que a pessoa usuária do MedReminder instale ou utilize skills, nem expõe essas ferramentas na interface.
- O pedido "só adicione nas specs" limita esta rodada à atualização documental. Não iniciar Design, Tasks ou implementação como efeito da aprovação.

### Declined / Undiscussed Gray Areas

Nenhuma área foi recusada. Detalhes de comportamento foram delegados explicitamente. As decisões derivadas serão registradas na seção Assumptions & Open Questions da especificação.

## Specific References

### Subsequent Confirmation

- Em 2026-11-13, após a inclusão das skills, o usuário respondeu novamente: "aprovado".
- A confirmação mantém a aprovação da especificação e de seu adendo. Design e plano de tarefas podem ser preparados para revisão; a aprovação do plano de tarefas será registrada apenas quando ele tiver sido apresentado e aprovado.
- Não interpretar esta confirmação como aprovação retroativa de tarefas ainda não escritas.

- Crítica profissional e plano de melhoria apresentados nesta conversa em 2026-11-13.
- Não foram fornecidas capturas ou arquivos de design como referência vinculante.
- A avaliação visual anterior cobre web público e layout estreito. Telas autenticadas completas ainda exigem validação com fixtures.

### Implementation Approval and Agent Instructions

- Em 2026-11-14, após a apresentação do design e das tarefas, o usuário respondeu: "aprovado, antes de iniciar a implementação ponha as skills e mcps citados no AGENTS.md do frontend".
- Design e Tasks aprovados. Registrar as skills e ferramentas no AGENTS.md é uma preparação obrigatória anterior à implementação.
- As instruções adicionadas incluem tlc-spec-driven, frontend-design, design-taste-frontend, transitions-dev, transitions-polish e impeccable; MCPs Graphify, Context7 e computer/browser use. Playwright é identificado como executor local, sem presumir um MCP inexistente.
- Nenhuma tarefa de implementação foi concluída por esta alteração documental. Antes de Execute, permanece a escolha de workers exigida pela skill para este plano de 47 tarefas.

### Batch Execution Choice

- Em 2026-11-14, o usuário escolheu: "execução em lotes sequenciais com subagentes".
- Workers de implementação autorizados. Executar sete lotes alinhados às fases: T1–T6, T7–T13, T14–T20, T21–T27, T28–T34, T35–T43 e T44–T47.
- Cada lote aguarda a conclusão verificada do anterior; não há paralelismo de implementação nem subagentes aninhados.
- A verificação independente final é responsabilidade do orquestrador, conforme a skill, depois das provas no HEAD final.

### Initial Gate Failure

- Em 2026-11-14, `validate_tasks.py --execute` falhou antes de T1 porque `npm run build` encerrou com erro interno do Turbopack na transformação CSS.
- A execução direta do mesmo comando reproduziu a falha. Evidência e limites da conclusão em `baseline.md`.
- Nenhum worker foi despachado e nenhum código da aplicação foi alterado. O gate precisa passar antes do primeiro lote.

### Build Prerequisite Authorization

- Em 2026-11-14, ao ser perguntado se poderia corrigir a falha de build antes dos lotes, o usuário respondeu: "sim".
- Correção autorizada como pré-requisito. PostCSS isolado e criação de processo Node funcionaram; Turbopack continuou falhando na transformação CSS. O build de diagnóstico com Webpack compilou a aplicação e passou a etapa TypeScript.
- Decisão: tornar explícito `next build --webpack` no script `build`, alinhando a compilação de produção ao compilador já utilizado por `playwright.config.ts`. O comando de gate continua `npm run build`, seguido de TypeScript e lint, sem remover validações.
- Webpack é opção de produção suportada pelo Next.js. Isto contorna a falha observada do Turbopack; não declara que o compilador Turbopack foi corrigido. Não há atualização de dependências nem mudança de código das telas neste pré-requisito.

### Treatment Contract Test Correction Authorization

- Em 2026-11-14, o usuário respondeu: "Sim, corrigir teste e validação" à pergunta sobre o teste novo T24 que esperava cor e unidade de estoque vazias, contrariando a API existente.
- Correção autorizada: preencher ambos pelo formulário, manter a comparação exata do payload e todos os cenários existentes, acrescentar bloqueio de campos ausentes e de URL da foto com mais de 255 caracteres. Não há mudança do contrato nem autorização genérica para enfraquecer testes.
- O usuário também autorizou a retomada após a interrupção de uso: "continue com o processo". Os lotes sequenciais aprovados permanecem em vigor.

### Alarm Integration and Regression Authorization

- Em 2026-11-14, o usuário respondeu: "Sim, corrigir alarme e testes" à atualização dos testes legados do alarme para a interface padronizada e à conversão dos quatro casos de falha esperada em testes normais.
- Preservar as verificações de dose já registrada, fila de doses simultâneas, cancelamento de timers e ausência de duplicação. Os seletores devem continuar identificando a interface real; renomear o título não pode fazer uma asserção negativa passar sem provar a ausência do alarme.
- A integração mantém os resultados confirmados sincronizados em memória entre telas e alarme, por identidade. Não acrescenta storage, polling, endpoints nem garantia de sincronização entre dispositivos.

### Pagination Assertion Correction Authorization

- Em 2026-11-14, foi enviada pergunta assíncrona para atualizar a expectativa exata de IT07 em `tests/integration/lembretes.test.tsx`: de `/dose/me` para `/dose/me?limit=100&order=ASC&page=1`, mantendo autenticação, quantidade de chamadas e resultado.
- O usuário respondeu: "Sim, alinhar o teste à paginação". Atualização dessa expectativa autorizada, mantendo as demais verificações e sem reduzir cenários.
- Após a interrupção de uso, o usuário confirmou a retomada: "continue". O gate final selecionado passou em 89 casos, sem falhas, seguido de TypeScript e lint global verdes. O Build das fontes corrigidas também passou. O commit corretivo inclui a expectativa aprovada e preserva os 44 arquivos de skills já preparados no índice. B6 ainda não foi despachado.

## Deferred Ideas

- Implementação e correções do app mobile.
- Mudanças em endpoints, DTOs, banco de dados ou regras do backend.
- Notificações push, alertas em segundo plano e novas garantias de sincronização.
- Implementação, commits, publicação e deploy da aplicação nesta solicitação de especificações.
