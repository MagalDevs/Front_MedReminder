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
