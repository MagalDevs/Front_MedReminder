# web-ux-consistency verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at b060d813d33602f5d7df36e772274813dbaf9112
**Verifier**: independent sub-agent (author != verifier)

Reviewed the approved criteria, Checks, Coverage Matrix, actual selected test bodies, relevant implementation, DESIGN.md and recorded green proofs (92 pass, 0 fail). No proof groups were rerun. Graphify was consulted first for structure; its e042183 index is older than this checkout, so new implementation/tests were read from the actual HEAD. No binding user captures exist. Findings below concern missing discriminating retained assertions, not demonstrated product defects.

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `tests/functional/web-ux-t41.spec.ts` WUX_NAV_01 | yes — login gesture reaches /hoje after controlled profile validation and renders the daily screen. |
| C2 | `tests/integration/web-ux-t06.test.tsx` WUX_NAV_02 | yes — each destination is clicked; heading/content and exactly one aria-current match the selected route. |
| C3 | `tests/functional/web-ux-t35.spec.ts` WUX_NAV_03 | yes — exact purpose, DOM precedence and both account destinations asserted after clicks. |
| C4 | `tests/functional/web-ux-t41.spec.ts` WUX_NAV_04 | yes — protected treatment query survives login and inputs stay absent before authentication. |
| C5 | `tests/functional/web-ux-t43.spec.ts` WUX_NAV_05 | yes — all four legacy URLs render their corresponding named screens without 404. |
| C6 | `tests/functional/web-ux-t38.spec.ts` WUX_NAV_06 | yes — guest reaches login with no treatment input; T36 also gates private reads/content during restoration. |
| C7 | `tests/functional/web-ux-t41.spec.ts` WUX_NAV_07; `tests/integration/web-ux-t13.test.tsx` safe return targets | yes — external/protocol-relative/auth/traversal targets fall back to Hoje; allowlisted internal destinations and consumption are asserted. |
| C8 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_NAV_08 | yes — Enter/Tab/Escape, focus return, no horizontal overflow and heading below header at 320px are asserted. |
| C9 | `tests/functional/web-ux-t36.spec.ts` WUX_DAY_01 | yes — literal ID ordering includes equal-time tie and excludes next local day. |
| C10 | `tests/integration/web-ux-t26.test.tsx` WUX_DAY_02 | yes — each row has medication, amount/unit, date, exact HH:mm and all four clock/registration states. |
| C11 | `tests/functional/web-ux-t36.spec.ts` WUX_DAY_03 | yes — nearest of two future doses is selected while overdue content remains visible. |
| C12 | `tests/integration/web-ux-t10.test.tsx` WUX_DAY_04; T20 gesture-clock case | yes — exact 1s midnight/state transition, hidden/visible refresh and gesture-time revalidation checked. |
| C13 | `tests/functional/web-ux-t36.spec.ts` WUX_DAY_05 | yes — exact successful empty text and actual navigation through both offered actions. |
| C14 | `tests/functional/web-ux-t39.spec.ts` WUX_DAY_06 | yes — descending literal IDs, future exclusion and planned-time label asserted. |
| C15 | `tests/functional/web-ux-t39.spec.ts` WUX_DAY_07; `tests/unit/web-ux-t07.test.tsx` history bounds | yes — actual filter gestures intersect over 102 records, exact count/ID and reset; unit check covers local period boundary. |
| C16 | `tests/integration/web-ux-t26.test.tsx` WUX_DAY_08 | yes — invalid date, date-only and missing relation appear in incomplete region with no time/action. |
| C17 | `tests/integration/web-ux-t11.test.tsx` WUX_DAY_09; T26 paginated loading | yes — exact page requests, full result/next/counts and partial progress state; composed test labels partial next/counts until second page completes. |
| C18 | `tests/functional/web-ux-t37.spec.ts` WUX_MED_01; `tests/unit/web-ux-t08.test.tsx` WUX_MED_01 | yes — three browser filters intersect; unit literals distinguish accent/case, exact classification and inclusive expiry categories. |
| C19 | `tests/integration/web-ux-t25.test.tsx` WUX_MED_02 | yes — clear resets all three values and restores three records/count. |
| C20 | `tests/integration/web-ux-t25.test.tsx` WUX_MED_03 | yes — filtered absence and successful initial emptiness explicitly differ; clear restores items. |
| C21 | `tests/functional/web-ux-t43.spec.ts` WUX_MED_04 | yes — real link gesture uses ID despite identical names and renders only that medication's literal dose IDs. |
| C22 | `tests/functional/web-ux-t44.spec.ts` WUX_MED_05 | yes — selected ID opens populated editor; cancel returns with original item and zero PUTs. |
| C23 | `tests/functional/web-ux-t44.spec.ts` WUX_MED_06 | no — all seven mutable fields are changed together. A browser/editor regression sending additional unchanged metadata whenever any field changes passes this proof. T16 proves sparse behavior only below the route/editor layer. See F1. |
| C24 | `tests/functional/web-ux-t44.spec.ts` WUX_MED_07 | yes — read-only region names treatment fields, includes actual first dose/amount/unit, has no editable controls, and shows exact limitation text. |
| C25 | `tests/integration/web-ux-t17.test.tsx` WUX_MED_08 | yes — named confirmation states removal of all doses; no request before confirm, exact DELETE endpoint and confirmed removal afterward. |
| C26 | `tests/integration/web-ux-t17.test.tsx` WUX_MED_09 | yes — cancellation leaves item/doses visible and sends no request. |
| C27 | `tests/integration/web-ux-t17.test.tsx` WUX_MED_10 | yes — failed deletion retains item/doses and recovery gesture removes them only after confirmation; no success state exposed on failure. |
| C28 | `tests/functional/web-ux-t38.spec.ts` WUX_FORM_01; WUX_FORM_11 | yes — browser step changes and current-step text checked; Review content and controls independently asserted. |
| C29 | `tests/integration/web-ux-t18.test.tsx` WUX_FORM_02 | yes — selection returns exact catalog fields, no match offers manual entry, subsequent editable value asserted. |
| C30 | `tests/integration/web-ux-t21.test.tsx` WUX_FORM_03 | yes — selection fills name/classification while preserving all previously entered treatment parameters. |
| C31 | `tests/integration/web-ux-t24.test.tsx` WUX_FORM_04 | yes — both stages remain, first invalid input receives focus and associated error; no POST. |
| C32 | `tests/integration/web-ux-t24.test.tsx` WUX_FORM_05 | yes — backward/forward gestures preserve literal medication and treatment values. |
| C33 | `tests/integration/web-ux-t22.test.tsx` WUX_FORM_06 | yes — comma and point keep entered value and yield literal 1.5 mg payload and schedule. |
| C34 | `tests/unit/web-ux-t09.test.tsx` WUX_FORM_07 | yes — zero/negative/exponent/mixed/text variants reject with the exact guidance; positive formats retain value. |
| C35 | `tests/unit/web-ux-t09.test.tsx` WUX_FORM_08 | yes — full arrays for 6h, nondivisor 5h and DST transition assert elapsed recurrence and exclusive end. Own example extends leap-day/offset coverage. |
| C36 | `tests/unit/web-ux-t09.test.tsx` WUX_FORM_09 | yes — exact payload and 5h/week plus 25h/month cases assert ceil and converted days. |
| C37 | `tests/unit/web-ux-t07.test.tsx` WUX_FORM_10; T25 legacy presentation | yes — literal actual irregular times retained despite misleading legacy daily count; rendered screen rejects inferred daily frequency. |
| C38 | `tests/functional/web-ux-t38.spec.ts` WUX_FORM_11 | yes — medication/amount/interval/zone/count, exact start/end attributes and complete expanded instant list asserted after gestures. |
| C39 | `tests/integration/web-ux-t22.test.tsx` WUX_FORM_12 | yes — explicit 7/30 conversion and resulting 14/60-day payload values checked before review. |
| C40 | `tests/unit/web-ux-t09.test.tsx` WUX_FORM_13 | yes — 1/1000 accepted, 1001/empty/duplicate rejected, normalized/invalid times identify input errors, unsafe recurrence rejected before payload. |
| C41 | `tests/functional/web-ux-t38.spec.ts` WUX_FORM_14; T15 uncertainty/identity cases | yes — double gesture yields one atomic exact POST and key; controlled retry preserves body/key and identity replacement discards prior operation. |
| C42 | `tests/functional/web-ux-t38.spec.ts` WUX_FORM_15 | yes — confirmed medication and exact first instant survive internal navigation and lead to saved medication ID. |
| C43 | `tests/integration/web-ux-t15.test.tsx` WUX_FORM_16 | yes — exact partial-success text, confirmed summary and GET-refresh-only recovery; original payload and single create retained. |
| C44 | `tests/integration/web-ux-t18.test.tsx` WUX_FORM_17 | yes — unavailable catalog has no suggestions, manual path permits real name/classification input without additional request. |
| C45 | `tests/integration/web-ux-t20.test.tsx` WUX_DOSE_01; overdue case | yes — exact accessible name includes medication/date/time, due and overdue gestures confirm registered state. |
| C46 | `tests/integration/web-ux-t20.test.tsx` WUX_DOSE_02 | yes — future occurrence remains visible/Programada with no register action or network call. |
| C47 | `tests/integration/web-ux-t12.test.tsx` WUX_DOSE_03 | yes — exact /dose/1, PUT and literal body restricted to tomado true. |
| C48 | `tests/integration/web-ux-t12.test.tsx` WUX_DOSE_04 | yes — no optimistic registration before response; confirmed state and all derived totals asserted. |
| C49 | `tests/integration/web-ux-t20.test.tsx` WUX_DOSE_05 | yes — named/time confirmation precedes request; cancellation preserves state; explicit confirm sends false and updates same dose. |
| C50 | `tests/integration/web-ux-t12.test.tsx` WUX_DOSE_06 | yes — correction retains expected instant and recomputes overdue state at current clock. |
| C51 | `tests/integration/web-ux-t12.test.tsx` WUX_DOSE_07; T20 retry UI cases | yes — previous confirmed boolean/time persist on failure; retry resolves desired state with visible recovery action. |
| C52 | `tests/integration/web-ux-t12.test.tsx` WUX_DOSE_08 | yes — duplicate same-ID mutation rejected, another proceeds, out-of-order responses preserve each item's literal boolean. |
| C53 | `tests/integration/web-ux-t33.test.tsx` WUX_DOSE_09 | yes — close button/Escape dismiss presentation, return focus and perform no server call. |
| C54 | `tests/functional/web-ux-t42.spec.ts` WUX_ACCOUNT_01 | yes — actual stages, current text, required summary and preserved data on return; password absent from summary. |
| C55 | `tests/functional/web-ux-t42.spec.ts` WUX_ACCOUNT_02 | yes — actual field/check gestures send exact normalized DTO including caregiver, once while pending. |
| C56 | `tests/functional/web-ux-t42.spec.ts` WUX_ACCOUNT_03 | yes — invalid CPF/CEP/future birth date show exact error, focus matching field, aria-invalid and retain personal stage. |
| C57 | `tests/functional/web-ux-t42.spec.ts` WUX_ACCOUNT_04 | yes — both visibility gestures assert input type, accessible pressed state and unchanged values. |
| C58 | `tests/functional/web-ux-t40.spec.ts` WUX_ACCOUNT_05 | yes — exact sparse PATCH, blank optional omission, returned original optional values and no redundant write asserted. |
| C59 | `tests/integration/web-ux-t31.test.tsx` WUX_ACCOUNT_06 | yes — exact password endpoint/body, cleared inputs, intact medication draft and no credential persistence in local/session storage. |
| C60 | `tests/integration/web-ux-t31.test.tsx` WUX_ACCOUNT_07 | yes — separate profile success/password failure and no password success; one revalidation, no duplicate profile update on retry. |
| C61 | `tests/functional/web-ux-t40.spec.ts` WUX_ACCOUNT_08 | yes — unsupported photo/recovery buttons/links/file inputs absent; supported profile/save/navigation remain usable. |
| C62 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_SYSTEM_01 | yes — computed fonts across actual routes/headings/native controls equal Kantumruy sans-serif; delayed session readiness prevents checking wrong state. |
| C63 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_SYSTEM_02; T01 palette | yes — distinct semantic tokens plus actual rendered primary, text, surface and control border values; focus/feedback checked separately below. |
| C64 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_SYSTEM_03 | yes — actual logo/pink brand, selected red medication color, forced failed/successful saves retaining separate semantic colors. |
| C65 | `tests/nonfunctional/web-ux-t46.spec.ts` WUX_SYSTEM_04 | yes — equivalent save controls on two screens have asserted default, hover, focus, disabled/loading and feedback styles. |
| C66 | `tests/unit/web-ux-t03.test.tsx` WUX_SYSTEM_05 | yes — visible textual alert and exact accessible description associated with actual labeled field; value remains editable. |
| C67 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_SYSTEM_06 | yes — primary versus secondary computed backgrounds differ and secondary text contrast meets 4.5 across three screens. |
| C68 | `DESIGN.md` documentary walk against globals.css, Button, FormField, Dialog, AppShell, ColorSelector and feature screens | yes — semantic palette, typography, spacing, component roles, movement and future mobile equivalence documented and correspond to reviewed implementation; mobile remains conceptual. |
| C69 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_SYSTEM_08 | yes — forced loading/empty/filter/error/retry/success assert roles, vocabulary, radius and actual feedback surface styles. |
| C70 | `tests/integration/web-ux-t31.test.tsx` WUX_SYSTEM_09 | yes — exact heading order Perfil/Dados pessoais/Segurança and initials, unsupported customization absent. |
| C71 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_ACCESS_01; functional T38/T42 later fields | yes — actual controls' accessible names asserted across routes and personal step; treatment/review field names exercised by role/label browser locators. |
| C72 | `tests/integration/web-ux-t18.test.tsx` WUX_ACCESS_02 | yes — ArrowDown/Up, Enter/Escape produce exact option/selection, expanded state, active descendant and linked listbox behavior. |
| C73 | `tests/unit/web-ux-t19.test.tsx` WUX_ACCESS_03 | yes — actual Tab/arrows/click operate named radio choices with exactly one selected; disabled state preserves selection. |
| C74 | `tests/integration/web-ux-t06.test.tsx` WUX_ACCESS_04 | yes — closed content absent from accessibility queries and Tab sequence; Enter opens, Escape closes and returns focus. |
| C75 | `tests/integration/web-ux-t04.test.tsx` WUX_ACCESS_05; T06 menu | yes — explicit cancel/close and menu Escape restore opener focus without destructive action. |
| C76 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_ACCESS_06 | yes — computed rendered foreground/background pairs and size/weight thresholds, placeholder opacity, hover/loading/error/warning/success ratios asserted. Automated palette evidence only, not WCAG certification. |
| C77 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_ACCESS_07; T19 named radios | yes — measured button/radio-label boxes at least 44px, actual keyboard choice and computed visible focus outline. |
| C78 | `tests/nonfunctional/web-ux-t45.spec.ts` WUX_ACCESS_08; B7 route traversal | no — four required sizes inspect editor/modal and initial route stages, never Tratamento/Revisão or Dados pessoais. Overflow/occlusion confined to those later forms can pass every selected assertion. See F2. |
| C79 | `tests/nonfunctional/web-ux-t46.spec.ts` WUX_ACCESS_09; T46 stage changes | no — effective 200% and reachability assert initial stages only. Later-stage companion uses normal text/default viewport and checks focus/animation, not 200% reflow/reachability. See F2. |
| C80 | `tests/integration/web-ux-t04.test.tsx` WUX_ACCESS_10; T45 narrow menu | yes — Tab/Shift+Tab containment, Escape cancel and unchanged destructive state, plus native browser modal containment. |
| C81 | `tests/integration/web-ux-t05.test.tsx` WUX_STATE_01; T25/T38 concrete read recovery | yes — retry click obtains literal returned data via GET only; concrete screens reject mutation replay. |
| C82 | `tests/integration/web-ux-t05.test.tsx` WUX_STATE_02 | yes — pending region announces loading while retaining exact error and last content; not success-empty. |
| C83 | `tests/integration/web-ux-t34.test.tsx` WUX_STATE_03 | yes — actual root providers retain private draft/summary across child route replacement; no storage persistence and metadata update preserves identity. |
| C84 | `tests/integration/web-ux-t34.test.tsx` WUX_STATE_04; T26 private session cases | yes — logout/identity/confirmed expiration clear draft/summary permanently; private collection cleared/discarded at identity boundary. |
| C85 | `tests/integration/web-ux-t24.test.tsx` WUX_STATE_05 | yes — exact in-memory draft limitation appears at initial stage. |
| C86 | `tests/integration/web-ux-t34.test.tsx` WUX_STATE_06 | yes — controlled older read and old-identity response arrive after current data; aborted signal and exact current values preserved. |
| C87 | `tests/integration/web-ux-t15.test.tsx` WUX_STATE_07 | yes — uncertain phase preserves exact form/body/key with no extra automatic request; manual retry uses identical body/key. |
| C88 | `tests/integration/web-ux-t05.test.tsx` WUX_STATE_08; T12/T15/T25 operation bounds | yes — actual API 429 produces deadline, blocked retry at 1999ms, enabled at 2000ms with no automatic request; controlled manual retry succeeds. |
| C89 | `tests/integration/web-ux-t13.test.tsx` WUX_STATE_09; T31 password composition | yes — 200/401/503 revalidation yields valid/expired/unavailable, exact one GET, correct credential retention/clearing and no password-success claim. |
| C90 | `tests/integration/web-ux-t13.test.tsx` WUX_STATE_10 | yes — restoration hides stale user, announces pending/unavailable, retains token on network/503 and recovers only after manual GET retry. |
| C91 | `tests/integration/web-ux-t15.test.tsx` WUX_STATE_11 | yes — attempted content edit leaves frozen intent/draft unchanged, consult path available, no automatic creation. |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| F1 — C23 browser proof does not distinguish a sparse metadata edit from resending untouched fields | `tests/functional/web-ux-t44.spec.ts:26` edits all seven fields, then asserts those seven. Its no-change case only excludes a second write when nothing changes. T16's sparse exact payload is good integration coverage, but would stay green if the editor/route supplied incorrect original metadata or reset an untouched field during a one-field UI edit. No production failure was reproduced; this is a proof gap at the Matrix's functional layer. | Add a real browser gesture changing exactly one metadata field on a populated selected item; assert exact PUT ID/body containing only that field and preserved untouched values. Keep the existing seven-field and failure assertions. | |
| F2 — C78/C79 omit later form stages from required viewport and effective 200% assertions | `tests/nonfunctional/web-ux-t45.spec.ts:133` exercises editor/modal at four sizes. The broader traversal at line 6 and `tests/nonfunctional/web-ux-t46.spec.ts:44` visit initial routes only (`tests/support/web-ux-visual.ts:5`). The T46 companion at line 93 reaches Tratamento and Dados pessoais with normal text/default viewport and asserts focus/animation/value retention; it never asserts their geometry at 320/390/768/1440 or 200%. Legacy accessibility traversal uses 360/768/1440 and normal text, so does not close the defined 320/390/200% gap. A clipped first-dose datetime field, later personal form or expanded Review action can remain green. No actual clipping is claimed. | Extend nonfunctional browser assertions through Medicamento, Tratamento, expanded Revisão and Conta/Dados pessoais at all four specified sizes; under effective 200% assert computed amplification, overflow and reachable controls for those states, and preserve reduced-motion interaction assertions. | |

## Own examples

Executed only `npx vitest run tests/unit/independent-verifier-owned.test.tsx --reporter=verbose` in this isolated checkout, using the existing Vitest config and synthetic values. Final execution: **2 passed**, exit 0. No API requests or real user data. The owned throwaway was removed after checking its exact resolved path; product and permanent tests were unchanged.

1. **Elapsed recurrence / FORM-08 and FORM-09.** Exact input: `{firstDoseAt:'2028-02-29T23:45:00+05:45', intervalHours:'13', duration:'2', durationUnit:'days'}`. Observed/asserted doses: `['2028-02-29T18:00:00.000Z','2028-03-01T07:00:00.000Z','2028-03-01T20:00:00.000Z','2028-03-02T09:00:00.000Z']`; exclusive end `2028-03-02T18:00:00.000Z`; daily upper bound `2`.
2. **History / DAY-07.** Exact now `2028-03-01T10:00:00Z`, zone `Pacific/Kiritimati`, period `30days`. IDs 801–804 respectively at `2028-02-01T09:59:59Z`, `2028-02-01T10:00:00Z`, `2028-03-01T10:00:00Z`, `2028-03-01T10:00:01Z`, with complete synthetic medication 900, name `Synthetic Verifier`, amount `7 mg`, alternating registered flags. Observed/asserted history IDs `[803,802]`, count `2`: local midnight boundary inclusive and now inclusive, neighboring instants excluded. A preliminary run mistakenly placed the lower-bound fixture on January 31 and expected it included; its failure correctly exposed my leap-year boundary arithmetic error. I corrected the fixture to February 1 UTC (= February 2 local), without changing implementation or permanent tests; the final expected boundary follows 29 days before March 2 local.

## Evidence limits

Proofs refer to committed source HEAD in the isolated checkout; preexisting modified tasks.md and untracked generated proofs.md were orchestration metadata, confirmed by the orchestrator. My sole retained write is this report. Build/lint/typecheck and suite results come from proofs.md, not a claimed rerun. Review uses actual asserted browser behavior with intercepted synthetic API; it does not establish real backend persistence, deploy parity, or real-API E2E. No live assistive-technology session or WCAG certification was performed. Generated captures are observations, not binding user design references. No backend/mobile changes, fixes, commits, push, deploy, production request or additional agent dispatch occurred.
