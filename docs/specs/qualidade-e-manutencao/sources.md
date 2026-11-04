# Planning Sources and Issue Traceability

**Date checked**: 2026-11-04, America/Sao_Paulo.
**Code baseline**: `43b05890d8a6cca1311969a6ca51a9f9decc2620`.
**Status**: fonte do plano Draft; estado remoto é um retrato da consulta, não acompanhamento automático.

## Source Precedence

O pedido do usuário fixa o escopo: specs em `docs`, manutenção sem mudança de lógica e documentação/testes. A resposta do usuário fixa a stack em `context.md`. O código local define os comportamentos atualmente implementados. As issues e os documentos existentes descrevem a evolução desejada e as limitações; não autorizam ampliar este pedido para mudanças funcionais.

Graphify foi consultado primeiro para a estrutura do repositório. O índice promovido de 15/10/2026 coincide com o HEAD local. Arquivos atuais foram lidos para conferir configurações, contratos e documentação; ausência de vínculo de teste no grafo não foi usada como percentual de cobertura.

## GitHub Issues

Consulta feita pela integração GitHub conectada, com leitura dos corpos das issues e confirmação do estado pela coleção REST `issues?state=all&per_page=100`. Foram identificadas 15 issues e 38 pull requests na resposta; PRs foram separados das issues. As 15 issues abaixo estavam abertas e sem comentários na consulta. Nenhuma foi alterada.

| Issue | ID / title | State | Planned tasks | Scope treatment |
| --- | --- | --- | --- | --- |
| [#25](https://github.com/MagalDevs/Front_MedReminder/issues/25) | [P0] FE-01 — Garantir instalação, build e lint reproduzíveis | open | T1–T6; T14–T22; T37 | Instalação/runtime/lint e atualização compatível; issue não concluída pelo planejamento. |
| [#26](https://github.com/MagalDevs/Front_MedReminder/issues/26) | [P0] FE-02 — Substituir histórico simulado por doses reais da API | open | T8; T41; T34; T39 | Dependência funcional: histórico real fora da otimização; impede aprovação dos casos de histórico. |
| [#27](https://github.com/MagalDevs/Front_MedReminder/issues/27) | [P0] FE-03 — Validar sessão e limpar dados protegidos ao expirar ou sair | open | T8; T12; T41; T34; T39 | Caracterização da sessão atual; validação remota/limpeza ampliada continuam em escopo funcional separado. |
| [#28](https://github.com/MagalDevs/Front_MedReminder/issues/28) | [P1] FE-04 — Alinhar atualização de perfil, senha e foto aos contratos da API | open | T41; T34; T39 | Conferência e testes condicionais; decidir contratos de senha/foto exige trabalho funcional separado. |
| [#29](https://github.com/MagalDevs/Front_MedReminder/issues/29) | [P1] FE-05 — Corrigir ciclo de vida dos alertas e atualização dos lembretes | open | T12; T27; T41; T39 | Apenas minimização de logs no código; fila, deduplicação e cancelamento de timers permanecem dependência. |
| [#30](https://github.com/MagalDevs/Front_MedReminder/issues/30) | [P1] FE-06 — Centralizar cliente HTTP e configurar URL da API por ambiente | open | T41; T35; T38 | Registrar arquitetura atual e necessidade de API por ambiente; centralização geral não é feita como otimização. E2E real exige esta configuração ou isolamento local explicitamente verificado. |
| [#31](https://github.com/MagalDevs/Front_MedReminder/issues/31) | [P1] FE-07 — Criar suíte de componentes, E2E e execução em CI | open | T3–T12; T25–T33; T40 | Infraestrutura, quatro categorias de testes, cobertura e CI; aceite integrado depende das correções funcionais listadas. |
| [#32](https://github.com/MagalDevs/Front_MedReminder/issues/32) | [P1] FE-08 — Tratar carregamento e falhas parciais no cadastro de tratamento | open | T11; T41; T34; T39 | Testar duas etapas e registrar falha parcial; não introduzir retry/transação/idempotência sem contrato. |
| [#33](https://github.com/MagalDevs/Front_MedReminder/issues/33) | [P1] FE-09 — Melhorar acessibilidade e responsividade do fluxo principal | open | T9; T10; T13; T28 | Preservação visual e avaliação teclado/responsividade; correções de layout/gestos seguem FE-09 separadamente. |
| [#34](https://github.com/MagalDevs/Front_MedReminder/issues/34) | [P2] FE-10 — Otimizar busca e documentar origem e versão do catálogo CSV | open | T9; T10; T19; T23; T24; T29; T38 | Normalização local de consulta e benchmark; cache/debounce/limite diferente não são incluídos. Origem/licença/data do CSV só serão afirmadas com fonte verificável. |
| [#35](https://github.com/MagalDevs/Front_MedReminder/issues/35) | [P2] FE-11 — Planejar notificações fora da página e adiamento persistido | open | T34; T38; T39 | Fora do escopo: notificação fora da página e adiamento persistido exigem novos contratos. |
| [#36](https://github.com/MagalDevs/Front_MedReminder/issues/36) | [P1] FE-12 — Documentar e configurar implantação cloud e rollback do frontend | open | T31; T35; T38 | Documentar requisitos/limites e evidências locais; sem implantar ou ensaiar rollback remoto nesta rodada. |
| [#37](https://github.com/MagalDevs/Front_MedReminder/issues/37) | [P1] FE-13 — Configurar monitoramento básico e evidenciar alertas | open | T38; T39 | Registrar ausência/limites de evidência operacional; sem configurar serviço de monitoramento. |
| [#38](https://github.com/MagalDevs/Front_MedReminder/issues/38) | [P1] FE-14 — Executar testes não funcionais e publicar relatório de qualidade | open | T28–T32; T38; T39 | Medições não funcionais e relatório com cobertura, método, falhas e bloqueios. |
| [#39](https://github.com/MagalDevs/Front_MedReminder/issues/39) | [P1] FE-15 — Validar fluxo integrado e preparar apresentação do MVP web | open | T41; T34; T39; T40 | Rastrear aceite integrado; plano não declara MVP aprovado, P0 resolvido ou apresentação executada. |

IDs BE/MO nos corpos são planejamento de outros repositórios. O plano não presume sua conclusão nem valida os contratos do backend por leitura de uma issue. Não foram criadas novas issues nem enviados comentários.

## Existing Dependency Pull Requests

Estes PRs estavam abertos em 04/11/2026. Versões citadas são as propostas nos títulos consultados, **não recomendação de versão final nem avaliação de segurança da aplicação**. Conferir release notes/advisories, diff e peers na execução. Preferir revisar o trabalho existente a duplicar PRs.

| PR | Proposed update | Planning action |
| --- | --- | --- |
| [#48](https://github.com/MagalDevs/Front_MedReminder/pull/48) | chore(deps-dev): bump eslint from 9.25.1 to 10.11.0 | Inventariar e avaliar compatibilidade em T1/T14–T22; nenhuma ação de merge/push autorizada. |
| [#49](https://github.com/MagalDevs/Front_MedReminder/pull/49) | chore(deps-dev): bump @types/node from 20.17.30 to 26.6.3 | Inventariar e avaliar compatibilidade em T1/T14–T22; nenhuma ação de merge/push autorizada. |
| [#50](https://github.com/MagalDevs/Front_MedReminder/pull/50) | chore(deps): bump lucide-react from 0.511.0 to 1.48.0 | Inventariar e avaliar compatibilidade em T1/T14–T22; nenhuma ação de merge/push autorizada. |
| [#51](https://github.com/MagalDevs/Front_MedReminder/pull/51) | chore(deps): bump react-datepicker from 8.3.0 to 9.1.0 | Inventariar e avaliar compatibilidade em T1/T14–T22; nenhuma ação de merge/push autorizada. |
| [#52](https://github.com/MagalDevs/Front_MedReminder/pull/52) | chore(deps-dev): bump typescript from 5.8.3 to 7.0.2 | Inventariar e avaliar compatibilidade em T1/T14–T22; nenhuma ação de merge/push autorizada. |
| [#53](https://github.com/MagalDevs/Front_MedReminder/pull/53) | chore(deps): bump next from 16.3.6 to 16.3.8 in the security group across 1 directory | Inventariar e avaliar compatibilidade em T1/T14–T22; nenhuma ação de merge/push autorizada. |

O PR #53 é identificado pelo Dependabot como atualização de segurança de Next. Isso prioriza a análise da manutenção; não substitui auditoria do lockfile ou verificação de aplicabilidade dos advisories.

## Repository Documents

| Source | What it establishes | Limit |
| --- | --- | --- |
| [docs/README.md](../../README.md) | Índice da documentação existente | Deve distinguir planejamento de resultado. |
| [BACKLOG.md](../../BACKLOG.md) e [ISSUES.md](../../ISSUES.md) | Prioridades FE e vínculos históricos | Estado consultado do GitHub acima é mais recente. |
| [PLANO_TESTES.md](../../PLANO_TESTES.md) | WEB-01..09, NF-WEB-01..04, larguras e meta proposta de busca | Cenários não são resultados executados. |
| [RELATORIO_QUALIDADE.md](../../RELATORIO_QUALIDADE.md) | Resultados de 01/10/2026 no commit ffd8893 | Não valida o HEAD atual nem contém cobertura medida. |
| [INVENTARIO.md](../../INVENTARIO.md) | Diagnóstico histórico do MVP | Next 15 é informação histórica; manifesto atual usa Next 16.3.6. |
| [DEPENDENCIES.md](../../DEPENDENCIES.md) e [Dependabot](../../../.github/dependabot.yml) | Rotina semanal, grupos, espera e revisão de majors | Não há CI de testes própria na baseline. |
| [CLOUD.md](../../CLOUD.md) | Implantação, ambiente e observabilidade planejados | CDN/deploy/réplicas/monitoramento não comprovados. |
| [tests/README.md](../../../tests/README.md) e [registro](../../../tests/REGISTRO_EXECUCAO.md) | Preparação, dados sintéticos e evidências | Diretório documental não é suíte automatizada. |

## Code Evidence

Reverificação dos dois repositórios em 04/11/2026: [integração com o backend](../integracao-backend/README.md). A API no commit `b6b6316` já implementa PATCH `/usuario/senha`, CORS e POST `/tratamento` atômico. Foto de usuário continua ausente. As referências históricas e os corpos das issues não comprovam ausência dessas capacidades no código atual. As issues não foram alteradas nem reconsultadas nesta segunda rodada.

| Source | Evidence used |
| --- | --- |
| `package.json`, `package-lock.json`, `eslint.config.mjs`, `tsconfig.json` | Dependências, comandos, regras e aliases reais. |
| `src/app/layout.tsx` | Composição dos providers e alerta global. |
| `src/app/globals.css`, `tailwind.config.js`, `public/fonts/` | Estilos e fontes que a manutenção preserva. |
| `src/app/utils/api.ts` | Fetch/Bearer, parsing, mensagens, 401 e logs. |
| `src/app/contexts/AuthContext.tsx` | Presença de token como estado de sessão e persistência local. |
| `src/app/components/SearchBar/SearchBar.tsx`, `src/app/components/CardBusca/cardBusca.tsx` | Substring case insensitive, ordem, dez sugestões e gestos diferentes. |
| `src/app/components/CardCadastrar/cardCadastrar.tsx` | Cálculo temporal e envio sequencial de medicamento/doses. |
| `src/app/contexts/lembreteContext.tsx`, `src/app/components/AlarmeDose/` | Filtro temporal, confirmação e limites dos timers. |
| `src/app/cadastro/page.tsx:44` | Log do payload com dados pessoais e senha. |
| `src/app/historico/HistoricoContent.tsx` | Simulação de histórico e chamada direta. |
| `src/app/Configuracoes/ConfiguracoesContent.tsx` | Perfil e chamadas de senha/foto dependentes de contrato. |
| `public/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv` | Catálogo versionado de 819990 bytes; origem/data/licença precisam de fonte própria. |

## Official Technical References

Consultadas em 04/11/2026, após o código e os documentos locais. Estes links sustentam decisões técnicas do plano, sem substituir testes no projeto.

- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16): remoção de `next lint`; lint precisa ser executado separadamente do build. T2/T3 ajustam configuração e comando.
- [Vitest with Next.js](https://nextjs.org/docs/app/guides/testing/vitest): configuração de unitários com Vitest/React Testing Library; componentes async de servidor exigem outra fronteira de teste, como E2E.
- [Playwright with Next.js](https://nextjs.org/docs/app/guides/testing/playwright): testes de navegador contra aplicação compilada e servidor disponível.
- [npm outdated](https://docs.npmjs.com/cli/v11/commands/npm-outdated/): distinguir versão instalada, wanted e latest na coleta do inventário.
- [npm audit](https://docs.npmjs.com/cli/commands/npm-audit/): auditar a árvore e registrar o resultado real. Disponibilidade do comando não significa ausência de vulnerabilidades.
