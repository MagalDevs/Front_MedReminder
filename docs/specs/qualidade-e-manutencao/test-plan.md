# Quality and Maintenance Test Plan

**Status**: Approved — em execução
**Date**: 2026-11-04, America/Sao_Paulo.
**Baseline**: frontend em `43b05890d8a6cca1311969a6ca51a9f9decc2620`.
**Scope**: plano de testes para manutenção que preserva regras, contratos e design. Nenhum cenário deste documento foi executado nesta elaboração.

## Current Evidence

O frontend ainda não possui suíte automatizada, scripts de teste ou workflow de CI. `tests/` contém um catálogo documental e um modelo de registro. A cobertura é **não medida**. O relatório de 01/10/2026 pertence ao commit `ffd8893b423879194e512f65de8db7de099d2b06`; seus resultados não aprovam o HEAD atual.

A [verificação posterior do backend](../integracao-backend/README.md) confirmou senha e tratamento atômico já implementados na API local. Os testes de manutenção abaixo caracterizam o cliente legado; as correções funcionais e seus resultados esperados estão no adendo. Mocks não devem legitimar o envelope incorreto do PATCH perfil, a sessão presumida ou os registros simulados. Foto continua sem contrato; edição de medicamento não possui fluxo frontend atual.

A stack escolhida pelo usuário é Vitest com React Testing Library para unitários e integração, e Playwright para testes funcionais. A criação da infraestrutura e das suites pertence às tarefas futuras. Build, tipos e lint são gates técnicos e não substituem testes funcionais.

## Test Boundaries

| Level | Execution boundary | Evidence and limitation |
| --- | --- | --- |
| Unit | Uma regra ou comportamento observável, sem rede real | Compara entradas e saídas previstas. Não valida detalhes internos nem quantidade de renders sem justificativa de desempenho. |
| Integration | Componentes, providers, cliente HTTP e navegação com Fetch simulado ou servidor fake local controlado | Valida os contratos entre camadas do frontend. Não comprova o comportamento do backend. Não exige MSW. |
| Functional | Aplicação compilada no navegador, API simulada por rotas Playwright | Exercita gestos e resultados visíveis de forma determinística. Não pode ser apresentado como E2E com API real. |
| End-to-end | Aplicação compilada e API real em ambiente isolado, com contas A/B sintéticas | Comprova persistência e contratos reais. Exige preparação e limpeza de dados de teste. Ausência do ambiente é bloqueio explícito. |
| Nonfunctional | Navegador, artefatos e ambiente identificados, com dados sintéticos | Mede acessibilidade, desempenho, exposição de dados e limites. Distingue observação local, meta proposta e capacidade comprovada. |

Os testes ordinários não acessam a URL de produção atualmente fixa no cliente HTTP. No navegador, interceptar as chamadas dessa origem e falhar diante de qualquer chamada não prevista. No ambiente Vitest, substituir Fetch e storage e rejeitar rede não simulada. E2E real somente após configurar uma API isolada e verificar a origem de destino. Não executar mutações nem carga em produção.

Cada teste declara o critério que prova, os dados, o resultado esperado e a fonte da regra. Caracterização de comportamento válido preserva a aplicação; um defeito conhecido não se torna resultado aceito. Cenários dependentes de correção funcional ficam registrados como bloqueados, com issue, sem serem convertidos em testes verdes que esperam o defeito.

## Planned Commands

Os comandos abaixo são contratos planejados. Ainda **não existem** no `package.json`; não registrar saída, cobertura ou aprovação antes de implementá-los e executá-los.

| Command | Planned scope | Required failure behavior |
| --- | --- | --- |
| `npm run test:unit` | Vitest em suites UT, com reporter que identifica cada teste | Exit diferente de zero em falha, import inválido ou seleção sem testes. |
| `npm run test:integration` | Vitest e RTL em suites IT, com Fetch/servidor fake controlado | Exit diferente de zero em falha, rede inesperada ou seleção sem testes. |
| `npm run test:functional` | Playwright em suites FN com API simulada e aplicação compilada | Exit diferente de zero em falha ou seleção sem testes; não usar `--pass-with-no-tests`. |
| `npm run test:e2e` | Playwright em suites E2E com API real isolada | Ambiente ausente ou origem inválida não produz aprovação; seleção sem testes falha. |
| `npm run test:nonfunctional` | Suites NF automatizáveis e produção de métricas | Ausência de medição ou seleção sem testes falha; auditorias manuais seguem registro próprio. |
| `npm run test:coverage` | Unitários e integração instrumentados, relatório de cobertura | Falha em testes e geração inválida do relatório impedem aprovação; arquivos não exercitados aparecem no denominador. |

O detalhamento final de filtros e linhas de prova deve ser copiado da primeira execução real dos testes, sem simular nomes de testes aprovados. Cada tarefa inclui seus testes e seu gate. A suite completa roda na verificação final; testes direcionados validam cada tarefa.

## Fixtures and Isolation

- Usar nomes, e-mails, identificadores, medicamentos e tokens sintéticos. Não incluir dados de pacientes, credenciais válidas, respostas completas com informações sensíveis ou tokens reais em logs, traces e capturas.
- Fixar relógio e fuso em cenários temporais. Referência principal: `2026-11-04T12:00:00-03:00`, `America/Sao_Paulo`. Datas e horários dos testes são exemplos técnicos, não orientação de tratamento.
- Em testes com timers falsos: instalar relógio antes da montagem, avançar o tempo explicitamente, aguardar atualizações React e desmontar componentes. Ao terminar, limpar timers, restaurar relógio, Fetch, spies, storage e mocks. Timers órfãos e estado de outra conta não podem vazar para outro caso.
- Fixar fixtures CSV com cabeçalhos `NOME_PRODUTO` e `DESCRIÇÃO`, ordem conhecida, duplicatas, nome com acento, caractere reservado e célula ausente. Não inventar normalização de acentos, ordenação ou deduplicação que a aplicação não faz.
- Os testes de desempenho usam o catálogo real versionado, hoje com **819990 bytes**, e registram hash e commit. Uma fixture curta prova regra de busca; não prova desempenho do catálogo completo.
- Restaurar banco/fixtures antes de E2E real e limpar somente recursos criados pela rodada. Registrar versão da API e contratos. O teste nunca remove dados externos à sua preparação.

## Unit Cases

| ID | Input and steps | Expected outcome | Source / boundary |
| --- | --- | --- | --- |
| UT-01 | Chamar `apiRequest` com `dose/me` e `/dose/me`, mantendo método e opções iguais. | Ambas as chamadas montam exatamente uma barra entre origem e endpoint; opções fornecidas continuam preservadas. | `src/app/utils/api.ts:20-47`. |
| UT-02 | Simular token `token-sintetico`, exigir autenticação e depois remover o token. | Com token, Fetch recebe `Authorization: Bearer token-sintetico`; sem token, a chamada rejeita com `Authentication required but no token found` e não envia Fetch. | `utils/api.ts:33-40`. Presença de token não prova validade da sessão. |
| UT-03 | Executar GET, POST, PUT e PATCH com e sem Content-Type explícito. | POST/PUT/PATCH sem header recebem `application/json`; header explícito permanece; GET não recebe esse default. | `utils/api.ts:25-31`. |
| UT-04 | Responder 200 com JSON e depois texto, declarando o Content-Type de cada resposta. | O cliente devolve o objeto JSON ou o texto correspondente, sem transformar o contrato. | `utils/api.ts:50-58,139`. |
| UT-05 | Responder 400/403/404/429/500 sem mensagem; repetir com `message`, `error` e `errors` válidos. | Sem mensagem, usar respectivamente `Requisição inválida`, `Acesso negado`, `Recurso não encontrado`, `Muitas requisições. Tente novamente mais tarde`, `Erro interno do servidor`; com mensagem válida, preservar a prioridade de extração documentada. | `utils/api.ts:76-122`. Cada status e formato tem asserção própria. |
| UT-06 | Responder 401 para chamada autenticada, com storage preenchido; repetir chamada pública. | A chamada autenticada remove `access_token` e `user_data`, aponta para `/login` e rejeita; a pública rejeita sem limpar a sessão pelo ramo de autenticação. | `utils/api.ts:59-65`. Não generalizar para Fetch direto fora deste cliente. |
| UT-07 | Responder HTTP 200 com `{message:'falha',success:false}`; repetir com `{message:'ok',success:true}` e resposta de login com token. | O primeiro caso rejeita `falha`; os casos de sucesso preservam a resposta. | `utils/api.ts:124-139`. |
| UT-08 | Renderizar consumidor de AuthProvider com usuário nulo, `nome: 'Ana Teste'`, e somente `email: 'ana@example.test'`. | O nome exibido é, respectivamente, `Usuário`, `Ana` e `ana`. | `contexts/AuthContext.tsx:33-45`. Espaços iniciais e outros formatos devem gerar diagnóstico próprio se divergirem do requisito, sem ampliar a otimização. |
| UT-09 | Buscar `dIp` em catálogo ordenado com nomes correspondentes e não correspondentes; limpar a consulta. | A busca mantém correspondência por substring sem distinguir maiúsculas/minúsculas e a ordem de entrada; consulta vazia produz lista vazia. | `components/SearchBar/SearchBar.tsx:35-45`. |
| UT-10 | Fornecer 12 correspondências à SearchBar; selecionar uma linha e acionar `Cadastrar` com nome contendo espaço e `&`. | A lista mostra no máximo 10 linhas; seleção preserva o nome; navegação usa `/novo-medicamento?medicamento=` com nome aparado e codificado. | `SearchBar.tsx:63-74,131-159`. |
| UT-11 | Fixar agora em 12:00 e fornecer doses de 11:59:59.999, 12:00, 23:59:59.999 e 00:00 do dia seguinte. | `lembretesHoje` inclui os dois limites válidos entre agora e fim do dia, exclui passado e dia seguinte. | `contexts/lembreteContext.tsx:64-74`. Não afirmar que esse filtro já exclui doses tomadas. |
| UT-12 | Preencher o formulário com dosagem, quantidade, duração e intervalo vazios; depois zero e valores positivos; retirar o horário inicial. | Campos vazios ou zero e horário ausente exibem as mensagens de validação existentes e não enviam mutação; a fixture válida prossegue. | `components/CardCadastrar/cardCadastrar.tsx:83-117,159-173`. Entrada não numérica e casos fora desses limites exigem diagnóstico, não aceite de falhas silenciosas. |
| UT-13 | Configurar início em 04/11/2026 às 08:00, intervalo de 8 horas e duração de 1 dia, com relógio/fuso fixos. | O contrato esperado de horários locais contém 04/11 08:00, 04/11 16:00 e 05/11 00:00; o limite final 05/11 08:00 é exclusivo. Verificar também payload ISO com offset correto. | `cardCadastrar.tsx:120-156,178-202`. Se a serialização atual divergir, registrar defeito e bloquear a refatoração afetada; não corrigir regra de datas neste plano. |
| UT-14 | Montar CardBusca com medicamentoInicial, selecionar resultado, avançar timer zero e apagar a consulta. | Seleção inicial usa nome aparado e case insensitive; clique fecha dropdown e emite o objeto original de forma assíncrona; limpeza emite `{ NOME_PRODUTO: '', DESCRIÇÃO: '' }`; manter duplicados e ordem do catálogo. | `components/CardBusca/cardBusca.tsx:30-41,86-112`; CODE-02. |

As funções internas podem ser exercitadas pela interface pública do componente. Não há extração de função prevista neste plano. Não exportar funções apenas para espelhar implementação nos testes.

## Integration Cases

| ID | Input and steps | Expected outcome | Source / boundary |
| --- | --- | --- | --- |
| IT-01 | Compor Login, cliente HTTP, AuthProvider e navegação; responder POST `auth/login` com token e GET `usuario/me` com perfil sintético. | Login envia `{email,senha}`; consulta de perfil leva o token recebido; sessão e nome ficam disponíveis; navegação termina em `/`. | `login/page.tsx:20-72`, `AuthContext.tsx:94-103`. |
| IT-02 | Login recebe token, mas consulta do perfil falha. | Aparece mensagem de falha no perfil, logout limpa storage e a aplicação não mantém usuário autenticado após a sequência. | `login/page.tsx:71-74`, `AuthContext.tsx:105-110`. |
| IT-03 | Montar ProtectedRoute com loading ativo e depois sessão ausente ou sessão válida fornecida pelo provider. | Durante loading, exibe espera; sem sessão, navega a `/login` e não mostra conteúdo protegido; com sessão, renderiza o conteúdo. | `components/ProtectedRoute/ProtectedRoute.tsx:11-36`. Token expirado exige IT-10. |
| IT-04 | Montar busca com CSV local controlado e selecionar medicamento para o formulário. | Os campos correspondem aos cabeçalhos reais; nome/tipo selecionados chegam ao formulário; vazio e sem correspondência exibem estados existentes. | `SearchBar.tsx`, `novo-medicamento/page.tsx`, componente BuscaMedicamento existente. |
| IT-05 | Criar tratamento válido com resposta de medicamento e todas as doses bem-sucedidas. Conferir chamadas e recarregar dados simulados persistidos no fake. | Payload de medicamento preserva unidades, cor e valores do formulário; cada dose usa o ID criado e horário esperado; atualização consulta a lista após a gravação. | `cardCadastrar.tsx`; contrato fake deve ser derivado dos payloads reais. Falha parcial é IT-13. |
| IT-06 | Renderizar lembrete, acionar `Medicamento Tomado`, responder PUT `dose/<id>` e nova consulta. | Envia exatamente `{tomado:true}` ao ID apresentado; consulta novamente os lembretes e fecha o alerta depois da atualização. | `components/AlarmeDose/Lembrete.tsx:45-58`. |
| IT-07 | Renderizar MeusLembretesContent com medicamentos/doses de IDs e status distintos; aplicar filtro de medicamento e status. | Permanecem apenas registros que satisfazem os filtros escolhidos; GET e PUT continuam usando contratos atuais; falha de PUT mostra a mensagem existente. | `meus-lembretes/MeusLembretesContent.tsx:38-98,100-129`. |
| IT-08 | Após as tarefas SEC-01/02/03, cadastrar com sentinelas de senha/CPF/CEP/email, simular corpo de erro sensível e agendar alerta com dados de tratamento sintéticos; observar todos os métodos de console. | Nenhuma sentinela aparece nos logs dos fluxos corrigidos; payloads, mensagens ao consumidor e instante do alerta permanecem iguais. Storage é inspecionado e suas exposições são registradas como achados, sem presumir minimização de `user_data` implementada. | `cadastro/page.tsx:44`, `utils/api.ts:69-74`, `AlertaLembrete.tsx:32-35`; T25/T26/T27. |
| IT-09 | Após a otimização aprovada da busca, executar as mesmas consultas e seleções em dataset fixo antes/depois. | Mesmos IDs/nomes, ordem, limite visual e navegação; nenhuma normalização adicional nem atraso de debounce introduzido sem requisito específico. | UT-09/10; a prova compara resultados observáveis. |
| IT-10 | Carregar token inválido/expirado e alternar conta A para B. | Sessão inválida não habilita dados protegidos; nenhum dado de A aparece em B. | **Bloqueado FE-03**: AuthContext hoje confia na presença do token. Requer correção funcional separada e contrato da API. |
| IT-11 | Marcar dose e consultar histórico; fixar relógio e dados persistidos. | Histórico mostra somente registros reais associados ao usuário e reflete a dose após reload. | **Bloqueado FE-02**: histórico atual usa `Math.random` e Fetch direto. Não substituir a falha por seed que torne simulação aceitável. |
| IT-12 | Com relógio falso, agendar dose tomada/pendente, duas simultâneas e logout antes do horário; desmontar/remontar. | Um alerta por dose pendente, nenhuma dose tomada exibida, fila simultânea íntegra e timers cancelados ao logout/desmontagem. | **Bloqueado FE-05/FE-03**: fila, limpeza e isolamento mudam comportamento. Nunca esperar timer órfão ou alerta perdido como sucesso. |
| IT-13 | Após medicamento criado, falhar uma gravação de dose; tentar duplo submit e recuperação. | Não anuncia tratamento completo após falha parcial, não duplica tratamento e permite recuperação conforme contrato aprovado. | **Bloqueado FE-08** e dependência da API. Não inventar rollback/idempotência no frontend. |
| IT-14 | Atualizar perfil e acionar troca de senha pelo contrato atual; registrar foto como indisponível. | Perfil consome response.data; senha usa senhaAtual/novaSenha; falhas não anunciam sucesso integral. | Backend já implementa senha. Correções do cliente em BEAPI-05/06 do adendo; foto continua bloqueada em FE-04. |

## Functional Cases

FN usa Playwright com a aplicação compilada e API simulada. Cada rota mockada verifica método, URL, headers e body; chamadas não previstas falham. Capturas e traces documentam a execução e não comprovam API real.

| ID | Input and steps | Expected outcome | Dependencies |
| --- | --- | --- | --- |
| FN-01 | Abrir `/login`, preencher credenciais sintéticas, concluir login mockado, abrir menu e sair. | Exibe nome do perfil, navega conforme contrato e volta ao login após logout; storage limpo. | IT-01/02/03; não incluir validação real de token. |
| FN-02 | Abrir rota protegida em contexto limpo e depois com sessão sintética preparada. | Sem sessão, conteúdo protegido não aparece e login é alcançado; sessão preparada permite a navegação. | Não prova FE-03 resolvida. |
| FN-03 | Buscar medicamento conhecido e inexistente, selecionar resultado e cadastrar tratamento válido com API mockada. | Estados de busca, dados selecionados, horários e payloads correspondem a UT-09/10/13 e IT-05. | Falhas parciais e duplo submit permanecem vinculados a FE-08. |
| FN-04 | Abrir lembretes com fixtures, filtrar e marcar dose tomada. | Somente os registros esperados ficam visíveis; o item muda de estado após a nova consulta; falha mostra a mensagem prevista. | IT-06/07. Persistência real pertence a E2E-02. |
| FN-05 | Listar/excluir medicamento sintético com respostas de sucesso e erro, preservando o fluxo atual de confirmação. | A lista reflete apenas mutações concluídas e erro não se torna confirmação de sucesso; URLs, métodos e payloads permanecem iguais aos contratos caracterizados. | Edição não é fluxo frontend implementado; não inventar um teste de UI para esse recurso. |
| FN-06 | Capturar home, login, busca vazia/com resultados, formulário, lista vazia/preenchida, loading, erro e alerta, em 360/768/1440px. | Após manutenção, preserva textos, paleta, fontes, hierarquia, controles, rotas e comportamento responsivo das referências aprovadas antes das mudanças. | Congelar dados, relógio, fontes e estado da animação. Revisar diferenças reais; não regenerar baseline para ocultar regressão. |
| FN-07 | Interromper rede simulada e responder 401/403/429/500 em ações cobertas. | Mantém mensagens e transições válidas documentadas, encerra loading e não mostra sucesso sem resposta; 401 do cliente central remove sessão. | Diferenciar cliente central de Fetch direto. Tratamento novo exige requisito separado. |
| FN-08 | Executar no navegador os cenários de histórico, sessão expirada, simultaneidade, senha/foto e falha parcial. | Resultados esperados seguem IT-10 a IT-14; nenhum defeito conhecido é contado como caso aprovado. | **Bloqueado**, respectivamente, por FE-02/03/05/04/08; informar status por cenário. |

## Real End-to-end Cases

| ID | Input and steps | Expected outcome | Environment / dependency |
| --- | --- | --- | --- |
| E2E-01 | Preparar contas A/B em API isolada; cadastrar usuário sintético, fazer login, recarregar e sair. | Perfil e sessão correspondem à conta usada; logout impede acesso posterior. | API e origem isoladas verificadas; token expirado/conta anterior depende de FE-03. |
| E2E-02 | Criar medicamento e doses na conta A, confirmar uma dose e recarregar a lista. | API e tela mantêm o estado real da dose e os horários previstos; somente recursos criados pela rodada são removidos na limpeza. | Contratos reais disponíveis; sem histórico simulado como evidência. |
| E2E-03 | Entrar na conta B e tentar acessar ID de recurso da conta A pelas interfaces e requisições reais de teste. | Nenhum dado de A é exibido; API recusa acesso indevido conforme contrato. | Correção/autorização backend é dependência externa; FE-03 protege estado do cliente. |
| E2E-04 | Confirmar dose e consultar histórico real após reload. | Histórico corresponde somente a dados persistidos do usuário e não varia aleatoriamente. | **Bloqueado FE-02** e contratos de dose/histórico. |
| E2E-05 | Executar ações de perfil/senha/foto suportadas e recuperação de falha parcial de tratamento. | Operações mantêm contratos aprovados e nenhuma falha gera confirmação falsa ou duplicação. | **Bloqueado FE-04/FE-08**, por ação; exige ambiente controlado para injetar falhas. |

## Nonfunctional Cases

### NF-WEB-01: Accessibility and Responsive Design

**Input and steps**: executar os fluxos FN com teclado em 360, 768 e 1440px; conferir labels/nome acessível, ordem de tabulação, foco visível, foco em modal, zoom e contraste. Rodar auditoria automatizada na aplicação compilada e percurso manual com leitor de tela identificado.

**Expected outcome**: relatório por tela/estado com controles alcançáveis e conteúdo sem perda nas três larguras; diferenças de design identificadas; cada achado possui resultado e issue. Não declarar conformidade integral por auditoria automática. Se houver defeito preexistente de acessibilidade, registrar FE-09 e avaliar separadamente a correção, sem mudar layout ou texto sob rótulo de otimização.

### NF-WEB-02: Catalog Search Performance

**Input and steps**: usar catálogo versionado de 819990 bytes, identificar hash, commit, navegador, CPU/memória, viewport, SO, build e fuso. Medir separadamente download, parsing e busca com catálogo já carregado. Repetir a mesma sequência de dez consultas antes/depois, cobrindo vazia, sem resultado, termo comum, acento e nome completo; registrar cada amostra, método do relógio, aquecimento e condições de cache.

**Expected outcome**: resultados de UT-09/10 invariantes; tabela de amostras, mediana, p95, máximo e tempo de carga. Para dez amostras e método nearest-rank, p95 é a posição `ceil(0,95 × 10) = 10`, portanto o máximo da rodada. `p95 < 500 ms` é a **meta proposta já existente** em `docs/PLANO_TESTES.md`, não resultado medido nem meta nova aprovada nesta elaboração. Dez consultas não sustentam estimativa robusta de cauda nem evidência de escalabilidade de produção. Publicar dispersão e limitações.

### NF-WEB-03: Browser and Bundle Performance

**Input and steps**: compilar a mesma configuração de produção antes/depois; medir home, login, busca e lista com fixtures idênticas. Registrar tamanho de JS por rota, requests, parsing do catálogo, desempenho de navegação e relatório de ferramenta identificada, distinguindo cache frio/quente. Em cada condição, fazer cinco execuções separadas, guardar todas as amostras e mediana, sem escolher somente a melhor.

**Expected outcome**: baseline reproduzível e comparação antes/depois no mesmo ambiente; variação e regressões explicitadas. Qualquer ganho declarado cita a métrica e o custo correspondente. Não usar os 101 kB históricos como medição atual nem como experiência do usuário. Não declarar metas Core Web Vitals ou pontuação Lighthouse atendidas sem orçamento aprovado e medição correspondente; resultados locais não representam dados de campo.

### NF-WEB-04: Security and Data Exposure

**Input and steps**: após a task de minimização, injetar somente valores sintéticos reconhecíveis de senha, token, CPF e conteúdo de erro; percorrer login, erro, perfil, dose e logout. Inspecionar console, logs, storage, traces e capturas. Conferir dependências e auditoria com versões, data, comando, severidade, alcance e correção/justificativa. Testar 401 do cliente central e acesso sem sessão sem tocar produção.

**Expected outcome**: logs dos três fluxos corrigidos não contêm as sentinelas sensíveis, e evidências publicadas são sanitizadas. Inspeção de storage registra o token e o perfil locais como limites atuais; não exige retirar o token necessário ao fluxo nem presume minimização de `user_data`. Achados de dependências têm decisão rastreável. Não afirmar proteção completa contra XSS, validação de JWT, autorização backend ou sessão expirada com base nesses testes. Validar sessão continua dependente de FE-03. Auditoria não executada ou indisponível é registrada, nunca convertida em ausência de vulnerabilidades.

### NF-SCALE-01: Scalability Evidence and Limits

**Input and steps**: reproduzir NF-WEB-02/03 com o catálogo real e fixtures de 10, 100 e 1000 medicamentos/doses, limitadas ao navegador local. Medir carregamento, filtragem, renders relevantes, uso de memória quando a ferramenta o expuser e tempo por interação. Manter relógio, dados e ambiente fixos, repetir cinco execuções por volume e guardar mediana, máximo e amostras. Encerrar se o ambiente deixar de responder; registrar o limite observado em vez de extrapolar.

**Expected outcome**: relatório relaciona volume a custo, distingue catálogo completo de lista sintética e aponta gargalos/limites. Escala horizontal, capacidade de API/banco, concorrência multiusuário e disponibilidade permanecem **não comprovadas** sem experimento próprio em homologação autorizada. Download estático por CDN, divisão em camadas e tamanho de bundle são características arquiteturais, não resultados de carga. Não realizar teste de carga remoto nesta manutenção nem publicar promessa de capacidade sem evidência.

## Coverage and Acceptance Map

O relatório de cobertura deve medir **linhas, branches, funções e statements** em todo o código de aplicação `src`, incluindo arquivos sem execução e componentes não importados pelas suites. Arquivos não testados devem aparecer com cobertura ausente/zero segundo a ferramenta; não confundir isso com a cobertura global atual, ainda não medida.

Excluir somente tipos/declarações sem runtime e artefatos gerados sem código autoral, com lista de padrões, arquivos afetados e justificativa publicada. Não excluir páginas, providers, cliente HTTP ou módulos difíceis de testar para aumentar o percentual. Tests, fixtures e configuração de testes não entram no denominador da aplicação. Publicar relatório por arquivo, resumo das quatro métricas e formatos consultáveis, por exemplo HTML, JSON e LCOV.

Nenhum percentual mínimo foi definido pelo usuário. A primeira execução estabelece o baseline; o plano propõe impedir redução de cada uma das quatro métricas nas execuções seguintes com o mesmo escopo/ambiente. Um mínimo percentual fixo adicional exige decisão apoiada na medição, sem introduzi-lo como aprovado. Cobertura alta não substitui asserções sobre resultados nem aprova cenários bloqueados.

| Acceptance area | Case evidence | Coverage interpretation |
| --- | --- | --- |
| Preservar contratos HTTP e autenticação já implementada | UT-01 a UT-07; IT-01 a IT-03; FN-01/02/07 | Branches de sucesso, erro e ausência de token; sessão expirada não comprovada por esses casos. |
| Preservar busca, seleção e navegação | UT-09/10; IT-04/09; FN-03 | Componentes e funções alcançados, mais comparação de resultados antes/depois. |
| Preservar cálculo, formulário e payloads válidos | UT-11 a UT-13; IT-05; FN-03 | Limites temporais e validação precisam de asserções específicas, não somente linhas executadas. |
| Preservar confirmação de dose e filtros | IT-06/07; FN-04; E2E-02 | Mock comprova contrato do cliente; E2E comprova persistência real. |
| Preservar design e navegação em manutenção | FN-05/06; NF-WEB-01 | Capturas revisadas e gestos funcionais; cobertura de código sozinha não prova design. |
| Minimizar exposição de dados | IT-08; NF-WEB-04 | Ausência das sentinelas nos logs corrigidos; exposições de storage são registradas, sem troca do mecanismo de sessão. |
| Demonstrar otimização mensurada | IT-09; NF-WEB-02/03 | Invariantes funcionais e amostras antes/depois; ganho depende da medição real. |
| Documentar limites de escalabilidade | NF-SCALE-01 | Evidência por volume e ambiente, sem extrapolar cliente local para backend/produção. |
| Documentar cobertura e qualidade reais | `test:coverage` e registro de todas as suites | Quatro métricas, denominador, exclusões, falhas e bloqueios por commit. |
| Corrigir histórico, sessão, alertas, configurações e falha parcial | IT-10 a IT-14; FN-08; E2E-03 a E2E-05 | Correções externas ao escopo de otimização. Cobertura não as declara concluídas. |

| Requirement IDs | Checks | Concrete evidence |
| --- | --- | --- |
| DEP-01/02/03 | C1/C2/C3 | Inventário completo; npm ci; UT/IT/FN e capturas de regressão nas atualizações. |
| CODE-01/02 | C4/C5 | UT-09/10/14, IT-04/09 e FN-03/06. |
| SEC-01/02/03 | C6/C7/C8 | IT-08, sentinelas de console e comparação dos resultados anteriores; testes de apiRequest. |
| TEST-01 | C9 | UT-01 a UT-14; cada ID deve aparecer no relatório verbose. |
| TEST-02 | C10 | IT-01 a IT-14; IT-10 a IT-14 permanecem condicionais às correções/contratos identificados. |
| TEST-03/04 | C11/C12 | FN-01 a FN-08, E2E-01 a E2E-05 e status por caso bloqueado. |
| NF-01/02/03/04 | C13/C14/C15/C16 | NF-WEB-01/02/03/04 e NF-SCALE-01, com etapas manuais e amostras. |
| DOC-01/02/03/04/05/06 | C17 a C22 | Revisão dos seis documentos e rastreio aos relatórios/fontes/coverage. |
| CI-01 | C23 | Falha controlada e seleção sem testes com saídas não zero e evidência do job. |

A execução futura registra nome do teste e linha real de aprovação. Um comando com vários testes verdes não prova um critério ausente. TEST-02 não exige chamar um caso bloqueado de teste aprovado: antes da correção externa, C10 fica pendente com dependência registrada; a aprovação integrada só ocorre após todos os casos exigidos serem executáveis.

## Blocking Defects

| Existing issue | Evidence | Effect on acceptance |
| --- | --- | --- |
| [FE-02 / #26](https://github.com/MagalDevs/Front_MedReminder/issues/26) | Histórico gerado aleatoriamente e Fetch direto em `historico/HistoricoContent.tsx`. | Não aprovar histórico real ou isolamento baseado nesse histórico. |
| [FE-03 / #27](https://github.com/MagalDevs/Front_MedReminder/issues/27) | AuthContext presume autenticação pela presença de token. | Não aprovar sessão válida/expirada nem isolamento completo ao alternar contas. |
| [FE-04 / #28](https://github.com/MagalDevs/Front_MedReminder/issues/28) | PATCH perfil lê envelope incorreto; senha existe no backend, mas resultado/401 precisam de alinhamento; foto não possui rota. | Testar perfil/senha com os contratos atuais do adendo e manter foto como indisponível. |
| [FE-05 / #29](https://github.com/MagalDevs/Front_MedReminder/issues/29) | Alertas com timers sem limpeza e apenas um lembrete visível. | Não aprovar fila, cancelamento e confiabilidade de alertas simultâneos. |
| [FE-08 / #32](https://github.com/MagalDevs/Front_MedReminder/issues/32) | Tratamento com múltiplas gravações e possibilidade de falha parcial. | Não aprovar recuperação/idempotência nem concluir lote após falha. |

Não usar `skip`, `todo`, `expected failure` ou ajuste de expectativa para esconder cenário necessário. Se um caso bloqueado tiver teste implementado e falhar, preservar a falha e impedir a aprovação do escopo correspondente. Se ainda não for executável, registrá-lo como BLOQUEADO no relatório com motivo e dependência; não contá-lo como teste executado/aprovado.

## Evidence and Reporting

Usar `tests/REGISTRO_EXECUCAO.md` e criar evidências futuras em `docs/evidencias/<data>/`, sem sobrescrever as de 01/10/2026. Cada rodada registra commit frontend/API, data/fuso, ambiente/origem, versões Node/npm/navegador/SO, fixtures, comando ou passos, resultado esperado/observado, contagem selecionada/executada/aprovada/reprovada/bloqueada, duração, métricas, logs sanitizados, capturas e issue correspondente.

O relatório final separa resultados de unitários, integração, funcionais simulados, E2E real e não funcionais. Informa testes não executados, motivos, defeitos preexistentes e impacto de cada bloqueio. Nenhum grupo ausente aparece como aprovado. Mudanças de dependência, otimização e segurança devem apresentar seus testes e comparação antes/depois junto da tarefa que as implementou.

## Sources

- [User decisions](context.md): stack aprovada e preservação de lógica/design; specs em `docs`.
- [Test strategy](../../PLANO_TESTES.md): WEB-01 a WEB-09 e NF-WEB-01 a NF-WEB-04, incluindo meta proposta de busca.
- [Historical quality report](../../RELATORIO_QUALIDADE.md): resultados de 01/10/2026 e limitações existentes.
- [Backlog](../../BACKLOG.md): FE-01 a FE-15 e dependências externas.
- [Test execution template](../../../tests/REGISTRO_EXECUCAO.md): campos mínimos de evidência.
- Código atual: `src/app/utils/api.ts`, `contexts/AuthContext.tsx`, `contexts/lembreteContext.tsx`, `components/ProtectedRoute/ProtectedRoute.tsx`, `components/SearchBar/SearchBar.tsx`, `components/CardCadastrar/cardCadastrar.tsx`, `components/AlarmeDose/Lembrete.tsx`, `components/AlarmeDose/AlertaLembrete.tsx`, `login/page.tsx`, `novo-medicamento/page.tsx` e `meus-lembretes/MeusLembretesContent.tsx`.

O Graphify foi consultado antes da leitura estrutural. Seu índice do frontend corresponde ao HEAD acima. A ausência de ligação de teste no grafo foi confirmada pela inspeção da configuração e do diretório de testes; ela não foi tratada isoladamente como medição de cobertura.
