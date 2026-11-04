# Backend Integration Review

**Verdict**: há alinhamentos de frontend a implementar. Os documentos foram incrementados; o código das aplicações não foi alterado.
**Status**: Approved — em execução
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
