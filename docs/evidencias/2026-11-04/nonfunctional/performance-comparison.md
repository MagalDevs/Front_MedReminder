# Comparação de dois builds locais

Antes: `537bfaa`, Next 16.3.6; depois: código de produto `c622045`, Next 16.4.5, mais o runner de medição. O arquivo ZIP usado para extrair a revisão anterior foi comparado por SHA256 com um novo `git archive 537bfaa` e correspondeu byte a byte; o lockfile também correspondeu. Cada build usa suas próprias dependências e servidor, nas portas 3002 e 3001 respectivamente. O SO, navegador, máquina, CSV e fixtures de domínio foram mantidos. Os metadados completos e todas as amostras estão nos JSONs `before-*` e `after-*` desta pasta.

| Rota | Mediana inicial antes/depois (ms) | Mediana segunda navegação antes/depois (ms) | JS observado antes/depois (bytes) |
| --- | --- | --- | --- |
| Home | 126,42 / 131,12 | 69,20 / 76,02 | 628142 / 633301 |
| Login | 119,56 / 121,71 | 66,07 / 63,26 | 604210 / 609377 |
| Novo medicamento | 137,55 / 137,27 | 79,06 / 76,02 | 639213 / 644590 |
| Meus lembretes | 131,00 / 147,23 | 84,08 / 82,57 | 611331 / 616452 |

São cinco execuções por condição e rota. O tempo inclui navegação até load e fontes, controle do navegador e asserção; não é tempo puro de render nem LCP/INP/CLS. A mediana inicial piorou em três rotas e ficou próxima na outra. O JS observado aumentou cerca de 5,1–5,4 kB por rota. São revisões com dependências e contratos de sessão diferentes; não se atribui causalidade à otimização de busca nem se anuncia ganho de navegação. As diferenças pequenas podem conter ruído; não houve uma campanha repetida entre dias ou dispositivos.

O routing de testes desliga o cache HTTP; a segunda navegação mede reutilização do contexto, sem provar benefício de cache de navegador. O Chromium pode fornecer tamanhos zero em ResourceTiming com interceptação. Por isso os corpos dos arquivos JS da mesma origem foram lidos por APIRequestContext fora do intervalo cronometrado. É o conjunto de scripts observado por rota, não um inventário completo de todos os bundles.

As duas coletas de catálogo usam 819990 bytes, o mesmo SHA256, dez consultas, três rodadas iguais e vinte passagens de aquecimento. Download, parsing PapaParse no Chromium (cinco amostras) e filtro são medidos separadamente. A distribuição minificada do parser é injetada no navegador; isso isola o algoritmo, não o custo do ciclo de montagem React. Cada variante mantém resultados idênticos. P95 usa nearest-rank; com dez consultas por rodada ele coincide com o máximo e não sustenta estimativa robusta de cauda.

Reprodução: extrair as revisões em diretórios separados fora do repositório, executar `npm ci`, `npm run build` e `npm run start -- --port <porta>` em cada uma. No repositório atual, definir `NF_TARGET_URL` para o servidor loopback já iniciado, `NF_BUILD_COMMIT` para a revisão medida e `NF_EVIDENCE_PREFIX=before` ou `after`; executar `npx playwright test --config=playwright.performance.config.ts`. O runner não inicia nem reconstrói servidores. Não executar esse comando contra implantação remota.
