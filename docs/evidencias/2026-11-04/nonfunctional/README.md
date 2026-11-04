# Avaliação não funcional — 04/11/2026

Ambiente e amostras estão nos JSONs desta pasta, medidos no working tree sobre `84b5ae7`, com build Next 16.4.5, Chromium local e API interceptada. As mudanças de integração ainda estavam em andamento; a identificação por commit sozinha não reproduz esse working tree. Não houve consulta nem mutação na API de produção.

`npx playwright test --project=nonfunctional --workers=1`: **10 testes passaram**, saída 0, 30,6 s incluindo preparação/build. Após acrescentar guarda de rede aos contextos criados manualmente, `performance.spec.ts` e `scale.spec.ts` foram reexecutados: **3 passaram**, saída 0, 26,2 s. TypeScript do build passou; ESLint dos arquivos NF sem achados.

| Critério | Evidência | Resultado e limite |
| --- | --- | --- |
| NF-01 / T28 | `accessibility-{360,768,1440}.json` | Avaliação parcial de quatro rotas por largura, nomes DOM, tabulação, estilos de foco e overflow. Leitor de tela, contraste, zoom e foco de modal não avaliados manualmente. |
| NF-02 / T29 busca | `catalog-performance.json`, `before-catalog-performance.json`, `after-catalog-performance.json` | Dez consultas idênticas, três rodadas, vinte aquecimentos e igualdade de resultados. Coleta final mede download e cinco parses no Chromium, separadamente do render da aplicação. |
| NF-02 / T29 rotas | `before-route-performance.json`, `after-route-performance.json` | Home/login/formulário/lista, cinco execuções por condição em dois builds. [Comparação e reprodução](performance-comparison.md). Interceptação desliga cache HTTP; “warm” significa segunda navegação, sem promessa de benefício de cache. |
| NF-03 / T30 | `security-*.json`, `audit-summary.json` | Quatro cenários locais: login/logging, erro HTTP, 401 e logout. Token e perfil continuam no localStorage; npm audit falha por 9 entradas afetadas (8 moderate, 1 high). Os casos SEC-01/02/03 de integração complementam cadastro e alerta. |
| NF-04 / T31 | `scale.json` | Cinco execuções para 10/100/1000 medicamentos e doses. Carregamento até número esperado de cartões e filtragem até metade tomada, amostras, mediana, máximo, heap e erros. Nenhuma evidência de concorrência, API, banco ou cloud. |

Os testes de acessibilidade são instrumentos de avaliação, sem asserção de conformidade global. Achados visíveis: campo de busca e botão de seta sem nome acessível, campo sem indicação de foco, labels de filtros sem associação programática. Relacionados a [FE-09](https://github.com/MagalDevs/Front_MedReminder/issues/33); não houve alteração visual nesta tarefa. “Passou” significa que a coleta e as asserções declaradas passaram; os achados continuam presentes.

A meta de p95 menor que 500 ms é proposta histórica do plano. Dez consultas por rodada produzem p95 nearest-rank igual ao máximo; não estimam com robustez a cauda de produção. O [benchmark anterior](../benchmark-busca.md) contém três execuções Node, com ganho pequeno e ruído explicitado; não confundir com ganho perceptível na interface.

Na consolidação, 63 casos funcionais/NF passaram em conjunto. T29 foi complementada por quatro testes de comparação em dois builds locais, incluindo parsing no Chromium. O E2E isolado e o CORS real também passaram, conforme [registro final](../execution-final.md). Permanecem pendentes o percurso manual por leitor de tela/contraste/zoom/modal (T28) e a comprovação do CI remoto. Nenhum achado foi convertido em conformidade.
