# Backend Integration Review

**Verdict**: T1–T12 implementadas e verificadas localmente; 11 E2E e 4 provas CORS passaram contra a revisão backend prevista, com SQLite temporário. [Commits, comandos e limites](../../evidencias/2026-11-04/execution-final.md). O diagnóstico abaixo preserva a baseline original; não descreve o estado do deploy.
**Status**: Implementado e verificado localmente — produção não atestada
**Date**: 2026-11-04, America/Sao_Paulo.
**Frontend**: `43b05890d8a6cca1311969a6ca51a9f9decc2620`.
**Backend**: `b6b63168ba2a092e6e6350c256bfa15483199b4a`.

## Documents

| File | Content |
| --- | --- |
| [design.md](design.md) | Diagnóstico estático, contratos dos dois repositórios, compatibilidades, divergências e desenho do alinhamento. |
| [spec.md](spec.md) | 12 requisitos EARS para os alinhamentos comprovados e seus limites. |
| [tasks.md](tasks.md) | 12 tarefas com dependências, testes no mesmo commit, gates e 12 checks futuros. |

Este adendo complementa o [plano de manutenção](../qualidade-e-manutencao/README.md). Os 23 requisitos e 41 tarefas daquele pacote mantêm seus IDs e escopo. As correções funcionais de conexão ficam aqui; a restrição de não mudar lógica nas otimizações continua válida.

## Execução do alinhamento — 2026-11-04

O cliente HTTP compartilhado já lê a origem pública e preserva status, mensagens de validação e Retry-After. O trabalho corrente migra cadastro, sessão, perfil/senha, tratamento e histórico. As tabelas de lacunas e a inspeção documental abaixo descrevem a baseline identificada no cabeçalho; não são um relatório de testes da implementação atual.

Configurações consome o usuário dentro de `data` após PATCH, mantém os campos permitidos e separa o resultado do perfil do resultado da senha. Um 401 na operação de senha provoca uma única consulta de perfil para distinguir senha incorreta, sessão inválida e resultado inconclusivo. O histórico lê `dose/me` autenticado sem query (lista completa do contrato legado), normaliza IDs e representa apenas `tomado:true/false`; a API não comprova um estado de adiamento.

**Fronteiras não integradas (T10):** POST `/usuario/foto` permanece sem contrato de backend comprovado. O controle e a chamada legados continuam visíveis no código; nenhum teste ou mock comprova upload/persistência. Implementar, ocultar ou desabilitar essa ação continua decisão de FE-04. Não há fluxo frontend de edição de medicamento; PUT disponível no backend não significa capacidade entregue na interface. Quantidades/intervalos mantêm sua semântica anterior; a migração de transporte não é uma decisão clínica.

As suítes locais de perfil e histórico estão em `tests/integration/backend-profile.test.tsx` e `backend-history.test.tsx`; usam o cliente real com respostas sintéticas. O cenário `tests/functional/backend-history.spec.ts` também usa API controlada e identifica explicitamente esse limite. Nenhuma dessas suítes comprova atomicidade, persistência ou CORS real.

As provas reais estão separadas: `npx playwright test --project=isolated-cors --grep BEAPI-10` executa quatro casos contra a API efetiva, e `npm run test:e2e -- --grep BEAPI-12` executa cadastro A/B, login, perfil, senha, tratamento, replay/conflito, isolamento e confirmação com recarga. Sem ambiente identificado esses gates falham como **BLOQUEADO**, sem skip e sem usar mocks como substituição. O projeto funcional padrão ignora apenas `backend-cors.spec.ts` para preservar a distinção entre regressão controlada e conexão real.

Pré-condições para esses comandos:

- API descartável iniciada com o `configureApp`/CORS do backend, migrações aplicadas e SQLite temporário em arquivo. Destruir o ambiente após a execução; não apontar para produção nem reutilizar dados de pessoas.
- `E2E_API_URL` e `NEXT_PUBLIC_API_URL` com a mesma origem da API isolada; `NEXT_PUBLIC_API_ENV=isolated`. Essas variáveis precisam existir **antes do build**, inclusive no servidor iniciado pelo Playwright.
- `E2E_BACKEND_COMMIT` com SHA completo e `E2E_SQLITE_FILE` identificando o arquivo temporário. São metadados declarados pelo operador; os testes não inspecionam o filesystem remoto nem comprovam a revisão implantada por essa declaração isoladamente.
- A origem frontend `http://localhost:3001` permitida pelo CORS efetivo. O teste de origem negada abre uma origem local efêmera distinta. Configurar o rate limit isolado para produzir 429 em até 30 tentativas sintéticas de login e expor Retry-After; esse caso deve rodar por último para não contaminar os demais fluxos.

Os testes reais não interceptam endpoints da API e desativam traces, que poderiam armazenar credenciais sintéticas. O anexo de revisão contém somente revisões, campos comparados e limites da prova. A comparação não atesta DTOs opacos/paginação não exercitados; esses limites permanecem explícitos até reconciliação completa com as fontes reais.

## Confirmed Gaps

| Gap | Current evidence | Planned work |
| --- | --- | --- |
| Origem fixa e clientes paralelos | URL em api.ts e Fetch diretos em cadastro/histórico/foto; variável de ambiente não lida. | T2/T3/T9 centralizam chamadas suportadas; foto continua contrato indisponível. |
| Erros perdem o contrato HTTP | Status/code/Retry-After não chegam ao consumidor; message array não é preservado; parsing pode impedir tratamento de 401. | T2/T3/T6 consomem erro estruturado sem procurar números dentro da mensagem. |
| Sessão e doses carregadas sem confirmação | AuthContext confia no token armazenado; LembreteProvider consulta rota privada no mount global. | T4/T5 validam perfil e coordenam consultas por identidade. |
| Perfil atualizado com envelope errado | Backend retorna `{message,data}`; PATCH do frontend lê objeto direto. CEP vazio também conflita com o DTO atual. | T6 corrige consumo e apresenta a validação 400 do servidor; não cria novos campos nem decide omitir/apagar CEP. |
| Senha precisa de alinhamento do resultado | Endpoint/payload existem; 401 pode significar senha atual incorreta e não token inválido. Perfil pode ser salvo antes da falha da senha. | T6 distingue resultados e revalida sessão quando necessário. |
| Tratamento gravado em duas etapas | Front faz POST remédio e POST doses; backend já tem POST `/tratamento` atômico/idempotente. | T7/T8 validam DTO/lote e usam a operação existente. |
| Limites do DTO não respeitados por todas as entradas | Validade pode ser null no frontend; backend a exige. Doses têm limite 1–1000 e unicidade por instante. | T7 cobre os limites antes de enviar qualquer mutação. |
| Histórico sem Bearer e aleatório | GET `/remedio` exige token; o histórico chama sem token e simula registros. | T9 usa doses próprias e persistidas. |
| Prova da conexão ainda ausente | Configuração/CORS e código locais não comprovam a revisão implantada ou o navegador contra API real. | T11/T12 comprovam origem e contratos somente em ambiente isolado identificado. |

## Compatible or Already Implemented

- Login `{email,senha}` e token na raiz estão alinhados ao contrato local.
- Cadastro já envia `dataNasc` como `YYYY-MM-DD` e os campos aceitos pelo DTO; não é necessário convertê-lo para timestamp.
- PATCH do perfil já envia somente nome/email/CEP. Não foi encontrado envio de CPF/cuidador nessa operação; o problema é o consumo do envelope e a aceitação de CEP vazio no formulário.
- PATCH `/usuario/senha` já existe com `{senhaAtual,novaSenha}`. Não criar outra rota para corrigir o cliente.
- CORS já permite Authorization, Content-Type e Idempotency-Key e expõe Retry-After. Configurar a origem efetiva do ambiente e verificá-la; não reinstalar CORS.
- GET `/remedio` retorna array na raiz, compatível com esse aspecto do histórico atual, mas é autenticado e filtrado pelo usuário.
- Listagem `/remedio/me`, GET `/dose/me` sem query e PUT de dose usam os envelopes esperados pelos consumidores atuais, sujeitos à validação em execução real.

## Unsupported or Separate Decisions

POST `/usuario/foto` continua ausente no backend. Não há contrato de upload/armazenamento a consumir. A decisão de implementar, ocultar ou desabilitar a ação permanece em FE-04; este adendo não remove controles nem especifica uma infraestrutura fictícia. Nenhum upload foi aprovado.

O frontend não implementa edição de medicamento, embora o backend tenha PUT. A descrição anterior de testes de edição foi corrigida: criação/listagem/exclusão são os fluxos encontrados; edição continua funcionalidade separada.

Os campos quantidadeDiaria/quantidadeDias têm divergências potenciais de significado com intervalo/unidade de duração na UI. O DTO comprova tipos e limites, não a intenção clínica. Registrar e esclarecer essa semântica antes de uma mudança própria; não alterar o cálculo das doses sob pretexto de corrigir conexão. Fila/cancelamento completo de alertas continuam FE-05.

## Evidence and Validation

A verificação utilizou Graphify antes das buscas estruturais e conferiu os arquivos locais. Os índices dos dois repositórios correspondem aos commits acima. Não houve servidor iniciado, testes de produto, gravação de dados, requisição de produção ou mudança de configuração remota.

| Check | Result | Scope |
| --- | --- | --- |
| `validate_spec.py docs/specs/integracao-backend/spec.md` | Exit 0; zero erros e avisos | Estrutura dos 12 requisitos EARS. |
| `validate_tasks.py docs/specs/integracao-backend/tasks.md` | Exit 0; zero erros, um aviso de Tests: none | T10 é documento; a matriz permite none com revisão registrada. Não dispensa gates de código. |
| Integridade documental | Aprovada | 12 tarefas, 12 checks, links locais e ausência de aprovações inventadas; pacote anterior preserva 23 requisitos/41 tarefas. |
| Whitespace | Aprovado | `git diff --check` e conferência dos arquivos documentais. |

Revisão independente por `frontend_connections`, sem autoria do adendo, concluída em 04/11/2026. Três achados foram incorporados: documentação local T10 precede os marcos externos T11/T12; o CEP vazio permanece rejeitado pelo contrato com exibição do erro, sem decidir uma nova semântica de omissão/apagamento; T9 executa a suíte funcional além da integração no seu gate. O revisor confirmou a descrição das rotas existentes e das compatibilidades.

Os validadores foram repetidos após os ajustes. Não houve `--execute`, provas de produto, UAT, build das aplicações, commit ou mutação remota nesta rodada. Validação documental não aprova conexão de produção nem executa as tarefas.

## Sources

- Fontes por arquivo/linha estão em [design.md](design.md).
- [Contexto e instrução do usuário](../qualidade-e-manutencao/context.md).
- [Issues e fontes do planejamento anterior](../qualidade-e-manutencao/sources.md): FE-02/03/04/06/07/08/12/15 orientam os alinhamentos, sem alteração das issues.
- Backend `docs/AUTH_PASSWORD_CORS.md`, controllers, DTOs e serviços no commit informado. Disponibilidade em código local não é garantia da revisão implantada no Render.

## Approval State

**Status**: Approved — em execução, desde 2026-11-04 (America/Sao_Paulo).

- Data: 2026-11-04.
- Palavras do usuário (owner do projeto): "siga as specs deste projeto e finalize elas por favor".
- Escopo: `spec.md` e `tasks.md` deste pacote e do pacote [qualidade-e-manutencao](../qualidade-e-manutencao/context.md). O registro completo e as observações de protocolo estão no `context.md` daquele pacote.
- Limites: sem push, merge, deploy ou acesso/mutação à API de produção. Conexão real só em ambiente isolado identificado.
- A skill `tlc-spec-driven` e seus validadores Python não estão disponíveis nesta máquina; o protocolo Execute é seguido manualmente.
