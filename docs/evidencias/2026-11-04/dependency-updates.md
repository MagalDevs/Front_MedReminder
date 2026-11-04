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
