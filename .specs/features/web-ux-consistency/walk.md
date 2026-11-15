# Independent Browser Walk

**Date**: 2026-11-15, America/Sao_Paulo
**Code**: b71aa43
**Operator**: root, independently of implementation batch workers
**Method**: automated gestures in actual Chrome with a fresh production build on port 3102, controlled synthetic API responses and explicit assertions. This is not a live screen-reader session or real-backend E2E.

## Observed Journeys

| Story | Actual gestures and observed result |
| --- | --- |
| Navigate | WUX_NAV_03 opened public purpose and followed account/login destinations. Passed. Existing route/login/legacy-URL cases remain in the final proof group. |
| Today and history | WUX_DAY_03 displayed next future and overdue doses; WUX_DAY_07 changed period, medication and state filters over 102 paginated rows. Passed. |
| Manage medication | WUX_MED_01 combined name/classification/expiry and cleared filters; WUX_MED_06 edited metadata, submitted exact allowlist and recovered from failure. Passed. |
| Create treatment | WUX_FORM_14 filled stages/review and submitted one atomic payload with idempotency key. Passed. Schedule boundaries and DST are additionally proved by the domain tests. |
| Register dose | Seven fluxo cases clicked registration and checked success, 403/429/500, network failure, 401 logout and alarm refresh503 with GET-only recovery. All passed. |
| Account/profile | WUX_ACCOUNT_02 traversed account stages and submitted the exact DTO once; WUX_ACCOUNT_05 saved permitted profile changes while omitting blank optional fields. Passed. |
| Visual system | Root inspected native-size Today320, Medications1440, Profile768, Edit320 at 200% and Menu320 at 200%. Brand, hierarchy and readable controls were observed. The earlier awkward count copy was corrected and captured again. |
| Accessible flows | Root initially ran T45/T46: 14 of 15 passed. The font audit hit a removed node during restoration; no font mismatch was reported. The selective correction batch then passed 16/16 (all 15 previous cases plus one delayed-restoration regression), retaining menu keyboard/Escape/focus, contrast, targets, four viewports, effective 200% text and reduced motion. |
| Recover interruptions | The uncertain-creation journey navigated away/back and retried identical body/key. Dose/alarm failures retained confirmed state and recovered by reading. Passed. |

The first selected functional run passed 9/9 in 23.6s; the dose/alarm run passed 7/7 in 19.2s. All changes used gestures against rendered UI, not direct requests carrying completed application payloads.

## Documentary Check C68

Root compared the 19 documented color values in DESIGN.md with globals.css and inspected the documented component/state vocabulary against source contracts and the rendered images above. The mobile table is conceptual future equivalence; no native implementation is claimed.

## Reproduction and Limits

Run the functional project with playwright.web-ux.config.ts and the WUX_NAV_03, WUX_DAY_03, WUX_MED_01, WUX_FORM_14, WUX_DAY_07, WUX_ACCOUNT_05, WUX_ACCOUNT_02, WUX_MED_06 and uncertain-creation filters. Dose recovery is selected by `marcar dose|NET-18` in fluxo.spec.ts. Run T45/T46 for viewport/keyboard/motion states. Fixtures, clock, session and interception setup reside in the test sources; captures are in this feature's captures directory.

Real E2E remains unexecuted because the required isolated API is absent. A live assistive-reader session was not performed. Automated naming, focus and contrast checks do not constitute WCAG certification.

## Font-audit stabilization follow-up

On 2026-11-15, the selective correction batch reproduced the harness race against product HEAD b71aa43: the new delayed-session regression observed the public visual helper returning ready while usuario/me was still held. The regression failed before the fix. The helper now waits for the restoration feedback to leave, for Profile Nome to contain the synthetic profile, for catalog loading to finish on Home/wizard, and for the route data already required by the fixture. Font readiness is awaited after these screen conditions.

WUX_SYSTEM_01 now reads every body/h1/h2/p/button/input/select/textarea font family in one synchronous DOM snapshot per route. It preserves all ten routes, count greater than three, and the literal Kantumruy, sans-serif assertion for every selected node. It does not retain nth locators across a later React commit. The new regression also exercises Profile after delayed restoration.

The correction batch ran T45/T46 with the approved wrapper, fresh production build, actual Chrome, port 3102, one worker and zero retries: 16/16 passed in 56.3s (13 T45 + 3 T46). TypeScript and lint --max-warnings=0 passed. This follow-up validates the harness fix; it does not recast the implementation worker as the independent journey operator or claim live assistive-reader/real-API E2E evidence.

The warning/error capture at native 1280×1474 was also inspected against its HEAD image. Its initial dirty difference was confined to the Save button border mid-transition. An additional exact disabled-border-color assertion now precedes capture; the targeted WUX_ACCESS_06 gate passed 1/1 in 17.5s and regenerated that one reviewed state without resizing or masking. No product CSS or behavior changed in this correction.
