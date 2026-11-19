# Redesign Rollback

**Status**: Reverted at the user's request
**Date**: 2026-11-15
**User**: "não gostei de como ficou o front end, volte para a versão anterior"

The application, tests, visual references and configuration were restored to `e0421835a34dceb6ad6f985dda5eee1fcd033c25`, the parent of the first implementation commit. Revert commit: `2791ae7`.

The previous implementation and verification documents remain as historical records. They do not describe the currently restored application or authorize restarting the redesign. Preserve the user's rollback decision in any future work.

Validation: the application paths have no Git differences from the baseline; `npm run build -- --webpack` completed successfully and generated the eleven original static pages. No new build configuration was retained. The 44 preexisting staged skill/lock entries and all preexisting staged spec records were preserved. No backend/mobile changes or remote operation occurred.

Recovery reference for the reverted implementation: `codex/web-ux-before-rollback-20261115170723`.
