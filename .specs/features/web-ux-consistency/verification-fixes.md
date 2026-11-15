# Verification fixes

## F1 / C23

Added a browser case changing only the name on selected populated item 17. Exact sparse PUT, visible confirmed result, unchanged metadata and read-only treatment are asserted. Existing seven-field/failure/no-op cases remain. C23 selects both WUX_MED_06 cases. The original observation is nonempty, so resetting any untouched field is detectable.

Gate 2026-11-15: full T44 functional file, fresh build via playwright.web-ux.config.ts port 3102, workers=1/retries=0: 6 passed, 0 failed. No product defect reproduced. Message check passed. F1 implementation complete; report closure remains root-owned.

The strengthened fixture passed all six T44 cases again within the final fresh-build 27-case gate (6 T44 + 18 T45/T46 + 3 legacy snapshot flows), 27 passed and 0 failed. No criterion or assertion was weakened.
