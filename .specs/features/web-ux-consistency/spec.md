# Web UX Consistency Specification

**Approved**: 2026-11-13 - user: "aprovado"
**Status:** Approved with the requested skills amendment
**Date:** 2026-11-13, America/Sao_Paulo
**Scope:** `Front_MedReminder` only; specification documents only in this request
**Sizing:** Large; Design and Tasks follow specification approval
**Frontend baseline:** `e0421835a34dceb6ad6f985dda5eee1fcd033c25`
**Decisions:** [context.md](context.md)

## Problem Statement

O web apresenta horários incompletos, frequência com significado contraditório, filtros sem efeito, edição com destino incorreto e barreiras de teclado e responsividade. A tarefa diária se perde entre formulários e elementos com o mesmo peso visual. Esta especificação corrige a experiência web com os contratos existentes e estabelece uma linguagem preparada para futura padronização com o mobile.

## Goals

- [ ] Tornar próxima dose, horário previsto, quantidade e estado reconhecíveis em Hoje.
- [ ] Eliminar a interpretação de intervalo em horas como número de tomadas ao dia.
- [ ] Tornar filtros, edição, confirmação e correção de registro demonstráveis em fluxos completos.
- [ ] Aplicar um sistema visual único a acesso, Hoje, Medicamentos, Histórico, Perfil e formulários.
- [ ] Permitir concluir os fluxos principais com teclado e em viewport de 320 CSS px.
- [ ] Preservar contratos HTTP, isolamento de identidade e idempotência já existentes.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Alterações em `medreminder-mobile` | user: "Somente o web: Front_MedReminder". A equivalência futura será documental. |
| Código, testes, DTOs, migrações, banco, CORS ou deploy do backend | A API é dependência de leitura; usar somente capacidades já existentes. |
| Implementação da aplicação nesta solicitação | O usuário solicitou criar as specs. Nenhuma aprovação de implementação foi dada. |
| Design técnico e plano de tarefas antes da aprovação desta spec | A skill exige aprovação dos requisitos antes dessas entregas. |
| Push, service worker, alertas garantidos em segundo plano e notificações nativas | Não fazem parte da capacidade verificada do cliente web. |
| Adiamento persistido, registro de horário real de ingestão e estados clínicos novos | O contrato de atualização da dose contém somente `tomado: boolean`. |
| Reagendamento de doses existentes ou substituição em massa de um tratamento | Não há operação atômica de edição do tratamento equivalente ao POST de criação. |
| Migração ou correção automática dos tratamentos antigos | O campo legado não permite reconstruir a intenção original de cada usuário. |
| Remoção de CPF, CEP, nascimento ou validade obrigatórios | Os DTOs atuais exigem esses dados. |
| Upload de foto de perfil e recuperação de senha sem sessão | Não há endpoints comprovados para essas capacidades. |
| Garantia de resolução de conflitos entre dispositivos ou transação conjunta de perfil e senha | O cliente não pode criar essas garantias. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Plataforma desta rodada | Somente o web; nenhum arquivo do mobile ou backend é alterado. | Resposta literal em `context.md`. | y, user explicit |
| Direção de produto | Hoje, Medicamentos, Histórico e Perfil; cadastro progressivo e identidade coerente. | user: "Sim, incluir a direção completa (recomendado)". | y, user explicit |
| Detalhes restantes | Regras deste documento definidas pelo agente dentro da API atual. | user: "Sim, defina as regras e documente os limites (recomendado)". | y, user delegated |
| Identidade visual | Preservar logotipo e Kantumruy; adotar `#0B6E71` como ação principal; rosa identifica a marca. | Direção derivada da crítica; contraste branco/primária de aproximadamente 6,03:1. | y, user delegated |
| Rascunho | Somente em memória da aba, isolado por usuário; preservado na navegação interna; eliminado ao sair da conta, trocar identidade ou recarregar. | Evita acrescentar persistência de dados de saúde no dispositivo. A interface informa o limite antes de iniciar. | y, user delegated |
| Frequência nova | Agenda gerada define os horários. `quantidadeDiaria = ceil(24 / intervaloHoras)` representa o limite superior de administrações em 24 horas; nunca é usada para reconstruir a agenda. | O DTO exige inteiro positivo e não contém `intervaloHoras`. Intervalos que não dividem 24 continuam permitidos; a interface mostra o intervalo real, sem prometer quantidade fixa por dia. | y, user delegated; DTO checked |
| Frequência antiga | Mostrar os horários registrados; não traduzir `quantidadeDiaria` legado em intervalo ou frequência. | Registros antigos podem ter sido gravados com o significado incorreto. | y, user delegated |
| Relógio | Datas e horas usam o fuso IANA atual do navegador, visível na revisão. Dia corresponde a meia-noite local até a próxima meia-noite local. | Não existe preferência persistida de fuso no contrato. | y, user delegated |
| Duração e recorrência | Intervalo em horas decorridas; duração em dias de 24 horas; semana = 7 dias; mês = 30 dias, com indicação explícita. Fim exclusivo. | Regra única e testável; não depende de calendário mensal implícito. | y, user delegated |
| Edição existente | Editar identificação/estoque e observações; horário, intervalo, duração e quantidade por dose ficam somente leitura. | PUT de remédio não reagenda doses de forma atômica; modificar dose do remédio afetaria a representação do histórico. | y, user delegated |
| Correção de dose | Ação explícita em dose registrada; confirmação nominal; PUT com `tomado:false`. | O DTO e o serviço atuais aceitam ambos os booleanos. Não altera a agenda. | y, user delegated; source checked |
| Foto e recuperação sem sessão | Ocultar ações sem contrato; mostrar avatar com iniciais. Não inventar suporte ou canais de contato. | Não há endpoint comprovado. Troca autenticada de senha permanece disponível. | y, user delegated; source checked |
| Referências visuais | Nenhuma captura vinculante foi fornecida. O comportamento e o design system futuro orientam a avaliação. | A crítica anterior é fonte textual, não imagem de resultado esperado. | y, request checked |

**Open questions:** none. Escopo e direção foram respondidos; os demais comportamentos foram delegados e definidos acima. O usuário aprovou a especificação com o adendo de skills registrado em Required Skills and Plugin.

## Required Skills and Plugin

O responsável por projetar, implementar e verificar esta feature deve utilizar os recursos abaixo. Estas instruções orientam o agente ou desenvolvedor executor; não são requisitos de uso para a pessoa que utiliza o MedReminder e não aparecem na interface do produto.

| Resource | Source | Required use |
| --- | --- | --- |
| `tlc-spec-driven` | [SKILL.md](C:/Users/danie/.codex/skills/tlc-spec-driven/SKILL.md) | Conduzir Design, Tasks e Execute a partir desta spec aprovada, com tarefas atômicas, critérios rastreados, aprovação de Tasks e validação independente conforme a skill. |
| `frontend-design` | [SKILL.md](C:/Users/danie/.codex/skills/frontend-design/SKILL.md) | Definir a composição, hierarquia, tipografia, tokens e linguagem visual de cada tela; revisar a direção contra o produto antes da implementação. |
| Plugin `taste-skill`, skill `design-taste-frontend` | [SKILL.md, versão 2.5.1](C:/Users/danie/.codex/plugins/cache/taste-skill/taste-skill/2.5.1/skills/taste-skill/SKILL.md) | Aplicar sua revisão de qualidade visual, clareza de texto, coerência de componentes e verificação do resultado renderizado, respeitando a aplicabilidade de cada orientação às telas deste aplicativo. |
| `transitions-dev` | [SKILL.md local](../../../.agents/skills/transitions-dev/SKILL.md); entrada em [skills-lock.json](../../../skills-lock.json) | Consultar os padrões de transição ao implementar mudanças visuais de estado previstas para menus, diálogos, etapas, abas, carregamento e feedback; selecionar somente receitas pertinentes à interação. |
| `transitions-polish` | [SKILL.md local](../../../.agents/skills/transitions-polish/SKILL.md); entrada em [skills-lock.json](../../../skills-lock.json) | Revisar as transições existentes ou implementadas e alinhar duração, easing, distância, escala e blur ao uso de cada interação, incluindo movimento reduzido. |

### Locked Frontend Skills

O inventário foi conferido em `Front_MedReminder/skills-lock.json`, formato versão 2, em 2026-11-13. Todas as skills de front-end atualmente presentes nesse arquivo estão incluídas acima.

| Skill | Locked source | skillPath | computedHash |
| --- | --- | --- | --- |
| `transitions-dev` | `Jakubantalik/transitions.dev` (`github`) | `skills/transitions-dev/SKILL.md` | `c7bc25bf1998615c73188bfcef6deca06c43f1b6f64538a456d446ca9d3911cd` |
| `transitions-polish` | `Jakubantalik/transitions.dev` (`github`) | `skills/transitions-polish/SKILL.md` | `37a0842bfb0d9778b9a01fdd83947749476a9549addc60b31c9b8bfe2b2d9aae` |

Os hashes acima são os valores registrados no lock; não são uma declaração de auditoria do conteúdo instalado. O executor deve conferir o lock e a disponibilidade dos respectivos `SKILL.md` ao retomar o trabalho, sem substituir versões ou instalar atualizações como efeito desta feature.

### Application Order and Compatibility

1. Em Design, ler `tlc-spec-driven`, `frontend-design` e `design-taste-frontend`; registrar como as orientações se aplicam às telas e ao design system desta spec.
2. Em Tasks, indicar os recursos relevantes em cada tarefa e manter a prova de cada critério de aceite. A aprovação desta spec não substitui a aprovação do plano de tarefas.
3. Em Execute, carregar `transitions-dev` antes de implementar transições pertinentes e `transitions-polish` para revisar os movimentos. A leitura das duas skills é obrigatória; instalar todas as animações de seu catálogo não é um objetivo.
4. Na revisão, registrar quais skills foram utilizadas, os resultados das verificações aplicáveis e as limitações observadas. Não apresentar um checker ou gate não executado como aprovado.
5. As decisões explícitas do usuário e os requisitos desta spec prevalecem sobre padrões genéricos das skills. Preservar logotipo, Kantumruy, paleta e estrutura funcional aprovados. As regras de site promocional do plugin não autorizam impor seções de uma tela inteira às listas/formulários, acrescentar efeitos decorativos ou converter este aplicativo Next.js para export estático.
6. A movimentação deve comunicar interação ou estado e respeitar ACCESS-09. Nenhuma receita pode atrasar registro de dose, ocultar informação essencial ou prejudicar teclado, foco e legibilidade.
7. Se um recurso estiver ausente ou incompatível, registrar o problema e seu impacto antes da etapa dependente; não omitir silenciosamente seu uso nem ampliar o escopo para backend ou mobile.

Este adendo é uma instrução de processo solicitada pelo usuário. Os 91 critérios funcionais e de qualidade do produto permanecem os mesmos.

## Product Rules

### Vocabulary

| Term | Meaning |
| --- | --- |
| Medicamento | Item cadastrado e seus dados de identificação/estoque. |
| Tratamento | Medicamento e conjunto de doses planejadas gerados na criação. |
| Dose | Ocorrência com ID, instante previsto e booleano de confirmação. |
| Lembrete | Apresentação de uma dose na interface; não comprova notificação entregue. |
| Programada | Dose não registrada com instante maior que o relógio atual. |
| Pendente | Dose não registrada cujo instante é exatamente o relógio atual. |
| Atrasada | Dose não registrada cujo instante é menor que o relógio atual. |
| Registrada | Dose com `tomado:true`, independentemente do instante previsto. |

Os estados descrevem o registro no aplicativo. A interface não afirma que o medicamento foi ingerido e não recomenda dose, compensação ou mudança de tratamento.

### Time and Input Examples

- Com relógio fixo em `2026-11-13T12:00:00-03:00`, uma dose às 11:00 sem confirmação é Atrasada; às 12:00 é Pendente; às 13:00 é Programada.
- Início `2026-11-13T08:00:00-03:00`, intervalo de 6 horas e duração de 1 dia geram 08:00, 14:00, 20:00 e 02:00 do dia seguinte. O instante final às 08:00 do dia seguinte não pertence ao lote. `quantidadeDiaria` é 4.
- Intervalo de 5 horas gera instantes separados por 5 horas decorridas e envia `quantidadeDiaria:5`; a interface exibe “A cada 5 horas”, sem afirmar “5 vezes ao dia”.
- `1,5` e `1.5` representam o mesmo número decimal positivo; `1,5 mg` é exibido ao usuário e `1.5 mg` é a string canônica no transporte. `1,5` nunca se transforma em `15`.
- Datas sem hora recebidas do legado exibem “Horário não informado”; não recebem um horário inventado nem uma ação de confirmação na visão diária.

### Input and Filter Bounds

| Input / control | Defined behavior |
| --- | --- |
| Dosagem | Decimal positivo finito com um único separador opcional; sem expoente ou agrupamento de milhar; quantidade e unidade juntas limitadas aos 50 caracteres aceitos no contrato. |
| Intervalo em horas | Inteiro positivo seguro; geração termina no limite de 1001 ocorrências para detectar lote excedente sem alocação ilimitada. |
| Quantidade da caixa | Inteiro positivo seguro. Unidade da caixa não altera a quantidade por dose. |
| Duração | Inteiro positivo seguro; conversão de unidade também deve resultar em inteiro seguro e data final válida. |
| Nome, classificação, motivo e observação | Limites de 150, 255, 255 e 255 caracteres, respectivamente. Observação permanece opcional. Classificação e motivo mantêm os valores padrão já aceitos na integração quando não preenchidos. |
| Validade | Data de calendário obrigatória na criação; sem normalização de dia inexistente. Data sem hora não sofre deslocamento de dia por UTC. |
| Foto de medicamento | Preservar o campo e o formato URL da integração existente; nenhuma nova capacidade de upload é acrescentada. Imagem que não carrega recebe representação visual neutra com nome do medicamento. |
| Nome nos filtros | Busca parcial, com espaços externos removidos, indiferente a maiúsculas e acentos. |
| Classificação nos filtros | Correspondência exata à opção selecionada; opção Todas não restringe. |
| Validade nos filtros | Vencidos: data anterior a hoje; Próximos 30 dias: hoje até hoje + 30 dias inclusive; Demais válidos: após esse intervalo; Sem data: ausente ou inválida. Categorias não se sobrepõem. |
| Período do Histórico | Padrão Todo o histórico até agora; Hoje começa na meia-noite local; Últimos 7 dias começa na meia-noite de seis dias atrás; Últimos 30 dias começa na meia-noite de 29 dias atrás. Todos terminam no relógio atual, inclusive. |
| Estado no Histórico | Todos, Registradas e Não registradas. Não registradas inclui Pendente e Atrasada; filtros de medicamento usam ID. |

Estes limites dão conteúdo aos critérios FORM-04, FORM-07, FORM-08, FORM-13, MED-01 e DAY-07. Não autorizam inferir prescrições nem alterar os DTOs.

## User Stories

### P1: Navigate the daily routine

**User Story:** Como pessoa que acompanha medicamentos, quero encontrar Hoje, Medicamentos, Histórico e Perfil com os mesmos nomes para retomar minha rotina sem procurar destinos.

**Why P1:** A navegação atual comprime a tarefa em telas pequenas e oferece destinos inconsistentes.

**Acceptance Criteria**:

1. WHEN a pessoa autenticada conclui o login sem destino pendente THEN the web client SHALL abrir Hoje. [NAV-01]
2. WHEN a pessoa seleciona Hoje, Medicamentos, Histórico ou Perfil THEN the web client SHALL mostrar a tela correspondente com o destino atual identificado por texto e estado acessível. [NAV-02]
3. WHEN um visitante abre a página inicial THEN the web client SHALL apresentar o propósito “Organize seus medicamentos e acompanhe os horários das doses.” antes da ação principal “Criar conta”. [NAV-03]
4. WHEN um visitante usa Entrar THEN the web client SHALL abrir o login preservando o destino interno previamente solicitado. [NAV-04]
5. WHEN a pessoa usa um endereço legado de medicamentos, lembretes, histórico ou configurações THEN the web client SHALL manter acesso ao conteúdo equivalente sem erro 404. [NAV-05]
6. IF uma rota protegida é aberta sem sessão validada THEN the web client SHALL exigir login antes de permitir preenchimento de tratamento ou exibir dados privados. [NAV-06]
7. WHEN a pessoa segue um destino de retorno após autenticar THEN the web client SHALL aceitar somente caminhos relativos internos pertencentes às telas do produto. [NAV-07]
8. WHEN a pessoa usa o menu em viewport estreito THEN the web client SHALL permitir abrir, fechar e retornar ao conteúdo sem sobreposição do título ou deslocamento horizontal da página. [NAV-08]

**Independent Test:** Abrir como visitante, autenticar com fixture, visitar os quatro destinos e os URLs legados; repetir a 390 x 844 e por teclado.

### P1: Understand today's doses and history

**User Story:** Como pessoa com doses registradas, quero distinguir o que está previsto e o que já registrei para saber minha próxima ação.

**Why P1:** Nome e data sem horário não sustentam a tarefa principal.

**Acceptance Criteria**:

1. WHEN a pessoa abre Hoje THEN the web client SHALL listar as doses do dia local ordenadas pelo instante previsto crescente, com desempate por ID. [DAY-01]
2. WHEN uma dose é apresentada THEN the web client SHALL exibir nome do medicamento, quantidade com unidade, data, hora prevista em HH:mm e estado conforme Product Rules. [DAY-02]
3. WHEN há doses Programadas no dia THEN the web client SHALL identificar como próxima dose a de menor instante futuro, sem ocultar as doses Atrasadas. [DAY-03]
4. WHEN o relógio cruza um horário previsto ou meia-noite local com a página visível THEN the web client SHALL recalcular os estados e o conjunto do dia em até um segundo, recalculando também ao retomar uma aba oculta antes de aceitar registro. [DAY-04]
5. WHEN Hoje recebe lista vazia com sucesso THEN the web client SHALL exibir “Nenhuma dose prevista para hoje” com ações para Histórico e Adicionar medicamento. [DAY-05]
6. WHEN a pessoa abre Histórico THEN the web client SHALL apresentar doses até o relógio atual em ordem decrescente, com a data explicitamente rotulada como horário previsto. [DAY-06]
7. WHEN a pessoa aplica período, medicamento e estado no Histórico THEN the web client SHALL mostrar a interseção dos filtros e a contagem do conjunto filtrado, independentemente da página carregada. [DAY-07]
8. IF uma dose tem data inválida, ausência de relação ou data sem hora THEN the web client SHALL mostrá-la em uma seção “Dados incompletos”, sem inventar horário, medicamento ou ação de registro. [DAY-08]
9. WHEN a listagem usa resposta paginada THEN the web client SHALL calcular contagens e próxima dose somente sobre um conjunto completo do período ou rotulá-los como parciais até concluir a carga. [DAY-09]

**Independent Test:** Fixtures com dois medicamentos, datas de ontem/hoje/amanhã, mesmos instantes, booleanos distintos, mais de 100 doses e dados incompletos; relógio e fuso fixos.

### P1: Manage medications with truthful controls

**User Story:** Como pessoa que mantém meus medicamentos, quero filtrar, consultar, editar e excluir o item correto com resultados previsíveis.

**Why P1:** Filtros inativos e edição que abre lembretes quebram a confiança.

**Acceptance Criteria**:

1. WHEN a pessoa combina nome, classificação e validade THEN the web client SHALL listar somente medicamentos que satisfazem os três filtros. [MED-01]
2. WHEN a pessoa usa Limpar filtros THEN the web client SHALL restabelecer a lista sem filtros e sua contagem. [MED-02]
3. WHEN filtros não encontram resultados THEN the web client SHALL distinguir esse estado da ausência de medicamentos cadastrados e oferecer Limpar filtros. [MED-03]
4. WHEN a pessoa usa Ver horários de um medicamento THEN the web client SHALL abrir suas doses com filtro pelo ID do medicamento selecionado. [MED-04]
5. WHEN a pessoa usa Editar medicamento THEN the web client SHALL abrir um formulário preenchido do item selecionado, sem navegar para a lista de doses. [MED-05]
6. WHEN a pessoa salva a edição THEN the web client SHALL enviar somente nome, classificação, quantidadeCaixa, dataValidade, cor, motivo e observacao alterados pelo usuário, por PUT do ID existente. [MED-06]
7. WHILE a pessoa edita um medicamento existente the web client SHALL apresentar primeira dose, intervalo, duração, unidade e quantidade por dose como somente leitura com a explicação “Esta edição não altera os horários das doses”. [MED-07]
8. WHEN a pessoa solicita excluir THEN the web client SHALL pedir confirmação com o nome do medicamento e informar que a operação também remove suas doses, conforme o serviço existente. [MED-08]
9. WHEN a pessoa cancela a exclusão THEN the web client SHALL manter o item e todas as doses sem realizar requisição de exclusão. [MED-09]
10. IF a exclusão falha THEN the web client SHALL manter o item visível com ação de nova tentativa sem anunciar sucesso. [MED-10]

**Independent Test:** Lista sintética com vencido, vencimento hoje, próximos 30 dias, validade posterior e sem data; edição com inspeção do payload; cancelamento, sucesso e falha de exclusão.

### P1: Create and review a treatment

**User Story:** Como pessoa cadastrando um tratamento, quero informar os dados progressivamente e conferir os horários antes de salvar.

**Why P1:** A clareza de dose, intervalo e resultado prevalece sobre o acabamento do formulário.

**Acceptance Criteria**:

1. WHEN a pessoa inicia Adicionar medicamento THEN the web client SHALL oferecer as etapas Medicamento, Tratamento e Revisão com identificação textual da etapa atual. [FORM-01]
2. WHEN a pessoa busca no catálogo THEN the web client SHALL permitir selecionar um resultado ou seguir com cadastro manual quando não houver correspondência. [FORM-02]
3. WHEN a pessoa seleciona um resultado THEN the web client SHALL preencher nome e classificação sem substituir dados de tratamento já digitados sem confirmação. [FORM-03]
4. IF a pessoa tenta avançar com um campo obrigatório inválido THEN the web client SHALL manter a etapa e focar o primeiro campo inválido com mensagem associada. [FORM-04]
5. WHEN a pessoa retorna à etapa anterior THEN the web client SHALL preservar os valores do rascunho da mesma identidade. [FORM-05]
6. WHEN a pessoa informa dosagem decimal positiva com vírgula ou ponto THEN the web client SHALL preservar o valor numérico conforme Time and Input Examples. [FORM-06]
7. IF a dosagem contém zero, negativo, notação exponencial, separadores mistos ou texto não numérico THEN the web client SHALL rejeitar a entrada com orientação “Informe uma quantidade maior que zero, usando vírgula ou ponto para decimais”. [FORM-07]
8. WHEN a pessoa informa primeira dose, intervalo e duração válidos THEN the web client SHALL gerar os instantes conforme as regras de duração e recorrência de Assumptions & Open Questions. [FORM-08]
9. WHEN o cliente prepara um novo tratamento THEN the web client SHALL enviar `quantidadeDiaria` como `ceil(24 / intervaloHoras)` e `quantidadeDias` como duração total convertida em dias. [FORM-09]
10. WHEN uma tela apresenta tratamento legado THEN the web client SHALL usar horários efetivamente cadastrados em vez de traduzir `quantidadeDiaria` em “x ao dia” ou intervalo. [FORM-10]
11. WHEN a pessoa chega à Revisão THEN the web client SHALL mostrar medicamento, dose/unidade, intervalo, início, fim exclusivo, total de doses e fuso utilizado com acesso à lista completa de instantes. [FORM-11]
12. WHEN a pessoa escolhe semana ou mês como duração THEN the web client SHALL explicitar a conversão para 7 ou 30 dias antes da revisão. [FORM-12]
13. IF os parâmetros geram zero, mais de 1000 doses, instantes duplicados ou datas normalizadas pelo relógio THEN the web client SHALL impedir o envio e identificar o parâmetro a corrigir. [FORM-13]
14. WHEN a pessoa confirma Salvar tratamento na Revisão THEN the web client SHALL usar o POST `/tratamento` existente com uma chave de idempotência por identidade e conteúdo, sem criar remédio e doses em chamadas separadas. [FORM-14]
15. WHEN o contrato confirma o tratamento completo THEN the web client SHALL apresentar resumo persistente no destino com medicamento e primeira dose criada, sem alert bloqueante seguido de tela vazia. [FORM-15]
16. IF o tratamento foi confirmado mas a atualização da lista falha THEN the web client SHALL mostrar “Tratamento salvo. Não foi possível atualizar a lista.” com ação para atualizar, sem reenviar a criação. [FORM-16]
17. IF o catálogo não pode ser carregado THEN the web client SHALL oferecer cadastro manual sem exigir escolha de um resultado indisponível. [FORM-17]

**Independent Test:** Casos de 6 e 5 horas acima, 1/1000/1001 doses, `1,5`, fim exclusivo, fuso com transição, volta entre etapas, timeout com resultado incerto e sucesso seguido de falha de leitura.

### P1: Register and correct a dose

**User Story:** Como pessoa usando Hoje e Histórico, quero registrar uma dose e corrigir um toque acidental sem perder a referência do horário previsto.

**Why P1:** O registro deve ser explícito, recuperável e coerente com o servidor.

**Acceptance Criteria**:

1. WHEN a pessoa vê uma dose Pendente ou Atrasada com dados completos THEN the web client SHALL oferecer Registrar dose com nome e horário no nome acessível da ação. [DOSE-01]
2. WHILE uma dose está Programada the web client SHALL mantê-la visível sem permitir registro antecipado nesta interface. [DOSE-02]
3. WHEN a pessoa usa Registrar dose THEN the web client SHALL enviar PUT `/dose/:id` com corpo restrito a `{tomado:true}`. [DOSE-03]
4. WHEN o servidor confirma o registro THEN the web client SHALL apresentar o estado Registrada na mesma dose e atualizar os totais derivados. [DOSE-04]
5. WHEN a pessoa usa Corrigir registro em uma dose Registrada THEN the web client SHALL pedir confirmação com medicamento e horário previsto antes de enviar `{tomado:false}` ao mesmo endpoint. [DOSE-05]
6. WHEN o servidor confirma a correção THEN the web client SHALL recalcular o estado da dose pelo relógio atual sem alterar seu instante previsto. [DOSE-06]
7. IF registro ou correção falha THEN the web client SHALL manter o último estado confirmado com mensagem e ação de nova tentativa. [DOSE-07]
8. WHILE há mutação pendente para uma dose the web client SHALL bloquear novas mutações dessa dose sem bloquear ações de outros itens. [DOSE-08]
9. WHEN a pessoa fecha o lembrete sobreposto existente THEN the web client SHALL fechar somente a apresentação, sem registrar, corrigir ou adiar a dose no servidor. [DOSE-09]

**Independent Test:** Registrar dose devida, rejeitar gesto antecipado, corrigir com confirmação/cancelamento, simular rede interrompida e verificar um único envio por item.

### P1: Sign in, create an account and manage profile

**User Story:** Como pessoa acessando minha conta, quero campos claros, retorno ao destino solicitado e resultados separados para dados e senha.

**Why P1:** A padronização deve incluir os pontos de entrada e a manutenção da conta.

**Acceptance Criteria**:

1. WHEN a pessoa abre o cadastro THEN the web client SHALL organizar os campos exigidos nas etapas Conta e Dados pessoais com resumo das informações obrigatórias antes de enviar. [ACCOUNT-01]
2. WHILE o cadastro é preenchido the web client SHALL manter nome, email, CPF, CEP, nascimento, senha e cuidador compatíveis com os DTOs existentes, sem dados fictícios para contornar obrigatoriedade. [ACCOUNT-02]
3. WHEN o cadastro recebe data futura, CPF com quantidade diferente de 11 dígitos ou CEP com quantidade diferente de 8 dígitos THEN the web client SHALL impedir o envio e indicar o campo. [ACCOUNT-03]
4. WHEN a pessoa usa Mostrar senha THEN the web client SHALL alternar a visibilidade com nome e estado acessíveis sem alterar o valor digitado. [ACCOUNT-04]
5. WHEN a pessoa altera apenas dados pessoais no Perfil THEN the web client SHALL chamar PATCH `/usuario/me` somente com os campos permitidos alterados, preservando o comportamento de omissão dos opcionais. [ACCOUNT-05]
6. WHEN a pessoa altera a senha autenticada THEN the web client SHALL enviar senha atual e nova senha somente ao endpoint existente, sem armazenar senhas no rascunho. [ACCOUNT-06]
7. IF o perfil foi salvo e a alteração de senha falha THEN the web client SHALL comunicar os dois resultados separadamente sem afirmar sucesso da senha. [ACCOUNT-07]
8. WHILE não existe contrato comprovado de foto de perfil ou recuperação sem sessão the web client SHALL omitir essas ações sem apresentar botões que falham ou rotas fictícias. [ACCOUNT-08]

**Independent Test:** Cadastro inválido/valido com API interceptada, mostrar/ocultar senha, PATCH permitido, falha parcial e ausência de requisições a capacidades não suportadas.

### P1: Use one visual system across the web

**User Story:** Como pessoa que alterna telas, quero reconhecer ações, campos e estados sem reaprender padrões a cada página.

**Why P1:** Os tons, componentes e pesos atuais não formam um sistema suficientemente consistente.

**Acceptance Criteria**:

1. The web client SHALL aplicar uma única família tipográfica de interface Kantumruy com fallback sans-serif nas telas do escopo. [SYSTEM-01]
2. The web client SHALL usar tokens semânticos únicos para ação primária, texto, superfície, borda, foco, erro, alerta e sucesso. [SYSTEM-02]
3. The web client SHALL reservar o rosa à identidade da marca e os estados a tokens distintos, sem usar a cor identificadora do medicamento como estado de erro ou sucesso. [SYSTEM-03]
4. WHEN a mesma ação semântica aparece em telas diferentes THEN the web client SHALL apresentar o mesmo componente de botão e os mesmos estados default, hover, focus, disabled e loading. [SYSTEM-04]
5. WHEN um campo tem erro THEN the web client SHALL apresentar mensagem textual associada sem depender somente de cor ou placeholder. [SYSTEM-05]
6. WHEN a interface apresenta uma ação secundária THEN the web client SHALL diferenciá-la da ação principal sem reduzir seu contraste de texto abaixo do critério de acessibilidade. [SYSTEM-06]
7. The web client SHALL manter uma especificação de tokens e componentes em `DESIGN.md` com correspondência conceitual futura para mobile, sem exigir alteração desse aplicativo. [SYSTEM-07]
8. The web client SHALL apresentar carga, vazio inicial, ausência por filtro, erro recuperável e sucesso com o mesmo vocabulário e padrão de feedback entre as telas. [SYSTEM-08]
9. WHEN a pessoa abre Perfil THEN the web client SHALL priorizar dados pessoais e segurança sobre elementos de personalização sem contrato, mantendo os grupos identificados por títulos. [SYSTEM-09]

**Independent Test:** Comparar as telas e os estados com fixtures nos mesmos viewports; verificar estilos calculados e nomes semânticos. A implementação deve gerar evidências visuais nas dimensões reais, sem redimensionar imagens depois.

### P1: Complete the main flows accessibly

**User Story:** Como pessoa usando teclado, ampliação ou leitor de tela, quero concluir as mesmas tarefas que uma pessoa usando mouse.

**Why P1:** Busca, campos e menu atuais interrompem essa equivalência.

**Acceptance Criteria**:

1. The web client SHALL dar nome acessível associado a cada campo, botão, seletor e controle de navegação do escopo. [ACCESS-01]
2. WHEN a pessoa usa a busca por teclado THEN the web client SHALL permitir abrir sugestões, percorrê-las por setas, selecionar por Enter e fechar por Escape com semântica de combobox/listbox. [ACCESS-02]
3. WHEN a pessoa escolhe uma cor THEN the web client SHALL oferecer grupo de opções nomeadas com estado selecionado anunciado e operação por teclado. [ACCESS-03]
4. WHILE um menu está fechado the web client SHALL excluir seu conteúdo da navegação por teclado e da árvore acessível. [ACCESS-04]
5. WHEN a pessoa fecha menu sobreposto ou diálogo THEN the web client SHALL devolver o foco ao controle que o abriu. [ACCESS-05]
6. The web client SHALL manter contraste de texto comum de pelo menos 4,5:1 e de texto grande de pelo menos 3:1 nos estados disponíveis. [ACCESS-06]
7. The web client SHALL fornecer indicador de foco visível e área de acionamento de pelo menos 44 x 44 CSS px para botões e opções de cor. [ACCESS-07]
8. WHEN o viewport é 320 x 568, 390 x 844, 768 x 1024 ou 1440 x 900 THEN the web client SHALL permitir usar os formulários sem rolagem horizontal da página ou controles encobertos. [ACCESS-08]
9. WHEN a pessoa amplia texto a 200% ou utiliza preferência de movimento reduzido THEN the web client SHALL preservar acesso ao conteúdo e às ações sem depender de animação. [ACCESS-09]
10. WHILE um diálogo ou menu modal está aberto the web client SHALL manter o foco em seus controles, permitindo encerramento por Escape sem confirmar uma ação destrutiva. [ACCESS-10]

**Independent Test:** Fluxo de cadastro/tratamento/registro com teclado; leitor de tela; estilos calculados; largura 320 e 390; zoom de texto; foco durante abertura e fechamento; preferência de movimento reduzido.

### P1: Recover from interruptions and request failures

**User Story:** Como pessoa interrompida ou com conexão instável, quero reconhecer o resultado e retomar o que ainda não foi confirmado.

**Why P1:** Um resultado incerto não pode virar registro duplicado, sucesso falso ou dados de outra conta.

**Acceptance Criteria**:

1. WHEN uma leitura falha THEN the web client SHALL exibir ação Tentar novamente que repete somente a leitura sem reenviar mutações. [STATE-01]
2. WHILE uma região está carregando the web client SHALL anunciar o estado de carga sem substituir dados de erro por um vazio de sucesso. [STATE-02]
3. WHEN a pessoa navega internamente durante um cadastro de medicamento THEN the web client SHALL preservar o rascunho em memória para a mesma identidade conforme a política declarada. [STATE-03]
4. WHEN ocorre logout, troca de identidade ou expiração confirmada THEN the web client SHALL eliminar rascunhos e dados privados da identidade anterior. [STATE-04]
5. WHEN a pessoa inicia o cadastro de medicamento THEN the web client SHALL informar “O rascunho é mantido nesta aba enquanto você navega. Recarregar ou fechar a aba descarta o preenchimento.”. [STATE-05]
6. IF uma resposta chega depois da troca de identidade ou de uma solicitação mais recente da mesma listagem THEN the web client SHALL descartá-la sem alterar o estado visível atual. [STATE-06]
7. IF o POST de tratamento termina sem resultado confirmado THEN the web client SHALL manter o formulário e a chave em memória para nova tentativa manual do mesmo conteúdo, sem anunciar falha definitiva ou criar chave nova automaticamente. [STATE-07]
8. IF uma operação retorna HTTP 429 com Retry-After válido THEN the web client SHALL informar a espera e impedir nova tentativa da mesma operação até o prazo, sem criar repetição automática. [STATE-08]
9. IF a atualização de senha retorna 401 operacional THEN the web client SHALL reutilizar a política existente de revalidação única da sessão, distinguindo senha incorreta de sessão expirada. [STATE-09]
10. WHILE a sessão está em restauração ou falhou por rede the web client SHALL mostrar verificação pendente ou indisponível sem declarar o token expirado somente por essa falha. [STATE-10]
11. WHILE uma criação de tratamento tem resultado incerto the web client SHALL impedir alteração do conteúdo daquela intenção, oferecendo tentar a mesma intenção novamente ou consultar os registros sem gerar nova criação automaticamente. [STATE-11]

**Independent Test:** Respostas fora de ordem, troca de conta com requisição pendente, timeout antes/depois do commit simulado, leitura falhando após criação, 429 e falha operacional de senha. Os cenários usam API controlada e dados sintéticos.

## Edge Cases

As situações abaixo apontam para os critérios que as definem; não criam critérios duplicados.

| Case | Expected outcome | Requirement |
| --- | --- | --- |
| Meia-noite, dose exatamente agora e fuso diferente | Estados e pertencimento ao dia seguem relógio/fuso declarado | DAY-01, DAY-02, DAY-04 |
| Dose somente com data ou relação ausente | Dados incompletos; sem horário ou nome inventado | DAY-08 |
| Mais de uma página ou mais de 100 doses | Totais corretos ou explicitamente parciais | DAY-09 |
| Dois remédios de mesmo nome | Filtro de destino pelo ID, não pelo nome | MED-04 |
| Validade ausente legada | Categoria Sem data; não classificar automaticamente como vencido | MED-01 |
| Validade hoje | Válido até o fim da data local; Próximos 30 dias inclui hoje até hoje + 30 dias | MED-01 |
| Nome longo e muitas cores | Quebra de linha sem encobrir controles | ACCESS-07, ACCESS-08 |
| Quantidade decimal, múltiplos separadores e expoente | Valor preservado ou rejeição específica, sem remoção silenciosa | FORM-06, FORM-07 |
| Intervalo inteiro <= 0, duração <= 0, overflow ou horário inexistente | Erro de campo; envio impedido | FORM-04, FORM-08, FORM-13 |
| Lote de 1000 e de 1001 doses | Primeiro aceito; segundo bloqueado antes do POST | FORM-13 |
| Timeout de criação e lista indisponível após sucesso | Retomada idempotente ou atualização de leitura, conforme resultado conhecido | FORM-16, STATE-07 |
| Clique duplo de registro e correção cancelada | Uma mutação por dose; cancelamento não altera booleano | DOSE-05, DOSE-08 |
| Reload ou fechamento no meio do rascunho | Sem promessa de recuperação; não reenviar automaticamente | STATE-05, STATE-07 |
| Resposta de outra identidade | Descartada; dados anteriores limpos | STATE-04, STATE-06 |

## Implicit Requirement Dimensions

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | FORM-04, FORM-06 a FORM-13, ACCOUNT-02 e ACCOUNT-03; respeitar limites DTO citados em Sources. |
| Failure / partial failure | FORM-16, MED-10, ACCOUNT-07, STATE-01 e STATE-07. Criação mantém endpoint atômico existente. |
| Idempotency / retry / duplicate | FORM-14, DOSE-08, STATE-01, STATE-07, STATE-08 e STATE-11; sem retries automáticos. |
| Auth boundaries & rate limits | NAV-06, NAV-07, STATE-04, STATE-08 a STATE-10. Autorização de ownership continua no servidor existente. |
| Concurrency / ordering | DAY-01, DAY-06, DOSE-08 e STATE-06. N/A para bloqueio distribuído porque não será alterado o servidor. |
| Data lifecycle / expiry | Política de memória, STATE-03 a STATE-05; exclusão nominal MED-08 e MED-09. |
| Observability | N/A para telemetria nova porque a solicitação é UX no cliente. Preservar sanitização existente; testes não registram tokens, senhas ou dados reais. |
| External dependency failure | FORM-02, STATE-01, STATE-07 a STATE-10; catálogo indisponível permite preenchimento manual. |
| State transition integrity | Product Rules, DOSE-01 a DOSE-08, FORM-15 e FORM-16; sem novos estados persistidos. |

## Verification Strategy

Esta seção define a intenção da prova. Os nomes e comandos de cada teste serão formalizados em Tasks após aprovação; nenhum teste futuro é apresentado como já executado.

| Area | Evidence planned |
| --- | --- |
| Agenda, filtros, contagens, parsing e geração | Vitest unitário sobre regras alcançáveis sem navegador; exemplos de resultado definidos nesta spec. |
| Sessão, edição, respostas parciais e idempotência | Vitest de integração com rede controlada e inspeção dos payloads/identidade. |
| Fluxos e teclado | Playwright `functional` com fixtures sintéticas e interceptação da API; sem dados ou gravações de produção. |
| Responsividade, contraste e foco | Playwright `nonfunctional`, capturas nos tamanhos reais e inspeção assistiva manual registrada. |
| Regressão | Suites já existentes do web, sem enfraquecer ou excluir asserções. Mudança intencional de expectativa exige rastreio ao requisito. |
| Build | Build, lint e typecheck do web; não construir nem alterar mobile/backend para satisfazer esta feature. |
| Compatibilidade de API | Contratos locais e fixtures existentes; disponibilidade no deploy remoto não é presumida. |

## Requirement Traceability

Cada ID identifica um único critério de aceite. Os grupos abaixo preservam rastreabilidade da história até o futuro plano de tarefas.

| Requirement ID | Story | Task | Phase | Status |
| --- | --- | --- | --- | --- |
| NAV-01 | Navigate the daily routine | T41 | Tasks | In Tasks |
| NAV-02 | Navigate the daily routine | T6 | Tasks | In Tasks |
| NAV-03 | Navigate the daily routine | T35 | Tasks | In Tasks |
| NAV-04 | Navigate the daily routine | T41 | Tasks | In Tasks |
| NAV-05 | Navigate the daily routine | T43 | Tasks | In Tasks |
| NAV-06 | Navigate the daily routine | T38 | Tasks | In Tasks |
| NAV-07 | Navigate the daily routine | T41 | Tasks | In Tasks |
| NAV-08 | Navigate the daily routine | T45 | Tasks | In Tasks |
| DAY-01 | Understand today's doses and history | T36 | Tasks | In Tasks |
| DAY-02 | Understand today's doses and history | T26 | Tasks | In Tasks |
| DAY-03 | Understand today's doses and history | T36 | Tasks | In Tasks |
| DAY-04 | Understand today's doses and history | T10 | Tasks | In Tasks |
| DAY-05 | Understand today's doses and history | T36 | Tasks | In Tasks |
| DAY-06 | Understand today's doses and history | T39 | Tasks | In Tasks |
| DAY-07 | Understand today's doses and history | T39 | Tasks | In Tasks |
| DAY-08 | Understand today's doses and history | T26 | Tasks | In Tasks |
| DAY-09 | Understand today's doses and history | T11 | Tasks | In Tasks |
| MED-01 | Manage medications | T37 | Tasks | In Tasks |
| MED-02 | Manage medications | T25 | Tasks | In Tasks |
| MED-03 | Manage medications | T25 | Tasks | In Tasks |
| MED-04 | Manage medications | T43 | Tasks | In Tasks |
| MED-05 | Manage medications | T44 | Tasks | In Tasks |
| MED-06 | Manage medications | T44 | Tasks | In Tasks |
| MED-07 | Manage medications | T44 | Tasks | In Tasks |
| MED-08 | Manage medications | T17 | Tasks | In Tasks |
| MED-09 | Manage medications | T17 | Tasks | In Tasks |
| MED-10 | Manage medications | T17 | Tasks | In Tasks |
| FORM-01 | Create and review a treatment | T38 | Tasks | In Tasks |
| FORM-02 | Create and review a treatment | T18 | Tasks | In Tasks |
| FORM-03 | Create and review a treatment | T21 | Tasks | In Tasks |
| FORM-04 | Create and review a treatment | T24 | Tasks | In Tasks |
| FORM-05 | Create and review a treatment | T24 | Tasks | In Tasks |
| FORM-06 | Create and review a treatment | T22 | Tasks | In Tasks |
| FORM-07 | Create and review a treatment | T9 | Tasks | In Tasks |
| FORM-08 | Create and review a treatment | T9 | Tasks | In Tasks |
| FORM-09 | Create and review a treatment | T9 | Tasks | In Tasks |
| FORM-10 | Create and review a treatment | T7 | Tasks | In Tasks |
| FORM-11 | Create and review a treatment | T38 | Tasks | In Tasks |
| FORM-12 | Create and review a treatment | T22 | Tasks | In Tasks |
| FORM-13 | Create and review a treatment | T9 | Tasks | In Tasks |
| FORM-14 | Create and review a treatment | T38 | Tasks | In Tasks |
| FORM-15 | Create and review a treatment | T38 | Tasks | In Tasks |
| FORM-16 | Create and review a treatment | T15 | Tasks | In Tasks |
| FORM-17 | Create and review a treatment | T18 | Tasks | In Tasks |
| DOSE-01 | Register and correct a dose | T20 | Tasks | In Tasks |
| DOSE-02 | Register and correct a dose | T20 | Tasks | In Tasks |
| DOSE-03 | Register and correct a dose | T12 | Tasks | In Tasks |
| DOSE-04 | Register and correct a dose | T12 | Tasks | In Tasks |
| DOSE-05 | Register and correct a dose | T20 | Tasks | In Tasks |
| DOSE-06 | Register and correct a dose | T12 | Tasks | In Tasks |
| DOSE-07 | Register and correct a dose | T12 | Tasks | In Tasks |
| DOSE-08 | Register and correct a dose | T12 | Tasks | In Tasks |
| DOSE-09 | Register and correct a dose | T33 | Tasks | In Tasks |
| ACCOUNT-01 | Account and profile | T42 | Tasks | In Tasks |
| ACCOUNT-02 | Account and profile | T42 | Tasks | In Tasks |
| ACCOUNT-03 | Account and profile | T42 | Tasks | In Tasks |
| ACCOUNT-04 | Account and profile | T42 | Tasks | In Tasks |
| ACCOUNT-05 | Account and profile | T40 | Tasks | In Tasks |
| ACCOUNT-06 | Account and profile | T31 | Tasks | In Tasks |
| ACCOUNT-07 | Account and profile | T31 | Tasks | In Tasks |
| ACCOUNT-08 | Account and profile | T40 | Tasks | In Tasks |
| SYSTEM-01 | Visual system | T45 | Tasks | In Tasks |
| SYSTEM-02 | Visual system | T45 | Tasks | In Tasks |
| SYSTEM-03 | Visual system | T45 | Tasks | In Tasks |
| SYSTEM-04 | Visual system | T46 | Tasks | In Tasks |
| SYSTEM-05 | Visual system | T3 | Implemented | WUX_SYSTEM_05, unit gate 2 passed |
| SYSTEM-06 | Visual system | T45 | Tasks | In Tasks |
| SYSTEM-07 | Visual system | T47 | Tasks | In Tasks |
| SYSTEM-08 | Visual system | T45 | Tasks | In Tasks |
| SYSTEM-09 | Visual system | T31 | Tasks | In Tasks |
| ACCESS-01 | Accessibility | T45 | Tasks | In Tasks |
| ACCESS-02 | Accessibility | T18 | Tasks | In Tasks |
| ACCESS-03 | Accessibility | T19 | Tasks | In Tasks |
| ACCESS-04 | Accessibility | T6 | Tasks | In Tasks |
| ACCESS-05 | Accessibility | T4 | Implemented | WUX_ACCESS_05, integration gate 3 passed |
| ACCESS-06 | Accessibility | T45 | Tasks | In Tasks |
| ACCESS-07 | Accessibility | T45 | Tasks | In Tasks |
| ACCESS-08 | Accessibility | T45 | Tasks | In Tasks |
| ACCESS-09 | Accessibility | T46 | Tasks | In Tasks |
| ACCESS-10 | Accessibility | T4 | Implemented | WUX_ACCESS_10, integration gate 3 passed |
| STATE-01 | Recovery and interruptions | T5 | Tasks | In Tasks |
| STATE-02 | Recovery and interruptions | T5 | Tasks | In Tasks |
| STATE-03 | Recovery and interruptions | T34 | Tasks | In Tasks |
| STATE-04 | Recovery and interruptions | T34 | Tasks | In Tasks |
| STATE-05 | Recovery and interruptions | T24 | Tasks | In Tasks |
| STATE-06 | Recovery and interruptions | T34 | Tasks | In Tasks |
| STATE-07 | Recovery and interruptions | T15 | Tasks | In Tasks |
| STATE-08 | Recovery and interruptions | T5 | Tasks | In Tasks |
| STATE-09 | Recovery and interruptions | T13 | Tasks | In Tasks |
| STATE-10 | Recovery and interruptions | T13 | Tasks | In Tasks |
| STATE-11 | Recovery and interruptions | T15 | Tasks | In Tasks |

**Coverage:** 91 critérios mapeados às 47 tarefas de [tasks.md](tasks.md); 0 sem tarefa. Design e plano de tarefas aprovados em 2026-11-14. Nenhum critério foi implementado ou verificado como comportamento da aplicação.

## Differences from the source

Nenhuma captura vinculante foi fornecida. A crítica autoriza corrigir os problemas observados; o usuário confirmou a direção completa e delegou os detalhes. A presente spec não redefine os contratos existentes nem substitui garantias de integração já implementadas.

## Sources

- Solicitação: “usando a skill tlc-spec-driven crie as specs com as correções propostas, faça somente no front-end”.
- Respostas de escopo, direção e delegação em [context.md](context.md), registradas literalmente.
- Aprovação do usuário em 2026-11-13 e pedido de uso de `frontend-design`, `tlc-spec-driven`, plugin `taste-skill:design-taste-frontend` e skills de front-end de [skills-lock.json](../../../skills-lock.json); fontes e uso descritos em Required Skills and Plugin.
- Crítica profissional desta conversa, de 2026-11-13; origem textual dos problemas e propostas. Sem capturas vinculantes.
- [Formulário atual](../../../src/app/components/CardCadastrar/cardCadastrar.tsx): validação, recorrência, payload e POST atômico com idempotência já implementado.
- [Medicamentos](../../../src/app/meus-medicamentos/MeusMedicamentosContent.tsx): controles, filtros e apresentação de frequência.
- [Lembretes](../../../src/app/meus-lembretes/MeusLembretesContent.tsx): apresentação, registro e leitura de doses.
- [Histórico](../../../src/app/historico/HistoricoContent.tsx): destino existente; não criar um segundo histórico desconectado.
- [Perfil](../../../src/app/Configuracoes/ConfiguracoesContent.tsx), [sessão](../../../src/app/contexts/AuthContext.tsx) e [HTTP](../../../src/app/utils/api.ts): preservar políticas existentes de erro, isolamento e 401 operacional.
- [Sidebar](../../../src/app/components/Sidebar/sidebar.tsx), [cadastro](../../../src/app/cadastro/page.tsx), [estilos](../../../src/app/globals.css): acessibilidade e identidade visual atuais.
- [Fixtures de contrato](../../../tests/fixtures/backend-contracts.ts) e [Playwright](../../../playwright.config.ts): estratégia existente de rede isolada e verificação.
- [Integração documentada](../../../docs/specs/integracao-backend/design.md): referência histórica lida isoladamente; fatos foram conferidos nos arquivos atuais relevantes.
- [CreateRemedioDto](../../../../medreminder-backend/src/remedio/dto/create-remedio.dto.ts), [CreateDosesDto](../../../../medreminder-backend/src/dose/dto/create-doses.dto.ts), [UpdateDoseDto](../../../../medreminder-backend/src/dose/dto/update-dose.dto.ts) e [CreateUsuarioDto](../../../../medreminder-backend/src/usuario/dto/create-usuario.dto.ts): contratos consultados somente para leitura.
- [RemedioController](../../../../medreminder-backend/src/remedio/remedio.controller.ts) e [UsuarioController](../../../../medreminder-backend/src/usuario/usuario.controller.ts): métodos existentes e ausência de rota de foto. Esta leitura não comprova paridade do deploy remoto.
- [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): referência para os limites de contraste; área de toque de 44 CSS px é meta deste produto.

## Success Criteria

- [ ] Os 91 critérios possuem testes/provas rastreados no plano de tarefas aprovado.
- [ ] As nove histórias podem ser demonstradas com dados sintéticos sem mutações em produção.
- [ ] Nenhuma tela apresenta intervalo como frequência diária sem evidência na agenda.
- [ ] Cadastro, criação de tratamento, filtro, edição e registro/correção funcionam por teclado e em 320 CSS px.
- [ ] As telas usam o mesmo sistema de componentes, estados e vocabulário.
- [ ] A verificação distingue testes simulados, inspeção visual e eventual compatibilidade real, sem declarar evidência que não foi produzida.
- [ ] Nenhum arquivo do backend ou mobile foi alterado pela implementação desta feature.

## Delivery Boundary

A especificação e o adendo de skills estão aprovados. [design.md](design.md) e [tasks.md](tasks.md) foram aprovados em 2026-11-14, com a solicitação de registrar as skills e os MCPs no AGENTS.md antes de implementar. Essa preparação documental foi realizada. Não foram produzidos `proofs.md` ou `verification.md`, nem iniciada implementação.
