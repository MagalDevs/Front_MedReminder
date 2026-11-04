# Backend Integration Tasks

## Execution Protocol

Ativar `tlc-spec-driven` pelo nome numa implementação futura e seguir seu fluxo Execute. Este pedido autoriza somente verificação e incremento dos docs. Não iniciar estas tarefas nem criar commits de implementação nesta rodada.

**Spec**: [spec.md](spec.md)
**Design**: [design.md](design.md)
**Status**: Approved — em execução
**Build**: `npx --no-install eslint .; npx --no-install tsc --noEmit; npm run build`

Aprovação registrada em 2026-11-04 ([README](README.md#approval-state)): "siga as specs deste projeto e finalize elas por favor". O texto original abaixo permanece como histórico do plano. As duas aprovações reais são pré-condições separadas do Execute. O baseline do frontend ainda não tem scripts de teste e o lint precisa de ajuste já previsto no plano de manutenção. Não omitir o gate inicial caso falhe.

## Test Coverage Matrix

Fontes: `package.json`, `docs/PLANO_TESTES.md`, `tests/README.md`, plano de manutenção e contratos atuais descritos em `design.md`. Stack previamente escolhida: Vitest + React Testing Library; Playwright. Não há suíte executável atual no frontend. Reutilizar o bootstrap T2–T5 do [plano de manutenção](../qualidade-e-manutencao/tasks.md), sem duplicar suas dependências/configurações.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Cliente HTTP | unit | Origem, headers, envelopes e todas as falhas de BEAPI-01/02 | `tests/unit/backend-api.test.ts` | `npm run test:unit` |
| Fixtures de contrato | unit | Campos/status/formato provenientes das fontes do backend, inclusive variantes e limites | `tests/unit/backend-fixtures.test.ts` | `npm run test:unit` |
| Formulários/contextos | integration | Sucesso, invalidação, falha parcial e cada limite referido pela tarefa, com módulos reais | `tests/integration/backend-*.test.tsx` | `npm run test:integration` |
| Fluxo e CORS no navegador | functional | Gestos/requests e origem/headers efetivos em ambiente isolado | `tests/functional/backend-*.spec.ts` | `npm run test:functional` |
| Integração real | e2e | Persistência, idempotência, isolamento A/B e paridade com a revisão backend | `tests/e2e/backend-contract.spec.ts` | `npm run test:e2e` |
| Documentação | none | Revisão por fontes e links; não simular teste de produto | `docs/` | Revisão registrada |

Comandos `test:*` são planejados no pacote de manutenção, **não disponíveis ou executados nesta inspeção**. Testes novos devem trazer os IDs BEAPI nos títulos, falhar com seleção vazia e acompanhar o commit da mudança. Não fazer fixture aceitar somente o envelope incorreto do frontend. Cópia de fixture sem revisão de fonte não comprova paridade do servidor.

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| quick | Cliente e fixtures | `npm run test:unit -- -t BEAPI` |
| full | Formulários e providers | `npm run test:unit -- -t BEAPI` e `npm run test:integration -- -t BEAPI`, selecionando os casos entregues na tarefa |
| full-functional | Histórico com integração e navegador | Gate full mais `npm run test:functional -- --grep BEAPI-09` |
| functional | Smoke de conexão em navegador | `npm run test:functional -- --grep BEAPI-10` com servidor isolado pronto |
| e2e | Aceite integrado final | `npm run test:e2e -- --grep BEAPI` com API isolada e SQLite temporário em arquivo |
| manual | Documentação | Conferir fontes, estado, links e evidências; registrar o resultado |

Build no cabeçalho é adicional aos testes na conclusão das fases. Em quick/full selecionar somente suítes já criadas, sem exigir uma futura. T1 inclui o primeiro teste unitário de fixtures. T2 amplia esses testes; T3 inclui o primeiro cenário de integração BEAPI. A verificação final executa cada prova e o build conforme a skill; nenhuma prova foi executada agora.

## Execution Plan

Pré-condições locais: bootstrap de testes/gates do plano de manutenção e baseline verde, com ambas as aprovações. Correções de conexão não são requisito para concluir a autoria dos docs nem se tornam implementação autorizada pela escolha da stack.

### Phase 1: Client Contract Foundation

```text
T1 → T2 → T3
```

### Phase 2: Session and Profile

```text
T4 → T5 → T6
```

### Phase 3: Treatment and History

```text
T7 → T8 → T9
```

### Phase 4: Connection Evidence

```text
T10 → T11 → T12
```

Transições:

```text
T3 → T4
T6 → T7
T9 → T10
```

T11 e T12 são marcos condicionados à API isolada; ausência de ambiente impede suas provas, sem bloquear o registro documental local T10 ou fingir prova real por mocks. Foto e semântica de quantidades não bloqueiam as correções de contrato comprovadas. FE-05 continua necessário para atestar o ciclo completo de alertas; T5 só alinha consultas e estado.

## Task Breakdown

### T1: Fixar fixtures dos contratos verificados

**What**: Copiar formatos e limites dos controllers/DTOs/serviços verificados, com commit de origem e dados sintéticos.
**Where**: `tests/fixtures/backend-contracts.ts`
**Depends on**: None
**Requirement**: BEAPI-12
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Done (fontes: design.md; backend indisponível localmente — paridade real em T12)

**Done when**:

- [x] Login na raiz; GET/PATCH perfil em data; senha/exclusão somente message; message:string[] e code; doses legadas/paginadas; tratamento e limites. Conferência da fixture com as fontes acompanha o commit.
- [x] Gate quick aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [x] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: unit: validar tipos/fixtures e casos de fronteira; importá-las em testes reais nas tarefas seguintes.
**Gate**: quick — Gate Check Commands.
**Commit**: `test(contract): pin backend response fixtures`

### T2: Unificar origem e erros no cliente HTTP

**What**: Ler NEXT_PUBLIC_API_URL, preservar headers/RequestInit.signal e expor erro HTTP com status/code/mensagens/Retry-After, mesmo quando parsing falhar.
**Where**: `src/app/utils/api.ts`
**Depends on**: T1
**Requirement**: BEAPI-01, BEAPI-02
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Sem fallback silencioso para produção no ambiente isolado; JSON/texto/vazio/inválido cobertos; mensagens array preservadas; Content-Type não forçado em FormData; opção explícita de invalidação em 401 permite tratar senha como operação. Não registrar corpo sensível.
- [ ] Gate quick aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: unit: mínimo 10 casos, incluindo duas origens, barras, headers, 400 array, 401 inválido, 429 com Retry-After e 503.
**Gate**: quick — Gate Check Commands.
**Commit**: `fix(api): align origin and structured errors`

### T3: Migrar cadastro ao cliente e validação de contrato

**What**: Substituir Fetch de origem fixa pelo cliente sem autenticação, mantendo DTO compatível e exibindo validações de servidor de forma segura.
**Where**: `src/app/cadastro/page.tsx`
**Depends on**: T2
**Requirement**: BEAPI-01, BEAPI-02, BEAPI-12
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Enviar somente os campos existentes do CreateUsuarioDto, dataNasc YYYY-MM-DD, CPF/CEP normalizados e senha sem trim; exibir array de validação/429 sem depender de códigos dentro de strings; sem logs de payload.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: integration: mínimo 4 cenários de cadastro, validação array, rate limit e indisponibilidade; sem fixture de senha fraca como sucesso.
**Gate**: full — Gate Check Commands.
**Commit**: `fix(signup): consume shared backend contract`

### T4: Validar a restauração de sessão com perfil

**What**: Confirmar GET usuario/me antes de restaurar isAuthenticated, preservando loading até resolver o estado e descartando respostas de outra identidade.
**Where**: `src/app/contexts/AuthContext.tsx`
**Depends on**: T3
**Requirement**: BEAPI-03
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Token ausente não faz consulta privada; perfil válido preenche usuário; 401 invalida sessão mesmo com corpo ilegível; rede/503 não é apresentado como autenticação confirmada nem token comprovadamente inválido; logout impede resposta atrasada de restaurar a conta.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: integration: mínimo 6 casos de ausência/válido/expirado/rede/logout/resposta atrasada.
**Gate**: full — Gate Check Commands.
**Commit**: `fix(auth): verify restored backend session`

### T5: Vincular consultas de lembretes à sessão confirmada

**What**: Remover consulta privada incondicional do mount e buscar doses somente para a identidade confirmada.
**Where**: `src/app/contexts/lembreteContext.tsx`
**Depends on**: T4
**Requirement**: BEAPI-04
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Zero GET dose/me enquanto sessão ausente/carregando; buscar após confirmação; limpar listas e descartar resposta anterior em logout/troca de usuário; consumir campos efetivos de remedio parcial. Não declarar cancelamento de timers do alerta concluído por esta tarefa.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: integration: mínimo 5 casos de mount público, loading, sessão válida, logout e resposta A após login B.
**Gate**: full — Gate Check Commands.
**Commit**: `fix(reminders): scope backend loads to confirmed identity`

### T6: Alinhar perfil e senha no formulário de configurações

**What**: Desembrulhar PATCH perfil por data e consumir PATCH usuario/senha existente, tratando separadamente o resultado das duas operações.
**Where**: `src/app/Configuracoes/ConfiguracoesContent.tsx`
**Depends on**: T5
**Requirement**: BEAPI-02, BEAPI-05, BEAPI-06
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Não apagar nome/email/CEP após envelope correto; DTO de perfil não recebe cpf/cuidador/senha; CEP vazio submetido continua recebendo 400 conforme contrato, exibe a validação e não anuncia sucesso. Não omitir nem apagar esse campo por suposição; mudar essa semântica fica fora da tarefa. Distinguir 400/401/409/429 por status. Em senha401, revalidar GET usuario/me antes de classificar a sessão; perfil200 preserva credencial, perfil401 invalida, erro de rede/503 mantém resultado inconclusivo. Resultado parcial perfil/senha não anuncia sucesso integral nem rollback inexistente.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: integration: mínimo 8 casos com perfil atualizado, CEP inválido, senha válida/fraca/incorreta, token expirado, 409, 429 e perfil salvo antes de falha na senha.
**Gate**: full — Gate Check Commands.
**Commit**: `fix(profile): consume profile envelope and password outcomes`

### T7: Validar os limites reais do tratamento

**What**: Validar validade obrigatória, datas e lote de 1–1000 instantes únicos antes de qualquer envio de tratamento.
**Where**: `src/app/components/CardCadastrar/cardCadastrar.tsx`
**Depends on**: T6
**Requirement**: BEAPI-08
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Null/vazio/1001 doses/duplicidade por instante/data inválida não enviam mutação; 1 e 1000 válidos prosseguem; ISO preserva timezone; validar DTO sem alterar cálculo de horários ou decidir nova semântica de quantidadeDiaria/quantidadeDias.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: unit/integration: mínimo 8 fronteiras; tabela fixa de datas/instantes, incluindo offsets diferentes do mesmo instante.
**Gate**: full — Gate Check Commands.
**Commit**: `fix(treatment): validate backend DTO boundaries`

### T8: Consumir a criação atômica de tratamento

**What**: Trocar POST remedio + POST dose/doses por POST tratamento com chave por intenção e envelope data.remedio/data.doses.
**Where**: `src/app/components/CardCadastrar/cardCadastrar.tsx`
**Depends on**: T7
**Requirement**: BEAPI-07, BEAPI-08
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Uma confirmação válida faz uma operação de escrita; resposta confirmada dispara sucesso/recarga; reenvio explícito da mesma intenção conserva chave/conteúdo; alteração de conteúdo exige nova intenção; 409/503 não geram sucesso. Não reutilizar chave entre contas nem fragmentar lote; nenhum retry automático.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: integration: mínimo 6 casos de payload/header, sucesso, resposta incerta, reenvio mesma chave, conflito409 e indisponibilidade503; persistência/atomicidade real só em T12.
**Gate**: full — Gate Check Commands.
**Commit**: `fix(treatment): use atomic idempotent backend operation`

### T9: Conectar histórico a doses reais autenticadas

**What**: Usar cliente autenticado e GET dose/me no lugar do Fetch sem Bearer e da geração com Math.random.
**Where**: `src/app/historico/HistoricoContent.tsx`
**Depends on**: T8
**Requirement**: BEAPI-01, BEAPI-09
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Registros derivam de id/data_dose/tomado/remedio do usuário; tomado true/false não inventa adiamento; vazio/erro/carregamento preservam resultados honestos; filtros trabalham nos dados reais e IDs são normalizados na fronteira. Se escolher query paginada, consumir todas as páginas necessárias ou declarar a página, sem truncamento oculto.
- [ ] Gate full aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: integration/functional: mínimo 5 cenários de dados, vazio,401,500, filtros e confirmação/reload; isolamento real em T12.
**Gate**: full-functional — Gate Check Commands; integração e cenário funcional BEAPI-09 executados antes do commit.
**Commit**: `fix(history): use authenticated persisted dose data`

### T10: Registrar foto indisponível e fronteiras do cliente

**What**: Atualizar o estado do alinhamento e registrar que POST usuario/foto não existe e edição de medicamento não possui fluxo frontend.
**Where**: `docs/specs/integracao-backend/README.md`
**Depends on**: T9
**Requirement**: BEAPI-11
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Não atestar foto ou edição como integradas; não criar contrato/armazenamento nem retirar controles por decisão implícita. A escolha de implementar/ocultar/desabilitar foto continua em especificação própria de FE-04; resultados existentes permanecem datados.
- [ ] Gate manual aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: none, documentação; conferir controller atual e inventário das chamadas.
**Gate**: manual — Gate Check Commands.
**Commit**: `docs(connection): record unsupported client operations`

### T11: Especificar e executar smoke de origem e preflight isolados

**What**: Verificar conexão em navegador contra API isolada com configuração CORS efetiva e revisão conhecida.
**Where**: `tests/functional/backend-cors.spec.ts`
**Depends on**: T10
**Requirement**: BEAPI-10
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Origem permitida lê respostas/Retry-After e envia Authorization/Content-Type/Idempotency-Key; origem negada recebe bloqueio CORS; Bearer ausente/inválido permanece rejeitado. Não implementar CORS novamente: usar configureApp/corsOptions atuais. O teste existente backend test/m13-cors.browser.cjs pode ser reutilizado como evidência complementar.
- [ ] Gate functional aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: functional: mínimo 4 casos de origem permitida/negada, preflight completo e header exposto; registrar frontend/backend/config.
**Gate**: functional — Gate Check Commands.
**Commit**: `test(connection): verify isolated CORS contract`

### T12: Validar contratos com API real isolada

**What**: Comprovar os fluxos alinhados contra a revisão backend identificada, sem mocks nos endpoints cuja persistência é medida.
**Where**: `tests/e2e/backend-contract.spec.ts`
**Depends on**: T11
**Requirement**: BEAPI-10, BEAPI-12
**Reuses**: Contratos e fontes de `design.md`; stack do plano de manutenção.
**Status**: Pending

**Done when**:

- [ ] Cadastro/login/perfil/senha/tratamento/histórico/confirmar/reload e isolamento A/B têm resultados por caso; SQLite em arquivo temporário para tratamento; replay mesma chave não duplica registros e mesma chave/outro conteúdo retorna409; guardar evidências sanitizadas e comparar fixtures com respostas reais. Ambiente/contratos indisponíveis são BLOQUEADO, não aprovação.
- [ ] Gate e2e aprovado com nomes/contagem dos testes e commit registrados; falhas mantidas visíveis.
- [ ] Testes do resultado acompanham a alteração, sem skip, remoção ou relaxamento de expectativas.

**Tests**: e2e: mínimo 8 cenários; executar somente com origem isolada verificada e limpar apenas dados da rodada.
**Gate**: e2e — Gate Check Commands.
**Commit**: `test(connection): verify backend contract parity`

## Checks

Provas planejadas, sem execução ou pass marker inventado. Criar os testes que selecionam esses IDs nas tarefas correspondentes; seleção vazia deve falhar. Build/Mocks não substituem T12. Em C1 incluir cadastro, cliente e histórico; foto indisponível não é chamada de domínio suportada.

**C1** - Todas as chamadas suportadas usam a origem configurada. (BEAPI-01, AC 1).
Proof: `npm run test:integration -- -t BEAPI-01`

**C2** - Erro mantém status/code/mensagens/Retry-After mesmo com corpo inválido. (BEAPI-02, AC 2).
Proof: `npm run test:unit -- -t BEAPI-02`

**C3** - Restauração depende do perfil confirmado, não da presença do token. (BEAPI-03, AC 3).
Proof: `npm run test:integration -- -t BEAPI-03`

**C4** - Nenhum GET dose/me ocorre antes da confirmação da sessão. (BEAPI-04, AC 4).
Proof: `npm run test:integration -- -t BEAPI-04`

**C5** - Perfil é atualizado a partir de response.data. (BEAPI-05, AC 1).
Proof: `npm run test:integration -- -t BEAPI-05`

**C6** - Falha na senha não produz confirmação integral falsa. (BEAPI-06, AC 2).
Proof: `npm run test:integration -- -t BEAPI-06`

**C7** - Tratamento usa uma escrita atômica com chave e envelope corretos. (BEAPI-07, AC 3).
Proof: `npm run test:integration -- -t BEAPI-07`

**C8** - Tratamento inválido por validade/lote/data não é enviado. (BEAPI-08, AC 4).
Proof: `npm run test:integration -- -t BEAPI-08`

**C9** - Histórico deriva de doses autenticadas sem aleatoriedade/adiamento fictício. (BEAPI-09, AC 1).
Proof: `npm run test:integration -- -t BEAPI-09`

**C10** - Navegador comprova origem, preflight e headers no ambiente identificado. (BEAPI-10, AC 2).
Proof: `npm run test:functional -- --grep BEAPI-10`

**C11** - Foto sem contrato não aparece como integração aprovada. (BEAPI-11, AC 3).
Proof: walk - conferir controller de usuário e registro explícito da indisponibilidade em README.md; nenhum resultado de upload aprovado

**C12** - Fixtures e fluxo real correspondem aos contratos da revisão backend. (BEAPI-12, AC 4).
Proof: `npm run test:e2e -- --grep BEAPI-12`

## Handoff

**Settled mid-build:** nenhum build/implementação; o usuário autorizou somente a verificação e incremento documental.
**Dispatched:** análises somente leitura dos dois repositórios retornaram; autoria auxiliar de design; nenhum batch de implementação. Revisão independente do adendo será registrada em README.md.
**Walked:** nenhum fluxo de navegador ou endpoint de produção executado.
**Next:** revisar o spec, depois as tarefas, sem registrar aprovações presumidas.
**External blockers:** ambiente/revisão backend e SQLite em arquivo para comprovação real; foto/semântica e alertas completos seguem escopos próprios.
