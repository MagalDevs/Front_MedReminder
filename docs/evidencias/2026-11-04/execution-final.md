# Consolidação da execução — 04/11/2026

A sessão anterior parou por limite de uso durante a integração. As alterações existentes foram preservadas e os nove commits de dependências foram incorporados à branch `feat/executar-specs`. Não houve push, merge remoto, deploy ou chamada à API de produção.

## Implementação e rastreabilidade

| Área | Commit | Resultado |
| --- | --- | --- |
| Dependências T14–T22 | `dd72bfb` até `84b5ae7` | Atualizações compatíveis e decisões de manutenção preservadas; [relatório](dependency-updates.md). |
| BEAPI T3 | `8d8e92f` | Cadastro público pelo cliente central e validações seguras. |
| BEAPI T4–T5 | `fe97ab5` | Perfil confirmado antes da restauração; doses por identidade; respostas obsoletas descartadas. |
| BEAPI T6/T9 | `88299f5` | Perfil por envelope, resultado parcial da senha e histórico de doses autenticadas. |
| BEAPI T7–T8 | `b406556`, `f113649` | Lote validado, operação atômica, chave por intenção e proteção contra resposta de outra sessão. |
| BEAPI T1 | `7306f18` | Fixtures reconciliadas com código do backend, incluindo `code` opcional nos erros. |
| Regressão funcional | `c622045` | Contratos atualizados e regressões de fuso/idempotência como testes normais. |
| BEAPI T11–T12 / CI local | `723a230` | Suítes reais separadas dos mocks, variáveis públicas de build e metadados obrigatórios. |

As evidências NF foram medidas no working tree identificado nos próprios JSONs; a comparação histórica usa o código de produto de `537bfaa` contra `c622045`. O ajuste posterior `f113649` captura o mesmo contêiner de referência no cleanup, sem alterar a interface ou o cálculo do tratamento. A instalação do backend ocorreu fora do repositório do frontend para preservar o escopo de TypeScript/lint.

## Verificações executadas

Ambiente: Windows, Node v26.8.1, npm 11.19.0, Next 16.4.5, React 19.3.1 e Chromium do Playwright 1.64.1. Dados exclusivamente sintéticos. Todos os comandos Playwright usaram servidor novo quando configurado `CI=1`, sem atualização de snapshots e sem retries nesta validação.

| Comando / prova | Resultado |
| --- | --- |
| `npm ci` | Saída 0, lockfile instalado sem force/legacy-peer-deps. |
| `npx tsc --noEmit` | Saída 0. |
| Build Next de produção | Saída 0 nas execuções de navegador, inclusive build com origem isolada. |
| `npx vitest run --coverage --reporter=dot` | 16 arquivos; 316 aprovados e 4 expected fail conhecidos. Os quatro não aprovam a confiabilidade de alertas. |
| `node scripts/check-coverage.mjs` | Todas as quatro frações acima da baseline original; nenhum arquivo removido do escopo. |
| `CI=1 npx playwright test --project=functional --project=nonfunctional --workers=1 --retries=0` | 63 casos atenderam às expectativas: 53 funcionais (inclui um expected failure da rota FE-03) e 10 NF. Os 12 snapshots originais foram preservados. |
| E2E real, projeto `e2e` | 11 aprovados: 9 casos de produto, 1 registro de revisão e 1 pré-condição. Sem mocks nos endpoints de persistência. |
| CORS real, projeto `isolated-cors` | 4 aprovados: origem permitida, preflight, origem negada no navegador e Retry-After legível em 429. |
| Comparação NF antes/depois | Dois casos por build aprovados; dez consultas em três rodadas, parsing no Chromium e cinco navegações por condição/rota. |
| Lint global | REPROVADO por 7 erros e 2 avisos preexistentes. Não houve desativação de regras. |
| Audit frontend | REPROVADO por 9 entradas afetadas: 8 moderate e 1 high. Não são nove advisories independentes; [detalhes](nonfunctional/audit-summary.json). |

O lint conserva os erros de `set-state-in-effect` em CardBusca (2), SearchBar (2), CardCadastrar (1), novo-medicamento/page (1) e page (1). Os avisos são de dependência do efeito em MeusLembretesContent e navegação relativa no cliente HTTP. O aviso novo do cleanup de tratamento foi corrigido e seu teste de sessão revalidado, sem suprimir a regra.

Cobertura final, medida às 16:59:30 sobre o código de produto de `723a230`: linhas **790/1016 (77,75%)**, branches **589/798 (73,80%)**, funções **169/213 (79,34%)**, statements **833/1082 (76,98%)**. A baseline original permanece versionada, sem redução ou exclusão de arquivos para aprovar a coleta.

## API real isolada

Backend clonado de `MagalDevs/medreminder-backend`, revisão exata `b6b63168ba2a092e6e6350c256bfa15483199b4a`. `npm ci` e build Nest passaram. A execução usou `http://localhost:4001`, `NODE_ENV=development`, Firebase desabilitado, segredo JWT efêmero gerado localmente e `SQLITE_PATH` apontando para arquivo temporário exclusivo. `NODE_ENV=test` não foi usado porque força SQLite em memória. Migrações executadas pelo próprio backend; `/health/ready` respondeu `ready`.

O frontend foi recompilado com `NEXT_PUBLIC_API_URL=http://localhost:4001`, `NEXT_PUBLIC_API_ENV=isolated`, `E2E_API_URL` igual à origem pública e metadados `E2E_BACKEND_COMMIT`/`E2E_SQLITE_FILE`. CORS autorizou apenas `http://localhost:3001`; a origem negada foi criada pelo próprio teste. O projeto `isolated-cors` fica fora da regressão mockada e tem comando explícito, cuja seleção vazia falha.

O E2E comprovou cadastro A/B, login, perfil, CEP inválido, senha correta/incorreta/fraca, tratamento/replay da mesma chave sem duplicação, conflito 409, rejeição de DTO e credenciais inválidas, isolamento de doses entre contas, confirmação e histórico após reload. Login, perfil, logout e proteção de Configurações também foram exercitados pela interface. Isso comprova os fluxos enumerados nesta revisão local; não comprova o deploy Render, fila/cancelamento de alertas ou todos os DTOs possíveis. O teste de rate limit CORS roda depois do E2E para não consumir sua janela de login (10 tentativas por IP/minuto).

O backend temporário registrou 39 entradas de audit durante a instalação (5 low, 30 moderate, 4 high); essa instalação de suporte não altera as dependências do frontend nem aprova a segurança global do servidor.

## Estado das specs

- Integração backend T1–T12: implementadas e verificadas localmente nos limites acima. T10 mantém foto indisponível e edição de medicamento fora do fluxo existente. Campos de quantidade preservam a semântica anterior.
- Qualidade T1–T27, T29–T32 e T34–T40: execução/documentação concluída, com achados residuais explícitos. Revisões de dependência podem concluir por manutenção da versão, sem prometer compatibilidade de react-input-mask com React 19.
- T28: parcial. Coleta em 360/768/1440px concluída; leitor de tela, contraste, zoom e foco de modal ainda precisam de percurso manual. Achados de nomes/foco/labels continuam em FE-09.
- T33: parcial. Workflow validado localmente; execução GitHub, falha controlada de job e publicação de artefatos remotos não foram comprovadas. Não houve autorização remota presumida.
- T41: parcial. Persistência/isolamento e nove casos reais de produto foram aprovados. O aceite integral do MVP continua condicionado aos defeitos de alertas FE-05 e à rota de medicamentos sem proteção FE-03; nenhuma falha esperada foi contada como comportamento correto.

Os documentos de planejamento são históricos; este registro, os estados em `tasks.md` e os artefatos datados descrevem a implementação. Não foi declarada conclusão integral das duas specs nem aceite de produção.
