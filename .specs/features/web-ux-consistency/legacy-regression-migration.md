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
| tratamento.test.tsx | 24/7 | 31 | PASS; 30 legacy unchanged + 1 route migrated | 6088e52 |

Account assumptions: approved two-step UI preserves the exact registration DTO, status/error matrix, secrecy and 15,000ms lifecycle. Files: the three registration tests, minimal registration gesture helper and migration/status docs. Per-file success: all original cases selected, exact payload/status/messages/cancellation assertions retained with new controls. DTO message arrays are now presented as the complete joined alert rather than list items.

R2 backend registration gate: `npx vitest run tests/integration/backend-cadastro.test.tsx --reporter=verbose`, 8/8 passed. Shared helpers fill account controls, click Continuar, fill personal controls and click Criar conta. Exact DTO (including whitespace in password), no Bearer, stored-token preservation, status-driven rate limit, all public DTO messages and diagnostic exclusion retained. Original test names remain inventory identifiers; array presentation asserts the exact joined message approved by the new screen. No product change.

R2 registration feedback gate: `npx vitest run tests/integration/cadastro-feedback-registration.test.tsx --reporter=verbose`, 32/32 passed. All original names and expanded parameter rows retained. Deadline checks remain 14,999 + 1ms for headers/body, with timeout copy, actual AbortSignal, late/abandon/new-attempt isolation and no automatic retry. Form-submit events retain concurrent-submit guard coverage; the separate userEvent click/Enter journey uses new controls. REG-11 checks every personal field, returns to Conta to check email/password/confirmation, then continues. REG-13 mismatch is now exercised on Conta, where confirmation belongs. REG-14 additionally asserts the entire joined DTO message exactly. No product change.

R2 privacy gate: `npx vitest run tests/integration/seguranca-cadastro.test.tsx --reporter=verbose`, 5/5 passed. Sentinels across all five console methods, nested objects and Error stack remain unchanged; exact request fields, no auto-login/storage and server/network failure checks remain. The invalid-confirmation case checks the associated inline error and aria-invalid on Conta before any request; valid cases continue through Dados pessoais. Exact serialized object order follows the approved DTO writer while every literal field value remains independently expected. No product change.

### R2 treatment route and final gate

Assumption: only the page journey migrated; the 30 direct CardCadastrar component cases and their assertions remain unchanged. Files: tratamento.test.tsx and migration/status docs. Success: route uses real AuthProvider, TreatmentDraftBoundary and LembreteProvider, catalog gesture, all three stages, literal exact payload and refreshed list. The minimal harness now routes API calls by URL.pathname so the existing collector query is accepted; route assertions verify both reads use exactly ?limit=100&order=ASC&page=1. Local matchMedia fixture supports the real AppShell. All unexpected API paths still reject.

Per-file gate: `npx vitest run tests/integration/tratamento.test.tsx --reporter=verbose`, 31/31 passed. The incoming name remains asserted before actual selection; the option gesture fills classification. Required stock unit/photo/color are supplied through controls. The route asserts decimal 1,5 -> canonical 1.5 mg, ceil(24/8)=3, literal three ISO instants with exclusive end, exact metadata, Bearer/key, persistent success and reloaded rows. The old blocking-alert expectation is now the approved persistent confirmation and an explicit no-alert check. All legacy idempotency, transactional failure, timing, payload and double-submit cases are intact.

Final four-file command: `npx vitest run tests/integration/backend-cadastro.test.tsx tests/integration/cadastro-feedback-registration.test.tsx tests/integration/seguranca-cadastro.test.tsx tests/integration/tratamento.test.tsx --reporter=verbose --reporter=json --outputFile=.specs/features/web-ux-consistency/r2-final.json`. On 2026-11-15: 4 files, 76/76 passed, 0 failed/skipped. Programmatic comparison of final fullName entries against the pre-edit expanded inventory: 76 original, 76 final, missing=[], added=[]. Temporary reporter JSON removed after comparison. `npx tsc --noEmit` and `npm run lint -- --max-warnings=0` both exit 0.

R2 made no production edits and found no product defect, so no Build/browser exception was required. No R3, snapshot, backend/mobile, real API, DB, push or deploy activity. The 44 preexisting stage records remain unchanged, SHA-256 of LF-joined git ls-files --stage records (no terminal newline): 87300EDE63817AE45055AD7E3D3305E74B137F5D8C6ADE86ABADA7BEC941B6D8. Root retains R3, final walk/proofs and independent verification.

## R3 Baseline Inventory

Collected before edits at HEAD 6088e52 on 2026-11-15. Expanded Playwright inventory: 129 scenarios across functional/nonfunctional projects. Original snapshot viewports: 360x800, 768x1024, 1440x900; all twelve original PNGs directly inspected before migration.

- [functional] BEAPI-09 histórico usa doses autenticadas, filtros e recarga
- [functional] FN-01 TEST-03 login mockado exibe o nome do perfil e o logout limpa o storage
- [functional] FN-02 TEST-03 rota protegida sem sessão não mostra conteúdo e alcança o login
- [functional] FN-02 TEST-03 rota protegida com sessão sintética preparada exibe o conteúdo
- [functional] FN-02 TEST-03 [BLOQUEADO FE-03] /meus-medicamentos sem sessão leva ao login
- [functional] FN-03 TEST-03 busca na home: inexistente, conhecido, seleção e navegação para o cadastro
- [functional] FN-03 TEST-03 cadastro de tratamento válido envia os payloads esperados e atualiza os lembretes
- [functional] FN-03 TEST-03 formulário vazio mostra as validações e não envia mutação
- [functional] FN-03 TEST-03 BEAPI-08 doses a partir das 21h locais mantêm o dia local correto
- [functional] FN-03 FN-08 BEAPI-07 retry manual preserva chave e conteudo
- [functional] FN-04 TEST-03 lembretes: filtros de período, status e medicamento mostram só os registros esperados
- [functional] FN-04 TEST-03 marcar dose como tomada envia PUT {tomado:true} e reflete o estado após a nova consulta
- [functional] FN-05 TEST-03 lista medicamentos e exclui com confirmação; cancelar não envia DELETE
- [functional] FN-05 TEST-03 falha ao excluir mostra a mensagem e mantém o medicamento na lista
- [functional] FN-05 TEST-03 sem medicamentos mostra o estado vazio com o atalho de cadastro
- [functional] FN-07 FN-01 TEST-03 login com 401 Invalid credentials mostra "E-mail ou senha inválidos", encerra o loading e não grava sessão
- [functional] FN-07 FN-01 TEST-03 login com 401 sem corpo mostra "E-mail ou senha inválidos", encerra o loading e não grava sessão
- [functional] FN-07 FN-01 TEST-03 login com 403 mostra "Você não tem permissão para realizar esta ação.", encerra o loading e não grava sessão
- [functional] FN-07 FN-01 TEST-03 login com 429 mostra "Muitas tentativas. Tente novamente mais tarde.", encerra o loading e não grava sessão
- [functional] FN-07 FN-01 TEST-03 login com 500 mostra "O serviço está temporariamente indisponível. Tente novamente mais tarde.", encerra o loading e não grava sessão
- [functional] FN-07 FN-01 TEST-03 login com rede interrompida mostra "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", encerra o loading e não grava sessão
- [functional] FN-07 FN-01 TEST-03 login com token mas perfil 500 mostra a falha do perfil e limpa a sessão
- [functional] FN-07 FN-04 TEST-03 401 na consulta protegida inicial remove a sessão e leva ao login
- [functional] FN-07 FN-04 TEST-03 marcar dose tomada com 403 mostra a mensagem, não confirma e não reconsulta
- [functional] FN-07 FN-04 TEST-03 marcar dose tomada com 429 mostra a mensagem, não confirma e não reconsulta
- [functional] FN-07 FN-04 TEST-03 marcar dose tomada com 500 mostra a mensagem, não confirma e não reconsulta
- [functional] FN-07 FN-04 TEST-03 marcar dose tomada com rede interrompida mostra a mensagem e não confirma
- [functional] FN-07 FN-04 TEST-03 marcar dose tomada com 401 remove a sessão e leva ao login
- [functional] FN-07 FN-05 TEST-03 excluir medicamento com 403 avisa a falha e mantém o item
- [functional] FN-07 FN-05 TEST-03 excluir medicamento com 429 avisa a falha e mantém o item
- [functional] FN-07 FN-05 TEST-03 excluir medicamento com 500 avisa a falha e mantém o item
- [functional] FN-07 FN-05 TEST-03 excluir medicamento com rede interrompida avisa a falha e mantém o item
- [functional] FN-07 FN-05 TEST-03 excluir medicamento com 401 remove a sessão e leva ao login
- [functional] FN-07 FN-05 TEST-03 falha ao carregar medicamentos e lembretes mostra a mensagem e encerra o loading
- [functional] FN-07 FN-03 TEST-03 criar medicamento com 403 avisa a falha, não cria doses e libera o botão
- [functional] FN-07 FN-03 TEST-03 criar medicamento com 429 avisa a falha, não cria doses e libera o botão
- [functional] FN-07 FN-03 TEST-03 criar medicamento com 500 avisa a falha, não cria doses e libera o botão
- [functional] FN-07 FN-03 TEST-03 criar medicamento com rede interrompida não cria doses nem anuncia sucesso
- [functional] FN-07 FN-03 TEST-03 criar medicamento com 401 avisa a falha de autenticação e não cria doses
- [functional] FN-07 FN-03 TEST-03 BEAPI-07 tratamento 500 não anuncia sucesso
- [functional] ERR-01 NET-18 alarme mostra refresh503 visível e repete somente GET
- [functional] FN-06 TEST-03 snapshots 360px > FN-06 TEST-03 login 360px
- [functional] FN-06 TEST-03 snapshots 360px > FN-06 TEST-03 home com busca e resultados 360px
- [functional] FN-06 TEST-03 snapshots 360px > FN-06 TEST-03 novo-medicamento 360px
- [functional] FN-06 TEST-03 snapshots 360px > FN-06 TEST-03 meus-lembretes 360px
- [functional] FN-06 TEST-03 snapshots 768px > FN-06 TEST-03 login 768px
- [functional] FN-06 TEST-03 snapshots 768px > FN-06 TEST-03 home com busca e resultados 768px
- [functional] FN-06 TEST-03 snapshots 768px > FN-06 TEST-03 novo-medicamento 768px
- [functional] FN-06 TEST-03 snapshots 768px > FN-06 TEST-03 meus-lembretes 768px
- [functional] FN-06 TEST-03 snapshots 1440px > FN-06 TEST-03 login 1440px
- [functional] FN-06 TEST-03 snapshots 1440px > FN-06 TEST-03 home com busca e resultados 1440px
- [functional] FN-06 TEST-03 snapshots 1440px > FN-06 TEST-03 novo-medicamento 1440px
- [functional] FN-06 TEST-03 snapshots 1440px > FN-06 TEST-03 meus-lembretes 1440px
- [functional] smoke: a página inicial carrega sem requisições à API
- [functional] WUX_NAV_03 public purpose precedes account creation and both destinations work
- [functional] T35 public catalog selection works without private session
- [functional] T35 unavailable catalog keeps account access and manual consultation
- [functional] WUX_DAY_01 local day and tie IDs determine displayed order
- [functional] WUX_DAY_03 next future dose coexists with overdue doses
- [functional] WUX_DAY_05 successful empty today offers history and adding medication
- [functional] T36 failed dose read stays partial and retries instead of claiming empty success
- [functional] T36 restoring and unavailable session withholds private content until manual recovery
- [functional] T36 anonymous today requires login before private screen
- [functional] WUX_MED_01 name classification and expiry intersect with clear restoring all records
- [functional] T37 medication read failure recovers to successful empty state
- [functional] WUX_NAV_06 anonymous treatment is blocked before any input or private request
- [functional] WUX_FORM_01 stages preserve draft and valid initial name never overwrites edits
- [functional] WUX_FORM_11 review exposes exact dose schedule and timezone before saving
- [functional] WUX_FORM_14 review gesture sends single atomic payload and idempotency key
- [functional] WUX_FORM_15 confirmed summary survives internal navigation and leads to selected medication
- [functional] T38 confirmed create with global refresh failure retries GET only and updates alarm collection
- [functional] T38 uncertain creation freezes exact body and key across route navigation then manual retry
- [functional] WUX_DAY_06 history includes only past instants in descending order and labels planned time
- [functional] WUX_DAY_07 period medication and state intersect over all 102 paginated records
- [functional] T39 partial second page failure stays labeled and retry restores complete history totals
- [functional] WUX_ACCOUNT_05 profile PATCH includes changed allowlisted values and omits blank optionals
- [functional] WUX_ACCOUNT_08 legacy configuration URL exposes profile initials and only supported actions
- [functional] T40 failed profile update preserves edits and successful explicit retry confirms the result
- [functional] WUX_NAV_01 login without pending destination opens Hoje after validated profile
- [functional] WUX_NAV_04 requested internal treatment survives Entrar with query and remains private until login
- [functional] WUX_NAV_07 rejects unapproved return destination https://external.example/private
- [functional] WUX_NAV_07 rejects unapproved return destination //external.example/private
- [functional] WUX_NAV_07 rejects unapproved return destination /login
- [functional] WUX_NAV_07 rejects unapproved return destination /hoje/../login
- [functional] T41 explicit internal returnTo opens the requested legacy profile route
- [functional] T41 voluntary logout clears pending target and a new login opens Hoje
- [functional] T41 denied login retains form and retry can authenticate without private screen on failure
- [functional] T41 after voluntary logout a newly requested protected destination can be remembered
- [functional] WUX_ACCOUNT_01 account and personal stages provide mandatory summary before sending
- [functional] WUX_ACCOUNT_02 registration gesture sends exact DTO once without fictitious values
- [functional] WUX_ACCOUNT_03 invalid CPF CEP and future birth date keep the stage and focus the indicated field
- [functional] WUX_ACCOUNT_04 password visibility toggles accessibly without modifying either value
- [functional] T42 server DTO messages remain visible and retry preserves personal values
- [functional] WUX_NAV_05 all existing medication agenda history and configuration URLs show equivalent content
- [functional] WUX_MED_04 Ver horários filters by ID despite identical names and includes future doses
- [functional] T43 unknown valid ID shows an empty agenda while invalid ID never silently shows unrelated doses
- [functional] WUX_MED_05 edit opens the selected item and cancel preserves its original values
- [functional] WUX_MED_06 save sends only seven changed metadata fields to the existing ID and recovers after failure
- [functional] WUX_MED_07 treatment remains read only with the explicit schedule limit
- [functional] T44 invalid unsafe IDs never request an item and unauthenticated edit requires login
- [functional] T44 failed item load offers a manual retry without an empty editable form
- [nonfunctional] NF-01 NF-WEB-01 keyboard, labels and layout at 360px (assessment)
- [nonfunctional] NF-01 NF-WEB-01 keyboard, labels and layout at 768px (assessment)
- [nonfunctional] NF-01 NF-WEB-01 keyboard, labels and layout at 1440px (assessment)
- [nonfunctional] NF-02 NF-WEB-02 ten fixed catalog queries before/after in three browser rounds
- [nonfunctional] NF-02 NF-WEB-03 production routes, five cold and warm samples
- [nonfunctional] NF-04 NF-SCALE-01 local list 10/100/1000 records, five runs per volume
- [nonfunctional] NF-03 NF-WEB-04 login logging and storage exposure
- [nonfunctional] NF-03 NF-WEB-04 raw HTTP error body absent from console
- [nonfunctional] NF-03 NF-WEB-04 authenticated 401 clears storage
- [nonfunctional] NF-03 NF-WEB-04 logout removes token and profile
- [nonfunctional] WUX_T01_FONT Kantumruy is inherited by text and controls with all interface weights available
- [nonfunctional] WUX_T01_PALETTE semantic palette preserves identity and readable default, hover, secondary, disabled and feedback pairs
- [nonfunctional] WUX_T01_FOCUS keyboard focus has a visible semantic indicator
- [nonfunctional] B7 observe incumbent screens at actual viewport sizes
- [nonfunctional] WUX_NAV_08 narrow menu opens by Enter contains focus and closes with Escape returning to content
- [nonfunctional] WUX_SYSTEM_01 interface font is Kantumruy on every route including headings and native controls
- [nonfunctional] WUX_SYSTEM_02 actual primary fields focus and feedback use the single semantic token palette
- [nonfunctional] WUX_SYSTEM_03 brand pink stays in identity and medication color never supplies error or success semantics
- [nonfunctional] WUX_SYSTEM_06 secondary controls remain distinct and readable on login and authenticated forms
- [nonfunctional] WUX_SYSTEM_08 loading empty filtered recoverable error and success share feedback vocabulary and treatment
- [nonfunctional] WUX_ACCESS_01 every scoped field button selector and navigation control has an accessible name
- [nonfunctional] WUX_ACCESS_06 rendered text placeholders primary hover disabled warning error and success meet contrast thresholds
- [nonfunctional] WUX_ACCESS_07 visible focus and 44px targets include named radio labels with keyboard selection
- [nonfunctional] WUX_ACCESS_08 forms remain reachable at all four viewport sizes with long content and modal clipping checked
- [nonfunctional] T45 review follow-up gives natural exact counts and places history after the complete daily agenda
- [nonfunctional] WUX_SYSTEM_04 equivalent save actions share default hover focus disabled loading and immediate feedback
- [nonfunctional] WUX_ACCESS_09 effective 200 percent text reflows all routes and reduced motion leaves controls immediately usable
- [nonfunctional] T46 wizard and registration stage changes keep entered values focus and immediate controls with either motion preference

## R3 Execution

Assumptions: migrate approved UI only, retaining all 129 collected browser scenario names and parameter rows. Existing twelve PNG references were inspected individually at native dimensions before edits. Operate guidance, frontend-design, taste and Impeccable craft-floor support the approved DESIGN.md; no promotional layout or new visual identity is introduced. Impeccable context launcher failed because engine 0.1.23 is absent; existing spec/context/design/DESIGN and craft-floor/operate/polish guidance were read directly.

Files: affected functional/nonfunctional/E2E selectors and minimal test helpers, the existing functional PNG references, additional wizard-stage PNGs, this inventory and tasks.md status. No backend/mobile or test-floor changes. Success: original scenarios preserved, controlled API guard intact, each coherent journey green before commit, original viewports retained with every wizard stage captured and inspected, final TypeScript/lint0. Real E2E remains blocked without isolated API.

| Journey/file | Original cases | Final executed | Result | Commit |
| --- | --- | --- | --- | --- |
| fluxo.spec.ts | 52 | pending | migration in progress | pending |
| backend-history.spec.ts | 1 | pending | pending | pending |
| legacy nonfunctional (4 files) | 10 | pending | pending | pending |

R3 first journey: NAV-01/02/05/06, ACCESS-02. The public catalog is a consultation with account access; protected treatment is entered with a synthetic authenticated session and the incoming medication name, then a real option gesture fills classification. The profile name assertion moves to Perfil, where the approved UI shows the actual profile. Agenda asserts exactly two authenticated dose reads and zero redundant medication reads. The historical FE-03 scenario name stays verbatim while its obsolete expected-failure annotation is removed because NAV-06 now protects that route.

Baseline fluxo: 52 executed, 9 passed and 43 failed, no skipped, with diagnostic timeout 5 seconds and workers=1/retries=0. The original expected-failure FE-03 reports unexpected pass because the product protection is fixed. First sandbox Build failed EPERM creating .next login segments; elevated fresh Build succeeded without deleting caches. Login now expects exactly four calls: POST login, GET profile, two GET doses (global provider plus Hoje), and verifies the original public/Bearer headers/body/storage assertions.

R3 navigation/catalog gate: 13/13 original scenarios passed with fresh production Build, port 3102, workers=1/retries=0. No product edits. Stage fingerprint remains 44 / 87300EDE63817AE45055AD7E3D3305E74B137F5D8C6ADE86ABADA7BEC941B6D8.

### R3 treatment journey

Gate: original 10/10 treatment scenarios passed with fresh Build and controlled API, port 3102, workers=1/retries=0. Medication fields are filled by labels and real catalog/color gestures; Tratamento and Revisão are traversed. All original exact metadata/dose/header/request-order comparisons remain; quantidadeDiaria changes from the old interval bug 8 to literal 3 (FORM-05, ceil(24/8)). The response fixture now includes the required relation ID and boolean in every dose instead of an incomplete success envelope.

FORM-15 replaces blocking alert and immediate blank form with persistent confirmed medication/time. Adicionar outro medicamento then checks every medication field resets, no color remains selected and the current incoming query prefills only the pristine name (FORM-01). Validation traverses both stages, preserving missing quantity/dose/interval/duration checks and zero POSTs. STATE-07/11 replace definitive server/network failure copy with the exact uncertain-result message across all original 403/429/500/network rows; retry is enabled, review retains literal 500 ml, editing/submission is withheld, no success/extra doses/read occurs. 401 still clears session. Manual retry preserves exact body and Idempotency-Key. No product edits or skipped/deleted scenarios.

### R3 dose journeys and alarm regression

Files: fluxo.spec.ts, AlertaLembrete.tsx, Lembrete.tsx and web-ux-t33.test.tsx, plus migration/status docs. Assumption: the queue must keep its own confirmed result visible until the existing read/retry/close flow ends (FORM-16/STATE-01), while a confirmation elsewhere still suppresses that alarm (DOSE-08/STATE-06).

The preserved NET-18 browser journey reproduced a real defect after selector migration: publishing the confirmed dose marked the global row taken, so AlarmQueue unmounted its dialog before refresh503 feedback and GET-only recovery. The queue now retains its own confirmed ID/instant until explicit close or successful refresh. External confirmations retain their original suppression behavior; identity key remount, timers, queue order and cleanup remain. No endpoint, payload or retry semantics changed.

The new T33 real-provider/full-queue integration asserts literal confirmed status, visible 503 and registered message, one PUT, exactly one retry GET, no second PUT, next queued ID then suppression by an external successful confirmation. The previous 25 selected T33/T12/alarm/privacy cases stay intact. Browser filter history moves to the approved History controls and freezes 21:00 so all four original current-day rows remain eligible, preserving 4/3/1 and medication 2/0/1 counts plus exact ID ordering. Register/error journeys use Hoje, retaining two past actionable doses and one future nonactionable dose. PUT responses now carry the exact original instant required by the approved confirmation contract. Success asserts immediate synchronization, no automatic refresh, then a real reload and the exact subsequent profile + two dose reads. Errors preserve no confirmation/no GET/no state change.

Dose/alarm gates on final sources: browser 9/9 (including all eight FN-04 rows and NET-18), fresh production Build; integration 26/26 across T33/T12/legacy alarm/privacy, including one added regression; tsc and global lint0 pass. Directly inspected native 1280x720 test-results/fluxo-ERR-01-NET-18-alarme-7b8ea-isível-e-repete-somente-GET-functional/f4-alarm-running.png: both feedback surfaces and retry remain visible inside the real dialog. React best-practices checklist applied to the two component changes; no dependency or abstraction added.

### R3 medication/deletion journey

Gate: 9/9 original scenarios passed with fresh Build, port3102/workers1/retries0. Article/heading and named buttons replace legacy CSS/title selectors. Every destructive gesture opens the nominal dialog and verifies its medicine/dose consequence before confirmation; cancel still sends zero DELETE and retains three items. Exact deletion path/body/Bearer, item ordering, failure matrix and storage cleanup remain. Failures assert the complete public message inside the dialog, where its title supplies medication context. The two-read failure case explicitly fails dose/me on the agenda, which now derives medicine names from doses instead of redundantly reading remedio/me. No product edits.
