# Fase 3 — atualizações de dependências (T14–T22)

Execução: 2026-11-04, America/Sao_Paulo. Base: `537bfaa` (`test(functional): cover browser flows with controlled API`). Branch: `Ramon1337/medreminder-deps`. Ambiente: Windows, Node v26.8.1, npm 11.19.0, Chromium do Playwright 1.64.1. Registro complementa o inventário histórico [dependencies.json](dependencies.json); versões candidatas foram consultadas novamente no registry com `npm view`.

## Método e baseline verificada

- `npm ci`: exit 0; primeira tentativa encontrou `ENOTEMPTY`, nova execução normal concluiu sem mudar o lockfile. `npx --no-install playwright install chromium`: exit 0.
- `npx --no-install eslint .`: exit 1, **10 achados preexistentes (8 erros, 2 avisos)**, conforme [lint-baseline.log](lint-baseline.log). O critério desta fase é nenhum achado novo; não se alega lint sem erros e nenhuma regra foi relaxada.
- `npx --no-install tsc --noEmit`, `npm run build`, `npm run test:regression`: exit 0.
- Contagem real da base: **70 unitários**, **58 integrações (50 aprovadas + 8 expected fail)** e **52 funcionais**, incluindo 12 comparações `toHaveScreenshot`. A estimativa de 112 unitários da delegação não corresponde a esta base; não houve redução de seleção.
- Unitários: [api.test.ts](../../../tests/unit/api.test.ts), [infra.test.ts](../../../tests/unit/infra.test.ts), [SearchBar.test.tsx](../../../tests/unit/SearchBar.test.tsx), [CardBusca.test.tsx](../../../tests/unit/CardBusca.test.tsx). Integração: [auth.test.tsx](../../../tests/integration/auth.test.tsx), [lembretes.test.tsx](../../../tests/integration/lembretes.test.tsx), [tratamento.test.tsx](../../../tests/integration/tratamento.test.tsx). Funcionais: [fluxo.spec.ts](../../../tests/functional/fluxo.spec.ts) e [smoke.spec.ts](../../../tests/functional/smoke.spec.ts).
- `CI=1` nas regressões para exigir servidor novo do build atual na porta 3001. API controlada pelos mocks existentes; os expected fail documentam defeitos anteriores, não aprovações desses contratos. Nenhum teste, snapshot ou arquivo em `src/` alterado.
- Cada atualização usa `npm install pacote@versão`, depois `npm ci` e gates completos; nenhuma instalação com `--force` ou `--legacy-peer-deps`. Decisões sem alteração de dependências podem reutilizar o gate da árvore idêntica, identificado explicitamente.

## T14 — Next e configuração do ESLint

| Pacote | De (lockfile) | Para | Decisão |
| --- | --- | --- | --- |
| next | 16.3.6 | 16.4.5 | Atualizar minor por segurança; versão exata preservada no manifesto. |
| eslint-config-next | 16.3.6 | 16.4.5 | Atualizar em conjunto com Next. |

Fontes consultadas: Context7 `/vercel/next.js` (atualização por minor e compatibilidade ESLint 9); [release v16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5), com correções de cache, SVG e runtime Edge; advisories de origem no inventário T1, especialmente [RCE em Image Optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw) e [RCE em use cache](https://github.com/advisories/GHSA-673q-mjm6-r5xr). A versão 16.4.5 fica fora dos intervalos vulneráveis registrados. A resolução normal também elevou `sharp` 0.35.4 → 0.35.5 e seus binários/libvips, corrigindo o [advisory transitivo](https://github.com/advisories/GHSA-wq5f-xc86-pv6w). Somente Next, suas ferramentas/binários e sharp mudaram de versão no lockfile. Nenhuma ação no PR #53.

Gates T14: `npm ci` 0; `eslint .` 1 com os mesmos 10 achados da baseline (saída integral idêntica); `tsc --noEmit` 0; build 0; regressão 0 — 70 unitários, 50 integrações + 8 expected fail e 52 funcionais, 12 snapshots preservados. Tempos: ci 34,4s, lint 5,5s, tipos 4,5s, build 13,3s, regressão 25,6s.

## T15 — React e tipagens

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| react | 19.3.0 | 19.3.1 | Atualizar patch. |
| react-dom | 19.3.0 | 19.3.1 | Atualizar junto com React. |
| @types/react | 19.3.0 | 19.3.0 | Manter latest; explicitar a versão mínima já instalada. |
| @types/react-dom | 19.3.0 | 19.3.0 | Manter latest; explicitar a versão mínima já instalada. |

Fontes: Context7 `/react/react/v19.3.1`; [release 19.3.1](https://github.com/react/react/releases/tag/v19.3.1) (melhoria do protocolo de transporte de Server Components); `npm view` confirmou as quatro versões e os peers. A instalação normal resolveu os peers de Next 16.4.5 sem exceções. Sessão, formulários, hidratação/navegação, busca, dose e capturas permanecem cobertos pelas mesmas suítes.

Gates T15: `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.

## T16 — react-datepicker

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| react-datepicker | 8.3.0 | 8.10.0 | Atualizar minor compatível; 9.1.0 bloqueado: major exige escopo próprio. |

Fontes: Context7 `/hacker0x01/react-datepicker`; [release 8.10.0](https://github.com/Hacker0x01/react-datepicker/releases/tag/v8.10.0) (exports, teclado/foco e atributos ARIA); [release major 9.0.0](https://github.com/Hacker0x01/react-datepicker/releases/tag/v9.0.0); `npm view react-datepicker@8.10.0 peerDependencies` aceita React 19. Nenhum advisory direto no inventário. A instalação atualizou também dependências transitivas da família floating-ui, via resolução npm.

Inspeção de todos os `.ts/.tsx` em `src/`: nenhum import/uso de Datepicker ou CSS do pacote; o formulário usa `input` nativo. Assim, os testes verificam o contrato real das datas, não certificam a API de um calendário inexistente. Cenários existentes preservados: UT-13 início/intervalo/limite exclusivo; IT-05 payload com validade/unidades/cor; IT-05 opcionais vazios; FN-03 payload de tratamento válido e validade `2027-01-31`. O caso noturno `ACHADO-T13-01` continua expected fail, sem alteração. Locale e aparência dos campos nativos permanecem nos snapshots.

Gates T16: `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.

## T17 — lucide-react

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| lucide-react | 0.511.0 | 0.511.0 | Mantido; 1.68.0 bloqueado: major exige escopo próprio. |

Fontes: Context7 `/lucide-icons/lucide`, [migração React v0 → v1](https://github.com/lucide-icons/lucide/blob/main/docs/guide/react/migration.md) e [mudanças v1](https://github.com/lucide-icons/lucide/blob/main/docs/guide/version-1.md); `npm view lucide-react version`, `npm view lucide-react@0 version` e `npm view lucide-react@~0.511.0 version`. Não há patch posterior na linha 0.511; 0.577.0 é outra linha pré-1.0, fora de `^0.511.0`, e não foi adotada como atualização compatível implícita. A v1 remove ícones de marcas e altera `aria-hidden` padrão; a avaliação de acessibilidade e da coleção nova fica em migração própria. Não se alega regressão de uma versão não instalada. Sem advisory direto registrado.

Inventário dos imports atuais: `Bell`, `Pill`, `X` em AlarmeDose/Lembrete; `Loader2` em CardCadastrar; `Menu`, `X`, `User`, `LogOut` em Sidebar; `User`, `Settings`, `LogOut` na home. Nenhum ícone de marca é usado, mas a política permite manter a major para escopo próprio. Os rótulos e a geometria atuais ficam preservados; gate da árvore idêntica T16 (`e64cff2`) cobre controles, navegação e os 12 snapshots em 360/768/1440px. Manifesto e lockfile não mudam nesta decisão.

Gates T17 (reutiliza a rodada T16 sobre manifesto/lockfile e fontes de produto/testes identicos): `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.

## T18 — react-input-mask e tipagem

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| react-input-mask | 2.0.4 | 2.0.4 | Mantido no latest estável; uso com React 19 bloqueado por API removida. |
| @types/react-input-mask | 3.0.6 | 3.0.6 | Mantido no latest; tipagem não corrige a implementação runtime. |

Consultas `npm view` confirmaram latest/peers: runtime declara React/ReactDOM `>=0.14.0`, tipagem depende de `@types/react: *`. Context7 foi consultado com os nomes `react-input-mask` e `sanniassin/react-input-mask`, mas não encontrou a biblioteca; nenhum resultado de outra biblioteca foi usado como substituto. Fontes alternativas: [README oficial](https://github.com/sanniassin/react-input-mask/blob/master/README.md), implementação efetivamente instalada em `node_modules/react-input-mask/lib/react-input-mask.development.js:528` (chama `reactDom.findDOMNode`) e [guia React 19: API removida](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-finddomnode). `node -p "typeof require('react-dom').findDOMNode"` retornou `undefined` no React DOM 19.3.1. Peers amplos não certificam compatibilidade runtime.

Nenhum import/uso de máscara em todos os `.ts/.tsx` de `src/`; portanto, não existem os três fluxos de máscara/digitação exigidos condicionalmente pelo plano para verificar uma atualização. A biblioteca não foi montada nem habilitada, e não se alega cobertura de máscara ou compatibilidade com React 19. Os cenários reais de campos vazios, valores zero e payload do formulário (UT-12/IT-05) continuam cobertos pela regressão. Proposta separada: avaliar remoção da dependência sem uso ou uma migração de máscara compatível antes de introduzir esse recurso, com testes específicos. Nenhuma troca de biblioteca, alteração de produto ou relaxamento de tipos nesta tarefa. Sem advisory direto no inventário; manifesto/lockfile idênticos ao gate T16 (`e64cff2`).

Gates T18 (reutiliza a rodada T16 sobre manifesto/lockfile e fontes de produto/testes identicos): `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.

## T19 — PapaParse e tipagem

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| papaparse | 5.7.0 | 5.7.0 | Manter: já no latest do registry. |
| @types/papaparse | 5.5.2 | 5.5.2 | Manter: já no latest do registry. |

Fontes: Context7 `/mholt/papaparse` (configuração de header, quoting e skipEmptyLines); [release 5.7.0](https://github.com/mholt/PapaParse/releases/tag/5.7.0); [API oficial](https://www.papaparse.com/docs); `npm view` confirmou os latest acima. Nenhum advisory direto registrado. Manifesto/lockfile e catálogo não mudam; não foi necessária instalação de versões idênticas.

Os testes reais SearchBar/CardBusca usam o parser sem mock: UT-09 substring/acento e distinção de acentos; UT-09/UT-10 ordem/duplicados/limite dez; UT-14 nome inicial e seleção; descrição vazia e cabeçalho `DESCRIÇÃO`. Verificação complementar descartável com `node -` e `node:assert/strict`, PapaParse 5.7.0 e a configuração real `{header:true, skipEmptyLines:true}`: **3/3** aprovadas, exit 0 — cabeçalhos/conteúdo Unicode; linhas vazias e descrição vazia; aspas escapadas/vírgula em campo com ordem/duplicados preservados. Nenhuma alteração de testes para aprovar os gates. Gate amplo T16 reutilizado sobre árvore executável idêntica.

Gates T19 (reutiliza a rodada T16 sobre manifesto/lockfile e fontes de produto/testes identicos): `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.

## T20 — TypeScript

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| typescript | 5.8.3 | 5.9.3 | Atualizar minor; latest 7.0.2 bloqueado: major exige escopo próprio. |

Fontes: Context7 `/microsoft/typescript` (mudanças do compilador nativo TS7 e defaults) e [notas oficiais 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html). Atenção às mudanças de `lib.d.ts`, ArrayBuffer/TypedArray/Buffer e inferência de argumentos; nenhuma mudança de produto foi necessária. A migração de compilador TS7 não foi instalada nem certificada nesta manutenção. `npm view typescript@5 version` confirmou 5.9.3 como último 5.x; `npm view typescript version` confirmou 7.0.2. Sem advisory direto registrado. `tsconfig.json` permanece idêntico, incluindo strict/noEmit e resolução bundler; não há relaxamento de tipos, exclusões ou alterações de harness.

Gates T20: `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.

## T21 — Tailwind e PostCSS

| Pacote | De | Para | Decisão |
| --- | --- | --- | --- |
| tailwindcss | 4.3.3 | 4.3.4 | Atualizar patch em conjunto. |
| @tailwindcss/postcss | 4.3.3 | 4.3.4 | Atualizar patch em conjunto. |

Fontes: Context7 `/tailwindlabs/tailwindcss.com` (plugin PostCSS dedicado na v4); [release 4.3.4](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.4), que corrige escopo, detecção de fontes e geração de utilitários; `npm view` confirmou latest de ambos os pacotes. Nenhum advisory direto registrado. A configuração atual já usa `@tailwindcss/postcss` e `@import 'tailwindcss'`; não houve migração de tema, adoção de outro plugin, edição de CSS ou alteração de fontes. A resolução npm acompanha os componentes transitivos do Tailwind.

Prova visual: FN-06 login, home/busca/resultados, novo-medicamento e meus-lembretes nos três viewports 360/768/1440px (12 comparações com as referências originais). Nenhuma autorização para regenerar snapshots foi usada.

Gates T21: `npm ci` exit 0; `npx --no-install eslint .` exit 1 (10 achados preexistentes, saída idêntica à baseline); `npx --no-install tsc --noEmit`, `npm run build` e `npm run test:regression` exit 0. Mesma seleção: 70 unitários, 50 integrações + 8 expected fail, 52 funcionais; 12 snapshots preservados.
