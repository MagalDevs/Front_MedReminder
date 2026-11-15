# Legacy Regression Migration

**Status**: Approved
**Approved**: 2026-11-14 - user: "Sim, migrar testes e capturas"
**Scope**: Existing frontend tests that execute the routes and accessible controls replaced by the approved web UX feature.

## Concrete Conflicts

| Area | Existing expectation | Approved behavior | Affected examples |
| --- | --- | --- | --- |
| Login | Redirect to `/`; loading label `Processando...` | Default `/hoje`, validated internal return target; `Entrando…` | `tests/integration/auth.test.tsx`, `cadastro-feedback-login.test.tsx`, `cadastro-feedback-session.test.tsx` |
| Account registration | All inputs available together, placeholder-based filling, `Cadastrar` | Account and personal-data steps, associated labels, `Criar conta` | `tests/integration/backend-cadastro.test.tsx`, `cadastro-feedback-registration.test.tsx`, `seguranca-cadastro.test.tsx` |
| Treatment route | Single form, `Salvar lembrete`, route mounted without the draft boundary | Medicamento / Tratamento / Revisão, `Salvar tratamento`, stable identity-bound draft provider | Route cases in `tests/integration/tratamento.test.tsx`, `tests/functional/fluxo.spec.ts` |
| Catalog | Search exposed as a textbox | Combobox/listbox with keyboard selection and manual path | `tests/unit/CardBusca.test.tsx`, `tests/integration/cadastro-feedback-catalog.test.tsx`, browser journeys |
| Visual regression | Previous layouts and navigation | Approved shared visual system, four destinations and progressive forms | Snapshot cases and their existing PNG baselines in `tests/functional/fluxo.spec.ts` |

Graphify was consulted for affected dependencies at indexed baseline `e042183`. Current files and observed gates take precedence over that older graph. The examples identify the concrete migration; the same approved interface changes may affect other existing route journeys.

## Preservation Rules

- Keep every existing scenario and its business assertions. Do not delete, skip, mark expected failure or reduce test counts to pass.
- Update selectors, visible copy, destination assertions and form gestures only when they conflict with the approved UI. Use real step navigation, fields, review and submission.
- Preserve exact payload checks, status/error behavior, request counts, idempotency, identity isolation, late-response rejection, concurrency and cancellation checks.
- Preserve the registration deadline of exactly 15,000 ms, including pending response bodies, timeout feedback, abort, no automatic retry and late-response suppression. A missing deadline is a product regression to fix, not an assertion to relax.
- Normalize routing mocks and required providers to the real Next/Auth/Draft boundaries. Test expectations must come from the spec rather than production functions used to compute their own expected values.
- Update visual baselines only after inspecting the rendered states at their original dimensions. Do not increase tolerance, add masks, resize captures or remove viewport coverage to hide differences. The new 320/390 checks supplement the previous coverage.
- If a failure shows broken behavior rather than an obsolete UI expectation, fix the implementation and keep the assertion.
- This proposal does not change backend/mobile code, real API data, coverage floors, E2E preconditions, production or deployment.

## Validation

The user's exact approval is recorded in context.md. Run affected files with their original scenarios and the complete final proof groups required by tasks.md. Record selected/executed counts and distinguish controlled API fixtures from real E2E. Independent verification remains mandatory.

## Sequential Execution Batches

Execute only after B7 returns. These are corrective test-migration batches under the existing approval, not new product scope or replacements for the 47 implementation tasks.

1. R1, catalog and login: `CardBusca.test.tsx`, `cadastro-feedback-catalog.test.tsx`, `auth.test.tsx`, `cadastro-feedback-login.test.tsx`, `cadastro-feedback-session.test.tsx` and minimal shared test harness. Collect original scenarios before editing; gate and commit each coherent file or journey.
2. R2, account registration and treatment: `backend-cadastro.test.tsx`, `cadastro-feedback-registration.test.tsx`, `seguranca-cadastro.test.tsx`, route cases in `tratamento.test.tsx` and minimal shared harness. Keep independent legacy component cases intact when their behavior was not changed. Preserve the exact 15-second deadline and distinguish client validation from injected server failures without losing either scenario.
3. R3, browser regression and visual baselines: existing functional/nonfunctional journeys affected by the new routes, beginning with `fluxo.spec.ts`. Perform the new UI gestures, inspect captures at original sizes and update only changed references after review. Keep the API guard and coverage floors. Review E2E selectors for compatibility; real E2E remains blocked without the already-required isolated API configuration and is never counted as a passing controlled-API run.

Only one worker runs at a time. Do not run competing builds/servers. Preserve the 44 preexisting staged skill/lock files with path-restricted commits. Record each dispatch before sending it and each return in tasks.md. The root performs the final walk, proofs, independent verification, fixes and completion gate after these batches.

## R1 Baseline Inventory

Observed 2026-11-15 at HEAD 24b8cc0: 75 selected/executed, 25 passed, 50 failed, no skipped. Expanded parameter cases below were collected before edits. Original names/IDs and all parameter rows are preserved.

### tests/unit/CardBusca.test.tsx

- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 inicial encontra nome do catálogo aparado e ignora caixa
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 inicial inexistente não emite seleção
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 inicial duplicado escolhe o primeiro objeto na ordem do CSV
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 clique fecha dropdown e emite objeto original somente após timer zero
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 limpeza após seleção emite objeto vazio imediatamente
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 dropdown vazio abre e fecha sem sugestões nem callback
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 busca mantém ordem e duplicados no limite de dez
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 acento e espaços continuam significativos na busca
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > UT-14 CODE-02 TEST-01 descrição vazia é preservada no callback assíncrono
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > CODE-02 reabrir após escolher duplicado com consulta exata mantém só a linha escolhida
- tests/unit/CardBusca.test.tsx > CardBusca — UT-14 CODE-02 TEST-01 DEP-03 > CODE-02 mudança de inicial atualiza seleção encontrada e preserva a última quando não encontra
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "DIP" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "dip" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo " dip" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "dip " mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "ácido" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "ÁCIDO" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "acido" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "ACIDO" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termo "xyz" mantém nomes, ordem e equivale ao filtro anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 termos alternados e limpeza não reutilizam resultado anterior
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 seleção emite o objeto original somente após timer zero
- tests/unit/CardBusca.test.tsx > CardBusca — IT-09 CODE-02 equivalência da otimização > IT-09 CODE-02 TEST-01 medicamentoInicial ignora caixa, mas não acentos nem espaço inicial

### tests/integration/cadastro-feedback-catalog.test.tsx

- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 ERR-09 HTTP429 respeita Retry-After 0
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 ERR-09 HTTP429 respeita Retry-After 7
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 ERR-09 HTTP429 respeita Retry-After invalid
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 falha 503 produz alerta e não falso vazio/seleção
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 falha network produz alerta e não falso vazio/seleção
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 falha header produz alerta e não falso vazio/seleção
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 falha parser produz alerta e não falso vazio/seleção
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-01 NET-19 falha body produz alerta e não falso vazio/seleção
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-14 loading distinto de vazio; descrição vazia permite seleção real
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-19 desmontagem aborta sem erro tardio nem seleção inicial
- tests/integration/cadastro-feedback-catalog.test.tsx > NET-19 CardBusca catálogo > ERR-18 nova carga bem sucedida limpa erro e seleciona valor inicial

### tests/integration/auth.test.tsx

- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > UT-08 TEST-01 nome exibido Usuário
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > UT-08 TEST-01 nome exibido Ana
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > UT-08 TEST-01 nome exibido ana
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > IT-01 TEST-02 login envia credenciais, busca perfil com Bearer e disponibiliza sessão
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > IT-02 TEST-02 falha no perfil apresenta erro e executa logout limpando sessão prévia
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > IT-03 TEST-02 sem token mostra loading, bloqueia conteúdo e navega ao login
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > IT-03 TEST-02 restaura sessão preparada após loading e renderiza conteúdo protegido
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > IT-03 TEST-02 logout remove token/perfil e revoga conteúdo já renderizado
- tests/integration/auth.test.tsx > sessão real — TEST-01 TEST-02 > IT-10 TEST-02 BEAPI-03 token inválido não deve habilitar dados protegidos

### tests/integration/cadastro-feedback-login.test.tsx

- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-19 NET-02 NET-03 ignora resposta de login após abandonar a página
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-19 NET-02 NET-03 ignora resposta de profile após abandonar a página
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > REG-09 login direto não anuncia cadastro
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > REG-08 aviso registered aparece uma vez inclusive StrictMode
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-04 aviso de sessão expirada é erro e desaparece ao tentar novamente
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-04 login já montado recebe novo aviso uma única vez
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-03 HTTP401 mostra credenciais inválidas por status
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-03 texto401 em HTTP400 não vira credenciais inválidas
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-12 resposta sem token é erro de contrato sem refletir message
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-12 perfil inválido {} preserva logout e feedback
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-12 perfil inválido {"data":null} preserva logout e feedback
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-01 ERR-17 falha de perfil não expõe diagnóstico técnico
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-01 NET-03 aplica matriz à falha de perfil server
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-01 NET-03 aplica matriz à falha de perfil network
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-01 NET-03 aplica matriz à falha de perfil contract
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-01 ERR-11 rede usa mensagem pública e recupera controle
- tests/integration/cadastro-feedback-login.test.tsx > NET-02 NET-03 login feedback > ERR-14 nova tentativa remove sucesso e autentica com perfil válido

### tests/integration/cadastro-feedback-session.test.tsx

- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-20 mudanças de referência do roteador não repetem restauração nem revertem sessão
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-01 sem token não faz request nem alerta
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-01 ERR-11 rede mostra erro contextual sem destruir credencial
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-10 servidor mostra indisponibilidade segura
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-12 perfil inválido {} mostra contrato sem confirmar autenticação
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-12 perfil inválido null mostra contrato sem confirmar autenticação
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-04 ERR-20 401 com login já montado mostra uma única expiração
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-04 invalidação do transporte entrega aviso no login sem duplicar host
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-01 ERR-04 restauração401 em página pública navega ao login com aviso
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-19 cleanup cancela e ignora falha tardia sem aviso
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-19 histórico desmontado recebe401 tardio sem invalidar sessão montada
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-19 401 tardio de A não altera login B nem publica aviso
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-14 login novo remove erro de restauração anterior
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-04 logout intencional não publica expiração
- tests/integration/cadastro-feedback-session.test.tsx > NET-04 restauração e feedback por identidade > ERR-20 StrictMode mantém um só aviso de restauração

## R1 Execution

| File | Baseline executed (pass/fail) | Migrated executed | Result | Commit |
| --- | --- | --- | --- | --- |
| tests/unit/CardBusca.test.tsx | 23 (0/23) | 25 | PASS; 23 preserved + ACCESS-02 and FORM-02 | f413988 |
| tests/integration/cadastro-feedback-catalog.test.tsx | 11 (5/6) | 11 | PASS; all cases and manual failure gestures | 33ecfa0 |
| tests/integration/auth.test.tsx | 9 (7/2) | 11 | PASS; 9 preserved + 2 late identity cases | 3dce2ee |
| tests/integration/cadastro-feedback-login.test.tsx | 17 (0/17) | 17 | PASS; every original parameter/scenario preserved | 7eaf560 |
| tests/integration/cadastro-feedback-session.test.tsx | 15 (13/2) | 15 | PASS; only Next search-param mock added | current atomic commit; root resolves hash |

CardBusca gate: `npx vitest run tests/unit/CardBusca.test.tsx --reporter=verbose`, 25/25 on 2026-11-15. Only accessible selectors changed; all payload/timer/filter/duplicate assertions remain. No product change.

Catalog feedback gate: `npx vitest run tests/integration/cadastro-feedback-catalog.test.tsx --reporter=verbose`, 11/11. Combobox selectors and FORM-17 manual gestures across all five existing failure parameters; original assertions retained.

### R1 login product regression

IT-02 reproduced a real regression after mock migration: profile failure retained a previous authenticated session and lost the contextual profile error. LoginScreen now clears that previous session only while token/generation still match the attempt. Anonymous failures remain anonymous without navigation, preserving T29. Late HTTP200/503 profile responses cannot overwrite or log out a newer identity; two new real-provider cases assert stored token/profile, rendered session and no navigation/alert. Login HTTP401 remains public and does not invalidate a prior session.

Gate: auth 11/11 + unchanged T29 3/3; TypeScript and global lint0 pass. Sandbox build compiled but failed writing .next with EPERM. Authorized elevated T41 selective browser gate rebuilt the same production sources successfully and passed 10/10 on port 3102, workers=1/retries=0, controlled API. No R3 files or snapshots changed; port 3000 preserved.

### R1 feedback harness and assertion mapping

Assumption: anonymous profile failure must preserve absence of session; the previous-session IT-02 remains the logout proof. Files: this test and migration/status docs. Success: all 17 cases and their status/copy/secrecy/cancellation checks pass with the actual provider.

The LoginPage wrapper now receives useSearchParams and a real AuthProvider. login/logout spies forward to the real context instead of simulating its outcome. For the two ERR-12 malformed-profile rows, ERR-01 ERR-17 diagnostic failure and three NET-03 server/network/contract rows, the obsolete unconditional logout-spy assertion is replaced by stronger outcomes: no login/logout call, no token or stored profile, rendered authenticated=false and profile=null, and no navigation. This preserves the anonymous invariant from T29 without introducing navigation merely to satisfy a spy. The same contextual errors and technical-secret exclusions remain. Names/IDs remain verbatim for inventory traceability. IT-02 separately proves real prior-session cleanup and /login navigation.

Gate: `npx vitest run tests/integration/cadastro-feedback-login.test.tsx --reporter=verbose`, 17/17, no cases skipped/deleted.

### R1 final selected gate

Session assumption: useSearchParams is required by the real /login wrapper; no session behavior or expected state changes. Files: session test and migration/status docs. Its gate passed 15/15 with every assertion intact.

Final command: `npx vitest run tests/unit/CardBusca.test.tsx tests/integration/cadastro-feedback-catalog.test.tsx tests/integration/auth.test.tsx tests/integration/cadastro-feedback-login.test.tsx tests/integration/cadastro-feedback-session.test.tsx --reporter=verbose`. Result on 2026-11-15: 5 files, 79/79 passed, 0 failed/skipped. Baseline was 75 (25 pass/50 fail); all 75 expanded original names/IDs are still selected, plus 4 cases (2 catalog keyboard/manual, 2 late login identity). Final `npx tsc --noEmit` and `npm run lint -- --max-warnings=0` passed. No additional production changes after the fresh T41 Build and 10/10 browser run.

Preserved index: 44 stage records; SHA-256 of git ls-files --stage joined by LF (no terminal newline) is 87300EDE63817AE45055AD7E3D3305E74B137F5D8C6ADE86ABADA7BEC941B6D8. Commits use exact --only paths. R2/R3, aggregate proofs, independent walk, Verifier and final feature validation remain root-owned; no push/deploy, real API writes, backend/mobile edits or snapshots.
