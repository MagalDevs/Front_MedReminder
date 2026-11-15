# Verification fixes

## F1 / C23

Added a browser case changing only the name on selected populated item 17. Exact sparse PUT, visible confirmed result, unchanged metadata and read-only treatment are asserted. Existing seven-field/failure/no-op cases remain. C23 selects both WUX_MED_06 cases. The original observation is nonempty, so resetting any untouched field is detectable.

Gate 2026-11-15: full T44 functional file, fresh build via playwright.web-ux.config.ts port 3102, workers=1/retries=0: 6 passed, 0 failed. No product defect reproduced. Message check passed. F1 implementation complete; report closure remains root-owned.

The strengthened fixture passed all six T44 cases again within the final fresh-build 27-case gate (6 T44 + 18 T45/T46 + 3 legacy snapshot flows), 27 passed and 0 failed. No criterion or assertion was weakened.

## F2 / C78 and C79

Implementation complete on 2026-11-15. Two added browser cases retain all earlier assertions:

- `WUX_ACCESS_08 later treatment expanded review and personal forms reflow and remain keyboard reachable at all four sizes`
- `WUX_ACCESS_09 later forms preserve effective 200 percent geometry keyboard access and reduced motion at all four sizes`

The shared walk fills the real Medicamento and Conta forms, clicks Continue, fills Tratamento and Dados pessoais, expands Revisão, checks the literal complete four-instant schedule, and exercises return/edit controls with preserved input. Every later state is checked at 320x568, 390x844, 768x1024 and 1440x900. The amplified walk asserts html/body, actual native date segments and controls at 32px, reduced-motion zero durations and full opacity. Geometry checks include document/body overflow, full control viewport visibility, hit testing, actual Tab traversal and unclipped content. C78/C79 already select both cases through their unchanged prefixes. The 1000-dose schedule limit remains covered by the existing schedule tests; the expanded browser review uses four literal instants to inspect content and scrolling without replacing that boundary proof.

The stronger walk reproduced two product defects that the original Verifier did not claim to reproduce:

1. The native first-dose datetime clipped at 320px/200%. Its scoped native segment wrapper now wraps and grows vertically, preserving the real calendar icon, label, input type, full value and separator. No font was reduced. CDP reads Chrome's actual closed native shadow tree and asserts all day/month/year/hour/minute boxes inside the editor, the icon inside the input, non-overlap and 32px segment text. It does not guess how many rows are needed.
2. Review's grid minimum width let long values, including the full IANA zone, widen the 320px page to 333px at 200%. Grid children now permit shrinking and values wrap anywhere. The full zone and every instant remain present; no overflow-hiding or truncation was added.

### Gate and discrimination

Final command:

`npx playwright test tests/functional/web-ux-t44.spec.ts tests/functional/fluxo.spec.ts tests/nonfunctional/web-ux-t45.spec.ts tests/nonfunctional/web-ux-t46.spec.ts --grep 'WUX_|B7 observe|T45 |T46 |T44 |FN-06 TEST-03 novo-medicamento' --config playwright.web-ux.config.ts --project functional --project nonfunctional --workers 1 --retries 0 --reporter list`

Result: fresh production build, port 3102, 27 passed / 0 failed: full T44 6/6, full T45/T46 18/18 (14+4), three legacy creation snapshot flows 3/3. All nine existing stage snapshots passed unchanged. No golden, tolerance, mask, test deletion or skip was used. Port 3000 remained untouched. Final TypeScript and eslint with max-warnings=0 passed.

A controlled throwaway browser case removed only the three authored first-dose CSS rules from CSSOM, leaving 32px text and the actual original native control. The retained CDP geometry proof correctly failed: a native segment's right edge was 255.4375 while its editor ended at 239. The case was removed afterward; product source was never reverted. Before-fix evidence: `C:/Users/danie/.codex/visualizations/2026/11/13/01a1d4f4-0f74-7173-b06b-ca8e3694236d/web-ux-proof-evidence/fixes-f2-original-native-320-text200.png`.

### Native captures inspected

24 new full-page browser captures were inspected without resizing: each of `treatment`, `review-expanded` and `personal`, at widths 320, 390, 768 and 1440, both normal and effective 200%/reduced motion. Paths are `captures/f2-<state>-<width>.png` and `captures/f2-text200-reduced-<state>-<width>.png`. The native date/time and icon are complete; long review values wrap; review edit/save and personal back/create controls remain reachable. The 320px expanded list scrolls to the fourth instant, asserted by the real browser walk. Existing normal stage snapshots remained stable after the separator refinement.

The approved DESIGN and incumbent visual identity govern this narrow correction. Frontend-design, taste and Impeccable craft guidance was consulted. Impeccable's context launcher could not run because engine 0.1.23 is absent and its cache directory was unavailable; no engine was installed or drift repaired. Verification uses local Chrome on Windows and controlled synthetic API fixtures; this is not a physical-device, Safari or assistive-reader certification.

F1 is committed as `9635753`. F2 is complete in this atomic source/test/capture/metadata commit. Original independent verification rows, Verdict and Closed cells remain untouched for root's proof-fix round and closure.
