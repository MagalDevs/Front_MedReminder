# Evidências e limites de escala

Rodada local de 04/11/2026, base `84b5ae7` com alterações em integração. A aplicação foi compilada em produção e executada no Chromium local; a API foi interceptada com dados sintéticos. Nenhuma medição desta página demonstra capacidade do servidor ou banco.

| Afirmação | Evidência e limite |
| --- | --- |
| O catálogo versionado tem 819990 bytes e 19035 linhas de produto | [Benchmark](evidencias/2026-11-04/benchmark-busca.md), hash SHA256 e método registrados. CSV servido como recurso estático. |
| A normalização da consulta uma vez por filtro reduz trabalho | [Comparação Node](evidencias/2026-11-04/benchmark-busca.md): mediana menor nas três execuções, ganho pequeno e ruído. [Comparação Chromium](evidencias/2026-11-04/nonfunctional/catalog-performance.json): mesmas consultas e igualdade de resultados. Não extrapolar para ganho perceptível. |
| Há custo de baixar e interpretar o CSV por montagem | [Source](../src/app/components/SearchBar/SearchBar.tsx) e [medição Chromium](evidencias/2026-11-04/nonfunctional/after-catalog-performance.json): download e cinco parses separados. O parser foi injetado da mesma distribuição PapaParse, fora do render da aplicação. Cache compartilhado entre componentes não implementado. |
| A lista local foi exercitada com 10, 100 e 1000 doses | [scale.json](evidencias/2026-11-04/nonfunctional/scale.json), cinco execuções por volume, amostras, mediana/máximo, heap e erros. API mockada. Contagem de cartões verifica renderização observável, sem inferir número de renders React. |
| Há comparação local de navegação e recursos JavaScript | [Antes](evidencias/2026-11-04/nonfunctional/before-route-performance.json) e [depois](evidencias/2026-11-04/nonfunctional/after-route-performance.json), quatro rotas, cinco amostras por condição. Variações e crescimento de JS registrados no [relatório](evidencias/2026-11-04/nonfunctional/performance-comparison.md); interceptação desliga cache HTTP. |
| Escala horizontal, capacidade multiusuário, banco, disponibilidade, CDN e rollback em operação | **NÃO COMPROVADOS** por estas medições. Dependem de experimento próprio em homologação e evidências de [cloud](CLOUD.md). |

O filtro é linear no número de medicamentos; a lista renderiza os registros disponíveis sem virtualização. A busca mostra até dez sugestões, mas filtra o catálogo completo antes do corte visual. O tamanho do bundle e o uso de recursos estáticos são características de arquitetura, não testes de concorrência.

Os relatórios registram CPU, memória total, sistema, Node, viewport/condição e relógio; heap é uma observação oferecida pelo Chromium, não memória exclusiva da aplicação. CPU por interação não foi medida. O tempo de teste inclui controle do navegador e asserção, portanto não representa tempo puro de renderização nem dados de campo.

Próximas hipóteses para avaliação: compartilhar o catálogo já interpretado, limitar/virtualizar listas longas e medir navegação em dispositivos modestos. Não foram implementadas nem apresentadas como capacidade disponível. CDN, réplicas e monitoramento permanecem propostas externas às provas locais; consultar [FE-10/12/13/14](BACKLOG.md).
