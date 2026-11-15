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
| tests/integration/cadastro-feedback-session.test.tsx | 15 (13/2) | 15 | PASS; only Next search-param mock added | 8fb0f94 |

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

## R2 Baseline Inventory

Observed 2026-11-15 at HEAD 8fb0f94: 76 selected/executed, 24 passed, 52 failed, 0 skipped. Every expanded original name/ID and parameter row follows, collected before edits. Treatment has 30 direct legacy component cases and one route case.

### tests/integration/backend-cadastro.test.tsx

- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-01 BEAPI-12 sucesso envia DTO exato sem Bearer para http://cadastro.test.invalid
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-01 BEAPI-12 sucesso envia DTO exato sem Bearer para https://outro-cadastro.test.invalid/
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-02 BEAPI-12 validação 400 apresenta cada mensagem do array como item de lista
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-02 status 429 com corpo ilegível exibe os segundos do Retry-After sem reenvio
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-02 status 429 sem Retry-After oferece espera sem inventar duração
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-02 número 429 no texto de uma validação 400 não vira rate limit
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-02 indisponibilidade 503 apresenta mensagem segura
- BEAPI-01 BEAPI-02 BEAPI-12 — cadastro pelo cliente real e contratos do backend BEAPI-02 indisponibilidade rede apresenta mensagem segura

### tests/integration/cadastro-feedback-registration.test.tsx

- NET-01 cadastro feedback REG-02 origem isolada ausente ou inválida: 
- NET-01 cadastro feedback REG-02 origem isolada ausente ou inválida: origem inválida
- NET-01 cadastro feedback REG-04 mostra loading e desabilita imediatamente
- NET-01 cadastro feedback REG-06 clique e Enter simultâneos enviam apenas uma requisição
- NET-01 cadastro feedback REG-06 gestos reais de clique e Enter preservam um único envio pendente
- NET-01 cadastro feedback REG-10 prazo exato e mensagem integral com headers pendente
- NET-01 cadastro feedback REG-10 prazo exato e mensagem integral com body pendente
- NET-01 cadastro feedback REG-11 recupera botão e preserva campos após 400
- NET-01 cadastro feedback REG-11 recupera botão e preserva campos após 409
- NET-01 cadastro feedback REG-11 recupera botão e preserva campos após 500
- NET-01 cadastro feedback REG-11 recupera botão e preserva campos após network
- NET-01 cadastro feedback REG-11 recupera botão e preserva campos após timeout
- NET-01 cadastro feedback REG-12 conclusão antiga durante nova tentativa não navega nem altera loading
- NET-01 cadastro feedback REG-07 HTTP201 publica registered e navega sem login automático
- NET-01 cadastro feedback REG-07 status 200 não confirma cadastro
- NET-01 cadastro feedback REG-07 status 202 não confirma cadastro
- NET-01 cadastro feedback REG-07 status 204 não confirma cadastro
- NET-01 cadastro feedback REG-10 deadline termina exatamente em15000ms e aborta
- NET-01 cadastro feedback REG-10 deadline inclui leitura do corpo
- NET-01 cadastro feedback REG-10 abort do fetch provocado pelo deadline mantém mensagem de timeout
- NET-01 cadastro feedback REG-12 ignora sucesso tardio mesmo se fetch ignorar abort
- NET-01 cadastro feedback REG-12 unmount aborta sem publicar erro ou aviso
- NET-01 cadastro feedback REG-13 validação local não deixa botão bloqueado
- NET-01 cadastro feedback REG-14 HTTP400 apresenta mensagens públicas
- NET-01 cadastro feedback REG-14 HTTP409 apresenta mensagens públicas
- NET-01 cadastro feedback REG-14 HTTP422 apresenta mensagens públicas
- NET-01 cadastro feedback REG-15 HTTP429 respeita Retry-After zero
- NET-01 cadastro feedback REG-16 HTTP500 recupera botão sem conteúdo técnico
- NET-01 cadastro feedback REG-16 HTTP503 recupera botão sem conteúdo técnico
- NET-01 cadastro feedback ERR-01 REG-16 falha de rede permite nova tentativa e limpa erro anterior
- NET-01 cadastro feedback REG-13 timeout não reenvia automaticamente depois de restaurar botão
- NET-01 cadastro feedback REG-17 JSON inválido201 não navega nem expõe diagnóstico

### tests/integration/seguranca-cadastro.test.tsx

- IT-08 SEC-01 — privacidade do cadastro real IT-08 SEC-01 cadastro válido mantém payload e navegação sem expor sentinelas
- IT-08 SEC-01 — privacidade do cadastro real IT-08 SEC-01 cadastro inválido mantém validação sem enviar nem expor sentinelas
- IT-08 SEC-01 — privacidade do cadastro real IT-08 SEC-01 falha HTTP mantém payload e mensagem Email já cadastrado: sentinela-cadastro… sem log pessoal
- IT-08 SEC-01 — privacidade do cadastro real IT-08 SEC-01 falha HTTP mantém payload e mensagem Erro ao cadastrar. Tente novamente. sem log pessoal
- IT-08 SEC-01 — privacidade do cadastro real IT-08 SEC-01 falha de rede mantém mensagem genérica sem imprimir Error sensível

### tests/integration/tratamento.test.tsx

- UT-12 TEST-01 validação do formulário de tratamento UT-12 TEST-01 campos vazios mostram as mensagens e não enviam mutação
- UT-12 TEST-01 validação do formulário de tratamento UT-12 TEST-01 valores zero mostram 'maior que zero' e não enviam mutação
- UT-12 TEST-01 validação do formulário de tratamento UT-12 TEST-01 horário inicial ausente mostra a mensagem e não envia mutação
- UT-12 TEST-01 validação do formulário de tratamento UT-12 TEST-01 nome em branco mostra a mensagem e não envia mutação
- UT-12 TEST-01 validação do formulário de tratamento UT-12 TEST-01 fixture válida prossegue e limpa as mensagens de erro
- UT-12 TEST-01 validação do formulário de tratamento UT-12 TEST-01 sem token não envia mutação e pede login
- UT-13 TEST-01 cálculo de horários (04/11/2026, America/Sao_Paulo) UT-13 TEST-01 início 04/11 08:00, intervalo 8h, duração 1 dia: doses 04/11 08:00, 04/11 16:00 e 05/11 00:00; 05/11 08:00 exclusivo
- UT-13 TEST-01 cálculo de horários (04/11/2026, America/Sao_Paulo) UT-13 TEST-01 08:00, a cada 12h, 1 dia -> 08:00 e 20:…
- UT-13 TEST-01 cálculo de horários (04/11/2026, America/Sao_Paulo) UT-13 TEST-01 08:00, a cada 24h, 1 semana -> 7 doses …
- UT-13 TEST-01 cálculo de horários (04/11/2026, America/Sao_Paulo) UT-13 TEST-01 BEAPI-08 [regressão D-01] doses locais >= 21:00 mantêm o dia local: 10:30, a cada 6h, 1 dia
- UT-13 TEST-01 cálculo de horários (04/11/2026, America/Sao_Paulo) UT-13 TEST-01 BEAPI-08 [regressão D-02] horaInicio de 30/11/2026 08:00 enviada com relógio em 31/10/2026
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 BEAPI-07 ordem POST tratamento -> GET lista; cada dose usa o ID criado e o horário esperado; recarga exibe os dados persistidos
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 payload do medicamento preserva unidades, cor, validade e valores do formulário
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #FF0000 é enviada como 'Vermelho'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #4B00FF é enviada como 'Azul'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #FFFF00 é enviada como 'Amarelo'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #FFA500 é enviada como 'Laranja'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #00CFFF é enviada como 'Azul claro'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #FFFFFF é enviada como 'Branco'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #00FF7F é enviada como 'Verde claro'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #006400 é enviada como 'Verde escuro'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #000000 é enviada como 'Preto'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 cor #DA70D6 é enviada como 'Orquídea'
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 campos opcionais vazios usam os padrões atuais (motivo, classificação, observação)
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 após o sucesso o formulário volta aos valores iniciais
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 enquanto grava, o botão mostra 'Salvando...' e fica desabilitado; duplo clique envia um único cadastro
- IT-05 TEST-02 criação do tratamento (formulário + contextos + cliente real) IT-05 TEST-02 fluxo pela página: medicamento vindo da busca (?medicamento=) preenche nome e tipo e vai no payload
- IT-05 BEAPI-07 BEAPI-08 falha no tratamento IT-05 BEAPI-07 falha transacional {"remedio":"erro500"} não cria nada, não recarrega e preserva o formulário
- IT-05 BEAPI-07 BEAPI-08 falha no tratamento IT-05 BEAPI-07 falha transacional {"doses":"erro500"} não cria nada, não recarrega e preserva o formulário
- IT-05 BEAPI-07 BEAPI-08 falha no tratamento IT-05 BEAPI-07 envelope sem data.remedio não confirma sucesso
- IT-05 BEAPI-07 BEAPI-08 falha no tratamento IT-13 BEAPI-07 FE-08 reenvio após resposta incerta não duplica o medicamento

## R2 Execution

| File | Baseline pass/fail | Final executed | Result | Commit |
| --- | --- | --- | --- | --- |
| backend-cadastro.test.tsx | 0/8 | 8 | PASS; all original scenarios | 218c833 |
| cadastro-feedback-registration.test.tsx | 0/32 | 32 | PASS; all original scenarios | d4780f6 |
| seguranca-cadastro.test.tsx | 0/5 | 5 | PASS; all original scenarios | 6496a4a |
| tratamento.test.tsx | 24/7 | 31 | PASS; 30 legacy unchanged + 1 route migrated | this atomic commit |

Account assumptions: approved two-step UI preserves the exact registration DTO, status/error matrix, secrecy and 15,000ms lifecycle. Files: the three registration tests, minimal registration gesture helper and migration/status docs. Per-file success: all original cases selected, exact payload/status/messages/cancellation assertions retained with new controls. DTO message arrays are now presented as the complete joined alert rather than list items.

R2 backend registration gate: `npx vitest run tests/integration/backend-cadastro.test.tsx --reporter=verbose`, 8/8 passed. Shared helpers fill account controls, click Continuar, fill personal controls and click Criar conta. Exact DTO (including whitespace in password), no Bearer, stored-token preservation, status-driven rate limit, all public DTO messages and diagnostic exclusion retained. Original test names remain inventory identifiers; array presentation asserts the exact joined message approved by the new screen. No product change.

R2 registration feedback gate: `npx vitest run tests/integration/cadastro-feedback-registration.test.tsx --reporter=verbose`, 32/32 passed. All original names and expanded parameter rows retained. Deadline checks remain 14,999 + 1ms for headers/body, with timeout copy, actual AbortSignal, late/abandon/new-attempt isolation and no automatic retry. Form-submit events retain concurrent-submit guard coverage; the separate userEvent click/Enter journey uses new controls. REG-11 checks every personal field, returns to Conta to check email/password/confirmation, then continues. REG-13 mismatch is now exercised on Conta, where confirmation belongs. REG-14 additionally asserts the entire joined DTO message exactly. No product change.

R2 privacy gate: `npx vitest run tests/integration/seguranca-cadastro.test.tsx --reporter=verbose`, 5/5 passed. Sentinels across all five console methods, nested objects and Error stack remain unchanged; exact request fields, no auto-login/storage and server/network failure checks remain. The invalid-confirmation case checks the associated inline error and aria-invalid on Conta before any request; valid cases continue through Dados pessoais. Exact serialized object order follows the approved DTO writer while every literal field value remains independently expected. No product change.

### R2 treatment route and final gate

Assumption: only the page journey migrated; the 30 direct CardCadastrar component cases and their assertions remain unchanged. Files: tratamento.test.tsx and migration/status docs. Success: route uses real AuthProvider, TreatmentDraftBoundary and LembreteProvider, catalog gesture, all three stages, literal exact payload and refreshed list. The minimal harness now routes API calls by URL.pathname so the existing collector query is accepted; route assertions verify both reads use exactly ?limit=100&order=ASC&page=1. Local matchMedia fixture supports the real AppShell. All unexpected API paths still reject.

Per-file gate: `npx vitest run tests/integration/tratamento.test.tsx --reporter=verbose`, 31/31 passed. The incoming name remains asserted before actual selection; the option gesture fills classification. Required stock unit/photo/color are supplied through controls. The route asserts decimal 1,5 -> canonical 1.5 mg, ceil(24/8)=3, literal three ISO instants with exclusive end, exact metadata, Bearer/key, persistent success and reloaded rows. The old blocking-alert expectation is now the approved persistent confirmation and an explicit no-alert check. All legacy idempotency, transactional failure, timing, payload and double-submit cases are intact.

Final four-file command: `npx vitest run tests/integration/backend-cadastro.test.tsx tests/integration/cadastro-feedback-registration.test.tsx tests/integration/seguranca-cadastro.test.tsx tests/integration/tratamento.test.tsx --reporter=verbose --reporter=json --outputFile=.specs/features/web-ux-consistency/r2-final.json`. On 2026-11-15: 4 files, 76/76 passed, 0 failed/skipped. Programmatic comparison of final fullName entries against the pre-edit expanded inventory: 76 original, 76 final, missing=[], added=[]. Temporary reporter JSON removed after comparison. `npx tsc --noEmit` and `npm run lint -- --max-warnings=0` both exit 0.

R2 made no production edits and found no product defect, so no Build/browser exception was required. No R3, snapshot, backend/mobile, real API, DB, push or deploy activity. The 44 preexisting stage records remain unchanged, SHA-256 of LF-joined git ls-files --stage records (no terminal newline): 87300EDE63817AE45055AD7E3D3305E74B137F5D8C6ADE86ABADA7BEC941B6D8. Root retains R3, final walk/proofs and independent verification.
