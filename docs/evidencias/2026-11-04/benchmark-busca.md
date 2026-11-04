# Benchmark da busca (T23 SearchBar / T24 CardBusca) — CODE-01, CODE-02, IT-09

Data: 2026-11-04. Branch `feat/executar-specs`. Medição local, sem rede; não extrapola para dispositivos móveis nem produção.

## Decisão

| Componente | Alteração | Decisão |
| --- | --- | --- |
| `src/app/components/SearchBar/SearchBar.tsx` (T23) | `searchQuery.toLowerCase()` calculado uma vez por filtragem (`lowerQuery`) | **Aplicada** |
| `src/app/components/CardBusca/cardBusca.tsx` (T24) | `searchTerm.toLowerCase()` calculado uma vez por filtragem (`lowerTerm`) | **Aplicada** |

Os dois componentes têm a mesma expressão de filtro sobre o mesmo catálogo; o mesmo benchmark cobre ambos (não há diferença de algoritmo entre eles). Nenhuma outra mudança: sem `trim`, sem remoção de acentos, sem debounce, sem cache, mesmo limite visual de 10, mesma ordem, mesmos estados, `onSelect` e `handleResultClick` intocados.

## Ambiente

- Node: v26.8.1 (win32 10.0.26300 x64)
- CPU: AMD Ryzen 7 5700X 8-Core Processor (16 threads, `os.cpus()[0].model`)
- Catálogo: `public/assets/DADOS_ABERTOS_MEDICAMENTOS_LIMPO.csv`, 819 990 bytes, 19 035 linhas (papaparse, `header: true`, `skipEmptyLines: true`)
- SHA-256 do CSV: `05dd7279126e11616ce304050cbc048a1848bcbaa27182a6a499f85d496f17ce`
- Script: `.claude/tmp/bench-busca.mjs` (temporário, fora das suítes; replica literalmente a expressão antiga e a nova)

## Método

- Antes: `meds.filter((med) => med.NOME_PRODUTO?.toLowerCase().includes(searchQuery.toLowerCase()))`
- Depois: `const lowerQuery = searchQuery.toLowerCase(); meds.filter((med) => med.NOME_PRODUTO?.toLowerCase().includes(lowerQuery))`
- 10 consultas fixas: `dip`, `para`, `amox`, `a`, `ibu`, `loratadina`, `xyz`, `ácido`, `vitamina`, `clor`.
- 3 rodadas por variante, intercaladas (antes, depois, antes, depois, antes, depois) para não favorecer a ordem. Cada rodada: 50 chamadas de aquecimento por consulta e 200 chamadas cronometradas individualmente (`performance.now()`) por consulta = 2 000 amostras por rodada.
- Mediana e p95 por nearest-rank (`sorted[ceil(p/100 * n) - 1]`), em ms por filtragem completa do catálogo.
- Antes de medir, o script confirma que as duas variantes devolvem os mesmos elementos (referência) na mesma ordem para as 10 consultas.
- O experimento foi executado 3 vezes (execuções 1 a 3) para avaliar ruído entre processos.

## Resultados (ms por filtragem; antes = A, depois = D)

Execução 1 (principal):

| Rodada | A mediana | A p95 | D mediana | D p95 |
| --- | --- | --- | --- | --- |
| 1 | 1.470 | 2.801 | 1.295 | 2.084 |
| 2 | 1.458 | 2.444 | 1.282 | 1.965 |
| 3 | 1.140 | 1.705 | 1.030 | 1.523 |
| agregado (6 000 amostras) | 1.341 | 2.378 | 1.185 | 1.890 |

Execução 2 (réplica):

| Rodada | A mediana | A p95 | D mediana | D p95 |
| --- | --- | --- | --- | --- |
| 1 | 1.192 | 1.682 | 1.042 | 1.540 |
| 2 | 1.164 | 1.591 | 0.980 | 1.378 |
| 3 | 1.189 | 1.625 | 1.006 | 1.508 |
| agregado | 1.182 | 1.634 | 1.008 | 1.483 |

Execução 3 (réplica):

| Rodada | A mediana | A p95 | D mediana | D p95 |
| --- | --- | --- | --- | --- |
| 1 | 1.128 | 1.759 | 1.110 | 1.725 |
| 2 | 1.459 | 2.297 | 1.309 | 1.989 |
| 3 | 1.554 | 2.374 | 1.504 | 2.446 |
| agregado | 1.400 | 2.221 | 1.320 | 2.118 |

Por consulta (execução 1, 600 amostras por variante):

| Consulta | Correspondências | A mediana | A p95 | D mediana | D p95 |
| --- | --- | --- | --- | --- | --- |
| dip | 223 | 1.481 | 2.765 | 1.298 | 2.014 |
| para | 152 | 1.409 | 2.756 | 1.286 | 1.988 |
| amox | 113 | 1.506 | 2.646 | 1.337 | 2.213 |
| a | 13573 | 1.269 | 2.384 | 1.142 | 1.790 |
| ibu | 46 | 1.430 | 2.370 | 1.370 | 2.155 |
| loratadina | 12 | 1.228 | 2.070 | 1.057 | 1.740 |
| xyz | 0 | 1.251 | 2.137 | 1.183 | 1.757 |
| ácido | 59 | 1.270 | 2.074 | 1.111 | 1.594 |
| vitamina | 113 | 1.253 | 2.150 | 1.045 | 1.454 |
| clor | 784 | 1.365 | 2.143 | 1.175 | 1.830 |

## Interpretação

- A mediana agregada caiu em 3 de 3 execuções (-11,6%, -14,7% e -5,7%); em 9 de 9 rodadas a mediana de D ficou abaixo da de A, e o p95 agregado caiu em 3 de 3 execuções (em 1 das 9 rodadas, execução 3 rodada 3, o p95 de D ficou 3% acima). Em todas as 10 consultas da execução 1 a mediana de D ficou abaixo da de A.
- O ganho é real, porém pequeno em termos absolutos: cerca de 0,08 a 0,18 ms por filtragem de 19 035 linhas, e há ruído entre rodadas e execuções (as medianas de A variam de 1,13 a 1,55 ms). Não deve ser descrito como melhoria perceptível pelo usuário; é redução de trabalho repetido (uma chamada de `toLowerCase` por item eliminada) sem mudança de comportamento.
- Critério aplicado: benefício medido e consistente na direção, risco funcional nulo (comportamento coberto por testes de caracterização e de equivalência) => otimização mantida. Se uma reexecução futura não reproduzir a direção do ganho, reverter é trivial (3 linhas por componente).

## Equivalência funcional (IT-09)

- `tests/unit/SearchBar.test.tsx` e `tests/unit/CardBusca.test.tsx`: expectativas de T9/T10 inalteradas, todas verdes.
- Blocos novos `IT-09 CODE-01 equivalência da otimização` e `IT-09 CODE-02 equivalência da otimização`: dataset fixo com nomes que divergiriam sob `trim` ou remoção de acentos (`Ácido Fólico`, `ÁCIDO ÚRICO`, `Acido Sintetico`, ` dip Espaço `), consultas `DIP`, `dip`, ` dip`, `dip `, `ácido`, `ÁCIDO`, `acido`, `ACIDO`, `xyz`; cada resultado é comparado com valores esperados explícitos e com a expressão antiga (cópia literal) aplicada às mesmas linhas.
- Verificação de sensibilidade: com mutação temporária `trim()` na consulta, 7 testes falham (3 em CardBusca, 4 em SearchBar), incluindo os novos; a mutação foi revertida.
